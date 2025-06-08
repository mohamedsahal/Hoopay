/**
 * Loading Component Types and Enums
 * Provides type definitions and constants for the loading system
 */

// Loading sizes
export const LOADING_SIZES = {
  SMALL: 'small',
  MEDIUM: 'medium',
  LARGE: 'large',
  EXTRA_LARGE: 'extraLarge',
};

// Loading variants
export const LOADING_VARIANTS = {
  DOTS: 'dots',
  SPINNER: 'spinner',
  PULSE: 'pulse',
  WAVE: 'wave',
  SKELETON: 'skeleton',
  LOTTIE: 'lottie',
  BOUNCE: 'bounce',
  GROW: 'grow',
  ROTATE: 'rotate',
};

// Loading positions for overlays
export const LOADING_POSITIONS = {
  CENTER: 'center',
  TOP: 'top',
  BOTTOM: 'bottom',
  FULL_SCREEN: 'fullScreen',
};

// Animation types
export const ANIMATION_TYPES = {
  FADE: 'fade',
  SLIDE: 'slide',
  SCALE: 'scale',
  BOUNCE: 'bounce',
};

// Default configurations
export const DEFAULT_CONFIG = {
  size: LOADING_SIZES.MEDIUM,
  variant: LOADING_VARIANTS.DOTS,
  position: LOADING_POSITIONS.CENTER,
  animation: ANIMATION_TYPES.FADE,
  duration: 1200,
  message: 'Loading...',
  showMessage: true,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  useBlur: false,
  dismissible: false,
}; 