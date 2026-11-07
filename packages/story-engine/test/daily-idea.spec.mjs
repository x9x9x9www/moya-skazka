import test from 'node:test';
import assert from 'node:assert/strict';
import { generateDailyIdea } from '../src/index.mjs';

test('generateDailyIdea детерминирована для одной даты и одного ребенка', () => {
  const child = {
    id: 'c1',
    name: 'Лев',
    age: 4,
    gender: 'boy',
    interests: ['космос', 'машинки'],
  };
  const dateStr = '2026-11-07';

  const idea1 = generateDailyIdea({ child, dateStr, seed: 0 });
  const idea2 = generateDailyIdea({ child, dateStr, seed: 0 });

  assert.equal(idea1.id, idea2.id);
  assert.equal(idea1.title, idea2.title);
  assert.equal(idea1.blurb, idea2.blurb);
  assert.equal(idea1.theme, idea2.theme);
  assert.equal(idea1.local_date, dateStr);
  assert.equal(idea1.status, 'ACTIVE');
  assert.ok(idea1.title.includes('Лев') || idea1.title.includes('Льва'));
});

test('generateDailyIdea генерирует альтернативу при изменении seed (кнопка Другая идея)', () => {
  const child = {
    id: 'c2',
    name: 'Аэлита',
    age: 5,
    gender: 'girl',
    interests: ['рисование'],
  };
  const dateStr = '2026-11-07';

  const idea1 = generateDailyIdea({ child, dateStr, seed: 0 });
  const idea2 = generateDailyIdea({
    child,
    dateStr,
    seed: 1,
    excludeTitles: [idea1.title],
  });

  assert.notEqual(idea1.title, idea2.title);
  assert.equal(idea2.status, 'REFRESHED');
});

test('generateDailyIdea адаптирует тематику под возраст (малыши vs школьники)', () => {
  const toddler = { id: 't1', name: 'Миша', age: 2, gender: 'boy' };
  const schoolchild = { id: 's1', name: 'Миша', age: 7, gender: 'boy' };
  const dateStr = '2026-11-07';

  const ideaToddler = generateDailyIdea({ child: toddler, dateStr, seed: 0 });
  const ideaSchool = generateDailyIdea({ child: schoolchild, dateStr, seed: 0 });

  assert.notEqual(ideaToddler.theme, ideaSchool.theme);
  assert.equal(ideaToddler.suggested_params.age, 2);
  assert.equal(ideaSchool.suggested_params.age, 7);
});

test('generateDailyIdea исключает повторение сюжетов последних 3-5 прочитанных книг', () => {
  const child = {
    id: 'c3',
    name: 'Марк',
    age: 4,
    gender: 'boy',
    interests: ['динозавры'],
  };
  const dateStr = '2026-11-07';
  const recentBooks = [
    { title: 'Марк и добрый динозаврик в долине папоротников', theme: 'Приключение' },
  ];

  const idea = generateDailyIdea({ child, recentBooks, dateStr, seed: 0 });
  assert.notEqual(
    idea.title,
    'Марк и добрый динозаврик в долине папоротников',
    'Не должен предлагать в точности ту же сказку, что уже прочитана'
  );
});

test('generateDailyIdea корректно склоняет женские имена в аннотации', () => {
  const child = {
    id: 'c4',
    name: 'Даша',
    age: 3,
    gender: 'girl',
  };
  const idea = generateDailyIdea({ child, dateStr: '2026-11-07', seed: 0 });
  assert.ok(
    !idea.blurb.includes('Даша помог'),
    'Для девочки глаголы и местоимения должны быть согласованы'
  );
});
