import React, { useState, useRef, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Input } from "./input"

const OTPInput = React.forwardRef(({ 
  length = 6, 
  value = "", 
  onChange,
  disabled = false,
  className,
  ...props 
}, ref) => {
  const [otp, setOtp] = useState(new Array(length).fill(""))
  const inputRefs = useRef([])

  useEffect(() => {
    if (value) {
      setOtp(value.split("").concat(new Array(length - value.length).fill("")))
    }
  }, [value, length])

  const focusNextInput = (index) => {
    if (index < length - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const focusPrevInput = (index) => {
    if (index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace") {
      e.preventDefault()
      if (otp[index]) {
        const newOtp = [...otp]
        newOtp[index] = ""
        setOtp(newOtp)
        onChange?.(newOtp.join(""))
      } else {
        focusPrevInput(index)
      }
    }
  }

  const handleChange = (e, index) => {
    const value = e.target.value
    if (value.length > 1) {
      // Handle paste
      const pastedData = value.slice(0, length)
      const newOtp = [...otp]
      for (let i = 0; i < pastedData.length; i++) {
        if (index + i < length) {
          newOtp[index + i] = pastedData[i]
        }
      }
      setOtp(newOtp)
      onChange?.(newOtp.join(""))
      inputRefs.current[Math.min(index + pastedData.length, length - 1)]?.focus()
    } else if (value.length === 1) {
      // Handle single character input
      const newOtp = [...otp]
      newOtp[index] = value
      setOtp(newOtp)
      onChange?.(newOtp.join(""))
      focusNextInput(index)
    }
  }

  return (
    <div 
      className={cn(
        "flex gap-2 items-center justify-center",
        className
      )} 
      {...props}
    >
      {otp.map((digit, index) => (
        <Input
          key={index}
          ref={el => inputRefs.current[index] = el}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={length}
          value={digit}
          disabled={disabled}
          onChange={(e) => handleChange(e, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          className={cn(
            "w-10 h-12 text-center text-lg font-semibold",
            "focus:ring-2 focus:ring-offset-2 focus:ring-primary",
            "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          )}
        />
      ))}
    </div>
  )
})

OTPInput.displayName = "OTPInput"

export { OTPInput } 