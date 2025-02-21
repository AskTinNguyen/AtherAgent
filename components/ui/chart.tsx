'use client'

import { ChartDataProcessor, ProcessedChartData } from '@/lib/services/chart-processor'
import { cn } from '@/lib/utils'
import {
  ArcElement,
  BarController,
  BarElement,
  CategoryScale,
  ChartData,
  Chart as ChartJS,
  ChartOptions,
  ChartTypeRegistry,
  Legend,
  LinearScale,
  LineController,
  LineElement,
  PieController,
  PointElement,
  Title,
  Tooltip
} from 'chart.js'
import { Check, Copy, X } from 'lucide-react'
import { memo, useEffect, useMemo, useRef, useState } from 'react'

// Add bright color palette for charts
const CHART_COLORS = {
  pie: [
    '#FF4B4B', // vibrant red
    '#4B9EFF', // bright blue
    '#FFD700', // golden yellow
    '#FF8F59', // warm orange
    '#4BFFB8', // mint green
    '#9B5DE5', // accent purple
  ]
}

// Register Chart.js components immediately
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  LineController,
  BarElement,
  BarController,
  PieController,
  ArcElement,
  Title,
  Tooltip,
  Legend
)

interface ChartProps {
  type: keyof ChartTypeRegistry
  data: ChartData
  options?: ChartOptions
  className?: string
  updateOptions?: {
    appendData?: boolean
    maxDataPoints?: number
  }
}

