import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Textarea } from '../components/ui/textarea'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card'
import { Label } from '../components/ui/label'
import { useToast } from '../components/ui/use-toast'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select'
import SessionTimer from '@/components/SessionTimer'

const EXPIRY_OPTIONS = [
  { label: '10 minutes', value: 10 },
  { label: '30 minutes', value: 30 },
  { label: '1 hour', value: 60 },
  { label: '12 hours', value: 720 },
  { label: '24 hours', value: 1440 },
  { label: '3 days', value: 4320 },
  { label: '7 days', value: 10080 },
]

const ANIMATION_OPTIONS = [
  { label: 'No Animation', value: 'none' },
  { label: 'Fire', value: 'fire' },
  { label: 'Explode', value: 'explode' },
]

export default function CreateSecret() {
  const [message, setMessage] = useState('')
  const [passphrase, setPassphrase] = useState('')
  const [expiryMinutes, setExpiryMinutes] = useState(10)
  const [destructionAnimation, setDestructionAnimation] = useState('none')
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      toast({
        title: 'Authentication Required',
        description: 'Please login to create a secret',
      })
      navigate('/login')
    }
  }, [navigate, toast])

  const handleUnauthorized = () => {
    localStorage.removeItem('token')
    toast({
      title: 'Session Expired',
      description: 'Please login again'
    })
    navigate('/login')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('Please login first')
      }

      const response = await fetch('http://localhost:8000/api/secrets/', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          passphrase: passphrase || undefined,
          expiry_minutes: expiryMinutes,
          destruction_animation: destructionAnimation,
        }),
      })

      if (response.status === 401) {
        handleUnauthorized()
        return
      }

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Failed to create secret')
      }

      const data = await response.json()
      
      // Create the full URL
      const secretUrl = `${window.location.origin}/secrets/${data.id}`
      
      // Copy to clipboard
      await navigator.clipboard.writeText(secretUrl)
      
      toast({
        title: 'Success',
        description: 'Secret created and link copied to clipboard',
      })

      // Reset form
      setMessage('')
      setPassphrase('')
      setExpiryMinutes(10)
      setDestructionAnimation('none')
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('No token found')
      }

      const response = await fetch('http://localhost:8000/api/users/logout/', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.status === 401) {
        handleUnauthorized()
        return
      }

      if (!response.ok) {
        throw new Error('Failed to logout')
      }

      // Clear token
      localStorage.removeItem('token')

      toast({
        title: 'Success',
        description: 'Logged out successfully',
      })

      navigate('/login')
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
      })
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-2xl overflow-hidden">
        <SessionTimer />
        <CardHeader>
          <CardTitle>Create Secret Message</CardTitle>
          <CardDescription>
            Create a secure, one-time secret message that will be destroyed after viewing
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="message">Secret Message</Label>
              <Textarea
                id="message"
                placeholder="Enter your secret message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                className="min-h-[100px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="passphrase">Passphrase (Optional)</Label>
              <Input
                id="passphrase"
                type="password"
                placeholder="Enter a passphrase to protect your secret"
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiry">Expiration Time</Label>
              <Select value={expiryMinutes.toString()} onValueChange={(value) => setExpiryMinutes(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select expiration time" />
                </SelectTrigger>
                <SelectContent>
                  {EXPIRY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value.toString()}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="animation">Destruction Animation</Label>
              <Select value={destructionAnimation} onValueChange={setDestructionAnimation}>
                <SelectTrigger>
                  <SelectValue placeholder="Select destruction animation" />
                </SelectTrigger>
                <SelectContent>
                  {ANIMATION_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Creating...' : 'Create Secret'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleLogout}
            >
              Logout
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
} 