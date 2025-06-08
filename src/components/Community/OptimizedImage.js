import React, { useState, memo } from 'react';
import { View, Image, ActivityIndicator, Text } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const OptimizedImage = memo(({ 
  source,
  style,
  resizeMode = 'cover',
  showLoadingIndicator = true,
  showErrorState = true,
  onLoad,
  onError,
  fallbackIcon = 'image',
  priority = 'normal',
  ...props
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const handleLoad = (event) => {
    setLoading(false);
    setError(false);
    onLoad?.(event);
  };

  const handleError = (event) => {
    setLoading(false);
    setError(true);
    console.warn('Image failed to load:', source.uri);
    onError?.(event);
  };

  const handleLoadStart = () => {
    setLoading(true);
    setError(false);
  };

  if (error && showErrorState) {
    return (
      <View style={[
        style,
        {
          backgroundColor: '#f0f0f0',
          justifyContent: 'center',
          alignItems: 'center',
          borderRadius: style?.borderRadius || 0
        }
      ]}>
        <MaterialIcons name={fallbackIcon} size={Math.min(style?.width || 32, style?.height || 32, 48)} color="#ccc" />
        {(style?.width > 80 || style?.height > 80) && (
          <Text style={{ fontSize: 10, color: '#999', marginTop: 2, textAlign: 'center' }}>
            Image unavailable
          </Text>
        )}
      </View>
    );
  }

  return (
    <View style={style}>
      <Image
        source={source}
        style={[style, { opacity: loading ? 0.3 : 1 }]}
        resizeMode={resizeMode}
        onLoadStart={handleLoadStart}
        onLoad={handleLoad}
        onError={handleError}
        {...props}
      />
      
      {loading && showLoadingIndicator && (style?.width > 60 || style?.height > 60) && (
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'rgba(240, 240, 240, 0.8)'
        }}>
          <ActivityIndicator size="small" color="#666" />
        </View>
      )}
    </View>
  );
});

OptimizedImage.displayName = 'OptimizedImage';

export default OptimizedImage; 