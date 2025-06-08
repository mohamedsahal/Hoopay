# Hoopay API Documentation (Actual Routes)

Based on the Laravel routes files in the codebase, here is the actual API structure:

## Base URLs

- **Local Development**: `http://localhost:8000/api`
- **Production**: `https://hoopaywallet.com/api`

## Authentication

The API uses multiple authentication methods:
1. **Laravel API Authentication** (`auth:api` middleware)
2. **Supabase Authentication** (`supabase.auth` middleware) - *Note: supabase_id column dependency has been removed*
3. **Firebase Authentication** (for mobile apps)

## API Endpoints

### Public Endpoints (No Authentication Required)

#### Test Endpoint
```
GET /api/test
```
Returns a simple test message to verify API connectivity.

**Response:**
```json
{
  "message": "API test route is working!",
  "timestamp": "2025-01-24T19:50:28.799215Z"
}
```

#### Save User
```
POST /api/save-user
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "role": "user"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User saved successfully.",
  "data": {
    "user": {
      "id": 5,
      "name": "John Doe",
      "email": "john@example.com",
      "is_admin": false,
      "created_at": "2025-01-24T20:15:44.000000Z",
      "updated_at": "2025-01-24T20:15:44.000000Z"
    }
  }
}
```

#### Get User
```
GET /api/get-user/{id}
```

**Parameters:**
- `id` (integer) - The user ID

**Response (Success):**
```json
{
  "success": true,
  "message": "User retrieved successfully.",
  "data": {
    "user": {
      "id": 5,
      "name": "John Doe",
      "email": "john@example.com",
      "profile": {
        "id": 1,
        "user_id": 5,
        "bio": null,
        "avatar": null
      }
    }
  }
}
```

**Response (User Not Found):**
```json
{
  "success": false,
  "message": "User not found."
}
```

### Authentication Endpoints

#### Standard Auth
```
POST /api/auth/login
POST /api/auth/register
POST /api/auth/reset-password
```

*Note: These endpoints currently require email verification to be completed before login.*

#### Email Verification (⚠️ MISSING - Need Implementation)
```
POST /api/auth/verify-email
POST /api/auth/resend-verification
GET  /api/auth/verification-status
```

*Note: These endpoints are required for the authentication flow but are currently missing from the API routes. They exist in web routes but need to be implemented for the API.*

#### Firebase Auth
```
POST /api/firebase-login
POST /api/firebase-login-basic
```

*Note: Firebase endpoints require Firebase service account credentials to be configured.*

### V1 API Endpoints

#### Authentication (V1)
```
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/password/reset
POST /api/v1/auth/logout (requires auth)
GET  /api/v1/auth/user (requires auth)
```

#### Profile Management (V1)
```
GET  /api/v1/profile (requires auth)
PUT  /api/v1/profile (requires auth)
```

#### Wallet Management (V1)
```
GET  /api/v1/wallets (requires auth)
GET  /api/v1/wallets/{id} (requires auth)
POST /api/v1/wallets (requires auth)
```

#### Transactions (V1)
```
GET  /api/v1/transactions (requires auth)
GET  /api/v1/transactions/{id} (requires auth)
POST /api/v1/transactions/transfer (requires auth)
```

#### Referrals (V1)
```
GET  /api/v1/referrals (requires auth)
GET  /api/v1/referrals/history (requires auth)
POST /api/v1/referrals/apply (requires auth)
```

### Supabase Auth Protected Endpoints

#### User Dashboard
```
GET /api/dashboard
GET /api/dashboard/stats
GET /api/dashboard/recent-transactions
```

#### User Management
```
GET /api/user
PUT /api/user/profile
POST /api/user/change-password
DELETE /api/user/avatar
POST /api/user/upload-avatar
```

#### Notifications
```
GET  /api/notifications
POST /api/notifications/{id}/mark-as-read
POST /api/notifications/mark-all-read
PUT  /api/notifications/preferences
```

#### Accounts & Wallets
```
GET  /api/accounts
POST /api/accounts
GET  /api/accounts/{id}
PUT  /api/accounts/{id}/status
GET  /api/accounts/{id}/balance
GET  /api/accounts/{id}/transactions
```

#### Transactions
```
GET  /api/transactions
POST /api/transactions
GET  /api/transactions/{id}
POST /api/transactions/{id}/cancel
GET  /api/transactions/account/{accountId}
GET  /api/transactions/history
GET  /api/transactions/statistics
```

#### Deposits
```
GET  /api/deposits
POST /api/deposits
GET  /api/deposits/{id}
GET  /api/deposits/methods
POST /api/deposits/calculate-fee
POST /api/deposits/{id}/confirm
POST /api/deposits/{id}/cancel
GET  /api/deposits/history
```

