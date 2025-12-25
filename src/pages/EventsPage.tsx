import { useState, useEffect } from 'react';
import { useAuth } from '../stores/authStore';
import { Navigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Event } from '../types';
import { Loader2, Calendar, MapPin, Ticket, Users, Plus, Clock, DollarSign } from 'lucide-react';

export default function EventsPage() {
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'upcoming' | 'past' | 'my-tickets'>('upcoming');
  
  useEffect(() => {
    if (!authLoading) {
      fetchEvents();
    }
  }, [authLoading, filter]);
  
  const fetchEvents = async () => {
    try {
      let query = supabase
        .from('events')
        .select('*, user_profiles(*)');
      
      if (filter === 'upcoming') {
        query = query
          .gte('start_date', new Date().toISOString())
          .eq('status', 'upcoming')
          .order('start_date', { ascending: true });
      } else if (filter === 'past') {
        query = query
          .lt('start_date', new Date().toISOString())
          .order('start_date', { ascending: false });
      } else if (filter === 'my-tickets' && user) {
        // Get events user has tickets for
        const { data: ticketData } = await supabase
          .from('ticket_purchases')
          .select('event_id')
          .eq('user_id', user.id);
        
        const eventIds = ticketData?.map(t => t.event_id) || [];
        if (eventIds.length === 0) {
          setEvents([]);
          setLoading(false);
          return;
        }
        
        query = query.in('id', eventIds);
      }
      
      const { data, error } = await query.limit(20);
      
      if (error) throw error;
      
      const mappedEvents: Event[] = (data || []).map((event: any) => ({
        id: event.id,
        organizerId: event.organizer_id,
        title: event.title,
        description: event.description,
        coverUrl: event.cover_url,
        eventType: event.event_type,
        venueName: event.venue_name,
        venueAddress: event.venue_address,
        city: event.city,
        country: event.country,
        startDate: event.start_date,
        endDate: event.end_date,
        ticketPrice: parseFloat(event.ticket_price),
        totalTickets: event.total_tickets,
        availableTickets: event.available_tickets,
        isFree: event.is_free,
        isOnline: event.is_online,
        meetingLink: event.meeting_link,
        status: event.status,
        createdAt: event.created_at,
        updatedAt: event.updated_at,
        organizer: event.user_profiles ? {
          id: event.user_profiles.id,
          username: event.user_profiles.username || event.user_profiles.email.split('@')[0],
          email: event.user_profiles.email,
          avatarUrl: event.user_profiles.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${event.user_profiles.id}`,
          joinedDate: event.user_profiles.created_at,
          followersCount: event.user_profiles.followers_count || 0,
          followingCount: event.user_profiles.following_count || 0,
        } : undefined,
      }));
      
      setEvents(mappedEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
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
                  <Calendar className="w-6 h-6" />
                  Events & Shows
                </h1>
                {isAuthenticated && (
                  <Link
                    to="/create-event"
                    className="px-4 py-2 bg-primary hover:bg-primary/90 rounded-full font-semibold flex items-center gap-2 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Create Event
                  </Link>
                )}
              </div>
            </div>
            
            {/* Filter Tabs */}
            <div className="flex border-t border-white/10">
              {(['upcoming', 'past', 'my-tickets'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={`flex-1 px-4 py-4 font-semibold transition-colors relative hover:bg-white/5 ${
                    filter === tab ? 'text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  {tab === 'my-tickets' ? 'My Tickets' : tab.charAt(0).toUpperCase() + tab.slice(1)}
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
            <div className="p-4 space-y-4">
              {events.length === 0 ? (
                <div className="text-center py-20">
                  <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <h2 className="text-xl font-bold mb-2">
                    {filter === 'my-tickets' ? 'No tickets purchased' : 'No events found'}
                  </h2>
                  <p className="text-muted-foreground mb-4">
                    {filter === 'my-tickets' 
                      ? 'Purchase tickets to see them here'
                      : 'Check back later for upcoming events'
                    }
                  </p>
                  {isAuthenticated && filter !== 'my-tickets' && (
                    <Link
                      to="/create-event"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 rounded-full font-semibold transition-colors"
                    >
                      <Plus className="w-5 h-5" />
                      Create Event
                    </Link>
                  )}
                </div>
              ) : (
                events.map((event) => (
                  <Link
                    key={event.id}
                    to={`/event/${event.id}`}
                    className="block glass-card rounded-2xl overflow-hidden hover:bg-white/5 transition-colors"
                  >
                    <div className="md:flex">
                      <div className="relative md:w-80 aspect-video md:aspect-auto">
                        {event.coverUrl ? (
                          <img
                            src={event.coverUrl}
                            alt={event.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-purple-500/30 to-pink-500/30 flex items-center justify-center">
                            <Calendar className="w-20 h-20 text-white/50" />
                          </div>
                        )}
                        {event.eventType && (
                          <div className="absolute top-3 left-3 px-3 py-1 bg-black/80 backdrop-blur-sm rounded-full text-xs font-semibold">
                            {event.eventType}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h2 className="text-xl font-bold mb-2">{event.title}</h2>
                            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                              {event.description}
                            </p>
                          </div>
                          {event.isFree ? (
                            <div className="px-4 py-2 bg-green-500/20 text-green-500 rounded-full font-bold ml-4">
                              FREE
                            </div>
                          ) : (
                            <div className="px-4 py-2 bg-primary/20 text-primary rounded-full font-bold ml-4 flex items-center gap-1">
                              <DollarSign className="w-4 h-4" />
                              {event.ticketPrice}
                            </div>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="w-4 h-4 text-primary" />
                            <span>{formatDate(event.startDate)}</span>
                          </div>
                          
                          {event.isOnline ? (
                            <div className="flex items-center gap-2 text-sm">
                              <Users className="w-4 h-4 text-accent" />
                              <span>Online Event</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-sm">
                              <MapPin className="w-4 h-4 text-accent" />
                              <span className="truncate">
                                {event.city}, {event.country}
                              </span>
                            </div>
                          )}
                          
                          {event.venueName && (
                            <div className="col-span-2 flex items-start gap-2 text-sm text-muted-foreground">
                              <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                              <span className="line-clamp-1">{event.venueName}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <img
                              src={event.organizer?.avatarUrl}
                              alt={event.organizer?.username}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                            <span className="text-sm text-muted-foreground">
                              by {event.organizer?.username}
                            </span>
                          </div>
                          
                          {event.availableTickets !== undefined && event.totalTickets && (
                            <div className="flex items-center gap-2 text-sm">
                              <Ticket className="w-4 h-4" />
                              <span className={event.availableTickets > 0 ? 'text-green-500' : 'text-red-500'}>
                                {event.availableTickets > 0 
                                  ? `${event.availableTickets}/${event.totalTickets} available`
                                  : 'Sold Out'
                                }
                              </span>
                            </div>
                          )}
                        </div>
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
