import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { useToast } from '../components/ui/use-toast'

export default function Login() {
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [isRequestingOTP, setIsRequestingOTP] = useState(false)
  const [isVerifyingOTP, setIsVerifyingOTP] = useState(false)
  const [showOTPInput, setShowOTPInput] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { toast } = useToast()
  const navigate = useNavigate()

  const handleRequestOTP = async (e) => {
    e.preventDefault()
    setIsRequestingOTP(true)

    try {
      const response = await fetch('http://localhost:8000/api/users/login/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ email: email.trim() }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || data.error || 'Failed to request OTP')
      }

      toast({
        title: 'Success',
        description: data.message,
      })
      setShowOTPInput(true)
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setIsRequestingOTP(false)
    }
  }

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('http://localhost:8000/api/users/verify_otp/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          email: email.trim(),
          otp: otp.trim()
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || data.detail || 'Failed to verify OTP');
      }
      
      // Store token
      localStorage.setItem('token', data.token);
      localStorage.setItem('tokenExpiresAt', data.expires_at);
      
      // Redirect to create secret page
      navigate('/');
    } catch (error) {
      setError(error.message);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <CardDescription>
            Enter your email to receive a one-time password.
          </CardDescription>
        </CardHeader>
        <form onSubmit={showOTPInput ? handleVerifyOTP : handleRequestOTP}>
          <CardContent>
            <div className="grid w-full items-center gap-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={showOTPInput}
                />
              </div>
              {showOTPInput && (
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="otp">One-Time Password</Label>
                  <Input
                    id="otp"
                    type="text"
                    placeholder="Enter the OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    required
                  />
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" type="submit" disabled={isRequestingOTP || isVerifyingOTP}>
              {isRequestingOTP || isVerifyingOTP
                ? 'Loading...'
                : showOTPInput
                ? 'Verify OTP'
                : 'Continue'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
} 