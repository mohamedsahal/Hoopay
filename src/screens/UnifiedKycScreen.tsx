import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Image,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import kycService from '../services/kycService';
import { documentTypes, countries } from '../constants/kycData';
import { DocumentTypePickerModal, CountryPickerModal, DatePickerModal } from '../components/KYC';
import AdminFeedback from '../components/KYC/AdminFeedback';
import * as ImagePicker from 'expo-image-picker';

const { width: screenWidth } = Dimensions.get('window');

interface UnifiedKycScreenProps {
  navigation: any;
}

interface PersonalInfo {
  full_name: string;
  document_type: string;
  document_number: string;
  date_of_birth: string;
  nationality: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

interface DocumentUpload {
  uri: string;
  type?: string;
  name?: string;
}

interface ValidationErrors {
  [key: string]: string;
}

const UnifiedKycScreen: React.FC<UnifiedKycScreenProps> = ({ navigation }) => {
  const { isDarkMode } = useTheme();
  const colors = (useTheme() as any).theme;
  const insets = useSafeAreaInsets();

  // Personal info state
  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>({
    full_name: '',
    document_type: '',
    document_number: '',
    date_of_birth: '',
    nationality: '',
    address: '',
    city: '',
    state: '',
    postal_code: '',
    country: '',
  });

  // Document uploads
  const [documentFront, setDocumentFront] = useState<DocumentUpload | null>(null);
  const [documentBack, setDocumentBack] = useState<DocumentUpload | null>(null);
  const [selfieImage, setSelfieImage] = useState<DocumentUpload | null>(null);

  // Modal states
  const [showDocumentTypePicker, setShowDocumentTypePicker] = useState(false);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Date picker states
  const [tempDate, setTempDate] = useState({ day: '', month: '', year: '' });
  const [focusedDateField, setFocusedDateField] = useState<'day' | 'month' | 'year' | null>(null);

  // Loading and validation states
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());
  const [kycStatus, setKycStatus] = useState<any>(null);

  useEffect(() => {
    loadExistingData();
  }, []);

