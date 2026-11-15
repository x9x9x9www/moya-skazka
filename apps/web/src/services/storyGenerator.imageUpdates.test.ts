import { afterEach, describe, expect, it, vi } from 'vitest';
import type { BookDetailsDTO } from '@moya-skazka/shared';
import {
  applyBookImageUpdates,
  applySceneImageUpdate,
  dispatchCoverImageUpdated,
  dispatchSceneImageUpdated,
  getBookImageUpdates,
  SCENE_IMAGE_UPDATED_EVENT,
  COVER_IMAGE_UPDATED_EVENT,
} from './storyGenerator';

const makeBook = (id = 'book-1'): BookDetailsDTO => ({
  id,
  title: 'Test book',
  status: 'ILLUSTRATED',
  format: 'ILLUSTRATED',
  can_upgrade: false,
  cover_url: 'cover-old.jpg',
  scenes: [
    { id: 'scene-1', scene_index: 1, text: 'One', image_url: 'one-old.jpg' },
    { id: 'scene-2', scene_index: 2, text: 'Two', image_url: 'two-old.jpg' },
    { id: 'scene-3', scene_index: 3, text: 'Three', image_url: 'three-old.jpg' },
  ],
  questions: [],
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('book image updates', () => {
  it('updates only the exact book and scene, immutably', () => {
    const book = makeBook();
    const neighboringBook = makeBook('book-2');
    const detail = { bookId: book.id, sceneId: 'scene-2', sceneIndex: 2, url: 'two-new.jpg' };

    const updated = applySceneImageUpdate(book, detail);

    expect(updated).not.toBe(book);
    expect(updated.scenes).not.toBe(book.scenes);
    expect(updated.scenes[1]).not.toBe(book.scenes[1]);
    expect(updated.scenes[0]).toBe(book.scenes[0]);
    expect(book.scenes[1].image_url).toBe('two-old.jpg');
    expect(updated.scenes.map((scene) => scene.image_url)).toEqual([
      'one-old.jpg', 'two-new.jpg', 'three-old.jpg',
    ]);
    expect(applySceneImageUpdate(neighboringBook, detail)).toBe(neighboringBook);
  });

  it('ignores mismatched scene identity and never falls back to an array position', () => {
    const book = makeBook();

    expect(applySceneImageUpdate(book, {
      bookId: book.id,
      sceneId: 'scene-3',
      sceneIndex: 2,
      url: 'wrong-scene.jpg',
    })).toBe(book);
    expect(applySceneImageUpdate(book, {
      bookId: book.id,
      sceneId: 'unknown-scene',
      sceneIndex: 2,
      url: 'missing-scene.jpg',
    })).toBe(book);
    expect(applySceneImageUpdate(book, {
      bookId: book.id,
      sceneId: 'scene-2',
      sceneIndex: 2,
      url: '',
    })).toBe(book);
  });

  it('rejects ambiguous duplicate scene identities', () => {
    const base = makeBook();
    const book = {
      ...base,
      scenes: [base.scenes[1], { ...base.scenes[1], image_url: 'duplicate-old.jpg' }],
    };
    const updated = applySceneImageUpdate(book, {
      bookId: book.id,
      sceneId: 'scene-2',
      sceneIndex: 2,
      url: 'two-new.jpg',
    });

    expect(updated).toBe(book);
  });

  it('does not change text-only story scene images', () => {
    const book = { ...makeBook(), format: 'TEXT' as const, status: 'TEXT_READY' as const };
    const updated = applySceneImageUpdate(book, {
      bookId: book.id,
      sceneId: 'scene-2',
      sceneIndex: 2,
      url: 'two-new.jpg',
    });

    expect(updated).toBe(book);
  });

  it('remembers image events and hydrates current cover and scene URLs on open', () => {
    const book = makeBook('book-restored');
    const sceneDetail = {
      bookId: book.id,
      sceneId: 'scene-2',
      sceneIndex: 2,
      url: 'two-latest.jpg',
    };
    const coverDetail = { bookId: book.id, url: 'cover-latest.jpg' };

    dispatchSceneImageUpdated(sceneDetail);
    dispatchCoverImageUpdated(coverDetail);
    const hydrated = applyBookImageUpdates(book, getBookImageUpdates(book.id));

    expect(hydrated.cover_url).toBe('cover-latest.jpg');
    expect(hydrated.scenes[1].image_url).toBe('two-latest.jpg');
    expect(book.cover_url).toBe('cover-old.jpg');
    expect(book.scenes[1].image_url).toBe('two-old.jpg');
    expect(getBookImageUpdates('other-book')).toBeUndefined();
  });

  it('emits typed events with book and exact scene identity', () => {
    const eventTarget = new EventTarget();
    const windowStub = { dispatchEvent: eventTarget.dispatchEvent.bind(eventTarget) };
    vi.stubGlobal('window', windowStub);
    const sceneListener = vi.fn();
    const coverListener = vi.fn();
    eventTarget.addEventListener(SCENE_IMAGE_UPDATED_EVENT, sceneListener);
    eventTarget.addEventListener(COVER_IMAGE_UPDATED_EVENT, coverListener);

    dispatchSceneImageUpdated({ bookId: 'book-event', sceneId: 'scene-4', sceneIndex: 4, url: 'four.jpg' });
    dispatchCoverImageUpdated({ bookId: 'book-event', url: 'cover.jpg' });

    expect(sceneListener).toHaveBeenCalledOnce();
    expect((sceneListener.mock.calls[0][0] as CustomEvent).detail).toEqual({
      bookId: 'book-event', sceneId: 'scene-4', sceneIndex: 4, url: 'four.jpg',
    });
    expect(coverListener).toHaveBeenCalledOnce();
    expect((coverListener.mock.calls[0][0] as CustomEvent).detail).toEqual({
      bookId: 'book-event', url: 'cover.jpg',
    });

    eventTarget.removeEventListener(SCENE_IMAGE_UPDATED_EVENT, sceneListener);
    eventTarget.removeEventListener(COVER_IMAGE_UPDATED_EVENT, coverListener);
  });
});
