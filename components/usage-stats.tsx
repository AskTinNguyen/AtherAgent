import { UserUsage } from '@/lib/types/usage'
import { formatNumber } from '@/lib/utils'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UsageStats({ open, onOpenChange }: Props) {
  const [usage, setUsage] = useState<UserUsage | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      fetchUsage()
    }
  }, [open])

  const fetchUsage = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/usage')
      if (!response.ok) throw new Error('Failed to fetch usage data')
      const data = await response.json()
      setUsage(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>API Usage Statistics</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center p-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
          </div>
        ) : error ? (
          <div className="text-red-500 p-4">{error}</div>
        ) : !usage ? (
          <div className="text-gray-500 p-4">No usage data available</div>
        ) : (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Total Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm font-medium text-gray-500">
                      Prompt Tokens
                    </div>
                    <div className="text-2xl font-bold">
                      {formatNumber(usage.totalUsage.promptTokens)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-500">
                      Completion Tokens
                    </div>
                    <div className="text-2xl font-bold">
                      {formatNumber(usage.totalUsage.completionTokens)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-500">
                      Total Tokens
                    </div>
                    <div className="text-2xl font-bold">
                      {formatNumber(usage.totalUsage.totalTokens)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              {Object.values(usage.modelUsage).map(modelUsage => (
                <Card key={modelUsage.model}>
                  <CardHeader>
                    <CardTitle>{modelUsage.model}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <div className="text-sm font-medium text-gray-500">
                          Prompt Tokens
                        </div>
                        <div className="text-xl font-bold">
                          {formatNumber(modelUsage.totalUsage.promptTokens)}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-500">
                          Completion Tokens
                        </div>
                        <div className="text-xl font-bold">
                          {formatNumber(modelUsage.totalUsage.completionTokens)}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-500">
                          Total Tokens
                        </div>
                        <div className="text-xl font-bold">
                          {formatNumber(modelUsage.totalUsage.totalTokens)}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
} 