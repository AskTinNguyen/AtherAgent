'use client'

import { ChartDataProcessor, ProcessedChartData } from '@/lib/services/chart-processor'
import { cn } from '@/lib/utils'
import {
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
  PointElement,
  Title,
  Tooltip
} from 'chart.js'
import { memo, useEffect, useMemo, useRef, useState } from 'react'

// Register Chart.js components immediately
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  LineController,
  BarElement,
  BarController,
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
      return processor.formatForChartType(processedData, type)
    } catch (err) {
      console.error('Error formatting chart data:', err)
      setError('Failed to format chart data')
      return null
    }
  }, [processedData, type, processor])

  // Initialize chart instance
  const initChart = async () => {
    if (!chartRef.current || !formattedData) return

    try {
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
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: formattedData.datasets[0]?.label || 'Value'
              }
            },
            x: {
              title: {
                display: true,
                text: 'Hotels'
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
      chartInstance.current.data = formattedData
      chartInstance.current.update('none') // Use 'none' mode for smoother updates
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

    if (!isInitialized) {
      initChart()
    } else {
      updateChart()
    }
  }, [formattedData, isInitialized])

  if (error) {
    return (
      <div className={cn('relative w-full h-[300px] flex items-center justify-center text-red-500', className)}>
        {error}
      </div>
    )
  }

  return (
    <div className={cn('relative w-full h-[300px]', className)}>
      <canvas ref={chartRef} />
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