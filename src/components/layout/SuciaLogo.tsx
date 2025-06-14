import React from 'react'
import Image from 'next/image'

interface SuciaLogoProps {
  size?: 'small' | 'medium' | 'large'
  variant?: 'default' | 'white' | 'dark'
  className?: string
  showText?: boolean
}

const sizeMap = {
  small: { width: 32, height: 32 },
  medium: { width: 48, height: 48 },
  large: { width: 64, height: 64 }
}

export default function SuciaLogo({ 
  size = 'medium', 
  variant = 'default',
  className = '',
  showText = true 
}: SuciaLogoProps) {
  const { width, height } = sizeMap[size]
  
  // Determine logo source based on size
  const logoSrc = size === 'small' ? '/images/sucia-logo-small.png' : '/images/sucia-logo.png'
  
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <Image
        src={logoSrc}
        alt="Sucia NYC Logo"
        width={width}
        height={height}
        className="object-contain"
        priority
      />
      {showText && (
        <span className={`font-display font-bold ${
          size === 'small' ? 'text-lg' : 
          size === 'medium' ? 'text-xl' : 
          'text-2xl'
        } ${
          variant === 'white' ? 'text-white' :
          variant === 'dark' ? 'text-gray-900' :
          'text-gray-900 dark:text-white'
        }`}>
          Sucia NYC
        </span>
      )}
    </div>
  )
} 