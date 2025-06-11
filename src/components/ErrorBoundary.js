import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Colors from '../constants/Colors';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    // Generate a unique error ID for tracking
    const errorId = Date.now().toString(36) + Math.random().toString(36).substr(2);
    return { 
      hasError: true,
      errorId: errorId
    };
  }

  componentDidCatch(error, errorInfo) {
    // Safer error handling with null checks
    const safeError = error || new Error('Unknown error occurred');
    const safeErrorInfo = errorInfo || { componentStack: 'Component stack not available' };
    
    // Log the error with better error handling
    console.error('🚨 App Crash Caught by ErrorBoundary:', safeError);
    console.error('📍 Error Info:', safeErrorInfo);
    
    // Set state with safe values
    this.setState({
      error: safeError,
      errorInfo: safeErrorInfo
    });

    // Additional logging for debugging
    try {
      if (safeError) {
        console.error('Error name:', safeError.name || 'Unknown');
        console.error('Error message:', safeError.message || 'No message');
        console.error('Error stack:', safeError.stack || 'No stack trace');
      }
      
      if (safeErrorInfo) {
        console.error('Component stack:', safeErrorInfo.componentStack || 'No component stack');
      }
    } catch (loggingError) {
      console.error('Error while logging error details:', loggingError);
    }
  }

  handleRestart = () => {
    try {
      // Reset the error boundary state
      this.setState({ 
        hasError: false, 
        error: null, 
        errorInfo: null,
        errorId: null
      });
    } catch (error) {
      console.error('Error during restart:', error);
      // Force a complete refresh if normal restart fails
      if (typeof window !== 'undefined' && window.location) {
        window.location.reload();
      }
    }
  }

  render() {
    if (this.state.hasError) {
      // Safe access to error properties
      const errorMessage = this.state.error?.message || this.state.error?.toString() || 'Unknown error occurred';
      const errorStack = this.state.error?.stack || 'No stack trace available';
      const componentStack = this.state.errorInfo?.componentStack || 'Component stack not available';
      
      // Fallback UI with restart functionality
      return (
        <View style={styles.container}>
          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
            <Text style={styles.title}>Oops! Something went wrong</Text>
            <Text style={styles.subtitle}>
              The app encountered an unexpected error. You can try restarting or contact support if the problem persists.
            </Text>
            
            {this.state.errorId && (
              <Text style={styles.errorId}>
                Error ID: {this.state.errorId}
              </Text>
            )}
            
            <TouchableOpacity style={styles.restartButton} onPress={this.handleRestart}>
              <Text style={styles.restartButtonText}>Try Again</Text>
            </TouchableOpacity>
            
            {__DEV__ && (
              <View style={styles.debugContainer}>
                <Text style={styles.debugTitle}>Debug Information:</Text>
                <Text style={styles.debugText}>
                  Error: {errorMessage}
                </Text>
                <Text style={styles.debugText}>
                  Component Stack: {componentStack}
                </Text>
                <Text style={styles.debugText}>
                  Stack Trace: {errorStack}
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 20,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    justifyContent: 'center',
    minHeight: '100%',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  errorId: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: 'monospace',
  },
  restartButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    alignSelf: 'center',
    marginBottom: 24,
  },
  restartButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  debugContainer: {
    backgroundColor: Colors.surfaceLight,
    padding: 16,
    borderRadius: 8,
    marginTop: 20,
  },
  debugTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.error,
    marginBottom: 8,
  },
  debugText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontFamily: 'monospace',
    marginBottom: 8,
    flexWrap: 'wrap',
  },
});

export default ErrorBoundary; 