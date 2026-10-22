#!/usr/bin/env node
// ========================================================
// Живая калибровка Story Engine:
//   node scripts/generate-story.mjs
//   node scripts/generate-story.mjs --model gemini-3.8-flash --seed demo-1
// Генерирует сказку, обложку и 4 сцены, сохраняет всё в out/story-samples/<id>.
// ========================================================
import fs from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildStoryPrompt,
  normalizeStory,
  buildRepairPrompt,
  buildScenePrompt,
  buildCoverPrompt,
  fallbackQuestions,
  scoreStory,
  chooseStoryDna,
  createSeededRandom,
  StoryValidationError,
} from '../packages/story-engine/src/index.mjs';

const ROOT = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const OUT_ROOT = path.join(ROOT, 'out', 'story-samples');

function arg(name, fallback = null) {
  const index = process.argv.indexOf(`--${name}`);
  if (index === -1) return fallback;
  return process.argv[index + 1] || fallback;
}

const hasFlag = (name) => process.argv.includes(`--${name}`);

function loadEnvSync() {
  const envPath = path.join(ROOT, '.env');
  try {
    const text = readFileSync(envPath, 'utf8');
    for (const line of text.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
      const [key, ...rest] = trimmed.split('=');
      process.env[key.trim()] = rest.join('=').trim().replace(/^['"]|['"]$/g, '');
    }
  } catch {}
}
loadEnvSync();

const TEXT_MODEL = arg('model', process.env.WELLFLOW_TEXT_MODEL || 'gemini-3.8-flash');
const FALLBACK_TEXT_MODEL = arg('fallback-model', 'gemini-3.8-flash');
const IMAGE_MODEL = arg('image-model', process.env.WELLFLOW_IMAGE_MODEL || 'nano-banana-2');
const FALLBACK_IMAGE_MODEL = arg('fallback-image-model', 'nano-banana-pro');
const SEED = arg('seed', 'calibration-1');
const SKIP_IMAGES = hasFlag('no-images');

const SAMPLE_CHILD = {
  childName: 'Миша',
  age: 4,
  gender: 'boy',
  theme: 'Дружба',
  interests: ['Динозавры', 'Космос'],
  personality: 'Добрый',
  customWishes: null,
  appearance: {
    hairColor: 'русые',
    hairType: 'кудрявые',
    clothingItem: 'уютный свитер',
    clothingColor: 'изумрудный',
    toy: 'плюшевый динозаврик',
    eyeColor: 'карие',
    skinTone: 'персиковая',
  },
  recentOutlines: [],
};

function ts() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}-${pad(d.getMinutes())}-${pad(d.getSeconds())}`;
}

function cleanJson(content) {
  const text = String(content || '').replace(/```json/gi, '').replace(/```/g, '').trim();
  const first = text.indexOf('{');
  const last = text.lastIndexOf('}');
  if (first === -1 || last === -1) throw new Error('JSON object not found in model response');
  return JSON.parse(text.slice(first, last + 1));
}

async function postJson(url, body, apiKey, timeoutMs, label) {
  const started = Date.now();
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  });
  const elapsed = Date.now() - started;
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`${label}: HTTP ${res.status} ${text.slice(0, 400)}`);
  }
  return { json: await res.json(), elapsed };
}

async function callStoryModel(params, model, dna) {
  const apiUrl = (process.env.WELLFLOW_API_URL || 'https://api.wellflow.dev/v1').replace(/\/$/, '');
  const key = process.env.WELLFLOW_TEXT_KEY;
  if (!key) throw new Error('WELLFLOW_TEXT_KEY не найден в .env');
  const prompt = buildStoryPrompt(params, { dna });
  const { json, elapsed } = await postJson(
    `${apiUrl}/chat/completions`,
    {
      model,
      messages: [
        { role: 'system', content: prompt.system },
        { role: 'user', content: prompt.user },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 4500,
    },
    key,
    120_000,
    `story:${model}`
  );
  const content = json.choices?.[0]?.message?.content;
  if (!content) throw new Error(`story:${model}: empty content`);
  return { raw: cleanJson(content), content, elapsed, usage: json.usage, prompt };
}

async function repairStory(params, model, dna, raw, issues, originalContent) {
  const apiUrl = (process.env.WELLFLOW_API_URL || 'https://api.wellflow.dev/v1').replace(/\/$/, '');
  const key = process.env.WELLFLOW_TEXT_KEY;
  const prompt = buildStoryPrompt(params, { dna });
  const repair = buildRepairPrompt(raw, issues);
  const { json, elapsed } = await postJson(
    `${apiUrl}/chat/completions`,
    {
      model,
      messages: [
        { role: 'system', content: prompt.system },
        { role: 'user', content: prompt.user },
        { role: 'assistant', content: originalContent },
        { role: 'user', content: repair },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 4500,
    },
    key,
    120_000,
    `repair:${model}`
  );
  const content = json.choices?.[0]?.message?.content;
  if (!content) throw new Error('repair: empty content');
  return { raw: cleanJson(content), content, elapsed, usage: json.usage };
}

async function normalizeWithFallback(raw, params, dna) {
  try {
    return { story: normalizeStory(raw, params, dna), repaired: false };
  } catch (error) {
    if (!(error instanceof StoryValidationError)) throw error;
    if (error.issues.some((issue) => /вопрос/i.test(issue))) {
      const patched = { ...raw, questions: fallbackQuestions(params.childName) };
      const story = normalizeStory(patched, params, dna);
      story.warnings.push('вопросы заменены fallback-вопросами');
      return { story, repaired: false };
    }
    throw error;
  }
}

async function downloadImage(url, filePath) {
  const res = await fetch(url, { signal: AbortSignal.timeout(120_000) });
  if (!res.ok) throw new Error(`image download: HTTP ${res.status}`);
  const contentType = res.headers.get('content-type') || 'image/jpeg';
  const bytes = Buffer.from(await res.arrayBuffer());
  const ext = contentType.includes('png') ? '.png' : contentType.includes('webp') ? '.webp' : '.jpg';
  const finalPath = filePath.replace(/\.[a-z]+$/i, ext);
  await fs.writeFile(finalPath, bytes);
  return { path: finalPath, bytes: bytes.length, contentType };
}

async function generateImage(prompt, fileBase) {
  const apiUrl = (process.env.WELLFLOW_API_URL || 'https://api.wellflow.dev/v1').replace(/\/$/, '');
  const key = process.env.WELLFLOW_IMAGE_KEY;
  if (!key) throw new Error('WELLFLOW_IMAGE_KEY не найден в .env');
  const models = [IMAGE_MODEL, FALLBACK_IMAGE_MODEL].filter(Boolean);
  let lastError = null;
  for (const model of models) {
    const started = Date.now();
    try {
      const { json, elapsed } = await postJson(
        `${apiUrl}/images/generations`,
        { model, prompt, n: 1, size: '1024x1024' },
        key,
        120_000,
        `image:${model}`
      );
      const url = json.imageUrl || json.data?.[0]?.url;
      if (!url) throw new Error(`image:${model}: no url`);
      const file = await downloadImage(url, `${fileBase}.jpg`);
      return { ...file, model, elapsed, totalElapsed: Date.now() - started, url };
    } catch (error) {
      lastError = error;
      console.warn(`  ⚠️ ${model} не сработал: ${error.message}`);
    }
  }
  throw lastError || new Error('image generation failed');
}

async function main() {
  if (!process.env.WELLFLOW_TEXT_KEY) throw new Error('В .env нет WELLFLOW_TEXT_KEY');
  if (!SKIP_IMAGES && !process.env.WELLFLOW_IMAGE_KEY) throw new Error('В .env нет WELLFLOW_IMAGE_KEY');

  const id = `${ts()}_${SEED}`;
  const outDir = path.join(OUT_ROOT, id);
  await fs.mkdir(outDir, { recursive: true });

  const dna = chooseStoryDna(SAMPLE_CHILD, createSeededRandom(SEED));
  console.log(`\n📖 Story Engine ${id}`);
  console.log(`   модель текста: ${TEXT_MODEL}, fallback: ${FALLBACK_TEXT_MODEL}`);
  console.log(`   модель картинок: ${IMAGE_MODEL}, fallback: ${FALLBACK_IMAGE_MODEL}`);
  console.log(`   ДНК: ${dna.world_scale} / ${dna.narrative_engine}`);
  console.log(`   ребёнок: ${SAMPLE_CHILD.childName}, ${SAMPLE_CHILD.age} г., ${SAMPLE_CHILD.theme}\n`);

  console.log('1/3 ✍️  Генерируем текст...');
  let textResult;
  let usedModel = TEXT_MODEL;
  try {
    textResult = await callStoryModel(SAMPLE_CHILD, TEXT_MODEL, dna);
  } catch (error) {
    console.warn(`   ⚠️ ${TEXT_MODEL} не ответил: ${error.message}`);
    usedModel = FALLBACK_TEXT_MODEL;
    textResult = await callStoryModel(SAMPLE_CHILD, FALLBACK_TEXT_MODEL, dna);
  }
  console.log(`   ✅ ${usedModel}: ${(textResult.elapsed / 1000).toFixed(1)} с, usage=${JSON.stringify(textResult.usage)}`);

  console.log('2/3 🧩 Валидируем и ремонтируем...');
  let story;
  try {
    story = (await normalizeWithFallback(textResult.raw, SAMPLE_CHILD, dna)).story;
  } catch (error) {
    if (!(error instanceof StoryValidationError)) throw error;
    console.warn(`   ⚠️ Валидация не прошла: ${error.issues.join('; ')}`);
    console.log('   🔁 Одна repair-попытка...');
    const repaired = await repairStory(SAMPLE_CHILD, usedModel, dna, textResult.raw, error.issues, textResult.content);
    story = (await normalizeWithFallback(repaired.raw, SAMPLE_CHILD, dna)).story;
  }
  const score = scoreStory(story);
  console.log(`   ✅ «${story.title}» — ${story.metrics.total_words} слов (цель ${story.metrics.target.join('–')}), score=${score.score}`);
  if (story.warnings.length) console.log(`   ⚠️ warnings: ${story.warnings.join('; ')}`);

  const prompts = {
    cover: buildCoverPrompt(story),
    scenes: story.scenes.map((scene) => ({ index: scene.index, prompt: buildScenePrompt(story, scene) })),
  };

  let images = [];
  let imageFailures = [];
  if (!SKIP_IMAGES) {
    console.log('3/3 🎨 Рисуем обложку и 4 сцены параллельно...');
    const jobs = [
      { label: `cover:${story.title}`, prompt: prompts.cover, file: path.join(outDir, 'cover') },
      ...story.scenes.map((scene) => ({
        label: `scene_${scene.index}`,
        prompt: prompts.scenes.find((p) => p.index === scene.index).prompt,
        file: path.join(outDir, `scene_${scene.index}`),
      })),
    ];
    const settled = await Promise.allSettled(
      jobs.map(async (job) => {
        const result = await generateImage(job.prompt, job.file);
        console.log(`   ✅ ${job.label}: ${result.model}, ${(result.totalElapsed / 1000).toFixed(1)} с, ${(result.bytes / 1024).toFixed(0)} КБ`);
        return { ...job, ...result };
      })
    );
    images = settled.filter((item) => item.status === 'fulfilled').map((item) => item.value);
    const failures = settled
      .map((item, index) => ({ item, job: jobs[index] }))
      .filter(({ item }) => item.status === 'rejected')
      .map(({ item, job }) => ({ label: job.label, error: item.reason?.message || String(item.reason) }));
    for (const failure of failures) console.warn(`   ⚠️ ${failure.label}: ${failure.error}`);
    if (failures.length) console.warn(`   ⚠️ не удалось сгенерировать ${failures.length} из 5 изображений`);
    imageFailures = failures;
  }

  const payload = {
    id,
    createdAt: new Date().toISOString(),
    model: usedModel,
    imageModel: IMAGE_MODEL,
    seed: SEED,
    child: SAMPLE_CHILD,
    dna,
    story,
    score,
    prompts,
    images: images.map((image) => ({
      label: image.label,
      model: image.model,
      file: path.relative(ROOT, image.path),
      bytes: image.bytes,
      elapsedMs: image.totalElapsed,
    })),
    imageFailures,
    timings: { textMs: textResult.elapsed },
  };
  await fs.writeFile(path.join(outDir, 'story.json'), JSON.stringify(payload, null, 2), 'utf8');
  await fs.writeFile(path.join(outDir, 'story.md'), renderMarkdown(payload), 'utf8');

  console.log(`\n💾 Готово: ${path.relative(ROOT, outDir)}`);
  console.log(`   story.json / story.md / cover + 4 scenes`);
  console.log(`\nЗаголовок: «${story.title}»`);
  console.log(`Аутлайн: ${story.story_outline}\n`);
}

function renderMarkdown(payload) {
  const { story } = payload;
  const lines = [
    `# ${story.title}`,
    '',
    `- Возраст: ${story.age}`,
    `- Тема: ${story.theme}`,
    `- Слов: ${story.metrics.total_words} (цель ${story.metrics.target.join('–')})`,
    `- Score: ${payload.score.score}`,
    `- Модель: ${payload.model}`,
    `- ДНК: ${story.story_dna.world_scale} / ${story.story_dna.narrative_engine}`,
    '',
    `> ${story.story_outline}`,
    '',
    '## Персонажи',
    '',
    ...story.characters.map((c) => `- **${c.name}** (${c.role}): ${c.visual_description}`),
    '',
    ...story.scenes.flatMap((scene) => [
      `## Сцена ${scene.index}`,
      '',
      scene.text,
      '',
      `_visual:_ ${scene.visual}`,
      '',
      `_characters:_ ${scene.character_ids.join(', ')}`,
      '',
    ]),
    '## Вопросы',
    '',
    ...story.questions.map((q) => `- **после ${q.after_scene}** (${q.skill_tag}): ${q.question}${q.parent_hint ? `\n  - подсказка: ${q.parent_hint}` : ''}`),
    '',
    payload.score.issues.length ? `## Warnings\n\n${payload.score.issues.map((w) => `- ${w}`).join('\n')}\n` : '',
  ];
  return lines.join('\n');
}

main().catch((error) => {
  console.error('\n❌ Ошибка:', error.message);
  if (error.issues) console.error('   issues:', error.issues);
  process.exitCode = 1;
});
