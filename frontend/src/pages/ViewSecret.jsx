import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Label } from '../components/ui/label'
import { useToast } from '../components/ui/use-toast'
import { FireAnimation } from '../components/FireAnimation'
import { ExplodeAnimation } from '../components/ExplodeAnimation'
import BurnTimer from '@/components/BurnTimer'

export default function ViewSecret() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [secret, setSecret] = useState(null)
  const [passphrase, setPassphrase] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showAnimation, setShowAnimation] = useState(false)
  const [isPassphraseRequired, setIsPassphraseRequired] = useState(false)
  const [shouldShowTimer, setShouldShowTimer] = useState(false)
  const navigationTimeoutRef = useRef(null)

  useEffect(() => {
    // Cleanup function for navigation timeout
    return () => {
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current)
      }
    }
  }, [])

  // Initial check for passphrase requirement
  const checkPassphraseRequired = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/secrets/${id}/view_protected/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ passphrase: '' }),
      })

      const data = await response.json()

      if (response.ok) {
        setSecret({
          ...data,
          message: data.message || data.copy
        })
        // Delay showing the timer slightly to ensure proper mounting
        setTimeout(() => setShouldShowTimer(true), 100)
      } else if (data.error === 'Passphrase required') {
        setIsPassphraseRequired(true)
      } else {
        throw new Error(data.detail || data.error || 'Failed to fetch secret')
      }
    } catch (error) {
      setError(error.message)
    }
  }

  useEffect(() => {
    checkPassphraseRequired()
  }, [id])

  const handleSubmit = async (e) => {
    if (e) e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch(`http://localhost:8000/api/secrets/${id}/view_protected/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ passphrase }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || data.error || 'Failed to view secret')
      }

      setSecret({
        ...data,
        message: data.message || data.copy
      })
      // Delay showing the timer slightly to ensure proper mounting
      setTimeout(() => setShouldShowTimer(true), 100)

      toast({
        title: 'Success',
        description: 'Secret message retrieved successfully',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    }
    
    setIsLoading(false)
  }

  const handleCopyMessage = async () => {
    if (!secret?.message) return
    
    try {
      await navigator.clipboard.writeText(secret.message)
      toast({
        title: 'Copied',
        description: 'Secret message copied to clipboard',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to copy message',
        variant: 'destructive',
      })
    }
  }

  const handleBurnStart = () => {
    // Clear any existing timeout
    if (navigationTimeoutRef.current) {
      clearTimeout(navigationTimeoutRef.current)
    }
    
    setShouldShowTimer(false) // Hide timer when burn starts

    // If no animation is specified, navigate immediately
    if (!secret?.destruction_animation || secret.destruction_animation === 'none') {
      navigate('/')
      return
    }
    
    // Otherwise, show animation and navigate after delay
    setShowAnimation(true)
    navigationTimeoutRef.current = setTimeout(() => {
      navigate('/')
    }, 3000)
  }

  const renderAnimation = () => {
    if (!showAnimation) return null

    // Don't show any animation if none specified
    if (!secret?.destruction_animation || secret.destruction_animation === 'none') {
      return null
    }

    return (
      <div className="fixed inset-0 z-50">
        {secret.destruction_animation === 'fire' ? (
          <FireAnimation />
        ) : secret.destruction_animation === 'explode' ? (
          <ExplodeAnimation />
        ) : null}
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-[350px]">
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-[350px] overflow-hidden relative">
        {shouldShowTimer && <BurnTimer onBurnStart={handleBurnStart} />}
        <CardHeader>
          <CardTitle>View Secret</CardTitle>
          <CardDescription>
            {isPassphraseRequired 
              ? 'Enter the passphrase to view the secret message'
              : 'View the secret message'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="text-red-500 mb-4">{error}</div>
          )}
          {secret?.message ? (
            <div className="space-y-4">
              <div className="p-4 bg-gray-100 rounded-lg">
                <p className="whitespace-pre-wrap">{secret.message}</p>
              </div>
              <Button onClick={handleCopyMessage} className="w-full">
                Copy Message
              </Button>
            </div>
          ) : isPassphraseRequired ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="passphrase">Passphrase</Label>
                <Input
                  id="passphrase"
                  type="password"
                  value={passphrase}
                  onChange={(e) => setPassphrase(e.target.value)}
                  placeholder="Enter passphrase"
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Loading...' : 'View Secret'}
              </Button>
            </form>
          ) : (
            <div className="text-center">
              <p>Loading secret...</p>
            </div>
          )}
        </CardContent>
      </Card>
      {renderAnimation()}
    </div>
  )
} 