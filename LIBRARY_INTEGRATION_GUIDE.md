# Library Auto-Save Integration Guide

## Overview
All ProCreators tools should automatically save generated content to the user's Library. Content is organized by type (Text, Images, Videos) and automatically expires after **30 days**.

## Quick Start

### For Frontend Tools (Client-Side)

```javascript
import { saveToLibrary } from '@/lib/library-utils'

// After generating content, save it to library
const result = await saveToLibrary({
  type: 'story-reel',           // Tool identifier
  category: 'video',            // 'video', 'image', or 'text'
  title: 'My Video Title',
  description: 'Short description',
  videoUrl: '/story-reels/abc.mp4',  // For videos
  fileSize: 1234567,            // Optional: file size in bytes
  metadata: {                   // Optional: any additional data
    duration: 30,
    resolution: '1080p'
  }
})

if (result.success) {
  console.log('✅ Saved to library!')
}
```

### For Backend API Routes (Server-Side)

```javascript
import { getCollection } from '@/lib/mongodb'
import { randomUUID } from 'crypto'

// Inside your API route
const libraryCollection = await getCollection('library')

// Create TTL index (only needs to run once, but safe to call multiple times)
await libraryCollection.createIndex(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 }
)

// Calculate expiration date (30 days)
const expiresAt = new Date()
expiresAt.setDate(expiresAt.getDate() + 30)

// Save to library
await libraryCollection.insertOne({
  id: randomUUID(),
  userId: 'default-user',  // TODO: Replace with actual user ID
  type: 'story-reel',
  category: 'video',  // 'video', 'image', or 'text'
  title: 'Video Title',
  description: 'Description',
  videoUrl: '/path/to/video.mp4',
  filePath: '/path/to/video.mp4',
  fileSize: 1234567,
  content: '',  // For text content
  script: '',   // Optional: original script/prompt
  metadata: {},
  createdAt: new Date(),
  expiresAt
})
```

## Content Categories

### Videos (`category: 'video'`)
- Examples: Story Reels, Auto Reels, Talking Head videos
- Must include: `videoUrl` or `filePath`
- Optional: `fileSize`, `script`, `metadata.duration`, `metadata.resolution`

### Images (`category: 'image'`)
- Examples: Carousels, Thumbnails, Generated images
- Must include: `filePath` or `videoUrl` (reused for image URLs)
- Optional: `fileSize`, `metadata.width`, `metadata.height`

### Text (`category: 'text'`)
- Examples: Threads, News, Tutorials, Scripts
- Must include: `content` (the actual text)
- Optional: `metadata.topic`, `metadata.tone`, `metadata.language`

## Database Schema

```javascript
{
  id: String (UUID),
  userId: String (default: 'default-user'),
  type: String,           // Tool type (e.g., 'story-reel', 'thread', 'carousel')
  category: String,       // 'video', 'image', or 'text'
  title: String,
  description: String,
  content: String,        // For text content
  videoUrl: String,       // For videos
  filePath: String,       // For videos/images
  fileSize: Number,       // Optional
  script: String,         // Optional
  metadata: Object,       // Tool-specific data
  createdAt: Date,
  expiresAt: Date         // Auto-delete after 30 days (TTL index)
}
```

## File Storage

Files should be stored in `/app/public/` directories:
- Videos: `/app/public/story-reels/`, `/app/public/auto-reels/`
- Images: `/app/public/carousels/`, `/app/public/thumbnails/`
- Use absolute paths in MongoDB, relative URLs for frontend

## Example Integration

See these files for reference:
- `/app/app/api/story-reels/compose/route.js` - Backend video save
- `/app/app/dashboard/tools/threads/page.js` - Frontend text save
- `/app/lib/library-utils.js` - Utility functions

## Testing

After integration, verify:
1. Content appears in Library page (`/dashboard/library`)
2. Correct category tab (Text, Images, or Videos)
3. Download works correctly
4. Delete removes both DB entry and file
5. Content expires after 30 days (check MongoDB TTL)

## Troubleshooting

**Content not appearing?**
- Check browser console for errors
- Verify `category` field is set correctly
- Check MongoDB connection

**Files not downloading?**
- Ensure files are in `/app/public/` directory
- Use correct public URLs (e.g., `/story-reels/video.mp4`)

**Auto-delete not working?**
- TTL index must be created on `expiresAt` field
- MongoDB scans every 60 seconds for expired documents
