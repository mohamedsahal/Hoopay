import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

/**
 * LoadingSkeleton Component
 * Provides skeleton loading placeholders for content
 */
const LoadingSkeleton = ({
  width = '100%',
  height = 20,
  borderRadius = 4,
  animated = true,
  style,
  children,
  testID = 'loading-skeleton',
}) => {
  const { colors, isDarkMode } = useTheme();
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (animated) {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(animatedValue, {
            toValue: 1,
            duration: 1000,
            easing: Easing.bezier(0.4, 0, 0.6, 1),
            useNativeDriver: false,
          }),
          Animated.timing(animatedValue, {
            toValue: 0,
            duration: 1000,
            easing: Easing.bezier(0.4, 0, 0.6, 1),
            useNativeDriver: false,
          }),
        ])
      );

      animation.start();

      return () => animation.stop();
    }
  }, [animated, animatedValue]);

  const backgroundColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [
      isDarkMode ? colors.surface : '#F0F0F0',
      isDarkMode ? colors.border : '#E0E0E0',
    ],
  });

  const skeletonStyle = {
    width,
    height,
    borderRadius,
    backgroundColor: animated ? backgroundColor : (isDarkMode ? colors.surface : '#F0F0F0'),
  };

  if (children) {
    return (
      <View style={[style]} testID={testID}>
        {children}
      </View>
    );
  }

  return (
    <Animated.View
      style={[styles.skeleton, skeletonStyle, style]}
      testID={testID}
      accessible={true}
      accessibilityLabel="Loading content"
      accessibilityRole="progressbar"
    />
  );
};

/**
 * Predefined skeleton shapes for common use cases
 */
const SkeletonText = ({ lines = 3, lineHeight = 16, spacing = 8, animated = true, style }) => {
  return (
    <View style={[styles.textContainer, style]}>
      {Array.from({ length: lines }, (_, index) => (
        <LoadingSkeleton
          key={index}
          width={index === lines - 1 ? '60%' : '100%'}
          height={lineHeight}
          animated={animated}
          style={index > 0 ? { marginTop: spacing } : undefined}
        />
      ))}
    </View>
  );
};

const SkeletonCard = ({ 
  width = '100%', 
  height = 200, 
  animated = true, 
  showImage = true,
  imageHeight = 120,
  showTitle = true,
  showSubtitle = true,
  style 
}) => {
  return (
    <LoadingSkeleton
      width={width}
      height={height}
      borderRadius={12}
      animated={animated}
      style={[styles.card, style]}
    >
      <View style={styles.cardContent}>
        {showImage && (
          <LoadingSkeleton
            width="100%"
            height={imageHeight}
            borderRadius={8}
            animated={animated}
            style={styles.cardImage}
          />
        )}
        
        <View style={styles.cardBody}>
          {showTitle && (
            <LoadingSkeleton
              width="80%"
              height={18}
              animated={animated}
              style={styles.cardTitle}
            />
          )}
          
          {showSubtitle && (
            <SkeletonText
              lines={2}
              lineHeight={14}
              spacing={6}
              animated={animated}
              style={styles.cardText}
            />
          )}
        </View>
      </View>
    </LoadingSkeleton>
  );
};

const SkeletonList = ({ 
  itemCount = 5, 
  itemHeight = 60, 
  spacing = 12, 
  animated = true,
  style 
}) => {
  return (
    <View style={[styles.list, style]}>
      {Array.from({ length: itemCount }, (_, index) => (
        <View key={index} style={styles.listItem}>
          <LoadingSkeleton
            width={50}
            height={50}
            borderRadius={25}
            animated={animated}
            style={styles.listItemImage}
          />
          
          <View style={styles.listItemContent}>
            <LoadingSkeleton
              width="70%"
              height={16}
              animated={animated}
              style={styles.listItemTitle}
            />
            
            <LoadingSkeleton
              width="90%"
              height={12}
              animated={animated}
              style={styles.listItemSubtitle}
            />
          </View>
        </View>
      ))}
    </View>
  );
};

const SkeletonAvatar = ({ 
  size = 50, 
  shape = 'circle', 
  animated = true, 
  style 
}) => {
  return (
    <LoadingSkeleton
      width={size}
      height={size}
      borderRadius={shape === 'circle' ? size / 2 : 8}
      animated={animated}
      style={style}
    />
  );
};

const styles = StyleSheet.create({
  skeleton: {
    overflow: 'hidden',
  },
  textContainer: {
    // Container for text skeletons
  },
  card: {
    padding: 16,
    overflow: 'hidden',
  },
  cardContent: {
    flex: 1,
  },
  cardImage: {
    marginBottom: 12,
  },
  cardBody: {
    flex: 1,
  },
  cardTitle: {
    marginBottom: 8,
  },
  cardText: {
    marginTop: 8,
  },
  list: {
    // Container for list skeletons
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 8,
  },
  listItemImage: {
    marginRight: 12,
  },
  listItemContent: {
    flex: 1,
  },
  listItemTitle: {
    marginBottom: 6,
  },
  listItemSubtitle: {
    // Subtitle styles handled in component
  },
});

// Export all skeleton components
LoadingSkeleton.Text = SkeletonText;
LoadingSkeleton.Card = SkeletonCard;
LoadingSkeleton.List = SkeletonList;
LoadingSkeleton.Avatar = SkeletonAvatar;

export default LoadingSkeleton; 