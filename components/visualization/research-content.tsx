'use client'

import { type ResearchActivity, type ResearchSource } from '../deep-research-provider'
import { ActivityItem } from './activity-item'
import { SourceItem } from './source-item'

interface ResearchContentProps {
  activity: ResearchActivity[]
  sources: ResearchSource[]
}

export function ResearchContent({ activity, sources }: ResearchContentProps) {
  return (
    <div className="space-y-4 p-4">
      {/* Activity Section */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium mb-2">Research Activity</h3>
        {activity.map((item, index) => (
          <ActivityItem key={index} activity={item} />
        ))}
      </div>

      {/* Sources Section */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium mb-2">Sources</h3>
        {sources.map((source, index) => (
          <SourceItem key={index} source={source} />
        ))}
      </div>
    </div>
  )
} 