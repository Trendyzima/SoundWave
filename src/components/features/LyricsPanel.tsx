import { useState, useEffect } from 'react';
import { X, FileText, Music } from 'lucide-react';
import { usePlayerStore } from '../../stores/playerStore';

interface LyricsPanelProps {
  onClose: () => void;
}

// Sample lyrics - in production, fetch from backend
const SAMPLE_LYRICS = `[00:12.00]Verse 1:
[00:15.50]Lost in the rhythm, feeling the beat
[00:19.20]Dancing to the music on a crowded street
[00:23.00]Lights are flashing, hearts are racing
[00:26.80]This is our moment, let's keep chasing

[00:30.50]Pre-Chorus:
[00:32.00]We're alive tonight
[00:35.50]Under the neon lights
[00:39.00]Nothing can stop us now
[00:42.50]We're flying high somehow

[00:46.00]Chorus:
[00:48.00]This is our song, our anthem to the stars
[00:52.50]Playing all night long, no matter where we are
[00:56.00]Turn it up louder, feel the energy
[01:00.00]This is our soundtrack to infinity

[01:04.00]Verse 2:
[01:06.50]Every moment matters when you're by my side
[01:10.20]Every beat that matters makes our spirits fly
[01:14.00]We're unstoppable, unbreakable
[01:17.80]Together we're untamed and capable

[01:21.50]Pre-Chorus:
[01:23.00]We're alive tonight
[01:26.50]Under the neon lights
[01:30.00]Nothing can stop us now
[01:33.50]We're flying high somehow

[01:37.00]Chorus:
[01:39.00]This is our song, our anthem to the stars
[01:43.50]Playing all night long, no matter where we are
[01:47.00]Turn it up louder, feel the energy
[01:51.00]This is our soundtrack to infinity

[01:55.00]Bridge:
[01:57.00]Let the music take control
[02:00.50]Feel it deep within your soul
[02:04.00]We're never gonna let it go
[02:07.50]This is all we need to know

[02:11.00]Final Chorus:
[02:13.00]This is our song, our anthem to the stars
[02:17.50]Playing all night long, no matter where we are
[02:21.00]Turn it up louder, feel the energy
[02:25.00]This is our soundtrack to infinity
[02:29.00]This is our soundtrack to infinity`;

export default function LyricsPanel({ onClose }: LyricsPanelProps) {
  const { currentSong, currentTime } = usePlayerStore();
  const [lyrics, setLyrics] = useState<{ time: number; text: string }[]>([]);
  const [activeLine, setActiveLine] = useState(0);
  
  useEffect(() => {
    if (currentSong) {
      // Parse lyrics
      const parsed = SAMPLE_LYRICS.split('\n').map(line => {
        const match = line.match(/\[(\d{2}):(\d{2}\.\d{2})\](.*)/);
        if (match) {
          const minutes = parseInt(match[1]);
          const seconds = parseFloat(match[2]);
          const time = minutes * 60 + seconds;
          return { time, text: match[3].trim() };
        }
        return { time: 0, text: line };
      }).filter(line => line.text);
      
      setLyrics(parsed);
    }
  }, [currentSong]);
  
  useEffect(() => {
    // Find active line based on current time
    const active = lyrics.findIndex((line, index) => {
      const nextLine = lyrics[index + 1];
      return currentTime >= line.time && (!nextLine || currentTime < nextLine.time);
    });
    
    if (active >= 0) {
      setActiveLine(active);
    }
  }, [currentTime, lyrics]);
  
  if (!currentSong) {
    return null;
  }
  
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-background via-background/95 to-background/90 border border-white/10 rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2 mb-2">
                <FileText className="w-6 h-6" />
                Lyrics
              </h2>
              <div className="flex items-center gap-3">
                <img
                  src={currentSong.coverUrl}
                  alt={currentSong.title}
                  className="w-12 h-12 rounded-lg object-cover"
                />
                <div>
                  <h3 className="font-semibold">{currentSong.title}</h3>
                  <p className="text-sm text-muted-foreground">{currentSong.artist}</p>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
        
        {/* Lyrics Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {lyrics.length === 0 ? (
            <div className="text-center py-12">
              <Music className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-semibold mb-2">No Lyrics Available</h3>
              <p className="text-muted-foreground">
                Lyrics for this song haven't been added yet
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {lyrics.map((line, index) => (
                <p
                  key={index}
                  className={`text-lg transition-all duration-300 ${
                    index === activeLine
                      ? 'text-primary font-bold text-2xl scale-110 transform'
                      : index < activeLine
                      ? 'text-muted-foreground opacity-50'
                      : 'text-foreground opacity-70'
                  }`}
                >
                  {line.text}
                </p>
              ))}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-white/10 text-center text-xs text-muted-foreground">
          Synchronized lyrics powered by SoundWave
        </div>
      </div>
    </div>
  );
}
