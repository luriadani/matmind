import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useRef } from 'react';
import { Alert, Animated, Dimensions, Image, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Brand, Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { BorderRadius, Spacing } from '../../constants/Spacing';
import { Shadows } from '../../constants/Shadows';
import { useColorScheme } from '../../hooks/useColorScheme';
import { CategoryBadge } from '../ui/CategoryBadge';
import PlatformIcon from '../PlatformIcon';
import { extractThumbnailFromUrl } from '../../utils/thumbnailExtractor';
import { parseArray } from '../../utils/formatters';
import { useAppContext } from '../Localization';

const SCREEN_WIDTH = Dimensions.get('window').width;
const GRID_GAP = 12;
const CARD_WIDTH = (SCREEN_WIDTH - Spacing.screenPaddingH * 2 - GRID_GAP) / 2;
const THUMBNAIL_HEIGHT = CARD_WIDTH * 0.62; // slightly taller ratio for grid

const TechniqueGridItem = ({ technique, trainings, onDelete, onUpdate }) => {
  const { t } = useAppContext();
  const scheme = useColorScheme() ?? 'dark';
  const palette = Colors[scheme];

  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 50, bounciness: 0 }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 6 }).start();
  };

  const thumbnailUrl = extractThumbnailFromUrl(technique.video_url);
  const categories = parseArray(technique.category);

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
    Alert.alert(
      t('technique.delete_title'),
      t('technique.delete_message'),
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => onDelete(technique.id) },
      ]
    );
  };

  return (
    <Animated.View style={[{ transform: [{ scale }] }, { width: CARD_WIDTH }]}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handleVideoPress}
        style={[
          styles.card,
          { backgroundColor: palette.surface, borderColor: palette.border },
          Shadows.card,
        ]}
      >
        {/* Thumbnail */}
        <View style={styles.thumbWrapper}>
          {thumbnailUrl ? (
            <Image source={{ uri: thumbnailUrl }} style={styles.thumbnail} resizeMode="cover" />
          ) : (
            <View style={[styles.thumbnail, styles.thumbPlaceholder, { backgroundColor: palette.surfaceSunken }]}>
              <Ionicons name="play-circle" size={28} color={palette.textTertiary} />
            </View>
          )}
          <View style={styles.thumbOverlay} />
          <View style={styles.platformBadge}>
            <PlatformIcon platform={technique.source_platform ?? 'custom'} size={12} color="#FFF" />
          </View>
        </View>

        {/* Body */}
        <View style={styles.body}>
          <Text style={[styles.title, { color: palette.text }]} numberOfLines={2}>
            {technique.title}
          </Text>

          {categories.length > 0 && (
            <View style={styles.badges}>
              <CategoryBadge category={categories[0]} compact />
              {categories.length > 1 && (
                <Text style={[styles.more, { color: palette.textTertiary }]}>
                  +{categories.length - 1}
                </Text>
              )}
            </View>
          )}

          <View style={styles.actions}>
            <Pressable
              onPress={handleEdit}
              style={[styles.actionBtn, { backgroundColor: palette.surfaceSunken }]}
              hitSlop={6}
            >
              <Ionicons name="create-outline" size={13} color={Brand.primary} />
            </Pressable>
            <Pressable
              onPress={handleDelete}
              style={[styles.actionBtn, { backgroundColor: palette.surfaceSunken }]}
              hitSlop={6}
            >
              <Ionicons name="trash-outline" size={13} color={Brand.accent} />
            </Pressable>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    overflow: 'hidden',
  },
  thumbWrapper: {
    width: '100%',
    height: THUMBNAIL_HEIGHT,
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  thumbPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  platformBadge: {
    position: 'absolute',
    top: 7,
    left: 7,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: BorderRadius.full,
    padding: 4,
  },
  body: {
    padding: 10,
    gap: 6,
  },
  title: {
    ...Typography.smallMedium,
    lineHeight: 18,
  },
  badges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  more: {
    ...Typography.micro,
  },
  actions: {
    flexDirection: 'row',
    gap: 5,
    justifyContent: 'flex-end',
    marginTop: 2,
  },
  actionBtn: {
    width: 26,
    height: 26,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default TechniqueGridItem;
