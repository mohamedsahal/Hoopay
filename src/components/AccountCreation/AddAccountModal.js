import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  SafeAreaView,
  Platform,
  Dimensions,
  Animated,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Keyboard,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import accountService from '../../services/accountService';
import LoadingIndicator from '../LoadingIndicator';
import Colors from '../../constants/Colors';

const AddAccountModal = ({ visible, onClose, onSubmit }) => {
  const { token, isAuthenticated } = useAuth();
  const { colors, isDarkMode } = useTheme();
  const [step, setStep] = useState(1);
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [accountPrefix, setAccountPrefix] = useState('');
  const [isLoadingPrefix, setIsLoadingPrefix] = useState(false);
  // State for account categories fetched from the API
  const [categories, setCategories] = useState([]);
  const [accountTypes, setAccountTypes] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  // Loading and error states
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [isLoadingTypes, setIsLoadingTypes] = useState(false);
  const [error, setError] = useState(null);

  const handleError = (error, fallbackMessage) => {
    const errorMessage = error?.response?.data?.message || error?.message || fallbackMessage;
    setError(errorMessage);
  };

  // Fetch account categories from the API
  const fetchCategories = async () => {
    setIsLoadingCategories(true);
    setError(null);
    try {
      console.log('Fetching account categories');
      // Use the same pattern as the working profile endpoint
      const response = await fetch('https://a0b0-102-217-123-227.ngrok-free.app/api/auth/mobile/account-categories', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
      });
      
      const data = await response.json();
      console.log('Categories response:', data);
      
      if (data.success) {
        setCategories(data.data.categories);
        setError(null);
      } else {
        handleError(null, data.message || 'Failed to fetch categories');
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
      handleError(err, 'Failed to load account categories');
    } finally {
      setIsLoadingCategories(false);
    }
  };

  // Fetch account types by category from the API
  const fetchAccountTypes = async () => {
    setIsLoadingTypes(true);
    setError(null);
    try {
      console.log(`Fetching account types for category: ${selectedCategory}`);
      // Use the same pattern as the working profile endpoint
              const response = await fetch(`https://a0b0-102-217-123-227.ngrok-free.app/api/auth/mobile/account-types/${selectedCategory}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
      });
      
      const data = await response.json();
      console.log('Account types response:', data);
      
      if (data.success) {
        setAccountTypes(data.data.account_types);
        setError(null);
      } else {
        handleError(null, data.message || 'Failed to fetch account types');
      }
    } catch (err) {
      console.error('Error fetching account types:', err);
      handleError(err, 'Failed to load account types');
    } finally {
      setIsLoadingTypes(false);
    }
  };

  // Fetch account categories when modal is opened
  useEffect(() => {
    if (visible && isAuthenticated) {
      fetchCategories();
    }
  }, [visible, isAuthenticated]);

  // Fetch account types when category is selected
  useEffect(() => {
    if (selectedCategory && isAuthenticated) {
      fetchAccountTypes(selectedCategory);
    }
  }, [selectedCategory, isAuthenticated]);

  const handleCategorySelect = (category) => {
    setSelectedCategory(category.id);
    setSelectedType(null);
    setAccountNumber('');
    setAccountPrefix('');
    setStep(2);
    setError(null);
  };

  const handleTypeSelect = (type) => {
    setSelectedType(type);
    // Use wallet type name directly instead of creating a custom name
    setAccountName(type.name);
    
    // Clear account number when selecting a new type
    setAccountNumber('');
    
    // Only fetch prefix if not a crypto or bank account
    if (selectedCategory !== 'crypto' && selectedCategory !== 'bank') {
      fetchAccountPrefix(type.id);
    } else {
      // Clear prefix for crypto and bank accounts
      setAccountPrefix('');
    }
    
    setStep(3);
  };
  
  // Fetch account number prefix for the selected account type
  const fetchAccountPrefix = async (accountType) => {
    setIsLoadingPrefix(true);
    try {
      console.log(`Fetching account prefix for type: ${accountType}`);
      // Use the same pattern as the working profile endpoint
              const response = await fetch(`https://a0b0-102-217-123-227.ngrok-free.app/api/auth/mobile/account-prefix/${accountType}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
      });
      
      const data = await response.json();
      console.log('Account prefix response:', data);
      
      if (data.success && data.data && data.data.prefix) {
        setAccountPrefix(data.data.prefix);
      } else {
        // Use a default prefix if API doesn't return one
        setAccountPrefix('');
      }
    } catch (err) {
      console.error('Error fetching account prefix:', err);
      setAccountPrefix('');
    } finally {
      setIsLoadingPrefix(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedType) {
      handleError(null, 'Please select an account type first');
      return;
    }
    if (!isAuthenticated) {
      handleError(null, 'Please log in to create an account');
      return;
    }
    if (!accountNumber) {
      const fieldName = selectedCategory === 'crypto' ? 'wallet address' : 'account number';
      handleError(null, `Please enter a ${fieldName}`);
      return;
    }

    setIsLoading(true);
    try {
      // Create account data with exact field values that match backend validation
    // Get current date for creation_date
    const currentDate = new Date().toISOString().split('T')[0]; // Format as YYYY-MM-DD
    
    // Extract type name/code for consistent reference
    const typeName = selectedType.name?.toLowerCase() || '';
    const typeCode = selectedType.code?.toLowerCase() || '';
    
    const accountData = {
      name: accountName || selectedType.name, // Use wallet type name if user didn't provide a name
      account_type: selectedType.id, // Use the id which exactly matches expected values on backend
      wallet_type_id: selectedType.id, // Add this field to match web frontend
      wallet_type: {
        id: selectedType.id,
        name: selectedType.name,
        code: selectedType.code || selectedType.name?.toLowerCase().replace(/\s+/g, '_'),
        payment_instructions: selectedType.payment_instructions || ''
      },
      // Include normalized values to help with matching during deposit
      wallet_type_name: typeName,
      wallet_code: typeCode,
      currency: selectedType.currency || 'USD',
      bank_name: selectedCategory === 'bank' ? 'Default Bank' : '',
      account_number: accountNumber,
      creation_date: currentDate // Add creation date
    };
    
    // Add category-specific data
    if (selectedCategory === 'crypto') {
      accountData.deposit_address = '';
      accountData.network = selectedType.id.toUpperCase();
    }
    
    // Store payment instructions directly on the account as well if available
    if (selectedType.payment_instructions) {
      accountData.payment_instructions = selectedType.payment_instructions;
    }  
      
      console.log('Submitting account data:', accountData);
      
      await onSubmit(accountData);
      resetModal();
    } catch (err) {
      console.error('Account creation error:', err.message, err.response?.data);
      handleError(err, 'Failed to create account');
    } finally {
      setIsLoading(false);
    }
  };

  const resetModal = () => {
    setStep(1);
    setSelectedCategory(null);
    setSelectedType(null);
    setError(null);
    onClose();
  };

  const renderCategories = () => (
    <ScrollView style={styles.content}>
      {isLoadingCategories ? (
        <View style={styles.loadingContainer}>
          <LoadingIndicator size={14} color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading categories...</Text>
        </View>
      ) : categories.length > 0 ? (
        categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[styles.option, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
            onPress={() => handleCategorySelect(category)}
          >
            <View style={styles.optionContent}>
              <Text style={[styles.optionText, { color: colors.text }]}>{category.name}</Text>
              <Text style={[styles.optionDescription, { color: colors.textSecondary }]}>{category.description}</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        ))
      ) : (
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No account categories available</Text>
      )}
    </ScrollView>
  );

  const renderAccountTypes = () => (
    <ScrollView style={styles.content}>
      {isLoadingTypes ? (
        <View style={styles.loadingContainer}>
          <LoadingIndicator size={14} color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading account types...</Text>
        </View>
      ) : accountTypes.length > 0 ? (
        <>
          {accountTypes.map((type) => (
            <TouchableOpacity
              key={type.id}
              style={[styles.option, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
              onPress={() => handleTypeSelect(type)}
            >
              <View style={styles.optionContent}>
                <Text style={[styles.optionText, { color: colors.text }]}>{type.name}</Text>
                <Text style={[styles.optionDescription, { color: colors.textSecondary }]}>{type.description}</Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.backButton} onPress={() => setStep(1)}>
            <MaterialIcons name="arrow-back" size={24} color={colors.primary} />
            <Text style={[styles.backButtonText, { color: colors.primary }]}>Back to Categories</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No account types available for this category</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => setStep(1)}>
            <MaterialIcons name="arrow-back" size={24} color={colors.primary} />
            <Text style={[styles.backButtonText, { color: colors.primary }]}>Back to Categories</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );

  const renderAccountDetails = () => (
    <View style={styles.content}>
      <View style={styles.inputContainer}>
        <Text style={[styles.inputLabel, { color: colors.text }]}>Wallet Type</Text>
        <TextInput
          style={[styles.input, { 
            backgroundColor: colors.surface, 
            borderColor: colors.border, 
            color: colors.text 
          }]}
          value={accountName}
          onChangeText={setAccountName}
          placeholder="Wallet type name"
          placeholderTextColor={colors.placeholder}
          editable={false} // Make this field read-only as we're using the wallet type name directly
        />
      </View>
      
      <View style={styles.inputContainer}>
        <Text style={[styles.inputLabel, { color: colors.text }]}>
          {selectedCategory === 'crypto' ? 'Wallet Address' : 'Account Number'} 
          <Text style={[styles.requiredField, { color: colors.error }]}>*</Text>
        </Text>
        {selectedCategory !== 'crypto' && selectedCategory !== 'bank' && isLoadingPrefix ? (
          <View style={[styles.prefixLoadingContainer, { 
            backgroundColor: colors.surface, 
            borderColor: colors.border 
          }]}>
            <LoadingIndicator size={12} color={colors.primary} />
            <Text style={[styles.prefixLoadingText, { color: colors.textSecondary }]}>Loading account number prefix...</Text>
          </View>
        ) : selectedCategory !== 'crypto' && selectedCategory !== 'bank' && accountPrefix ? (
          <View style={styles.prefixContainer}>
            <View style={[styles.prefixBox, { 
              backgroundColor: colors.surface, 
              borderColor: colors.border 
            }]}>
              <Text style={[styles.prefixText, { color: colors.text }]}>{accountPrefix}</Text>
            </View>
            <TextInput
              style={[styles.inputWithPrefix, { 
                backgroundColor: colors.surface, 
                borderColor: colors.border, 
                color: colors.text 
              }]}
              value={accountNumber}
              onChangeText={setAccountNumber}
              placeholder={selectedCategory === 'crypto' ? "Enter wallet address" : "Enter account number"}
              placeholderTextColor={colors.placeholder}
              keyboardType={selectedCategory === 'crypto' ? "default" : "numeric"}
              required
            />
          </View>
        ) : (
          <TextInput
            style={[styles.input, { 
              backgroundColor: colors.surface, 
              borderColor: colors.border, 
              color: colors.text 
            }]}
            value={accountNumber}
            onChangeText={setAccountNumber}
            placeholder={selectedCategory === 'crypto' ? "Enter wallet address" : "Enter account number"}
            placeholderTextColor={colors.placeholder}
            keyboardType={selectedCategory === 'crypto' ? "default" : "numeric"}
            required
          />
        )}
      </View>
      
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={() => setStep(2)}
        disabled={isLoading}
      >
        <MaterialIcons name="arrow-back" size={24} color={isLoading ? colors.textTertiary : colors.primary} />
        <Text style={[styles.backButtonText, { 
          color: isLoading ? colors.textTertiary : colors.primary 
        }]}>Back to Account Types</Text>
      </TouchableOpacity>
    </View>
  );

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return renderCategories();
      case 2:
        return renderAccountTypes();
      case 3:
        return renderAccountDetails();
      default:
        return null;
    }
  };

  return (
    <Modal
      animationType="none"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <BlurView 
          intensity={90} 
          tint={isDarkMode ? "dark" : "light"} 
          style={styles.blurContainer}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.keyboardAvoidingView}
          >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={[styles.modalView, { backgroundColor: colors.surface }]}>
                <View style={[styles.modalHandle, { backgroundColor: colors.border }]} />
                <View style={[styles.header, { borderBottomColor: colors.border }]}>
                  <Text style={[styles.title, { color: colors.text }]}>
                    {step === 1
                      ? 'Select Account Category'
                      : step === 2
                      ? 'Select Account Type'
                      : 'Add New Account'}
                  </Text>
                  <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                    <MaterialIcons name="close" size={24} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                {error ? (
                  <View style={styles.centerContent}>
                    <MaterialIcons name="error" size={40} color={colors.error} />
                    <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
                    <TouchableOpacity 
                      style={[styles.retryButton, { backgroundColor: colors.primary }]} 
                      onPress={() => {
                        setError(null);
                        if (step === 1) fetchCategories();
                        else if (step === 2) fetchAccountTypes();
                      }}
                    >
                      <Text style={[styles.retryButtonText, { color: 'white' }]}>Retry</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  renderStepContent()
                )}
                
                {step === 3 && (
                  <View style={[styles.bottomButtonContainer, { borderTopColor: colors.border }]}>
                    <TouchableOpacity 
                      style={styles.cancelButton} 
                      onPress={onClose}
                    >
                      <Text style={[styles.cancelButtonText, { color: colors.primary }]}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.createButton, { backgroundColor: colors.primary }, isLoading && { backgroundColor: colors.primaryDisabled }]} 
                      onPress={handleSubmit}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <LoadingIndicator size={14} color="white" />
                      ) : (
                        <Text style={styles.createButtonText}>Create Account</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </BlurView>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  blurContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  keyboardAvoidingView: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalView: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20, // Extra padding for iPhone X+ bottom area
    maxHeight: height * 0.85,
  },
  modalHandle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    flex: 1,
  },
  closeButton: {
    padding: 5,
  },
  content: {
    padding: 20,
    maxHeight: height * 0.6,
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  optionContent: {
    flex: 1,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '600',
  },
  optionDescription: {
    fontSize: 14,
    marginTop: 4,
  },
  errorText: {
    marginTop: 12,
    textAlign: 'center',
    fontSize: 16,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    marginTop: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    padding: 10,
  },
  backButtonText: {
    marginLeft: 5,
    fontSize: 16,
  },
  disabledText: {
    // Removed hardcoded color - will be applied dynamically
  },
  // Account details styles
  detailsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  bottomButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: Platform.OS === 'ios' ? 20 : 15,
    borderTopWidth: 1,
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  createButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 140,
  },
  disabledButton: {
    // Removed hardcoded color - will be applied dynamically  
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  retryButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  requiredField: {
    fontWeight: 'bold',
  },
  prefixLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  prefixLoadingText: {
    marginLeft: 10,
    fontSize: 14,
  },
  prefixContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  prefixBox: {
    padding: 14,
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
    borderWidth: 1,
    borderRightWidth: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  prefixText: {
    fontSize: 16,
    fontWeight: '500',
  },
  inputWithPrefix: {
    flex: 1,
    borderWidth: 1,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    padding: 12,
    fontSize: 16,
    height: 48,
  },
});

export default AddAccountModal;