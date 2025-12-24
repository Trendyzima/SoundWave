import { useState, useRef } from 'react';
import { useAuth } from '../stores/authStore';
import { Navigate, useNavigate } from 'react-router-dom';
import { Upload, Music, Image as ImageIcon, Loader2, CheckCircle2, Hash } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function UploadPage() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const audioInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    artist: '',
    album: '',
    genre: '',
    releaseDate: '',
    description: '',
  });
  
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string>('');
  
  if (!isAuthenticated) {
    return <Navigate to="/auth" />;
  }
  
  // Extract hashtags from description
  const extractHashtags = (text: string): string[] => {
    const hashtagRegex = /#[\w\u0080-\uFFFF]+/g;
    const matches = text.match(hashtagRegex);
    return matches ? matches.map(tag => tag.toLowerCase()) : [];
  };
  
  const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('audio/')) {
        setError('Please select a valid audio file');
        return;
      }
      setAudioFile(file);
      setError('');
    }
  };
  
  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file');
        return;
      }
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
      setError('');
    }
  };
  
  const getAudioDuration = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      const audio = new Audio();
      audio.addEventListener('loadedmetadata', () => {
        resolve(Math.floor(audio.duration));
      });
      audio.src = URL.createObjectURL(file);
    });
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!audioFile) {
      setError('Please select an audio file');
      return;
    }
    
    if (!user) {
      setError('You must be logged in to upload');
      return;
    }
    
    setUploading(true);
    setError('');
    setSuccess(false);
    
    try {
      // Get audio duration
      setUploadProgress('Analyzing audio file...');
      const duration = await getAudioDuration(audioFile);
      
      // Upload audio file
      setUploadProgress('Uploading audio file...');
      const audioFileName = `${Date.now()}_${audioFile.name}`;
      const { data: audioData, error: audioError } = await supabase.storage
        .from('audio')
        .upload(audioFileName, audioFile, {
          cacheControl: '3600',
          upsert: false,
        });
      
      if (audioError) throw audioError;
      
      // Get audio public URL
      const { data: { publicUrl: audioUrl } } = supabase.storage
        .from('audio')
        .getPublicUrl(audioFileName);
      
      // Upload cover image if provided
      let coverUrl = null;
      if (coverFile) {
        setUploadProgress('Uploading cover image...');
        const coverFileName = `${Date.now()}_${coverFile.name}`;
        const { data: coverData, error: coverError } = await supabase.storage
          .from('covers')
          .upload(coverFileName, coverFile, {
            cacheControl: '3600',
            upsert: false,
          });
        
        if (coverError) throw coverError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('covers')
          .getPublicUrl(coverFileName);
        coverUrl = publicUrl;
      }
      
      // Save song metadata to database
      setUploadProgress('Saving song details...');
      const { data: songData, error: dbError } = await supabase
        .from('songs')
        .insert({
          user_id: user.id,
          title: formData.title,
          artist: formData.artist,
          album: formData.album || null,
          genre: formData.genre || null,
          duration,
          audio_url: audioUrl,
          cover_url: coverUrl,
          release_date: formData.releaseDate || null,
          description: formData.description || null,
        })
        .select()
        .single();
      
      if (dbError) throw dbError;
      
      // Process hashtags
      const hashtags = extractHashtags(formData.description);
      if (hashtags.length > 0) {
        setUploadProgress('Processing hashtags...');
        
        for (const tag of hashtags) {
          // Increment or create hashtag
          await supabase.rpc('increment_hashtag_usage', { hashtag_tag: tag });
          
          // Get hashtag ID
          const { data: hashtagData } = await supabase
            .from('hashtags')
            .select('id')
            .eq('tag', tag)
            .single();
          
          if (hashtagData) {
            // Link song to hashtag
            await supabase
              .from('song_hashtags')
              .insert({
                song_id: songData.id,
                hashtag_id: hashtagData.id,
              });
          }
        }
      }
      
      setSuccess(true);
      setUploadProgress('Upload complete!');
      
      // Reset form after 2 seconds
      setTimeout(() => {
        navigate('/');
      }, 2000);
      
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload song');
      setUploadProgress('');
    } finally {
      setUploading(false);
    }
  };
  
  const detectedHashtags = extractHashtags(formData.description);
  
  return (
    <div className="min-h-screen pb-32 pt-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">Upload Music</h1>
          <p className="text-muted-foreground">Share your music with the world</p>
        </div>
        
        <div className="glass-card p-6 sm:p-8 rounded-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Audio File Upload */}
            <div>
              <label className="block text-sm font-medium mb-3">Audio File *</label>
              <input
                ref={audioInputRef}
                type="file"
                accept="audio/*"
                onChange={handleAudioChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => audioInputRef.current?.click()}
                className="w-full p-6 border-2 border-dashed border-white/20 rounded-xl hover:border-primary/50 hover:bg-white/5 transition-all"
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center">
                    <Music className="w-8 h-8" />
                  </div>
                  {audioFile ? (
                    <div className="text-center">
                      <p className="font-medium text-foreground">{audioFile.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(audioFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <p className="font-medium text-foreground">Click to select audio file</p>
                      <p className="text-sm text-muted-foreground">MP3, WAV, FLAC, or other audio formats</p>
                    </div>
                  )}
                </div>
              </button>
            </div>
            
            {/* Cover Image Upload */}
            <div>
              <label className="block text-sm font-medium mb-3">Cover Image (Optional)</label>
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                onChange={handleCoverChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => coverInputRef.current?.click()}
                className="w-full p-6 border-2 border-dashed border-white/20 rounded-xl hover:border-accent/50 hover:bg-white/5 transition-all"
              >
                <div className="flex flex-col items-center gap-3">
                  {coverPreview ? (
                    <img
                      src={coverPreview}
                      alt="Cover preview"
                      className="w-32 h-32 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gradient-accent rounded-full flex items-center justify-center">
                      <ImageIcon className="w-8 h-8" />
                    </div>
                  )}
                  <div className="text-center">
                    <p className="font-medium text-foreground">
                      {coverFile ? coverFile.name : 'Click to select cover image'}
                    </p>
                    <p className="text-sm text-muted-foreground">JPG, PNG, or WEBP</p>
                  </div>
                </div>
              </button>
            </div>
            
            {/* Song Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="Song title"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Artist *</label>
                <input
                  type="text"
                  value={formData.artist}
                  onChange={(e) => setFormData({ ...formData, artist: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="Artist name"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Album</label>
                <input
                  type="text"
                  value={formData.album}
                  onChange={(e) => setFormData({ ...formData, album: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="Album name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Genre</label>
                <select
                  value={formData.genre}
                  onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="">Select genre</option>
                  <option value="Pop">Pop</option>
                  <option value="Rock">Rock</option>
                  <option value="Hip-Hop">Hip-Hop</option>
                  <option value="R&B">R&B</option>
                  <option value="Electronic">Electronic</option>
                  <option value="Jazz">Jazz</option>
                  <option value="Classical">Classical</option>
                  <option value="Country">Country</option>
                  <option value="Reggae">Reggae</option>
                  <option value="Latin">Latin</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium mb-2">Release Date</label>
                <input
                  type="date"
                  value={formData.releaseDate}
                  onChange={(e) => setFormData({ ...formData, releaseDate: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium mb-2">
                  Description & Hashtags
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[100px] resize-none"
                  placeholder="Tell us about your song... Use #hashtags to categorize (e.g., #newmusic #hiphop #viral)"
                />
                {detectedHashtags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {detectedHashtags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm flex items-center gap-1"
                      >
                        <Hash className="w-3 h-3" />
                        {tag.substring(1)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
                {error}
              </div>
            )}
            
            {/* Success Message */}
            {success && (
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-green-500 text-sm flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                <span>Song uploaded successfully! Redirecting...</span>
              </div>
            )}
            
            {/* Progress */}
            {uploadProgress && !success && (
              <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg text-primary text-sm flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>{uploadProgress}</span>
              </div>
            )}
            
            {/* Submit Button */}
            <button
              type="submit"
              disabled={uploading || !audioFile}
              className="w-full py-4 bg-gradient-primary rounded-lg font-semibold text-lg hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  Upload Song
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
