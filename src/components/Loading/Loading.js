import React from 'react';
import { View } from 'react-native';
import LoadingOverlay from './LoadingOverlay';
import LoadingIndicator from './LoadingIndicator';
import LoadingSpinner from './LoadingSpinner';
import LoadingSkeleton from './LoadingSkeleton';
import LoadingButton from './LoadingButton';
import { 
  LOADING_SIZES, 
  LOADING_VARIANTS, 
  LOADING_POSITIONS,
  ANIMATION_TYPES,
} from './types';

/**
 * Main Loading Component
 * Unified interface for all loading variants
 */
const Loading = ({
  type = 'indicator', // 'indicator', 'spinner', 'overlay', 'skeleton', 'button'
  visible = true,
  variant = LOADING_VARIANTS.DOTS,
  size = LOADING_SIZES.MEDIUM,
  position = LOADING_POSITIONS.CENTER,
  animationType = ANIMATION_TYPES.FADE,
  ...props
}) => {
  // Render overlay loading
  if (type === 'overlay') {
    return (
      <LoadingOverlay
        visible={visible}
        variant={variant}
        size={size}
        position={position}
        animationType={animationType}
        {...props}
      />
    );
  }

  // Render skeleton loading
  if (type === 'skeleton') {
    return <LoadingSkeleton {...props} />;
  }

  // Render button loading
  if (type === 'button') {
    return (
      <LoadingButton
        loadingVariant={variant}
        loadingSize={size}
        {...props}
      />
    );
  }

  // Render spinner loading
  if (type === 'spinner') {
    return (
      <LoadingSpinner
        variant={variant}
        size={size}
        {...props}
      />
    );
  }

  // Default: Render indicator loading
  return (
    <LoadingIndicator
      variant={variant}
      size={size}
      {...props}
    />
  );
};

// Add static methods for easy access to specific components
Loading.Overlay = LoadingOverlay;
Loading.Indicator = LoadingIndicator;
Loading.Spinner = LoadingSpinner;
Loading.Skeleton = LoadingSkeleton;
Loading.Button = LoadingButton;

// Add constants for easy access
Loading.SIZES = LOADING_SIZES;
Loading.VARIANTS = LOADING_VARIANTS;
Loading.POSITIONS = LOADING_POSITIONS;
Loading.ANIMATIONS = ANIMATION_TYPES;

export default Loading;