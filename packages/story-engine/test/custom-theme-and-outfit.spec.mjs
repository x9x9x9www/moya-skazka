import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chooseStoryDna, buildStoryPrompt, appearanceHints, translateClothingItem } from '../src/index.mjs';

test('Кастомная тема «Новогодние праздники» устанавливает зимний сказочный мир и отражается в ДНК', () => {
  const dna = chooseStoryDna({
    childName: 'Артём',
    age: 5,
    theme: 'Новогодние праздники',
    interests: ['волшебство', 'природа'],
  });

  assert.match(dna.world_scale, /Winter Holiday Wonderland/i);
  assert.match(dna.opening_hook, /морозным окном|снежинки|ёлке/i);
});

test('Кастомный наряд «новогодний свитер с оленем» переводится в английские токены без утечки кириллицы', () => {
  const enClothing = translateClothingItem('новогодний свитер с оленем');
  assert.match(enClothing, /festive holiday knitted winter sweater/i);
  assert.doesNotMatch(enClothing, /[а-яА-ЯёЁ]/, 'В английском описании одежды не должно быть кириллицы');

  const hints = appearanceHints({
    clothingItem: 'красный пуховик и зимняя шапка с помпоном',
    clothingColor: 'красный',
  });
  assert.match(hints.clothes, /puffer jacket|winter/i);
  assert.doesNotMatch(hints.clothes, /[а-яА-ЯёЁ]/, 'Промпт для Stable Diffusion / Flux не должен содержать русские буквы в одежде');
});

test('buildStoryPrompt поднимает кастомную тему на уровень главного стержня сюжета', () => {
  const prompt = buildStoryPrompt({
    childName: 'София',
    age: 4,
    gender: 'girl',
    theme: 'Поход в цирк',
    interests: ['животные'],
  });

  assert.match(prompt.user, /Главная тема сказки: «Поход в цирк»/);
  assert.match(prompt.user, /КРИТИЧЕСКИЙ ЗАКОН/);
});
