import { Ionicons } from '@expo/vector-icons';
import React, { useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
  type ViewStyle,
} from 'react-native';
import { Brand, Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { BorderRadius } from '../../constants/Spacing';
import { useColorScheme } from '../../hooks/useColorScheme';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';
export type ButtonSize = 'sm' | 'md' | 'lg';

type ButtonProps = Omit<PressableProps, 'style'> & {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  style?: ViewStyle;
};

export function Button({
  label,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  disabled,
  style,
  onPress,
  ...rest
}: ButtonProps) {
  const scheme = useColorScheme() ?? 'dark';
  const opacity = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.timing(opacity, { toValue: 0.75, duration: 80, useNativeDriver: true }).start();
  };
  const handlePressOut = () => {
    Animated.timing(opacity, { toValue: 1, duration: 120, useNativeDriver: true }).start();
  };

  const isDisabled = disabled || loading;

  const variantStyles = getVariantStyles(variant, scheme);
  const sizeStyle = SIZE_STYLES[size];

  return (
    <Animated.View style={[{ opacity }, fullWidth && styles.fullWidth, style]}>
      <Pressable
        style={[
          styles.base,
          variantStyles.container,
          sizeStyle.container,
          fullWidth && styles.fullWidth,
          isDisabled && styles.disabled,
        ]}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        disabled={isDisabled}
        {...rest}
      >
        {loading ? (
          <ActivityIndicator size="small" color={variantStyles.textColor} />
        ) : (
          <>
            {icon && iconPosition === 'left' && (
              <Ionicons
                name={icon}
                size={sizeStyle.iconSize}
                color={variantStyles.textColor}
                style={styles.iconLeft}
              />
            )}
            <Text style={[styles.label, sizeStyle.label, { color: variantStyles.textColor }]}>
              {label}
            </Text>
            {icon && iconPosition === 'right' && (
              <Ionicons
                name={icon}
                size={sizeStyle.iconSize}
                color={variantStyles.textColor}
                style={styles.iconRight}
              />
            )}
          </>
        )}
      </Pressable>
    </Animated.View>
  );
}

function getVariantStyles(variant: ButtonVariant, scheme: 'light' | 'dark') {
  const palette = Colors[scheme];

  switch (variant) {
    case 'primary':
      return {
        container: {
          backgroundColor: Brand.primary,
          borderWidth: 0,
        },
        textColor: '#FFFFFF',
      };
    case 'secondary':
      return {
        container: {
          backgroundColor: Brand.primaryMuted,
          borderWidth: 1,
          borderColor: Brand.primary,
        },
        textColor: Brand.primary,
      };
    case 'ghost':
      return {
        container: {
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: palette.border,
        },
        textColor: palette.text,
      };
    case 'destructive':
      return {
        container: {
          backgroundColor: 'rgba(255,107,107,0.15)',
          borderWidth: 1,
          borderColor: 'rgba(255,107,107,0.4)',
        },
        textColor: Brand.accent,
      };
  }
}

const SIZE_STYLES = {
  sm: {
    container: {
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: BorderRadius.button,
    },
    label: Typography.smallMedium,
    iconSize: 14,
  },
  md: {
    container: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: BorderRadius.button,
    },
    label: Typography.bodySemibold,
    iconSize: 16,
  },
  lg: {
    container: {
      paddingHorizontal: 24,
      paddingVertical: 14,
      borderRadius: BorderRadius.button,
    },
    label: { ...Typography.bodyLarge, fontWeight: '600' as const },
    iconSize: 18,
  },
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.45,
  },
  iconLeft: {
    marginRight: 6,
  },
  iconRight: {
    marginLeft: 6,
  },
  label: {
    ...Typography.bodySemibold,
  },
});
