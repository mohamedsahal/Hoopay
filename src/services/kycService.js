import api from './api';
import { ENDPOINTS } from '../config/apiConfig';

class KycService {
  constructor() {
    // Debug logging to check ENDPOINTS availability
    console.log('KycService constructor - ENDPOINTS:', ENDPOINTS);
    console.log('KycService constructor - ENDPOINTS.KYC:', ENDPOINTS?.KYC);
    
    // Fallback endpoints in case of import issues
    this.fallbackEndpoints = {
      STATUS: '/mobile/kyc/status',
      SUBMIT_PERSONAL_INFO: '/mobile/kyc/personal-info',
      UPLOAD_DOCUMENT: '/mobile/kyc/upload-document',
      SUBMIT_FOR_REVIEW: '/mobile/kyc/submit-for-review',
      VERIFICATION_LIMITS: '/mobile/kyc/verification-limits',
      CHECK_TRANSACTION_LIMIT: '/mobile/kyc/check-transaction-limit'
    };
  }

  /**
   * Get the correct endpoint URL with fallback
   */
  getEndpoint(endpointKey) {
    const endpoint = ENDPOINTS?.KYC?.[endpointKey] || this.fallbackEndpoints[endpointKey];
    console.log(`Getting endpoint for ${endpointKey}:`, endpoint);
    return endpoint;
  }

