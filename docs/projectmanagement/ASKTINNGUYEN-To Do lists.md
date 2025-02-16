//TODO lists Today Feb 16 2025

TOP PRIORITY FOR TIN
- [X] UI Cleanup for Search Results & Research Views
- [X] Clean up minor bugs
- [X] Fix AI Streaming Issues
- [X] Complete Supabase CLI Foundation Setup. See [SUPABASE_IMPLEMENTATION.md](./SUPABASE_IMPLEMENTATION.md)
- [ ] Update the [database.ts](../lib/types/database.ts) to include the new fields for the research_sessions table and other tables. Add helper functions to help with the data passing to Supabase.
- [ ] Fix Search Results to render properly and doesn't spam the Terminal with the search results
- [ ] check onFinish function in chat.tsx to see why AI response content does not get passed to the Supabase DB until user refreshes the page.
- [ ] CHECK [Research Sessions DB](../SQL_Create_research_sessions_db.md) to see if the research_sessions table is properly created to track all the URLs across all the research sessions and link them to the chat_messages table.


HIGH PRIORITY FOR TIN
- [ ] Research Suggestions: fix the default "depth_exploration" place holder prompt in the research-suggestions.tsx



MEDIUM PRIORITY ->  TO OTHER ENGINEERS?

- [ ] Fix the "Research" page including Path Visualization
- [ ] Add Drag URL to the Bookmarked Articles
- [ ] Add a Create new Deep Research based on a Booked Article


LOW PRIOIRTY -> TO OTHER ENGINEERS
- [ ] Add the cron job to send Research Updates to the User over MCP like Slack or Telegram
- [ ] Fix API Statistics
- [ ] Add the "Settings" page
- [ ] Add the click to navigate to External Links of the Bookmarked Articles
- [ ] Add a Create new Deep Research based on a Booked Article


1. **Protocol Implementation**
   - [ ] Add streaming tool call support
   - [ ] Implement tool call state management
   - [ ] Support streaming results

2. **Tool State Management**
   - [ ] Add tool call tracking
   - [ ] Implement tool result handling
   - [ ] Support concurrent tool calls

3. **Tool Analytics**
   - [ ] Add tool usage tracking
   - [ ] Implement tool performance metrics
   - [ ] Support tool debugging