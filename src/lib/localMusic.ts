import { Song } from '../types';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';

export interface LocalSong extends Song {
  file?: File;
  isLocal: true;
  downloaded?: boolean;
  filePath?: string; // For mobile devices
}

// Platform detection
const isMobile = () => Capacitor.isNativePlatform();
const isAndroid = () => Capacitor.getPlatform() === 'android';

// Auto-discover music on Android using MediaStore
const autoDiscoverMusicAndroid = async (): Promise<LocalSong[]> => {
  try {
    // Request permissions first
    const hasPermission = await requestStoragePermission();
    if (!hasPermission) {
      throw new Error('Storage permission denied. Please grant storage access in your device settings.');
    }

    // Get all audio files from Android MediaStore
    const audioFiles = await scanAndroidMediaStore();
    
    if (audioFiles.length === 0) {
      throw new Error('No music files found on your device.');
    }

    const songs = await Promise.all(
      audioFiles.map(file => createSongFromAndroidFile(file))
    );

    // Save to IndexedDB
    await saveLocalSongs(songs);
    
    return songs;
  } catch (error: any) {
    console.error('Error auto-discovering music on Android:', error);
    throw error;
  }
};

// Request storage permission on Android
const requestStoragePermission = async (): Promise<boolean> => {
  if (!isAndroid()) return true;

  try {
    // @ts-ignore - Using Capacitor's permission API
    const { Permissions } = await import('@capacitor/core');
    
    // Check current permission status
    const status = await Permissions.query({ name: 'storage' });
    
    if (status.state === 'granted') {
      return true;
    }

    // Request permission
    const result = await Permissions.request({ name: 'storage' });
    return result.state === 'granted';
  } catch (error) {
    console.warn('Permission check failed:', error);
    // On Android 13+, READ_MEDIA_AUDIO is granted by default
    return true;
  }
};

// Scan Android MediaStore for audio files using Capacitor
const scanAndroidMediaStore = async (): Promise<any[]> => {
  if (!isAndroid()) return [];

  try {
    // Use Capacitor's Filesystem to scan common music directories
    const musicDirs = [
      { directory: Directory.ExternalStorage, path: 'Music' },
      { directory: Directory.ExternalStorage, path: 'Download' },
      { directory: Directory.Documents, path: '' },
    ];

    const allFiles: any[] = [];

    for (const { directory, path } of musicDirs) {
      try {
        const files = await scanDirectoryRecursive(directory, path);
        allFiles.push(...files);
      } catch (error) {
        console.warn(`Failed to scan ${path}:`, error);
      }
    }

    return allFiles;
  } catch (error) {
    console.error('Error scanning MediaStore:', error);
    return [];
  }
};

// Recursively scan directory
const scanDirectoryRecursive = async (
  directory: Directory,
  path: string,
  depth: number = 0,
  maxDepth: number = 3
): Promise<any[]> => {
  if (depth >= maxDepth) return [];

  const files: any[] = [];

  try {
    const result = await Filesystem.readdir({
      directory,
      path,
    });

    for (const file of result.files) {
      const filePath = path ? `${path}/${file.name}` : file.name;

      if (file.type === 'directory') {
        // Recursively scan subdirectories
        const subFiles = await scanDirectoryRecursive(
          directory,
          filePath,
          depth + 1,
          maxDepth
        );
        files.push(...subFiles);
      } else if (isAudioFileName(file.name)) {
        files.push({
          name: file.name,
          path: filePath,
          directory,
        });
      }
    }
  } catch (error) {
    // Directory doesn't exist or not accessible
    console.warn(`Cannot read directory ${path}:`, error);
  }

  return files;
};

// Check if filename is an audio file
const isAudioFileName = (fileName: string): boolean => {
  const audioExtensions = [
    'mp3', 'wav', 'flac', 'ogg', 'm4a', 'aac', 'wma', 'opus', 'webm',
    'ape', 'alac', 'aiff', 'aif', 'dsd', 'dsf', 'pcm', 'wv', 'mka',
  ];
  const extension = fileName.split('.').pop()?.toLowerCase();
  return audioExtensions.includes(extension || '');
};

