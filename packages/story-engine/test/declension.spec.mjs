import test from 'node:test';
import assert from 'node:assert/strict';
import {
  canDeclineRussianName,
  declineRussianName,
  fixGenderAgreements,
  formatSafeForWhom,
  removeAgeFromText,
} from '../src/declension.mjs';

test('Склонение женских имён на -а (Аэлита)', () => {
  const d = declineRussianName('Аэлита', 'girl');
  assert.equal(d.nom, 'Аэлита');
  assert.equal(d.gen, 'Аэлиты');
  assert.equal(d.dat, 'Аэлите');
  assert.equal(d.acc, 'Аэлиту');
  assert.equal(d.ins, 'Аэлитой');
  assert.equal(d.prep, 'об Аэлите');
});

test('Склонение имён на -а с шипящей основой (Даша, Миша)', () => {
  const d = declineRussianName('Даша', 'girl');
  assert.equal(d.gen, 'Даши');
  assert.equal(d.dat, 'Даше');
  assert.equal(d.prep, 'о Даше');

  const m = declineRussianName('Миша', 'boy');
  assert.equal(m.gen, 'Миши');
  assert.equal(m.dat, 'Мише');
  assert.equal(m.ins, 'Мишей');
  assert.equal(m.prep, 'о Мише');
});

test('Склонение мужских имён на согласный (Марк, Лев, Иван)', () => {
  const d = declineRussianName('Марк', 'boy');
  assert.equal(d.nom, 'Марк');
  assert.equal(d.gen, 'Марка');
  assert.equal(d.dat, 'Марку');
  assert.equal(d.ins, 'Марком');
  assert.equal(d.prep, 'о Марке');

  const ivan = declineRussianName('Иван', 'boy');
  assert.equal(ivan.prep, 'об Иване');

  const oleg = declineRussianName('Олег', 'boy');
  assert.equal(oleg.prep, 'об Олеге');
});

test('Склонение имён на -я и -ия (Настя, Мария)', () => {
  const n = declineRussianName('Настя', 'girl');
  assert.equal(n.prep, 'о Насте');

  const m = declineRussianName('Мария', 'girl');
  assert.equal(m.prep, 'о Марии');
});

test('Explicit gender overrides name-ending heuristics', () => {
  assert.equal(declineRussianName('Саша', 'girl').gen, 'Саши');
  assert.equal(formatSafeForWhom('Любовь', 'boy'), 'герой — Любовь');
  assert.equal(declineRussianName('Любовь', 'boy').gen, 'Любовь');
  assert.equal(declineRussianName('Лев', 'boy').gen, 'Льва');
  assert.equal(formatSafeForWhom('Саша', 'girl'), 'для Саши');
  assert.equal(formatSafeForWhom('Никита', 'boy'), 'для Никиты');
});

test('Feminine consonant, foreign, and compound names use safe fallback', () => {
  for (const name of ['Любовь', 'Николь', 'Кармен', 'Элис', 'Anne', 'Анна-Мария']) {
    assert.equal(canDeclineRussianName(name, 'girl'), false, `${name} is not safely declined`);
    assert.deepEqual(declineRussianName(name, 'girl'), {
      nom: name,
      gen: name,
      dat: name,
      acc: name,
      ins: name,
      prep: `${['Элис', 'Анна-Мария'].includes(name) ? 'об' : 'о'} ${name}`,
    });
  }
  assert.equal(formatSafeForWhom('Любовь', 'girl'), 'героиня — Любовь');
  assert.equal(formatSafeForWhom('Анна-Мария', 'girl'), 'героиня — Анна-Мария');
});

test('Очистка текста от возраста в скобках', () => {
  assert.equal(removeAgeFromText('Аэлита (4 года) пошла в лес'), 'Аэлита пошла в лес');
  assert.equal(removeAgeFromText('Малыш (5 лет) улыбнулся'), 'Малыш улыбнулся');
  assert.equal(removeAgeFromText('Герой (4) открыл книгу'), 'Герой открыл книгу');
});

test('Исправление родовых глаголов и падежей имени для девочки', () => {
  const raw = 'Однажды Аэлита (4 года) почувствовал тепло. Сердце Аэлита забилось чаще. Аэлита очутился на полянке и улыбнулся.';
  const fixed = fixGenderAgreements(raw, 'Аэлита', 'girl');

  assert.ok(!fixed.includes('(4 года)'), 'Возраст в скобках удален');
  assert.ok(fixed.includes('Аэлита почувствовала'), 'Глагол согласован в женском роде');
  assert.ok(fixed.includes('Сердце Аэлиты'), 'Имя корректно просклонено в родительном падеже');
  assert.ok(fixed.includes('очутилась'), 'Возвратный глагол согласован в женском роде');
  assert.ok(fixed.includes('улыбнулась'), 'Глагол согласован в женском роде');
});

test('Поддержка гибкого порядка аргументов в fixGenderAgreements', () => {
  const raw = 'Аэлита увидел свет';
  const fixed1 = fixGenderAgreements(raw, 'Аэлита', 'girl');
  const fixed2 = fixGenderAgreements(raw, 'girl', 'Аэлита');
  assert.equal(fixed1, 'Аэлита увидела свет');
  assert.equal(fixed2, 'Аэлита увидела свет');
});

test('Explicit gender wins for agreement and indeclinable feminine names stay unchanged', () => {
  assert.equal(fixGenderAgreements('Саша пошёл гулять.', 'Саша', 'girl'), 'Саша пошла гулять.');
  assert.equal(fixGenderAgreements('Любовь увидел лес. Сердце Любовь забилось.', 'Любовь', 'girl'), 'Любовь увидела лес. Сердце Любовь забилось.');
});

test('Gender correction does not alter verbs belonging to another character or sentence', () => {
  const raw = 'Аэлита увидел друга. Друг улыбнулся. Потом он побежал домой.';
  assert.equal(fixGenderAgreements(raw, 'Аэлита', 'girl'), 'Аэлита увидела друга. Друг улыбнулся. Потом он побежал домой.');
});

test('Special characters in child names are escaped when matching agreements', () => {
  assert.equal(
    fixGenderAgreements('A+lice увидел свет.', 'A+lice', 'girl'),
    'A+lice увидела свет.'
  );
  assert.equal(
    fixGenderAgreements('A.lice увидел свет.', 'A.lice', 'girl'),
    'A.lice увидела свет.'
  );
});

test('Coordinated predicates for the named child are corrected narrowly', () => {
  assert.equal(
    fixGenderAgreements('Аэлита очутилась на полянке и улыбнулся.', 'Аэлита', 'girl'),
    'Аэлита очутилась на полянке и улыбнулась.'
  );
  assert.equal(
    fixGenderAgreements('Аэлита увидел друга, а друг улыбнулся.', 'Аэлита', 'girl'),
    'Аэлита увидела друга, а друг улыбнулся.'
  );
});
