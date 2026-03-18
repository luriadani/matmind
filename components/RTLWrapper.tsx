import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useAppContext } from './Localization';

interface RTLWrapperProps {
  children: React.ReactNode;
  style?: any;
}

export const RTLWrapper: React.FC<RTLWrapperProps> = ({ children, style }) => {
  const { getTextDirection, getLayoutDirection } = useAppContext();
  
  const textDirection = getTextDirection();
  const layoutDirection = getLayoutDirection();
  
  return (
    <View 
      style={[
        styles.container,
        { 
          writingDirection: textDirection,
          flexDirection: layoutDirection as any
        },
        style
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
}); 