#### Withdrawals
```
GET  /api/withdrawals
POST /api/withdrawals
GET  /api/withdrawals/{id}
PUT  /api/withdrawals/{id}/status
POST /api/withdrawals/{id}/cancel
GET  /api/withdrawals/methods
POST /api/withdrawals/calculate-fee
GET  /api/withdrawals/limits
GET  /api/withdrawals/history
```

#### Transfers
```
GET  /api/transfers
POST /api/transfers
GET  /api/transfers/{id}
POST /api/transfers/{id}/cancel
POST /api/transfers/internal
POST /api/transfers/external
POST /api/transfers/calculate-fee
GET  /api/transfers/history
GET  /api/transfers/contacts
POST /api/transfers/contacts
```

#### KYC Verification
```
GET  /api/kyc/status
POST /api/kyc/submit
GET  /api/kyc/requirements
POST /api/kyc/upload-document
GET  /api/kyc/documents
DELETE /api/kyc/documents/{id}
PUT  /api/kyc/personal-info
GET  /api/kyc/verification-steps
```

#### Community/Discussion
```
GET  /api/community/posts
POST /api/community/posts
GET  /api/community/posts/{id}
PUT  /api/community/posts/{id}
DELETE /api/community/posts/{id}
POST /api/community/posts/{id}/like
POST /api/community/posts/{id}/comment
GET  /api/community/posts/{id}/comments
GET  /api/community/categories
GET  /api/community/trending
POST /api/community/follow/{userId}
DELETE /api/community/unfollow/{userId}
GET  /api/community/followers
GET  /api/community/following
```

#### Profile Management
```
GET    /api/profile
PUT    /api/profile
POST   /api/profile/password
PUT    /api/profile/notifications
DELETE /api/profile/avatar
POST   /api/profile/avatar
GET    /api/profile/security
PUT    /api/profile/security
GET    /api/profile/activity
```

#### Referrals
```
GET  /api/referrals
POST /api/referrals/opt-in
POST /api/referrals/opt-out
GET  /api/referrals/list
GET  /api/referrals/commissions
POST /api/referrals/apply
POST /api/referrals/check
GET  /api/referrals/stats
GET  /api/referrals/earnings
```

#### Payment Methods
```
GET  /api/payment-methods
POST /api/payment-methods
GET  /api/payment-methods/{id}
PUT  /api/payment-methods/{id}
DELETE /api/payment-methods/{id}
GET  /api/payment-methods/available
```

#### Support & Help
```
GET  /api/support/tickets
POST /api/support/tickets
GET  /api/support/tickets/{id}
POST /api/support/tickets/{id}/messages
GET  /api/support/faq
GET  /api/support/categories
```

## Request/Response Examples

### Dashboard

#### Get Dashboard Stats
```http
GET /api/dashboard/stats
Authorization: Bearer {token}
```

Response:
```json
{
  "success": true,
  "data": {
    "total_balance": 1250.50,
    "total_transactions": 45,
    "pending_withdrawals": 2,
    "kyc_status": "verified",
    "recent_transactions": [
      {
        "id": 123,
        "type": "deposit",
        "amount": 100.00,
        "currency": "USD",
        "status": "completed",
        "created_at": "2025-01-24T10:30:00Z"
      }
    ]
  }
}
```

### Deposits

#### Create Deposit
```http
POST /api/deposits
Authorization: Bearer {token}
Content-Type: application/json

{
  "account_id": 1,
  "amount": 100.00,
  "currency": "USD",
  "payment_method": "bank_transfer",
  "payment_details": {
    "bank_account": "123456789"
  }
}
```

Response:
```json
{
  "success": true,
  "data": {
    "deposit": {
      "id": 456,
      "amount": 100.00,
      "currency": "USD",
      "status": "pending",
      "payment_method": "bank_transfer",
      "reference": "DEP-456-2025",
      "instructions": "Transfer to account: ...",
      "expires_at": "2025-01-25T10:30:00Z",
      "created_at": "2025-01-24T10:30:00Z"
    }
  }
}
```

### Withdrawals

#### Create Withdrawal
```http
POST /api/withdrawals
Authorization: Bearer {token}
Content-Type: application/json

{
  "account_id": 1,
  "amount": 50.00,
  "currency": "USD",
  "withdrawal_method": "bank_transfer",
  "destination": {
    "bank_name": "ABC Bank",
    "account_number": "987654321",
    "account_holder": "John Doe"
  }
}
```

