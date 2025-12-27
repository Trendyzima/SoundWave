import { Song } from '../types';

export interface LocalSong extends Song {
  file?: File;
  isLocal: true;
  downloaded?: boolean;
}

// Enhanced auto-discovery with better error handling and auto-sync
export const autoDiscoverMusic = async (): Promise<LocalSong[]> => {
  try {
    // Check if File System Access API is supported
    if (!('showDirectoryPicker' in window)) {
      throw new Error('File System Access API not supported in this browser. Please use Chrome, Edge, or another Chromium-based browser.');
    }
    
    // @ts-ignore - File System Access API
    const dirHandle = await window.showDirectoryPicker({
      mode: 'read',
      startIn: 'music',
    });
    
    const audioFiles: File[] = [];
    await scanDirectory(dirHandle, audioFiles);
    
    if (audioFiles.length === 0) {
      throw new Error('No audio files found in the selected folder.');
    }
    
    const songs = await Promise.all(
      audioFiles.map(file => createSongFromFile(file))
    );
    
    // Save to IndexedDB for offline access
    await saveLocalSongs(songs);
    
    // Save folder handle for future auto-sync
    await saveFolderHandle(dirHandle);
    
    return songs;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new Error('Folder selection was cancelled.');
    }
    console.error('Error auto-discovering music:', error);
    throw error;
  }
};

// Auto-sync music from previously granted folder access
export const autoSyncLocalMusic = async (): Promise<LocalSong[]> => {
  try {
    const dirHandle = await getSavedFolderHandle();
    if (!dirHandle) {
      return [];
    }
    
    // Request permission if needed
    const permission = await dirHandle.requestPermission({ mode: 'read' });
    if (permission !== 'granted') {
      return [];
    }
    
    const audioFiles: File[] = [];
    await scanDirectory(dirHandle, audioFiles);
    
    if (audioFiles.length === 0) {
      return [];
    }
    
    const songs = await Promise.all(
      audioFiles.map(file => createSongFromFile(file))
    );
    
    // Save to IndexedDB for offline access
    await saveLocalSongs(songs);
    
    return songs;
  } catch (error) {
    console.warn('Auto-sync failed, user needs to re-grant access:', error);
    return [];
  }
};

// Recursively scan directory for audio files
const scanDirectory = async (dirHandle: any, audioFiles: File[], maxDepth = 5, currentDepth = 0) => {
  if (currentDepth >= maxDepth) return;
  
  try {
    for await (const entry of dirHandle.values()) {
      try {
        if (entry.kind === 'file') {
          const file = await entry.getFile();
          if (isAudioFile(file)) {
            audioFiles.push(file);
          }
        } else if (entry.kind === 'directory') {
          // Recursively scan subdirectories
          await scanDirectory(entry, audioFiles, maxDepth, currentDepth + 1);
        }
      } catch (error) {
        console.warn(`Failed to access ${entry.name}:`, error);
        // Continue with other files
      }
    }
  } catch (error) {
    console.error('Error scanning directory:', error);
  }
};

// Check if file is an audio file
const isAudioFile = (file: File): boolean => {
  // Check MIME type first
  if (file.type.startsWith('audio/')) {
    return true;
  }
  
  // Fallback to extension check
  const audioExtensions = [
    'mp3', 'wav', 'flac', 'ogg', 'm4a', 'aac', 'wma', 'opus', 'webm',
    'ape', 'alac', 'aiff', 'aif', 'dsd', 'dsf', 'pcm', 'wv', 'mka',
    'mp2', 'mp1', 'mpga', 'oga', 'spx', 'amr', 'awb', '3gp', 'mid', 'midi'
  ];
  const extension = file.name.split('.').pop()?.toLowerCase();
  return audioExtensions.includes(extension || '');
};

