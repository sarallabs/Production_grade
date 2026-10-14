import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  LayoutChangeEvent,
  Platform,
} from 'react-native';
import YoutubePlayer, { YoutubeIframeRef } from 'react-native-youtube-iframe';
import * as Linking from 'expo-linking';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/context/ThemeContext';
import { BorderRadius, Spacing } from '@/constants/theme';
import {
  ChapterVideo,
  fetchChapterVideos,
  getWatchedVideos,
  markVideoWatched,
} from '@/services/contentService';
import { useDeviceLayout } from '@/hooks/use-device-layout';

const WATCHED_THRESHOLD_PCT = 90;

interface VideosViewProps {
  subjectId: string;
  chapterNumber: number;
  chapterName: string;
}

export default function VideosView({ subjectId, chapterNumber, chapterName }: VideosViewProps) {
  const { isDark } = useAppTheme();
  const { isTablet } = useDeviceLayout();
  const playerRef = useRef<YoutubeIframeRef>(null);
  const progressTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const [videos, setVideos] = useState<ChapterVideo[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [activeIdx, setActiveIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);
  const [playerError, setPlayerError] = useState<string | null>(null);
  const [progressPct, setProgressPct] = useState(0);
  const [watched, setWatched] = useState<string[]>([]);
  const [containerWidth, setContainerWidth] = useState(0);

  const currentVideo = videos[activeIdx] ?? videos[0];
  const playerHeight = Math.round((containerWidth * 9) / 16);

  // Colors
  const textColor = isDark ? '#FFFFFF' : '#1C2E24';
  const subtextColor = isDark ? '#A6C5B3' : '#557A65';
  const itemBg = isDark ? '#1E2B24' : '#F7F1EC';
  const itemBorder = isDark ? '#3D5449' : '#E5DDD8';

  // Load video list + watched state when chapter changes
  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();
    setIsLoadingList(true);
    setActiveIdx(0);
    setPlaying(false);
    setPlayerReady(false);
    setPlayerError(null);
    setProgressPct(0);

    Promise.all([
      fetchChapterVideos(subjectId, chapterNumber, controller.signal),
      getWatchedVideos(subjectId, chapterNumber),
    ])
      .then(([list, w]) => {
        if (!mounted) return;
        setVideos(list);
        setWatched(w);
      })
      .catch((err) => {
        if (!controller.signal.aborted) {
          console.warn('Videos loading error:', err);
        }
      })
      .finally(() => mounted && setIsLoadingList(false));

    return () => {
      mounted = false;
      controller.abort();
    };
  }, [subjectId, chapterNumber]);

  const stopProgressTimer = useCallback(() => {
    if (progressTimer.current) {
      clearInterval(progressTimer.current);
      progressTimer.current = null;
    }
  }, []);

  // Stop timers on unmount (player itself unmounts and stops audio)
  useEffect(() => stopProgressTimer, [stopProgressTimer]);

  const handleWatched = useCallback(
    async (ytId: string) => {
      const next = await markVideoWatched(subjectId, chapterNumber, ytId);
      setWatched(next);
    },
    [subjectId, chapterNumber]
  );

  const startProgressTimer = useCallback(() => {
    stopProgressTimer();
    progressTimer.current = setInterval(async () => {
      try {
        const [cur, dur] = await Promise.all([
          playerRef.current?.getCurrentTime(),
          playerRef.current?.getDuration(),
        ]);
        if (cur != null && dur && dur > 0) {
          const pct = (cur / dur) * 100;
          setProgressPct(pct);
          if (pct >= WATCHED_THRESHOLD_PCT && currentVideo) {
            handleWatched(currentVideo.ytId);
          }
        }
      } catch {
        // player not ready yet
      }
    }, 1000);
  }, [currentVideo, handleWatched, stopProgressTimer]);

  const onChangeState = useCallback(
    (state: string) => {
      if (state === 'playing') {
        setPlaying(true);
        startProgressTimer();
      } else if (state === 'paused') {
        setPlaying(false);
        stopProgressTimer();
      } else if (state === 'ended') {
        setPlaying(false);
        stopProgressTimer();
        setProgressPct(100);
        if (currentVideo) handleWatched(currentVideo.ytId);
      }
    },
    [currentVideo, handleWatched, startProgressTimer, stopProgressTimer]
  );

  const selectVideo = (idx: number) => {
    if (idx === activeIdx) return;
    Haptics.selectionAsync();
    stopProgressTimer();
    setActiveIdx(idx);
    setPlaying(false);
    setPlayerReady(false);
    setPlayerError(null);
    setProgressPct(0);
  };

  const openInYouTube = () => {
    if (currentVideo) Linking.openURL(`https://www.youtube.com/watch?v=${currentVideo.ytId}`);
  };

  const onLayout = (e: LayoutChangeEvent) => {
    const w = Math.floor(e.nativeEvent.layout.width);
    if (w > 0 && w !== containerWidth) setContainerWidth(w);
  };

  if (isLoadingList) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#22c55e" />
        <Text style={[styles.loadingText, { color: subtextColor }]}>Loading video lectures...</Text>
      </View>
    );
  }

  if (!currentVideo) {
    return (
      <View style={styles.centered}>
        <Ionicons name="videocam-off-outline" size={40} color={subtextColor} />
        <Text style={[styles.loadingText, { color: subtextColor }]}>
          No videos available for this chapter yet.
        </Text>
      </View>
    );
  }

  return (
    <View onLayout={onLayout} style={[styles.container, isTablet && { width: '100%', maxWidth: 820, alignSelf: 'center' }]}>
      {/* Player */}
      <View
        style={[
          styles.playerWrap,
          Platform.OS === 'web' ? { aspectRatio: 16 / 9 } : { height: playerHeight || 200 },
        ]}
      >
        {!playerError && Platform.OS === 'web' && (
          React.createElement('iframe', {
            key: currentVideo.ytId,
            src: `https://www.youtube.com/embed/${currentVideo.ytId}?rel=0&modestbranding=1`,
            width: '100%',
            height: '100%',
            style: { border: 0, display: 'block' },
            allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen',
            allowFullScreen: true,
            title: currentVideo.title,
            onLoad: () => setPlayerReady(true),
          })
        )}
        {containerWidth > 0 && !playerError && Platform.OS !== 'web' && (
          <YoutubePlayer
            key={currentVideo.ytId}
            ref={playerRef}
            height={playerHeight}
            width={containerWidth}
            videoId={currentVideo.ytId}
            play={playing}
            onReady={() => setPlayerReady(true)}
            onChangeState={onChangeState}
            onError={(e: string) => {
              console.warn('[VideosView] player error:', e);
              setPlayerError(e);
            }}
            initialPlayerParams={{ rel: false, modestbranding: true, preventFullScreen: false }}
            webViewProps={{
              allowsInlineMediaPlayback: true,
              mediaPlaybackRequiresUserAction: false,
            }}
          />
        )}

        {!playerReady && !playerError && (
          <View style={styles.playerOverlay} pointerEvents="none">
            <ActivityIndicator size="large" color="#22c55e" />
          </View>
        )}

        {playerError && (
          <View style={styles.playerOverlay}>
            <Ionicons name="alert-circle-outline" size={36} color="#fca5a5" />
            <Text style={styles.errorText}>
              This video couldn't load in the app{playerError ? ` (${playerError})` : ''}.
            </Text>
            <TouchableOpacity style={styles.ytButton} onPress={openInYouTube} activeOpacity={0.85}>
              <Ionicons name="logo-youtube" size={18} color="#ffffff" />
              <Text style={styles.ytButtonText}>Open in YouTube</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Progress bar */}
      <View style={[styles.progressTrack, { backgroundColor: itemBorder }]}>
        <View style={[styles.progressFill, { width: `${Math.min(100, progressPct)}%` }]} />
      </View>

      {/* Title + actions */}
      <View style={styles.titleRow}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.videoTitle, { color: textColor }]}>{currentVideo.title}</Text>
          <Text style={[styles.videoMeta, { color: subtextColor }]}>
            {chapterName}
            {currentVideo.duration ? ` • ${currentVideo.duration}` : ''}
          </Text>
        </View>
        {watched.includes(currentVideo.ytId) && (
          <View style={styles.watchedBadge}>
            <Ionicons name="checkmark-circle" size={14} color="#ffffff" />
            <Text style={styles.watchedBadgeText}>Watched</Text>
          </View>
        )}
      </View>

      <View style={styles.actionRow}>
        {Platform.OS !== 'web' && (
        <TouchableOpacity
          style={styles.playButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setPlaying((p) => !p);
          }}
          activeOpacity={0.85}
          disabled={!playerReady}
        >
          <Ionicons name={playing ? 'pause' : 'play'} size={18} color="#ffffff" />
          <Text style={styles.playButtonText}>{playing ? 'Pause' : 'Play'}</Text>
        </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.secondaryButton, { borderColor: itemBorder }]}
          onPress={openInYouTube}
          activeOpacity={0.8}
        >
          <Ionicons name="logo-youtube" size={18} color="#ef4444" />
          <Text style={[styles.secondaryButtonText, { color: textColor }]}>YouTube</Text>
        </TouchableOpacity>
      </View>

      {/* Topics */}
      {currentVideo.topics && currentVideo.topics.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>Topics covered</Text>
          {currentVideo.topics.map((t, i) => (
            <View key={i} style={styles.topicRow}>
              <View style={styles.topicDot} />
              <Text style={[styles.topicText, { color: subtextColor }]}>{t}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Playlist */}
      {videos.length > 1 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>
            Chapter videos ({videos.length})
          </Text>
          {videos.map((v, i) => {
            const isActive = i === activeIdx;
            const isWatched = watched.includes(v.ytId);
            return (
              <TouchableOpacity
                key={v.ytId}
                onPress={() => selectVideo(i)}
                activeOpacity={0.8}
                style={[
                  styles.playlistItem,
                  {
                    backgroundColor: itemBg,
                    borderColor: isActive ? '#22c55e' : itemBorder,
                  },
                ]}
              >
                <View style={[styles.playlistNum, isActive && styles.playlistNumActive]}>
                  {isWatched ? (
                    <Ionicons name="checkmark" size={14} color="#ffffff" />
                  ) : (
                    <Text style={styles.playlistNumText}>{i + 1}</Text>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[styles.playlistTitle, { color: isActive ? '#22c55e' : textColor }]}
                    numberOfLines={2}
                  >
                    {v.title}
                  </Text>
                  {v.duration && (
                    <Text style={[styles.playlistMeta, { color: subtextColor }]}>{v.duration}</Text>
                  )}
                </View>
                <Ionicons
                  name={isActive && playing ? 'volume-high' : 'play-circle-outline'}
                  size={22}
                  color={isActive ? '#22c55e' : subtextColor}
                />
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  centered: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  playerWrap: {
    width: '100%',
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    backgroundColor: '#000000',
  },
  playerOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000cc',
    padding: Spacing.three,
    gap: 10,
  },
  errorText: {
    color: '#f1f5f9',
    fontSize: 13,
    textAlign: 'center',
  },
  ytButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ef4444',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
  },
  ytButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#22c55e',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: Spacing.three,
    gap: 8,
  },
  videoTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  videoMeta: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  watchedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#16a34a',
    borderRadius: BorderRadius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  watchedBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: Spacing.three,
  },
  playButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#16a34a',
    paddingVertical: 10,
    borderRadius: BorderRadius.full,
  },
  playButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: BorderRadius.full,
  },
  secondaryButtonText: {
    fontWeight: '700',
    fontSize: 14,
  },
  section: {
    marginTop: Spacing.four,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  topicRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  topicDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22c55e',
    marginTop: 7,
  },
  topicText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
  },
  playlistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
  },
  playlistNum: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#557A65',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playlistNumActive: {
    backgroundColor: '#22c55e',
  },
  playlistNumText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  playlistTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  playlistMeta: {
    fontSize: 11,
    marginTop: 2,
  },
});
