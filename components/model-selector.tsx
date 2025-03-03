'use client'

import { Model, models } from '@/lib/types/models'
import { cookies } from '@/lib/utils/cookies'
import { isReasoningModel } from '@/lib/utils/registry'
import { Check, ChevronsUpDown, Lightbulb } from 'lucide-react'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { createModelId } from '../lib/utils'
import { Button } from './ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from './ui/command'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'

function groupModelsByProvider(models: Model[]) {
  return models.reduce((groups, model) => {
    const provider = model.provider
    if (!groups[provider]) {
      groups[provider] = []
    }
    groups[provider].push(model)
    return groups
  }, {} as Record<string, Model[]>)
}

interface ModelSelectorProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function ModelSelector({ open: controlledOpen, onOpenChange }: ModelSelectorProps = {}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  const [selectedModelId, setSelectedModelId] = useState<string>('')
  const [shortcutKey, setShortcutKey] = useState<string>('Ctrl')

  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : uncontrolledOpen
  const setOpen = (newOpen: boolean) => {
    if (isControlled) {
      onOpenChange?.(newOpen)
    } else {
      setUncontrolledOpen(newOpen)
    }
  }

  useEffect(() => {
    // Check platform on client side only
    setShortcutKey(navigator.platform.toLowerCase().includes('mac') ? '⌘' : 'Ctrl')
  }, [])

  useEffect(() => {
    const savedModel = cookies.get('selected-model')
    if (savedModel) {
      setSelectedModelId(savedModel)
    }
  }, [])

  const handleModelSelect = (id: string) => {
    setSelectedModelId(id === selectedModelId ? '' : id)
    cookies.set('selected-model', id)
    setOpen(false)
  }

  const groupedModels = groupModelsByProvider(models)
  const selectedModel = models.find(m => createModelId(m) === selectedModelId)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="text-sm rounded-full shadow-none focus:ring-0"
        >
          <div className="flex items-center space-x-1">
            {selectedModel ? (
              <>
                <Image
                  src={`/providers/logos/${selectedModel.providerId}.svg`}
                  alt={selectedModel.provider}
                  width={18}
                  height={18}
                  className="bg-white rounded-full border"
                />
                <span className="text-xs font-medium">{selectedModel.name}</span>
                {isReasoningModel(selectedModel.id) && (
                  <Lightbulb size={12} className="text-accent-blue-foreground" />
                )}
              </>
            ) : (
              <span>Select model</span>
            )}
            <kbd className="ml-1 text-[10px] text-muted-foreground hidden sm:inline-block">
              {shortcutKey} + ↑
            </kbd>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start">
        <Command>
          <CommandInput placeholder="Search models..." />
          <CommandList>
            <CommandEmpty>No model found.</CommandEmpty>
            {Object.entries(groupedModels).map(([provider, models]) => (
              <CommandGroup key={provider} heading={provider}>
                {models.map(model => {
                  const modelId = createModelId(model)
                  return (
                    <CommandItem
                      key={modelId}
                      value={modelId}
                      onSelect={handleModelSelect}
                      className="flex justify-between"
                    >
                      <div className="flex items-center space-x-2">
                        <Image
                          src={`/providers/logos/${model.providerId}.svg`}
                          alt={model.provider}
                          width={18}
                          height={18}
                          className="bg-white rounded-full border"
                        />
                        <span className="text-xs font-medium">
                          {model.name}
                        </span>
                      </div>
                      <Check
                        className={`h-4 w-4 ${
                          selectedModelId === modelId
                            ? 'opacity-100'
                            : 'opacity-0'
                        }`}
                      />
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
