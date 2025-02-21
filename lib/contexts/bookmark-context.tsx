import * as React from 'react';

interface BookmarkState {
  [url: string]: {
    isBookmarked: boolean;
    bookmarkId: string | null;
    lastChecked: number;
  }
}

interface BookmarkContextType {
  bookmarkState: BookmarkState;
  checkBookmarkStatus: (url: string) => Promise<void>;
  invalidateBookmark: (url: string) => void;
}

const BookmarkContext = React.createContext<BookmarkContextType | null>(null);

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export function BookmarkProvider({ children }: { children: React.ReactNode }) {
  const [bookmarkState, setBookmarkState] = React.useState<BookmarkState>({});
  const batchCheckTimeoutRef = React.useRef<NodeJS.Timeout>();
  const pendingChecksRef = React.useRef<Set<string>>(new Set());

  const checkBookmarkStatus = React.useCallback(async (url: string) => {
    const now = Date.now();
    const cached = bookmarkState[url];
    
    // Return if we have a valid cache
    if (cached && (now - cached.lastChecked) < CACHE_TTL) {
      return;
    }

    // Add to pending checks
    pendingChecksRef.current.add(url);

    // Clear existing timeout
    if (batchCheckTimeoutRef.current) {
      clearTimeout(batchCheckTimeoutRef.current);
    }

    // Set new timeout to batch process
    batchCheckTimeoutRef.current = setTimeout(async () => {
      const urlsToCheck = Array.from(pendingChecksRef.current);
      pendingChecksRef.current.clear();

      try {
        // Batch check all pending URLs
        const promises = urlsToCheck.map(async (u) => {
          const response = await fetch(`/api/bookmarks/check?url=${encodeURIComponent(u)}`);
          if (response.ok) {
            const data = await response.json();
            return { url: u, data };
          }
          return null;
        });

        const results = await Promise.all(promises);

        // Update state with all results
        setBookmarkState(prev => {
          const updates: BookmarkState = {};
          results.forEach(result => {
            if (result) {
              updates[result.url] = {
                isBookmarked: result.data.isBookmarked,
                bookmarkId: result.data.bookmarkId,
                lastChecked: now
              };
            }
          });
          return { ...prev, ...updates };
        });
      } catch (error) {
        console.error('Failed to check bookmark status:', error);
      }
    }, 100); // 100ms debounce
  }, [bookmarkState]);

  const invalidateBookmark = React.useCallback((url: string) => {
    setBookmarkState(prev => {
      const { [url]: _, ...rest } = prev;
      return rest;
    });
  }, []);

  const value = React.useMemo(() => ({
    bookmarkState,
    checkBookmarkStatus,
    invalidateBookmark
  }), [bookmarkState, checkBookmarkStatus, invalidateBookmark]);

  return (
    <BookmarkContext.Provider value={value}>
      {children}
    </BookmarkContext.Provider>
  );
}

export function useBookmarks() {
  const context = React.useContext(BookmarkContext);
  if (!context) {
    throw new Error('useBookmarks must be used within a BookmarkProvider');
  }
  return context;
} 