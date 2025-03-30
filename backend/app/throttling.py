from rest_framework.throttling import AnonRateThrottle

class LoginRateThrottle(AnonRateThrottle):
    rate = '5/minute'  # 5 attempts per minute per IP
    scope = 'login'

class OTPVerifyRateThrottle(AnonRateThrottle):
    rate = '5/minute'  # 5 attempts per minute per IP
    scope = 'otp_verify'

class SecretViewRateThrottle(AnonRateThrottle):
    rate = '5/minute'  # 5 attempts per minute per IP
    scope = 'secret_view' 