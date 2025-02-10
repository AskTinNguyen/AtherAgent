import type { ChartData, ChartType } from 'chart.js'

// Types for chat messages containing chart data
export interface ChatChartData {
  type: ChartType
  title?: string
  labels: string[]
  datasets: Array<{
    label: string
    data: number[]
    borderColor?: string
    backgroundColor?: string
    borderWidth?: number
  }>
}

export interface ChatChartMessage {
  type: 'chart'
  role: 'assistant'
  content: string
  data: ChatChartData
}

// Helper function to convert ChatChartData to Chart.js ChartData
export function convertToChartData(data: ChatChartData): ChartData {
  return {
    labels: data.labels,
    datasets: data.datasets.map(dataset => ({
      ...dataset,
      borderWidth: dataset.borderWidth || 2,
      backgroundColor: dataset.backgroundColor || 'rgba(76, 175, 80, 0.1)',
      borderColor: dataset.borderColor || '#4CAF50'
    }))
  }
}

// Helper function to create a chart message from raw data
export function createChartMessage(rawData: any): ChatChartMessage | null {
  try {
    if (!validateChatChartData(rawData)) {
      console.error('Invalid chart data:', rawData)
      return null
    }

    return {
      type: 'chart',
      role: 'assistant',
      content: '',
      data: {
        type: rawData.type,
        title: rawData.title,
        labels: rawData.labels,
        datasets: rawData.datasets.map(dataset => ({
          label: dataset.label,
          data: dataset.data,
          borderColor: dataset.borderColor || '#4CAF50',
          backgroundColor: dataset.backgroundColor || 'rgba(76, 175, 80, 0.1)',
          borderWidth: dataset.borderWidth || 2
        }))
      }
    }
  } catch (error) {
    console.error('Error creating chart message:', error)
    return null
  }
}

// Type for dataset validation
interface DatasetToValidate {
  label: string
  data: unknown[]
}

// Enhanced validation function
export function validateChatChartData(data: any): data is ChatChartData {
  if (!data || 
      !data.type ||
      !Array.isArray(data.labels) || 
      !Array.isArray(data.datasets)) return false

  return data.datasets.every((dataset: DatasetToValidate) => 
    typeof dataset.label === 'string' &&
    Array.isArray(dataset.data) &&
    dataset.data.every((value: unknown) => typeof value === 'number')
  )
}