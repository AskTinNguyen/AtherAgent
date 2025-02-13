## SpecStory

## Adding Main Page Text in Code (2/10/2025, 9:06:13 AM)

_**User**_

where is the Main Page text?

---

_**Assistant**_

Looking at the `app/page.tsx`, I notice that there isn't any main page text or heading visible. The page currently has a background image, a `BlurReveal` component, and a `Chat` component, but no main text or title.

If you'd like to add a main heading or text, here's how you could modify the code:

```typescript:app/page.tsx
// ... existing code ...
<main className="relative h-[calc(100vh-4rem)] mt-16 flex flex-col items-center">
  <div className="flex-1 flex flex-col items-center justify-center w-full">
    <h1 className="text-4xl font-bold mb-4">Welcome to Dice Chat</h1>
    <p className="text-lg text-gray-200 mb-8">Your AI-powered chat companion</p>
    <BlurReveal />
  </div>
  <div className="w-full max-w-4xl mb-8 px-4">
    <Chat id={id} />
  </div>
</main>
// ... existing code ...
```

This adds:
1. A main heading (`h1`) with "Welcome to Dice Chat" (you can change this text)
2. A subtitle paragraph with descriptive text
3. Both are placed above the `BlurReveal` component in a flex column layout

Feel free to adjust the text content and styling classes to match your design preferences!

---



---

