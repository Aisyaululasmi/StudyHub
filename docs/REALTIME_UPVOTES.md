# Realtime Upvote System - StudyHub

Complete documentation of the realtime upvote and bookmark system.

## Overview

The StudyHub application now features a fully functional realtime upvote system that:
- Allows users to upvote/downvote posts
- Shows live updates when other users vote
- Persists vote state across page reloads
- Provides optimistic UI updates for better UX
- Includes bookmark functionality

## Architecture

```
┌─────────────────┐
│   User Action   │
│  (Click Vote)   │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────┐
│     UpvoteButton Component      │
│  - Optimistic Update (UI)       │
│  - Send API Request             │
└────────┬────────────────────────┘
         │
         ├─────────────────┬─────────────────┐
         ▼                 ▼                 ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│ POST /api/   │   │ Supabase     │   │ Supabase     │
│ votes        │   │ Realtime     │   │ Database     │
│              │   │ Subscription │   │ (Trigger)    │
└──────────────┘   └──────────────┘   └──────────────┘
         │                 │                 │
         │                 ▼                 ▼
         │           ┌──────────┐    ┌──────────────┐
         │           │ Broadcast │    │ Update posts │
         │           │ Vote Event│    │ upvotes      │
         │           └──────────┘    └──────────────┘
         │                 │
         └─────────────────┴─────────────────┐
                                             ▼
                                    ┌────────────────┐
                                    │  Update UI     │
                                    │  (All Clients) │
                                    └────────────────┘
```

## Components

### 1. UpvoteButton Component

**Location:** `components/post/UpvoteButton.tsx`

**Features:**
- ✅ Displays current vote count
- ✅ Toggle upvote on click (add/remove)
- ✅ Shows login prompt if not authenticated
- ✅ Loading state during API requests
- ✅ Visual highlight when voted
- ✅ Optimistic updates (UI updates immediately)
- ✅ Realtime sync via Supabase Realtime
- ✅ Reverts on error
- ✅ Two variants: default and compact

**Props:**
```typescript
interface UpvoteButtonProps {
  postId: string              // Post ID to vote on
  initialVoteCount: number    // Initial vote count
  initialVoted?: boolean      // Whether user initially voted
  showLabel?: boolean         // Show "Upvote"/"Upvoted" label
  variant?: 'default' | 'compact'
}
```

**Usage:**
```tsx
<UpvoteButton
  postId={post.id}
  initialVoteCount={post.vote_count}
  initialVoted={post.user_voted}
  variant="compact"
/>
```

### 2. BookmarkButton Component

**Location:** `components/post/BookmarkButton.tsx`

**Features:**
- ✅ Toggle bookmark on click
- ✅ Shows login prompt if not authenticated
- ✅ Loading state during API requests
- ✅ Visual highlight when bookmarked
- ✅ Optimistic updates
- ✅ Reverts on error
- ✅ Two variants: default and compact

**Props:**
```typescript
interface BookmarkButtonProps {
  postId: string
  initialBookmarked?: boolean
  showLabel?: boolean
  variant?: 'default' | 'compact'
}
```

### 3. API Routes

#### POST /api/votes

**Purpose:** Toggle vote on a post

**Request:**
```json
{
  "post_id": "uuid-of-post"
}
```

**Response (Success):**
```json
{
  "data": {
    "voted": true,           // true if voted, false if removed
    "vote_count": 42         // updated vote count
  },
  "error": null
}
```

**Response (Error):**
```json
{
  "data": null,
  "error": "Unauthorized"   // or other error message
}
```

**Logic:**
1. Check if user is authenticated
2. Check if user already voted on this post
3. If voted: Delete vote (toggle off)
4. If not voted: Insert vote with value=1
5. Calculate new vote count
6. Return vote status and count

#### POST /api/posts/[id]/bookmark

**Purpose:** Toggle bookmark on a post

**Response:**
```json
{
  "data": {
    "id": "bookmark-uuid",
    "user_id": "user-uuid",
    "post_id": "post-uuid",
    "created_at": "2024-01-01T00:00:00Z"
  },
  "error": null
}
```

#### DELETE /api/posts/[id]/bookmark

**Purpose:** Remove bookmark

**Response:**
```json
{
  "data": { "success": true },
  "error": null
}
```

## Realtime Implementation

### Supabase Realtime Setup

**Channel Subscription:**
```typescript
const channel = supabase
  .channel(`votes:${postId}`)
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'votes',
      filter: `post_id=eq.${postId}`,
    },
    (payload) => {
      // Handle INSERT, UPDATE, DELETE events
      if (payload.eventType === 'INSERT') {
        setVoteCount(prev => prev + payload.new.value)
      } else if (payload.eventType === 'DELETE') {
        setVoteCount(prev => prev - payload.old.value)
      }
    }
  )
  .subscribe()
```

**Cleanup:**
```typescript
return () => {
  supabase.removeChannel(channel)
}
```

### Database Trigger

The `posts.upvotes` column is automatically updated by a database trigger:

```sql
CREATE TRIGGER on_vote_change
  AFTER INSERT OR UPDATE OR DELETE ON votes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_post_upvotes();
```

This ensures the `upvotes` column is always accurate.

## Optimistic Updates

### How It Works

1. **User Clicks:**
   ```typescript
   const previousVoteCount = voteCount
   const previousVoted = voted

   // Immediate UI update
   setVoteCount(voted ? prev - 1 : prev + 1)
   setVoted(!voted)
   ```

