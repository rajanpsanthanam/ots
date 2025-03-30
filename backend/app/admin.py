from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, OTP, Secret

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ('email', 'first_name', 'last_name', 'is_staff')
    search_fields = ('email', 'first_name', 'last_name')
    ordering = ('email',)
    
    # Override the fieldsets to remove username
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal info', {'fields': ('first_name', 'last_name')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser',
                                  'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'password1', 'password2'),
        }),
    )

@admin.register(OTP)
class OTPAdmin(admin.ModelAdmin):
    list_display = ('user', 'code', 'created_at', 'expires_at', 'is_used')
    search_fields = ('user__email', 'code')
    list_filter = ('is_used', 'created_at')
    readonly_fields = ('created_at',)

@admin.register(Secret)
class SecretAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'created_at', 'expires_at', 'is_viewed', 'is_destroyed', 'has_passphrase')
    search_fields = ('id', 'user__email')
    list_filter = ('is_viewed', 'is_destroyed', 'has_passphrase', 'created_at')
    readonly_fields = ('id', 'created_at', 'encrypted_message', 'encryption_key')
