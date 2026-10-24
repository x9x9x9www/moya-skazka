export interface ChildAvatarParams {
  gender?: 'boy' | 'girl' | string;
  hairColor?: string;
  hairType?: string;
  hairStructure?: string;
  skinTone?: string;
  distinctiveFeatures?: string;
  avatar_id?: string;
}

/**
 * 12 канонических 3D Pixar аватаров (6 для мальчиков, 6 для девочек)
 */
export const ALL_AVATAR_KEYS = [
  'boy_blonde',
  'boy_brown',
  'boy_dark',
  'boy_ginger',
  'boy_glasses',
  'boy_tan',
  'girl_blonde',
  'girl_brown',
  'girl_dark',
  'girl_ginger',
  'girl_glasses',
  'girl_tan',
] as const;

export function resolveChildAvatarKey(params?: ChildAvatarParams | null): string {
  if (!params) return 'boy_brown';
  const gender = params.gender === 'girl' ? 'girl' : 'boy';
  const hair = (params.hairColor || '').toLowerCase();
  const skin = (params.skinTone || '').toLowerCase();
  const features = (params.distinctiveFeatures || '').toLowerCase();
  const avatarId = (params.avatar_id || '').toLowerCase();

  // 1. Приоритет: наличие очков
  if (features.includes('очк') || avatarId.includes('glasses')) {
    return `${gender}_glasses`;
  }

  // 2. Смуглый тон кожи
  if (skin.includes('смугл') || avatarId.includes('tan')) {
    return `${gender}_tan`;
  }

  // 3. Цвет волос
  if (hair.includes('светл') || hair.includes('блонд')) {
    return `${gender}_blonde`;
  }
  if (hair.includes('рыж')) {
    return `${gender}_ginger`;
  }
  if (
    hair.includes('тёмн') ||
    hair.includes('темн') ||
    hair.includes('черн') ||
    hair.includes('брюнет')
  ) {
    return `${gender}_dark`;
  }

  // 4. По умолчанию для русых / шатенов и fallback
  return `${gender}_brown`;
}

/**
 * Определяет подходящий 3D Pixar-аватар на основе параметров внешности ребёнка.
 * Возвращает путь к оптимизированному изображению (WEBP).
 */
export function resolveChildAvatar(params?: ChildAvatarParams | null): string {
  const base = (typeof import.meta !== 'undefined' && (import.meta as any)?.env?.BASE_URL) || './';
  const prefix = base.endsWith('/') ? base : `${base}/`;
  return `${prefix}illustrations/avatars/${resolveChildAvatarKey(params)}.webp`;
}

