# One-Time Secret (OTS)

A secure platform for sharing sensitive information that self-destructs after being viewed. Built with Django REST Framework and React.

## Features

- **Secure One-Time Viewing**: Each secret can only be viewed once before being permanently destroyed
- **Passphrase Protection**: Optional passphrase protection for additional security
- **Expiry Control**: Set custom expiry times (up to 7 days)
- **Destruction Animations**: Choose from multiple destruction animations (Fire, Explode, Shred)
- **Email Authentication**: Secure email-based OTP authentication
- **Copy to Clipboard**: Easy one-click copying of secret content
- **Mobile Responsive**: Works seamlessly on all devices
- **Dark Mode**: Built-in dark mode support

## Tech Stack

### Backend
- Django 4.2+
- Django REST Framework
- SQLite (can be configured for PostgreSQL)
- django-environ for environment management
- Cryptography for secure encryption

### Frontend
- React 18+
- TypeScript
- Tailwind CSS
- Vite
- React Router
- Shadcn UI Components

## Setup

### Prerequisites
- Python 3.8+
- Node.js 16+
- npm or yarn

### Backend Setup

1. Clone the repository and navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Create a .env file:
   ```bash
   cp .env.example .env
   ```

5. Configure your .env file with appropriate values:
   ```
   DJANGO_SECRET_KEY=your-secret-key
   DJANGO_DEBUG=True
   DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1
   
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USE_TLS=True
   EMAIL_HOST_USER=your-email@gmail.com
   EMAIL_HOST_PASSWORD=your-app-password
   ```

6. Run migrations:
   ```bash
   python manage.py migrate
   ```

7. Start the development server:
   ```bash
   python manage.py runserver
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a .env file:
   ```bash
   cp .env.example .env
   ```

4. Configure your .env file:
   ```
   VITE_API_URL=http://localhost:8000/api
   VITE_ENABLE_ANIMATIONS=true
   VITE_ENABLE_COPY_BUTTON=true
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

## API Documentation

### Authentication

The API uses token-based authentication. Most endpoints require authentication except for viewing secrets and user registration.

#### Authentication Flow:
1. Register/Login with email
2. Receive OTP via email
3. Verify OTP to receive authentication token
4. Use token in Authorization header:
   ```
   Authorization: Token <your_token>
   ```

### Key Endpoints

#### Create Secret
```http
POST /api/secrets/
Content-Type: application/json
Authorization: Token <your_token>

{
    "message": "Secret message",
    "passphrase": "optional_passphrase",
    "expiry_minutes": 60,
    "destruction_animation": "fire"
}
```

#### View Secret
```http
GET /api/secrets/{secret_id}/
Content-Type: application/json

{
    "passphrase": "required_if_set"
}
```

For complete API documentation, see [API Documentation](backend/api_doc.md).

## Environment Variables

### Backend (.env)
| Variable | Description | Default |
|----------|-------------|---------|
| DJANGO_SECRET_KEY | Django secret key | Required |
| DJANGO_DEBUG | Debug mode | False |
| DJANGO_ALLOWED_HOSTS | Allowed hosts | localhost,127.0.0.1 |
| EMAIL_HOST | SMTP host | smtp.gmail.com |
| EMAIL_PORT | SMTP port | 587 |
| EMAIL_USE_TLS | Use TLS | True |
| EMAIL_HOST_USER | SMTP user | Required |
| EMAIL_HOST_PASSWORD | SMTP password | Required |

### Frontend (.env)
| Variable | Description | Default |
|----------|-------------|---------|
| VITE_API_URL | Backend API URL | http://localhost:8000/api |
| VITE_ENABLE_ANIMATIONS | Enable animations | true |
| VITE_ENABLE_COPY_BUTTON | Enable copy button | true |
| VITE_DEFAULT_EXPIRY_MINUTES | Default expiry time | 10 |
| VITE_MAX_EXPIRY_MINUTES | Maximum expiry time | 10080 |
| VITE_TOAST_DURATION | Toast notification duration | 5000 |
| VITE_ANIMATION_DURATION | Destruction animation duration | 3000 |

## Security Features

- One-time viewing with immediate destruction
- Optional passphrase protection
- Automatic expiry
- Email-based OTP authentication
- Secure encryption using Fernet (symmetric encryption)
- CORS protection
- Rate limiting
- No secret storage in browser history or localStorage