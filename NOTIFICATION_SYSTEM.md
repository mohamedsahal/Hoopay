# Mobile App Internal Notification System

This document describes the comprehensive internal notification system implemented for the Hoopay mobile app.

## Overview

The notification system provides real-time internal notifications for user actions including:
- **Deposits** (successful, failed, pending)
- **Transfers** (sent, received, failed, pending)
- **Withdrawals** (successful, failed, pending)
- **Referral commissions**

## Architecture

### Backend Components

#### 1. Mobile Notification Controller
**File**: `app/app/Http/Controllers/Api/Mobile/NotificationController.php`

Handles all notification-related API operations:
- `getNotifications()` - Fetch paginated notifications
- `markAsRead()` - Mark single notification as read
- `markAllAsRead()` - Mark all notifications as read
- `getCounts()` - Get notification counts
- `deleteNotification()` - Delete a notification

#### 2. API Routes
**File**: `app/routes/api.php`

Mobile notification endpoints under `/mobile/notifications/`

### Frontend Components

#### 1. Notification Service
**File**: `HoopayApp/src/services/notificationService.js`
- API communication
- Local state management
- Real-time updates
- Listener pattern for components

#### 2. React Components

##### NotificationBell
**File**: `HoopayApp/src/components/NotificationBell.js`
- Displays notification icon with unread count
- Animated bell on new notifications
- Integrates with HomeScreen header

##### NotificationItem
**File**: `HoopayApp/src/components/NotificationItem.js`
- Individual notification display
- Mark as read functionality
- Delete notification option

##### NotificationsScreen
**File**: `HoopayApp/src/screens/NotificationsScreen.js`
- Full notification management interface
- Filtering (All, Unread, Read)
- Pagination support
- Pull-to-refresh

##### NotificationToast
**File**: `HoopayApp/src/components/NotificationToast.js`
- Real-time notification popup
- Auto-dismiss functionality

#### 3. Custom Hook
**File**: `HoopayApp/src/hooks/useNotifications.js`
- Centralized notification state management
- Easy integration for any component

## Features

### 1. Real-time Notifications
- Automatic updates when new notifications arrive
- Toast notifications for immediate feedback
- Bell animation on new notifications

### 2. Comprehensive Management
- View all notifications
- Filter by read/unread status
- Mark individual or all as read
- Delete notifications
- Pagination for large lists

### 3. Type-specific Handling
- Different icons/colors for transaction types
- Status-based styling (success, failure, pending)
- Contextual messages based on transaction type

## Integration

### HomeScreen Integration
The notification bell is integrated into the HomeScreen header and navigates to the NotificationsScreen when tapped.

### Navigation Setup
Added NotificationsScreen to the navigation stack in `MainNavigator.tsx`.

## API Endpoints

- `GET /mobile/notifications/` - Fetch notifications
- `GET /mobile/notifications/counts` - Get counts
- `POST /mobile/notifications/{id}/mark-read` - Mark as read
- `POST /mobile/notifications/mark-all-read` - Mark all as read
- `DELETE /mobile/notifications/{id}` - Delete notification

## Usage

Users will receive notifications for:
1. Successful deposits
2. Failed deposits with reason
3. Transfers sent/received
4. Withdrawal completions/failures
5. Referral commission earnings

The system provides a native mobile experience with real-time updates and intuitive management. 