function BaseChartComponent({ 
  type, 
  data, 
  options, 
  className, 
  updateOptions 
}: ChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null)
  const chartInstance = useRef<ChartJS | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'error'>('idle')
  const processor = useMemo(() => ChartDataProcessor.getInstance(), [])

  // Process the incoming data
  const processedData = useMemo(() => {
    try {
      if (!chartInstance.current) {
        return processor.preprocessData(data)
      }
      return processor.updateChartData(
        chartInstance.current.data as ProcessedChartData,
        data,
        updateOptions
      )
    } catch (err) {
      console.error('Error processing chart data:', err)
      setError('Failed to process chart data')
      return null
    }
  }, [data, processor, updateOptions])

  // Format data for specific chart type
  const formattedData = useMemo(() => {
    if (!processedData) return null
    try {
      const formatted = processor.formatForChartType(processedData, type)
      if (type === 'pie') {
        return {
          ...formatted,
          datasets: formatted.datasets.map(dataset => ({
            ...dataset,
            backgroundColor: CHART_COLORS.pie,
            borderWidth: 0,
            borderColor: 'transparent',
            hoverBorderWidth: 0
          }))
        }
      }
      return formatted
    } catch (err) {
      console.error('Error formatting chart data:', err)
      setError('Failed to format chart data')
      return null
    }
  }, [processedData, type, processor])

  // Handle copying chart as image
  const handleCopyChart = async () => {
    try {
      if (!chartRef.current) return

      // Convert canvas to blob
      const blob = await new Promise<Blob>((resolve) => {
        chartRef.current?.toBlob((blob) => {
          if (blob) resolve(blob)
        }, 'image/png', 1.0)
      })

      // Create ClipboardItem and copy to clipboard
      const item = new ClipboardItem({ 'image/png': blob })
      await navigator.clipboard.write([item])
      
      // Show success status briefly
      setCopyStatus('copied')
      setTimeout(() => setCopyStatus('idle'), 2000)
    } catch (err) {
      console.error('Failed to copy chart:', err)
      setCopyStatus('error')
      setTimeout(() => setCopyStatus('idle'), 2000)
    }
  }

  // Initialize chart instance
  const initChart = async () => {
    if (!chartRef.current || !formattedData) return

    try {
      // Ensure any existing chart is destroyed first
      if (chartInstance.current) {
        chartInstance.current.destroy()
        chartInstance.current = null
      }

      const ctx = chartRef.current.getContext('2d')
      if (!ctx) {
        setError('Failed to get canvas context')
        return
      }

      // Create new chart with basic configuration
      chartInstance.current = new ChartJS(ctx, {
        type,
        data: formattedData,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          layout: {
            padding: type === 'pie' ? {
              top: 40,
              bottom: 40,
              left: 0,
              right: 0
            } : {
              top: 20,
              bottom: 20,
              left: 20,
              right: 20
            }
          },
          plugins: {
            legend: {
              position: 'top' as const,
              align: 'center' as const,
              labels: {
                padding: 20,
                color: 'rgb(55, 65, 81)', // text-gray-700
                font: {
                  size: 14
                }
              }
            },
            title: {
              display: true,
              text: formattedData.datasets[0]?.label || '',
              color: 'rgb(31, 41, 55)', // text-gray-800
              font: {
                size: 16,
                weight: 'bold'
              },
              padding: {
                top: 0,
                bottom: 20
              }
            }
          },
          scales: type === 'pie' ? {
            x: { 
              display: false,
              grid: { display: false },
              ticks: { display: false },
              border: { display: false }
            },
            y: { 
              display: false,
              grid: { display: false },
              ticks: { display: false },
              border: { display: false }
            }
          } : {
            y: {
              beginAtZero: true,
              ticks: {
                color: 'rgb(55, 65, 81)', // text-gray-700
                padding: 10
              },
              title: {
                display: true,
                text: formattedData.datasets[0]?.label || 'Value',
                color: 'rgb(31, 41, 55)' // text-gray-800
              },
              grid: {
                color: 'rgb(229, 231, 235)' // text-gray-200
              }
            },
            x: {
              ticks: {
                color: 'rgb(55, 65, 81)', // text-gray-700
                padding: 10
              },
              title: {
                display: true,
                text: 'Categories',
                color: 'rgb(31, 41, 55)' // text-gray-800
              },
              grid: {
                color: 'rgb(229, 231, 235)' // text-gray-200
              }
            }
          },
          ...options
        }
      })
      setIsInitialized(true)
    } catch (err) {
      console.error('Error initializing chart:', err)
      setError(err instanceof Error ? err.message : 'Failed to initialize chart')
    }
  }

  // Update existing chart
  const updateChart = () => {
    if (!chartInstance.current || !formattedData) return

    try {
      // Ensure data update is safe
      const currentChart = chartInstance.current
      if (currentChart.ctx && currentChart.ctx.canvas) {
        currentChart.data = formattedData
        currentChart.update('none') // Use 'none' mode for smoother updates
      }
    } catch (err) {
      console.error('Error updating chart:', err)
      setError(err instanceof Error ? err.message : 'Failed to update chart')
    }
  }

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy()
        chartInstance.current = null
        setIsInitialized(false)
      }
    }
  }, [])

  // Handle chart initialization and updates
  useEffect(() => {
    if (!formattedData) return

    // Add a small delay to ensure proper cleanup
    const timer = setTimeout(() => {
      if (!isInitialized) {
        initChart()
      } else {
        updateChart()
      }
    }, 0)

    return () => clearTimeout(timer)
  }, [formattedData, isInitialized])

  if (error) {
    return (
      <div className={cn('relative w-full h-[300px] flex items-center justify-center text-red-500', className)}>
        {error}
      </div>
    )
  }

  return (
    <div className={cn(
      'relative w-full max-w-2xl mx-auto p-6 rounded-lg',
      'flex flex-col items-center justify-center',
      'h-[400px] md:h-[500px]',
      'bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm',
      'border border-gray-200 dark:border-gray-800',
      'shadow-sm',
      className
    )}>
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={handleCopyChart}
          className={cn(
            'p-2 rounded-md transition-colors',
            'bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700',
            'text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white',
            'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900 focus:ring-gray-200 dark:focus:ring-gray-700',
            copyStatus === 'copied' && 'bg-green-100 dark:bg-green-600 hover:bg-green-200 dark:hover:bg-green-500 text-green-700 dark:text-green-100',
            copyStatus === 'error' && 'bg-red-100 dark:bg-red-600 hover:bg-red-200 dark:hover:bg-red-500 text-red-700 dark:text-red-100'
          )}
        >
          {copyStatus === 'copied' ? (
            <Check className="h-4 w-4" />
          ) : copyStatus === 'error' ? (
            <X className="h-4 w-4" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </button>
      </div>
      <canvas ref={chartRef} className="max-h-full" />
    </div>
  )
}

// Type-safe wrapper component
function ChartComponent<TType extends keyof ChartTypeRegistry>({ 
  type, 
  data, 
  options, 
  className, 
  updateOptions 
}: {
  type: TType
  data: ChartData<TType>
  options?: ChartOptions<TType>
  className?: string
  updateOptions?: {
    appendData?: boolean
    maxDataPoints?: number
  }
}) {
  return (
    <BaseChartComponent
      type={type}
      data={data as ChartData}
      options={options as ChartOptions}
      className={className}
      updateOptions={updateOptions}
    />
  )
}

export default memo(ChartComponent) 