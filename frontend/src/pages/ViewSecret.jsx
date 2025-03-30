import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Label } from '../components/ui/label'
import { useToast } from '../components/ui/use-toast'
import { FireAnimation } from '../components/FireAnimation'
import { ExplodeAnimation } from '../components/ExplodeAnimation'

export default function ViewSecret() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [secret, setSecret] = useState(null)
  const [passphrase, setPassphrase] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showAnimation, setShowAnimation] = useState(false)

  useEffect(() => {
    // Try to fetch the secret immediately to check if it's passphrase protected
    const fetchSecret = async () => {
      try {
        // For non-passphrase secrets, we need to use POST to view_protected endpoint
        const response = await fetch(`http://localhost:8000/api/secrets/${id}/view_protected/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ passphrase: '' }), // Empty passphrase for non-passphrase secrets
        })

        if (!response.ok) {
          const error = await response.json()
          if (error.error === 'Passphrase required') {
            setSecret({ has_passphrase: true })
            return
          }
          throw new Error(error.detail || error.error || 'Failed to fetch secret')
        }
        const data = await response.json()
        setSecret(data)
        
        // If we got the secret successfully, start the animation sequence
        const animationTimer = setTimeout(() => {
          console.log('Starting animation...') // Debug log
          setShowAnimation(true)
        }, 5000)

        // Redirect after animation
        const redirectTimer = setTimeout(() => {
          navigate('/')
        }, 8000)

        // Cleanup timers
        return () => {
          clearTimeout(animationTimer)
          clearTimeout(redirectTimer)
        }
      } catch (error) {
        setError(error.message)
      }
    }

    fetchSecret()
  }, [id, navigate])

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
      console.log('Response data:', data) // Debug log

      if (!response.ok) {
        throw new Error(data.detail || data.error || 'Failed to view secret')
      }

      // Update secret state with the response data
      setSecret({
        ...data,
        message: data.message || data.copy // Use either message or copy field
      })
      setIsLoading(false)

      toast({
        title: 'Success',
        description: 'Secret message retrieved successfully',
      })

      // Start the animation sequence
      const animationTimer = setTimeout(() => {
        console.log('Starting animation...') // Debug log
        setShowAnimation(true)
      }, 5000)

      // Redirect after animation
      const redirectTimer = setTimeout(() => {
        navigate('/')
      }, 8000)

      // Cleanup timers
      return () => {
        clearTimeout(animationTimer)
        clearTimeout(redirectTimer)
      }
    } catch (error) {
      console.error('Error:', error) // Debug log
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
      setIsLoading(false)
    }
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

  const renderAnimation = () => {
    console.log('Rendering animation, showAnimation:', showAnimation) // Debug log
    console.log('Secret destruction_animation:', secret?.destruction_animation) // Debug log
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
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>View Secret</CardTitle>
          <CardDescription>
            {secret?.has_passphrase 
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
          ) : secret?.has_passphrase ? (
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