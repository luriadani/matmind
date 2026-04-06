import { StyleSheet, Text, type TextProps } from 'react-native';
import { useThemeColor } from '../hooks/useThemeColor';
import { Typography } from '../constants/Typography';
import { Brand } from '../constants/Colors';

export type ThemedTextType =
  | 'default'
  | 'defaultSemiBold'
  | 'title'
  | 'titleLarge'
  | 'display'
  | 'subtitle'
  | 'videoTitle'
  | 'sectionHeader'
  | 'body'
  | 'bodyLarge'
  | 'caption'
  | 'micro'
  | 'badge'
  | 'label'
  | 'link';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: ThemedTextType;
  secondary?: boolean;
  tertiary?: boolean;
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  secondary = false,
  tertiary = false,
  ...rest
}: ThemedTextProps) {
  const colorKey = tertiary ? 'textTertiary' : secondary ? 'textSecondary' : 'text';
  const color = useThemeColor({ light: lightColor, dark: darkColor }, colorKey as any);

  return (
    <Text
      style={[
        { color },
        styles[type] ?? styles.default,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    ...Typography.body,
  },
  defaultSemiBold: {
    ...Typography.bodySemibold,
  },
  body: {
    ...Typography.body,
  },
  bodyLarge: {
    ...Typography.bodyLarge,
  },
  title: {
    ...Typography.title,
  },
  titleLarge: {
    ...Typography.titleLarge,
  },
  display: {
    ...Typography.display,
  },
  subtitle: {
    ...Typography.title,
  },
  videoTitle: {
    ...Typography.videoTitle,
  },
  sectionHeader: {
    ...Typography.sectionHeader,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  caption: {
    ...Typography.caption,
  },
  micro: {
    ...Typography.micro,
    textTransform: 'uppercase',
  },
  badge: {
    ...Typography.badge,
  },
  label: {
    ...Typography.smallMedium,
  },
  link: {
    ...Typography.body,
    color: Brand.primary,
    textDecorationLine: 'underline',
  },
});
