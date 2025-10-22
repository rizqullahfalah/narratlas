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

  async getPendingStories() {
    const all = await this.getAllStories();
    return all.filter(s => s.isSynced === false);
  },

  async getStoriesByUser(userId) {
    const allStories = await this.getAllStories();
    return allStories.filter(story => story.userId === userId);
  },

  async putStory(story) {
    if (!story?.id) {
      console.error('[IDB] Story tidak memiliki id:', story);
      return;
    }

    const normalizedStory = {
      ...story,
      lat: story.lat !== undefined && story.lat !== '' ? Number(story.lat) : null,
      lon: story.lon !== undefined && story.lon !== '' ? Number(story.lon) : null,
      photoUrl: story.photoUrl || '',
      isSynced: story.isSynced ?? true,
    };

    return (await dbPromise).put(STORE_NAME, normalizedStory);
  },

  async deleteStory(id) {
    return (await dbPromise).delete(STORE_NAME, id);
  },

  async clearAllStories() {
    return (await dbPromise).clear(STORE_NAME);
  },
};
