import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../components/ui/use-toast'

export function useAutoLogout() {
  const navigate = useNavigate()
  const { toast } = useToast()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) return

    // Set up auto-logout timer (60 minutes)
    const timeoutId = setTimeout(() => {
      // Clear token and user data
      localStorage.removeItem('token')
      localStorage.removeItem('user')

      toast({
        title: 'Session Expired',
        description: 'You have been logged out due to inactivity',
        variant: 'destructive',
      })

      navigate('/login')
    }, 60 * 60 * 1000) // 60 minutes in milliseconds

    // Clean up timer on unmount
    return () => clearTimeout(timeoutId)
  }, [navigate, toast])
} 