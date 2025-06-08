import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  SafeAreaView,
} from 'react-native';
import {
  Loading,
  LoadingButton,
  LoadingOverlay,
  LoadingIndicator,
  LoadingSpinner,
  LoadingSkeleton,
  useLoading,
} from '../index';
import { useTheme } from '../../../contexts/ThemeContext';

/**
 * LoadingExamples Component
 * Demonstrates various loading component usage patterns
 */
const LoadingExamples = () => {
  const { colors } = useTheme();
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  
  const {
    startLoading,
    stopLoading,
    getLoadingState,
    withLoading,
    isAnyLoading,
  } = useLoading();

  // Simulate async operations
  const simulateApiCall = (duration = 2000) => {
    return new Promise(resolve => setTimeout(resolve, duration));
  };

  const handleOverlayDemo = async () => {
    setOverlayVisible(true);
    await simulateApiCall(3000);
    setOverlayVisible(false);
  };

  const handleFormSubmit = async () => {
    setFormSubmitting(true);
    try {
      await simulateApiCall(2000);
      Alert.alert('Success', 'Form submitted successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to submit form');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleWithLoading = async () => {
    try {
      await withLoading(
        () => simulateApiCall(2000),
        'demo',
        { message: 'Processing with hook...' }
      );
      Alert.alert('Success', 'Operation completed!');
    } catch (error) {
      Alert.alert('Error', 'Operation failed');
    }
  };

  const handleDataLoad = async () => {
    setDataLoading(true);
    await simulateApiCall(2000);
    setDataLoading(false);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: colors.text }]}>
          Loading Components Examples
        </Text>

        {/* Basic Loading Indicators */}
        <Section title="Loading Indicators" colors={colors}>
          <Row title="Dots (Default)">
            <LoadingIndicator variant="dots" />
          </Row>
          
          <Row title="Pulse">
            <LoadingIndicator variant="pulse" />
          </Row>
          
          <Row title="Wave">
            <LoadingIndicator variant="wave" />
          </Row>
          
          <Row title="Custom Size & Color">
            <LoadingIndicator 
              variant="dots" 
              size="large" 
              color={colors.error}
            />
          </Row>
        </Section>

        {/* Loading Spinners */}
        <Section title="Loading Spinners" colors={colors}>
          <Row title="Spinner">
            <LoadingSpinner variant="spinner" />
          </Row>
          
          <Row title="Pulse Spinner">
            <LoadingSpinner variant="pulse" />
          </Row>
          
          <Row title="Wave Spinner">
            <LoadingSpinner variant="wave" />
          </Row>
          
          <Row title="Large Spinner">
            <LoadingSpinner variant="spinner" size="large" />
          </Row>
        </Section>

        {/* Unified Loading Component */}
        <Section title="Unified Loading Component" colors={colors}>
          <Row title="Default">
            <Loading />
          </Row>
          
          <Row title="Spinner Type">
            <Loading type="spinner" variant="spinner" />
          </Row>
          
          <Row title="Custom Props">
            <Loading 
              type="indicator" 
              variant="pulse" 
              size="large"
              color={colors.success}
            />
          </Row>
        </Section>

        {/* Loading Buttons */}
        <Section title="Loading Buttons" colors={colors}>
          <View style={styles.buttonContainer}>
            <LoadingButton
              title="Submit Form"
              loading={formSubmitting}
              onPress={handleFormSubmit}
              variant="primary"
              style={styles.button}
            />
            
            <LoadingButton
              title="Secondary Action"
              loading={getLoadingState('demo').isLoading}
              onPress={handleWithLoading}
              variant="secondary"
              loadingVariant="spinner"
              style={styles.button}
            />
            
            <LoadingButton
              title="Danger Action"
              loading={false}
              onPress={() => Alert.alert('Info', 'Danger button pressed')}
              variant="danger"
              size="small"
              style={styles.button}
            />
          </View>
        </Section>

        {/* Loading Overlays */}
        <Section title="Loading Overlays" colors={colors}>
          <View style={styles.buttonContainer}>
            <LoadingButton
              title="Show Overlay"
              onPress={handleOverlayDemo}
              variant="outline"
              style={styles.button}
            />
          </View>
        </Section>

        {/* Loading Skeletons */}
        <Section title="Loading Skeletons" colors={colors}>
          <SubSection title="Text Skeleton">
            <LoadingSkeleton.Text lines={3} />
          </SubSection>
          
          <SubSection title="Avatar Skeleton">
            <View style={styles.avatarRow}>
              <LoadingSkeleton.Avatar size={40} />
              <LoadingSkeleton.Avatar size={50} shape="square" />
              <LoadingSkeleton.Avatar size={60} />
            </View>
          </SubSection>
          
          <SubSection title="Card Skeleton">
            <LoadingSkeleton.Card height={180} />
          </SubSection>
          
          <SubSection title="List Skeleton">
            {dataLoading ? (
              <LoadingSkeleton.List itemCount={3} />
            ) : (
              <View>
                <Text style={[styles.listItem, { color: colors.text }]}>
                  📱 User Item 1
                </Text>
                <Text style={[styles.listItem, { color: colors.text }]}>
                  📱 User Item 2
                </Text>
                <Text style={[styles.listItem, { color: colors.text }]}>
                  📱 User Item 3
                </Text>
              </View>
            )}
            
            <LoadingButton
              title={dataLoading ? "Loading..." : "Load Data"}
              onPress={handleDataLoad}
              loading={dataLoading}
              variant="ghost"
              size="small"
              style={[styles.button, { marginTop: 10 }]}
            />
          </SubSection>
        </Section>

        {/* useLoading Hook Demo */}
        <Section title="useLoading Hook" colors={colors}>
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            Hook State: {isAnyLoading ? 'Loading...' : 'Idle'}
          </Text>
          
          <View style={styles.buttonContainer}>
            <LoadingButton
              title="Start Loading A"
              onPress={() => startLoading('a', { message: 'Loading A...' })}
              variant="outline"
              size="small"
              style={styles.button}
            />
            
            <LoadingButton
              title="Start Loading B"
              onPress={() => startLoading('b', { message: 'Loading B...' })}
              variant="outline"
              size="small"
              style={styles.button}
            />
            
            <LoadingButton
              title="Stop All"
              onPress={() => {
                stopLoading('a');
                stopLoading('b');
              }}
              variant="danger"
              size="small"
              style={styles.button}
            />
          </View>
          
          <View style={styles.stateContainer}>
            <Text style={[styles.stateText, { color: colors.textSecondary }]}>
              Loading A: {getLoadingState('a').isLoading ? '✅' : '❌'}
            </Text>
            <Text style={[styles.stateText, { color: colors.textSecondary }]}>
              Loading B: {getLoadingState('b').isLoading ? '✅' : '❌'}
            </Text>
          </View>
        </Section>
      </ScrollView>

      {/* Global Loading Overlay */}
      <LoadingOverlay
        visible={overlayVisible}
        message="Loading overlay demo..."
        variant="spinner"
        size="large"
        useBlur={true}
        position="center"
        animationType="scale"
      />
    </SafeAreaView>
  );
};

// Helper Components
const Section = ({ title, children, colors }) => (
  <View style={styles.section}>
    <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
    {children}
  </View>
);

const SubSection = ({ title, children }) => (
  <View style={styles.subSection}>
    <Text style={styles.subSectionTitle}>{title}</Text>
    {children}
  </View>
);

const Row = ({ title, children }) => (
  <View style={styles.row}>
    <Text style={styles.rowTitle}>{title}</Text>
    <View style={styles.rowContent}>{children}</View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24,
  },
  section: {
    marginBottom: 32,
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  subSection: {
    marginBottom: 20,
  },
  subSectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 12,
    color: '#666',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  rowTitle: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  rowContent: {
    flex: 1,
    alignItems: 'flex-end',
  },
  buttonContainer: {
    gap: 12,
  },
  button: {
    marginVertical: 4,
  },
  avatarRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  description: {
    fontSize: 14,
    fontStyle: 'italic',
    marginBottom: 12,
  },
  stateContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 8,
  },
  stateText: {
    fontSize: 12,
    marginVertical: 2,
  },
  listItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
});

export default LoadingExamples; 