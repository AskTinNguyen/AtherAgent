## SpecStory

## Next.js Font Import Optimization (2/10/2025, 8:24:30 PM)

_**User**_

is this correct?

---

_**Assistant**_

Looking at your `app/layout.tsx` file, the font imports and setup look correct, but there's a small optimization we can make. When using multiple Google Fonts in Next.js, it's recommended to specify the `display` property to control how the font is displayed during loading. This can help improve performance and prevent layout shifts.

Here's the suggested update:

```typescript:app/layout.tsx
// ... existing code ...
const fontSans = FontSans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap'
})

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '600'],
  variable: '--font-poppins',
  display: 'swap'
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap'
})
// ... existing code ...
```

The addition of `display: 'swap'` tells the browser to:
1. Initially show the fallback font
2. Swap to the custom font once it loads

This prevents invisible text during loading (FOIT - Flash of Invisible Text) and provides a better user experience. The rest of your font configuration looks correct with proper subsetting and variable font setup.

---



---

