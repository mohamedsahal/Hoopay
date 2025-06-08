# Loading Components

A comprehensive, reusable loading component system built following industrial best practices.

## Features

- ✅ **Multiple Variants**: Dots, Spinner, Pulse, Wave, Skeleton
- ✅ **Theme Support**: Automatic light/dark mode support
- ✅ **Accessibility**: Full accessibility support with screen readers
- ✅ **Performance**: Optimized animations using native driver
- ✅ **TypeScript Ready**: Type definitions included
- ✅ **Flexible API**: Multiple ways to use components
- ✅ **Custom Hook**: Built-in hook for state management

## Quick Start

```javascript
import { Loading } from '../components/Loading';

// Simple loading indicator
<Loading />

// Loading overlay
<Loading type="overlay" visible={isLoading} message="Please wait..." />

// Loading button
<Loading 
  type="button" 
  title="Submit" 
  loading={isSubmitting}
  onPress={handleSubmit}
/>
```

## Components

### 1. Loading (Main Component)

The main component that provides a unified interface:

```javascript
import { Loading } from '../components/Loading';

// Basic usage
<Loading />

// With different types
<Loading type="spinner" variant="pulse" size="large" />
<Loading type="overlay" visible={loading} message="Loading..." />
<Loading type="skeleton" width="100%" height={200} />
```

### 2. LoadingOverlay

Full-screen loading overlay with multiple positions and animations:

```javascript
import { LoadingOverlay } from '../components/Loading';

<LoadingOverlay
  visible={isLoading}
  message="Processing payment..."
  variant="spinner"
  size="large"
  position="center"
  animationType="fade"
  useBlur={true}
  dismissible={false}
/>
```

### 3. LoadingIndicator

Animated dots with multiple variants:

```javascript
import { LoadingIndicator } from '../components/Loading';

<LoadingIndicator 
  variant="dots" 
  size="medium" 
  color="#39B747"
  duration={1200}
  dotCount={3}
/>
```

### 4. LoadingSpinner

Circular spinner with multiple animation styles:

```javascript
import { LoadingSpinner } from '../components/Loading';

<LoadingSpinner 
  variant="spinner" 
  size="large" 
  color="#39B747"
  duration={1000}
/>
```

### 5. LoadingButton

Button with integrated loading states:

```javascript
import { LoadingButton } from '../components/Loading';

<LoadingButton
  title="Submit Form"
  loading={isSubmitting}
  variant="primary"
  size="large"
  loadingVariant="dots"
  loadingText="Submitting..."
  onPress={handleSubmit}
/>
```

### 6. LoadingSkeleton

Content placeholders for loading states:

```javascript
import { LoadingSkeleton } from '../components/Loading';

// Basic skeleton
<LoadingSkeleton width="100%" height={20} />

// Predefined shapes
<LoadingSkeleton.Text lines={3} />
<LoadingSkeleton.Card showImage={true} />
<LoadingSkeleton.List itemCount={5} />
<LoadingSkeleton.Avatar size={50} shape="circle" />
```

## Custom Hook

### useLoading

Manage multiple loading states across your application:

```javascript
import { useLoading } from '../components/Loading';

function MyComponent() {
  const {
    startLoading,
    stopLoading,
    isAnyLoading,
    withLoading,
  } = useLoading();

  const handleSubmit = async () => {
    await withLoading(async () => {
      // Your async operation
      await submitForm();
    }, 'submit', { message: 'Submitting form...' });
  };

  const handleDelete = async () => {
    startLoading('delete', { message: 'Deleting item...' });
    try {
      await deleteItem();
    } finally {
      stopLoading('delete');
    }
  };

  return (
    <View>
      <LoadingButton
        title="Submit"
        loading={getLoadingState('submit').isLoading}
        onPress={handleSubmit}
      />
    </View>
  );
}
```

## Variants

### Loading Indicators
- `dots` - Animated dots (default)
- `pulse` - Pulsing dots
- `wave` - Wave animation

### Loading Spinners
- `spinner` - Rotating spinner (default)
- `pulse` - Pulsing circle
- `wave` - Scaling animation

## Sizes

- `small` - Small size
- `medium` - Medium size (default)
- `large` - Large size
- `extraLarge` - Extra large size

## Positions (Overlay)

- `center` - Center of screen (default)
- `top` - Top of screen
- `bottom` - Bottom of screen
- `fullScreen` - Full screen coverage

## Animation Types

- `fade` - Fade in/out (default)
- `slide` - Slide animation
- `scale` - Scale animation
- `bounce` - Bounce effect

## Theme Integration

All components automatically adapt to your app's theme:

```javascript
import { useTheme } from '../../contexts/ThemeContext';

// Components automatically use theme colors
<Loading color={colors.primary} />
```

## Accessibility

All components include proper accessibility attributes:

- Screen reader support
- Loading state announcements
- Proper role attributes
- Keyboard navigation support

## Performance Tips

1. **Use Native Driver**: All animations use the native driver for better performance
2. **Minimize Re-renders**: Use `React.memo` for components that render loading frequently
3. **Cleanup**: Loading hook automatically cleans up timeouts
4. **Lazy Loading**: Import only the components you need

```javascript
// Import specific components
import { LoadingButton, LoadingOverlay } from '../components/Loading';

// Or use the main component
import { Loading } from '../components/Loading';
```

## Examples

### Form with Loading Button

```javascript
import { LoadingButton, useLoading } from '../components/Loading';

function LoginForm() {
  const { withLoading, getLoadingState } = useLoading();
  
  const handleLogin = async () => {
    await withLoading(async () => {
      await loginUser(credentials);
    }, 'login', { message: 'Signing in...' });
  };

  return (
    <LoadingButton
      title="Sign In"
      loading={getLoadingState('login').isLoading}
      onPress={handleLogin}
      variant="primary"
      size="large"
    />
  );
}
```

### List with Skeleton Loading

```javascript
import { LoadingSkeleton } from '../components/Loading';

function UserList({ loading, users }) {
  if (loading) {
    return <LoadingSkeleton.List itemCount={5} />;
  }

  return (
    <FlatList
      data={users}
      renderItem={({ item }) => <UserItem user={item} />}
    />
  );
}
```

### Global Loading State

```javascript
import { LoadingOverlay, useLoading } from '../components/Loading';

function App() {
  const { globalLoading, loadingStates } = useLoading();
  
  return (
    <View style={{ flex: 1 }}>
      <AppContent />
      
      <LoadingOverlay
        visible={globalLoading}
        message={loadingStates.global?.message}
        variant="spinner"
        useBlur={true}
      />
    </View>
  );
}
```

## Migration from Old Components

Replace existing loading components:

```javascript
// Old
import LoadingIndicator from '../components/LoadingIndicator';
import LoadingOverlay from '../components/LoadingOverlay';

// New
import { Loading } from '../components/Loading';
// or
import { LoadingIndicator, LoadingOverlay } from '../components/Loading';
```

## Best Practices

1. **Consistent Usage**: Use the same loading variant throughout your app
2. **Meaningful Messages**: Provide descriptive loading messages
3. **Timeout Handling**: Set timeouts for long-running operations
4. **Error States**: Handle loading errors gracefully
5. **Progressive Loading**: Use skeletons for content-heavy screens
6. **Accessibility**: Always test with screen readers 