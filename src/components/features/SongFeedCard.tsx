import { Link, useNavigate } from 'react-router-dom';
import { Song } from '../../types';
import { Heart, MessageCircle, Repeat2, Share2, Play, BarChart3, Hash } from 'lucide-react';
import { formatDuration } from '../../lib/utils';
import { usePlayerStore } from '../../stores/playerStore';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../stores/authStore';

interface SongFeedCardProps {
  song: Song;
  onHashtagClick?: (hashtag: string) => void;
}

export default function SongFeedCard({ song, onHashtagClick }: SongFeedCardProps) {
  const navigate = useNavigate();
  const { playSong, currentSong, isPlaying, togglePlay } = usePlayerStore();
  const { user } = useAuth();
  const [liked, setLiked] = useState(false);
  const [reposted, setReposted] = useState(false);
  const [localLikes, setLocalLikes] = useState(song.likes);
  const [localReposts, setLocalReposts] = useState(0);
  const [hashtags, setHashtags] = useState<string[]>(song.hashtags || []);
  const [commentsCount, setCommentsCount] = useState(0);
  
  const isCurrentSong = currentSong?.id === song.id;
  
  useEffect(() => {
    fetchHashtags();
    fetchCommentsCount();
    fetchRepostsCount();
    if (user) {
      checkLiked();
      checkReposted();
    }
  }, [song.id, user]);
  
  const fetchHashtags = async () => {
    try {
      const { data, error } = await supabase
        .from('song_hashtags')
        .select('hashtag_id, hashtags(tag)')
        .eq('song_id', song.id);
      
      if (error) throw error;
      
      const tags = data?.map((item: any) => item.hashtags?.tag).filter(Boolean) || [];
      setHashtags(tags);
    } catch (error) {
      console.error('Error fetching hashtags:', error);
    }
  };
  
  const fetchCommentsCount = async () => {
    try {
      const { count, error } = await supabase
        .from('comments')
        .select('id', { count: 'exact', head: true })
        .eq('song_id', song.id);
      
      if (error) throw error;
      setCommentsCount(count || 0);
    } catch (error) {
      console.error('Error fetching comments count:', error);
    }
  };
  
  const fetchRepostsCount = async () => {
    try {
      const { count, error } = await supabase
        .from('reposts')
        .select('id', { count: 'exact', head: true })
        .eq('song_id', song.id);
      
      if (error) throw error;
      setLocalReposts(count || 0);
    } catch (error) {
      console.error('Error fetching reposts count:', error);
    }
  };
  
  const checkLiked = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('likes')
        .select('id')
        .eq('user_id', user.id)
        .eq('song_id', song.id)
        .single();
      
      setLiked(!!data);
    } catch (error) {
      // Not liked
    }
  };
  
  const checkReposted = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('reposts')
        .select('id')
        .eq('user_id', user.id)
        .eq('song_id', song.id)
        .single();
      
      setReposted(!!data);
    } catch (error) {
      // Not reposted
    }
  };
  
  const handlePlay = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isCurrentSong) {
      togglePlay();
    } else {
      playSong(song);
    }
  };
  
  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) return;
    
    try {
      if (liked) {
        await supabase
          .from('likes')
          .delete()
          .eq('user_id', user.id)
          .eq('song_id', song.id);
        setLiked(false);
        setLocalLikes(prev => prev - 1);
      } else {
        await supabase
          .from('likes')
          .insert({ user_id: user.id, song_id: song.id });
        setLiked(true);
        setLocalLikes(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };
  
  const handleRepost = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) return;
    
    try {
      if (reposted) {
        await supabase
          .from('reposts')
          .delete()
          .eq('user_id', user.id)
          .eq('song_id', song.id);
        setReposted(false);
        setLocalReposts(prev => prev - 1);
      } else {
        await supabase
          .from('reposts')
          .insert({ user_id: user.id, song_id: song.id });
        setReposted(true);
        setLocalReposts(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error toggling repost:', error);
    }
  };
  
  const handleHashtagClick = (e: React.MouseEvent, tag: string) => {
    e.preventDefault();
    if (onHashtagClick) {
      onHashtagClick(tag);
    } else {
      navigate(`/search?hashtag=${encodeURIComponent(tag)}`);
    }
  };
  
  return (
    <article className="border-b border-white/10 px-4 py-3 hover:bg-white/[0.02] transition-colors">
      <div className="flex gap-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center">
            <span className="text-sm font-bold">{song.artist[0]}</span>
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-1 mb-1">
            <Link to={`/song/${song.id}`} className="font-bold hover:underline">
              {song.artist}
            </Link>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground text-sm">
              {formatDuration(song.duration)}
            </span>
          </div>
          
          {/* Song Title */}
          <Link to={`/song/${song.id}`}>
            <p className="mb-2 text-[15px]">{song.title}</p>
          </Link>
          
          {/* Description with Hashtags */}
          {song.description && (
            <p className="mb-3 text-[15px] text-muted-foreground">
              {song.description.split(/(\s+)/).map((word, index) => {
                if (word.startsWith('#')) {
                  return (
                    <button
                      key={index}
                      onClick={(e) => handleHashtagClick(e, word.toLowerCase())}
                      className="text-primary hover:underline"
                    >
                      {word}
                    </button>
                  );
                }
                return <span key={index}>{word}</span>;
              })}
            </p>
          )}
          
          {/* Hashtags Pills */}
          {hashtags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {hashtags.map((tag, index) => (
                <button
                  key={index}
                  onClick={(e) => handleHashtagClick(e, tag)}
                  className="px-2 py-1 bg-primary/10 hover:bg-primary/20 text-primary rounded-full text-xs flex items-center gap-1 transition-colors"
                >
                  <Hash className="w-3 h-3" />
                  {tag.substring(1)}
                </button>
              ))}
            </div>
          )}
          
          {/* Song Preview Card */}
          <Link to={`/song/${song.id}`} className="block mb-3">
            <div className="border border-white/10 rounded-2xl overflow-hidden hover:bg-white/5 transition-colors">
              <div className="relative aspect-video bg-gradient-dark">
                <img
                  src={song.coverUrl}
                  alt={song.title}
                  className="w-full h-full object-cover opacity-60"
                />
                <button
                  onClick={handlePlay}
                  className="absolute inset-0 flex items-center justify-center group"
                >
                  <div className="w-16 h-16 rounded-full bg-primary/90 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Play className="w-7 h-7 ml-1" fill="currentColor" />
                  </div>
                </button>
              </div>
              
              <div className="p-3 border-t border-white/10">
                <p className="font-semibold mb-1">{song.title}</p>
                <p className="text-sm text-muted-foreground">
                  {song.album && `${song.album} · `}
                  {song.genre}
                </p>
              </div>
            </div>
          </Link>
          
          {/* Interaction Buttons */}
          <div className="flex items-center justify-between max-w-md -ml-2">
            <Link
              to={`/song/${song.id}`}
              className="flex items-center gap-2 px-2 py-1 rounded-full hover:bg-primary/10 hover:text-primary transition-colors group"
            >
              <MessageCircle className="w-[18px] h-[18px]" />
              <span className="text-sm text-muted-foreground group-hover:text-primary">{commentsCount}</span>
            </Link>
            
            <button
              onClick={handleRepost}
              className={`flex items-center gap-2 px-2 py-1 rounded-full transition-colors group ${
                reposted
                  ? 'text-green-500'
                  : 'hover:bg-green-500/10 hover:text-green-500'
              }`}
            >
              <Repeat2 className="w-[18px] h-[18px]" />
              <span className={`text-sm ${reposted ? 'text-green-500' : 'text-muted-foreground group-hover:text-green-500'}`}>
                {localReposts}
              </span>
            </button>
            
            <button
              onClick={handleLike}
              className={`flex items-center gap-2 px-2 py-1 rounded-full transition-colors group ${
                liked
                  ? 'text-pink-500'
                  : 'hover:bg-pink-500/10 hover:text-pink-500'
              }`}
            >
              <Heart className={`w-[18px] h-[18px] ${liked ? 'fill-current' : ''}`} />
              <span className={`text-sm ${liked ? 'text-pink-500' : 'text-muted-foreground group-hover:text-pink-500'}`}>
                {localLikes}
              </span>
            </button>
            
            <button className="flex items-center gap-2 px-2 py-1 rounded-full hover:bg-primary/10 hover:text-primary transition-colors group">
              <BarChart3 className="w-[18px] h-[18px]" />
              <span className="text-sm text-muted-foreground group-hover:text-primary">
                {song.plays}
              </span>
            </button>
            
            <button className="flex items-center gap-2 px-2 py-1 rounded-full hover:bg-primary/10 hover:text-primary transition-colors group">
              <Share2 className="w-[18px] h-[18px]" />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
