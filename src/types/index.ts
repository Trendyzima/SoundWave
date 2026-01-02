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
  videoUrl?: string;
  lyrics?: string;
  hasLyrics?: boolean;
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
  isCollaborative?: boolean;
  collaborators?: string[];
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

export interface DJMix {
  id: string;
  userId: string;
  title: string;
  description?: string;
  coverUrl?: string;
  audioUrl: string;
  duration: number;
  genre?: string;
  tracklist?: { title: string; artist: string; timestamp: number }[];
  plays: number;
  likes: number;
  downloads: number;
  createdAt: string;
  updatedAt: string;
  user?: User;
}

export interface Event {
  id: string;
  organizerId: string;
  title: string;
  description?: string;
  coverUrl?: string;
  eventType: string;
  venueName?: string;
  venueAddress?: string;
  city?: string;
  country?: string;
  startDate: string;
  endDate?: string;
  ticketPrice: number;
  totalTickets?: number;
  availableTickets?: number;
  isFree: boolean;
  isOnline: boolean;
  meetingLink?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  organizer?: User;
}

export interface TicketPurchase {
  id: string;
  eventId: string;
  userId: string;
  quantity: number;
  totalAmount: number;
  paymentStatus: string;
  ticketCode: string;
  purchasedAt: string;
  event?: Event;
}

export interface MusicVideo {
  id: string;
  userId: string;
  songId?: string;
  title: string;
  description?: string;
  videoUrl: string;
  thumbnailUrl?: string;
  duration: number;
  views: number;
  likes: number;
  createdAt: string;
  updatedAt: string;
  user?: User;
  song?: Song;
}

export interface Challenge {
  id: string;
  createdBy: string;
  title: string;
  description?: string;
  coverUrl?: string;
  challengeType: string;
  rules?: any;
  prizeDescription?: string;
  startDate: string;
  endDate: string;
  status: string;
  createdAt: string;
  creator?: User;
}

export interface ChallengeSubmission {
  id: string;
  challengeId: string;
  userId: string;
  songId?: string;
  videoUrl?: string;
  description?: string;
  votes: number;
  createdAt: string;
  user?: User;
  song?: Song;
}

export interface Advertisement {
  id: string;
  title: string;
  description?: string;
  adType: string;
  imageUrl?: string;
  videoUrl?: string;
  linkUrl?: string;
  placement: string;
  startDate?: string;
  endDate?: string;
  impressions: number;
  clicks: number;
  budget?: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface Album {
  id: string;
  title: string;
  artist: string;
  coverUrl: string;
  releaseDate: string;
  genre: string;
  songs: Song[];
  totalDuration: number;
  plays: number;
}

export interface Artist {
  id: string;
  name: string;
  bio?: string;
  avatarUrl: string;
  coverUrl?: string;
  genre: string;
  followers: number;
  topSongs: Song[];
  albums: Album[];
  monthlyListeners: number;
}

export interface Chart {
  id: string;
  type: 'global' | 'regional' | 'genre';
  region?: string;
  genre?: string;
  songs: (Song & { rank: number; change: number })[];
  updatedAt: string;
}

export interface DailyMix {
  id: string;
  userId: string;
  title: string;
  description: string;
  coverUrl: string;
  songs: Song[];
  genre: string;
  createdAt: string;
}

export interface MoodCategory {
  id: string;
  name: string;
  description: string;
  coverUrl: string;
  color: string;
  playlists: Playlist[];
}

export interface Lyrics {
  songId: string;
  lines: {
    time: number; // seconds
    text: string;
  }[];
  synced: boolean;
}
