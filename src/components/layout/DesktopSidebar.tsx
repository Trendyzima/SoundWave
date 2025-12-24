import { Link, useLocation } from 'react-router-dom';
import { Home, Search, Music, Mail, User, Library, Sparkles, Upload } from 'lucide-react';
import { useAuth } from '../../stores/authStore';

export default function DesktopSidebar() {
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  
  const navItems = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/search', icon: Search, label: 'Explore' },
    { to: '/messages', icon: Mail, label: 'Messages' },
    { to: '/ai-assistant', icon: Sparkles, label: 'AI Assistant' },
    { to: '/library', icon: Library, label: 'Library' },
    { to: '/profile', icon: User, label: 'Profile' },
  ];
  
  return (
    <div className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 lg:w-72 p-4 border-r border-white/10 flex-col z-30">
      <div className="flex flex-col gap-2 flex-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-4 px-4 py-3 rounded-full transition-all ${
                isActive
                  ? 'bg-white/10 text-foreground font-bold'
                  : 'text-muted-foreground hover:bg-white/5'
              }`}
            >
              <item.icon className="w-6 h-6" />
              <span className="text-lg">{item.label}</span>
            </Link>
          );
        })}
        
        {isAuthenticated && (
          <Link
            to="/upload"
            className="mt-4 flex items-center justify-center gap-2 px-6 py-3 bg-primary rounded-full font-bold hover:bg-primary/90 transition-all"
          >
            <Upload className="w-5 h-5" />
            Upload
          </Link>
        )}
      </div>
      
      {isAuthenticated && user && (
        <Link
          to="/profile"
          className="flex items-center gap-3 p-3 rounded-full hover:bg-white/5 transition-colors"
        >
          <img
            src={user.avatarUrl}
            alt={user.username}
            className="w-10 h-10 rounded-full object-cover"
          />
          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate">{user.username}</p>
            <p className="text-sm text-muted-foreground truncate">@{user.username}</p>
          </div>
        </Link>
      )}
    </div>
  );
}
