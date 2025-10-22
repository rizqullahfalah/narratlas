// src/scripts/utils/sync.js

import { FavoriteStoryIdb } from '../data/favorite-story-idb.js';
import * as API from '../data/api.js';

export async function syncPendingStories() {
  const stories = await FavoriteStoryIdb.getAllStories();
  const pending = stories.filter(s => s.isSynced === false);

  if (pending.length === 0) {
    console.log('[SYNC] Tidak ada cerita pending.');
    return [];
  }

  console.log(`[SYNC] Menemukan ${pending.length} cerita pending. Memulai sinkronisasi...`);

  const syncedStories = [];

  for (const story of pending) {
    try {
      const res = await API.addStory({
        description: story.description,
        photoFile: story.photoFile,
        lat: story.lat,
        lon: story.lon,
      });

      if (res.ok && res.data) {
        const newStory = {
          ...story,
          id: res.data.id || story.id,
          photoUrl: res.data.photoUrl || story.photoUrl,
          lat: res.data.lat ?? story.lat,
          lon: res.data.lon ?? story.lon,
          userId: story.userId || localStorage.getItem('userId') || 'guest',
          isSynced: true,
          syncedAt: new Date().toISOString(),
        };

        await FavoriteStoryIdb.putStory(newStory);

        if (story.photoUrl?.startsWith('blob:')) {
          URL.revokeObjectURL(story.photoUrl);
        }

        console.log(`[SYNC] ✔ Berhasil sinkronkan cerita: ${newStory.id}`);
        syncedStories.push(newStory);
      } else {
        console.error(`[SYNC] ❌ Gagal sync cerita ${story.id}: ${res.message || 'Tidak diketahui'}`);
      }
    } catch (err) {
      console.error(`[SYNC] ❌ Error saat sync story ${story.id}:`, err);
    }
  }

  if (syncedStories.length > 0) {
    console.log(`[SYNC] Selesai: ${syncedStories.length} cerita berhasil disinkronkan.`);
  }

  return syncedStories;
}
