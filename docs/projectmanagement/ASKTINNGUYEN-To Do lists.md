//TODO lists Today Feb 16 2025

TOP PRIORITY FOR TIN
- [X] UI Cleanup for Search Results & Research Views
- [X] Clean up minor bugs
- [X] Fix AI Streaming Issues
- [X] Complete Supabase CLI Foundation Setup. See [SUPABASE_IMPLEMENTATION.md](./SUPABASE_IMPLEMENTATION.md)
- [X] Update the [database.ts](../lib/types/database.ts) to include the new fields for the research_sessions table and other tables. Add helper functions to help with the data passing to Supabase.
- [X] Fix Search Results to render properly by calling from Supabase DB
               We identified that the database schema had three key tables with specific relationships:
               research_sessions (with id as primary key)
               chat_messages (with research_session_id as foreign key)
               sources (with session_id linking to research_sessions)
               2. The main issue was that we were initially trying to find a non-existent chat_id column in the research_sessions table, when in fact the chatId prop we receive is already the research_session_id.
               We simplified the query by:
               Removing the unnecessary intermediate query to research_sessions
               Directly using chatId as the session_id in the sources query
               Maintaining the proper ordering by relevance
               This solution is more efficient as it:
               Reduces database queries from two to one
               Eliminates potential points of failure
               Maintains proper data relationships as designed in the schema
- [X] Fix Search Results so it doesn't spam the Terminal with the search results
- [X] check onFinish function in chat.tsx to see why AI response content does not get passed to the Supabase DB until user refreshes the page.
- [X] CHECK [Research Sessions DB](../SQL_Create_research_sessions_db.md) to see if the research_sessions table is properly created to track all the URLs across all the research sessions and link them to the chat_messages table.
- [ ] Upgrade the Supabase DB to include the saving of Images Uploaded by the User. Consider compression.

HIGH PRIORITY FOR TIN
- [X] Research Suggestions: fix the default "depth_exploration" place holder prompt in the research-suggestions.tsx
- [ ] review SessionProvider.tsx to see if the session provider is properly set up to handle the session state between NextAuth and Supabase
- [ ] Refactor require-ath.tsx later

MEDIUM PRIORITY ->  TO OTHER ENGINEERS?

- [X] Fix the "Research" page including Path Visualization
- [ ] Add Drag URL to the Bookmarked Articles
- [ ] Add a Create new Research based on a Bookmarked Article


LOW PRIOIRTY -> TO OTHER ENGINEERS
- [ ] Add the cron job to send Research Updates to the User over MCP like Slack or Telegram
- [ ] Fix API Statistics
- [ ] Add the "Settings" page
- [ ] Add the click to navigate to External Links of the Bookmarked Articles
- [ ] Add a Create new Deep Research based on a Booked Article


QUALITY OF LIFE UIUX IMPROVEMENTS
https://github.com/olliethedev/dnd-dashboard
https://craft.mxkaske.dev/

For User Avatars ⭐⭐⭐⭐⭐
https://www.kibo-ui.com/avatar-stack

For Gantt Chart ⭐⭐⭐
https://www.kibo-ui.com/gantt

For announcement ⭐⭐⭐
https://www.kibo-ui.com/announcement

FOr nice horizontal carousel Circle Images
https://www.kibo-ui.com/marquee

Color Picker
https://www.kibo-ui.com/color-picker

Linear style dropdown combo box
https://github.com/damianricobelli/shadcn-linear-combobox

Timeline combo
https://timdehof.github.io/shadcn-timeline/?path=/docs/components-timeline--docs

Dynamic Table Builder Kit
https://shadcn-table-maker.vercel.app/

Simple Timeline Chart 
https://timeline.rilcy.app/

Simple BottomDrawer ⭐⭐⭐⭐
https://vaul.emilkowal.ski/

Notion-like Writting Block UI Component with AI Recommendation
https://github.com/steven-tey/novel

Sparkling Grid Background Animation ⭐⭐⭐⭐⭐
https://www.uibeats.com/docs/background/sparkling-grid

Shimmering Shining Effect Background Animation ⭐⭐⭐⭐⭐
https://www.uibeats.com/docs/component/shimmer-effect

Tool State Management
   - [ ] Add tool call tracking
   - [ ] Implement tool result handling
   - [ ] Support concurrent tool calls

Tool Analytics - langfuse 
   - [ ] Add tool usage tracking
   - [ ] Implement tool performance metrics
   - [ ] Support tool debugging