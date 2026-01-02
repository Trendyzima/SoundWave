import { useState } from 'react';
import { Music2, Sparkles, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Genre {
  id: string;
  name: string;
  description: string;
  color: string;
  image: string;
  count: number;
}

export default function GenresPage() {
  const navigate = useNavigate();
  
  const genres: Genre[] = [
    {
      id: 'pop',
      name: 'Pop',
      description: 'Catchy melodies and mainstream hits',
      color: 'from-pink-500 to-purple-500',
      image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&h=400&fit=crop',
      count: 1234,
    },
    {
      id: 'hip-hop',
      name: 'Hip Hop',
      description: 'Beats, rhymes, and urban culture',
      color: 'from-yellow-500 to-orange-500',
      image: 'https://images.unsplash.com/photo-1571609566382-7a9b8293a82b?w=400&h=400&fit=crop',
      count: 2156,
    },
    {
      id: 'rnb',
      name: 'R&B',
      description: 'Smooth vocals and soulful grooves',
      color: 'from-red-500 to-pink-500',
      image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop',
      count: 987,
    },
    {
      id: 'rock',
      name: 'Rock',
      description: 'Guitar-driven anthems and energy',
      color: 'from-gray-700 to-gray-900',
      image: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=400&h=400&fit=crop',
      count: 1543,
    },
    {
      id: 'electronic',
      name: 'Electronic',
      description: 'Digital beats and synthesized sounds',
      color: 'from-cyan-500 to-blue-500',
      image: 'https://images.unsplash.com/photo-1571974599782-87624638275b?w=400&h=400&fit=crop',
      count: 1876,
    },
    {
      id: 'jazz',
      name: 'Jazz',
      description: 'Improvisation and sophisticated harmonies',
      color: 'from-amber-600 to-yellow-500',
      image: 'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=400&h=400&fit=crop',
      count: 654,
    },
    {
      id: 'classical',
      name: 'Classical',
      description: 'Timeless orchestral masterpieces',
      color: 'from-purple-700 to-indigo-600',
      image: 'https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=400&h=400&fit=crop',
      count: 432,
    },
    {
      id: 'country',
      name: 'Country',
      description: 'Stories from the heartland',
      color: 'from-orange-600 to-red-500',
      image: 'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=400&h=400&fit=crop',
      count: 765,
    },
    {
      id: 'reggae',
      name: 'Reggae',
      description: 'Caribbean rhythms and positive vibes',
      color: 'from-green-500 to-emerald-600',
      image: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=400&h=400&fit=crop',
      count: 543,
    },
    {
      id: 'latin',
      name: 'Latin',
      description: 'Passionate rhythms from Latin America',
      color: 'from-red-500 to-yellow-500',
      image: 'https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=400&h=400&fit=crop',
      count: 1234,
    },
    {
      id: 'afrobeats',
      name: 'Afrobeats',
      description: 'African rhythms meet global sounds',
      color: 'from-yellow-500 to-green-500',
      image: 'https://images.unsplash.com/photo-1518135714426-c18f5ffb6f4d?w=400&h=400&fit=crop',
      count: 1987,
    },
    {
      id: 'indie',
      name: 'Indie',
      description: 'Independent and alternative sounds',
      color: 'from-teal-500 to-cyan-500',
      image: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=400&h=400&fit=crop',
      count: 876,
    },
  ];
  
  const moods = [
    { id: 'chill', name: 'Chill', icon: '😌', color: 'from-blue-400 to-cyan-400' },
    { id: 'workout', name: 'Workout', icon: '💪', color: 'from-orange-400 to-red-500' },
    { id: 'party', name: 'Party', icon: '🎉', color: 'from-pink-500 to-purple-600' },
    { id: 'focus', name: 'Focus', icon: '🎯', color: 'from-indigo-500 to-purple-500' },
    { id: 'sleep', name: 'Sleep', icon: '😴', color: 'from-slate-600 to-gray-700' },
    { id: 'romantic', name: 'Romantic', icon: '💕', color: 'from-rose-400 to-pink-500' },
  ];
  
  return (
    <div className="min-h-screen pb-32 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Genres Header */}
        <div className="mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold mb-2 flex items-center gap-3">
            <Music2 className="w-10 h-10" />
            Genres
          </h1>
          <p className="text-muted-foreground text-lg">
            Explore music by genre
          </p>
        </div>
        
        {/* Genres Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-12">
          {genres.map((genre) => (
            <div
              key={genre.id}
              onClick={() => navigate(`/search?genre=${genre.id}`)}
              className="group cursor-pointer"
            >
              <div className={`relative overflow-hidden rounded-xl aspect-square mb-2 bg-gradient-to-br ${genre.color}`}>
                <img
                  src={genre.image}
                  alt={genre.name}
                  className="w-full h-full object-cover opacity-50 group-hover:opacity-70 group-hover:scale-110 transition-all duration-300"
                />
                <div className="absolute inset-0 flex flex-col justify-between p-4">
                  <h3 className="text-xl font-bold drop-shadow-lg">{genre.name}</h3>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors">
                      <Play className="w-6 h-6 ml-0.5" />
                    </button>
                  </div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{genre.count.toLocaleString()} songs</p>
            </div>
          ))}
        </div>
        
        {/* Moods Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <Sparkles className="w-8 h-8" />
            Browse by Mood
          </h2>
          <p className="text-muted-foreground mb-6">
            Find music that matches your current vibe
          </p>
        </div>
        
        {/* Moods Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          {moods.map((mood) => (
            <div
              key={mood.id}
              onClick={() => navigate(`/search?mood=${mood.id}`)}
              className="group cursor-pointer"
            >
              <div className={`relative overflow-hidden rounded-2xl aspect-square bg-gradient-to-br ${mood.color} p-6 hover:scale-105 transition-transform`}>
                <div className="flex flex-col justify-between h-full">
                  <span className="text-4xl">{mood.icon}</span>
                  <h3 className="text-xl font-bold">{mood.name}</h3>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
