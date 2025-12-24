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
  bio: string;
  joinedDate: string;
  followers: number;
  following: number;
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
  replies: Comment[];
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
