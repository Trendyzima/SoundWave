import { Link, useLocation } from 'react-router-dom';
import { Home, Search, Radio, Calendar, User } from 'lucide-react';

export default function BottomNav() {
  const location = useLocation();
  
  const navItems = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/search', icon: Search, label: 'Search' },
    { to: '/podcasts', icon: Radio, label: 'Podcasts' },
    { to: '/events', icon: Calendar, label: 'Events' },
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
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
