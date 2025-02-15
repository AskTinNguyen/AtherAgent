#!/bin/bash

# Create new directory structure
mkdir -p app/api/v1/{auth/{[...nextauth],session},chat/{[id]/{init,validate},cleanup,init,migrate},research/suggestions/cache,folders/{[folderId]/chats,cleanup},bookmarks/{check,cleanup,verify},usage,upload}

# Move files to new locations
mv app/api/auth/[...nextauth]/route.ts app/api/v1/auth/[...nextauth]/
mv app/api/auth/session/route.ts app/api/v1/auth/session/

mv app/api/chat/[id]/init/route.ts app/api/v1/chat/[id]/init/
mv app/api/chat/[id]/validate/route.ts app/api/v1/chat/[id]/validate/
mv app/api/chat/[id]/route.ts app/api/v1/chat/[id]/
mv app/api/chat/cleanup/route.ts app/api/v1/chat/cleanup/
mv app/api/chat/init/route.ts app/api/v1/chat/init/
mv app/api/chat/migrate/route.ts app/api/v1/chat/migrate/
mv app/api/chat/route.ts app/api/v1/chat/

mv app/api/research/suggestions/cache/route.ts app/api/v1/research/suggestions/cache/
mv app/api/research/suggestions/route.ts app/api/v1/research/suggestions/

mv app/api/folders/[folderId]/chats/route.ts app/api/v1/folders/[folderId]/chats/
mv app/api/folders/cleanup/route.ts app/api/v1/folders/cleanup/
mv app/api/folders/route.ts app/api/v1/folders/

mv app/api/bookmarks/check/route.ts app/api/v1/bookmarks/check/
mv app/api/bookmarks/cleanup/route.ts app/api/v1/bookmarks/cleanup/
mv app/api/bookmarks/cleanup/verify/route.ts app/api/v1/bookmarks/cleanup/verify/
mv app/api/bookmarks/verify/route.ts app/api/v1/bookmarks/verify/
mv app/api/bookmarks/route.ts app/api/v1/bookmarks/

mv app/api/usage/route.ts app/api/v1/usage/
mv app/api/upload/route.ts app/api/v1/upload/
mv app/api/advanced-search/route.ts app/api/v1/advanced-search/

# Remove empty directories
find app/api -type d -empty -delete
