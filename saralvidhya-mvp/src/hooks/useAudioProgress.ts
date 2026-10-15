import { useEffect, useRef, useCallback } from 'react';
import { cloudStorage, syncAudioProgressToCloud } from '@/context/CloudStateContext';

export interface AudioProgress {
  userId: string;
  lessonId: string;
  currentTime: number;
  duration: number;
  updatedAt: number;
  wasPaused: boolean;
}

export interface AudioProgressMetadata {
  subjectId: string;
  chapterNumber: number;
  chapterName: string;
  persona: string;
  track: string;
}

export interface GlobalAudioProgress extends AudioProgressMetadata {
  userId: string;
  lessonId: string;
  currentTime: number;
  updatedAt: number;
  wasPaused: boolean;
}

const LOCAL_PROGRESS_PREFIX = 'audio_progress_';
const INTERVAL_SAVE_MS = 20000;
const MIN_TIME_DELTA = 3;

const getProgressKey = (userId: string, lessonId: string) =>
  `${LOCAL_PROGRESS_PREFIX}${userId}_${lessonId}`;

export async function loadProgress(userId: string, lessonId: string): Promise<AudioProgress | null> {
  if (!userId || !lessonId) return null;

  const key = getProgressKey(userId, lessonId);
  const rawJson = cloudStorage.getItem(key);
  if (rawJson) {
    try {
      const parsed = JSON.parse(rawJson) as AudioProgress;
      if (parsed && typeof parsed.currentTime === 'number') {
        return parsed;
      }
    } catch (error) {
      console.warn('Failed to parse cloud audio progress', error);
    }
  }

  return null;
}

export async function saveProgress(
  userId: string,
  lessonId: string,
  currentTime: number,
  duration: number,
  wasPaused: boolean = false,
  metadata?: AudioProgressMetadata
): Promise<void> {
  if (!userId || !lessonId) return;

  const progressData: AudioProgress = {
    userId,
    lessonId,
    currentTime,
    duration,
    updatedAt: Date.now(),
    wasPaused,
  };

  const key = getProgressKey(userId, lessonId);
  cloudStorage.setItem(key, JSON.stringify(progressData));

  if (metadata) {
    const globalData: GlobalAudioProgress = {
      userId,
      lessonId,
      ...metadata,
      currentTime,
      updatedAt: progressData.updatedAt,
      wasPaused,
    };

    cloudStorage.setItem(`global_last_podcast_${userId}`, JSON.stringify(globalData));

    const chapterId = `chapter_${String(metadata.chapterNumber || 1).padStart(2, '0')}`;
    await syncAudioProgressToCloud({
      subjectId: metadata.subjectId,
      chapterId,
      chapterNumber: metadata.chapterNumber,
      trackId: metadata.track || lessonId,
      title: metadata.track || lessonId,
      chapterTitle: metadata.chapterName,
      currentTime,
      duration,
      completed: duration > 0 && currentTime / duration >= 0.9,
    });
  }
}

export function useAudioProgress(
  userId: string,
  lessonId: string,
  audioRef: React.RefObject<HTMLAudioElement | null>,
  isReady: boolean = true,
  metadata?: AudioProgressMetadata,
  onResumeTime?: (time: number) => void
) {
  const lastSaveAtRef = useRef<number>(0);
  const lastSavedTimeRef = useRef<number>(0);
  const isLoadedRef = useRef<boolean>(false);
  const saveProgressRef = useRef<
    ((currentTime: number, duration: number, wasPaused?: boolean) => Promise<void>) | null
  >(null);

  const saveProgressCallback = useCallback(
    async (currentTime: number, duration: number, wasPaused: boolean = false) => {
      if (!lessonId || currentTime < 0 || duration < 0) return;

      const now = Date.now();
      const timeDelta = Math.abs(currentTime - lastSavedTimeRef.current);

      if (!wasPaused) {
        if (now - lastSaveAtRef.current < INTERVAL_SAVE_MS) return;
        if (timeDelta < MIN_TIME_DELTA) return;
      }

      lastSaveAtRef.current = now;
      lastSavedTimeRef.current = currentTime;
      await saveProgress(userId, lessonId, currentTime, duration, wasPaused, metadata);
    },
    [lessonId, metadata, userId]
  );

  useEffect(() => {
    saveProgressRef.current = saveProgressCallback;
  }, [saveProgressCallback]);

  useEffect(() => {
    let mounted = true;
    const audio = audioRef.current;
    if (!isReady || !audio || !lessonId) return;

    const restore = async () => {
      const progress = await loadProgress(userId, lessonId);
      if (!mounted || !audio || !progress) return;
      const durationKnown = Number.isFinite(audio.duration);
      if (progress.currentTime <= 0 || (durationKnown && progress.currentTime >= audio.duration))
        return;

      const seekToSavedTime = () => {
        if (!audio) return;
        audio.currentTime = progress.currentTime;
        onResumeTime?.(progress.currentTime);
      };

      if (audio.readyState >= 1) {
        seekToSavedTime();
      } else {
        audio.addEventListener('loadedmetadata', seekToSavedTime, { once: true });
      }
    };

    restore();
    isLoadedRef.current = true;

    return () => {
      mounted = false;
    };
  }, [audioRef, isReady, lessonId, onResumeTime, userId]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!isReady || !audio || !lessonId) return;

    const handleSaveOnPause = () => {
      if (!isLoadedRef.current || audio.currentTime === 0 || audio.ended) return;
      saveProgressRef.current?.(audio.currentTime, audio.duration || 0, true);
    };

    const handleSaveOnEnded = () => {
      saveProgressRef.current?.(0, audio.duration || 0, false);
    };

    const handleSaveBeforeUnload = () => {
      saveProgressRef.current?.(audio.currentTime, audio.duration || 0, audio.paused);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        handleSaveBeforeUnload();
      }
    };

    audio.addEventListener('pause', handleSaveOnPause);
    audio.addEventListener('ended', handleSaveOnEnded);

    const intervalId = window.setInterval(() => {
      if (!audio || audio.paused || audio.ended) return;
      saveProgressRef.current?.(audio.currentTime, audio.duration || 0, false);
    }, INTERVAL_SAVE_MS);

    window.addEventListener('beforeunload', handleSaveBeforeUnload);
    window.addEventListener('pagehide', handleSaveBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      audio.removeEventListener('pause', handleSaveOnPause);
      audio.removeEventListener('ended', handleSaveOnEnded);
      window.clearInterval(intervalId);
      window.removeEventListener('beforeunload', handleSaveBeforeUnload);
      window.removeEventListener('pagehide', handleSaveBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [audioRef, isReady, lessonId]);
}