Response:
```json
{
  "success": true,
  "data": {
    "withdrawal": {
      "id": 789,
      "amount": 50.00,
      "fee": 2.50,
      "net_amount": 47.50,
      "currency": "USD",
      "status": "pending_approval",
      "reference": "WTH-789-2025",
      "estimated_completion": "2025-01-26T10:30:00Z",
      "created_at": "2025-01-24T10:30:00Z"
    }
  }
}
```

### Transfers

#### Internal Transfer
```http
POST /api/transfers/internal
Authorization: Bearer {token}
Content-Type: application/json

{
  "from_account": 1,
  "to_account": 2,
  "amount": 25.00,
  "currency": "USD",
  "description": "Payment for services"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "transfer": {
      "id": 101,
      "from_account": 1,
      "to_account": 2,
      "amount": 25.00,
      "currency": "USD",
      "fee": 0.00,
      "status": "completed",
      "reference": "TRF-101-2025",
      "description": "Payment for services",
      "created_at": "2025-01-24T10:30:00Z"
    }
  }
}
```

### KYC Verification

#### Submit KYC Documents
```http
POST /api/kyc/submit
Authorization: Bearer {token}
Content-Type: multipart/form-data

{
  "document_type": "passport",
  "document_front": [file],
  "document_back": [file],
  "selfie": [file],
  "personal_info": {
    "full_name": "John Doe",
    "date_of_birth": "1990-01-01",
    "nationality": "US",
    "address": "123 Main St, City, State"
  }
}
```

Response:
```json
{
  "success": true,
  "data": {
    "kyc_submission": {
      "id": 202,
      "status": "under_review",
      "submitted_at": "2025-01-24T10:30:00Z",
      "estimated_completion": "2025-01-27T10:30:00Z",
      "documents": [
        {
          "type": "passport_front",
          "url": "storage/kyc/doc1.jpg",
          "status": "uploaded"
        }
      ]
    }
  }
}
```

#### Get KYC Status
```http
GET /api/kyc/status
Authorization: Bearer {token}
```

Response:
```json
{
  "success": true,
  "data": {
    "status": "verified",
    "level": "tier_2",
    "verified_at": "2025-01-20T14:22:00Z",
    "limits": {
      "daily_withdrawal": 5000.00,
      "monthly_withdrawal": 50000.00
    },
    "next_review": "2026-01-20T14:22:00Z"
  }
}
```

### Community/Discussion

#### Get Community Posts
```http
GET /api/community/posts?page=1&category=general
Authorization: Bearer {token}
```

Response:
```json
{
  "success": true,
  "data": {
    "posts": [
      {
        "id": 303,
        "title": "Welcome to Hoopay!",
        "content": "Excited to be part of this community...",
        "author": {
          "id": 5,
          "name": "John Doe",
          "avatar": "avatars/john.jpg"
        },
        "category": "general",
        "likes_count": 15,
        "comments_count": 8,
        "is_liked": false,
        "created_at": "2025-01-24T09:15:00Z"
      }
    ],
    "pagination": {
      "current_page": 1,
      "total_pages": 5,
      "total_posts": 50
    }
  }
}
```

#### Create Community Post
```http
POST /api/community/posts
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "My experience with Hoopay",
  "content": "I've been using Hoopay for 6 months now...",
  "category": "general",
  "images": ["base64_image_data"]
}
```

Response:
```json
{
  "success": true,
  "data": {
    "post": {
      "id": 304,
      "title": "My experience with Hoopay",
      "content": "I've been using Hoopay for 6 months now...",
      "category": "general",
      "status": "published",
      "likes_count": 0,
      "comments_count": 0,
      "created_at": "2025-01-24T10:30:00Z"
    }
  }
}
```

### V1 Authentication

#### Register
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "password_confirmation": "password123"
}
```

#### Login
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com"
    }
  }
}
```

### Firebase Authentication

```http
POST /api/firebase-login
Content-Type: application/json

{
  "idToken": "firebase-id-token-here",
  "referral_code": "optional-referral-code"
}
```

### Protected Endpoint Example

```http
GET /api/v1/profile
Authorization: Bearer {token}
```

## Error Responses

The API returns standard HTTP status codes:

- `200 OK` - Request successful
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Authentication required or failed
- `403 Forbidden` - Access denied
- `404 Not Found` - Resource not found
- `422 Unprocessable Entity` - Validation errors
- `500 Internal Server Error` - Server error

Error response format:
```json
{
  "success": false,
  "message": "Error message here",
  "errors": {
    "field": ["Validation error message"]
  }
}
```

## Recent Fixes & Changes

