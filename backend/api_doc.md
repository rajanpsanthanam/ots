# One-Time Secret API Documentation

## Base URL
```
http://localhost:8000/api/
```

## Authentication
The API uses token-based authentication. To authenticate:

1. Register a user account (if not already registered)
2. Request an OTP using your email
3. Verify the OTP to receive an authentication token
4. Include the token in the Authorization header for subsequent requests:
   ```
   Authorization: Token <your_token>
   ```

Most endpoints require authentication except for user registration and OTP-related endpoints.

## Endpoints

### User Management

#### 1. Register User
Create a new user account.

```http
POST /users/
```

**Request Body:**
```json
{
    "email": "user@example.com",
    "password": "secure_password"
}
```

**Response (201 Created):**
```json
{
    "user": {
        "id": 1,
        "email": "user@example.com",
        "first_name": "",
        "last_name": ""
    },
    "token": "9944b09199c62bcf9418ad846dd0e4bbdfc6ee4b"
}
```

#### 2. Request OTP
Request a one-time password for login.

```http
POST /users/request_otp/
```

**Request Body:**
```json
{
    "email": "user@example.com"
}
```

**Response (200 OK):**
```json
{
    "message": "OTP sent to email. (DEV MODE: OTP is ABC123)"
}
```

#### 3. Verify OTP
Verify OTP and receive authentication token.

```http
POST /users/verify_otp/
```

**Request Body:**
```json
{
    "email": "user@example.com",
    "code": "ABC123"
}
```

**Response (200 OK):**
```json
{
    "message": "OTP verified successfully",
    "user": {
        "id": 1,
        "email": "user@example.com",
        "first_name": "",
        "last_name": ""
    },
    "token": "9944b09199c62bcf9418ad846dd0e4bbdfc6ee4b"
}
```

### Secret Management

#### 1. Create Secret
Create a new one-time secret. Requires authentication.

```http
POST /secrets/
```

**Request Body:**
```json
{
    "message": "My secret message",
    "passphrase": "optional_passphrase",  // Optional
    "expiry_minutes": 60  // Optional, defaults to 10 minutes
}
```

**Response (201 Created):**
```json
{
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "expires_at": "2024-03-23T12:34:56Z",
    "url": "/api/secrets/550e8400-e29b-41d4-a716-446655440000/"
}
```

#### 2. View Secret
View a secret. This endpoint is publicly accessible - anyone with the link can view the secret. The secret can only be viewed once and is destroyed immediately after viewing. If a passphrase was set during creation, it must be provided to view the secret.

```http
GET /secrets/{secret_id}/
```

**Request Body (only required if secret has passphrase):**
```json
{
    "passphrase": "required_if_set_during_creation"
}
```

**Response (200 OK):**
```json
{
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "message": "My secret message",
    "has_passphrase": true,
    "created_at": "2024-03-23T11:34:56Z",
    "expires_at": "2024-03-23T12:34:56Z",
    "is_viewed": true,
    "is_destroyed": false
}
```

**Error Response (if already viewed/destroyed):**
```json
{
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "message": "This secret has already been viewed or destroyed",
    "has_passphrase": true,
    "created_at": "2024-03-23T11:34:56Z",
    "expires_at": "2024-03-23T12:34:56Z",
    "is_viewed": true,
    "is_destroyed": true
}
```

**Error Response (if expired):**
```json
{
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "message": "This secret has expired",
    "has_passphrase": true,
    "created_at": "2024-03-23T11:34:56Z",
    "expires_at": "2024-03-23T12:34:56Z",
    "is_viewed": false,
    "is_destroyed": true
}
```

**Error Response (if passphrase required but invalid):**
```json
{
    "error": "Invalid passphrase",
    "has_passphrase": true
}
```

#### 3. Destroy Secret
Manually destroy a secret before it's viewed or expired. Requires authentication and ownership of the secret.

```http
POST /secrets/{secret_id}/destroy_secret/
```

**Response (200 OK):**
```json
{
    "message": "Secret destroyed successfully"
}
```

## Error Responses

### 400 Bad Request
Returned when the request is invalid.

```json
{
    "error": "Error message describing the issue"
}
```

### 401 Unauthorized
Returned when authentication is required but not provided.

```json
{
    "detail": "Authentication credentials were not provided."
}
```

### 403 Forbidden
Returned when the user doesn't have permission to perform the action.

```json
{
    "detail": "You do not have permission to perform this action."
}
```

### 404 Not Found
Returned when the requested resource doesn't exist.

```json
{
    "detail": "Not found."
}
```

## Notes

1. **URL Format:**
   - All API endpoints must include a trailing slash (/)
   - Example: Use `/api/secrets/` instead of `/api/secrets`

2. **Authentication Flow:**
   - Register a user account (if needed)
   - Request OTP using email
   - Verify OTP to receive authentication token
   - Include token in Authorization header for all subsequent requests
   - Token remains valid until explicitly invalidated

3. **Secret Sharing:**
   - Anyone with the secret link can view it (no authentication required)
   - Optional passphrase protection adds an extra layer of security
   - Secrets can only be viewed once
   - After viewing, secrets are immediately destroyed
   - Secrets automatically expire after the specified time
   - Only the creator can manually destroy their secrets (requires authentication)

4. **Secret Expiry:**
   - Default expiry time is 10 minutes
   - Maximum allowed expiry time is 7 days
   - Secrets are automatically destroyed after expiry

5. **Security Features:**
   - All secrets are encrypted at rest
   - Optional passphrase protection for shared secrets
   - One-time viewing only
   - Automatic destruction after viewing or expiry
   - Manual destruction option (for creator only)
   - Token-based authentication (for creating/managing secrets)

6. **Development Mode:**
   - OTP codes are returned in the API response (for development only)
   - In production, OTP codes will be sent via email

7. **CORS:**
   - CORS is enabled for all origins in development
   - Configure `CORS_ALLOW_ALL_ORIGINS` and `CORS_ALLOW_CREDENTIALS` in production 