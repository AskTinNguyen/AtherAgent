import { ChatChartData, ChatChartMessage } from '../types/chart'

const CHART_DATA_REGEX = /<chart_data>([^]*?)<\/chart_data>/

export interface LLMChartResponse {
  type: string
  role: string
  content: string
  data: ChatChartData
}

export class ChartParser {
  /**
   * Extracts chart data from LLM response text
   */
  static extractChartData(text: string): ChatChartData | null {
    try {
      // If the input is already a ChatChartMessage object, extract its data
      if (typeof text === 'object' && (text as ChatChartMessage)?.data) {
        const message = text as ChatChartMessage
        console.log('Processing direct chart message:', JSON.stringify(message, null, 2))
        return this.validateAndTransformData(message.data)
      }

      // Otherwise, try to extract chart data from text
      const match = text.match(CHART_DATA_REGEX)
      if (!match) {
        console.warn('No chart data tags found in text:', text)
        return null
      }

      // Parse the JSON content
      const chartResponse = JSON.parse(match[1].trim()) as LLMChartResponse
      console.log('Parsed chart response:', JSON.stringify(chartResponse, null, 2))
      
      return this.validateAndTransformData(chartResponse.data)
    } catch (error) {
      console.error('Error parsing chart data:', error)
      console.error('Input text:', text)
      return null
    }
  }

  /**
   * Validates and transforms the chart data structure
   */
  private static validateAndTransformData(data: any): ChatChartData | null {
    try {
      if (!this.isValidChartData(data)) {
        console.error('Invalid chart data structure:', JSON.stringify(data, null, 2))
        return null
      }

      // Ensure datasets are properly formatted
      const transformedData: ChatChartData = {
        type: data.type,
        title: data.title,
        labels: data.labels,
        datasets: data.datasets.map((dataset: any) => ({
          label: dataset.label || 'Dataset',
          data: Array.isArray(dataset.data) ? dataset.data : [],
          borderColor: dataset.borderColor || '#4CAF50',
          backgroundColor: dataset.backgroundColor || 'rgba(76, 175, 80, 0.1)',
          borderWidth: dataset.borderWidth || 2
        }))
      }

      console.log('Transformed chart data:', JSON.stringify(transformedData, null, 2))
      return transformedData
    } catch (error) {
      console.error('Error transforming chart data:', error)
      return null
    }
  }

  /**
   * Validates the chart data structure
   */
  private static isValidChartData(data: any): data is ChatChartData {
    if (!data || typeof data !== 'object') {
      console.error('Data is null or not an object')
      return false
    }

    if (typeof data.type !== 'string') {
      console.error('Invalid or missing type property')
      return false
    }

    if (!Array.isArray(data.labels)) {
      console.error('Invalid or missing labels array')
      return false
    }

    if (!Array.isArray(data.datasets)) {
      console.error('Invalid or missing datasets array')
      return false
    }

    const validDatasets = data.datasets.every((dataset: any, index: number) => {
      if (typeof dataset !== 'object') {
        console.error(`Dataset ${index} is not an object:`, dataset)
        return false
      }
      
      if (typeof dataset.label !== 'string') {
        console.error(`Dataset ${index} has invalid or missing label:`, dataset)
        return false
      }
      
      if (!Array.isArray(dataset.data)) {
        console.error(`Dataset ${index} has invalid or missing data array:`, dataset)
        return false
      }
      
      const validData = dataset.data.every((value: any) => typeof value === 'number')
      if (!validData) {
        console.error(`Dataset ${index} contains non-numeric values:`, dataset.data)
        return false
      }
      
      return true
    })

    if (!validDatasets) {
      console.error('One or more datasets are invalid')
      return false
    }

    return true
  }

  /**
   * Extracts multiple chart data instances from text
   */
  static extractAllChartData(text: string): ChatChartData[] {
    const charts: ChatChartData[] = []
    let match

    // Use regex to find all chart data instances
    const regex = new RegExp(CHART_DATA_REGEX, 'g')
    while ((match = regex.exec(text)) !== null) {
      try {
        const chartResponse = JSON.parse(match[1].trim()) as LLMChartResponse
        if (this.isValidChartData(chartResponse.data)) {
          charts.push(chartResponse.data)
        }
      } catch (error) {
        console.error('Error parsing chart instance:', error)
        continue
      }
    }

    return charts
  }
} 