### Database Schema Fix (January 2025)
- **Issue**: API was trying to query non-existent `supabase_id` column
- **Fix**: Updated `AuthController` to use regular `id` column instead
- **Affected Endpoints**: 
  - `GET /api/get-user/{id}` - Now works properly
  - `POST /api/save-user` - No longer requires `supabase_id`

### Current Status

#### ✅ Working Endpoints:
- `GET /api/test` - Basic connectivity test
- `POST /api/save-user` - Save user without supabase_id dependency
- `GET /api/get-user/{id}` - Retrieve user by ID
- `POST /api/v1/auth/register` - User registration (for new emails)

#### 📱 Mobile App Endpoints (Ready for Implementation):
- **Dashboard**: `/api/dashboard/*` - User dashboard and statistics
- **Accounts**: `/api/accounts/*` - Account management and balances
- **Transactions**: `/api/transactions/*` - Transaction history and management
- **Deposits**: `/api/deposits/*` - Deposit functionality with multiple payment methods
- **Withdrawals**: `/api/withdrawals/*` - Withdrawal processing and limits
- **Transfers**: `/api/transfers/*` - Internal and external transfers
- **KYC**: `/api/kyc/*` - Complete KYC verification flow
- **Community**: `/api/community/*` - Discussion posts, likes, comments, following
- **Profile**: `/api/profile/*` - Profile management and security settings
- **Referrals**: `/api/referrals/*` - Referral program with earnings tracking
- **Notifications**: `/api/notifications/*` - Push notifications and preferences
- **Support**: `/api/support/*` - Help desk and FAQ system
- **Payment Methods**: `/api/payment-methods/*` - Payment method management

#### ⚠️ Endpoints Requiring Configuration:
- **Login endpoints** - Require email verification system
- **Firebase endpoints** - Need Firebase service account credentials

#### 🚨 CRITICAL MISSING ENDPOINTS:
- **Email Verification API** - The authentication system requires email verification but the API endpoints for verification are missing:
  - `POST /api/auth/verify-email` - Verify email with 6-digit code
  - `POST /api/auth/resend-verification` - Resend verification email  
  - `GET /api/auth/verification-status` - Check verification status
  
  **Impact**: Users cannot complete registration or login via API until these endpoints are implemented. The functionality exists in web routes but needs to be added to API routes.

## Mobile App Development Guide

### Getting Started
1. **Authentication Flow**: Use Firebase authentication for social logins and V1 API for email/password
2. **Base URL**: Point to `https://hoopaywallet.com/api` for production or `http://localhost:8000/api` for development
3. **Authentication**: Include Bearer token in Authorization header for protected endpoints
4. **Error Handling**: Implement consistent error handling for all API responses

### Core Features Implementation

#### 1. User Onboarding
- Registration via `/api/v1/auth/register`
- Email verification (if enabled)
- KYC submission via `/api/kyc/submit`
- Profile setup via `/api/profile`

#### 2. Dashboard
- Overview stats from `/api/dashboard/stats`
- Recent transactions from `/api/dashboard/recent-transactions`
- Account balances from `/api/accounts/{id}/balance`

#### 3. Financial Operations
- **Deposits**: Use `/api/deposits` endpoints with multiple payment methods
- **Withdrawals**: Implement withdrawal limits and fee calculations
- **Transfers**: Support both internal and external transfers
- **Transaction History**: Paginated transaction lists with filtering

#### 4. KYC Verification
- Document upload with progress tracking
- Real-time status updates
- Tier-based limits based on verification level

#### 5. Community Features
- Social feed with posts, likes, and comments
- User following/followers system
- Content moderation and reporting

#### 6. Security & Settings
- Two-factor authentication
- Notification preferences
- Security settings and activity logs

### API Response Standards
All endpoints follow a consistent response format:
```json
{
  "success": boolean,
  "message": "Response message",
  "data": {}, // Response data
  "errors": {} // Validation errors (if any)
}
```

### Pagination
List endpoints support pagination:
```json
{
  "success": true,
  "data": {
    "items": [],
    "pagination": {
      "current_page": 1,
      "total_pages": 10,
      "total_items": 100,
      "per_page": 10
    }
  }
}
```

## Notes

1. **Mobile App Ready**: The API is now designed to support a complete mobile wallet application with all user portal features from the web version.

2. **Authentication Systems**: Multiple authentication methods are supported:
   - Firebase for social logins (Google, Facebook)
   - V1 API for email/password authentication
   - Session-based authentication for web integration

3. **Feature Parity**: The mobile app can achieve full feature parity with the web version including:
   - Complete wallet functionality (deposits, withdrawals, transfers)
   - KYC verification with document upload
   - Community features with social interactions
   - Referral program with earnings tracking
   - Support system with ticket management