// Create song object from file with metadata extraction
export const createSongFromFile = async (file: File): Promise<LocalSong> => {
  try {
    const audioUrl = URL.createObjectURL(file);
    const audio = new Audio(audioUrl);
    
    // Wait for metadata to load with timeout
    const metadata = await Promise.race([
      new Promise<any>((resolve) => {
        audio.addEventListener('loadedmetadata', async () => {
          const extracted = await extractMetadata(file);
          resolve({
            duration: Math.floor(audio.duration) || 0,
            ...extracted,
          });
        });
        
        audio.addEventListener('error', () => {
          resolve({
            duration: 0,
            title: null,
            artist: null,
            album: null,
            year: null,
            genre: null,
            coverUrl: null,
          });
        });
      }),
      new Promise<any>((resolve) => 
        setTimeout(() => resolve({
          duration: 0,
          title: null,
          artist: null,
          album: null,
          year: null,
          genre: null,
          coverUrl: null,
        }), 3000) // 3 second timeout
      ),
    ]);
    
    const fileName = file.name.replace(/\.[^/.]+$/, '');
    
    const song: LocalSong = {
      id: `local_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      title: metadata.title || fileName,
      artist: metadata.artist || 'Unknown Artist',
      album: metadata.album || 'Local Music',
      coverUrl: metadata.coverUrl || 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400&h=400&fit=crop',
      duration: metadata.duration,
      audioUrl,
      plays: 0,
      likes: 0,
      releaseDate: metadata.year || '',
      genre: metadata.genre || 'Local',
      description: '',
      file,
      isLocal: true,
      downloaded: true,
    };
    
    return song;
  } catch (error) {
    console.error('Error creating song from file:', error);
    throw error;
  }
};

// Extract metadata from audio file
const extractMetadata = async (file: File): Promise<any> => {
  // Basic metadata extraction from filename
  // In production, you could use jsmediatags library for full ID3 tag support
  
  try {
    // Try to parse common filename patterns like "Artist - Title.mp3"
    const fileName = file.name.replace(/\.[^/.]+$/, '');
    const parts = fileName.split('-').map(p => p.trim());
    
    if (parts.length >= 2) {
      return {
        artist: parts[0],
        title: parts.slice(1).join(' - '),
        album: null,
        year: null,
        genre: null,
        coverUrl: null,
      };
    }
  } catch (error) {
    console.warn('Failed to parse metadata from filename:', error);
  }
  
  return {
    title: null,
    artist: null,
    album: null,
    year: null,
    genre: null,
    coverUrl: null,
  };
};

// IndexedDB operations for offline storage
const DB_NAME = 'soundwave_library';
const STORE_NAME = 'local_songs';
const FOLDER_HANDLE_STORE = 'folder_handles';

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 3);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Create local_songs store if doesn't exist
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('title', 'title', { unique: false });
        store.createIndex('artist', 'artist', { unique: false });
      }
      
      // Create folder_handles store for persistent folder access
      if (!db.objectStoreNames.contains(FOLDER_HANDLE_STORE)) {
        db.createObjectStore(FOLDER_HANDLE_STORE, { keyPath: 'id' });
      }
    };
  });
};

export const saveLocalSongs = async (songs: LocalSong[]): Promise<void> => {
  const db = await openDB();
  const transaction = db.transaction([STORE_NAME], 'readwrite');
  const store = transaction.objectStore(STORE_NAME);
  
  for (const song of songs) {
    // Don't store the File object, just metadata
    const { file, ...songData } = song;
    store.put(songData);
  }
  
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
};

export const getLocalSongs = async (): Promise<LocalSong[]> => {
  const db = await openDB();
  const transaction = db.transaction([STORE_NAME], 'readonly');
  const store = transaction.objectStore(STORE_NAME);
  const request = store.getAll();
  
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
};

export const deleteLocalSong = async (songId: string): Promise<void> => {
  const db = await openDB();
  const transaction = db.transaction([STORE_NAME], 'readwrite');
  const store = transaction.objectStore(STORE_NAME);
  
  store.delete(songId);
  
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
};

// Download song for offline listening
export const downloadSongForOffline = async (song: Song): Promise<LocalSong> => {
  try {
    // Download audio file
    const audioResponse = await fetch(song.audioUrl);
    const audioBlob = await audioResponse.blob();
    const audioFile = new File([audioBlob], `${song.title}.mp3`, { type: 'audio/mpeg' });
    
    // Download cover image if available
    let coverBlob: Blob | null = null;
    if (song.coverUrl && !song.coverUrl.includes('unsplash') && !song.coverUrl.includes('placeholder')) {
      try {
        const coverResponse = await fetch(song.coverUrl);
        coverBlob = await coverResponse.blob();
      } catch (e) {
        console.warn('Failed to download cover:', e);
      }
    }
    
    const localSong: LocalSong = {
      ...song,
      audioUrl: URL.createObjectURL(audioBlob),
      coverUrl: coverBlob ? URL.createObjectURL(coverBlob) : song.coverUrl,
      file: audioFile,
      isLocal: true,
      downloaded: true,
    };
    
    // Save to IndexedDB
    await saveLocalSongs([localSong]);
    
    return localSong;
  } catch (error) {
    console.error('Error downloading song:', error);
    throw error;
  }
};

// Check if song is downloaded
export const isSongDownloaded = async (songId: string): Promise<boolean> => {
  const songs = await getLocalSongs();
  return songs.some(s => s.id === songId);
};

// Clear all local songs
export const clearLocalSongs = async (): Promise<void> => {
  const db = await openDB();
  const transaction = db.transaction([STORE_NAME], 'readwrite');
  const store = transaction.objectStore(STORE_NAME);
  
  store.clear();
  
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
};

// Save folder handle for auto-sync
const saveFolderHandle = async (dirHandle: any): Promise<void> => {
  try {
    const db = await openDB();
    const transaction = db.transaction([FOLDER_HANDLE_STORE], 'readwrite');
    const store = transaction.objectStore(FOLDER_HANDLE_STORE);
    
    store.put({ id: 'music_folder', handle: dirHandle });
    
    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (error) {
    console.warn('Failed to save folder handle:', error);
  }
};

// Get saved folder handle
const getSavedFolderHandle = async (): Promise<any> => {
  try {
    const db = await openDB();
    const transaction = db.transaction([FOLDER_HANDLE_STORE], 'readonly');
    const store = transaction.objectStore(FOLDER_HANDLE_STORE);
    const request = store.get('music_folder');
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const result = request.result;
        resolve(result?.handle || null);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.warn('Failed to get saved folder handle:', error);
    return null;
  }
};
