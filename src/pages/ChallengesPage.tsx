import { useState, useEffect } from 'react';
import { useAuth } from '../stores/authStore';
import { Navigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Challenge, ChallengeSubmission } from '../types';
import { Loader2, Trophy, Upload, Clock, Users, Play, Plus } from 'lucide-react';

export default function ChallengesPage() {
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'active' | 'voting' | 'completed'>('active');
  
  useEffect(() => {
    if (!authLoading) {
      fetchChallenges();
    }
  }, [authLoading, filter]);
  
  const fetchChallenges = async () => {
    try {
      const { data, error } = await supabase
        .from('challenges')
        .select('*, user_profiles(*)')
        .eq('status', filter)
        .order('end_date', { ascending: filter === 'completed' ? false : true })
        .limit(20);
      
      if (error) throw error;
      
      const mappedChallenges: Challenge[] = (data || []).map((challenge: any) => ({
        id: challenge.id,
        createdBy: challenge.created_by,
        title: challenge.title,
        description: challenge.description,
        coverUrl: challenge.cover_url,
        challengeType: challenge.challenge_type,
        rules: challenge.rules,
        prizeDescription: challenge.prize_description,
        startDate: challenge.start_date,
        endDate: challenge.end_date,
        status: challenge.status,
        createdAt: challenge.created_at,
        creator: challenge.user_profiles ? {
          id: challenge.user_profiles.id,
          username: challenge.user_profiles.username || challenge.user_profiles.email.split('@')[0],
          email: challenge.user_profiles.email,
          avatarUrl: challenge.user_profiles.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${challenge.user_profiles.id}`,
          joinedDate: challenge.user_profiles.created_at,
          followersCount: challenge.user_profiles.followers_count || 0,
          followingCount: challenge.user_profiles.following_count || 0,
        } : undefined,
      }));
      
      setChallenges(mappedChallenges);
    } catch (error) {
      console.error('Error fetching challenges:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const formatTimeLeft = (endDate: string) => {
    const now = new Date();
    const end = new Date(endDate);
    const diff = end.getTime() - now.getTime();
    
    if (diff <= 0) return 'Ended';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h left`;
    return `${hours}h left`;
  };
  
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-14">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen pb-20 md:pb-4 pt-14">
      <div className="max-w-screen-xl mx-auto md:ml-64 lg:ml-72 md:mr-0">
        <div className="max-w-6xl">
          {/* Header */}
          <div className="sticky top-14 bg-background/80 backdrop-blur-xl border-b border-white/10 z-10">
            <div className="px-4 py-4">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <Trophy className="w-6 h-6" />
                  Recording Challenges
                </h1>
                {isAuthenticated && (
                  <Link
                    to="/create-challenge"
                    className="px-4 py-2 bg-primary hover:bg-primary/90 rounded-full font-semibold flex items-center gap-2 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Create Challenge
                  </Link>
                )}
              </div>
            </div>
            
            {/* Filter Tabs */}
            <div className="flex border-t border-white/10">
              {(['active', 'voting', 'completed'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={`flex-1 px-4 py-4 font-semibold transition-colors relative hover:bg-white/5 ${
                    filter === tab ? 'text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  {filter === tab && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-full" />
                  )}
                </button>
              ))}
            </div>
          </div>
          
          {/* Content */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {challenges.length === 0 ? (
                <div className="col-span-full text-center py-20">
                  <Trophy className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <h2 className="text-xl font-bold mb-2">No challenges available</h2>
                  <p className="text-muted-foreground mb-4">
                    {filter === 'active' && 'Start a new challenge to compete with others!'}
                    {filter === 'voting' && 'No challenges in voting phase'}
                    {filter === 'completed' && 'No completed challenges yet'}
                  </p>
                  {isAuthenticated && (
                    <Link
                      to="/create-challenge"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 rounded-full font-semibold transition-colors"
                    >
                      <Plus className="w-5 h-5" />
                      Create Challenge
                    </Link>
                  )}
                </div>
              ) : (
                challenges.map((challenge) => (
                  <Link
                    key={challenge.id}
                    to={`/challenge/${challenge.id}`}
                    className="glass-card rounded-2xl overflow-hidden hover:bg-white/5 transition-colors"
                  >
                    <div className="relative aspect-video">
                      {challenge.coverUrl ? (
                        <img
                          src={challenge.coverUrl}
                          alt={challenge.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-orange-500/30 to-red-500/30 flex items-center justify-center">
                          <Trophy className="w-20 h-20 text-white/50" />
                        </div>
                      )}
                      <div className="absolute top-3 left-3 px-3 py-1 bg-black/80 backdrop-blur-sm rounded-full text-xs font-semibold">
                        {challenge.challengeType}
                      </div>
                      {challenge.status === 'active' && (
                        <div className="absolute top-3 right-3 px-3 py-1 bg-green-500 rounded-full text-xs font-semibold flex items-center gap-1">
                          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                          {formatTimeLeft(challenge.endDate)}
                        </div>
                      )}
                    </div>
                    
                    <div className="p-4">
                      <h3 className="font-bold text-lg mb-2 line-clamp-2">
                        {challenge.title}
                      </h3>
                      
                      {challenge.prizeDescription && (
                        <div className="mb-3 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                          <p className="text-sm text-yellow-500 font-semibold flex items-center gap-2">
                            <Trophy className="w-4 h-4" />
                            {challenge.prizeDescription}
                          </p>
                        </div>
                      )}
                      
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {challenge.description}
                      </p>
                      
                      <div className="flex items-center gap-2 mb-3">
                        <img
                          src={challenge.creator?.avatarUrl}
                          alt={challenge.creator?.username}
                          className="w-6 h-6 rounded-full object-cover"
                        />
                        <span className="text-sm text-muted-foreground">
                          by {challenge.creator?.username}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          Ends {new Date(challenge.endDate).toLocaleDateString()}
                        </div>
                        <button className="px-4 py-2 bg-primary hover:bg-primary/90 rounded-full font-semibold transition-colors flex items-center gap-2">
                          <Upload className="w-4 h-4" />
                          Submit
                        </button>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
