import { View, type ViewProps } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { Shadows } from '@/constants/Shadows';

export type ThemedViewVariant = 'default' | 'surface' | 'elevated' | 'sunken';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  variant?: ThemedViewVariant;
  shadow?: keyof typeof Shadows;
};

export function ThemedView({
  style,
  lightColor,
  darkColor,
  variant = 'default',
  shadow,
  ...otherProps
}: ThemedViewProps) {
  const scheme = useColorScheme() ?? 'dark';
  const palette = Colors[scheme];

  const backgroundColors: Record<ThemedViewVariant, string> = {
    default: palette.background,
    surface: palette.surface,
    elevated: palette.surfaceElevated,
    sunken: palette.surfaceSunken,
  };

  const backgroundColor = lightColor && scheme === 'light'
    ? lightColor
    : darkColor && scheme === 'dark'
    ? darkColor
    : backgroundColors[variant];

  const shadowStyle = shadow ? Shadows[shadow] : undefined;

  return (
    <View
      style={[{ backgroundColor }, shadowStyle, style]}
      {...otherProps}
    />
  );
}
