import { Link, useLocation } from 'react-router-dom';
import { Home, Search, Radio, Music2, User, Trophy, Mic, Upload } from 'lucide-react';
import { useAuth } from '../../stores/authStore';

export default function BottomNav() {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  
  const navItems = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/search', icon: Search, label: 'Search' },
    { to: '/dj-mixes', icon: Music2, label: 'DJ' },
    { to: '/challenges', icon: Trophy, label: 'Challenges' },
    { to: '/profile', icon: User, label: 'Profile' },
  ];
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-background/80 backdrop-blur-xl border-t border-white/10 z-40 md:hidden">
      <div className="h-full flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                isActive ? 'text-foreground' : 'text-muted-foreground'
              }`}
            >
              <item.icon className="w-6 h-6" />
              <span className="text-xs mt-1">{item.label}</span>
            </Link>
          );
        })}
      </div>
      
      {/* Floating Upload Button */}
      {isAuthenticated && (
        <Link
          to="/upload"
          className="absolute -top-8 left-1/2 -translate-x-1/2 w-14 h-14 bg-gradient-primary rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
        >
          <Upload className="w-6 h-6" />
        </Link>
      )}
    </nav>
  );
}
