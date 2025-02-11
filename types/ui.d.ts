declare module '@/components/ui/tabs' {
  import { Content, List, Root, Trigger } from '@radix-ui/react-tabs'
  
  export const Tabs: typeof Root
  export const TabsList: typeof List
  export const TabsTrigger: typeof Trigger
  export const TabsContent: typeof Content
} 