from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.utils import timezone
from django.conf import settings
import uuid
from cryptography.fernet import Fernet
import base64
from datetime import timedelta

class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        if password:
            user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, password, **extra_fields)

class User(AbstractUser):
    username = None
    email = models.EmailField('email address', unique=True)
    last_login_at = models.DateTimeField(null=True, blank=True)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []
    
    objects = UserManager()

    def update_last_login(self):
        self.last_login_at = timezone.now()
        self.save()

    @classmethod
    def cleanup_inactive_users(cls, days=30):
        """Delete users who haven't logged in for the specified number of days"""
        cutoff_date = timezone.now() - timedelta(days=days)
        inactive_users = cls.objects.filter(
            last_login_at__lt=cutoff_date,
            is_superuser=False  # Don't delete admin users
        )
        count = inactive_users.count()
        inactive_users.delete()
        return count

class Token(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    key = models.CharField(max_length=40, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    last_used_at = models.DateTimeField(auto_now=True)

    def is_valid(self):
        return self.expires_at > timezone.now()

    def __str__(self):
        return f"Token for {self.user.email}"

    class Meta:
        indexes = [
            models.Index(fields=['user', 'created_at']),
            models.Index(fields=['expires_at']),
        ]

class OTP(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)

    def is_valid(self):
        return (
            not self.is_used and 
            self.expires_at > timezone.now()
        )

    def __str__(self):
        return f"OTP for {self.user.email}"

class Secret(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    encrypted_message = models.BinaryField()
    encryption_key = models.BinaryField()
    has_passphrase = models.BooleanField(default=False)
    passphrase_hash = models.BinaryField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_viewed = models.BooleanField(default=False)
    is_destroyed = models.BooleanField(default=False)
    destruction_animation = models.CharField(max_length=20, default='none', choices=[
        ('none', 'No Animation'),
        ('fire', 'Fire'),
        ('explode', 'Explode'),
        ('shred', 'Shred')
    ])

    @property
    def is_expired(self):
        """Check if the secret has expired"""
        return timezone.now() > self.expires_at

    def encrypt_message(self, message, passphrase=None):
        # Generate a unique encryption key for this secret
        key = Fernet.generate_key()
        f = Fernet(key)
        
        # Encrypt the message
        encrypted_data = f.encrypt(message.encode())
        
        # Store the encrypted message and key
        self.encrypted_message = encrypted_data
        self.encryption_key = key
        
        # If passphrase is provided, hash it
        if passphrase:
            self.has_passphrase = True
            # In a real application, use a proper password hashing algorithm
            self.passphrase_hash = passphrase.encode()

    def check_passphrase(self, passphrase):
        """Check if the provided passphrase matches the stored hash"""
        if not self.has_passphrase:
            return True
        if not passphrase:
            return False
        # In a real application, use a proper password hash comparison
        return passphrase.encode() == self.passphrase_hash

    def decrypt_message(self, passphrase=None):
        # First check if the secret is already viewed or destroyed
        if self.is_viewed or self.is_destroyed:
            raise ValueError("This secret has already been viewed or destroyed")
            
        # Then check if it's expired
        if timezone.now() > self.expires_at:
            self.is_destroyed = True
            self.save()
            raise ValueError("This secret has expired")
            
        # Then check passphrase if required
        if self.has_passphrase:
            if not passphrase:
                raise ValueError("Passphrase required")
            if passphrase.encode() != self.passphrase_hash:
                raise ValueError("Invalid passphrase")
        
        # Finally decrypt the message
        f = Fernet(self.encryption_key)
        decrypted_message = f.decrypt(self.encrypted_message).decode()
        
        # Mark as viewed and save
        self.is_viewed = True
        self.save()
        
        return decrypted_message

    def mark_as_viewed(self):
        """Mark the secret as viewed"""
        self.is_viewed = True
        self.save()

    def destroy(self):
        """Destroy the secret"""
        self.is_destroyed = True
        self.save()

    def __str__(self):
        return f"Secret {self.id} by {self.user.email}"

    class Meta:
        indexes = [
            models.Index(fields=['user', 'created_at']),
            models.Index(fields=['expires_at']),
        ]
