import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, SkipForward, Volume2, VolumeX, Music, ListMusic, X, Youtube, Repeat } from 'lucide-react';

interface Track {
  title: string;
  artist?: string;
  url: string;
}

const DEFAULT_PLAYLIST: Track[] = [
    {
    title: "Tìm Thấy Nhau",
    artist: "SIVAN",
    url: "https://youtu.be/QTULiXpMgLk?list=RDrYWLIJB214Q"
  },
  {
    title: "hate that i made you love me",
    artist: "🤍",
    url: "https://youtu.be/v1t4MTqdfyI?list=RDv1t4MTqdfyI"
  },
  {
    title: "Pray",
    artist: "đức mẹ Lana",
    url: "https://youtu.be/H86JZTaEnHM?list=RDH86JZTaEnHM"
  },
  {
    title: "孤独Person",
    url: "https://youtu.be/BR9hc_PedHE?list=RDBR9hc_PedHE"
  },
  {
    title: "Star Crossing Night",
    artist: "THE 8",
    url: "https://youtu.be/wBKET1fSxnQ?list=RDwBKET1fSxnQ"
  },
  {
    title: "🤍",
    artist: "🖤",
    url: "https://youtu.be/NV3UdUKWPIo?list=RDNV3UdUKWPIo"
  },
];

