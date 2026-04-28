# StudyHub 📚

Platform "second brain" kolektif untuk mahasiswa Indonesia. Share link, ringkasan, soal UTS/UAS, dan materi kuliah terbaik.

![StudyHub](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat-square&logo=supabase&logoColor=white)

## ✨ Fitur

- 🔐 **Autentikasi** - Login/register dengan email dan password
- 📝 **Share Materi** - Upload link, file, atau text materi kuliah
- 👍 **Upvote System** - Vote materi terbaik dengan update realtime
- 💬 **Komentar** - Diskusi di setiap materi
- 🔍 **Pencarian** - Full-text search dengan filter jurusan/mata kuliah
- 📁 **Kategorisasi** - Filter berdasarkan jurusan dan mata kuliah
- 👤 **Profil Pengguna** - Lihat dan edit profil dengan avatar upload
- 🔖 **Bookmark** - Simpan materi yang menarik
- 📱 **Responsive** - Tampilan optimal di mobile, tablet, dan desktop
- ⚡ **Realtime Updates** - Update votes dan komentar tanpa refresh

## 🚀 Tech Stack

- **Frontend**: Next.js 16 (App Router) + TypeScript
- **Styling**: Tailwind CSS 4
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL via Supabase
- **Auth**: Supabase Auth
- **Storage**: Supabase Storage (untuk file uploads)
- **Realtime**: Supabase Realtime
- **UI**: Custom components dengan lucide-react icons
- **Toast Notifications**: sonner
- **Deployment**: Netlify (frontend) + Supabase (backend)

## 📋 Prerequisites

