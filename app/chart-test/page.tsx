'use client'

import ChartMessage from '@/components/chart-message'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChatChartMessage } from '@/lib/types/chart'
import { useState } from 'react'

// Sample chart messages to test different scenarios
const testMessages: ChatChartMessage[] = [
  // Basic bar chart (static data)
  {
    type: 'chart',
    role: 'assistant',
    content: 'Here\'s a simple bar chart:',
    data: {
      type: 'bar',
      title: 'Basic Bar Chart',
      labels: ['A', 'B', 'C', 'D'],
      datasets: [{
        label: 'Values',
        data: [10, 20, 30, 40],
        borderColor: '#4CAF50',
        backgroundColor: 'rgba(76, 175, 80, 0.1)'
      }]
    }
  },
  // Line chart with multiple datasets (static data)
  {
    type: 'chart',
    role: 'assistant',
    content: 'Here\'s a line chart with multiple datasets:',
    data: {
      type: 'line',
      title: 'Multi-Dataset Line Chart',
      labels: ['Jan', 'Feb', 'Mar', 'Apr'],
      datasets: [
        {
          label: 'Dataset 1',
          data: [10, 20, 15, 25],
          borderColor: '#2196F3',
          backgroundColor: 'rgba(33, 150, 243, 0.1)'
        },
        {
          label: 'Dataset 2',
          data: [20, 15, 25, 30],
          borderColor: '#F44336',
          backgroundColor: 'rgba(244, 67, 54, 0.1)'
        }
      ]
    }
  },
  // Simulated raw LLM output (exactly as it would come from the AI)
  {
    type: 'chart',
    role: 'assistant',
    content: `Let me create a visualization of the data.

<chart_data>
{
  "type": "bar",
  "title": "Sample Metrics",
  "labels": ["Q1", "Q2", "Q3", "Q4"],
  "datasets": [
    {
      "label": "Revenue",
      "data": [100, 120, 150, 180],
      "borderColor": "#2196F3",
      "backgroundColor": "rgba(33, 150, 243, 0.1)"
    }
  ]
}
</chart_data>

As we can see from the chart above, there's a steady increase in revenue across all quarters.`,
    data: {
      type: 'bar',
      title: 'Sample Metrics',
      labels: ['Q1', 'Q2', 'Q3', 'Q4'],
      datasets: [{
        label: 'Revenue',
        data: [100, 120, 150, 180],
        borderColor: '#2196F3',
        backgroundColor: 'rgba(33, 150, 243, 0.1)'
      }]
    }
  },
  // Simulated LLM output with minimal styling (testing defaults)
  {
    type: 'chart',
    role: 'assistant',
    content: `Here's another visualization:

<chart_data>
{
  "type": "bar",
  "title": "Minimal Styling Test",
  "labels": ["A", "B", "C"],
  "datasets": [
    {
      "label": "Basic Data",
      "data": [10, 20, 30]
    }
  ]
}
</chart_data>

This chart uses default styling.`,
    data: {
      type: 'bar',
      title: 'Minimal Styling Test',
      labels: ['A', 'B', 'C'],
      datasets: [{
        label: 'Basic Data',
        data: [10, 20, 30]
      }]
    }
  }
]

export default function ChartTest() {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [showRawData, setShowRawData] = useState(false)
  
  return (
    <div className="container mx-auto p-4 space-y-4">
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Chart Test Environment</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 mb-2">
            Test different chart scenarios including static data, multiple datasets, and simulated LLM output.
          </p>
          <div className="flex justify-between items-center">
            <div className="space-x-2">
              {testMessages.map((_, index) => (
                <button
                  key={index}
                  className={`px-4 py-2 rounded ${
                    selectedIndex === index ? 'bg-blue-500 text-white' : 'bg-gray-200'
                  }`}
                  onClick={() => setSelectedIndex(index)}
                >
                  Test {index + 1}
                </button>
              ))}
            </div>
            <button
              className="px-4 py-2 rounded bg-gray-200"
              onClick={() => setShowRawData(!showRawData)}
            >
              {showRawData ? 'Hide Raw Data' : 'Show Raw Data'}
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Render the selected chart message */}
      <ChartMessage message={testMessages[selectedIndex]} />

      {/* Show raw data for debugging */}
      {showRawData && (
        <Card>
          <CardHeader>
            <CardTitle>Raw Message Data</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 p-4 rounded overflow-auto">
              {JSON.stringify(testMessages[selectedIndex], null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 