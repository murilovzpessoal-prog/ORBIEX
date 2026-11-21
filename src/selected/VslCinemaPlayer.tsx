import React, { useEffect, useMemo, useRef, useState } from 'react';
import Hls from 'hls.js';
import { Play, Pause, Volume2, VolumeX, Maximize2 } from 'lucide-react';

interface VslCinemaPlayerProps {
  videoUrl: string;
  embedHtml?: string;
  posterUrl?: string;
  revealWhenRemainingSeconds: number;
  lockScrubber: boolean;
  isUnlocked: boolean;
  onReachRevealPoint: () => void;
}

function parseEmbedUrl(rawUrl: string): string | null {
  const url = rawUrl.trim();
  if (!url) return null;

  const ytMatch = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/
  );
  if (ytMatch?.[1]) {
    return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&rel=0&modestbranding=1&playsinline=1`;
  }

  const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeoMatch?.[1]) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1&title=0&byline=0&portrait=0`;
  }

  if (url.includes('pandavideo.com') && url.includes('embed')) {
    return url;
  }

  return null;
}

export const VslCinemaPlayer: React.FC<VslCinemaPlayerProps> = ({
  videoUrl,
  embedHtml,
  posterUrl,
  revealWhenRemainingSeconds,
  lockScrubber,
  isUnlocked,
  onReachRevealPoint,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);

  const [startedWithAudio, setStartedWithAudio] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [playbackRate, setPlaybackRate] = useState<1 | 1.5>(1);
  const [videoDuration, setVideoDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isVerticalVideo, setIsVerticalVideo] = useState(false);
  const [fallbackMp4, setFallbackMp4] = useState(false);

  const hasCustomHtml = Boolean(embedHtml && embedHtml.trim().length > 0);
  const iframeEmbedUrl = useMemo(() => parseEmbedUrl(videoUrl), [videoUrl]);
  const isIframeMode = hasCustomHtml || Boolean(iframeEmbedUrl);

  const effectiveVideoUrl = fallbackMp4
    ? '/assets/login-earth-orbit.mp4'
    : videoUrl || '/assets/login-earth-orbit.mp4';

  useEffect(() => {
    if (isIframeMode) return;
    const video = videoRef.current;
    if (!video) return;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const isHls = effectiveVideoUrl.includes('.m3u8');

    const tryMutedPreview = () => {
      video.muted = true;
      setIsMuted(true);
      video.play().catch(() => {});
    };

    if (isHls && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        capLevelToPlayerSize: false,
        startLevel: -1,
      });
      hlsRef.current = hls;
      hls.loadSource(effectiveVideoUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (!startedWithAudio) tryMutedPreview();
      });
      hls.on(Hls.Events.ERROR, (_evt, data) => {
        if (data.fatal && !fallbackMp4) setFallbackMp4(true);
      });
    } else {
      video.src = effectiveVideoUrl;
      video.addEventListener(
        'loadedmetadata',
        () => {
          if (!startedWithAudio) tryMutedPreview();
        },
        { once: true }
      );
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [effectiveVideoUrl, isIframeMode, fallbackMp4]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  const handleStartBriefing = (customRate?: 1 | 1.5) => {
    setStartedWithAudio(true);
    const rateToUse = customRate || playbackRate;

    if (isIframeMode) {
      setIsPlaying(true);
      setIsMuted(false);
      return;
    }

    const video = videoRef.current;
    if (!video) return;

    try {
      video.currentTime = 0;
    } catch {}
    video.playbackRate = rateToUse;
    video.muted = false;
    setIsMuted(false);
    video
      .play()
      .then(() => {
        video.playbackRate = rateToUse;
        setIsPlaying(true);
      })
      .catch(() => {
        video.muted = true;
        setIsMuted(true);
        video.play().catch(() => {});
      });
  };

  const togglePlay = () => {
    if (!startedWithAudio) {
      handleStartBriefing();
      return;
    }
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.playbackRate = playbackRate;
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  };

  const toggleSpeed15x = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextRate: 1 | 1.5 = playbackRate === 1.5 ? 1 : 1.5;
    setPlaybackRate(nextRate);

    if (!startedWithAudio) {
      handleStartBriefing(nextRate);
      return;
    }

    if (videoRef.current) {
      videoRef.current.playbackRate = nextRate;
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    const next = !video.muted;
    video.muted = next;
    setIsMuted(next);
  };

  const handleFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      el.requestFullscreen?.().catch(() => {});
    }
  };

  const syncMetadata = (v: HTMLVideoElement) => {
    if (Number.isFinite(v.duration) && v.duration > 0) {
      setVideoDuration(v.duration);
    }
    if (v.videoWidth > 0 && v.videoHeight > v.videoWidth) {
      setIsVerticalVideo(true);
    } else if (v.videoWidth > 0) {
      setIsVerticalVideo(false);
    }
  };

  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const v = e.currentTarget;
    const now = v.currentTime || 0;
    setCurrentTime(now);

    if (
      !isUnlocked &&
      startedWithAudio &&
      !v.muted &&
      Number.isFinite(v.duration) &&
      v.duration > 0
    ) {
      const remaining = v.duration - now;
      if (remaining <= revealWhenRemainingSeconds) {
        onReachRevealPoint();
      }
    }
  };

  const smartVisualProgress = useMemo(() => {
    if (videoDuration > 0 && currentTime > 0) {
      const linear = Math.min(1, currentTime / videoDuration);
      return Math.min(100, Math.pow(linear, 0.6) * 100);
    }
    return 0;
  }, [currentTime, videoDuration]);

  return (
    <div className={`mx-auto w-full ${isVerticalVideo ? 'max-w-[390px]' : 'max-w-4xl'}`}>
      {/* Moldura Executiva da VSL */}
      <div
        ref={containerRef}
        onClick={!isIframeMode ? togglePlay : undefined}
        className={`group relative w-full overflow-hidden rounded-2xl border border-white/[0.12] bg-black shadow-[0_30px_90px_rgba(0,0,0,0.88)] cursor-pointer select-none ${
          isVerticalVideo ? 'aspect-[9/16]' : 'aspect-video'
        }`}
      >
        {/* Botãozinho Discreto 1.5x no Canto Superior Direito */}
        {!isIframeMode && (
          <button
            type="button"
            onClick={toggleSpeed15x}
            title={playbackRate === 1.5 ? 'Voltar para velocidade 1x' : 'Acelerar vídeo para 1.5x'}
            className={`absolute top-3 right-3 z-30 inline-flex items-center justify-center rounded-md px-2 py-0.5 text-[10.5px] font-semibold tracking-tight backdrop-blur-md transition-all duration-200 ${
              playbackRate === 1.5
                ? 'bg-white text-black border border-white shadow-[0_2px_12px_rgba(255,255,255,0.25)]'
                : 'bg-black/55 text-white/75 border border-white/15 hover:bg-black/75 hover:text-white hover:border-white/30'
            }`}
          >
            1.5x
          </button>
        )}

        {hasCustomHtml ? (
          <div
            className="h-full w-full [&_iframe]:h-full [&_iframe]:w-full [&_iframe]:border-0"
            dangerouslySetInnerHTML={{ __html: embedHtml || '' }}
          />
        ) : iframeEmbedUrl ? (
          startedWithAudio ? (
            <iframe
              src={iframeEmbedUrl}
              title="Apresentação Alpine Project"
              className="h-full w-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <img
              src={posterUrl || '/assets/banner-formacao-oficial-hd.jpg'}
              alt="Apresentação"
              className="h-full w-full object-cover opacity-50 transition-transform duration-700 group-hover:scale-[1.01]"
            />
          )
        ) : (
          <video
            ref={videoRef}
            poster={posterUrl || undefined}
            playsInline
            controls={!lockScrubber && startedWithAudio}
            onPlay={(e) => {
              e.currentTarget.playbackRate = playbackRate;
              setIsPlaying(true);
            }}
            onPause={() => setIsPlaying(false)}
            onLoadedMetadata={(e) => syncMetadata(e.currentTarget)}
            onDurationChange={(e) => syncMetadata(e.currentTarget)}
            onTimeUpdate={handleTimeUpdate}
            onEnded={() => {
              if (!isUnlocked && startedWithAudio) {
                onReachRevealPoint();
              }
            }}
            onError={() => {
              if (!fallbackMp4) setFallbackMp4(true);
            }}
            className="h-full w-full object-contain bg-black"
          />
        )}

        {/* Overlay Minimalista de Play Inicial */}
        {!startedWithAudio && !hasCustomHtml && (
          <div
            onClick={(e) => {
              e.stopPropagation();
              handleStartBriefing();
            }}
            className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/50 backdrop-blur-[1.5px] transition-colors hover:bg-black/40"
          >
            <div className="flex h-18 w-18 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-white text-black shadow-[0_12px_40px_rgba(0,0,0,0.65)] transition-transform duration-300 group-hover:scale-105">
              <Play size={26} fill="black" className="ml-1" />
            </div>
            <span className="mt-4 text-[12px] font-medium tracking-wide text-white/85">
              Clique para iniciar o vídeo com som
            </span>
          </div>
        )}

        {/* Overlay Discreto de Pausa */}
        {startedWithAudio && !isPlaying && !isIframeMode && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/50 backdrop-blur-[2px]">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-md transition hover:scale-105">
              <Play size={22} fill="white" className="ml-1" />
            </div>
          </div>
        )}

        {/* Controles Discretos no Hover */}
        {startedWithAudio && !isIframeMode && lockScrubber && (
          <div className="absolute inset-x-0 bottom-0 z-30 flex items-center justify-between bg-gradient-to-t from-black/80 via-black/30 to-transparent px-4 pt-8 pb-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  togglePlay();
                }}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition"
                aria-label={isPlaying ? 'Pausar' : 'Reproduzir'}
              >
                {isPlaying ? <Pause size={15} /> : <Play size={15} className="ml-0.5" />}
              </button>

              <button
                type="button"
                onClick={toggleMute}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition"
                aria-label={isMuted ? 'Ativar som' : 'Silenciar'}
              >
                {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
              </button>
            </div>

            <button
              type="button"
              onClick={handleFullscreen}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-white/75 hover:text-white hover:bg-white/10 transition"
              aria-label="Tela cheia"
            >
              <Maximize2 size={14} />
            </button>
          </div>
        )}

        {/* Linha de Progresso Fina Branca na Base */}
        {startedWithAudio && !isIframeMode && lockScrubber && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 h-[2px] bg-white/10">
            <div
              className="h-full bg-white transition-all duration-300"
              style={{ width: `${smartVisualProgress}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
};