  /**
   * Get KYC verification status
   */
  async getKycStatus() {
    try {
      const endpoint = this.getEndpoint('STATUS');
      if (!endpoint) {
        throw new Error('KYC STATUS endpoint not found');
      }
      
      const response = await api.get(endpoint);
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Error getting KYC status:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to get KYC status'
      };
    }
  }

  /**
   * Submit personal information for KYC verification
   */
  async submitPersonalInfo(personalInfo) {
    try {
      const endpoint = this.getEndpoint('SUBMIT_PERSONAL_INFO');
      if (!endpoint) {
        throw new Error('KYC SUBMIT_PERSONAL_INFO endpoint not found');
      }
      
      const response = await api.post(endpoint, personalInfo);
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Error submitting personal info:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to submit personal information',
        errors: error.response?.data?.errors || {}
      };
    }
  }

  /**
   * Test simple POST request (no files)
   */
  async testSimple() {
    try {
      console.log('🧪 Testing simple POST request...');
      const response = await api.post('/mobile/simple-test', { test: 'data' }, {
        timeout: 15000,
      });

      console.log('🧪 Simple test response:', response.data);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('🧪 Simple test failed:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Simple test failed'
      };
    }
  }

  /**
   * Test file upload without authentication
   */
  async testUpload(formData) {
    try {
      console.log('🧪 Testing simple upload...');
      const response = await api.post('/mobile/test-upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000,
      });

      console.log('🧪 Test upload response:', response.data);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('🧪 Test upload failed:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Test upload failed'
      };
    }
  }

  /**
   * Upload KYC document using base64 encoding (for ngrok compatibility)
   */
  async uploadDocumentBase64(asset, documentType) {
    try {
      console.log('🔄 KYC Service: Starting base64 document upload...');
      
      console.log('📡 KYC Service: Converting asset to base64...');
      
      // Convert asset to base64
      let fileData;
      let fileName;
      let mimeType;

      if (asset.uri) {
        // For React Native
        const response = await fetch(asset.uri);
        const blob = await response.blob();
        fileData = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64data = reader.result.split(',')[1]; // Remove data:image/jpeg;base64, prefix
            resolve(base64data);
          };
          reader.readAsDataURL(blob);
        });
        
        fileName = asset.fileName || `document_${Date.now()}.jpg`;
        mimeType = asset.type || 'image/jpeg';
      } else {
        throw new Error('Invalid asset format');
      }

      console.log('📤 KYC Service: Uploading base64 data...', {
        documentType,
        fileName,
        mimeType,
        dataSize: fileData ? `${Math.round(fileData.length / 1024)}KB` : 'unknown'
      });

      const requestData = {
        document_type: documentType,
        file_data: fileData,
        file_name: fileName,
        mime_type: mimeType
      };

      const response = await api.post('/mobile/kyc/upload-base64', requestData, {
        timeout: 60000,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ KYC Service: Base64 upload successful!', {
        status: response.status,
        statusText: response.statusText
      });

      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('❌ KYC Service: Base64 upload failed!');
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        name: error.name
      });
      
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to upload document',
        errors: error.response?.data?.errors || {}
      };
    }
  }

  /**
   * Upload KYC document (original FormData method)
   */
  async uploadDocument(formData) {
    try {
      console.log('🔄 KYC Service: Starting document upload...');
      
      const endpoint = this.getEndpoint('UPLOAD_DOCUMENT');
      if (!endpoint) {
        console.error('❌ KYC Service: UPLOAD_DOCUMENT endpoint not found');
        throw new Error('KYC UPLOAD_DOCUMENT endpoint not found');
      }

      console.log('📡 KYC Service: Uploading to endpoint:', endpoint);
      console.log('📦 KYC Service: FormData details:', {
        hasFormData: !!formData,
        formDataType: typeof formData,
        isFormData: formData instanceof FormData,
        formDataParts: formData._parts ? formData._parts.length : 'unknown'
      });

      // Log FormData contents safely
      if (formData._parts) {
        console.log('📄 KYC Service: FormData contents:');
        formData._parts.forEach((part, index) => {
          console.log(`  Part ${index}:`, {
            name: part[0],
            type: typeof part[1],
            hasUri: part[1]?.uri ? true : false,
            hasType: part[1]?.type ? true : false,
            hasName: part[1]?.name ? true : false,
            size: part[1]?.size || 'unknown'
          });
        });
      }

      console.log('🚀 KYC Service: Making API request...');
      
      // Test server connectivity first for uploads
      try {
        console.log('🔍 Testing server connectivity...');
        await api.get('/mobile/kyc/status', { timeout: 5000 });
        console.log('✅ Server is reachable');
      } catch (connectError) {
        console.log('⚠️ Server connectivity issue:', connectError.message);
      }
      
      // Use the same exact pattern as the working community post uploads
      const response = await api.post(endpoint, formData, {
        timeout: 60000, // Match community upload timeout (60s)
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        // CRITICAL: Do NOT set Content-Type manually for FormData 
        // Let axios automatically set it with proper boundary parameter
      });

      console.log('✅ KYC Service: Upload successful!', {
        status: response.status,
        statusText: response.statusText,
        dataKeys: Object.keys(response.data || {})
      });

      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('❌ KYC Service: Upload failed!');
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        name: error.name,
        stack: error.stack?.split('\n').slice(0, 3).join('\n') // First 3 lines of stack
      });
      
      if (error.response) {
        console.error('Response error details:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          headers: error.response.headers
        });
      } else if (error.request) {
        console.error('Request error details:', {
          request: 'Request was made but no response received',
          timeout: error.config?.timeout,
          url: error.config?.url,
          method: error.config?.method
        });
      }
      
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to upload document',
        errors: error.response?.data?.errors || {}
      };
    }
  }

  /**
   * Submit KYC verification for review
   */
  async submitForReview() {
    try {
      const endpoint = this.getEndpoint('SUBMIT_FOR_REVIEW');
      if (!endpoint) {
        throw new Error('KYC SUBMIT_FOR_REVIEW endpoint not found');
      }
      
      const response = await api.post(endpoint);
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Error submitting for review:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to submit for review',
        missingDocuments: error.response?.data?.missing_documents || []
      };
    }
  }

  /**
   * Submit KYC upgrade to higher verification level
   */
  async submitUpgrade(upgradeData) {
    try {
      const endpoint = '/mobile/kyc/submit-upgrade';
      const response = await api.post(endpoint, upgradeData);
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Error submitting upgrade:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to submit upgrade'
      };
    }
  }

  /**
   * Get verification limits for a specific level
   */
  async getVerificationLimits(level = 'basic') {
    try {
      const endpoint = this.getEndpoint('VERIFICATION_LIMITS');
      if (!endpoint) {
        throw new Error('KYC VERIFICATION_LIMITS endpoint not found');
      }
      
      const response = await api.get(`${endpoint}?level=${level}`);
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Error getting verification limits:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to get verification limits'
      };
    }
  }

  /**
   * Check if user can perform a transaction
   */
  async checkTransactionLimit(amount, type = 'transaction') {
    try {
      const endpoint = this.getEndpoint('CHECK_TRANSACTION_LIMIT');
      if (!endpoint) {
        throw new Error('KYC CHECK_TRANSACTION_LIMIT endpoint not found');
      }
      
      const response = await api.post(endpoint, {
        amount,
        type
      });
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Error checking transaction limit:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to check transaction limit',
        canProceed: false,
        requiredAction: error.response?.data?.required_action || 'complete_kyc'
      };
    }
  }

  /**
   * Get KYC verification levels and their benefits
   */
  getVerificationLevels() {
    return [
      {
        level: 'basic',
        name: 'Basic Verification',
        limits: {
          withdrawal_limit: 10000.00,
          deposit_limit: 20000.00,
          transaction_limit: 10000.00,
        },
        requiredDocuments: [
          { type: 'front_document', name: 'Government ID (Front)', required: true },
          { type: 'selfie', name: 'Selfie with ID', required: true },
        ],
        benefits: [
          'Basic account access',
          'Limited transaction amounts',
          'Email support'
        ],
        estimatedTime: '1-2 hours'
      },
      {
        level: 'intermediate',
        name: 'Intermediate Verification',
        limits: {
          withdrawal_limit: 20000.00,
          deposit_limit: 50000.00,
          transaction_limit: 20000.00,
        },
        requiredDocuments: [
          { type: 'front_document', name: 'Government ID (Front)', required: true },
          { type: 'selfie', name: 'Selfie with ID', required: true },
          { type: 'proof_of_address', name: 'Proof of Address', required: true },
        ],
        benefits: [
          'Increased transaction limits',
          'Priority support',
          'Access to premium features',
          'Reduced fees'
        ],
        estimatedTime: '1-3 business days'
      },
      {
        level: 'advanced',
        name: 'Advanced Verification',
        limits: {
          withdrawal_limit: -1, // Unlimited
          deposit_limit: -1,    // Unlimited
          transaction_limit: -1, // Unlimited
        },
        requiredDocuments: [
          { type: 'front_document', name: 'Government ID (Front)', required: true },
          { type: 'back_document', name: 'Government ID (Back)', required: true },
          { type: 'selfie', name: 'Selfie with ID', required: true },
          { type: 'proof_of_address', name: 'Proof of Address', required: true },
          { type: 'bank_statement', name: 'Bank Statement', required: true },
          { type: 'source_of_funds', name: 'Source of Funds', required: true },
        ],
        benefits: [
          'Unlimited transaction limits',
          'VIP support',
          'All premium features',
          'Lowest fees',
          'Priority processing'
        ],
        estimatedTime: '3-5 business days'
      }
    ];
  }

  /**
   * Get required documents for a verification level, considering document type
   */
  getRequiredDocumentsForLevel(level, documentType = null) {
    const baseDocuments = this.getVerificationLevels().find(l => l.level === level)?.requiredDocuments || [];
    
    // For basic level, only add back document if user selected card-type documents
    if (level === 'basic' && documentType) {
      const needsBackDocument = ['national_id', 'driver_license'].includes(documentType);
      
      if (needsBackDocument) {
        // Add back document requirement for card types
        const hasBackDoc = baseDocuments.some(doc => doc.type === 'back_document');
        if (!hasBackDoc) {
          return [
            ...baseDocuments,
            { type: 'back_document', name: 'Government ID (Back)', required: true }
          ];
        }
      }
      // For passport, don't add back document
      return baseDocuments.filter(doc => doc.type !== 'back_document');
    }
    
    return baseDocuments;
  }

  /**
   * Get document types and their descriptions
   */
  getDocumentTypes() {
    return {
      front_document: {
        name: 'Government ID (Front)',
        description: 'Front side of your government-issued ID (passport, driver\'s license, or national ID)',
        acceptedFormats: ['JPEG', 'PNG', 'PDF'],
        maxSize: '10MB',
        tips: [
          'Ensure all text is clearly visible',
          'Take photo in good lighting',
          'Avoid glare and shadows',
          'Make sure all corners are visible'
        ]
      },
      back_document: {
        name: 'Government ID (Back)',
        description: 'Back side of your government-issued ID (if applicable)',
        acceptedFormats: ['JPEG', 'PNG', 'PDF'],
        maxSize: '10MB',
        tips: [
          'Ensure all text is clearly visible',
          'Take photo in good lighting',
          'Avoid glare and shadows',
          'Make sure all corners are visible'
        ]
      },
      selfie: {
        name: 'Selfie with ID',
        description: 'A clear selfie of you holding your government ID next to your face',
        acceptedFormats: ['JPEG', 'PNG'],
        maxSize: '10MB',
        tips: [
          'Hold ID clearly visible next to your face',
          'Ensure good lighting on both face and ID',
          'Look directly at camera',
          'Remove sunglasses and hats',
          'Make sure both your face and ID are in focus'
        ]
      },
      proof_of_address: {
        name: 'Proof of Address',
        description: 'Recent utility bill, bank statement, or official document showing your address',
        acceptedFormats: ['JPEG', 'PNG', 'PDF'],
        maxSize: '10MB',
        tips: [
          'Document must be dated within last 3 months',
          'Address must match the one provided',
          'Ensure all text is clearly readable',
          'Full document must be visible'
        ]
      },
      bank_statement: {
        name: 'Bank Statement',
        description: 'Recent bank statement showing your financial activity',
        acceptedFormats: ['JPEG', 'PNG', 'PDF'],
        maxSize: '10MB',
        tips: [
          'Statement must be dated within last 3 months',
          'Ensure all text is clearly readable',
          'You may redact sensitive transaction details',
          'Keep account holder name and address visible'
        ]
      },
      source_of_funds: {
        name: 'Source of Funds',
        description: 'Documentation proving the source of your funds (salary slip, business registration, etc.)',
        acceptedFormats: ['JPEG', 'PNG', 'PDF'],
        maxSize: '10MB',
        tips: [
          'Provide recent documentation',
          'Ensure all text is clearly readable',
          'Document should clearly show income source',
          'Multiple documents may be required'
        ]
      }
    };
  }

  /**
   * Validate personal information before submission
   */
  validatePersonalInfo(personalInfo) {
    const errors = {};

    if (!personalInfo.full_name || personalInfo.full_name.trim().length < 2) {
      errors.full_name = 'Full name is required and must be at least 2 characters';
    }

    if (!personalInfo.document_type || !['passport', 'national_id', 'driver_license'].includes(personalInfo.document_type)) {
      errors.document_type = 'Valid document type is required';
    }

    if (!personalInfo.document_number || personalInfo.document_number.trim().length < 3) {
      errors.document_number = 'Document number is required and must be at least 3 characters';
    }

    if (!personalInfo.date_of_birth) {
      errors.date_of_birth = 'Date of birth is required';
    } else {
      const birthDate = new Date(personalInfo.date_of_birth);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      if (age < 18) {
        errors.date_of_birth = 'You must be at least 18 years old';
      }
    }

    if (!personalInfo.nationality || personalInfo.nationality.trim().length < 2) {
      errors.nationality = 'Nationality is required';
    }

    if (!personalInfo.address || personalInfo.address.trim().length < 10) {
      errors.address = 'Address is required and must be at least 10 characters';
    }

    if (!personalInfo.city || personalInfo.city.trim().length < 2) {
      errors.city = 'City is required';
    }

    if (!personalInfo.postal_code || personalInfo.postal_code.trim().length < 3) {
      errors.postal_code = 'Postal code is required';
    }

    if (!personalInfo.country || personalInfo.country.trim().length < 2) {
      errors.country = 'Country is required';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  /**
   * Format currency amount
   */
  formatCurrency(amount, currency = 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  /**
   * Get status color for UI
   */
  getStatusColor(status) {
    switch (status) {
      case 'approved':
      case 'verified':
        return '#10B981'; // Green
      case 'pending':
        return '#F59E0B'; // Yellow
      case 'rejected':
        return '#EF4444'; // Red
      case 'not_submitted':
      default:
        return '#6B7280'; // Gray
    }
  }

  /**
   * Get status text for display
   */
  getStatusText(status) {
    switch (status) {
      case 'approved':
        return 'Approved';
      case 'verified':
        return 'Verified';
      case 'pending':
        return 'Under Review';
      case 'rejected':
        return 'Rejected';
      case 'not_submitted':
        return 'Not Submitted';
      case 'unverified':
        return null; // Don't display text for unverified
      default:
        return null;
    }
  }

  /**
   * Get user verification level from user object or KYC status
   */
  getUserVerificationLevel(user, kycStatus = null) {
    // Check KYC status first
    if (kycStatus && kycStatus.verification_status === 'approved') {
      return kycStatus.verification_level || 'basic';
    }
    
    // Check user object for verification info
    if (user && user.kycVerification && user.kycVerification.status === 'approved') {
      return user.kycVerification.verification_level || 'basic';
    }
    
    // Check if user has legacy is_verified flag
    if (user && user.is_verified) {
      return 'basic'; // Default to basic for legacy verified users
    }
    
    return null; // User is not verified
  }

  /**
   * Get user verification status
   */
  getUserVerificationStatus(user, kycStatus = null) {
    // Check KYC status first
    if (kycStatus) {
      return kycStatus.verification_status || 'unverified';
    }
    
    // Check user object for verification info
    if (user && user.kycVerification) {
      return user.kycVerification.status || 'unverified';
    }
    
    // Check if user has legacy is_verified flag
    if (user && user.is_verified) {
      return 'approved';
    }
    
    return 'unverified';
  }

  /**
   * Check if user should be prompted for KYC verification
   */
  shouldPromptKycVerification(user, kycStatus = null) {
    const status = this.getUserVerificationStatus(user, kycStatus);
    return status === 'unverified' || status === 'rejected';
  }

  /**
   * Check if user should be prompted to upgrade verification
   */
  shouldPromptUpgrade(user, kycStatus = null) {
    const status = this.getUserVerificationStatus(user, kycStatus);
    const level = this.getUserVerificationLevel(user, kycStatus);
    
    return status === 'approved' && ['basic', 'intermediate'].includes(level);
  }

  /**
   * Check if user's name can be edited (only if not KYC verified)
   */
  isNameEditable(user, kycStatus = null) {
    const verificationStatus = this.getUserVerificationStatus(user, kycStatus);
    return verificationStatus !== 'approved';
  }

  /**
   * Sync user profile with KYC data (called when verification is approved)
   */
  async syncUserProfileWithKyc() {
    try {
      // This will be called by a webhook or polling mechanism
      // when KYC status changes to approved
      const kycResponse = await this.getKycStatus();
      
      if (kycResponse.success && kycResponse.data.verification_status === 'approved') {
        // If KYC is approved, trigger profile refresh
        return {
          success: true,
          shouldUpdateProfile: true,
          kycData: kycResponse.data
        };
      }
      
      return {
        success: true,
        shouldUpdateProfile: false
      };
    } catch (error) {
      console.error('Error syncing user profile with KYC:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Poll KYC status for real-time updates
   */
  startKycStatusPolling(callback, interval = 30000) {
    const pollInterval = setInterval(async () => {
      try {
        const previousStatus = this.lastKnownStatus;
        const response = await this.getKycStatus();
        
        if (response.success) {
          const currentStatus = response.data.verification_status;
          
          // Check if status changed from pending to approved
          if (previousStatus === 'pending' && currentStatus === 'approved') {
            callback({
              statusChanged: true,
              newStatus: currentStatus,
              data: response.data
            });
          }
          
          this.lastKnownStatus = currentStatus;
        }
      } catch (error) {
        console.error('Error polling KYC status:', error);
      }
    }, interval);
    
    return pollInterval;
  }

  /**
   * Stop KYC status polling
   */
  stopKycStatusPolling(intervalId) {
    if (intervalId) {
      clearInterval(intervalId);
    }
  }
}

export default new KycService(); 