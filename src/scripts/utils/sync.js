// src/scripts/utils/sync.js

import { FavoriteStoryIdb } from '../data/favorite-story-idb.js';
import * as API from '../data/api.js';

export async function syncPendingStories() {
  const stories = await FavoriteStoryIdb.getAllStories();
  const pending = stories.filter(s => s.isSynced === false);

  // simpan hasil sukses untuk feedback
  const syncedStories = [];

  for (const story of pending) {
    try {
      const res = await API.addStory({
        description: story.description,
        photoFile: story.photoFile,
        lat: story.lat,
        lon: story.lon,
      });

      if (res.ok) {
        // update IndexedDB, tandai sudah sync
        await FavoriteStoryIdb.putStory({
          ...story,
          isSynced: true,
          syncedAt: new Date().toISOString(),
        });

        // cleanup objectURL kalau ada
        if (story.photoUrl?.startsWith('blob:')) {
          URL.revokeObjectURL(story.photoUrl);
        }

        console.log(`✔ Story ${story.id} berhasil disinkronkan.`);
        syncedStories.push(story);
      } else {
        console.error(`❌ Gagal sync story ${story.id}: ${res.message}`);
      }
    } catch (err) {
      console.error(`❌ Gagal sync story ${story.id}`, err);
    }
  }

  return syncedStories;
}
