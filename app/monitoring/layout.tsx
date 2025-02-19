import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Task Monitoring Dashboard',
  description: 'Monitor task execution status, trends, and logs'
}

export default function MonitoringLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
} 