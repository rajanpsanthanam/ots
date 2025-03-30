from rest_framework import serializers
from django.utils import timezone
from django.conf import settings
from .models import User, OTP, Secret

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'email', 'first_name', 'last_name')
        read_only_fields = ('id',)

class UserRegistrationSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('email', 'password')
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password']
        )
        return user

class OTPSerializer(serializers.ModelSerializer):
    class Meta:
        model = OTP
        fields = ('code',)
        read_only_fields = ('code',)

class OTPVerificationSerializer(serializers.Serializer):
    email = serializers.EmailField()
    code = serializers.CharField(max_length=6)

class SecretCreateSerializer(serializers.ModelSerializer):
    message = serializers.CharField(write_only=True)
    passphrase = serializers.CharField(required=False, write_only=True, allow_blank=True)
    expiry_minutes = serializers.IntegerField(required=False, min_value=1, max_value=10080)  # 7 days in minutes
    destruction_animation = serializers.ChoiceField(required=False, choices=[
        ('none', 'No Animation'),
        ('fire', 'Fire'),
        ('explode', 'Explode'),
        ('shred', 'Shred')
    ])

    class Meta:
        model = Secret
        fields = ('id', 'message', 'passphrase', 'expiry_minutes', 'destruction_animation', 'created_at', 'expires_at')
        read_only_fields = ('id', 'created_at', 'expires_at')

    def create(self, validated_data):
        message = validated_data.pop('message')
        passphrase = validated_data.pop('passphrase', None)
        expiry_minutes = validated_data.pop('expiry_minutes', None)
        destruction_animation = validated_data.pop('destruction_animation', 'none')

        # Calculate expiry time
        if expiry_minutes:
            expires_at = timezone.now() + timezone.timedelta(minutes=expiry_minutes)
        else:
            expires_at = timezone.now() + settings.OTS_DEFAULT_EXPIRY

        # Create secret
        secret = Secret(
            user=self.context['request'].user,
            expires_at=expires_at,
            destruction_animation=destruction_animation,
            **validated_data
        )
        secret.encrypt_message(message, passphrase)
        secret.save()
        return secret

class SecretViewSerializer(serializers.ModelSerializer):
    message = serializers.SerializerMethodField()
    copy = serializers.SerializerMethodField()

    class Meta:
        model = Secret
        fields = ('id', 'message', 'copy', 'has_passphrase', 'created_at', 'expires_at', 'is_viewed', 'is_destroyed', 'destruction_animation')
        read_only_fields = ('id', 'message', 'copy', 'has_passphrase', 'created_at', 'expires_at', 'is_viewed', 'is_destroyed', 'destruction_animation')

    def get_message(self, obj):
        """Get decrypted message if conditions are met"""
        # If message is already decrypted in the view, return it
        if hasattr(obj, '_decrypted_message'):
            return obj._decrypted_message
            
        # For passphrase-protected secrets, try to decrypt with passphrase
        if obj.has_passphrase:
            passphrase = self.context.get('passphrase')
            if not passphrase:
                return None
            try:
                return obj.decrypt_message(passphrase)
            except ValueError:
                return None
                
        # For non-passphrase secrets, try to decrypt
        try:
            return obj.decrypt_message()
        except ValueError:
            return None

    def get_copy(self, obj):
        """Get the same message for copy functionality"""
        return self.get_message(obj) 