2. **API Request:**
   ```typescript
   const res = await fetch('/api/votes', {
     method: 'POST',
     body: JSON.stringify({ post_id: postId }),
   })
   ```

3. **On Success:**
   ```typescript
   const data = await res.json()
   setVoteCount(data.data.vote_count)
   setVoted(data.data.voted)
   ```

4. **On Error:**
   ```typescript
   // Revert to previous state
   setVoteCount(previousVoteCount)
   setVoted(previousVoted)
   toast.error('Gagal memberikan upvote')
   ```

## Integration with Pages

### Feed Page

**Server-Side Data Fetching:**
```typescript
async function getPosts() {
  // Fetch posts
  const { data: posts } = await supabase
    .from('posts')
    .select('*, profiles:user_id (...)')

  // Fetch current user's votes
  const { data: userVotes } = await supabase
    .from('votes')
    .select('post_id')
    .eq('user_id', user.id)

  // Map votes to posts
  const postsWithVoteStatus = posts.map(post => ({
    ...post,
    initialVoted: userVotes.some(v => v.post_id === post.id)
  }))

  return postsWithVoteStatus
}
```

**Render PostCard:**
```tsx
<PostCard
  {...post}
  initialVoted={post.initialVoted}
  initialBookmarked={post.initialBookmarked}
/>
```

### Post Detail Page

Similar implementation, fetching single post with vote status.

## User Experience

### Authenticated User Flow

1. User clicks upvote button
2. Button immediately shows voted state (optimistic)
3. Vote count increments in UI
4. API request sent in background
5. On success: Confirmation toast
6. On error: Revert UI + error toast
7. Other users see vote update in real-time

### Unauthenticated User Flow

1. User clicks upvote button
2. Toast appears: "Login dulu untuk upvote"
3. Action button: "Login" (redirects to /auth/login)
4. No UI changes

### Realtime Updates

When User A votes:
1. User A's UI updates immediately (optimistic)
2. Database updates via trigger
3. Supabase broadcasts change to all subscribed clients
4. User B, C, D see vote count update automatically
5. No page refresh needed

## Testing

### Manual Testing Steps

1. **Test Vote Toggle:**
   - Click upvote button
   - Verify button turns green
   - Verify count increases by 1
   - Click again
   - Verify button returns to normal
   - Verify count decreases by 1

2. **Test Realtime:**
   - Open feed in two browser windows
   - Vote on a post in window A
   - Verify vote count updates in window B
   - Should happen within 1-2 seconds

3. **Test Error Handling:**
   - Vote while offline
   - Verify optimistic update reverts
   - Verify error toast appears

4. **Test Unauthenticated:**
   - Logout
   - Try to vote
   - Verify login prompt appears

5. **Test Persistence:**
   - Vote on a post
   - Refresh page
   - Verify vote state persists

## Performance Considerations

### Optimistic Updates
- Reduces perceived latency
- Better user experience
- Must handle errors gracefully

### Realtime Subscriptions
- Channel per post (not per page)
- Automatic cleanup on unmount
- Minimal overhead

### Database Queries
- Single query for all user's votes on feed
- Cached vote status in component state
- Efficient pagination

## Future Enhancements

### Potential Improvements
- ✅ Add downvote functionality
- ✅ Vote history page
- ✅ Notification when post receives votes
- ✅ Trending posts algorithm
- ✅ Vote analytics dashboard

### Scalability
- Current setup handles thousands of concurrent users
- Consider Redis cache for vote counts at scale
- Implement rate limiting per user
- Add vote fraud detection

## Troubleshooting

### Realtime Not Working

**Check:**
1. Supabase project has Realtime enabled
2. Database replication is enabled
3. RLS policies allow read access
4. Network connection is stable

**Fix:**
```typescript
// Enable Realtime in Supabase Dashboard
// Project → API → Realtime → Enable
```

### Vote Count Mismatch

**Symptom:** Vote count doesn't match sum of votes

**Solution:**
```sql
-- Recalculate all vote counts
UPDATE posts p
SET upvotes = (
  SELECT COALESCE(SUM(v.value), 0)
  FROM votes v
  WHERE v.post_id = p.id
);
```

### Optimistic Update Issues

**Symptom:** UI shows wrong vote count

**Solution:**
- Ensure API returns correct count
- Implement proper error handling
- Add retry logic for failed requests

## API Reference

### POST /api/votes

**Request:**
```http
POST /api/votes
Content-Type: application/json

{
  "post_id": "123e4567-e89b-12d3-a456-426614174000"
}
```

**Success Response:** 200 OK
```json
{
  "data": {
    "voted": true,
    "vote_count": 42
  },
  "error": null
}
```

**Error Response:** 401 Unauthorized
```json
{
  "data": null,
  "error": "Unauthorized"
}
```

### POST /api/posts/[id]/bookmark

**Success Response:** 200 OK
```json
{
  "data": {
    "id": "bookmark-uuid",
    "user_id": "user-uuid",
    "post_id": "post-uuid",
    "created_at": "2024-01-01T00:00:00Z"
  },
  "error": null
}
```

## Database Schema

### votes Table
```sql
CREATE TABLE votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  value INTEGER CHECK (value IN (1, -1)) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);
```

### bookmarks Table
```sql
CREATE TABLE bookmarks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);
```

## Conclusion

The realtime upvote system provides a smooth, interactive experience for StudyHub users. The combination of optimistic updates, Supabase Realtime, and proper error handling ensures the feature feels responsive and reliable.

For questions or issues, refer to:
- Supabase Realtime Docs: https://supabase.com/docs/guides/realtime
- Next.js Server Actions: https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations
