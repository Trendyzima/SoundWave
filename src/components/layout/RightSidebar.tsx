import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  X, HardDrive, Radio, Compass, Music2, Calendar, User, 
  ChevronRight, Play, Pause 
} from 'lucide-react';
import { useAuth } from '../../stores/authStore';
import { usePlayerStore } from '../../stores/playerStore';

interface RightSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function RightSidebar({ isOpen, onClose }: RightSidebarProps) {
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { currentSong, isPlaying } = usePlayerStore();
  
  const menuItems = [
    { to: '/local-music', icon: HardDrive, label: 'Local Music', color: 'text-primary' },
    { to: '/podcasts', icon: Radio, label: 'Podcasts', color: 'text-accent' },
    { to: '/search', icon: Compass, label: 'Explore', color: 'text-blue-500' },
    { to: '/dj-mixes', icon: Music2, label: 'DJ Mixes', color: 'text-purple-500' },
    { to: '/events', icon: Calendar, label: 'Events', color: 'text-pink-500' },
  ];
  
  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div
        className={`fixed right-0 top-0 bottom-0 w-80 glass-card border-l border-white/10 z-50 transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-xl font-bold">Quick Access</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Menu Items */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-2">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${
                    isActive
                      ? 'bg-white/10 text-foreground'
                      : 'hover:bg-white/5 text-muted-foreground'
                  }`}
                >
                  <div className={`w-10 h-10 ${item.color} bg-current/10 rounded-lg flex items-center justify-center`}>
                    <item.icon className={`w-5 h-5 ${item.color}`} />
                  </div>
                  <span className="flex-1 font-semibold">{item.label}</span>
                  <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              );
            })}
          </div>
          
          {/* Now Playing Mini */}
          {currentSong && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-muted-foreground mb-3 px-2">Now Playing</h3>
              <div className="glass-card p-4 rounded-xl">
                <div className="flex items-center gap-3 mb-3">
                  <div className="relative">
                    <img
                      src={currentSong.coverUrl}
                      alt={currentSong.title}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                    {isPlaying && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-lg">
                        <div className="w-3 h-3 bg-primary rounded-full animate-pulse" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate text-sm">{currentSong.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{currentSong.artist}</p>
                  </div>
                </div>
                {isPlaying && (
                  <div className="flex items-center gap-2 text-xs text-primary">
                    <Play className="w-3 h-3 animate-pulse" />
                    <span>Playing now</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* User Account */}
        {isAuthenticated && user && (
          <div className="p-4 border-t border-white/10">
            <Link
              to="/profile"
              onClick={onClose}
              className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-xl transition-colors group"
            >
              <img
                src={user.avatarUrl}
                alt={user.username}
                className="w-12 h-12 rounded-full object-cover border-2 border-primary/20"
              />
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{user.username}</p>
                <p className="text-sm text-muted-foreground truncate">View Profile</p>
              </div>
              <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
