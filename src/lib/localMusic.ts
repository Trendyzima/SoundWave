import { Song } from '../types';

export interface LocalSong extends Song {
  file?: File;
  isLocal: true;
  downloaded?: boolean;
}

// Auto-discover music files in granted directories
export const autoDiscoverMusic = async (): Promise<LocalSong[]> => {
  try {
    // Check if File System Access API is supported
    if (!('showDirectoryPicker' in window)) {
      console.warn('File System Access API not supported');
      return [];
    }
    
    // @ts-ignore
    const dirHandle = await window.showDirectoryPicker({
      mode: 'read',
      startIn: 'music',
    });
    
    const audioFiles: File[] = [];
    await scanDirectory(dirHandle, audioFiles);
    
    const songs = await Promise.all(
      audioFiles.map(file => createSongFromFile(file))
    );
    
    // Save to IndexedDB for offline access
    await saveLocalSongs(songs);
    
    return songs;
  } catch (error) {
    console.error('Error auto-discovering music:', error);
    return [];
  }
};

// Recursively scan directory for audio files
const scanDirectory = async (dirHandle: any, audioFiles: File[]) => {
  for await (const entry of dirHandle.values()) {
    if (entry.kind === 'file') {
      const file = await entry.getFile();
      if (isAudioFile(file)) {
        audioFiles.push(file);
      }
    } else if (entry.kind === 'directory') {
      // Recursively scan subdirectories
      await scanDirectory(entry, audioFiles);
    }
  }
};

// Check if file is an audio file
const isAudioFile = (file: File): boolean => {
  const audioExtensions = [
    'mp3', 'wav', 'flac', 'ogg', 'm4a', 'aac', 'wma', 'opus', 'webm',
    'ape', 'alac', 'aiff', 'dsd', 'pcm'
  ];
  const extension = file.name.split('.').pop()?.toLowerCase();
  return audioExtensions.includes(extension || '');
};

// Create song object from file
export const createSongFromFile = async (file: File): Promise<LocalSong> => {
  const audioUrl = URL.createObjectURL(file);
  const audio = new Audio(audioUrl);
  
  return new Promise((resolve) => {
    audio.addEventListener('loadedmetadata', async () => {
      // Try to extract metadata from file
      const metadata = await extractMetadata(file);
      
      const song: LocalSong = {
        id: `local_${Date.now()}_${Math.random().toString(36).substring(2)}`,
        title: metadata.title || file.name.replace(/\.[^/.]+$/, ''),
        artist: metadata.artist || 'Unknown Artist',
        album: metadata.album || '',
        coverUrl: metadata.coverUrl || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop',
        duration: Math.floor(audio.duration),
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
      
      resolve(song);
    });
  });
};

// Extract metadata from audio file
const extractMetadata = async (file: File): Promise<any> => {
  // Basic metadata extraction
  // In production, use a library like jsmediatags for full ID3 tag support
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
const DB_NAME = 'soundwave_db';
const STORE_NAME = 'local_songs';

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
};

export const saveLocalSongs = async (songs: LocalSong[]): Promise<void> => {
  const db = await openDB();
  const transaction = db.transaction([STORE_NAME], 'readwrite');
  const store = transaction.objectStore(STORE_NAME);
  
  for (const song of songs) {
    store.put(song);
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
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

// Download song for offline listening
export const downloadSongForOffline = async (song: Song): Promise<LocalSong> => {
  try {
    // Download audio file
    const audioResponse = await fetch(song.audioUrl);
    const audioBlob = await audioResponse.blob();
    const audioFile = new File([audioBlob], `${song.title}.mp3`, { type: 'audio/mpeg' });
    
    // Download cover image
    let coverBlob: Blob | null = null;
    if (song.coverUrl && !song.coverUrl.includes('unsplash')) {
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
