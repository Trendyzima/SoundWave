// Unified Music Library - combines online, downloaded, and local music

import { Song } from '../types';
import { supabase } from './supabase';
import { getLocalSongs, LocalSong, isSongDownloaded } from './localMusic';

export interface UnifiedSong extends Song {
  source: 'online' | 'downloaded' | 'local';
  isAvailableOffline: boolean;
  downloadedAt?: string;
  localPath?: string;
}

// IndexedDB for downloads tracking
const DB_NAME = 'soundwave_library';
const DOWNLOADS_STORE = 'downloads';
const LOCAL_STORE = 'local_songs';

const openLibraryDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 3);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Downloads store
      if (!db.objectStoreNames.contains(DOWNLOADS_STORE)) {
        const downloadsStore = db.createObjectStore(DOWNLOADS_STORE, { keyPath: 'id' });
        downloadsStore.createIndex('downloadedAt', 'downloadedAt', { unique: false });
        downloadsStore.createIndex('userId', 'userId', { unique: false });
      }
      
      // Local songs store
      if (!db.objectStoreNames.contains(LOCAL_STORE)) {
        db.createObjectStore(LOCAL_STORE, { keyPath: 'id' });
      }
    };
  });
};

// Save downloaded song to library
export const saveDownloadedSong = async (song: Song, userId?: string): Promise<void> => {
  const db = await openLibraryDB();
  const transaction = db.transaction([DOWNLOADS_STORE], 'readwrite');
  const store = transaction.objectStore(DOWNLOADS_STORE);
  
  const downloadedSong = {
    ...song,
    userId,
    downloadedAt: new Date().toISOString(),
  };
  
  store.put(downloadedSong);
  
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
};

// Get all downloaded songs
export const getDownloadedSongs = async (userId?: string): Promise<UnifiedSong[]> => {
  const db = await openLibraryDB();
  const transaction = db.transaction([DOWNLOADS_STORE], 'readonly');
  const store = transaction.objectStore(DOWNLOADS_STORE);
  
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    
    request.onsuccess = () => {
      let songs = request.result;
      
      // Filter by userId if provided
      if (userId) {
        songs = songs.filter((s: any) => s.userId === userId);
      }
      
      const unifiedSongs: UnifiedSong[] = songs.map((song: any) => ({
        ...song,
        source: 'downloaded' as const,
        isAvailableOffline: true,
      }));
      
      resolve(unifiedSongs);
    };
    
    request.onerror = () => reject(request.error);
  });
};

// Remove downloaded song
export const removeDownloadedSong = async (songId: string): Promise<void> => {
  const db = await openLibraryDB();
  const transaction = db.transaction([DOWNLOADS_STORE], 'readwrite');
  const store = transaction.objectStore(DOWNLOADS_STORE);
  
  store.delete(songId);
  
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
};

