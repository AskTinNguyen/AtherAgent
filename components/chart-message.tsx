'use client'

import ChartComponent from '@/components/ui/chart'
import type { ChatChartMessage } from '@/lib/types/chart'
import { memo, useEffect, useState } from 'react'
import { Card } from './ui/card'

interface ChartMessageProps {
  message: ChatChartMessage
}

function ChartMessageComponent({ message }: ChartMessageProps) {
  const [error, setError] = useState<string | null>(null)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Don't render anything on server
  if (!isClient) {
    return null
  }

  if (!message?.data) {
    console.error('No valid chart data found in message')
    return null
  }

  if (error) {
    return (
      <Card className="w-full max-w-2xl mx-auto my-4 p-4">
        <div className="text-red-500">
          Failed to render chart: {error}
        </div>
      </Card>
    )
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <Card className="p-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <ChartComponent
          key={JSON.stringify(message.data)} // Ensure re-render with new data
          type={message.data.type}
          data={message.data}
          options={{
            responsive: true,
            maintainAspectRatio: true,
            scales: {
              y: {
                type: 'linear',
                display: true,
                position: 'left',
                title: {
                  display: true,
                  text: message.data.datasets[0]?.label || 'Value',
                  color: message.data.datasets[0]?.borderColor
                },
                ticks: {
                  color: message.data.datasets[0]?.borderColor
                }
              }
            },
            plugins: {
              title: {
                display: true,
                text: message.data.title || '',
                font: {
                  size: 16,
                  weight: 'normal'
                },
                padding: {
                  bottom: 16
                }
              },
              legend: {
                position: 'top' as const,
                align: 'center' as const,
                labels: {
                  boxWidth: 12,
                  usePointStyle: true,
                  padding: 16
                }
              }
            }
          }}
        />
      </Card>
      {message.content && (
        <p className="mt-2 text-sm text-muted-foreground">
          {message.content}
        </p>
      )}
    </div>
  )
}

export default memo(ChartMessageComponent) 