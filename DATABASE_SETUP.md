# Database Setup Guide for StudyHub

This guide explains how to set up your Supabase database using the migration file.

## Prerequisites

1. A Supabase project (create at [supabase.com](https://supabase.com))
2. Node.js installed (for CLI method)

---

## Method 1: Using Supabase CLI (Recommended)

### Step 1: Install Supabase CLI

**Windows (PowerShell):**
```powershell
winget install Supabase.Supabase
```

**macOS:**
```bash
brew install supabase/tap/supabase
```

**Linux:**
```bash
curl -fsSL https://supa.co/install.sh | bash
```

### Step 2: Link to Your Project

```bash
cd studyhub
supabase link --project-ref YOUR_PROJECT_REF
```

Your project ref is the alphanumeric code in your Supabase dashboard URL:
`https://supabase.com/dashboard/project/YOUR_PROJECT_REF`

You'll be prompted to enter your database password.

### Step 3: Push Migration

```bash
supabase db push
```

This will execute all pending migrations in the `supabase/migrations` folder.

### Step 4: Verify Setup

```bash
supabase db remote tables
```

You should see all the tables: `profiles`, `posts`, `votes`, `comments`, `bookmarks`

---

## Method 2: Using Supabase Dashboard (Manual)

### Step 1: Open SQL Editor

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**

### Step 2: Run Migration

1. Copy the entire content from:
   ```
   supabase/migrations/20240101000001_initial_schema.sql
   ```

2. Paste it into the SQL Editor

3. Click **Run** (or press `Ctrl/Cmd + Enter`)

4. Wait for the migration to complete (usually takes 5-10 seconds)

### Step 3: Verify Setup

In the SQL Editor, run:

```sql
-- Check tables
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('profiles', 'posts', 'votes', 'comments', 'bookmarks')
ORDER BY table_name;

-- Check RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Check indexes
SELECT tablename, indexname
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

---

## Method 3: Using psql (Command Line)

### Step 1: Get Connection Details

From your Supabase dashboard:
1. Go to **Settings** → **Database**
2. Copy the **Connection string** (URI format)

### Step 2: Connect and Run Migration

```bash
psql "postgresql://postgres:[YOUR-PASSWORD]@db.YOUR_PROJECT_REF.supabase.co:5432/postgres" -f supabase/migrations/20240101000001_initial_schema.sql
```

---

## What Gets Created

### Tables
- ✅ `profiles` - User profiles (extends auth.users)
- ✅ `posts` - Posts with full-text search
- ✅ `votes` - Upvote/downvote system
- ✅ `comments` - Post comments
- ✅ `bookmarks` - User bookmarks

### Indexes
- ✅ `posts.jurusan` - Filter by major
- ✅ `posts.mata_kuliah` - Filter by course
- ✅ `posts.user_id` - Get user's posts
- ✅ `posts.created_at DESC` - Sort by newest
- ✅ `posts.search_vector GIN` - Full-text search
- ✅ `votes.post_id` - Get post votes
- ✅ `comments.post_id` - Get post comments
- ✅ `bookmarks.user_id` - Get user bookmarks

### Row Level Security (RLS)
- ✅ Profiles: Public read, user-specific write
- ✅ Posts: Public read, owner-specific write
- ✅ Votes: Public read, user-specific write
- ✅ Comments: Public read, user-specific write
- ✅ Bookmarks: Private read/write

### Triggers
- ✅ Auto-create profile on user signup
- ✅ Auto-update `posts.upvotes` on vote changes
- ✅ Auto-update `updated_at` timestamps

### Storage
- ✅ `post-files` bucket for file uploads
- ✅ Public read policy
- ✅ Authenticated upload policy

---

## Testing Your Setup

### 1. Create a Test User

In your Next.js app, register a new user. The trigger should auto-create a profile.

### 2. Verify in Supabase Dashboard

Go to **Table Editor** → **profiles**:
- You should see a row with your user's data

### 3. Test Creating a Post

```sql
INSERT INTO posts (user_id, title, description, type, mata_kuliah, jurusan, tags)
VALUES (
  'YOUR_USER_ID',
  'Test Post',
  'This is a test post',
  'text',
  'Introduction to Programming',
  'Computer Science',
  ARRAY['test', 'first-post']
)
RETURNING *;
```

### 4. Test Vote Trigger

```sql
-- Add an upvote
INSERT INTO votes (user_id, post_id, value)
VALUES ('YOUR_USER_ID', 'POST_ID', 1);

-- Check upvotes increased
SELECT upvotes FROM posts WHERE id = 'POST_ID';

-- Change vote to downvote
UPDATE votes SET value = -1 WHERE user_id = 'YOUR_USER_ID' AND post_id = 'POST_ID';

-- Check upvotes decreased by 2 (1 - 1 = 0, then -1)
SELECT upvotes FROM posts WHERE id = 'POST_ID';

-- Remove vote
DELETE FROM votes WHERE user_id = 'YOUR_USER_ID' AND post_id = 'POST_ID';

-- Check upvotes increased by 1
SELECT upvotes FROM posts WHERE id = 'POST_ID';
```

### 5. Test Search Function

```sql
SELECT * FROM search_posts(
  search_query := 'programming',  -- Full-text search
  search_jurusan := 'Computer Science',
  search_type := 'text',
  limit_count := 10
);
```

---

## Common Issues & Solutions

### Issue: "relation does not exist"

**Cause:** Migration wasn't executed completely.

**Solution:** Check the migration status and rerun:
```bash
supabase migration list
supabase db push
```

### Issue: RLS policies preventing reads

**Cause:** RLS enabled but no policies created.

**Solution:** Check policies exist:
```sql
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE schemaname = 'public';
```

### Issue: Profile not auto-created on signup

**Cause:** Trigger not firing or function error.

**Solution:** Check trigger:
```sql
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';
```

### Issue: Upvotes not updating

**Cause:** Vote trigger not working.

**Solution:** Check vote count manually:
```sql
SELECT
  p.id,
  p.upvotes,
  COUNT(v.id) FILTER (WHERE v.value = 1) as upvote_count,
  COUNT(v.id) FILTER (WHERE v.value = -1) as downvote_count
FROM posts p
LEFT JOIN votes v ON p.id = v.post_id
GROUP BY p.id;
```

---

## Updating the Schema

When you need to make changes:

1. Create a new migration file:
   ```bash
   supabase migration new add_new_column
   ```

2. Edit the new file in `supabase/migrations/`

3. Push changes:
   ```bash
   supabase db push
   ```

---

## Rollback

If something goes wrong, you can reset the database:

**⚠️ WARNING: This deletes all data!**

```bash
supabase db reset
```

Or via dashboard:
1. Go to **Settings** → **Database**
2. Scroll to **Reset Database Password**
3. Click **Reset Database** (deletes all data)

---

## Next Steps

After setting up the database:

1. ✅ Configure environment variables in `.env.local`
2. ✅ Test authentication flow
3. ✅ Implement post creation feature
4. ✅ Implement feed with filtering
5. ✅ Implement voting system
6. ✅ Implement comments

---

## Support

If you encounter issues:

1. Check [Supabase Docs](https://supabase.com/docs)
2. Check [Supabase CLI Docs](https://supabase.com/docs/guides/cli)
3. Review the migration file for errors
4. Check Supabase logs: **Database** → **Logs**

---

## Migration File Reference

The migration file creates:

- **5 tables** with proper foreign keys
- **10+ indexes** for performance
- **15+ RLS policies** for security
- **3 triggers** for automation
- **1 storage bucket** for files
- **1 helper function** for search

All using PostgreSQL best practices and Supabase conventions.