// Get unified library (online + downloaded + local)
export const getUnifiedLibrary = async (userId?: string): Promise<{
  all: UnifiedSong[];
  online: UnifiedSong[];
  downloaded: UnifiedSong[];
  local: UnifiedSong[];
}> => {
  try {
    // Get online songs (user's uploads or liked songs)
    let onlineSongs: UnifiedSong[] = [];
    
    if (userId) {
      const { data: myUploads } = await supabase
        .from('songs')
        .select('*')
        .eq('user_id', userId);
      
      const { data: likedData } = await supabase
        .from('likes')
        .select('song_id, songs(*)')
        .eq('user_id', userId);
      
      const uploads = (myUploads || []).map(song => ({
        id: song.id,
        title: song.title,
        artist: song.artist,
        album: song.album || '',
        coverUrl: song.cover_url || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop',
        duration: song.duration,
        audioUrl: song.audio_url,
        plays: song.plays,
        likes: song.likes,
        releaseDate: song.release_date || '',
        genre: song.genre || '',
        description: song.description || '',
        source: 'online' as const,
        isAvailableOffline: false,
      }));
      
      const liked = (likedData || []).map((like: any) => ({
        id: like.songs.id,
        title: like.songs.title,
        artist: like.songs.artist,
        album: like.songs.album || '',
        coverUrl: like.songs.cover_url || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop',
        duration: like.songs.duration,
        audioUrl: like.songs.audio_url,
        plays: like.songs.plays,
        likes: like.songs.likes,
        releaseDate: like.songs.release_date || '',
        genre: like.songs.genre || '',
        description: like.songs.description || '',
        source: 'online' as const,
        isAvailableOffline: false,
      }));
      
      // Merge and remove duplicates
      const combined = [...uploads, ...liked];
      const uniqueMap = new Map<string, UnifiedSong>();
      combined.forEach(song => {
        if (!uniqueMap.has(song.id)) {
          uniqueMap.set(song.id, song);
        }
      });
      
      onlineSongs = Array.from(uniqueMap.values());
    }
    
    // Get downloaded songs
    const downloadedSongs = await getDownloadedSongs(userId);
    
    // Get local songs (always available offline)
    const localSongsData = await getLocalSongs();
    const localSongs: UnifiedSong[] = localSongsData.map(song => ({
      id: song.id,
      title: song.title,
      artist: song.artist,
      album: song.album,
      coverUrl: song.coverUrl,
      duration: song.duration,
      audioUrl: song.audioUrl,
      plays: song.plays,
      likes: song.likes,
      releaseDate: song.releaseDate,
      genre: song.genre,
      description: song.description || '',
      source: 'local' as const,
      isAvailableOffline: true,
      localPath: song.audioUrl,
    }));
    
    // Combine all sources
    const all = [...onlineSongs, ...downloadedSongs, ...localSongs];
    
    // Remove duplicates (prefer downloaded/local over online)
    const finalMap = new Map<string, UnifiedSong>();
    
    // Add online songs first
    onlineSongs.forEach(song => finalMap.set(song.id, song));
    
    // Override with downloaded songs
    downloadedSongs.forEach(song => finalMap.set(song.id, song));
    
    // Add local songs (they have unique IDs)
    localSongs.forEach(song => finalMap.set(song.id, song));
    
    return {
      all: Array.from(finalMap.values()),
      online: onlineSongs,
      downloaded: downloadedSongs,
      local: localSongs,
    };
  } catch (error) {
    console.error('Error getting unified library:', error);
    return {
      all: [],
      online: [],
      downloaded: [],
      local: [],
    };
  }
};

// Check if song is in library
export const isSongInLibrary = async (songId: string): Promise<boolean> => {
  const library = await getUnifiedLibrary();
  return library.all.some(song => song.id === songId);
};

// Search across all sources
export const searchLibrary = async (query: string, userId?: string): Promise<UnifiedSong[]> => {
  const library = await getUnifiedLibrary(userId);
  const searchTerm = query.toLowerCase();
  
  return library.all.filter(song => 
    song.title.toLowerCase().includes(searchTerm) ||
    song.artist.toLowerCase().includes(searchTerm) ||
    song.album.toLowerCase().includes(searchTerm) ||
    song.genre.toLowerCase().includes(searchTerm)
  );
};

// Get library stats
export const getLibraryStats = async (userId?: string) => {
  const library = await getUnifiedLibrary(userId);
  
  const totalDuration = library.all.reduce((sum, song) => sum + song.duration, 0);
  const totalPlays = library.all.reduce((sum, song) => sum + (song.plays || 0), 0);
  
  return {
    totalSongs: library.all.length,
    onlineSongs: library.online.length,
    downloadedSongs: library.downloaded.length,
    localSongs: library.local.length,
    totalDuration,
    totalPlays,
    genres: [...new Set(library.all.map(s => s.genre).filter(Boolean))],
  };
};

// Sync library (refresh online songs)
export const syncLibrary = async (userId?: string): Promise<void> => {
  // This will refresh the online songs from Supabase
  await getUnifiedLibrary(userId);
};
