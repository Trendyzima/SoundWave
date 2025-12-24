import { useState, useRef } from 'react';
import { useAuth } from '../stores/authStore';
import { Navigate, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Radio, Image as ImageIcon, Loader2, CheckCircle2 } from 'lucide-react';

export default function GoLivePage() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const coverInputRef = useRef<HTMLInputElement>(null);
  
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
  });
  
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string>('');
  
  if (!isAuthenticated) {
    return <Navigate to="/auth" />;
  }
  
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
  
  const handleStartLive = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError('You must be logged in to go live');
      return;
    }
    
    setStarting(true);
    setError('');
    
    try {
      // Upload cover image if provided
      let coverUrl = null;
      if (coverFile) {
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
      
      // Create live podcast entry
      const { data: podcastData, error: dbError } = await supabase
        .from('podcasts')
        .insert({
          user_id: user.id,
          title: formData.title,
          description: formData.description || null,
          category: formData.category || null,
          cover_url: coverUrl,
          is_live: true,
          was_live: true,
          viewers_count: 0,
        })
        .select()
        .single();
      
      if (dbError) throw dbError;
      
      // Navigate to live stream page
      navigate(`/podcast/${podcastData.id}`);
      
    } catch (err: any) {
      console.error('Start live error:', err);
      setError(err.message || 'Failed to start live podcast');
    } finally {
      setStarting(false);
    }
  };
  
  return (
    <div className="min-h-screen pb-32 pt-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">Start Live Podcast</h1>
          <p className="text-muted-foreground">
            Share your thoughts and connect with your audience in real-time
          </p>
        </div>
        
        <div className="glass-card p-6 sm:p-8 rounded-2xl">
          <form onSubmit={handleStartLive} className="space-y-6">
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
            
            {/* Podcast Details */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="Give your podcast a catchy title"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="">Select category</option>
                  <option value="Music">Music</option>
                  <option value="Talk">Talk</option>
                  <option value="News">News</option>
                  <option value="Comedy">Comedy</option>
                  <option value="Education">Education</option>
                  <option value="Sports">Sports</option>
                  <option value="Technology">Technology</option>
                  <option value="Business">Business</option>
                  <option value="Entertainment">Entertainment</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[100px] resize-none"
                  placeholder="What will you talk about? Give your audience a preview..."
                />
              </div>
            </div>
            
            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
                {error}
              </div>
            )}
            
            {/* Info Box */}
            <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg text-sm">
              <p className="text-muted-foreground">
                <strong className="text-foreground">Note:</strong> Your live podcast will be
                automatically saved and made available as a recorded episode once you end the stream.
              </p>
            </div>
            
            {/* Submit Button */}
            <button
              type="submit"
              disabled={starting}
              className="w-full py-4 bg-red-500 hover:bg-red-600 rounded-lg font-semibold text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {starting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Starting...
                </>
              ) : (
                <>
                  <Radio className="w-5 h-5" />
                  Go Live Now
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
