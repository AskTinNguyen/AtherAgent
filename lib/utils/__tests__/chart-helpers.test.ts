import { describe, expect, it } from '@jest/globals'
import { convertToChartData, createChartMessage, validateChatChartData } from './chart'

describe('Chart Data Processing', () => {
  const validChartData = {
    type: 'bar' as const,
    title: 'Test Chart',
    labels: ['A', 'B', 'C'],
    datasets: [{
      label: 'Test Dataset',
      data: [1, 2, 3],
      borderColor: '#000',
      backgroundColor: 'rgba(0,0,0,0.1)'
    }]
  }

  describe('validateChatChartData', () => {
    it('should validate correct chart data', () => {
      expect(validateChatChartData(validChartData)).toBe(true)
    })

    it('should reject invalid chart data', () => {
      expect(validateChatChartData({})).toBe(false)
      expect(validateChatChartData({ type: 'bar' })).toBe(false)
      expect(validateChatChartData({ ...validChartData, labels: 'not-an-array' })).toBe(false)
      expect(validateChatChartData({ 
        ...validChartData, 
        datasets: [{ ...validChartData.datasets[0], data: ['not', 'numbers'] }]
      })).toBe(false)
    })
  })

  describe('createChartMessage', () => {
    it('should create a valid chart message', () => {
      const message = createChartMessage(validChartData)
      expect(message).toBeTruthy()
      expect(message?.type).toBe('chart')
      expect(message?.role).toBe('assistant')
      expect(message?.data).toEqual(expect.objectContaining({
        type: validChartData.type,
        title: validChartData.title,
        labels: validChartData.labels
      }))
    })

    it('should handle invalid input', () => {
      expect(createChartMessage({})).toBeNull()
      expect(createChartMessage(null)).toBeNull()
      expect(createChartMessage({ type: 'invalid' })).toBeNull()
    })

    it('should apply default styles', () => {
      const bareData = {
        type: 'bar' as const,
        labels: ['A'],
        datasets: [{
          label: 'Test',
          data: [1]
        }]
      }
      const message = createChartMessage(bareData)
      expect(message?.data.datasets[0]).toEqual(expect.objectContaining({
        borderWidth: 2,
        borderColor: expect.any(String),
        backgroundColor: expect.any(String)
      }))
    })
  })

  describe('convertToChartData', () => {
    it('should convert chat chart data to Chart.js format', () => {
      const chartData = convertToChartData(validChartData)
      expect(chartData).toEqual({
        labels: validChartData.labels,
        datasets: validChartData.datasets
      })
    })

    it('should apply default styles when missing', () => {
      const bareData = {
        type: 'bar' as const,
        labels: ['A'],
        datasets: [{
          label: 'Test',
          data: [1]
        }]
      }
      const chartData = convertToChartData(bareData)
      expect(chartData.datasets[0]).toEqual(expect.objectContaining({
        borderWidth: 2,
        borderColor: expect.any(String),
        backgroundColor: expect.any(String)
      }))
    })
  })

  // Test XML processing simulation
  describe('XML Chart Data Processing', () => {
    const xmlContent = `Here's a chart:\n<chart_data>{"type":"bar","title":"Test","labels":["A","B"],"datasets":[{"label":"Test","data":[1,2]}]}</chart_data>\nMore text.`
    
    it('should extract and process chart data from XML', () => {
      const match = xmlContent.match(/<chart_data>([\s\S]*?)<\/chart_data>/)
      expect(match).toBeTruthy()
      
      if (match) {
        const data = JSON.parse(match[1])
        const message = createChartMessage(data)
        expect(message).toBeTruthy()
        expect(message?.data.labels).toEqual(['A', 'B'])
      }
    })
  })
}) 