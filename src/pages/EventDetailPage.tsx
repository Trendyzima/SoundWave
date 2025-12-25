import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../stores/authStore';
import { supabase } from '../lib/supabase';
import { Event } from '../types';
import { 
  Loader2, Calendar, MapPin, Clock, Users, Ticket, 
  DollarSign, Share2, Heart, Edit2, Trash2 
} from 'lucide-react';

export default function EventDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [hasPurchased, setHasPurchased] = useState(false);
  
  useEffect(() => {
    if (id) {
      fetchEvent();
      if (user) checkPurchase();
    }
  }, [id, user]);
  
  const fetchEvent = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*, user_profiles(*)')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      const mappedEvent: Event = {
        id: data.id,
        organizerId: data.organizer_id,
        title: data.title,
        description: data.description,
        coverUrl: data.cover_url,
        eventType: data.event_type,
        venueName: data.venue_name,
        venueAddress: data.venue_address,
        city: data.city,
        country: data.country,
        startDate: data.start_date,
        endDate: data.end_date,
        ticketPrice: parseFloat(data.ticket_price),
        totalTickets: data.total_tickets,
        availableTickets: data.available_tickets,
        isFree: data.is_free,
        isOnline: data.is_online,
        meetingLink: data.meeting_link,
        status: data.status,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        organizer: data.user_profiles ? {
          id: data.user_profiles.id,
          username: data.user_profiles.username || data.user_profiles.email.split('@')[0],
          email: data.user_profiles.email,
          avatarUrl: data.user_profiles.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.user_profiles.id}`,
          joinedDate: data.user_profiles.created_at,
          followersCount: data.user_profiles.followers_count || 0,
          followingCount: data.user_profiles.following_count || 0,
        } : undefined,
      };
      
      setEvent(mappedEvent);
    } catch (error) {
      console.error('Error fetching event:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const checkPurchase = async () => {
    if (!user || !id) return;
    
    try {
      const { data } = await supabase
        .from('ticket_purchases')
        .select('id')
        .eq('event_id', id)
        .eq('user_id', user.id)
        .single();
      
      setHasPurchased(!!data);
    } catch (error) {
      // No purchase found
    }
  };
  
  const handlePurchase = async () => {
    if (!user || !event) {
      navigate('/auth');
      return;
    }
    
    setPurchasing(true);
    
    try {
      const totalAmount = event.isFree ? 0 : event.ticketPrice * quantity;
      const ticketCode = `${event.id.substring(0, 8)}-${Date.now()}`;
      
      const { error } = await supabase
        .from('ticket_purchases')
        .insert({
          event_id: event.id,
          user_id: user.id,
          quantity,
          total_amount: totalAmount,
          payment_status: event.isFree ? 'completed' : 'completed', // In real app, integrate Stripe
          ticket_code: ticketCode,
        });
      
      if (error) throw error;
      
      // Update available tickets
      if (event.availableTickets !== undefined) {
        await supabase
          .from('events')
          .update({ available_tickets: event.availableTickets - quantity })
          .eq('id', event.id);
      }
      
      alert(`Ticket purchased! Your code: ${ticketCode}`);
      setHasPurchased(true);
      fetchEvent();
    } catch (error: any) {
      console.error('Error purchasing ticket:', error);
      alert(error.message || 'Failed to purchase ticket');
    } finally {
      setPurchasing(false);
    }
  };
  
  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      navigate('/events');
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-14">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-14">
        <p className="text-muted-foreground">Event not found</p>
      </div>
    );
  }
  
  const isOwner = user?.id === event.organizerId;
  const isSoldOut = event.availableTickets !== undefined && event.availableTickets <= 0;
  
  return (
    <div className="min-h-screen pb-20 md:pb-4 pt-14">
      <div className="max-w-screen-xl mx-auto md:ml-64 lg:ml-72 md:mr-0">
        <div className="max-w-4xl mx-auto">
          {/* Cover Image */}
          <div className="relative aspect-video md:aspect-[21/9] overflow-hidden rounded-b-2xl">
            {event.coverUrl ? (
              <img
                src={event.coverUrl}
                alt={event.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-purple-500/30 to-pink-500/30 flex items-center justify-center">
                <Calendar className="w-32 h-32 text-white/50" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
            
            {/* Floating Info */}
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  {event.eventType && (
                    <div className="inline-block px-3 py-1 bg-primary/80 backdrop-blur-sm rounded-full text-xs font-semibold mb-3">
                      {event.eventType}
                    </div>
                  )}
                  <h1 className="text-4xl font-bold mb-2">{event.title}</h1>
                </div>
                
                <div className="flex gap-2">
                  {isOwner && (
                    <>
                      <Link
                        to={`/event/edit/${event.id}`}
                        className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full transition-colors"
                      >
                        <Edit2 className="w-5 h-5" />
                      </Link>
                      <button
                        onClick={handleDelete}
                        className="p-3 bg-red-500/20 hover:bg-red-500/30 backdrop-blur-sm rounded-full transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </>
                  )}
                  <button className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full transition-colors">
                    <Share2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Content */}
          <div className="p-6">
            {/* Event Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="glass-card p-4 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                    <Clock className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Date & Time</p>
                    <p className="font-semibold">{formatDate(event.startDate)}</p>
                  </div>
                </div>
              </div>
              
              <div className="glass-card p-4 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center">
                    {event.isOnline ? (
                      <Users className="w-6 h-6 text-accent" />
                    ) : (
                      <MapPin className="w-6 h-6 text-accent" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-muted-foreground">
                      {event.isOnline ? 'Location' : 'Venue'}
                    </p>
                    <p className="font-semibold truncate">
                      {event.isOnline ? 'Online Event' : event.venueName || `${event.city}, ${event.country}`}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="glass-card p-4 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Price</p>
                    <p className="font-semibold text-lg">
                      {event.isFree ? 'FREE' : `$${event.ticketPrice}`}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="glass-card p-4 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                    <Ticket className="w-6 h-6 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Availability</p>
                    <p className={`font-semibold ${isSoldOut ? 'text-red-500' : 'text-green-500'}`}>
                      {isSoldOut 
                        ? 'Sold Out' 
                        : event.availableTickets !== undefined 
                          ? `${event.availableTickets}/${event.totalTickets} available`
                          : 'Available'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Description */}
            {event.description && (
              <div className="mb-6">
                <h2 className="text-xl font-bold mb-3">About</h2>
                <p className="text-muted-foreground whitespace-pre-wrap">{event.description}</p>
              </div>
            )}
            
            {/* Venue Details */}
            {!event.isOnline && event.venueAddress && (
              <div className="mb-6">
                <h2 className="text-xl font-bold mb-3">Venue</h2>
                <div className="glass-card p-4 rounded-xl">
                  <p className="font-semibold mb-1">{event.venueName}</p>
                  <p className="text-sm text-muted-foreground">{event.venueAddress}</p>
                  <p className="text-sm text-muted-foreground">{event.city}, {event.country}</p>
                </div>
              </div>
            )}
            
            {/* Organizer */}
            <div className="mb-6">
              <h2 className="text-xl font-bold mb-3">Organized by</h2>
              <Link
                to={`/profile/${event.organizer?.username}`}
                className="flex items-center gap-3 p-4 glass-card rounded-xl hover:bg-white/5 transition-colors"
              >
                <img
                  src={event.organizer?.avatarUrl}
                  alt={event.organizer?.username}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <p className="font-semibold">{event.organizer?.username}</p>
                  <p className="text-sm text-muted-foreground">
                    {event.organizer?.followersCount} followers
                  </p>
                </div>
              </Link>
            </div>
            
            {/* Purchase Section */}
            {!isOwner && (
              <div className="sticky bottom-20 md:bottom-4 bg-background/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                {hasPurchased ? (
                  <div className="text-center">
                    <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Ticket className="w-8 h-8 text-green-500" />
                    </div>
                    <p className="text-xl font-bold mb-2">You're going!</p>
                    <p className="text-sm text-muted-foreground mb-4">Check your tickets in your profile</p>
                    {event.isOnline && event.meetingLink && (
                      <a
                        href={event.meetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block px-6 py-3 bg-primary hover:bg-primary/90 rounded-full font-semibold transition-colors"
                      >
                        Join Event
                      </a>
                    )}
                  </div>
                ) : isSoldOut ? (
                  <div className="text-center">
                    <p className="text-xl font-bold text-red-500">Sold Out</p>
                    <p className="text-sm text-muted-foreground mt-2">This event is no longer available</p>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Tickets</p>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                            className="w-10 h-10 border border-white/20 rounded-lg hover:bg-white/10 transition-colors"
                          >
                            -
                          </button>
                          <span className="font-bold text-xl w-8 text-center">{quantity}</span>
                          <button
                            onClick={() => setQuantity(Math.min(10, quantity + 1))}
                            className="w-10 h-10 border border-white/20 rounded-lg hover:bg-white/10 transition-colors"
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground mb-1">Total</p>
                        <p className="text-3xl font-bold">
                          {event.isFree ? 'FREE' : `$${(event.ticketPrice * quantity).toFixed(2)}`}
                        </p>
                      </div>
                    </div>
                    
                    <button
                      onClick={handlePurchase}
                      disabled={purchasing || !isAuthenticated}
                      className="w-full py-4 bg-primary hover:bg-primary/90 rounded-full font-semibold text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {purchasing ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Ticket className="w-5 h-5" />
                          {event.isFree ? 'Get Free Ticket' : 'Purchase Tickets'}
                        </>
                      )}
                    </button>
                    
                    {!isAuthenticated && (
                      <p className="text-center text-sm text-muted-foreground mt-3">
                        Please <Link to="/auth" className="text-primary hover:underline">sign in</Link> to purchase tickets
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