4. **Security First**: All financial operations require authentication and many have additional security measures:
   - KYC verification for higher limits
   - Two-factor authentication options
   - Transaction confirmations and cancellations
   - Activity logging and monitoring

5. **Real-time Features**: Consider implementing:
   - Push notifications for transactions and updates
   - Real-time balance updates
   - Live chat support integration
   - Transaction status notifications

6. **File Uploads**: Several endpoints support file uploads:
   - KYC document submission
   - Profile avatar upload
   - Community post images
   - Support ticket attachments

7. **Development vs Production**: 
   - Use local development server for testing
   - Firebase endpoints require proper credentials
   - Email verification may be disabled in development

8. **API Versioning**: The API supports both V1 and current endpoints for backward compatibility during mobile app development.

## Implementation Priority

### Phase 1 (Core Features)
1. Authentication (registration, login, password reset)
2. Profile management
3. Dashboard with account balances
4. Basic transaction history

### Phase 2 (Financial Operations)
1. Deposit functionality
2. Withdrawal system
3. Internal transfers
4. Payment method management

### Phase 3 (Advanced Features)
1. KYC verification flow
2. Community/discussion features
3. Referral program
4. Support system

### Phase 4 (Enhancements)
1. Advanced security features
2. Notification system
3. Analytics and reporting
4. Social features expansion

## Testing

Use the provided test scripts to verify API functionality:
- `testLocalApi.js` - Comprehensive API testing
- `testDatabaseFix.js` - Specific test for database schema fixes

### Email Verification (Missing Endpoints)

#### Verify Email with Code
```http
POST /api/auth/verify-email
Content-Type: application/json

{
  "email": "john@example.com",
  "verification_code": "123456"
}
```

Expected Response (Success):
```json
{
  "success": true,
  "message": "Email verified successfully! Welcome to Hoopay.",
  "data": {
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "email_verified": true,
      "email_verified_at": "2025-01-24T10:30:00Z"
    },
    "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
  }
}
```

Expected Response (Error):
```json
{
  "success": false,
  "message": "Verification failed.",
  "errors": {
    "verification_code": ["Invalid or expired verification code."]
  }
}
```

#### Resend Verification Email
```http
POST /api/auth/resend-verification
Content-Type: application/json

{
  "email": "john@example.com"
}
```

Expected Response:
```json
{
  "success": true,
  "message": "Verification code has been sent to your email.",
  "data": {
    "email": "john@example.com",
    "code_expires_at": "2025-01-24T11:30:00Z"
  }
}
```

#### Check Verification Status
```http
GET /api/auth/verification-status?email=john@example.com
```

Expected Response:
```json
{
  "success": true,
  "data": {
    "email": "john@example.com",
    "email_verified": false,
    "verification_required": true,
    "can_resend": true,
    "last_sent": "2025-01-24T10:25:00Z"
  }
}
```

### Community/Discussion
```
GET  /api/community/posts
POST /api/community/posts
GET  /api/community/posts/{id}
PUT  /api/community/posts/{id}
DELETE /api/community/posts/{id}
POST /api/community/posts/{id}/like
POST /api/community/posts/{id}/comment
GET  /api/community/posts/{id}/comments
GET  /api/community/categories
GET  /api/community/trending
POST /api/community/follow/{userId}
DELETE /api/community/unfollow/{userId}
GET  /api/community/followers
GET  /api/community/following
```

#### Profile Management
```
GET    /api/profile
PUT    /api/profile
POST   /api/profile/password
PUT    /api/profile/notifications
DELETE /api/profile/avatar
POST   /api/profile/avatar
GET    /api/profile/security
PUT    /api/profile/security
GET    /api/profile/activity
```

#### Referrals
```
GET  /api/referrals
POST /api/referrals/opt-in
POST /api/referrals/opt-out
GET  /api/referrals/list
GET  /api/referrals/commissions
POST /api/referrals/apply
POST /api/referrals/check
GET  /api/referrals/stats
GET  /api/referrals/earnings
```

#### Payment Methods
```
GET  /api/payment-methods
POST /api/payment-methods
GET  /api/payment-methods/{id}
PUT  /api/payment-methods/{id}
DELETE /api/payment-methods/{id}
GET  /api/payment-methods/available
```

#### Support & Help
```
GET  /api/support/tickets
POST /api/support/tickets
GET  /api/support/tickets/{id}
POST /api/support/tickets/{id}/messages
GET  /api/support/faq
GET  /api/support/categories
``` 