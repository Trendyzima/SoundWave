import { useState, useEffect, useRef } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../stores/authStore';
import { supabase } from '../lib/supabase';
import { Podcast, User } from '../types';
import { 
  Loader2, Radio, Users, Heart, Share2, MessageCircle, 
  StopCircle, Play, Pause, Volume2, VolumeX, Mic 
} from 'lucide-react';

export default function PodcastPlayerPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const [podcast, setPodcast] = useState<Podcast | null>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [viewers, setViewers] = useState(0);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState<any[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<number | null>(null);
  
  const isHost = user?.id === podcast?.userId;
  
  useEffect(() => {
    if (!authLoading && isAuthenticated && id) {
      fetchPodcast();
    }
  }, [isAuthenticated, authLoading, id]);
  
  useEffect(() => {
    if (podcast?.isLive && isHost && !isRecording) {
      // Auto-start recording for host when podcast is live
      startRecording();
    }
    
    if (podcast?.isLive) {
      // Join as viewer
      joinStream();
      
      // Poll for updates every 3 seconds
      const interval = setInterval(() => {
        updateViewerCount();
        updateHeartbeat();
      }, 3000);
      
      return () => {
        clearInterval(interval);
        leaveStream();
        if (isRecording) {
          stopRecording();
        }
      };
    }
  }, [podcast?.isLive, isHost]);
  
  const fetchPodcast = async () => {
    if (!id) return;
    
    try {
      const { data, error } = await supabase
        .from('podcasts')
        .select('*, user_profiles(*)')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      const mappedPodcast: Podcast = {
        id: data.id,
        userId: data.user_id,
        title: data.title,
        description: data.description || '',
        coverUrl: data.cover_url,
        audioUrl: data.audio_url,
        duration: data.duration,
        category: data.category,
        isLive: data.is_live,
        wasLive: data.was_live,
        viewersCount: data.viewers_count || 0,
        likes: data.likes || 0,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        endedAt: data.ended_at,
        host: data.user_profiles ? {
          id: data.user_profiles.id,
          username: data.user_profiles.username || data.user_profiles.email.split('@')[0],
          email: data.user_profiles.email,
          avatarUrl: data.user_profiles.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.user_profiles.id}`,
          bio: data.user_profiles.bio,
          location: data.user_profiles.location,
          website: data.user_profiles.website,
          coverUrl: data.user_profiles.cover_url,
          joinedDate: data.user_profiles.created_at,
          followersCount: data.user_profiles.followers_count || 0,
          followingCount: data.user_profiles.following_count || 0,
        } : undefined,
      };
      
      setPodcast(mappedPodcast);
      setViewers(mappedPodcast.viewersCount);
      
      // Check if liked
      if (user) {
        const { data: likeData } = await supabase
          .from('podcast_likes')
          .select('id')
          .eq('user_id', user.id)
          .eq('podcast_id', id)
          .single();
        
        setLiked(!!likeData);
      }
    } catch (error) {
      console.error('Error fetching podcast:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);
      
      // Start recording timer
      recordingIntervalRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
      console.log('Recording started');
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Failed to access microphone. Please allow microphone access to record.');
    }
  };
  
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      
      console.log('Recording stopped');
    }
  };
  
  const joinStream = async () => {
    if (!id || !user) return;
    
    try {
      await supabase
        .from('stream_viewers')
        .insert({
          podcast_id: id,
          user_id: user.id,
        });
    } catch (error) {
      console.error('Error joining stream:', error);
    }
  };
  
  const leaveStream = async () => {
    if (!id || !user) return;
    
    try {
      await supabase
        .from('stream_viewers')
        .delete()
        .eq('podcast_id', id)
        .eq('user_id', user.id);
    } catch (error) {
      console.error('Error leaving stream:', error);
    }
  };
  
  const updateHeartbeat = async () => {
    if (!id || !user) return;
    
    try {
      await supabase
        .from('stream_viewers')
        .update({ last_seen_at: new Date().toISOString() })
        .eq('podcast_id', id)
        .eq('user_id', user.id);
    } catch (error) {
      console.error('Error updating heartbeat:', error);
    }
  };
  
  const updateViewerCount = async () => {
    if (!id) return;
    
    try {
      // Clean up stale viewers (not seen in last 10 seconds)
      const tenSecondsAgo = new Date(Date.now() - 10000).toISOString();
      await supabase
        .from('stream_viewers')
        .delete()
        .eq('podcast_id', id)
        .lt('last_seen_at', tenSecondsAgo);
      
      // Get current count
      const { count } = await supabase
        .from('stream_viewers')
        .select('id', { count: 'exact', head: true })
        .eq('podcast_id', id);
      
      setViewers(count || 0);
      
      // Update podcast viewers count
      await supabase
        .from('podcasts')
        .update({ viewers_count: count || 0 })
        .eq('id', id);
    } catch (error) {
      console.error('Error updating viewer count:', error);
    }
  };
  
  const handleEndStream = async () => {
    if (!id || !isHost) return;
    
    const confirmed = window.confirm(
      'Are you sure you want to end this live stream? It will be saved as a recorded podcast.'
    );
    
    if (!confirmed) return;
    
    try {
      // Stop recording first
      stopRecording();
      
      // Wait a bit for the recorder to finish
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Upload recorded audio if available
      let audioUrl = null;
      if (audioChunksRef.current.length > 0) {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioFileName = `podcast_${id}_${Date.now()}.webm`;
        
        console.log('Uploading audio:', audioFileName, 'Size:', audioBlob.size);
        
        const { data: audioData, error: audioError } = await supabase.storage
          .from('audio')
          .upload(audioFileName, audioBlob, {
            cacheControl: '3600',
            upsert: false,
          });
        
        if (audioError) throw audioError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('audio')
          .getPublicUrl(audioFileName);
        audioUrl = publicUrl;
        
        console.log('Audio uploaded successfully:', audioUrl);
      }
      
      // Update podcast with audio URL and end time
      await supabase
        .from('podcasts')
        .update({
          is_live: false,
          ended_at: new Date().toISOString(),
          audio_url: audioUrl,
          duration: recordingTime,
        })
        .eq('id', id);
      
      navigate('/podcasts');
    } catch (error) {
      console.error('Error ending stream:', error);
      alert('Failed to save recording. Please try again.');
    }
  };
  
  const handleLike = async () => {
    if (!user || !id) return;
    
    try {
      if (liked) {
        await supabase
          .from('podcast_likes')
          .delete()
          .eq('user_id', user.id)
          .eq('podcast_id', id);
        
        setLiked(false);
        if (podcast) {
          setPodcast({ ...podcast, likes: podcast.likes - 1 });
        }
      } else {
        await supabase
          .from('podcast_likes')
          .insert({ user_id: user.id, podcast_id: id });
        
        setLiked(true);
        if (podcast) {
          setPodcast({ ...podcast, likes: podcast.likes + 1 });
        }
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };
  
  const togglePlay = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };
  
  const toggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };
  
  const formatRecordingTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };
  
  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-14">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/auth" />;
  }
  
  if (!podcast) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-14">
        <p className="text-muted-foreground">Podcast not found</p>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen pb-20 md:pb-4 pt-14">
      <div className="max-w-screen-xl mx-auto md:ml-64 lg:ml-72 md:mr-0">
        <div className="max-w-4xl mx-auto px-4 py-6">
          {/* Player */}
          <div className="glass-card rounded-2xl overflow-hidden mb-6">
            <div className="relative aspect-video bg-gradient-to-br from-purple-500/30 to-pink-500/30 flex items-center justify-center">
              {podcast.coverUrl ? (
                <img
                  src={podcast.coverUrl}
                  alt={podcast.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Radio className="w-32 h-32 text-white/50" />
              )}
              
              {podcast.isLive && (
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  <div className="px-4 py-2 bg-red-500 rounded-full font-bold flex items-center gap-2 animate-pulse">
                    <div className="w-3 h-3 bg-white rounded-full" />
                    LIVE
                  </div>
                  {isHost && isRecording && (
                    <div className="px-4 py-2 bg-black/80 backdrop-blur-sm rounded-full font-bold flex items-center gap-2">
                      <Mic className="w-4 h-4 text-red-500 animate-pulse" />
                      {formatRecordingTime(recordingTime)}
                    </div>
                  )}
                </div>
              )}
              
              {!podcast.isLive && podcast.audioUrl && (
                <button
                  onClick={togglePlay}
                  className="absolute inset-0 flex items-center justify-center group"
                >
                  <div className="w-20 h-20 rounded-full bg-primary/90 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                    {isPlaying ? (
                      <Pause className="w-10 h-10" fill="currentColor" />
                    ) : (
                      <Play className="w-10 h-10 ml-1" fill="currentColor" />
                    )}
                  </div>
                </button>
              )}
            </div>
            
            <div className="p-6">
              <h1 className="text-2xl font-bold mb-2">{podcast.title}</h1>
              {podcast.description && (
                <p className="text-muted-foreground mb-4">{podcast.description}</p>
              )}
              
              <div className="flex items-center gap-4 mb-4">
                <img
                  src={podcast.host?.avatarUrl}
                  alt={podcast.host?.username}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div className="flex-1">
                  <p className="font-bold">{podcast.host?.username}</p>
                  <p className="text-sm text-muted-foreground">
                    {podcast.category}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-6 mb-4 text-sm">
                {podcast.isLive && (
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    <span className="font-semibold">{viewers} watching</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Heart className={`w-5 h-5 ${liked ? 'fill-pink-500 text-pink-500' : ''}`} />
                  <span className="font-semibold">{podcast.likes}</span>
                </div>
              </div>
              
              {/* Recording Status for Host */}
              {isHost && podcast.isLive && (
                <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <div className="flex items-center gap-2 text-sm">
                    {isRecording ? (
                      <>
                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                        <span className="font-semibold">Recording in progress</span>
                        <span className="text-muted-foreground ml-auto">
                          {formatRecordingTime(recordingTime)}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-muted-foreground">Recording stopped</span>
                        <button
                          onClick={startRecording}
                          className="ml-auto px-3 py-1 bg-red-500 hover:bg-red-600 rounded-full text-sm font-semibold transition-colors"
                        >
                          Resume Recording
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
              
              <div className="flex gap-3">
                <button
                  onClick={handleLike}
                  className={`flex-1 py-3 rounded-lg font-semibold transition-colors ${
                    liked
                      ? 'bg-pink-500/20 text-pink-500 hover:bg-pink-500/30'
                      : 'bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <Heart className={`w-5 h-5 inline mr-2 ${liked ? 'fill-current' : ''}`} />
                  {liked ? 'Liked' : 'Like'}
                </button>
                
                <button className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-lg font-semibold transition-colors">
                  <Share2 className="w-5 h-5 inline mr-2" />
                  Share
                </button>
                
                {isHost && podcast.isLive && (
                  <button
                    onClick={handleEndStream}
                    className="flex-1 py-3 bg-red-500 hover:bg-red-600 rounded-lg font-semibold transition-colors"
                  >
                    <StopCircle className="w-5 h-5 inline mr-2" />
                    End & Save
                  </button>
                )}
                
                {!podcast.isLive && podcast.audioUrl && (
                  <button
                    onClick={toggleMute}
                    className="px-4 py-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    {isMuted ? (
                      <VolumeX className="w-5 h-5" />
                    ) : (
                      <Volume2 className="w-5 h-5" />
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
          
          {/* Audio Element for Recorded Podcasts */}
          {!podcast.isLive && podcast.audioUrl && (
            <audio
              ref={audioRef}
              src={podcast.audioUrl}
              onEnded={() => setIsPlaying(false)}
              className="hidden"
            />
          )}
          
          {/* Live Chat / Comments Section */}
          <div className="glass-card rounded-2xl p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              {podcast.isLive ? 'Live Chat' : 'Comments'}
            </h2>
            
            <div className="space-y-4 mb-4 max-h-96 overflow-y-auto">
              {comments.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  {podcast.isLive ? 'Be the first to comment!' : 'No comments yet'}
                </p>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <img
                      src={comment.userAvatar}
                      alt={comment.username}
                      className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                    />
                    <div className="flex-1">
                      <p className="font-semibold">{comment.username}</p>
                      <p className="text-sm">{comment.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <div className="flex gap-2">
              <input
                type="text"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={podcast.isLive ? 'Say something...' : 'Add a comment...'}
                className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <button className="px-6 py-3 bg-primary hover:bg-primary/90 rounded-lg font-semibold transition-colors">
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
