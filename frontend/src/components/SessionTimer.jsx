import { useState, useEffect, useRef } from 'react'
import { Progress } from "@/components/ui/progress"
import { useNavigate } from 'react-router-dom'
import { useToast } from './ui/use-toast'

export default function SessionTimer() {
  const [timeLeft, setTimeLeft] = useState(0)
  const [progress, setProgress] = useState(100)
  const navigate = useNavigate()
  const { toast } = useToast()
  const timerRef = useRef(null)
  const TOTAL_TIME = 60 // 1 minute in seconds

  useEffect(() => {
    const tokenExpiresAt = localStorage.getItem('tokenExpiresAt')
    if (!tokenExpiresAt) return

    const calculateTimeLeft = () => {
      const expiresAt = new Date(tokenExpiresAt)
      const now = new Date()
      const diff = Math.max(0, Math.floor((expiresAt - now) / 1000)) // difference in seconds
      return diff
    }

    // Get initial time left
    const initialTimeLeft = calculateTimeLeft()
    if (initialTimeLeft <= 0) {
      // Token is already expired
      handleExpiration()
      return
    }

    // Set initial state
    setTimeLeft(initialTimeLeft)
    setProgress((initialTimeLeft / TOTAL_TIME) * 100) // 60 seconds = 1 minute

    // Clear any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }

    // Start the timer
    timerRef.current = setInterval(() => {
      const remaining = calculateTimeLeft()
      setTimeLeft(remaining)
      setProgress((remaining / TOTAL_TIME) * 100)

      if (remaining <= 0) {
        handleExpiration()
      }
    }, 1000)

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [navigate, toast])

  const handleExpiration = () => {
    // Clear the timer
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }

    // Clear session data
    localStorage.removeItem('token')
    localStorage.removeItem('tokenExpiresAt')
    
    // Show toast notification
    toast({
      title: "Session Expired",
      description: "Your session has expired. Please log in again.",
      variant: "destructive",
    })
    
    // Redirect to login page
    navigate('/login')
  }

  return (
    <Progress 
      value={progress} 
      className="h-1 rounded-none" 
      indicatorClassName={progress <= 20 ? "bg-red-500" : progress <= 50 ? "bg-yellow-500" : "bg-green-500"}
    />
  )
} 