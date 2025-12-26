import { useState } from 'react';
import { Download, Loader2, Check } from 'lucide-react';
import { Song } from '../../types';
import { downloadSongForOffline, isSongDownloaded } from '../../lib/localMusic';
import { useEffect } from 'react';

interface DownloadButtonProps {
  song: Song;
  className?: string;
}

export default function DownloadButton({ song, className = '' }: DownloadButtonProps) {
  const [downloading, setDownloading] = useState(false);
  const [isDownloaded, setIsDownloaded] = useState(false);
  
  useEffect(() => {
    checkDownloaded();
  }, [song.id]);
  
  const checkDownloaded = async () => {
    const downloaded = await isSongDownloaded(song.id);
    setIsDownloaded(downloaded);
  };
  
  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isDownloaded) return;
    
    setDownloading(true);
    try {
      await downloadSongForOffline(song);
      setIsDownloaded(true);
    } catch (error) {
      console.error('Error downloading song:', error);
      alert('Failed to download song for offline listening');
    } finally {
      setDownloading(false);
    }
  };
  
  return (
    <button
      onClick={handleDownload}
      disabled={downloading || isDownloaded}
      className={`flex items-center gap-2 transition-colors disabled:cursor-not-allowed ${className}`}
      title={isDownloaded ? 'Downloaded for offline' : 'Download for offline listening'}
    >
      {downloading ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Downloading...</span>
        </>
      ) : isDownloaded ? (
        <>
          <Check className="w-5 h-5 text-green-500" />
          <span className="text-sm text-green-500">Downloaded</span>
        </>
      ) : (
        <>
          <Download className="w-5 h-5" />
          <span className="text-sm">Download</span>
        </>
      )}
    </button>
  );
}
