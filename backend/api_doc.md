# One-Time Secret API Documentation

## Base URL
```
http://localhost:8000/api/
```

## Rate Limits
All open endpoints are rate limited per IP address:
- Login: 5 requests per minute
- OTP Verification: 5 requests per minute
- Secret Viewing: 5 requests per minute

When rate limit is exceeded, the API returns a 429 status code with the message:
```json
{
    "message": "Rate limit exceeded"
}
```

## Authentication
The API uses token-based authentication. After successful OTP verification, you receive a token that expires in 1 minute.

Include the token in the Authorization header for protected endpoints:
```
Authorization: Token <your-token>
```

## Endpoints

### User Authentication

#### Login (Request OTP)
```
POST /users/login/
```

Request:
```json
{
    "email": "user@example.com"
}
```

Response (200 OK):
```json
{
    "message": "OTP sent to your email",
    "is_new_user": true
}
```

Development mode only:
```json
{
    "message": "OTP sent to your email",
    "is_new_user": true,
    "debug_otp": "123456"
}
```

#### Verify OTP
```
POST /users/verify_otp/
```

Request:
```json
{
    "email": "user@example.com",
    "otp": "123456"
}
```

Response (200 OK):
```json
{
    "token": "your-auth-token",
    "expires_at": "2024-03-21T10:30:00Z"
}
```

#### Logout
```
POST /users/logout/
```
Requires Authentication

Response (200 OK):
```json
{
    "message": "Logged out successfully"
}
```

### Secrets

#### Create Secret
```
POST /secrets/
```
Requires Authentication

Request:
```json
{
    "message": "Your secret message",
    "passphrase": "optional-passphrase",
    "expiry_minutes": 30,
    "destruction_animation": "none|fire|explode"
}
```

Response (201 Created):
```json
{
    "id": "uuid",
    "created_at": "2024-03-21T10:00:00Z",
    "expires_at": "2024-03-21T10:30:00Z"
}
```

#### View Secret
```
POST /secrets/{secret_id}/view_protected/
```

Request (for passphrase-protected secrets):
```json
{
    "passphrase": "your-passphrase"
}
```

Response (200 OK):
```json
{
    "id": "uuid",
    "message": "decrypted secret message",
    "copy": "decrypted secret message",
    "has_passphrase": true,
    "created_at": "2024-03-21T10:00:00Z",
    "expires_at": "2024-03-21T10:30:00Z",
    "is_viewed": true,
    "is_destroyed": false,
    "destruction_animation": "none|fire|explode"
}
```

### Error Responses

#### 400 Bad Request
```json
{
    "error": "Error type",
    "detail": "Detailed error message"
}
```

Common error types:
- "Missing required fields"
- "Invalid OTP"
- "OTP has expired"
- "Invalid passphrase"
- "Secret has expired"
- "Secret is no longer available"

#### 401 Unauthorized
```json
{
    "error": "Not authenticated"
}
```

#### 404 Not Found
```json
{
    "error": "User not found",
    "detail": "No user found with this email"
}
```

#### 429 Too Many Requests
```json
{
    "message": "Rate limit exceeded"
}
```

## Notes

1. Secrets can only be viewed once. After viewing, they are marked as viewed and cannot be accessed again.
2. Secrets automatically expire after the specified expiry time (default is set in server configuration).
3. Passphrase-protected secrets require the correct passphrase for viewing.
4. The session token expires after 1 minute, requiring re-authentication.
5. Rate limits are applied per IP address to prevent abuse.
6. In development mode (`DEBUG=True`), OTP values are included in the response for testing purposes. 