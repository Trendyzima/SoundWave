import { useState } from 'react';
import { Sparkles, Wand2, Send } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { Navigate } from 'react-router-dom';
import PlaylistCard from '../components/features/PlaylistCard';
import { mockPlaylists } from '../constants/mockData';

export default function AIAssistantPage() {
  const { isAuthenticated } = useAuthStore();
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'ai'; content: string }[]>([
    {
      role: 'ai',
      content: "Hey! I'm your AI music assistant. I can help you discover new music, create personalized playlists, analyze your listening habits, and recommend songs based on your mood. What can I help you with today?",
    },
  ]);
  const [isGenerating, setIsGenerating] = useState(false);
  
  if (!isAuthenticated) {
    return <Navigate to="/auth" />;
  }
  
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    
    const userMessage = message;
    setMessage('');
    setChatHistory([...chatHistory, { role: 'user', content: userMessage }]);
    
    // Mock AI response
    setIsGenerating(true);
    setTimeout(() => {
      const responses = [
        "Based on your listening history, I think you'd love some tracks from Dua Lipa's Future Nostalgia album. The energy and production style match your preferences perfectly!",
        "I've noticed you enjoy R&B and Pop. Let me create a personalized playlist mixing The Weeknd, Justin Bieber, and some newer artists you might enjoy.",
        "Your music taste is diverse! I can see you enjoy upbeat tracks in the morning and mellow vibes in the evening. Would you like me to create mood-based playlists for different times of day?",
        "Great question! Based on the songs you've been playing, I recommend checking out 'Levitating' by Dua Lipa and 'Peaches' by Justin Bieber. They have similar energy and production styles.",
      ];
      
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      setChatHistory((prev) => [...prev, { role: 'ai', content: randomResponse }]);
      setIsGenerating(false);
    }, 1500);
  };
  
  const quickActions = [
    { label: 'Create a workout playlist', icon: Wand2 },
    { label: 'Recommend songs for studying', icon: Sparkles },
    { label: 'Analyze my music taste', icon: Sparkles },
    { label: 'Find similar artists', icon: Wand2 },
  ];
  
  return (
    <div className="min-h-screen pb-32 pt-20">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-accent rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-background" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold">AI Music Assistant</h1>
              <p className="text-muted-foreground">Your personal music curator and discovery companion</p>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Chat Interface */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map((action) => (
                <button
                  key={action.label}
                  onClick={() => setMessage(action.label)}
                  className="glass-card p-4 rounded-xl hover:bg-white/10 transition-colors text-left flex items-center gap-3"
                >
                  <action.icon className="w-5 h-5 text-accent flex-shrink-0" />
                  <span className="text-sm font-medium">{action.label}</span>
                </button>
              ))}
            </div>
            
            {/* Chat Messages */}
            <div className="glass-card rounded-xl p-6 space-y-4 max-h-[600px] overflow-y-auto">
              {chatHistory.map((msg, index) => (
                <div
                  key={index}
                  className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'ai' && (
                    <div className="w-8 h-8 bg-gradient-accent rounded-full flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-4 h-4 text-background" />
                    </div>
                  )}
                  
                  <div
                    className={`max-w-[80%] p-4 rounded-2xl ${
                      msg.role === 'user'
                        ? 'bg-gradient-primary'
                        : 'bg-white/5 border border-white/10'
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                  </div>
                  
                  {msg.role === 'user' && (
                    <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-semibold">You</span>
                    </div>
                  )}
                </div>
              ))}
              
              {isGenerating && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 bg-gradient-accent rounded-full flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-4 h-4 text-background animate-pulse" />
                  </div>
                  <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Input */}
            <form onSubmit={handleSendMessage} className="glass-card p-4 rounded-xl">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Ask me anything about music..."
                  className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/50"
                />
                <button
                  type="submit"
                  disabled={!message.trim() || isGenerating}
                  className="px-6 py-3 bg-gradient-accent text-background rounded-lg font-semibold hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Send className="w-5 h-5" />
                  <span className="hidden sm:inline">Send</span>
                </button>
              </div>
            </form>
          </div>
          
          {/* AI-Generated Playlists */}
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold mb-4">AI-Generated Playlists</h2>
              <div className="space-y-4">
                {mockPlaylists.filter(p => p.isAiGenerated).map((playlist) => (
                  <PlaylistCard key={playlist.id} playlist={playlist} />
                ))}
              </div>
            </div>
            
            <div className="glass-card p-6 rounded-xl">
              <h3 className="font-semibold mb-3">What I Can Do</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                  <span>Create personalized playlists based on mood, activity, or genre</span>
                </li>
                <li className="flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                  <span>Recommend new songs and artists you'll love</span>
                </li>
                <li className="flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                  <span>Analyze your listening habits and provide insights</span>
                </li>
                <li className="flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                  <span>Answer questions about music, artists, and genres</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
