## One-Time Secret Application

### Tech Stack
- **Backend:** Django with Django REST Framework (DRF) for APIs
- **Frontend:** React with Shadcn UI components

### Features

#### Authentication
- Users can sign up or log in using their email address.
- Authentication via a 6-digit alphanumeric OTP sent through Django's default email service (OTP printed in terminal for development).

#### Secret Creation
- Users can enter a message to encrypt.
- Optionally, users can add a passphrase for additional protection.
- Users can set a custom expiry time for the secret link (default is 10 minutes).

#### Secret Sharing
- Users receive a unique, sharable link after creating a secret.
- The secret message is viewable only once; after viewing, the message is immediately destroyed.
- Secret links automatically expire after the specified time.
- Users can manually destroy (burn) the secret before anyone views it.

### Security
- Secrets are encrypted at rest.
- Optional passphrase protection for enhanced security.

### Notes for Development
- Use Django’s built-in email backend to simulate sending emails (OTP codes printed in terminal).
- Clearly log actions such as link creation, viewing, and destruction for easier debugging.

