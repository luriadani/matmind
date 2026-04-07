/**
 * VideoCard — Instagram-style technique card
 *
 * Layout:
 *   ┌──────────────────────────────┐
 *   │   THUMBNAIL (full, 16:9)     │
 *   │ [platform]          [▶ play] │
 *   └──────────────────────────────┘
 *   [Category] [Category]   [shared]
 *   Title of the technique here
 *   📅 Monday · 19:15               ···
 */

import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Image,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';

const OG_IMAGE_API =
  Platform.OS === 'web'
    ? '/api/og-image'
    : 'https://matmind.vercel.app/api/og-image';
import { router } from 'expo-router';
import { Brand, Colors, Media } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { BorderRadius, Spacing } from '../../constants/Spacing';
import { Shadows } from '../../constants/Shadows';
import { useColorScheme } from '../../hooks/useColorScheme';
import { extractThumbnailFromUrl, getFallbackThumbnail } from '../../utils/thumbnailExtractor';
import { CategoryBadge } from './CategoryBadge';
import PlatformIcon from '../PlatformIcon';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_WIDTH = SCREEN_WIDTH - Spacing.screenPaddingH * 2;
const THUMBNAIL_HEIGHT = CARD_WIDTH * Spacing.thumbnailAspectRatio;

type Technique = {
  id: string;
  title: string;
  video_url: string;
  thumbnail_url?: string | null;
  source_platform?: string;
  category?: string;
  training_id?: string | null;
  shared_by_gym_id?: string | null;
  notes?: string | null;
  tags?: string | null;
};

type Training = {
  id: string;
  dayOfWeek: string;
  time: string;
};

type VideoCardProps = {
  technique: Technique;
  trainings?: Training[];
  onDelete?: (id: string) => void;
  onUpdate?: (technique: Technique) => void;
  deleteLabel?: string;
  deleteConfirmTitle?: string;
  deleteConfirmMessage?: string;
  style?: ViewStyle;
};

