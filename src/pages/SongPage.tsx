import { useParams, Navigate, useNavigate, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Song, Comment as CommentType } from '../types';
import { Play, Heart, Share2, MoreHorizontal, MessageCircle, Loader2, Edit2, Trash2, Users, Copy, Mic } from 'lucide-react';
import { usePlayerStore } from '../stores/playerStore';
import { formatNumber, formatDate, formatDuration } from '../lib/utils';
import Comment from '../components/features/Comment';
import { useAuth } from '../stores/authStore';

export default function SongPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [song, setSong] = useState<Song | null>(null);
  const [songOwnerId, setSongOwnerId] = useState<string | null>(null);
  const [comments, setComments] = useState<CommentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const { play, currentSong, isPlaying, togglePlay } = usePlayerStore();
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  const isOwner = user?.id === songOwnerId;
  
  useEffect(() => {
    if (id) {
      fetchSongData();
    }
  }, [id]);
  
  const fetchSongData = async () => {
    try {
      // Fetch song
      const { data: songData, error: songError } = await supabase
        .from('songs')
        .select('*')
        .eq('id', id)
        .single();
      
      if (songError) throw songError;
      
      setSongOwnerId(songData.user_id);
      
      const mappedSong: Song = {
        id: songData.id,
        title: songData.title,
        artist: songData.artist,
        album: songData.album || '',
        coverUrl: songData.cover_url || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop',
        duration: songData.duration,
        audioUrl: songData.audio_url,
        plays: songData.plays,
        likes: songData.likes,
        releaseDate: songData.release_date || '',
        genre: songData.genre || '',
        description: songData.description || '',
      };
      
      setSong(mappedSong);
      
      // Fetch comments with user profiles
      const { data: commentsData, error: commentsError } = await supabase
        .from('comments')
        .select(`
          *,
          user_profiles (username, email)
        `)
        .eq('song_id', id)
        .is('parent_id', null)
        .order('created_at', { ascending: false });
      
      if (commentsError) throw commentsError;
      
      // Fetch replies for each comment
      const commentsWithReplies = await Promise.all(
        (commentsData || []).map(async (comment: any) => {
          const { data: repliesData } = await supabase
            .from('comments')
            .select(`
              *,
              user_profiles (username, email)
            `)
            .eq('parent_id', comment.id)
            .order('created_at', { ascending: true });
          
          const replies = (repliesData || []).map((reply: any) => ({
            id: reply.id,
            songId: reply.song_id,
            userId: reply.user_id,
            username: reply.user_profiles?.username || 'User',
            userAvatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(reply.user_profiles?.username || 'User')}&background=random`,
            content: reply.content,
            timestamp: reply.created_at,
            likes: reply.likes,
            replies: [],
          }));
          
          return {
            id: comment.id,
            songId: comment.song_id,
            userId: comment.user_id,
            username: comment.user_profiles?.username || 'User',
            userAvatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.user_profiles?.username || 'User')}&background=random`,
            content: comment.content,
            timestamp: comment.created_at,
            likes: comment.likes,
            replies,
          };
        })
      );
      
      setComments(commentsWithReplies);
      
      // Check if user liked this song
      if (user) {
        const { data: likeData } = await supabase
          .from('likes')
          .select('id')
          .eq('song_id', id)
          .eq('user_id', user.id)
          .single();
        
        setIsLiked(!!likeData);
      }
      
    } catch (error) {
      console.error('Error fetching song data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handlePlayToggle = () => {
    if (!song) return;
    
    const isCurrentSong = currentSong?.id === song.id;
    if (isCurrentSong) {
      togglePlay();
    } else {
      play(song);
      
      // Track play in listening history
      if (user) {
        supabase
          .from('listening_history')
          .insert({
            user_id: user.id,
            song_id: song.id,
            duration_listened: 0,
          })
          .then(() => {
            // Update play count
            supabase
              .from('songs')
              .update({ plays: song.plays + 1 })
              .eq('id', song.id);
          });
      }
    }
  };
  
  const handleLikeToggle = async () => {
    if (!user || !song) return;
    
    try {
      if (isLiked) {
        // Unlike
        await supabase
          .from('likes')
          .delete()
          .eq('song_id', song.id)
          .eq('user_id', user.id);
        
        await supabase
          .from('songs')
          .update({ likes: Math.max(0, song.likes - 1) })
          .eq('id', song.id);
        
        setIsLiked(false);
        setSong({ ...song, likes: Math.max(0, song.likes - 1) });
      } else {
        // Like
        await supabase
          .from('likes')
          .insert({
            song_id: song.id,
            user_id: user.id,
          });
        
        await supabase
          .from('songs')
          .update({ likes: song.likes + 1 })
          .eq('id', song.id);
        
        setIsLiked(true);
        setSong({ ...song, likes: song.likes + 1 });
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };
  
  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newComment.trim() || !user || !song) return;
    
    setSubmittingComment(true);
    
    try {
      const { data, error } = await supabase
        .from('comments')
        .insert({
          song_id: song.id,
          user_id: user.id,
          content: newComment.trim(),
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Add comment to local state
      const newCommentObj: CommentType = {
        id: data.id,
        songId: song.id,
        userId: user.id,
        username: user.username,
        userAvatar: user.avatarUrl,
        content: newComment.trim(),
        timestamp: data.created_at,
        likes: 0,
        replies: [],
      };
      
      setComments([newCommentObj, ...comments]);
      setNewComment('');
    } catch (error) {
      console.error('Error posting comment:', error);
    } finally {
      setSubmittingComment(false);
    }
  };
  
  const handleEdit = () => {
    navigate(`/upload?edit=${id}`);
  };
  
  const handleDelete = async () => {
    if (!song || !isOwner) return;
    
    const confirmed = window.confirm(
      `Are you sure you want to delete "${song.title}"? This action cannot be undone.`
    );
    
    if (!confirmed) return;
    
    setDeleting(true);
    try {
      // Delete from storage
      if (song.audioUrl) {
        const audioPath = song.audioUrl.split('/').pop();
        if (audioPath) {
          await supabase.storage.from('audio').remove([audioPath]);
        }
      }
      
      if (song.coverUrl && !song.coverUrl.includes('unsplash')) {
        const coverPath = song.coverUrl.split('/').pop();
        if (coverPath) {
          await supabase.storage.from('covers').remove([coverPath]);
        }
      }
      
      // Delete from database (cascade will handle related records)
      const { error } = await supabase
        .from('songs')
        .delete()
        .eq('id', song.id);
      
      if (error) throw error;
      
      navigate('/');
    } catch (error) {
      console.error('Error deleting song:', error);
      alert('Failed to delete song. Please try again.');
    } finally {
      setDeleting(false);
    }
  };
  
  const handleRemix = () => {
    // Navigate to upload page with remix parameter
    navigate(`/upload?remix=${id}`);
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!song) {
    return <Navigate to="/" />;
  }
  
  const isCurrentSong = currentSong?.id === song.id;
  
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
              {song.genre && (
                <div className="inline-block px-3 py-1 glass-card rounded-full text-sm font-semibold">
                  {song.genre}
                </div>
              )}
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
                {song.title}
              </h1>
              
              <div className="flex flex-wrap items-center gap-4 text-lg">
                <span className="font-semibold">{song.artist}</span>
                {song.album && (
                  <>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-muted-foreground">{song.album}</span>
                  </>
                )}
                {song.releaseDate && (
                  <>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-muted-foreground">{formatDate(song.releaseDate)}</span>
                  </>
                )}
              </div>
              
              {song.description && (
                <p className="text-muted-foreground">{song.description}</p>
              )}
              
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
                
                <button
                  onClick={handleLikeToggle}
                  className={`px-6 py-3 glass-card rounded-full hover:bg-white/10 transition-colors flex items-center gap-2 ${
                    isLiked ? 'text-primary' : ''
                  }`}
                >
                  <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                  <span className="font-semibold">{isLiked ? 'Liked' : 'Like'}</span>
                </button>
                
                <Link
                  to={`/karaoke?song=${song.id}`}
                  className="px-6 py-3 glass-card rounded-full hover:bg-white/10 transition-colors flex items-center gap-2"
                >
                  <Mic className="w-5 h-5" />
                  <span className="font-semibold">Karaoke</span>
                </Link>
                
                {!isOwner && (
                  <button
                    onClick={handleRemix}
                    className="px-6 py-3 glass-card rounded-full hover:bg-white/10 transition-colors flex items-center gap-2"
                  >
                    <Copy className="w-5 h-5" />
                    <span className="font-semibold">Remix</span>
                  </button>
                )}
                
                <button className="px-6 py-3 glass-card rounded-full hover:bg-white/10 transition-colors flex items-center gap-2">
                  <Share2 className="w-5 h-5" />
                  <span className="font-semibold">Share</span>
                </button>
                
                <div className="relative">
                  <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="p-3 glass-card rounded-full hover:bg-white/10 transition-colors"
                  >
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                  
                  {showMenu && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowMenu(false)}
                      />
                      <div className="absolute right-0 mt-2 w-48 glass-card rounded-lg shadow-lg z-20 overflow-hidden">
                        {isOwner ? (
                          <>
                            <button
                              onClick={() => {
                                setShowMenu(false);
                                handleEdit();
                              }}
                              className="w-full px-4 py-3 hover:bg-white/10 transition-colors flex items-center gap-3 text-left"
                            >
                              <Edit2 className="w-4 h-4" />
                              Edit Song
                            </button>
                            <button
                              onClick={() => {
                                setShowMenu(false);
                                handleDelete();
                              }}
                              disabled={deleting}
                              className="w-full px-4 py-3 hover:bg-red-500/10 hover:text-red-500 transition-colors flex items-center gap-3 text-left disabled:opacity-50"
                            >
                              {deleting ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                              {deleting ? 'Deleting...' : 'Delete Song'}
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => {
                                setShowMenu(false);
                                handleRemix();
                              }}
                              className="w-full px-4 py-3 hover:bg-white/10 transition-colors flex items-center gap-3 text-left"
                            >
                              <Copy className="w-4 h-4" />
                              Create Remix
                            </button>
                            <button className="w-full px-4 py-3 hover:bg-white/10 transition-colors flex items-center gap-3 text-left">
                              <Users className="w-4 h-4" />
                              Request Collab
                            </button>
                          </>
                        )}
                      </div>
                    </>
                  )}
                </div>
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
            <span className="text-muted-foreground">({comments.length})</span>
          </div>
          
          {/* Comment Input */}
          {user && (
            <form onSubmit={handleCommentSubmit} className="glass-card p-4 rounded-xl mb-8">
              <div className="flex gap-3">
                <img
                  src={user.avatarUrl}
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
                      disabled={!newComment.trim() || submittingComment}
                      className="px-6 py-2 bg-gradient-primary rounded-lg font-semibold hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {submittingComment && <Loader2 className="w-4 h-4 animate-spin" />}
                      {submittingComment ? 'Posting...' : 'Post Comment'}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          )}
          
          {/* Comments List */}
          <div className="space-y-6">
            {comments.map((comment) => (
              <Comment key={comment.id} comment={comment} />
            ))}
          </div>
          
          {comments.length === 0 && (
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
