import { useState, useEffect, useRef } from 'react'
import { Progress } from "@/components/ui/progress"

export default function BurnTimer({ onBurnStart }) {
  const [progress, setProgress] = useState(100)
  const startTimeRef = useRef(null)
  const frameRef = useRef(null)
  const hasStartedBurn = useRef(false)
  const BURN_TIME = 5000 // 5 seconds in milliseconds

  useEffect(() => {
    // Reset refs and state
    startTimeRef.current = null
    hasStartedBurn.current = false
    setProgress(100)

    const animate = (currentTime) => {
      if (!startTimeRef.current) {
        startTimeRef.current = currentTime
      }

      const elapsed = currentTime - startTimeRef.current
      const remaining = Math.max(0, BURN_TIME - elapsed)
      const progressValue = (remaining / BURN_TIME) * 100
      
      setProgress(progressValue)

      if (remaining > 0) {
        frameRef.current = requestAnimationFrame(animate)
      } else if (!hasStartedBurn.current) {
        hasStartedBurn.current = true
        onBurnStart?.()
      }
    }

    // Start the animation
    frameRef.current = requestAnimationFrame(animate)

    // Cleanup function
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current)
      }
      // Reset state on unmount
      setProgress(100)
      startTimeRef.current = null
      hasStartedBurn.current = false
    }
  }, [onBurnStart]) // Only re-run if onBurnStart changes

  return (
    <div className="absolute top-0 left-0 right-0">
      <Progress 
        value={progress} 
        className="h-1 rounded-none" 
        indicatorClassName={progress <= 20 ? "bg-red-500" : progress <= 50 ? "bg-yellow-500" : "bg-green-500"}
      />
    </div>
  )
} 