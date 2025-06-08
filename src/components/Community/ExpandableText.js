import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import Colors from '../../constants/Colors';

const ExpandableText = ({ 
  text, 
  postId, 
  isTitle = false, 
  expandedPosts, 
  onToggleExpansion,
  maxLength = null 
}) => {
  // Use fallback colors and theme if context is not available
  let colors;
  try {
    const theme = useTheme();
    colors = theme.colors;
  } catch (error) {
    colors = Colors;
  }

  const isExpanded = expandedPosts.has(postId);
  const defaultMaxLength = isTitle ? 80 : 150;
  const actualMaxLength = maxLength || defaultMaxLength;
  const shouldTruncate = text.length > actualMaxLength;
  
  const textStyle = isTitle 
    ? [styles.postTitle, { color: colors.text }]
    : [styles.postContent, { color: colors.textSecondary }];
  
  if (!shouldTruncate) {
    return <Text style={textStyle}>{text}</Text>;
  }

  return (
    <View>
      <Text style={textStyle}>
        {isExpanded ? text : `${text.substring(0, actualMaxLength)}...`}
      </Text>
      <TouchableOpacity 
        onPress={() => onToggleExpansion(postId)}
        style={styles.seeMoreButton}
      >
        <Text style={[styles.seeMoreText, { color: colors.primary }]}>
          {isExpanded ? 'See less' : 'See more'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = {
  postTitle: {
    fontSize: 16,
    fontWeight: '600',
    paddingHorizontal: 16,
    marginBottom: 8,
    lineHeight: 22,
    textAlign: 'left',
  },
  postContent: {
    fontSize: 15,
    lineHeight: 22,
    paddingHorizontal: 16,
    marginBottom: 12,
    textAlign: 'left',
  },
  seeMoreButton: {
    paddingHorizontal: 16,
    marginTop: 4,
    marginBottom: 8,
  },
  seeMoreText: {
    fontSize: 13,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
};

export default ExpandableText; 