// Create song from Android file
const createSongFromAndroidFile = async (file: any): Promise<LocalSong> => {
  try {
    const fileName = file.name.replace(/\.[^/.]+$/, '');
    
    // Parse filename for metadata (Artist - Title pattern)
    const parts = fileName.split('-').map((p: string) => p.trim());
    const artist = parts.length >= 2 ? parts[0] : 'Unknown Artist';
    const title = parts.length >= 2 ? parts.slice(1).join(' - ') : fileName;

    // Read file to get URI for playback
    const fileUri = await Filesystem.getUri({
      directory: file.directory,
      path: file.path,
    });

    const song: LocalSong = {
      id: `local_android_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      title,
      artist,
      album: 'Local Music',
      coverUrl: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400&h=400&fit=crop',
      duration: 0, // We'll update this when the audio loads
      audioUrl: Capacitor.convertFileSrc(fileUri.uri), // Convert to web-accessible URL
      plays: 0,
      likes: 0,
      releaseDate: '',
      genre: 'Local',
      description: '',
      isLocal: true,
      downloaded: true,
      filePath: file.path,
    };

    return song;
  } catch (error) {
    console.error('Error creating song from Android file:', error);
    throw error;
  }
};

// Enhanced auto-discovery with platform detection
export const autoDiscoverMusic = async (): Promise<LocalSong[]> => {
  try {
    if (isMobile()) {
      // Use Android/iOS native APIs
      if (isAndroid()) {
        return await autoDiscoverMusicAndroid();
      } else {
        throw new Error('iOS music discovery not yet implemented. Please use Import Files feature.');
      }
    } else {
      // Use web File System Access API for desktop
      return await autoDiscoverMusicWeb();
    }
  } catch (error: any) {
    console.error('Error auto-discovering music:', error);
    throw error;
  }
};

// Web-based auto-discovery (for desktop browsers)
const autoDiscoverMusicWeb = async (): Promise<LocalSong[]> => {
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
    await scanDirectoryWeb(dirHandle, audioFiles);
    
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
    throw error;
  }
};

// Scan directory (web version)
const scanDirectoryWeb = async (dirHandle: any, audioFiles: File[], maxDepth = 5, currentDepth = 0) => {
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
          await scanDirectoryWeb(entry, audioFiles, maxDepth, currentDepth + 1);
        }
      } catch (error) {
        console.warn(`Failed to access ${entry.name}:`, error);
      }
    }
  } catch (error) {
    console.error('Error scanning directory:', error);
  }
};

// Check if file is an audio file
const isAudioFile = (file: File): boolean => {
  if (file.type.startsWith('audio/')) {
    return true;
  }
  
  const audioExtensions = [
    'mp3', 'wav', 'flac', 'ogg', 'm4a', 'aac', 'wma', 'opus', 'webm',
    'ape', 'alac', 'aiff', 'aif', 'dsd', 'dsf', 'pcm', 'wv', 'mka',
  ];
  const extension = file.name.split('.').pop()?.toLowerCase();
  return audioExtensions.includes(extension || '');
};

// Auto-sync music from previously granted folder access
export const autoSyncLocalMusic = async (): Promise<LocalSong[]> => {
  try {
    if (isMobile()) {
      // On mobile, auto-sync by rescanning MediaStore
      if (isAndroid()) {
        const hasPermission = await requestStoragePermission();
        if (!hasPermission) return [];
        return await autoDiscoverMusicAndroid();
      }
      return [];
    } else {
      // On web, use saved folder handle
      const dirHandle = await getSavedFolderHandle();
      if (!dirHandle) return [];
      
      const permission = await dirHandle.requestPermission({ mode: 'read' });
      if (permission !== 'granted') return [];
      
      const audioFiles: File[] = [];
      await scanDirectoryWeb(dirHandle, audioFiles);
      
      if (audioFiles.length === 0) return [];
      
      const songs = await Promise.all(
        audioFiles.map((file: File) => createSongFromFile(file))
      );
      
      await saveLocalSongs(songs);
      return songs;
    }
  } catch (error) {
    console.warn('Auto-sync failed:', error);
    return [];
  }
};

// Create song object from file with metadata extraction
export const createSongFromFile = async (file: File): Promise<LocalSong> => {
  try {
    const audioUrl = URL.createObjectURL(file);
    const audio = new Audio(audioUrl);
    
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
        }), 3000)
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
  try {
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

// IndexedDB operations
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
      
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('title', 'title', { unique: false });
        store.createIndex('artist', 'artist', { unique: false });
      }
      
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

export const downloadSongForOffline = async (song: Song): Promise<LocalSong> => {
  try {
    const audioResponse = await fetch(song.audioUrl);
    const audioBlob = await audioResponse.blob();
    const audioFile = new File([audioBlob], `${song.title}.mp3`, { type: 'audio/mpeg' });
    
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
    
    await saveLocalSongs([localSong]);
    return localSong;
  } catch (error) {
    console.error('Error downloading song:', error);
    throw error;
  }
};

export const isSongDownloaded = async (songId: string): Promise<boolean> => {
  const songs = await getLocalSongs();
  return songs.some(s => s.id === songId);
};

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

const saveFolderHandle = async (dirHandle: any): Promise<void> => {
  if (isMobile()) return; // Not applicable on mobile
  
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

const getSavedFolderHandle = async (): Promise<any> => {
  if (isMobile()) return null;
  
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
