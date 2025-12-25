import { useState, useEffect } from 'react';
import { useAuth } from '../stores/authStore';
import { Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Advertisement } from '../types';
import { Loader2, DollarSign, Eye, MousePointer, Plus, Edit2, Pause, Play, Trash2 } from 'lucide-react';

export default function AdminDashboard() {
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingAd, setEditingAd] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    adType: 'banner',
    imageUrl: '',
    videoUrl: '',
    linkUrl: '',
    placement: 'home_feed',
    budget: '',
  });
  
  useEffect(() => {
    if (!authLoading && user) {
      checkAdminStatus();
    }
  }, [authLoading, user]);
  
  const checkAdminStatus = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('id')
        .eq('id', user.id)
        .single();
      
      setIsAdmin(!!data);
      
      if (data) {
        fetchAds();
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    } finally {
      setCheckingAdmin(false);
    }
  };
  
  const fetchAds = async () => {
    try {
      const { data, error } = await supabase
        .from('advertisements')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      const mappedAds: Advertisement[] = (data || []).map((ad: any) => ({
        id: ad.id,
        title: ad.title,
        description: ad.description,
        adType: ad.ad_type,
        imageUrl: ad.image_url,
        videoUrl: ad.video_url,
        linkUrl: ad.link_url,
        placement: ad.placement,
        startDate: ad.start_date,
        endDate: ad.end_date,
        impressions: ad.impressions,
        clicks: ad.clicks,
        budget: parseFloat(ad.budget),
        status: ad.status,
        createdAt: ad.created_at,
        updatedAt: ad.updated_at,
      }));
      
      setAds(mappedAds);
    } catch (error) {
      console.error('Error fetching ads:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleCreateAd = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { error } = await supabase
        .from('advertisements')
        .insert({
          title: formData.title,
          description: formData.description,
          ad_type: formData.adType,
          image_url: formData.imageUrl || null,
          video_url: formData.videoUrl || null,
          link_url: formData.linkUrl || null,
          placement: formData.placement,
          budget: parseFloat(formData.budget) || null,
          status: 'active',
        });
      
      if (error) throw error;
      
      setShowCreateForm(false);
      setFormData({
        title: '',
        description: '',
        adType: 'banner',
        imageUrl: '',
        videoUrl: '',
        linkUrl: '',
        placement: 'home_feed',
        budget: '',
      });
      
      fetchAds();
    } catch (error) {
      console.error('Error creating ad:', error);
      alert('Failed to create advertisement');
    }
  };
  
  const handleToggleStatus = async (id: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'paused' : 'active';
      const { error } = await supabase
        .from('advertisements')
        .update({ status: newStatus })
        .eq('id', id);
      
      if (error) throw error;
      
      fetchAds();
    } catch (error) {
      console.error('Error toggling ad status:', error);
    }
  };
  
  const handleDeleteAd = async (id: string) => {
    if (!confirm('Are you sure you want to delete this advertisement?')) return;
    
    try {
      const { error } = await supabase
        .from('advertisements')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      fetchAds();
    } catch (error) {
      console.error('Error deleting ad:', error);
    }
  };
  
  if (authLoading || checkingAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-14">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!isAuthenticated || !isAdmin) {
    return <Navigate to="/" />;
  }
  
  const totalImpressions = ads.reduce((sum, ad) => sum + ad.impressions, 0);
  const totalClicks = ads.reduce((sum, ad) => sum + ad.clicks, 0);
  const totalBudget = ads.reduce((sum, ad) => sum + (ad.budget || 0), 0);
  const ctr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : 0;
  
  return (
    <div className="min-h-screen pb-20 md:pb-4 pt-14">
      <div className="max-w-screen-xl mx-auto md:ml-64 lg:ml-72 md:mr-0">
        <div className="max-w-6xl px-4 py-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage advertisements and platform revenue</p>
          </div>
          
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="glass-card p-6 rounded-2xl">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                  <Eye className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-3xl font-bold">{totalImpressions.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Total Impressions</p>
                </div>
              </div>
            </div>
            
            <div className="glass-card p-6 rounded-2xl">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                  <MousePointer className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <p className="text-3xl font-bold">{totalClicks.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Total Clicks</p>
                </div>
              </div>
            </div>
            
            <div className="glass-card p-6 rounded-2xl">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-yellow-500" />
                </div>
                <div>
                  <p className="text-3xl font-bold">${totalBudget.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Total Budget</p>
                </div>
              </div>
            </div>
            
            <div className="glass-card p-6 rounded-2xl">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                  <MousePointer className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-3xl font-bold">{ctr}%</p>
                  <p className="text-sm text-muted-foreground">Click-Through Rate</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Create Ad Button */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Advertisements</h2>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="px-6 py-3 bg-primary hover:bg-primary/90 rounded-full font-semibold flex items-center gap-2 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Create Advertisement
            </button>
          </div>
          
          {/* Create Form */}
          {showCreateForm && (
            <form onSubmit={handleCreateAd} className="glass-card p-6 rounded-2xl mb-6">
              <h3 className="text-xl font-bold mb-4">New Advertisement</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Ad Type *</label>
                  <select
                    value={formData.adType}
                    onChange={(e) => setFormData({ ...formData, adType: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="banner">Banner</option>
                    <option value="video">Video</option>
                    <option value="audio">Audio</option>
                    <option value="sponsored_post">Sponsored Post</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Placement *</label>
                  <select
                    value={formData.placement}
                    onChange={(e) => setFormData({ ...formData, placement: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="home_feed">Home Feed</option>
                    <option value="sidebar">Sidebar</option>
                    <option value="player">Player</option>
                    <option value="between_songs">Between Songs</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Budget ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                    rows={3}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Image URL</label>
                  <input
                    type="url"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Link URL</label>
                  <input
                    type="url"
                    value={formData.linkUrl}
                    onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="px-6 py-3 bg-primary hover:bg-primary/90 rounded-lg font-semibold transition-colors"
                >
                  Create Advertisement
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-6 py-3 border border-white/20 hover:bg-white/10 rounded-lg font-semibold transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
          
          {/* Ads List */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-4">
              {ads.map((ad) => (
                <div key={ad.id} className="glass-card p-6 rounded-2xl">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold">{ad.title}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          ad.status === 'active' 
                            ? 'bg-green-500/20 text-green-500' 
                            : 'bg-gray-500/20 text-gray-500'
                        }`}>
                          {ad.status}
                        </span>
                        <span className="px-3 py-1 bg-primary/20 text-primary rounded-full text-xs font-semibold">
                          {ad.adType}
                        </span>
                      </div>
                      {ad.description && (
                        <p className="text-sm text-muted-foreground mb-3">{ad.description}</p>
                      )}
                      <div className="flex flex-wrap gap-4 text-sm">
                        <div>Placement: <span className="font-semibold">{ad.placement}</span></div>
                        <div>Impressions: <span className="font-semibold">{ad.impressions.toLocaleString()}</span></div>
                        <div>Clicks: <span className="font-semibold">{ad.clicks.toLocaleString()}</span></div>
                        {ad.budget && (
                          <div>Budget: <span className="font-semibold">${ad.budget.toLocaleString()}</span></div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleToggleStatus(ad.id, ad.status)}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        title={ad.status === 'active' ? 'Pause' : 'Activate'}
                      >
                        {ad.status === 'active' ? (
                          <Pause className="w-5 h-5" />
                        ) : (
                          <Play className="w-5 h-5" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDeleteAd(ad.id)}
                        className="p-2 hover:bg-red-500/10 hover:text-red-500 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              
              {ads.length === 0 && (
                <div className="text-center py-20">
                  <DollarSign className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">No advertisements created yet</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