- Node.js 18+ terinstall
- Akun Supabase (gratis di [supabase.com](https://supabase.com))
- Akun Netlify (gratis di [netlify.com](https://www.netlify.com))

## 🔧 Development Setup

### 1. Clone Repository

```bash
git clone <your-repo-url>
cd studyhub
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Variables

Copy `.env.local.example` ke `.env.local`:

```bash
cp .env.local.example .env.local
```

Isi dengan kredensial Supabase kamu:
1. Buka dashboard Supabase project
2. Navigate ke Settings → API
3. Copy nilai-nilai berikut:
   - `NEXT_PUBLIC_SUPABASE_URL`: Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: anon/public key
   - `SUPABASE_SERVICE_ROLE_KEY`: service_role key (untuk admin operations)

### 4. Database Setup

**Opsi 1: Gunakan Migration File (Recommended)**

Jalankan migration file dari folder `supabase/migrations/`:

```bash
# Buka Supabase SQL Editor
# Copy dan paste isi file: supabase/migrations/20240101000001_initial_schema.sql
# Execute SQL
```

**Opsi 2: Manual SQL**

Copy dan jalankan SQL berikut di Supabase SQL Editor:

```sql
-- Profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  name TEXT NOT NULL,
  jurusan TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Posts table dengan full-text search
CREATE TABLE posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT CHECK (type IN ('link', 'file', 'text')) NOT NULL,
  url TEXT,
  file_url TEXT,
  mata_kuliah TEXT NOT NULL,
  jurusan TEXT NOT NULL,
  tags TEXT[],
  upvotes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  search_vector TSVECTOR GENERATED ALWAYS AS (
    to_tsvector('indonesian', title || ' ' || COALESCE(description, '') || ' ' || mata_kuliah)
  ) STORED
);

-- Votes table
CREATE TABLE votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  value INTEGER CHECK (value IN (1, -1)) NOT NULL,
  UNIQUE(user_id, post_id)
);

-- Comments table
CREATE TABLE comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bookmarks table
CREATE TABLE bookmarks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public can view profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Posts policies
CREATE POLICY "Public can view posts" ON posts FOR SELECT USING (true);
CREATE POLICY "Auth users can create posts" ON posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own posts" ON posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own posts" ON posts FOR DELETE USING (auth.uid() = user_id);

-- Votes policies
CREATE POLICY "Public can view votes" ON votes FOR SELECT USING (true);
CREATE POLICY "Auth users can vote" ON votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own votes" ON votes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own votes" ON votes FOR DELETE USING (auth.uid() = user_id);

-- Comments policies
CREATE POLICY "Public can view comments" ON comments FOR SELECT USING (true);
CREATE POLICY "Auth users can comment" ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON comments FOR DELETE USING (auth.uid() = user_id);

-- Bookmarks policies
CREATE POLICY "Public can view bookmarks" ON bookmarks FOR SELECT USING (true);
CREATE POLICY "Auth users can bookmark" ON bookmarks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own bookmarks" ON bookmarks FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_jurusan ON posts(jurusan);
CREATE INDEX idx_posts_mata_kuliah ON posts(mata_kuliah);
CREATE INDEX idx_posts_type ON posts(type);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_votes_post_id ON votes(post_id);
CREATE INDEX idx_votes_user_id ON votes(user_id);
CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_bookmarks_user_id ON bookmarks(user_id);

-- Trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, jurusan)
  VALUES (new.id, new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'jurusan);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger to update post upvotes count
CREATE OR REPLACE FUNCTION update_post_upvotes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET upvotes = upvotes + NEW.value WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET upvotes = upvotes - OLD.value WHERE id = OLD.post_id;
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE posts SET upvotes = upvotes - OLD.value + NEW.value WHERE id = NEW.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_votes_count
  AFTER INSERT OR UPDATE OR DELETE ON votes
  FOR EACH ROW EXECUTE FUNCTION update_post_upvotes();
```

### 5. Setup Supabase Storage

Buat bucket untuk file uploads:

```sql
-- Create avatars bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true);

-- Create files bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('files', 'files', true);

-- Storage policies
CREATE POLICY "Public can view avatars"
ON storage.objects FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Auth users can upload avatars"
ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'avatars' AND 
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update own avatars"
ON storage.objects FOR UPDATE WITH CHECK (
  bucket_id = 'avatars' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Public can view files"
ON storage.objects FOR SELECT USING (bucket_id = 'files');

CREATE POLICY "Auth users can upload files"
ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'files' AND 
  auth.role() = 'authenticated'
);
```

### 6. Run Development Server

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser.

## 🚀 Deployment ke Netlify

### Persiapan

1. **Push code ke GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin <your-github-repo>
   git push -u origin main
   ```

2. **Setup Supabase Production**:
   - Pastikan sudah menjalankan migration SQL di Supabase production
   - Copy environment variables dari production Supabase project

### Deploy ke Netlify

**Opsi 1: Via Netlify Dashboard (Recommended untuk first-time)**

1. Buka [netlify.com](https://www.netlify.com) dan login
2. Click "Add new site" → "Import an existing project"
3. Connect dengan GitHub repository
4. Configure deployment:
   - **Build command**: `npm run build`
   - **Publish directory**: `.next`
   - **Node version**: 18
5. Add environment variables di Site Settings → Environment Variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
   SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
   ```
6. Deploy site!

**Opsi 2: Via Netlify CLI**

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login ke Netlify
netlify login

# Initialize site
netlify init

# Deploy
netlify deploy --prod
```

### Post-Deployment Checklist

- [ ] Test registration dan login
- [ ] Test create post dengan semua type (link, file, text)
- [ ] Test upvote functionality
- [ ] Test comment system
- [ ] Test search dan filter
- [ ] Test profile edit dengan avatar upload
- [ ] Test bookmark functionality
- [ ] Test responsive design di mobile
- [ ] Verify semua pages ada metadata yang benar
- [ ] Check browser console untuk errors

## 📁 Struktur Folder

```
studyhub/
├── app/
│   ├── auth/           # Authentication pages
│   ├── feed/           # Main feed page
│   ├── post/[id]/      # Post detail pages
│   ├── profile/[id]/   # User profile pages
│   ├── submit/         # Submit new post page
│   └── api/            # API routes
├── components/
│   ├── ui/             # Reusable UI components
│   ├── layout/         # Layout components (Navbar, etc)
│   ├── post/           # Post-related components
│   ├── comment/        # Comment components
│   ├── profile/        # Profile components
│   └── loading/        # Loading skeletons
├── lib/                # Utilities dan helpers
├── supabase/
│   └── migrations/     # Database migrations
├── public/             # Static assets
├── middleware.ts       # Auth middleware
└── netlify.toml        # Netlify configuration
```

## 🧪 Testing

### Manual Testing Flow

1. **Authentication Flow**:
   - Register new account
   - Verify profile auto-created
   - Login dengan email/password
   - Logout

2. **Post Creation Flow**:
   - Create link post
   - Create file post
   - Create text post
   - Verify posts muncul di feed

3. **Interaction Flow**:
   - Upvote post
   - Bookmark post
   - Comment on post
   - Verify realtime updates

4. **Search & Filter Flow**:
   - Search post by keyword
   - Filter by jurusan
   - Filter by mata kuliah
   - Filter by type
   - Sort by new/popular

5. **Profile Flow**:
   - View own profile
   - Edit profile
   - Upload avatar
   - View other user's profile

## 🐛 Troubleshooting

### Common Issues

**Issue: "Database connection failed"**
- Cek NEXT_PUBLIC_SUPABASE_URL di .env.local
- Verify Supabase project active

**Issue: "RLS policy violation"**
- Pastikan RLS policies sudah dijalankan
- Cek auth.uid() sesuai dengan profile id

**Issue: "File upload failed"**
- Verify storage buckets sudah dibuat
- Cek storage policies

**Issue: "Build failed on Netlify"**
- Verify Node version = 18
- Cek environment variables sudah di-set
- Check build logs di Netlify dashboard

## 📝 License

MIT License - feel free to use this project for learning!

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest new features
- Submit pull requests

## 👥 Authors

- **Your Name** - *Initial work*

## 📞 Support

Jika ada pertanyaan atau issues, buat GitHub issue atau contact via:
- Email: your@email.com
- Twitter: @yourusername

---

Made with ❤️ for Indonesian students
