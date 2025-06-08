I'll help you create a comprehensive API documentation for these endpoints. I'll format it in a clear, developer-friendly way.

# Hoopay API Documentation

## Base URL
```
https://hoopaywallet.com//api
```

## Authentication
Most endpoints require authentication using Bearer token.
```http
Authorization: Bearer <your_token>
```

## Account Management API

### 1. Get All Accounts
Retrieves all accounts for the authenticated user.

```http
GET /accounts
Authorization: Bearer <token>

Response 200:
{
    "success": true,
    "data": {
        "accounts": [
            {
                "id": integer,
                "account_number": string,
                "account_type": string,
                "currency": string,
                "balance": decimal,
                "status": string,
                "is_active": boolean,
                "created_at": timestamp
            }
        ]
    },
    "message": "Accounts retrieved successfully."
}
```

### 2. Create New Account
Create a new account for the authenticated user.

```http
POST /accounts
Authorization: Bearer <token>
Content-Type: application/json

Request Body:
{
    "account_type": "checking|savings|investment|crypto",
    "currency": string,
    "deposit_address": string,  // Required for crypto accounts
    "network": string          // Required for crypto accounts
}

Response 200:
{
    "success": true,
    "data": {
        "account": {
            "id": integer,
            "account_number": string,
            "account_type": string,
            "currency": string,
            "balance": decimal,
            "status": string,
            "created_at": timestamp
        }
    },
    "message": "Account created successfully."
}
```

### 3. Get Account Details
Get details of a specific account.

```http
GET /accounts/{id}
Authorization: Bearer <token>

Response 200:
{
    "success": true,
    "data": {
        "account": {
            "id": integer,
            "account_number": string,
            "account_type": string,
            "currency": string,
            "balance": decimal,
            "status": string,
            "transactions": array,
            "created_at": timestamp
        }
    },
    "message": "Account retrieved successfully."
}
```

### 4. Update Account Status
Update the status of an account.

```http
PUT /accounts/{id}/status
Authorization: Bearer <token>
Content-Type: application/json

Request Body:
{
    "status": "active|inactive|suspended|closed"
}

Response 200:
{
    "success": true,
    "data": {
        "account": {
            "id": integer,
            "status": string,
            "updated_at": timestamp
        }
    },
    "message": "Account status updated successfully."
}
```

### 5. Get Account Types
Get all available account types.

```http
GET /account-types
Authorization: Bearer <token>

Response 200:
{
    "success": true,
    "data": {
        "account_types": [
            {
                "id": integer,
                "name": string,
                "description": string,
                "account_category": string,
                "currency": string,
                "prefix": string,
                "logo": string,
                "is_active": boolean
            }
        ]
    },
    "message": "Account types retrieved successfully."
}
```

### 6. Get Account Categories
Get all available account categories.

```http
GET /account-categories
Authorization: Bearer <token>

Response 200:
{
    "success": true,
    "data": {
        "categories": [
            string
        ]
    },
    "message": "Account categories retrieved successfully."
}
```

### 7. Get Account Types by Category
Get account types filtered by category.

```http
GET /account-types/{category}
Authorization: Bearer <token>

Response 200:
{
    "success": true,
    "data": {
        "account_types": [
            {
                "id": integer,
                "name": string,
                "description": string,
                "account_category": string,
                "currency": string,
                "prefix": string,
                "logo": string,
                "is_active": boolean
            }
        ]
    },
    "message": "Account types retrieved successfully."
}
```

## Error Responses

```http
Response 400 (Bad Request):
{
    "success": false,
    "message": "Validation Error.",
    "data": {
        "field": [
            "Error message"
        ]
    }
}

Response 401 (Unauthorized):
{
    "success": false,
    "message": "Unauthorized.",
    "data": null
}

Response 404 (Not Found):
{
    "success": false,
    "message": "Account not found.",
    "data": null
}

Response 500 (Server Error):
{
    "success": false,
    "message": "Internal server error.",
    "data": {
        "error": "Error details"
    }
}
```

## Notes
1. All requests requiring authentication must include the Bearer token in the Authorization header
2. All responses follow the standard format with `success`, `data`, and `message` fields
3. Dates are returned in ISO 8601 format
4. Currency codes follow the ISO 4217 standard (e.g., "USD", "EUR")
5. Account numbers are automatically generated and unique
6. Crypto accounts require additional validation for deposit addresses

Would you like me to provide more details about any specific endpoint or add documentation for other API features (transactions, wallets, etc.)?
