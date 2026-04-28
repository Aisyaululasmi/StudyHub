# Database Schema Reference

Quick reference for the StudyHub database schema.

## Tables

### profiles
```sql
id          UUID PRIMARY KEY (references auth.users)
name        TEXT NOT NULL
jurusan     TEXT
avatar_url  TEXT
bio         TEXT
created_at  TIMESTAMPTZ DEFAULT NOW()
updated_at  TIMESTAMPTZ DEFAULT NOW()
```

### posts
```sql
id            UUID PRIMARY KEY
user_id       UUID (references profiles)
title         TEXT NOT NULL
description   TEXT
type          TEXT CHECK (type IN ('link', 'file', 'text'))
url           TEXT
file_url      TEXT
file_name     TEXT
mata_kuliah   TEXT NOT NULL
jurusan       TEXT NOT NULL
tags          TEXT[]
upvotes       INTEGER DEFAULT 0
created_at    TIMESTAMPTZ DEFAULT NOW()
updated_at    TIMESTAMPTZ DEFAULT NOW()
search_vector TSVECTOR (generated)
```

### votes
```sql
id         UUID PRIMARY KEY
user_id    UUID (references profiles)
post_id    UUID (references posts)
value      INTEGER CHECK (value IN (1, -1))
created_at TIMESTAMPTZ DEFAULT NOW()
UNIQUE(user_id, post_id)
```

### comments
```sql
id         UUID PRIMARY KEY
user_id    UUID (references profiles)
post_id    UUID (references posts)
content    TEXT NOT NULL
created_at TIMESTAMPTZ DEFAULT NOW()
updated_at TIMESTAMPTZ DEFAULT NOW()
```

### bookmarks
```sql
id         UUID PRIMARY KEY
user_id    UUID (references profiles)
post_id    UUID (references posts)
created_at TIMESTAMPTZ DEFAULT NOW()
UNIQUE(user_id, post_id)
```

## Indexes

| Table | Columns | Type | Purpose |
|-------|---------|------|---------|
| posts | jurusan | btree | Filter by major |
| posts | mata_kuliah | btree | Filter by course |
| posts | user_id | btree | Get user's posts |
| posts | created_at | btree DESC | Sort by newest |
| posts | type | btree | Filter by type |
| posts | search_vector | GIN | Full-text search |
| posts | tags | GIN | Search tags |
| votes | post_id | btree | Get post votes |
| votes | user_id | btree | Get user votes |
| comments | post_id | btree | Get post comments |
| comments | created_at | btree DESC | Sort comments |
| bookmarks | user_id | btree | Get user bookmarks |
| bookmarks | post_id | btree | Get post bookmarks |

## Row Level Security Policies

### profiles
- `Public profiles are viewable by everyone` (SELECT)
- `Users can insert their own profile` (INSERT)
- `Users can update own profile` (UPDATE)

### posts
- `Posts are viewable by everyone` (SELECT)
- `Authenticated users can create posts` (INSERT)
- `Users can update own posts` (UPDATE)
- `Users can delete own posts` (DELETE)

### votes
- `Votes are viewable by everyone` (SELECT)
- `Authenticated users can vote` (INSERT)
- `Users can update own votes` (UPDATE)
- `Users can delete own votes` (DELETE)

### comments
- `Comments are viewable by everyone` (SELECT)
- `Authenticated users can create comments` (INSERT)
- `Users can update own comments` (UPDATE)
- `Users can delete own comments` (DELETE)

### bookmarks
- `Users can view own bookmarks` (SELECT)
- `Authenticated users can create bookmarks` (INSERT)
- `Users can delete own bookmarks` (DELETE)

## Triggers

### on_auth_user_created
**Table:** auth.users (AFTER INSERT)
**Function:** handle_new_user()
**Purpose:** Auto-create profile when user signs up

### on_vote_change
**Table:** votes (AFTER INSERT/UPDATE/DELETE)
**Function:** update_post_upvotes()
**Purpose:** Auto-update posts.upvotes count

### update_profiles_updated_at
**Table:** profiles (BEFORE UPDATE)
**Function:** update_updated_at()
**Purpose:** Auto-update updated_at timestamp

### update_posts_updated_at
**Table:** posts (BEFORE UPDATE)
**Function:** update_updated_at()
**Purpose:** Auto-update updated_at timestamp

### update_comments_updated_at
**Table:** comments (BEFORE UPDATE)
**Function:** update_updated_at()
**Purpose:** Auto-update updated_at timestamp

## Storage

### Bucket: post-files
- **Public:** true
- **Policies:**
  - `Public can view post files` (SELECT)
  - `Authenticated users can upload post files` (INSERT)
  - `Users can delete own post files` (DELETE)

## Helper Functions

### search_posts()
```sql
search_posts(
  search_query TEXT,
  search_jurusan TEXT DEFAULT NULL,
  search_type TEXT DEFAULT NULL,
  limit_count INTEGER DEFAULT 20,
  offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (posts)
```

Full-text search with filtering support.

## Common Queries

### Get posts by jurusan
```sql
SELECT * FROM posts
WHERE jurusan = 'Computer Science'
ORDER BY created_at DESC
LIMIT 20;
```

### Get posts by mata_kuliah
```sql
SELECT * FROM posts
WHERE mata_kuliah = 'Data Structures'
ORDER BY upvotes DESC
LIMIT 20;
```

### Full-text search
```sql
SELECT * FROM posts
WHERE search_vector @@ to_tsquery('indonesian', 'machine & learning')
ORDER BY created_at DESC;
```

### Get post with author
```sql
SELECT p.*, pr.name, pr.avatar_url
FROM posts p
LEFT JOIN profiles pr ON p.user_id = pr.id
WHERE p.id = 'post-uuid'
LIMIT 1;
```

### Get user's vote on a post
```sql
SELECT * FROM votes
WHERE user_id = 'user-uuid' AND post_id = 'post-uuid';
```

### Get post vote count
```sql
SELECT
  COUNT(*) FILTER (WHERE value = 1) as upvotes,
  COUNT(*) FILTER (WHERE value = -1) as downvotes
FROM votes
WHERE post_id = 'post-uuid';
```

### Get recent comments for post
```sql
SELECT c.*, p.name, p.avatar_url
FROM comments c
JOIN profiles p ON c.user_id = p.id
WHERE c.post_id = 'post-uuid'
ORDER BY c.created_at DESC
LIMIT 10;
```

### Check if user bookmarked post
```sql
SELECT EXISTS (
  SELECT 1 FROM bookmarks
  WHERE user_id = 'user-uuid' AND post_id = 'post-uuid'
);
```

### Get popular posts by jurusan
```sql
SELECT * FROM posts
WHERE jurusan = 'Computer Science'
ORDER BY upvotes DESC, created_at DESC
LIMIT 20;
```

### Get posts by tags
```sql
SELECT * FROM posts
WHERE 'machine-learning' = ANY(tags)
ORDER BY created_at DESC
LIMIT 20;
```

### Get user's activity
```sql
-- Posts
SELECT * FROM posts WHERE user_id = 'user-uuid';

-- Comments
SELECT * FROM comments WHERE user_id = 'user-uuid';

-- Votes
SELECT * FROM votes WHERE user_id = 'user-uuid';

-- Bookmarks
SELECT b.*, p.title, p.mata_kuliah
FROM bookmarks b
JOIN posts p ON b.post_id = p.id
WHERE b.user_id = 'user-uuid';
```

## Type Definitions

See `lib/types.ts` for TypeScript interfaces that match this schema.
