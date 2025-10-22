// src/scripts/data/favorite-story-idb.js

import { openDB } from 'idb';

const DB_NAME = 'narratlas-db';
const DB_VERSION = 2;
const STORE_NAME = 'stories';

const dbPromise = openDB(DB_NAME, DB_VERSION, {
  upgrade(db) {
    if (!db.objectStoreNames.contains(STORE_NAME)) {
      db.createObjectStore(STORE_NAME, { keyPath: 'id' });
    }
  },
});

export const FavoriteStoryIdb = {
  async getStory(id) {
    return (await dbPromise).get(STORE_NAME, id);
  },

  async getAllStories() {
    return (await dbPromise).getAll(STORE_NAME);
  },

  async getStoriesByUser(userId) {
    const allStories = await this.getAllStories();
    return allStories.filter(story => story.userId === userId);
  },

  async getAllKeys() {
    return (await dbPromise).getAllKeys(STORE_NAME);
  },

  async putStory(story) {
    if (!story?.id) {
      console.error('[IDB] Story tidak memiliki id:', story);
      return;
    }

    if (!story.userId) {
      console.warn('[IDB] Story disimpan tanpa userId. Sebaiknya tambahkan userId agar data tidak tercampur antar akun.');
    }

    return (await dbPromise).put(STORE_NAME, story);
  },

  async deleteStory(id) {
    return (await dbPromise).delete(STORE_NAME, id);
  },

  async clearAllStories() {
    return (await dbPromise).clear(STORE_NAME);
  },
};
