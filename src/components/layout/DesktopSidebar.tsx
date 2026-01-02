import { Music4, Search, TrendingUp, Calendar, Sparkles, Disc3, Mic2, Music2, Radio, ListMusic, Headphones, Globe } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export default function DesktopSidebar() {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const mainLinks = [
    { to: '/', icon: Music4, label: 'Home', color: 'text-primary' },
    { to: '/for-you', icon: Sparkles, label: 'For You', color: 'text-yellow-500' },
    { to: '/search', icon: Search, label: 'Search', color: 'text-accent' },
    { to: '/charts', icon: TrendingUp, label: 'Top Charts', color: 'text-green-500' },
    { to: '/new-releases', icon: Calendar, label: 'New Releases', color: 'text-blue-500' },
  ];

  const discoverLinks = [
    { to: '/albums', icon: Disc3, label: 'Albums', color: 'text-purple-500' },
    { to: '/artists', icon: Mic2, label: 'Artists', color: 'text-pink-500' },
    { to: '/genres', icon: Music2, label: 'Genres & Moods', color: 'text-orange-500' },
    { to: '/podcasts', icon: Radio, label: 'Podcasts & Live', color: 'text-red-500' },
    { to: '/dj-mixes', icon: Headphones, label: 'DJ Mixes', color: 'text-cyan-500' },
    { to: '/events', icon: Globe, label: 'Events', color: 'text-teal-500' },
  ];

  const libraryLinks = [
    { to: '/library', icon: ListMusic, label: 'Your Library', color: 'text-indigo-500' },
    { to: '/local-music', icon: Music4, label: 'Local Music', color: 'text-violet-500' },
  ];

  return (
    <aside className="hidden md:flex md:w-64 lg:w-72 fixed left-0 top-0 h-screen bg-background/95 backdrop-blur-sm border-r border-white/10 z-40 flex-col">
      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-8">
        {/* Main Navigation */}
        <nav className="space-y-2">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-3">
            Main
          </h2>
          {mainLinks.map(({ to, icon: Icon, label, color }) => (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                isActive(to)
                  ? 'bg-gradient-to-r from-primary/20 to-accent/20 text-white font-semibold scale-105'
                  : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive(to) ? color : ''}`} />
              <span>{label}</span>
            </Link>
          ))}
        </nav>

        {/* Discover Section */}
        <nav className="space-y-2">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-3">
            Discover
          </h2>
          {discoverLinks.map(({ to, icon: Icon, label, color }) => (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                isActive(to)
                  ? 'bg-gradient-to-r from-primary/20 to-accent/20 text-white font-semibold scale-105'
                  : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive(to) ? color : ''}`} />
              <span>{label}</span>
            </Link>
          ))}
        </nav>

        {/* Library Section */}
        <nav className="space-y-2">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-3">
            Library
          </h2>
          {libraryLinks.map(({ to, icon: Icon, label, color }) => (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                isActive(to)
                  ? 'bg-gradient-to-r from-primary/20 to-accent/20 text-white font-semibold scale-105'
                  : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive(to) ? color : ''}`} />
              <span>{label}</span>
            </Link>
          ))}
        </nav>
      </div>

      {/* Bottom Links */}
      <div className="p-4 border-t border-white/10">
        <Link
          to="/upload"
          className="w-full px-4 py-3 bg-gradient-primary rounded-full font-semibold hover:scale-105 transition-transform flex items-center justify-center gap-2"
        >
          <Music4 className="w-5 h-5" />
          Upload Music
        </Link>
      </div>
    </aside>
  );
}
