import { useEffect } from 'react'

export function FireAnimation() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden bg-black/50">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative w-96 h-96">
          {/* Fire base */}
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2">
            <div className="w-48 h-48 bg-orange-500 rounded-full blur-xl animate-pulse" />
          </div>
          
          {/* Fire particles */}
          {Array.from({ length: 30 }).map((_, i) => (
            <div
              key={i}
              className="absolute bottom-0 left-1/2"
              style={{
                transform: `translateX(${(Math.random() - 0.5) * 200}px)`,
                animation: `rise ${1 + Math.random()}s ease-in infinite`,
                animationDelay: `${Math.random() * 2}s`,
                opacity: 0,
              }}
            >
              <div
                className="w-6 h-6 bg-orange-500 rounded-full blur-sm"
                style={{
                  animation: 'glow 1s ease-out infinite',
                }}
              />
            </div>
          ))}
        </div>
      </div>
      
      <style jsx>{`
        @keyframes rise {
          0% {
            transform: translateY(0) translateX(-50%);
            opacity: 1;
          }
          100% {
            transform: translateY(-300px) translateX(-50%);
            opacity: 0;
          }
        }
        
        @keyframes glow {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          100% {
            transform: scale(0.5);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  )
} 