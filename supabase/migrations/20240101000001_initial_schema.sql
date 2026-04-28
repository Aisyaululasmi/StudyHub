-- =====================================================
-- StudyHub Database Schema
-- Initial Migration - 2024-01-01
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For better text search

-- =====================================================
-- TABLES
-- =====================================================

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  jurusan TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Posts table
CREATE TABLE IF NOT EXISTS posts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('link', 'file', 'text')),
  url TEXT,
  file_url TEXT,
  file_name TEXT,
  mata_kuliah TEXT NOT NULL,
  jurusan TEXT NOT NULL,
  tags TEXT[],
  upvotes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  search_vector TSVECTOR
);

-- Votes table
CREATE TABLE IF NOT EXISTS votes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  value INTEGER NOT NULL CHECK (value IN (1, -1)),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

-- Comments table
CREATE TABLE IF NOT EXISTS comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bookmarks table
CREATE TABLE IF NOT EXISTS bookmarks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

-- =====================================================
-- INDEXES
-- =====================================================

-- Posts indexes
CREATE INDEX IF NOT EXISTS idx_posts_jurusan ON posts(jurusan);
CREATE INDEX IF NOT EXISTS idx_posts_mata_kuliah ON posts(mata_kuliah);
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_type ON posts(type);

-- Votes indexes
CREATE INDEX IF NOT EXISTS idx_votes_post_id ON votes(post_id);
CREATE INDEX IF NOT EXISTS idx_votes_user_id ON votes(user_id);

-- Comments indexes
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);

-- Bookmarks indexes
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_post_id ON bookmarks(post_id);

-- Tags index (for array operations)
CREATE INDEX IF NOT EXISTS idx_posts_tags ON posts USING GIN(tags);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Posts policies
CREATE POLICY "Posts are viewable by everyone"
  ON posts FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create posts"
  ON posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts"
  ON posts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own posts"
  ON posts FOR DELETE
  USING (auth.uid() = user_id);

-- Votes policies
CREATE POLICY "Votes are viewable by everyone"
  ON votes FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can vote"
  ON votes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own votes"
  ON votes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own votes"
  ON votes FOR DELETE
  USING (auth.uid() = user_id);

-- Comments policies
CREATE POLICY "Comments are viewable by everyone"
  ON comments FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create comments"
  ON comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
  ON comments FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own comments"
  ON comments FOR UPDATE
  USING (auth.uid() = user_id);

-- Bookmarks policies
CREATE POLICY "Users can view own bookmarks"
  ON bookmarks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can create bookmarks"
  ON bookmarks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own bookmarks"
  ON bookmarks FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, jurusan, avatar_url, bio)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    NEW.raw_user_meta_data->>'jurusan',
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'bio'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function to update upvotes count on post
CREATE OR REPLACE FUNCTION public.update_post_upvotes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Add vote
    IF NEW.value = 1 THEN
      UPDATE posts
      SET upvotes = upvotes + 1
      WHERE id = NEW.post_id;
    ELSIF NEW.value = -1 THEN
      UPDATE posts
      SET upvotes = upvotes - 1
      WHERE id = NEW.post_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Remove vote
    IF OLD.value = 1 THEN
      UPDATE posts
      SET upvotes = upvotes - 1
      WHERE id = OLD.post_id;
    ELSIF OLD.value = -1 THEN
      UPDATE posts
      SET upvotes = upvotes + 1
      WHERE id = OLD.post_id;
    END IF;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Change vote value (e.g., from 1 to -1)
    IF NEW.value != OLD.value THEN
      UPDATE posts
      SET upvotes = upvotes + NEW.value - OLD.value
      WHERE id = NEW.post_id;
    END IF;
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update upvotes
CREATE TRIGGER on_vote_change
  AFTER INSERT OR UPDATE OR DELETE ON votes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_post_upvotes();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Function to update search vector
CREATE OR REPLACE FUNCTION public.update_posts_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.mata_kuliah, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(NEW.jurusan, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(array_to_string(NEW.tags, ' '), '')), 'D');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update search vector on insert and update
CREATE TRIGGER update_posts_search_vector_trigger
  BEFORE INSERT OR UPDATE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_posts_search_vector();

-- Create GIN index for search vector (after trigger)
CREATE INDEX IF NOT EXISTS idx_posts_search_vector ON posts USING GIN(search_vector);

-- =====================================================
-- STORAGE
-- =====================================================

-- Create storage bucket for post files
INSERT INTO storage.buckets (id, name, public)
VALUES ('post-files', 'post-files', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Public can view post files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'post-files');

CREATE POLICY "Authenticated users can upload post files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'post-files' AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "Users can delete own post files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'post-files' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to search posts
CREATE OR REPLACE FUNCTION search_posts(
  search_query TEXT,
  search_jurusan TEXT DEFAULT NULL,
  search_type TEXT DEFAULT NULL,
  limit_count INTEGER DEFAULT 20,
  offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  type TEXT,
  mata_kuliah TEXT,
  jurusan TEXT,
  tags TEXT[],
  upvotes INTEGER,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.title,
    p.description,
    p.type,
    p.mata_kuliah,
    p.jurusan,
    p.tags,
    p.upvotes,
    p.created_at
  FROM posts p
  WHERE
    -- Text search
    (search_query IS NULL OR p.search_vector @@ plainto_tsquery(search_query))
    -- Filter by jurusan
    AND (search_jurusan IS NULL OR p.jurusan = search_jurusan)
    -- Filter by type
    AND (search_type IS NULL OR p.type = search_type)
  ORDER BY p.created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- GRANTS
-- =====================================================

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;

-- Grant select on all tables to anon and authenticated
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;

-- Grant necessary permissions to authenticated
GRANT INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;

-- Grant usage on functions
GRANT EXECUTE ON FUNCTION search_posts TO anon;
GRANT EXECUTE ON FUNCTION search_posts TO authenticated;

-- =====================================================
-- SAMPLE DATA (Optional - for development)
-- =====================================================

-- Uncomment below to insert sample data for testing

/*
-- Sample profiles
INSERT INTO profiles (id, name, jurusan, bio) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Alice Smith', 'Computer Science', 'CS student passionate about ML'),
  ('00000000-0000-0000-0000-000000000002', 'Bob Johnson', 'Electrical Engineering', 'EE student focusing on robotics')
ON CONFLICT DO NOTHING;

-- Sample posts
INSERT INTO posts (user_id, title, description, type, url, mata_kuliah, jurusan, tags) VALUES
  (
    '00000000-0000-0000-0000-000000000001',
    'Introduction to Machine Learning',
    'Great lecture notes from Prof. X',
    'link',
    'https://example.com/ml-notes',
    'Machine Learning',
    'Computer Science',
    ARRAY['machine-learning', 'notes', 'ai']
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    'Circuit Analysis Fundamentals',
    'Comprehensive guide to circuit analysis',
    'file',
    'https://storage.example.com/circuits.pdf',
    'Circuit Analysis',
    'Electrical Engineering',
    ARRAY['circuits', 'engineering', 'physics']
  )
ON CONFLICT DO NOTHING;
*/
