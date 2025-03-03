/* eslint-disable @next/next/no-img-element */
'use client'

import { Card, CardContent } from '@/components/ui/card'
import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious
} from '@/components/ui/carousel'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { type SearchImage } from '@/lib/types/search'
import { PlusCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { SearchResultsImageSkeleton } from './skeletons'

interface SearchResultsImageSectionProps {
  images: SearchImage[]
  query?: string
  isLoading?: boolean
}

export function SearchResultsImageSection({ images, query, isLoading = false }: SearchResultsImageSectionProps) {
  const [api, setApi] = useState<CarouselApi>()
  const [current, setCurrent] = useState(1)
  const [count, setCount] = useState(0)
  const [selectedIndex, setSelectedIndex] = useState(0)

  // Update the current and count state when the carousel api is available
  useEffect(() => {
    if (api) {
      setCount(api.scrollSnapList().length)
      setCurrent(api.selectedScrollSnap() + 1)

      api.on('select', () => {
        setCurrent(api.selectedScrollSnap() + 1)
      })
    }
  }, [api])

  // Scroll to the selected index
  useEffect(() => {
    if (api) {
      api.scrollTo(selectedIndex, true)
    }
  }, [api, selectedIndex])

  if (isLoading) {
    return <SearchResultsImageSkeleton />
  }

  if (!images || images.length === 0) {
    return <div className="text-muted-foreground">No images found</div>
  }

  return (
    <div className="flex flex-wrap gap-2">
      {images.slice(0, 4).map((image, index) => (
        <Dialog key={`${image.url}-${index}`}>
          <DialogTrigger asChild>
            <div
              className="w-[calc(50%-0.5rem)] md:w-[calc(25%-0.5rem)] aspect-video cursor-pointer relative"
              onClick={() => setSelectedIndex(index)}
            >
              <Card className="flex-1 h-full">
                <CardContent className="p-2 h-full w-full">
                  {image ? (
                    <img
                      src={image.thumbnail || image.url}
                      alt={image.title || `Image ${index + 1}`}
                      className="h-full w-full object-cover"
                      onError={e => {
                        // If thumbnail fails, try the main URL
                        if (e.currentTarget.src === image.thumbnail) {
                          e.currentTarget.src = image.url
                        } else {
                          e.currentTarget.src = '/images/placeholder-image.png'
                      }
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-muted animate-pulse" />
                  )}
                </CardContent>
              </Card>
              {index === 3 && images.length > 4 && (
                <div className="absolute inset-0 bg-black/30 rounded-md flex items-center justify-center text-white/80 text-sm">
                  <PlusCircle size={24} />
                </div>
              )}
            </div>
          </DialogTrigger>
          <DialogContent className="sm:max-w-3xl max-h-[80vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>{image.title || 'Search Image'}</DialogTitle>
              {(query || image.description) && (
                <DialogDescription className="text-sm">
                  {image.description || query}
                </DialogDescription>
              )}
            </DialogHeader>
            <div className="py-4">
              <Carousel
                setApi={setApi}
                className="w-full bg-muted max-h-[60vh]"
              >
                <CarouselContent>
                  {images.map((img, idx) => (
                    <CarouselItem key={`${img.url}-${idx}`}>
                      <div className="p-1 flex items-center justify-center h-full">
                        <img
                          src={img.url}
                          alt={img.title || `Image ${idx + 1}`}
                          className="h-auto w-full object-contain max-h-[60vh]"
                          onError={e =>
                            (e.currentTarget.src =
                              '/images/placeholder-image.png')
                          }
                        />
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <div className="absolute inset-8 flex items-center justify-between p-4">
                  <CarouselPrevious className="w-10 h-10 rounded-full shadow focus:outline-none">
                    <span className="sr-only">Previous</span>
                  </CarouselPrevious>
                  <CarouselNext className="w-10 h-10 rounded-full shadow focus:outline-none">
                    <span className="sr-only">Next</span>
                  </CarouselNext>
                </div>
              </Carousel>
              <div className="py-2 text-center text-sm text-muted-foreground">
                {current} of {count}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      ))}
    </div>
  )
}
