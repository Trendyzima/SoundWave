export interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number; // in seconds
  coverUrl: string;
  audioUrl: string;
  genre: string;
  releaseDate: string;
  plays: number;
  likes: number;
  description?: string;
  hashtags?: string[];
}

export interface Hashtag {
  id: string;
  tag: string;
  usage_count: number;
  plays_count: number;
  last_used_at: string;
  rank?: number;
}

export interface User {
  id: string;
  username: string;
  email: string;
  avatarUrl: string;
  bio?: string;
  location?: string;
  website?: string;
  coverUrl?: string;
  joinedDate: string;
  followersCount: number;
  followingCount: number;
}

export interface Comment {
  id: string;
  userId: string;
  username: string;
  userAvatar: string;
  songId: string;
  content: string;
  timestamp: string;
  likes: number;
  replies?: Comment[];
  parentId?: string;
}

export interface Conversation {
  id: string;
  participant1Id: string;
  participant2Id: string;
  participant1: User;
  participant2: User;
  lastMessage?: Message;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
  readAt?: string;
}

export interface Repost {
  id: string;
  userId: string;
  songId: string;
  createdAt: string;
  user?: User;
  song?: Song;
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  coverUrl: string;
  songs: Song[];
  createdBy: string;
  isAiGenerated?: boolean;
}

export interface ListeningHistory {
  songId: string;
  playedAt: string;
  duration: number;
}

export interface UserStats {
  totalListeningTime: number; // in minutes
  topArtists: { name: string; plays: number }[];
  topSongs: { song: Song; plays: number }[];
  topGenres: { genre: string; count: number }[];
}

export interface Podcast {
  id: string;
  userId: string;
  title: string;
  description: string;
  coverUrl?: string;
  audioUrl?: string;
  duration: number;
  category?: string;
  isLive: boolean;
  wasLive: boolean;
  viewersCount: number;
  likes: number;
  createdAt: string;
  updatedAt: string;
  endedAt?: string;
  host?: User;
}

export interface StreamViewer {
  id: string;
  podcastId: string;
  userId?: string;
  joinedAt: string;
  lastSeenAt: string;
}
