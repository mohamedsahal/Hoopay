import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
  TextInput,
  SafeAreaView,
} from 'react-native';
import { runAllTests, apiTests } from '../utils/apiTest';
import { pickImage, takePhoto } from '../utils/imagePicker';
import { testImagePickerDebug, testCameraDebug } from '../scripts/testImagePicker';

const ApiTestScreen = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState([]);
  const [testEmail, setTestEmail] = useState(''); // Remove default test email
  const [testPassword, setTestPassword] = useState('testPassword123');
  const [summary, setSummary] = useState(null);

  const runTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    setSummary(null);

    // Update test config with user inputs
    if (apiTests.testLogin) {
      apiTests.testConfig = {
        testEmail,
        testPassword,
        authToken: null,
      };
    }

    try {
      // Run individual tests and update results in real-time
      const results = [];
      const testNames = [
        'testLogin',
        'testGetUserProfile',
        'testGetWallets',
        'testGetTransactions',
        'testGetCurrencies',
        'testGetKYCStatus',
        'testGetReferrals',
        'testGetAppConfig',
        'testFirebaseLogin',
      ];

      let passed = 0;
      let failed = 0;
      let skipped = 0;

      for (const testName of testNames) {
        const startTime = Date.now();
        
        try {
          const result = await apiTests[testName]();
          const endTime = Date.now();
          const duration = endTime - startTime;

          const testResult = {
            name: testName,
            status: result === undefined ? 'skipped' : (result.success ? 'passed' : 'failed'),
            duration,
            details: result,
          };

          if (testResult.status === 'passed') passed++;
          else if (testResult.status === 'failed') failed++;
          else skipped++;

          results.push(testResult);
          setTestResults([...results]);
        } catch (error) {
          const endTime = Date.now();
          const duration = endTime - startTime;
          
          results.push({
            name: testName,
            status: 'error',
            duration,
            error: error.message,
          });
          failed++;
          setTestResults([...results]);
        }

        // Add delay between tests
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      setSummary({
        total: testNames.length,
        passed,
        failed,
        skipped,
      });

    } catch (error) {
      Alert.alert('Error', 'Failed to run tests: ' + error.message);
    } finally {
      setIsRunning(false);
    }
  };

  const testImagePicker = async () => {
    try {
      console.log('🧪 Testing image picker...');
      const result = await pickImage({
        allowsEditing: false,
        quality: 0.8,
      });
      console.log('🧪 Image picker test result:', result);
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        console.log('🧪 Image picker test SUCCESS:', result.assets[0]);
        Alert.alert('Success', 'Image picker is working correctly!');
      } else {
        console.log('🧪 Image picker test FAILED - canceled or no assets');
        Alert.alert('Test Failed', 'Image picker returned canceled or no assets');
      }
    } catch (error) {
      console.error('🧪 Image picker test error:', error);
      Alert.alert('Test Error', `Image picker test failed: ${error.message}`);
    }
  };

  const testCamera = async () => {
    try {
      console.log('🧪 Testing camera...');
      const result = await takePhoto({
        allowsEditing: false,
        quality: 0.8,
      });
      console.log('🧪 Camera test result:', result);
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        console.log('🧪 Camera test SUCCESS:', result.assets[0]);
        Alert.alert('Success', 'Camera is working correctly!');
      } else {
        console.log('🧪 Camera test FAILED - canceled or no assets');
        Alert.alert('Test Failed', 'Camera returned canceled or no assets');
      }
    } catch (error) {
      console.error('🧪 Camera test error:', error);
      Alert.alert('Test Error', `Camera test failed: ${error.message}`);
    }
  };

  const testImagePickerDebug = async () => {
    try {
      console.log('🔍 Starting debug test for image picker...');
      const result = await testImagePickerDebug();
      console.log('🔍 Debug test result:', result);
      Alert.alert('Debug Test Complete', 'Check console for detailed logs');
    } catch (error) {
      console.error('🔍 Debug test error:', error);
      Alert.alert('Debug Test Error', `Debug test failed: ${error.message}`);
    }
  };

  const testImagePickerSimple = async () => {
    try {
      console.log('🧪 Testing simple image picker...');
      const result = await pickImage({
        allowsEditing: false,
        quality: 0.8,
      });
      
      console.log('🧪 Simple image picker result:', result);
      
      if (result && !result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        console.log('🧪 Simple image picker SUCCESS:', asset);
        Alert.alert('Success', `Image picker working! Selected: ${asset.fileName || 'image'}`);
      } else {
        console.log('🧪 Simple image picker FAILED - canceled or no assets');
        Alert.alert('Test Failed', 'Image picker returned canceled or no assets');
      }
    } catch (error) {
      console.error('🧪 Simple image picker error:', error);
      Alert.alert('Test Error', `Simple image picker failed: ${error.message}`);
    }
  };

  const testCameraDebug = async () => {
    try {
      console.log('🔍 Starting debug test for camera...');
      const result = await testCameraDebug();
      console.log('🔍 Debug test result:', result);
      Alert.alert('Debug Test Complete', 'Check console for detailed logs');
    } catch (error) {
      console.error('🔍 Debug test error:', error);
      Alert.alert('Debug Test Error', `Debug test failed: ${error.message}`);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'passed':
        return '#4CAF50';
      case 'failed':
      case 'error':
        return '#F44336';
      case 'skipped':
        return '#FF9800';
      default:
        return '#757575';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'passed':
        return '✅';
      case 'failed':
      case 'error':
        return '❌';
      case 'skipped':
        return '⚠️';
      default:
        return '⏳';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>API Test Suite</Text>
          <Text style={styles.subtitle}>Test Hoopay API Endpoints</Text>
        </View>

        <View style={styles.configSection}>
          <Text style={styles.sectionTitle}>Test Configuration</Text>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Test Email:</Text>
            <TextInput
              style={styles.input}
              value={testEmail}
              onChangeText={setTestEmail}
              placeholder="Enter test email"
              keyboardType="email-address"
              editable={!isRunning}
            />
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Test Password:</Text>
            <TextInput
              style={styles.input}
              value={testPassword}
              onChangeText={setTestPassword}
              placeholder="Enter test password"
              secureTextEntry
              editable={!isRunning}
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.runButton, isRunning && styles.runButtonDisabled]}
          onPress={runTests}
          disabled={isRunning}
        >
          {isRunning ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.runButtonText}>Run All Tests</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.testButton} onPress={testImagePicker}>
          <Text style={styles.testButtonText}>Test Image Picker</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.testButton} onPress={testCamera}>
          <Text style={styles.testButtonText}>Test Camera</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.testButton} onPress={testImagePickerDebug}>
          <Text style={styles.testButtonText}>Debug Image Picker</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.testButton} onPress={testImagePickerSimple}>
          <Text style={styles.testButtonText}>Simple Image Picker Test</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.testButton} onPress={testCameraDebug}>
          <Text style={styles.testButtonText}>Debug Camera</Text>
        </TouchableOpacity>

        {summary && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Test Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Tests:</Text>
              <Text style={styles.summaryValue}>{summary.total}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: '#4CAF50' }]}>Passed:</Text>
              <Text style={[styles.summaryValue, { color: '#4CAF50' }]}>{summary.passed}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: '#F44336' }]}>Failed:</Text>
              <Text style={[styles.summaryValue, { color: '#F44336' }]}>{summary.failed}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: '#FF9800' }]}>Skipped:</Text>
              <Text style={[styles.summaryValue, { color: '#FF9800' }]}>{summary.skipped}</Text>
            </View>
          </View>
        )}

        <View style={styles.resultsSection}>
          <Text style={styles.sectionTitle}>Test Results</Text>
          {testResults.map((result, index) => (
            <View key={index} style={styles.testCard}>
              <View style={styles.testHeader}>
                <Text style={styles.testIcon}>{getStatusIcon(result.status)}</Text>
                <Text style={styles.testName}>{result.name}</Text>
                <Text style={[styles.testStatus, { color: getStatusColor(result.status) }]}>
                  {result.status.toUpperCase()}
                </Text>
              </View>
              <Text style={styles.testDuration}>Duration: {result.duration}ms</Text>
              {result.error && (
                <Text style={styles.errorText}>Error: {result.error}</Text>
              )}
            </View>
          ))}
        </View>

        {testResults.length === 0 && !isRunning && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No tests run yet</Text>
            <Text style={styles.emptySubtext}>Click "Run All Tests" to start</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    backgroundColor: '#2196F3',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  subtitle: {
    fontSize: 16,
    color: 'white',
    marginTop: 5,
  },
  configSection: {
    backgroundColor: 'white',
    margin: 15,
    padding: 15,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  inputContainer: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    fontSize: 16,
  },
  runButton: {
    backgroundColor: '#4CAF50',
    margin: 15,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  runButtonDisabled: {
    backgroundColor: '#ccc',
  },
  runButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  summaryCard: {
    backgroundColor: 'white',
    margin: 15,
    padding: 15,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#666',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  resultsSection: {
    margin: 15,
  },
  testCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  testHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  testIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  testName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  testStatus: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  testDuration: {
    fontSize: 12,
    color: '#666',
    marginLeft: 30,
  },
  errorText: {
    fontSize: 12,
    color: '#F44336',
    marginTop: 5,
    marginLeft: 30,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 50,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
  },
  testButton: {
    backgroundColor: '#4CAF50',
    margin: 15,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  testButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ApiTestScreen; 