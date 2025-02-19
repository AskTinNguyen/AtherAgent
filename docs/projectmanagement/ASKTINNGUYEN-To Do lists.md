//TODO lists Today Feb 16 2025

TOP PRIORITY FOR TIN
- [X] UI Cleanup for Search Results & Research Views
- [X] Clean up minor bugs
- [X] Fix AI Streaming Issues
- [X] Complete Supabase CLI Foundation Setup. See [SUPABASE_IMPLEMENTATION.md](./SUPABASE_IMPLEMENTATION.md)
- [ ] Update the [database.ts](../lib/types/database.ts) to include the new fields for the research_sessions table and other tables. Add helper functions to help with the data passing to Supabase.
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
- [ ] Fix Search Results so it doesn't spam the Terminal with the search results
- [X] check onFinish function in chat.tsx to see why AI response content does not get passed to the Supabase DB until user refreshes the page.
- [X] CHECK [Research Sessions DB](../SQL_Create_research_sessions_db.md) to see if the research_sessions table is properly created to track all the URLs across all the research sessions and link them to the chat_messages table.


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