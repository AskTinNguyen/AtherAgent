## SpecStory

## Improving SearchDepth Toggle UI (2/10/2025, 3:29:36 PM)

_**User**_

@chat-panel.tsx Help me improve the UI Button of the SearchDepth @search-depth-toggle.tsx 

To closely follow the "Search Toggle Pill" and the "ModelSelector Pill"

---

_**Assistant**_

I'll help you improve the SearchDepthToggle UI to be more consistent with the other pill-style buttons. Let me analyze the current implementation and propose improvements.

First, let me check the current implementation of the SearchDepthToggle component.

The main changes we need to make are:
1. Update the button styling to match the pill style
2. Improve the depth indicator presentation
3. Make it more consistent with other toggle components

Here's how I'll improve the SearchDepthToggle component:

---

_****_

```diff
          <Button
            variant="outline"
-           size="icon"
            className={cn(
-             "shrink-0 rounded-full group relative",
-             enabled && "bg-primary/10"
+             "relative h-8 w-[80px] justify-start rounded-full bg-background",
+             "hover:bg-accent hover:text-accent-foreground",
+             enabled && "bg-primary/10 text-primary hover:bg-primary/20",
+             !enabled && "opacity-50 cursor-not-allowed"
            )}
            disabled={!enabled}
          >
-           <Layers className="size-4 group-hover:text-primary transition-colors" />
-           <div className="absolute -top-1 -right-1 flex items-center gap-1">
-             <span className="size-4 rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
-               {currentDepth}
-             </span>
-             <span className="text-[10px] text-muted-foreground">/{localMaxDepth}</span>
+           <div className="flex items-center gap-1.5 px-2">
+             <Layers className="size-4 shrink-0" />
+             <div className="flex items-center gap-0.5 text-xs font-medium">
+               <span className={cn(
+                 "text-foreground",
+                 enabled && "text-primary"
+               )}>{currentDepth}</span>
+               <span className="text-muted-foreground">/</span>
+               <span className="text-muted-foreground">{localMaxDepth}</span>
+             </div>
            </div>
          </Button>
```

---

_****_



I've updated the SearchDepthToggle component to match the pill style of other toggles. Here are the key improvements made:

1. Button Styling:
   - Changed from an icon button to a pill-shaped button with fixed width (80px)
   - Added consistent height (h-8) to match other toggles
   - Improved hover states with accent colors
   - Made the button layout horizontal with proper spacing

2. Depth Indicator:
   - Moved the depth numbers inside the button instead of being overlaid
   - Added proper text sizing and colors
   - Improved spacing between elements
   - Made the numbers more readable with proper font weights

3. Visual States:
   - Added proper disabled state styling
   - Improved hover interactions
   - Made the active state more consistent with other toggles
   - Added proper color transitions

4. Layout:
   - Created a horizontal layout with icon and numbers
   - Added proper padding and gaps between elements
   - Made the component more compact and aligned with other toggles

The new design is now more consistent with the other pill-style toggles in the chat panel while maintaining its functionality. The depth numbers are more readable and the overall component feels more integrated with the UI.

Would you like me to make any additional adjustments to the styling or behavior?

---



---

