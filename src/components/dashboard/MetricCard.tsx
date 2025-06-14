import React from 'react'
import { LucideIcon } from 'lucide-react'

interface MetricCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  iconColor?: string
  isLoading?: boolean
  trend?: {
    value: number
    isPositive: boolean
  }
}

export default function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = 'text-primary-600 dark:text-primary-400',
  isLoading = false,
  trend
}: MetricCardProps) {
  return (
    <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-sm dark:shadow-lg p-6 border border-neutral-200 dark:border-neutral-700 transition-all duration-200 hover:shadow-md dark:hover:shadow-xl hover:border-neutral-300 dark:hover:border-neutral-600">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1 transition-colors">
            {title}
          </p>
          
          {isLoading ? (
            <div className="animate-pulse">
              <div className="h-8 bg-neutral-200 dark:bg-neutral-700 rounded w-20 mb-2"></div>
              {subtitle && <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-16"></div>}
            </div>
          ) : (
            <>
              <div className="flex items-baseline space-x-2">
                <p className="text-2xl font-bold text-neutral-900 dark:text-white transition-colors">
                  {value}
                </p>
                {trend && (
                  <span className={`text-sm font-medium transition-colors ${
                    trend.isPositive 
                      ? 'text-success-600 dark:text-success-400' 
                      : 'text-error-600 dark:text-error-400'
                  }`}>
                    {trend.isPositive ? '+' : ''}{trend.value}%
                  </span>
                )}
              </div>
              
              {subtitle && (
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 transition-colors">
                  {subtitle}
                </p>
              )}
            </>
          )}
        </div>
        
        <div className="p-3 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/30 dark:to-primary-800/30 transition-colors">
          <Icon className={`w-6 h-6 ${iconColor} transition-colors`} />
        </div>
      </div>
    </div>
  )
} 