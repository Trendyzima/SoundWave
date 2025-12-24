import { useParams, Navigate } from 'react-router-dom';
import { mockSongs, mockComments } from '../constants/mockData';
import { Play, Heart, Share2, MoreHorizontal, MessageCircle } from 'lucide-react';
import { usePlayerStore } from '../stores/playerStore';
import { formatNumber, formatDate, formatDuration } from '../lib/utils';
import Comment from '../components/features/Comment';
import { useState } from 'react';
import { useAuthStore } from '../stores/authStore';

export default function SongPage() {
  const { id } = useParams();
  const { user } = useAuthStore();
  const song = mockSongs.find((s) => s.id === id);
  const { play, currentSong, isPlaying, togglePlay } = usePlayerStore();
  const [newComment, setNewComment] = useState('');
  
  if (!song) {
    return <Navigate to="/" />;
  }
  
  const isCurrentSong = currentSong?.id === song.id;
  const songComments = mockComments.filter((c) => c.songId === song.id);
  
  const handlePlayToggle = () => {
    if (isCurrentSong) {
      togglePlay();
    } else {
      play(song);
    }
  };
  
  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock comment submission
    console.log('New comment:', newComment);
    setNewComment('');
  };
  
  return (
    <div className="min-h-screen pb-32 pt-20">
      {/* Hero Section */}
      <section className="relative mb-8 overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={song.coverUrl}
            alt={song.title}
            className="w-full h-full object-cover blur-3xl scale-110 opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />
        </div>
        
        <div className="relative max-w-screen-2xl mx-auto px-4 sm:px-6 py-12">
          <div className="flex flex-col md:flex-row gap-8 items-start md:items-end">
            {/* Album Art */}
            <div className="w-full md:w-64 lg:w-80 flex-shrink-0">
              <img
                src={song.coverUrl}
                alt={song.title}
                className="w-full aspect-square object-cover rounded-2xl shadow-2xl"
              />
            </div>
            
            {/* Song Info */}
            <div className="flex-1 min-w-0 space-y-4">
              <div className="inline-block px-3 py-1 glass-card rounded-full text-sm font-semibold">
                {song.genre}
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
                {song.title}
              </h1>
              
              <div className="flex flex-wrap items-center gap-4 text-lg">
                <span className="font-semibold">{song.artist}</span>
                <span className="text-muted-foreground">•</span>
                <span className="text-muted-foreground">{song.album}</span>
                <span className="text-muted-foreground">•</span>
                <span className="text-muted-foreground">{formatDate(song.releaseDate)}</span>
              </div>
              
              <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
                <span>{formatNumber(song.plays)} plays</span>
                <span>{formatNumber(song.likes)} likes</span>
                <span>{formatDuration(song.duration)}</span>
              </div>
              
              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-4">
                <button
                  onClick={handlePlayToggle}
                  className="px-8 py-3 bg-gradient-primary rounded-full font-semibold hover:scale-105 transition-transform flex items-center gap-2"
                >
                  <Play className={`w-5 h-5 ${isPlaying && isCurrentSong ? 'animate-pulse' : ''}`} />
                  {isPlaying && isCurrentSong ? 'Playing' : 'Play'}
                </button>
                
                <button className="px-6 py-3 glass-card rounded-full hover:bg-white/10 transition-colors flex items-center gap-2">
                  <Heart className="w-5 h-5" />
                  <span className="font-semibold">Like</span>
                </button>
                
                <button className="px-6 py-3 glass-card rounded-full hover:bg-white/10 transition-colors flex items-center gap-2">
                  <Share2 className="w-5 h-5" />
                  <span className="font-semibold">Share</span>
                </button>
                
                <button className="p-3 glass-card rounded-full hover:bg-white/10 transition-colors">
                  <MoreHorizontal className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Comments Section */}
      <section className="max-w-screen-2xl mx-auto px-4 sm:px-6">
        <div className="max-w-4xl">
          <div className="flex items-center gap-3 mb-6">
            <MessageCircle className="w-6 h-6 text-primary" />
            <h2 className="text-2xl sm:text-3xl font-bold">Community Reactions</h2>
            <span className="text-muted-foreground">({songComments.length})</span>
          </div>
          
          {/* Comment Input */}
          <form onSubmit={handleCommentSubmit} className="glass-card p-4 rounded-xl mb-8">
            <div className="flex gap-3">
              <img
                src={user?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop'}
                alt="Your avatar"
                className="w-10 h-10 rounded-full object-cover flex-shrink-0"
              />
              <div className="flex-1">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Share your thoughts about this song..."
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                  rows={3}
                />
                <div className="flex justify-end mt-3">
                  <button
                    type="submit"
                    disabled={!newComment.trim()}
                    className="px-6 py-2 bg-gradient-primary rounded-lg font-semibold hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Post Comment
                  </button>
                </div>
              </div>
            </div>
          </form>
          
          {/* Comments List */}
          <div className="space-y-6">
            {songComments.map((comment) => (
              <Comment key={comment.id} comment={comment} />
            ))}
          </div>
          
          {songComments.length === 0 && (
            <div className="text-center py-12">
              <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">No comments yet. Be the first to share your thoughts!</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
