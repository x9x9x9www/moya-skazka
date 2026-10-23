import { describe, it, expect } from 'vitest';
import { resolveChildAvatar, ALL_AVATAR_KEYS } from '../../web/src/utils/avatarResolver';

describe('resolveChildAvatar (12 3D Pixar avatars resolver)', () => {
  it('возвращает 12 уникальных ключей аватаров', () => {
    expect(ALL_AVATAR_KEYS).toHaveLength(12);
    const set = new Set(ALL_AVATAR_KEYS);
    expect(set.size).toBe(12);
  });

  it('возвращает дефолтный аватар boy_brown.webp при пустых параметрах', () => {
    const avatar = resolveChildAvatar(null);
    expect(avatar).toContain('boy_brown.webp');
  });

  it('приоритет 1: корректно распознает очки для мальчика и девочки', () => {
    const boyGlasses = resolveChildAvatar({ gender: 'boy', distinctiveFeatures: 'носит очки' });
    expect(boyGlasses).toContain('boy_glasses.webp');

    const girlGlasses = resolveChildAvatar({ gender: 'girl', distinctiveFeatures: 'очки в золотой оправе' });
    expect(girlGlasses).toContain('girl_glasses.webp');

    // Очки приоритетнее цвета волос и кожи
    const boyGlassesBlonde = resolveChildAvatar({
      gender: 'boy',
      hairColor: 'светлые',
      skinTone: 'смуглая',
      distinctiveFeatures: 'очки',
    });
    expect(boyGlassesBlonde).toContain('boy_glasses.webp');
  });

  it('приоритет 2: корректно распознает смуглый тон кожи', () => {
    const boyTan = resolveChildAvatar({ gender: 'boy', skinTone: 'смуглая' });
    expect(boyTan).toContain('boy_tan.webp');

    const girlTan = resolveChildAvatar({ gender: 'girl', skinTone: 'смуглый' });
    expect(girlTan).toContain('girl_tan.webp');
  });

  it('приоритет 3: цвет волос (светлые/блонд, рыжие, темные/черные/брюнет)', () => {
    expect(resolveChildAvatar({ gender: 'boy', hairColor: 'светлые' })).toContain('boy_blonde.webp');
    expect(resolveChildAvatar({ gender: 'girl', hairColor: 'блонд' })).toContain('girl_blonde.webp');

    expect(resolveChildAvatar({ gender: 'boy', hairColor: 'рыжие' })).toContain('boy_ginger.webp');
    expect(resolveChildAvatar({ gender: 'girl', hairColor: 'рыжий' })).toContain('girl_ginger.webp');

    expect(resolveChildAvatar({ gender: 'boy', hairColor: 'тёмные' })).toContain('boy_dark.webp');
    expect(resolveChildAvatar({ gender: 'girl', hairColor: 'черные' })).toContain('girl_dark.webp');
    expect(resolveChildAvatar({ gender: 'girl', hairColor: 'брюнетка' })).toContain('girl_dark.webp');
  });

  it('приоритет 4: дефолт для русых / шатенов', () => {
    expect(resolveChildAvatar({ gender: 'boy', hairColor: 'русые' })).toContain('boy_brown.webp');
    expect(resolveChildAvatar({ gender: 'girl', hairColor: 'русые' })).toContain('girl_brown.webp');
    expect(resolveChildAvatar({ gender: 'boy', hairColor: 'шатен' })).toContain('boy_brown.webp');
  });
});
