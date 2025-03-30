from django.shortcuts import render
from rest_framework import viewsets, status, generics
from rest_framework.decorators import action, throttle_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.utils import timezone
from django.shortcuts import get_object_or_404
from rest_framework.authtoken.models import Token
import random
import string
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from rest_framework.throttling import UserRateThrottle, AnonRateThrottle
from rest_framework.authentication import TokenAuthentication
from rest_framework.exceptions import AuthenticationFailed
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.conf import settings
from django.db.models import Q

from .models import User, OTP, Secret, Token as CustomToken
from .authentication import CustomTokenAuthentication
from .serializers import (
    UserSerializer,
    UserRegistrationSerializer,
    OTPSerializer,
    OTPVerificationSerializer,
    SecretCreateSerializer,
    SecretViewSerializer,
)

User = get_user_model()

def generate_otp():
    """Generate a 6-digit alphanumeric OTP"""
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))

@require_http_methods(["GET"])
def ratelimited_view(request):
    return JsonResponse({"message": "Rate limit exceeded"}, status=429)

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    throttle_classes = [AnonRateThrottle, UserRateThrottle]
    permission_classes = [AllowAny]  # Allow unauthenticated access to login/register

    @action(detail=False, methods=['post'])
    def register(self, request):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'])
    def login(self, request):
        email = request.data.get('email')
        
        try:
            user = User.objects.get(email=email)
            # Update last login time
            user.update_last_login()
        except User.DoesNotExist:
            # Auto-register the user
            try:
                user = User.objects.create_user(
                    email=email,
                    password=None  # No password needed
                )
                user.update_last_login()
            except Exception as e:
                return Response({
                    'error': 'Failed to create account',
                    'detail': str(e)
                }, status=status.HTTP_400_BAD_REQUEST)
        
        # Delete any existing unused OTPs for this user
        OTP.objects.filter(user=user, is_used=False).delete()
        
        # Generate and send OTP
        otp = ''.join(random.choices(string.digits, k=6))
        otp_obj = OTP.objects.create(
            user=user,
            code=otp,
            expires_at=timezone.now() + timezone.timedelta(minutes=10)
        )
        
        try:
            send_mail(
                'Your OTP for Login',
                f'Your OTP is: {otp}',
                settings.DEFAULT_FROM_EMAIL,
                [email],
                fail_silently=False,
            )
        except Exception as e:
            # If email sending fails, still return the OTP in development
            if settings.DEBUG:
                return Response({
                    'message': 'OTP sent to your email',
                    'is_new_user': not user.last_login_at,
                    'debug_otp': otp  # Only include in development
                })
            else:
                return Response({
                    'error': 'Failed to send OTP',
                    'detail': str(e)
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        return Response({
            'message': 'OTP sent to your email',
            'is_new_user': not user.last_login_at
        })

    @action(detail=False, methods=['post'])
    def verify_otp(self, request):
        email = request.data.get('email')
        otp = request.data.get('otp')
        
        if not email or not otp:
            return Response({
                'error': 'Missing required fields',
                'detail': 'Email and OTP are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(email=email)
            current_time = timezone.now()
            
            # Get the most recent unused OTP
            otp_obj = OTP.objects.filter(
                user=user,
                code=otp,
                is_used=False
            ).order_by('-created_at').first()
            
            if not otp_obj:
                return Response({
                    'error': 'Invalid OTP',
                    'detail': 'No matching OTP found'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Check if OTP is expired
            if current_time > otp_obj.expires_at:
                return Response({
                    'error': 'OTP has expired',
                    'detail': f'OTP expired at {otp_obj.expires_at}'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Mark OTP as used
            otp_obj.is_used = True
            otp_obj.save()
            
            # Update last login time
            user.update_last_login()
            
            # Create token with 10-minute expiration
            token = CustomToken.objects.create(
                user=user,
                key=''.join(random.choices(string.ascii_letters + string.digits, k=40)),
                expires_at=current_time + timezone.timedelta(minutes=10)
            )
            
            return Response({
                'token': token.key,
                'expires_at': token.expires_at
            })
            
        except User.DoesNotExist:
            return Response({
                'error': 'User not found',
                'detail': 'No user found with this email'
            }, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['post'])
    def logout(self, request):
        if request.user.is_authenticated:
            CustomToken.objects.filter(user=request.user).delete()
            return Response({'message': 'Logged out successfully'})
        return Response({'error': 'Not authenticated'}, status=status.HTTP_401_UNAUTHORIZED)

class SecretViewSet(viewsets.ModelViewSet):
    queryset = Secret.objects.all()
    serializer_class = SecretCreateSerializer
    permission_classes = [IsAuthenticated]
    throttle_classes = [UserRateThrottle]
    authentication_classes = [CustomTokenAuthentication]
    
    def get_permissions(self):
        if self.action in ['retrieve', 'view_protected']:
            return []  # No permissions required for viewing secrets
        return super().get_permissions()
    
    def get_authentication_classes(self):
        if self.action in ['retrieve', 'view_protected']:
            return []  # No authentication required for viewing secrets
        return super().get_authentication_classes()
    
    def get_queryset(self):
        if self.action in ['retrieve', 'view_protected']:
            return Secret.objects.all()
        return Secret.objects.filter(user=self.request.user)
    
    def get_serializer_class(self):
        if self.action in ['retrieve', 'view_protected']:
            return SecretViewSerializer
        return SecretCreateSerializer
    
    @action(detail=True, methods=['post'])
    def view_protected(self, request, pk=None):
        instance = self.get_object()
        
        # Check if secret is expired
        if instance.is_expired:
            return Response({
                'error': 'Secret has expired',
                'detail': 'This secret is no longer available'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if secret is already viewed or destroyed
        if instance.is_viewed or instance.is_destroyed:
            return Response({
                'error': 'Secret is no longer available',
                'detail': 'This secret has already been viewed or destroyed'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Get passphrase from request
        passphrase = request.data.get('passphrase')
        
        # For passphrase-protected secrets, require passphrase
        if instance.has_passphrase:
            if not passphrase:
                return Response({
                    'error': 'Passphrase required',
                    'detail': 'Please provide a passphrase to view this secret'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Check passphrase
            if not instance.check_passphrase(passphrase):
                return Response({
                    'error': 'Invalid passphrase',
                    'detail': 'The provided passphrase is incorrect'
                }, status=status.HTTP_400_BAD_REQUEST)
        
        # Try to decrypt the message
        try:
            message = instance.decrypt_message(passphrase)
        except ValueError as e:
            return Response({
                'error': 'Failed to decrypt secret',
                'detail': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Serialize with passphrase context
        serializer = self.get_serializer(instance, context={'passphrase': passphrase})
        response_data = serializer.data
        
        # Ensure message is included in response
        if not response_data.get('message'):
            response_data['message'] = message
        
        return Response(response_data)
    
    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        
        # Try to decrypt the message
        try:
            # For passphrase-protected secrets, require passphrase
            if instance.has_passphrase:
                passphrase = request.data.get('passphrase')
                if not passphrase:
                    return Response({
                        'error': 'Passphrase required',
                        'detail': 'This secret is passphrase protected'
                    }, status=status.HTTP_400_BAD_REQUEST)
                message = instance.decrypt_message(passphrase)
            else:
                # For non-passphrase secrets, decrypt without passphrase
                message = instance.decrypt_message()
            
            # Set the decrypted message on the instance
            instance._decrypted_message = message
            serializer = self.get_serializer(instance)
            return Response(serializer.data)
        except ValueError as e:
            if "already been viewed or destroyed" in str(e):
                return Response({
                    'error': 'Secret is no longer available',
                    'detail': str(e)
                }, status=status.HTTP_400_BAD_REQUEST)
            elif "expired" in str(e):
                return Response({
                    'error': 'Secret has expired',
                    'detail': str(e)
                }, status=status.HTTP_400_BAD_REQUEST)
            else:
                return Response({
                    'error': 'Failed to decrypt secret',
                    'detail': str(e)
                }, status=status.HTTP_400_BAD_REQUEST)