  const loadExistingData = async () => {
    try {
      setLoading(true);
      const response = await kycService.getKycStatus();
      if (response.success) {
        setKycStatus(response.data);
        if (response.data?.personal_info) {
          setPersonalInfo(prev => ({
            ...prev,
            ...response.data.personal_info,
          }));
        }
      }
    } catch (error) {
      console.error('Error loading KYC data:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateField = (field: string, value: string): string => {
    switch (field) {
      case 'full_name':
        if (!value.trim()) return 'Full name is required';
        if (value.trim().length < 2) return 'Name must be at least 2 characters';
        if (!/^[a-zA-Z\s-']+$/.test(value)) return 'Name can only contain letters, spaces, hyphens, and apostrophes';
        return '';
      
      case 'document_type':
        if (!value) return 'Please select a document type';
        return '';
      
      case 'document_number':
        if (!value.trim()) return 'Document number is required';
        if (value.trim().length < 3) return 'Document number must be at least 3 characters';
        return '';
      
      case 'date_of_birth':
        if (!value) return 'Date of birth is required';
        const birthDate = new Date(value);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        if (age < 18) return 'You must be at least 18 years old';
        if (age > 120) return 'Please enter a valid date of birth';
        return '';
      
      case 'country':
        if (!value) return 'Please select your country';
        return '';
      
      case 'address':
        if (!value.trim()) return 'Address is required';
        if (value.trim().length < 10) return 'Please enter a complete address';
        return '';
      
      case 'city':
        if (!value.trim()) return 'City is required';
        if (value.trim().length < 2) return 'City name must be at least 2 characters';
        return '';
      
      case 'nationality':
        if (!value.trim()) return 'Nationality is required';
        return '';
      
      case 'postal_code':
        if (!value.trim()) return 'Postal code is required';
        return '';
      
      default:
        return '';
    }
  };

  const updatePersonalInfo = (field: keyof PersonalInfo, value: string) => {
    setPersonalInfo(prev => ({ ...prev, [field]: value }));
    
    // Add to touched fields
    setTouchedFields(prev => new Set(prev).add(field));
    
    // Validate field and update errors
    const error = validateField(field, value);
    setValidationErrors(prev => ({
      ...prev,
      [field]: error
    }));
  };

  const getDocumentTypeLabel = () => {
    const docType = documentTypes.find(type => type.value === personalInfo.document_type);
    return docType ? docType.label : 'Select Document Type';
  };

  const requiresBackDocument = () => {
    return personalInfo.document_type === 'national_id' || personalInfo.document_type === 'driver_license';
  };

  const handleDateFieldFocus = (field: 'day' | 'month' | 'year') => {
    setFocusedDateField(field);
    setShowDatePicker(true);
  };

  const handleDateChange = (date: string) => {
    setPersonalInfo(prev => ({ ...prev, date_of_birth: date }));
    setTouchedFields(prev => new Set(prev).add('date_of_birth'));
    
    const error = validateField('date_of_birth', date);
    setValidationErrors(prev => ({
      ...prev,
      date_of_birth: error
    }));
    
    setShowDatePicker(false);
    setFocusedDateField(null);
  };

  const openWhatsApp = async () => {
    const phoneNumber = '+252905251111';
    const message = 'Hello, I need assistance with my KYC verification process.';
    const url = `whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`;
    
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        // Fallback to web WhatsApp
        const webUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
        await Linking.openURL(webUrl);
      }
    } catch (error) {
      console.error('Error opening WhatsApp:', error);
      Alert.alert(
        'Unable to Open WhatsApp',
        'Please contact support at +252905251111 or install WhatsApp to use this feature.',
        [{ text: 'OK' }]
      );
    }
  };

  const requestPermissions = async (type: 'camera' | 'library') => {
    if (type === 'camera') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      return status === 'granted';
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      return status === 'granted';
    }
  };

  const pickImage = async (documentType: 'front' | 'back' | 'selfie') => {
    const hasPermission = await requestPermissions('library');
    if (!hasPermission) {
      Alert.alert('Permission Required', 'Please grant photo library access to upload documents.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const uploadData: DocumentUpload = {
        uri: asset.uri,
        type: asset.type || 'image/jpeg',
        name: `${documentType}_${Date.now()}.jpg`,
      };

      switch (documentType) {
        case 'front':
          setDocumentFront(uploadData);
          break;
        case 'back':
          setDocumentBack(uploadData);
          break;
        case 'selfie':
          setSelfieImage(uploadData);
          break;
      }
    }
  };

  const takePhoto = async (documentType: 'front' | 'back' | 'selfie') => {
    const hasPermission = await requestPermissions('camera');
    if (!hasPermission) {
      Alert.alert('Permission Required', 'Please grant camera access to take photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const uploadData: DocumentUpload = {
        uri: asset.uri,
        type: asset.type || 'image/jpeg',
        name: `${documentType}_${Date.now()}.jpg`,
      };

      switch (documentType) {
        case 'front':
          setDocumentFront(uploadData);
          break;
        case 'back':
          setDocumentBack(uploadData);
          break;
        case 'selfie':
          setSelfieImage(uploadData);
          break;
      }
    }
  };

  const showImagePicker = (documentType: 'front' | 'back' | 'selfie') => {
    const title = documentType === 'selfie' ? 'Take Selfie' : `${documentType === 'front' ? 'Front' : 'Back'} of ID`;
    
    Alert.alert(
      title,
      'Choose how to add your document',
      [
        { text: 'Take Photo', onPress: () => takePhoto(documentType) },
        { text: 'Choose from Gallery', onPress: () => pickImage(documentType) },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};
    
    // Validate all required fields
    const requiredFields: (keyof PersonalInfo)[] = [
      'full_name',
      'document_type',
      'document_number',
      'date_of_birth',
      'country',
      'address',
      'city',
      'nationality',
      'postal_code',
    ];

    for (const field of requiredFields) {
      const error = validateField(field, personalInfo[field]);
      if (error) {
        errors[field] = error;
      }
    }

    // Validate documents
    if (!documentFront) {
      errors.documentFront = 'Please upload front of your ID document';
    }

    if (requiresBackDocument() && !documentBack) {
      errors.documentBack = 'Please upload back of your ID document';
    }

    if (!selfieImage) {
      errors.selfieImage = 'Please take a selfie for verification';
    }

    setValidationErrors(errors);
    
    if (Object.keys(errors).length > 0) {
      const firstError = Object.values(errors)[0];
      Alert.alert('Validation Error', firstError);
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);

      // Submit personal info
      const personalInfoResponse = await kycService.submitPersonalInfo(personalInfo);
      if (!personalInfoResponse.success) {
        throw new Error(personalInfoResponse.error || 'Failed to submit personal information');
      }

      // Upload documents
      if (documentFront) {
        const frontResponse = await kycService.uploadDocumentBase64(documentFront, 'front_document');
        if (!frontResponse.success) {
          throw new Error('Failed to upload front document');
        }
      }

      if (requiresBackDocument() && documentBack) {
        const backResponse = await kycService.uploadDocumentBase64(documentBack, 'back_document');
        if (!backResponse.success) {
          throw new Error('Failed to upload back document');
        }
      }

      if (selfieImage) {
        const selfieResponse = await kycService.uploadDocumentBase64(selfieImage, 'selfie');
        if (!selfieResponse.success) {
          throw new Error('Failed to upload selfie');
        }
      }

      // Update status to pending to show the under review message
      setKycStatus((prev: any) => ({ 
        ...prev, 
        verification_status: 'pending',
        submitted_at: new Date().toISOString()
      }));

      Alert.alert(
        'Success!',
        'Your KYC verification has been submitted successfully. You will be notified once it is reviewed.',
        [{ text: 'OK' }]
      );

    } catch (error: unknown) {
      console.error('KYC submission error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit KYC verification';
      Alert.alert('Submission Failed', errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const renderInputField = (
    label: string,
    field: keyof PersonalInfo,
    placeholder: string,
    options?: {
      multiline?: boolean;
      keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
      autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
      editable?: boolean;
    }
  ) => {
    const hasError = touchedFields.has(field) && validationErrors[field];
    
    return (
      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { color: colors.text }]}>
          {label} {field !== 'state' && '*'}
        </Text>
        <TextInput
          style={[
            styles.textInput,
            {
              backgroundColor: colors.background,
              color: colors.text,
              borderColor: hasError ? '#FF6B6B' : '#E0E0E0',
              opacity: options?.editable === false ? 0.6 : 1,
            },
            options?.multiline && { height: 80, textAlignVertical: 'top' }
          ]}
          value={personalInfo[field]}
          onChangeText={(text) => updatePersonalInfo(field, text)}
          placeholder={placeholder}
          placeholderTextColor="#999"
          multiline={options?.multiline}
          keyboardType={options?.keyboardType}
          autoCapitalize={options?.autoCapitalize}
          returnKeyType="next"
          blurOnSubmit={!options?.multiline}
          editable={options?.editable !== false}
        />
        {hasError && (
          <Text style={[styles.errorText, { color: '#FF6B6B' }]}>
            {validationErrors[field]}
          </Text>
        )}
      </View>
    );
  };

  const renderPickerField = (
    label: string,
    value: string,
    placeholder: string,
    onPress: () => void,
    fieldKey: string
  ) => {
    const hasError = touchedFields.has(fieldKey) && validationErrors[fieldKey];
    
    return (
      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { color: colors.text }]}>
          {label} *
        </Text>
        <TouchableOpacity
          style={[
            styles.pickerContainer,
            {
              backgroundColor: colors.background,
              borderColor: hasError ? '#FF6B6B' : '#E0E0E0',
            }
          ]}
          onPress={onPress}
        >
          <Text
            style={[
              styles.pickerText,
              {
                color: value ? colors.text : '#999'
              }
            ]}
          >
            {value || placeholder}
          </Text>
          <Ionicons name="chevron-down" size={20} color={colors.text} />
        </TouchableOpacity>
        {hasError && (
          <Text style={[styles.errorText, { color: '#FF6B6B' }]}>
            {validationErrors[fieldKey]}
          </Text>
        )}
      </View>
    );
  };

  const renderPersonalInfoSection = () => (
    <View style={[styles.section, { backgroundColor: colors.card }]}>
      <View style={styles.sectionHeader}>
        <Ionicons name="person-outline" size={24} color={colors.primary} />
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Basic Information
        </Text>
      </View>

      {renderInputField('Full Name', 'full_name', 'Enter your full name', {
        autoCapitalize: 'words',
        editable: kycStatus?.verification_status !== 'approved'
      })}

      {renderPickerField(
        'Document Type',
        getDocumentTypeLabel(),
        'Select Document Type',
        () => setShowDocumentTypePicker(true),
        'document_type'
      )}

      {renderInputField('Document Number', 'document_number', 'Enter document number', {
        autoCapitalize: 'characters'
      })}

      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { color: colors.text }]}>Date of Birth *</Text>
        <View style={styles.dateInputContainer}>
          <TouchableOpacity
            style={[
              styles.dateField, 
              { 
                backgroundColor: colors.background,
                borderColor: touchedFields.has('date_of_birth') && validationErrors.date_of_birth ? '#FF6B6B' : '#E0E0E0',
              }
            ]}
            onPress={() => handleDateFieldFocus('day')}
          >
            <Text style={[{ color: tempDate.day ? colors.text : '#999' }]}>
              {tempDate.day || 'DD'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.dateField, 
              { 
                backgroundColor: colors.background,
                borderColor: touchedFields.has('date_of_birth') && validationErrors.date_of_birth ? '#FF6B6B' : '#E0E0E0',
              }
            ]}
            onPress={() => handleDateFieldFocus('month')}
          >
            <Text style={[{ color: tempDate.month ? colors.text : '#999' }]}>
              {tempDate.month || 'MM'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.dateField, 
              { 
                backgroundColor: colors.background,
                borderColor: touchedFields.has('date_of_birth') && validationErrors.date_of_birth ? '#FF6B6B' : '#E0E0E0',
              }
            ]}
            onPress={() => handleDateFieldFocus('year')}
          >
            <Text style={[{ color: tempDate.year ? colors.text : '#999' }]}>
              {tempDate.year || 'YYYY'}
            </Text>
          </TouchableOpacity>
        </View>
        {personalInfo.date_of_birth && (
          <Text style={[styles.datePreview, { color: colors.text }]}>
            Selected: {personalInfo.date_of_birth}
          </Text>
        )}
        {touchedFields.has('date_of_birth') && validationErrors.date_of_birth && (
          <Text style={[styles.errorText, { color: '#FF6B6B' }]}>
            {validationErrors.date_of_birth}
          </Text>
        )}
      </View>

      {renderPickerField(
        'Country',
        personalInfo.country,
        'Select Country',
        () => setShowCountryPicker(true),
        'country'
      )}

      {renderPickerField(
        'Nationality',
        personalInfo.nationality,
        'Select Nationality',
        () => setShowCountryPicker(true),
        'nationality'
      )}

      {renderInputField('Address', 'address', 'Enter your complete address', {
        multiline: true,
        autoCapitalize: 'words'
      })}

      <View style={styles.row}>
        <View style={[styles.inputGroup, styles.halfWidth]}>
          {renderInputField('City', 'city', 'City', {
            autoCapitalize: 'words'
          })}
        </View>
        <View style={[styles.inputGroup, styles.halfWidth]}>
          {renderInputField('State', 'state', 'State (Optional)', {
            autoCapitalize: 'words'
          })}
        </View>
      </View>

      <View style={styles.row}>
        <View style={[styles.inputGroup, styles.halfWidth]}>
          {renderInputField('Postal Code', 'postal_code', 'Enter postal code', {
            autoCapitalize: 'characters'
          })}
        </View>
        <View style={[styles.inputGroup, styles.halfWidth]}>
          {/* Empty space for balance */}
        </View>
      </View>
    </View>
  );

  const renderDocumentUpload = (
    title: string,
    documentType: 'front' | 'back' | 'selfie',
    uploadedDoc: DocumentUpload | null,
    isRequired: boolean = true
  ) => {
    const hasError = validationErrors[`document${documentType.charAt(0).toUpperCase() + documentType.slice(1)}`];
    
    return (
      <View style={styles.documentUpload}>
        <Text style={[styles.documentLabel, { color: colors.text }]}>
          {title} {isRequired && '*'}
        </Text>
        <TouchableOpacity
          style={[
            styles.uploadButton,
            {
              borderColor: hasError ? '#FF6B6B' : uploadedDoc ? colors.primary : colors.border,
              backgroundColor: uploadedDoc ? `${colors.primary}10` : colors.background,
            }
          ]}
          onPress={() => showImagePicker(documentType)}
        >
          {uploadedDoc ? (
            <View style={styles.uploadedContainer}>
              <Image source={{ uri: uploadedDoc.uri }} style={styles.uploadedImage} />
              <View style={styles.uploadedOverlay}>
                <Ionicons name="checkmark-circle" size={32} color={colors.primary} />
                <Text style={[styles.uploadedText, { color: colors.primary }]}>
                  Uploaded
                </Text>
              </View>
            </View>
          ) : (
            <>
              <Ionicons
                name={documentType === 'selfie' ? 'person' : 'camera'}
                size={32}
                color={hasError ? '#FF6B6B' : colors.text}
              />
              <Text style={[styles.uploadText, { color: hasError ? '#FF6B6B' : colors.text }]}>
                {documentType === 'selfie' ? 'Take Selfie' : `Upload ${title}`}
              </Text>
            </>
          )}
        </TouchableOpacity>
        {hasError && (
          <Text style={[styles.errorText, { color: '#FF6B6B' }]}>
            {hasError}
          </Text>
        )}
      </View>
    );
  };

  const renderDocumentUploadSection = () => (
    <View style={[styles.section, { backgroundColor: colors.card }]}>
      <View style={styles.sectionHeader}>
        <Ionicons name="document-outline" size={24} color={colors.primary} />
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Document Verification
        </Text>
      </View>

      {personalInfo.document_type && (
        <View style={[styles.infoCard, { backgroundColor: colors.background }]}>
          <Ionicons name="information-circle" size={20} color={colors.primary} />
          <Text style={[styles.infoText, { color: colors.text }]}>
            {personalInfo.document_type === 'passport'
              ? 'For passport verification, only the main page is required.'
              : 'Please upload both front and back of your ID document for verification.'
            }
          </Text>
        </View>
      )}

      {renderDocumentUpload(
        `${getDocumentTypeLabel()} (Front)`,
        'front',
        documentFront
      )}

      {requiresBackDocument() && renderDocumentUpload(
        `${getDocumentTypeLabel()} (Back)`,
        'back',
        documentBack
      )}

      {renderDocumentUpload(
        'Selfie Verification',
        'selfie',
        selfieImage
      )}

      <View style={[styles.tipCard, { backgroundColor: `${colors.primary}15` }]}>
        <Ionicons name="bulb-outline" size={20} color={colors.primary} />
        <View style={styles.tipContent}>
          <Text style={[styles.tipTitle, { color: colors.primary }]}>Tips for better photos:</Text>
          <Text style={[styles.tipText, { color: colors.text }]}>
            • Ensure good lighting and clear image quality{'\n'}
            • Make sure all text is readable{'\n'}
            • Avoid glare or shadows{'\n'}
            • For selfie: look directly at camera with neutral expression
          </Text>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.safeAreaContainer, { paddingTop: insets.top }]}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.text }]}>
              Loading KYC form...
            </Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      
      <View style={[styles.safeAreaContainer, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: colors.card }]}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={20} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.kycHeaderSection}>
            <Text style={[styles.kycTitle, { color: colors.text }]}>KYC Verification</Text>
            <Text style={[styles.kycSubtitle, { color: colors.textSecondary }]}>
              Complete your identity verification
            </Text>
          </View>
          <View style={styles.placeholder} />
        </View>
        
        <ScrollView 
          style={styles.scrollContainer} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={loadExistingData}
              colors={[colors.primary]}
            />
          }
          keyboardShouldPersistTaps="handled"
        >
          {/* Show rejection feedback if KYC was rejected */}
          {kycStatus?.verification_status === 'rejected' && (
            <AdminFeedback
              kycStatus={kycStatus}
              onResubmit={() => {
                // Clear rejection status to allow resubmission
                setKycStatus((prev: any) => ({ ...prev, verification_status: 'not_submitted' }));
              }}
              onBackToSteps={() => {
                // Allow user to go back and edit
                setKycStatus((prev: any) => ({ ...prev, verification_status: 'not_submitted' }));
              }}
              isSubmitting={submitting}
            />
          )}

          {/* Show under review message if KYC is pending/submitted */}
          {(kycStatus?.verification_status === 'pending' || kycStatus?.verification_status === 'submitted') && (
            <View style={[styles.reviewCard, { 
              backgroundColor: colors.card, 
              borderColor: colors.warning || colors.primary,
              shadowColor: colors.shadow
            }]}>
              <View style={styles.reviewHeader}>
                <View style={styles.reviewHeaderIcon}>
                  <Ionicons name="time-outline" size={24} color={colors.warning || colors.primary} />
                </View>
                <View style={styles.reviewHeaderText}>
                  <Text style={[styles.reviewTitle, { color: colors.warning || colors.primary }]}>
                    Under Review
                  </Text>
                  <Text style={[styles.reviewSubtitle, { color: colors.textSecondary || colors.text }]}>
                    Your verification is being processed
                  </Text>
                </View>
              </View>

              <View style={styles.reviewBody}>
                <Text style={[styles.reviewDescription, { color: colors.text }]}>
                  Thank you for submitting your KYC verification! Our team is currently reviewing your documents and information.
                </Text>

                <View style={styles.reviewStatus}>
                  <View style={styles.statusItem}>
                    <Ionicons name="checkmark-circle" size={20} color={colors.success || '#4CAF50'} />
                    <Text style={[styles.statusText, { color: colors.text }]}>Documents received</Text>
                  </View>
                  <View style={styles.statusItem}>
                    <Ionicons name="time" size={20} color={colors.warning || colors.primary} />
                    <Text style={[styles.statusText, { color: colors.text }]}>Under review</Text>
                  </View>
                  <View style={styles.statusItem}>
                    <Ionicons name="ellipse-outline" size={20} color={colors.disabled || colors.border} />
                    <Text style={[styles.statusText, { color: colors.textSecondary || colors.text }]}>Pending completion</Text>
                  </View>
                </View>

                <View style={styles.reviewTimeline}>
                  <Text style={[styles.timelineTitle, { color: colors.text }]}>
                    Expected Timeline:
                  </Text>
                  <Text style={[styles.timelineText, { color: colors.text }]}>
                    • Basic verification: 1-2 hours
                  </Text>
                  <Text style={[styles.timelineText, { color: colors.text }]}>
                    • Advanced verification: 1-3 business days
                  </Text>
                </View>

                {kycStatus?.submitted_at && (
                  <View style={[styles.submissionInfo, { borderTopColor: colors.border }]}>
                    <Text style={[styles.submissionLabel, { color: colors.textSecondary || colors.text }]}>
                      Submitted on:
                    </Text>
                    <Text style={[styles.submissionDate, { color: colors.text }]}>
                      {new Date(kycStatus.submitted_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.reviewActions}>
                <TouchableOpacity
                  style={[styles.contactButton, { 
                    borderColor: colors.border,
                    backgroundColor: colors.surface || colors.background
                  }]}
                  onPress={() => {
                    Alert.alert(
                      'Contact Support',
                      'Need help with your KYC verification? Contact our support team via WhatsApp.',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Open WhatsApp', onPress: openWhatsApp }
                      ]
                    );
                  }}
                >
                  <Ionicons name="headset-outline" size={16} color={colors.text} />
                  <Text style={[styles.contactButtonText, { color: colors.text }]}>
                    Contact Support
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
                    )}

          {/* Show verified success message if KYC is approved */}
          {kycStatus?.verification_status === 'approved' && (
            <View style={[styles.verifiedCard, { 
              backgroundColor: colors.card, 
              borderColor: colors.success,
              shadowColor: colors.shadow
            }]}>
              <View style={styles.verifiedHeader}>
                <View style={styles.verifiedHeaderIcon}>
                  <Ionicons name="checkmark-circle" size={32} color={colors.success} />
                </View>
                <View style={styles.verifiedHeaderText}>
                  <Text style={[styles.verifiedTitle, { color: colors.success }]}>
                    Verification Complete! ✅
                  </Text>
                  <Text style={[styles.verifiedSubtitle, { color: colors.textSecondary || colors.text }]}>
                    Your account is fully verified
                  </Text>
                </View>
              </View>

              <View style={styles.verifiedBody}>
                <Text style={[styles.verifiedDescription, { color: colors.text }]}>
                  Congratulations! Your KYC verification has been approved. You now have access to all features and unlimited transaction limits.
                </Text>

                <View style={styles.benefitsContainer}>
                  <Text style={[styles.benefitsTitle, { color: colors.text }]}>
                    Your Benefits:
                  </Text>
                  
                  <View style={styles.benefitItem}>
                    <Ionicons name="infinite" size={20} color={colors.success} />
                    <Text style={[styles.benefitText, { color: colors.text }]}>Unlimited deposits</Text>
                  </View>
                  
                  <View style={styles.benefitItem}>
                    <Ionicons name="infinite" size={20} color={colors.success} />
                    <Text style={[styles.benefitText, { color: colors.text }]}>Unlimited withdrawals</Text>
                  </View>
                  
                  <View style={styles.benefitItem}>
                    <Ionicons name="shield-checkmark" size={20} color={colors.success} />
                    <Text style={[styles.benefitText, { color: colors.text }]}>Enhanced security features</Text>
                  </View>
                  
                  <View style={styles.benefitItem}>
                    <Ionicons name="star" size={20} color={colors.success} />
                    <Text style={[styles.benefitText, { color: colors.text }]}>Priority customer support</Text>
                  </View>
                  
                  <View style={styles.benefitItem}>
                    <Ionicons name="trending-up" size={20} color={colors.success} />
                    <Text style={[styles.benefitText, { color: colors.text }]}>Access to premium features</Text>
                  </View>
                </View>

                {kycStatus?.approved_at && (
                  <View style={[styles.approvalInfo, { borderTopColor: colors.border }]}>
                    <Text style={[styles.approvalLabel, { color: colors.textSecondary || colors.text }]}>
                      Verified on:
                    </Text>
                    <Text style={[styles.approvalDate, { color: colors.text }]}>
                      {new Date(kycStatus.approved_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.verifiedActions}>
                <TouchableOpacity
                  style={[styles.exploreButton, { backgroundColor: colors.primary }]}
                  onPress={() => {
                    navigation.goBack();
                  }}
                >
                  <Ionicons name="rocket" size={16} color="white" />
                  <Text style={[styles.exploreButtonText, { color: 'white' }]}>
                    Explore Features
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Only show form if not rejected, not under review, and not verified */}
          {kycStatus?.verification_status !== 'rejected' && 
           kycStatus?.verification_status !== 'pending' && 
           kycStatus?.verification_status !== 'submitted' && 
           kycStatus?.verification_status !== 'approved' && (
            <>
              {renderPersonalInfoSection()}
              {renderDocumentUploadSection()}
              
              {/* Submit Button */}
              <TouchableOpacity
                style={[styles.submitButton, { opacity: submitting ? 0.7 : 1 }]}
                onPress={handleSubmit}
                disabled={submitting}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={submitting 
                    ? [colors.disabled || '#9CA3AF', colors.disabled || '#9CA3AF']
                    : [colors.primary, colors.primary + 'DD']
                  }
                  style={styles.submitButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <>
                      <Ionicons name="shield-checkmark" size={22} color="white" />
                      <Text style={styles.submitButtonText}>Submit KYC Verification</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </>
          )}

        </ScrollView>
      </View>

      {/* Modals */}
      <DocumentTypePickerModal
        visible={showDocumentTypePicker}
        onClose={() => setShowDocumentTypePicker(false)}
        onSelect={(type) => {
          updatePersonalInfo('document_type', type);
          setShowDocumentTypePicker(false);
        }}
        selectedType={personalInfo.document_type}
      />

      <CountryPickerModal
        visible={showCountryPicker}
        onClose={() => setShowCountryPicker(false)}
        onSelect={(country) => {
          // Update both country and nationality with the same value
          updatePersonalInfo('country', country);
          updatePersonalInfo('nationality', country);
          setShowCountryPicker(false);
        }}
        selectedCountry={personalInfo.country}
      />

      <DatePickerModal
        visible={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        onDateChange={handleDateChange}
        dateFields={tempDate}
        onFieldChange={(field, value) => {
          setTempDate(prev => ({ ...prev, [field]: value }));
        }}
        focusedField={focusedDateField}
        onFieldFocus={setFocusedDateField}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  
  safeAreaContainer: {
    flex: 1,
  },
  
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
  },
  
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },

  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  
  kycHeaderSection: {
    alignItems: 'center',
    flex: 1,
  },
  
  kycTitle: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  kycSubtitle: {
    fontSize: 15,
    marginTop: 4,
    opacity: 0.8,
  },

  placeholder: {
    width: 40,
  },
  
  scrollContainer: {
    flex: 1,
  },

  section: {
    margin: 20,
    marginTop: 0,
    padding: 24,
    borderRadius: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginLeft: 16,
    letterSpacing: 0.4,
  },

  inputGroup: {
    marginBottom: 20,
  },

  inputLabel: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 12,
    letterSpacing: 0.3,
  },

  textInput: {
    borderRadius: 16,
    padding: 18,
    fontSize: 16,
    borderWidth: 1,
    fontWeight: '400',
    minHeight: 56,
  },

  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    minHeight: 56,
  },

  pickerText: {
    fontSize: 16,
    fontWeight: '400',
  },

  dateInputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },

  dateField: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 16,
    padding: 18,
    marginHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },

  datePreview: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
  },

  errorText: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  halfWidth: {
    width: '48%',
  },

  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.1)',
    backgroundColor: 'rgba(59, 130, 246, 0.02)',
  },

  infoText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    lineHeight: 20,
  },

  documentUpload: {
    marginBottom: 24,
  },

  documentLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
    letterSpacing: 0.3,
  },

  uploadButton: {
    height: 160,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    backgroundColor: 'rgba(0, 0, 0, 0.01)',
  },

  uploadText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '500',
  },

  uploadedContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },

  uploadedImage: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
    resizeMode: 'cover',
  },

  uploadedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },

  uploadedText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
  },

  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 20,
    borderRadius: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.1)',
    backgroundColor: 'rgba(34, 197, 94, 0.02)',
  },

  tipContent: {
    flex: 1,
    marginLeft: 12,
  },

  tipTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },

  tipText: {
    fontSize: 13,
    lineHeight: 18,
  },

  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    padding: 20,
    margin: 20,
    marginTop: 0,
    minHeight: 60,
  },

  submitButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    padding: 20,
    minHeight: 60,
  },

  submitButtonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '700',
    marginLeft: 10,
    letterSpacing: 0.4,
  },
  
  // Review Card Styles
  reviewCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    margin: 20,
    backgroundColor: 'rgba(245, 158, 11, 0.02)',
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  reviewHeaderIcon: {
    marginRight: 12,
  },
  reviewHeaderText: {
    flex: 1,
  },
  reviewTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  reviewSubtitle: {
    fontSize: 14,
    opacity: 0.7,
  },
  reviewBody: {
    marginBottom: 16,
  },
  reviewDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  reviewStatus: {
    marginBottom: 16,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusText: {
    fontSize: 14,
    marginLeft: 8,
  },
  reviewTimeline: {
    marginBottom: 16,
  },
  timelineTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  timelineText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  submissionInfo: {
    borderTopWidth: 1,
    paddingTop: 12,
    marginTop: 12,
  },
  submissionLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  submissionDate: {
    fontSize: 14,
    fontWeight: '500',
  },
  reviewActions: {
    marginTop: 16,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    minHeight: 50,
  },
  contactButtonText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  
  // Verified Card Styles
  verifiedCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    margin: 20,
    backgroundColor: 'rgba(34, 197, 94, 0.02)',
  },
  verifiedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  verifiedHeaderIcon: {
    marginRight: 12,
  },
  verifiedHeaderText: {
    flex: 1,
  },
  verifiedTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  verifiedSubtitle: {
    fontSize: 14,
    opacity: 0.7,
  },
  verifiedBody: {
    marginBottom: 16,
  },
  verifiedDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  benefitsContainer: {
    marginBottom: 16,
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  benefitText: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  approvalInfo: {
    borderTopWidth: 1,
    paddingTop: 12,
    marginTop: 12,
  },
  approvalLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  approvalDate: {
    fontSize: 14,
    fontWeight: '500',
  },
  verifiedActions: {
    marginTop: 16,
  },
  exploreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    padding: 20,
    minHeight: 60,
  },
  exploreButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default UnifiedKycScreen; 