function getYoutubeId(url: string): string | null {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

export function MusicPlayer() {
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [showAutoplayTip, setShowAutoplayTip] = useState(true);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const prevYoutubeIdRef = useRef<string | null>(null);
  const currentTrack = DEFAULT_PLAYLIST[currentTrackIndex];
  const youtubeId = getYoutubeId(currentTrack.url);
  const volume = 0.5;

  // Handle track switches smoothly without remounting YouTube iframe
  useEffect(() => {
    if (youtubeId) {
      if (audioRef.current) {
        audioRef.current.pause();
      }

      const ytPlayer = document.getElementById('yt-player') as HTMLIFrameElement;
      if (ytPlayer && ytPlayer.contentWindow) {
        if (prevYoutubeIdRef.current !== youtubeId) {
          const cmd = isPlaying ? 'loadVideoById' : 'cueVideoById';
          ytPlayer.contentWindow.postMessage(
            JSON.stringify({ event: 'command', func: cmd, args: [youtubeId, 0] }),
            '*'
          );
        }
      }
      prevYoutubeIdRef.current = youtubeId;
      return;
    }

    // HTML5 Audio fallback for direct audio files
    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audio = new Audio(currentTrack.url);
    audioRef.current = audio;
    audio.volume = isMuted ? 0 : volume;
    audio.loop = isLooping;

    audio.onended = () => {
      if (!isLooping) {
        handleNext();
      }
    };

    if (isPlaying) {
      audio.play()
        .then(() => setShowAutoplayTip(false))
        .catch(err => {
          console.log("Audio play blocked, waiting for interaction:", err);
          setShowAutoplayTip(true);
        });
    }

    return () => {
      audio.pause();
    };
  }, [currentTrackIndex, youtubeId]);

  // Document-level fallback to bypass modern browser autoplay policy on user interaction
  useEffect(() => {
    const startAudioOnFirstInteraction = () => {
      setShowAutoplayTip(false);
      if (isPlaying) {
        if (audioRef.current && audioRef.current.paused && !youtubeId) {
          audioRef.current.play().catch(err => console.log("Interaction play failed:", err));
        }
        if (youtubeId) {
          const ytPlayer = document.getElementById('yt-player') as HTMLIFrameElement;
          if (ytPlayer && ytPlayer.contentWindow) {
            ytPlayer.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'playVideo', args: [] }), '*');
            ytPlayer.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'unMute', args: [] }), '*');
          }
        }
      }
    };

    document.addEventListener('click', startAudioOnFirstInteraction, { once: false });
    document.addEventListener('touchstart', startAudioOnFirstInteraction, { once: false });

    return () => {
      document.removeEventListener('click', startAudioOnFirstInteraction);
      document.removeEventListener('touchstart', startAudioOnFirstInteraction);
    };
  }, [isPlaying, youtubeId]);

  // Sync volume with HTML5 Audio
  useEffect(() => {
    if (audioRef.current && !youtubeId) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [isMuted, youtubeId]);

  // Sync loop settings
  useEffect(() => {
    if (audioRef.current && !youtubeId) {
      audioRef.current.loop = isLooping;
      audioRef.current.onended = () => {
        if (!isLooping) {
          handleNext();
        }
      };
    }
  }, [isLooping, youtubeId]);

  // YouTube player event communication via postMessage
  useEffect(() => {
    const handleYoutubeMessage = (event: MessageEvent) => {
      if (!event.origin.includes("youtube.com") && !event.origin.includes("youtube-nocookie.com")) {
        return;
      }

      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        
        // When player is ready or initialized
        if (data && (data.event === "onReady" || data.event === "initialDelivery")) {
          const ytPlayer = document.getElementById('yt-player') as HTMLIFrameElement;
          if (ytPlayer && ytPlayer.contentWindow) {
            if (isPlaying) {
              ytPlayer.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'playVideo', args: [] }), '*');
            }
            const muteCmd = isMuted ? 'mute' : 'unMute';
            ytPlayer.contentWindow.postMessage(JSON.stringify({ event: 'command', func: muteCmd, args: [] }), '*');
          }
        }

        if (data && data.event === "onStateChange") {
          const playerState = data.info;
          // YT.PlayerState.ENDED is 0
          if (playerState === 0) {
            if (isLooping) {
              const ytPlayer = document.getElementById('yt-player') as HTMLIFrameElement;
              if (ytPlayer && ytPlayer.contentWindow) {
                ytPlayer.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'seekTo', args: [0, true] }), '*');
                ytPlayer.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'playVideo', args: [] }), '*');
              }
            } else {
              handleNext();
            }
          }
        }
      } catch (err) {
        // Safe to ignore non-JSON messages
      }
    };

    window.addEventListener("message", handleYoutubeMessage);
    return () => {
      window.removeEventListener("message", handleYoutubeMessage);
    };
  }, [isLooping, isPlaying, isMuted, currentTrackIndex]);

  // Sync play/pause state with YouTube iframe
  useEffect(() => {
    if (youtubeId) {
      const ytPlayer = document.getElementById('yt-player') as HTMLIFrameElement;
      if (ytPlayer && ytPlayer.contentWindow) {
        const command = isPlaying ? 'playVideo' : 'pauseVideo';
        ytPlayer.contentWindow.postMessage(JSON.stringify({ event: 'command', func: command, args: [] }), '*');
      }
    }
  }, [isPlaying, youtubeId]);

  // Sync mute state with YouTube iframe
  useEffect(() => {
    if (youtubeId) {
      const ytPlayer = document.getElementById('yt-player') as HTMLIFrameElement;
      if (ytPlayer && ytPlayer.contentWindow) {
        const command = isMuted ? 'mute' : 'unMute';
        ytPlayer.contentWindow.postMessage(JSON.stringify({ event: 'command', func: command, args: [] }), '*');
      }
    }
  }, [isMuted, youtubeId]);

  const togglePlay = () => {
    setShowAutoplayTip(false);
    if (youtubeId) {
      setIsPlaying(!isPlaying);
    } else {
      if (!audioRef.current) return;
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play()
          .then(() => setIsPlaying(true))
          .catch(err => console.log("Play failed:", err));
      }
    }
  };

  const handleNext = () => {
    setShowAutoplayTip(false);
    setCurrentTrackIndex((prev) => (prev + 1) % DEFAULT_PLAYLIST.length);
    setIsPlaying(true);
  };

  const handlePrev = () => {
    setShowAutoplayTip(false);
    setCurrentTrackIndex((prev) => (prev - 1 + DEFAULT_PLAYLIST.length) % DEFAULT_PLAYLIST.length);
    setIsPlaying(true);
  };

  const toggleMute = () => {
    setShowAutoplayTip(false);
    setIsMuted(!isMuted);
  };

  const toggleLoop = () => {
    setIsLooping(!isLooping);
  };

  return (
    <>
      {/* Background YouTube Audio IFrame (Persistent DOM element without key prop to maintain media session on iOS Safari) */}
      <div className="fixed -top-96 -left-96 w-32 h-32 opacity-0 pointer-events-none z-[-999] overflow-hidden">
        <iframe
          id="yt-player"
          width="100%"
          height="100%"
          src={`https://www.youtube.com/embed/${youtubeId || 'v1t4MTqdfyI'}?autoplay=1&controls=0&showinfo=0&rel=0&enablejsapi=1&playsinline=1`}
          title="YouTube Player Background"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        />
      </div>

      {/* Floating Circular Compact Music Bubble */}
      <div className="fixed bottom-6 left-6 z-[999] flex flex-col items-start gap-2">
        {/* Autoplay Helper Tooltip */}
        <AnimatePresence>
          {showAutoplayTip && isPlaying && !isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.9 }}
              className="px-3 py-1.5 rounded-xl bg-zinc-950/90 text-zinc-300 border border-zinc-800 text-[10px] font-medium shadow-xl backdrop-blur-md whitespace-nowrap pointer-events-none select-none relative mb-1"
            > welcome my babies🌟
              <div className="absolute -bottom-1 left-5 w-2 h-2 bg-zinc-950 border-r border-b border-zinc-800 rotate-45" />
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          id="floating-music-bubble"
          onClick={() => {
            setIsOpen(!isOpen);
            setShowAutoplayTip(false);
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`w-12 h-12 rounded-full flex items-center justify-center border transition-all cursor-pointer shadow-lg select-none ${
            isPlaying 
              ? 'bg-zinc-100 text-zinc-950 border-white shadow-zinc-100/10' 
              : 'bg-zinc-950/80 hover:bg-zinc-900 text-zinc-400 border-zinc-800 backdrop-blur-md'
          }`}
          title="Trình phát nhạc thư giãn"
        >
          {isPlaying ? (
            <div className="relative w-full h-full flex items-center justify-center">
              {/* Spinning vinyl effect */}
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 6, ease: 'linear' }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <Music className="w-5 h-5 stroke-[2.5]" />
              </motion.div>
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border border-zinc-100 animate-ping" />
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border border-zinc-100" />
            </div>
          ) : (
            <Music className="w-5 h-5" />
          )}
        </motion.button>
      </div>

      {/* Glassmorphic Player Control Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-[1000]" 
              onClick={() => setIsOpen(false)} 
            />

            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="fixed bottom-20 left-6 z-[1001] w-[290px] sm:w-[310px] bg-zinc-950/95 border border-zinc-850 rounded-3xl p-5 shadow-2xl backdrop-blur-lg flex flex-col gap-4 select-none text-zinc-200"
            >
              <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-zinc-400 to-transparent"></div>

              {/* Top Row */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-zinc-400 tracking-wider uppercase flex items-center gap-1.5 font-mono">
                  <Music className="w-3.5 h-3.5 text-zinc-300" />
                  MÚC NHẠC COZY 𝜗ৎ
                </span>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-6 h-6 rounded-full flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Active Track Info Card */}
              <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 flex gap-3 items-center relative overflow-hidden">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  isPlaying ? 'bg-zinc-100 text-zinc-950' : 'bg-zinc-900 text-zinc-500'
                }`}>
                  {youtubeId ? (
                    <Youtube className="w-4 h-4" />
                  ) : (
                    <Music className="w-4 h-4" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-zinc-100 truncate">{currentTrack.title}</p>
                  <p className="text-[9px] text-zinc-400 truncate mt-0.5">{currentTrack.artist || 'Unknown'}</p>
                </div>
              </div>

              {/* Playback Controls Row */}
              <div className="flex items-center justify-between px-1">
                <button
                  onClick={toggleLoop}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer active:scale-95 ${
                    isLooping 
                      ? 'text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20' 
                      : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
                  }`}
                  title={isLooping ? "Đang bật lặp lại bài" : "Đang tắt lặp lại bài"}
                >
                  <Repeat className="w-4 h-4" />
                </button>

                <button
                  onClick={handlePrev}
                  className="w-8 h-8 rounded-full hover:bg-white/5 flex items-center justify-center text-zinc-400 hover:text-white transition-all cursor-pointer active:scale-95"
                  title="Bài trước"
                >
                  <SkipForward className="w-4 h-4 rotate-180" />
                </button>

                <button
                  onClick={togglePlay}
                  className="w-10 h-10 rounded-full bg-zinc-100 hover:bg-white text-zinc-950 flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-md shadow-zinc-100/5"
                  title={isPlaying ? "Tạm dừng" : "Phát nhạc"}
                >
                  {isPlaying ? (
                    <Pause className="w-4 h-4 fill-current text-zinc-950" />
                  ) : (
                    <Play className="w-4 h-4 fill-current text-zinc-950 ml-0.5" />
                  )}
                </button>

                <button
                  onClick={handleNext}
                  className="w-8 h-8 rounded-full hover:bg-white/5 flex items-center justify-center text-zinc-400 hover:text-white transition-all cursor-pointer active:scale-95"
                  title="Bài tiếp theo"
                >
                  <SkipForward className="w-4 h-4" />
                </button>

                <button
                  onClick={toggleMute}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                    isMuted 
                      ? 'text-rose-400 bg-rose-500/10 hover:bg-rose-500/20' 
                      : 'text-zinc-400 hover:text-white hover:bg-white/5'
                  }`}
                  title={isMuted ? "Bật âm thanh" : "Tắt tiếng"}
                >
                  {isMuted ? (
                    <VolumeX className="w-4 h-4" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Playlist Section Header */}
              <div className="border-t border-white/5 pt-3">
                <p className="text-[10px] font-bold text-zinc-400 tracking-wide uppercase mb-2 flex items-center gap-1 font-mono">
                  <ListMusic className="w-3.5 h-3.5" />
                  DANH SÁCH BÀI HÁT
                </p>

                <div className="space-y-1 max-h-[140px] overflow-y-auto custom-scrollbar pr-1">
                  {DEFAULT_PLAYLIST.map((track, idx) => {
                    const isSelected = currentTrackIndex === idx;
                    const isTrackYt = getYoutubeId(track.url) !== null;

                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          setShowAutoplayTip(false);
                          setCurrentTrackIndex(idx);
                          setIsPlaying(true);
                        }}
                        className={`w-full p-2 rounded-xl text-left transition-all flex items-center justify-between text-[11px] cursor-pointer ${
                          isSelected
                            ? 'bg-zinc-100 text-zinc-950 font-bold'
                            : 'hover:bg-white/5 text-zinc-300'
                        }`}
                      >
                        <div className="truncate pr-2">
                          <p className="truncate flex items-center gap-1">
                            {isTrackYt && <Youtube className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-zinc-950' : 'text-zinc-500'}`} />}
                            {track.title}
                          </p>
                        </div>
                        {isSelected && isPlaying ? (
                          <div className="flex gap-0.5 items-end h-3 shrink-0">
                            <span className={`w-0.5 animate-bounce ${isSelected ? 'bg-zinc-950' : 'bg-zinc-200'}`} style={{ height: '60%', animationDelay: '0.1s' }} />
                            <span className={`w-0.5 animate-bounce ${isSelected ? 'bg-zinc-950' : 'bg-zinc-200'}`} style={{ height: '100%', animationDelay: '0.3s' }} />
                            <span className={`w-0.5 animate-bounce ${isSelected ? 'bg-zinc-950' : 'bg-zinc-200'}`} style={{ height: '40%', animationDelay: '0.5s' }} />
                          </div>
                        ) : (
                          isSelected && <span className="text-[9px] opacity-75">Active</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
