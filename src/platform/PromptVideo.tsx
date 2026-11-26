import { useEffect, useRef, useState } from 'react';
import {
  isImgurPageUrl,
  needsRemoteVideoResolve,
  normalizePromptMediaUrl,
  resolveRemoteVideoUrl,
} from './promptsStore';

interface PromptVideoProps {
  src: string;
  className?: string;
  onReady?: (resolvedSrc: string) => void;
  onFail?: () => void;
  showUnavailableFallback?: boolean;
}

/**
 * Reprodutor de vídeo em loop para cards de Prompt:
 * - Converte links de página do Imgur/Dropbox/Drive para URL .mp4 direta
 * - Tenta recuperação remota automática caso o link salvo aponte para álbum Imgur (/a/... ou /gallery/...)
 * - Garante muted + playsinline no DOM antes de acionar play()
 */
export function PromptVideo({
  src,
  className = '',
  onReady,
  onFail,
  showUnavailableFallback = false,
}: PromptVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [resolvedSrc, setResolvedSrc] = useState<string>(() => normalizePromptMediaUrl(src));
  const [attemptedRemote, setAttemptedRemote] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    const initial = normalizePromptMediaUrl(src);
    setFailed(false);
    setAttemptedRemote(false);
    setResolvedSrc(initial);

    if (needsRemoteVideoResolve(src) || needsRemoteVideoResolve(initial)) {
      setAttemptedRemote(true);
      void resolveRemoteVideoUrl(src).then((res) => {
        if (!active) return;
        if (res.ok && res.mediaUrl && !isImgurPageUrl(res.mediaUrl)) {
          setResolvedSrc(res.mediaUrl);
        } else if (isImgurPageUrl(initial)) {
          setFailed(true);
          onFail?.();
        }
      });
    }

    return () => {
      active = false;
    };
  }, [src]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !resolvedSrc || isImgurPageUrl(resolvedSrc)) return;
    el.defaultMuted = true;
    el.muted = true;
    el.setAttribute('muted', '');
    el.setAttribute('playsinline', '');
    el.setAttribute('webkit-playsinline', '');
    el.load();
    const p = el.play();
    if (p && typeof p.catch === 'function') {
      p.catch(() => {});
    }
  }, [resolvedSrc]);

  const handleVideoError = async () => {
    if (!attemptedRemote) {
      setAttemptedRemote(true);
      const res = await resolveRemoteVideoUrl(src);
      if (res.ok && res.mediaUrl && res.mediaUrl !== resolvedSrc && !isImgurPageUrl(res.mediaUrl)) {
        setResolvedSrc(res.mediaUrl);
        return;
      }
    }
    setFailed(true);
    onFail?.();
  };

  if (failed && showUnavailableFallback) {
    return (
      <div
        className={`flex items-center justify-center bg-[#0d0c0a] p-4 text-center text-[11px] font-medium text-white/45 ${className}`}
      >
        Vídeo indisponível nesta URL
      </div>
    );
  }

  return (
    <video
      ref={videoRef}
      key={resolvedSrc}
      src={isImgurPageUrl(resolvedSrc) ? undefined : resolvedSrc}
      autoPlay
      loop
      muted
      playsInline
      preload="auto"
      {...({ referrerPolicy: 'no-referrer' } as Record<string, string>)}
      onLoadedData={() => {
        setFailed(false);
        const el = videoRef.current;
        if (el) {
          el.muted = true;
          const p = el.play();
          if (p && typeof p.catch === 'function') p.catch(() => {});
        }
        onReady?.(resolvedSrc);
      }}
      onError={() => {
        void handleVideoError();
      }}
      className={className}
    />
  );
}
