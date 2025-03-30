import { useEffect, useState } from 'react'

export function ExplodeAnimation() {
  const [particles, setParticles] = useState([])

  useEffect(() => {
    // Create 100 particles with random positions and velocities
    const newParticles = Array.from({ length: 100 }, () => ({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
      vx: (Math.random() - 0.5) * 30,
      vy: (Math.random() - 0.5) * 30,
      size: Math.random() * 15 + 5,
      opacity: 1,
      color: Math.random() > 0.5 ? 'bg-blue-500' : 'bg-purple-500',
    }))

    setParticles(newParticles)

    // Animate particles
    let frame
    const animate = () => {
      setParticles(prevParticles =>
        prevParticles.map(particle => ({
          ...particle,
          x: particle.x + particle.vx,
          y: particle.y + particle.vy,
          opacity: particle.opacity - 0.01,
        })).filter(particle => particle.opacity > 0)
      )

      frame = requestAnimationFrame(animate)
    }

    frame = requestAnimationFrame(animate)

    // Cleanup
    return () => {
      cancelAnimationFrame(frame)
    }
  }, [])

  return (
    <div className="fixed inset-0 pointer-events-none bg-black/50">
      {particles.map((particle, index) => (
        <div
          key={index}
          className={`absolute rounded-full ${particle.color} blur-sm`}
          style={{
            left: particle.x,
            top: particle.y,
            width: particle.size,
            height: particle.size,
            opacity: particle.opacity,
            transform: 'translate(-50%, -50%)',
            boxShadow: '0 0 20px rgba(59, 130, 246, 0.5)',
          }}
        />
      ))}
    </div>
  )
} 