export function VideoCard({
  technique,
  trainings,
  onDelete,
  onUpdate,
  deleteLabel = 'Delete',
  deleteConfirmTitle = 'Delete technique?',
  deleteConfirmMessage = 'This action cannot be undone.',
  style,
}: VideoCardProps) {
  const scheme = useColorScheme() ?? 'dark';
  const palette = Colors[scheme];
  const [thumbError, setThumbError] = useState(false);
  const [ogImageUrl, setOgImageUrl] = useState<string | null>(null);

  // Press-to-scale animation
  const scale = useRef(new Animated.Value(1)).current;

  // For platforms without stable CDN thumbnails (Instagram, Facebook, TikTok),
  // fetch the og:image server-side via /api/og-image (same as WhatsApp previews).
  useEffect(() => {
    const platform = technique.source_platform?.toLowerCase() ?? '';
    const needsOg = ['instagram', 'facebook', 'tiktok'].includes(platform);
    if (!needsOg || !technique.video_url) return;

    let cancelled = false;
    const fetchOg = async () => {
      try {
        const res = await fetch(
          `${OG_IMAGE_API}?url=${encodeURIComponent(technique.video_url)}`
        );
        if (!res.ok || cancelled) return;
        const { imageUrl } = await res.json();
        if (imageUrl && !cancelled) setOgImageUrl(imageUrl);
      } catch {
        // Silent fail — placeholder will show
      }
    };
    fetchOg();
    return () => { cancelled = true; };
  }, [technique.video_url, technique.source_platform]);

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 50,
      bounciness: 0,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 6,
    }).start();
  };

  const handleVideoPress = () => {
    if (technique.video_url) {
      Linking.openURL(technique.video_url).catch(() =>
        Alert.alert('Error', 'Could not open video link')
      );
    }
  };

  const handleEdit = () => {
    router.push(`/technique-form?techniqueId=${technique.id}`);
  };

  const handleDelete = () => {
    Alert.alert(deleteConfirmTitle, deleteConfirmMessage, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: deleteLabel,
        style: 'destructive',
        onPress: () => onDelete?.(technique.id),
      },
    ]);
  };

  const categories = technique.category
    ? technique.category.split(',').map((c) => c.trim()).filter(Boolean)
    : [];

  const assignedTraining = trainings?.find((t) => t.id === technique.training_id);
  const trainingLabel = assignedTraining
    ? `${assignedTraining.dayOfWeek} · ${assignedTraining.time}`
    : null;

  const platform = technique.source_platform?.toLowerCase() ?? '';

  // YouTube/Vimeo: extract directly from URL (always public)
  // Instagram/Facebook/TikTok: use og:image fetched server-side (ogImageUrl state)
  const resolvedThumbnail = (() => {
    if (platform === 'youtube' || platform === 'vimeo') {
      return extractThumbnailFromUrl(technique.video_url) || null;
    }
    return ogImageUrl; // set async via /api/og-image
  })();

  const thumbnailSource =
    resolvedThumbnail && resolvedThumbnail.startsWith('http') && !thumbError
      ? { uri: resolvedThumbnail }
      : null;

  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handleVideoPress}
        style={[
          styles.card,
          {
            backgroundColor: palette.surface,
            borderColor: palette.border,
          },
          Shadows.card,
        ]}
      >
        {/* ── Thumbnail ──────────────────────────────────── */}
        <View style={styles.thumbnailWrapper}>
          {thumbnailSource ? (
            <Image
              source={thumbnailSource}
              style={styles.thumbnail}
              resizeMode="cover"
              onError={() => setThumbError(true)}
            />
          ) : (
            <View style={[styles.thumbnail, styles.thumbnailPlaceholder, { backgroundColor: Media.thumbnailPlaceholderBg }]}>
              <View style={styles.placeholderIconRing}>
                <Ionicons name="play" size={28} color="#FFFFFF" style={{ paddingLeft: 3 }} />
              </View>
              <PlatformIcon
                platform={technique.source_platform ?? 'custom'}
                size={18}
                color="rgba(255,255,255,0.3)"
              />
            </View>
          )}

          {/* Dark gradient overlay at bottom of thumb */}
          <View style={styles.thumbnailOverlay} />

          {/* Platform badge — top left */}
          <View style={styles.platformBadge}>
            <PlatformIcon
              platform={technique.source_platform ?? 'custom'}
              size={16}
              color="#FFFFFF"
            />
          </View>

          {/* Play button — center */}
          <View style={styles.playButton}>
            <Ionicons name="play" size={22} color="#FFFFFF" />
          </View>
        </View>

        {/* ── Body ───────────────────────────────────────── */}
        <View style={styles.body}>
          {/* Category badges */}
          {categories.length > 0 && (
            <View style={styles.badgeRow}>
              {categories.slice(0, 3).map((cat) => (
                <CategoryBadge key={cat} category={cat} compact />
              ))}
              {categories.length > 3 && (
                <Text style={[styles.moreBadges, { color: palette.textTertiary }]}>
                  +{categories.length - 3}
                </Text>
              )}
              {technique.shared_by_gym_id && (
                <View style={[styles.sharedBadge, { backgroundColor: Brand.successMuted }]}>
                  <Ionicons name="people" size={11} color={Brand.success} />
                  <Text style={[styles.sharedText, { color: Brand.success }]}>Gym</Text>
                </View>
              )}
            </View>
          )}

          {/* Title */}
          <Text
            style={[styles.title, { color: palette.text }]}
            numberOfLines={2}
          >
            {technique.title}
          </Text>

          {/* Footer row */}
          <View style={styles.footer}>
            {trainingLabel ? (
              <View style={styles.trainingRow}>
                <Ionicons name="calendar-outline" size={13} color={palette.textSecondary} />
                <Text style={[styles.trainingText, { color: palette.textSecondary }]}>
                  {trainingLabel}
                </Text>
              </View>
            ) : (
              <View />
            )}

            <View style={styles.actions}>
              {onUpdate && (
                <Pressable
                  onPress={handleEdit}
                  style={[styles.actionBtn, { backgroundColor: palette.surfaceSunken }]}
                  hitSlop={8}
                >
                  <Ionicons name="create-outline" size={15} color={Brand.primary} />
                </Pressable>
              )}
              {onDelete && (
                <Pressable
                  onPress={handleDelete}
                  style={[styles.actionBtn, { backgroundColor: palette.surfaceSunken }]}
                  hitSlop={8}
                >
                  <Ionicons name="trash-outline" size={15} color={Brand.accent} />
                </Pressable>
              )}
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    overflow: 'hidden',
  },

  // Thumbnail
  thumbnailWrapper: {
    width: '100%',
    height: THUMBNAIL_HEIGHT,
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  thumbnailPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  placeholderIconRing: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Brand.primaryMuted,
    borderWidth: 1.5,
    borderColor: Brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbnailOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Media.thumbnailOverlayColor,
  },
  platformBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: BorderRadius.full,
    padding: 5,
  },
  playButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -22,
    marginLeft: -22,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 2, // optical center for play icon
  },

  // Body
  body: {
    padding: Spacing.cardPaddingH,
    gap: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    alignItems: 'center',
  },
  sharedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  sharedText: {
    ...Typography.captionMedium,
  },
  moreBadges: {
    ...Typography.caption,
    alignSelf: 'center',
  },
  title: {
    ...Typography.videoTitle,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  trainingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flex: 1,
  },
  trainingText: {
    ...Typography.caption,
  },
  actions: {
    flexDirection: 'row',
    gap: 6,
  },
  actionBtn: {
    width: 30,
    height: 30,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
