# 🚀 Deployment Checklist - StudyHub

Gunakan checklist ini untuk memastikan deployment ke Netlify berjalan lancar.

## 📋 Pre-Deployment Checklist

### Code Preparation
- [ ] Semua changes sudah committed ke git
- [ ] `.env.local.example` sudah up-to-date
- [ ] `README.md` sudah lengkap dengan instructions
- [ ] Code sudah di-test secara lokal
- [ ] Tidak ada console.log atau debug code yang tertinggal

### Supabase Setup
- [ ] Supabase project sudah dibuat
- [ ] Database migration sudah dijalankan (schema.sql)
- [ ] RLS policies sudah di-set
- [ ] Storage buckets sudah dibuat (avatars, files)
- [ ] Storage policies sudah di-set
- [ ] Triggers sudah dibuat (auto-create profile, update upvotes)

### Environment Variables (CATAT!)
Simpan nilai-nilai berikut dari Supabase dashboard (Settings → API):
```
NEXT_PUBLIC_SUPABASE_URL: _______________________________________
NEXT_PUBLIC_SUPABASE_ANON_KEY: _______________________________________
SUPABASE_SERVICE_ROLE_KEY: _______________________________________
```

## 🌐 Deployment ke Netlify

### 1. GitHub Setup
- [ ] Repository sudah dibuat di GitHub
- [ ] Code sudah di-push ke GitHub
  ```bash
  git init
  git add .
  git commit -m "Initial commit"
  git branch -M main
  git remote add origin <your-github-repo-url>
  git push -u origin main
  ```

### 2. Netlify Configuration
- [ ] Akun Netlify sudah dibuat
- [ ] Netlify sudah connected ke GitHub
- [ ] Repository sudah dipilih di Netlify

### 3. Build Settings (di Netlify Dashboard)

#### Basic Settings
- [ ] **Build command**: `npm run build`
- [ ] **Publish directory**: `.next`
- [ ] **Branch to deploy**: `main`

#### Environment Variables (Site Settings → Environment Variables)
- [ ] `NEXT_PUBLIC_SUPABASE_URL` = (paste dari atas)
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` = (paste dari atas)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` = (paste dari atas)
- [ ] `NODE_VERSION` = `18`

### 4. Deploy
- [ ] Click "Deploy site"
- [ ] Tunggu build selesai (±2-3 menit)
- [ ] Verify deployment sukses (green checkmark)

## ✅ Post-Deployment Testing

### Authentication
- [ ] Buka URL Netlify site
- [ ] Register akun baru
- [ ] Verify redirect ke feed setelah register
- [ ] Test login
- [ ] Test logout
- [ ] Test protected routes (/submit, /profile)

### Post Management
- [ ] Create link post
- [ ] Create file post (upload file ke Supabase Storage)
- [ ] Create text post
- [ ] Verify posts muncul di feed
- [ ] Test edit post (sebagai owner)
- [ ] Test delete post (sebagai owner)
- [ ] Verify edit/delete button TIDAK muncul untuk non-owner

### Interactions
- [ ] Test upvote post
- [ ] Test cancel upvote
- [ ] Verify vote count updates secara realtime
- [ ] Test bookmark post
- [ ] Check bookmarked posts di profile
- [ ] Test comment pada post
- [ ] Verify comment muncul secara realtime
- [ ] Test delete comment (sebagai owner)

### Search & Filter
- [ ] Test search by keyword
- [ ] Test filter by jurusan
- [ ] Test filter by mata kuliah
- [ ] Test filter by type (link/file/text)
- [ ] Test sort (newest, oldest, most upvotes)
- [ ] Verify URL updates saat filter berubah

### Profile
- [ ] Test view own profile
- [ ] Test edit profile (name, jurusan, bio)
- [ ] Test avatar upload
- [ ] Verify avatar muncul di navbar
- [ ] Test view other user's profile
- [ ] Verify "Materi Saya" tab shows own posts
- [ ] Verify "Disimpan" tab shows bookmarked posts

### Responsive Design
- [ ] Test di mobile (iPhone SE size)
- [ ] Test di tablet (iPad size)
- [ ] Test di desktop (1920x1080)
- [ ] Verify navbar responsive
- [ ] Verify cards layout responsive
- [ ] Test filter bar di mobile

### Edge Cases
- [ ] Test empty state (tanpa posts)
- [ ] Test search dengan no results
- [ ] Test file upload yang terlalu besar
- [ ] Test invalid file type
- [ ] Test network error (matikan internet sebentar)
- [ ] Test session timeout

## 🔒 Security Checklist

### Environment Variables
- [ ] `SUPABASE_SERVICE_ROLE_KEY` JANGAN pernah di-expose ke client
- [ ] Verify `.env.local` ada di `.gitignore`
- [ ] Verify `.env.local` TIDAK ter-commit ke GitHub

### RLS Policies
- [ ] Test bahwa user hanya bisa edit/delete own posts
- [ ] Test bahwa user hanya bisa edit/delete own comments
- [ ] Test bahwa user hanya bisa update own profile
- [ ] Test storage policies untuk file uploads

### API Routes
- [ ] Test `/api/posts` - hanya authenticated bisa create
- [ ] Test `/api/posts/[id]` - hanya owner bisa edit/delete
- [ ] Test `/api/comments/[id]` - hanya owner bisa delete

## 📊 Performance Checklist

- [ ] Check Lighthouse score (target: >80)
- [ ] Verify images optimized
- [ ] Check bundle size di build output
- [ ] Test loading time dengan slow 3G
- [ ] Verify ada skeleton loading states

## 🐛 Bug Fixes Checklist

Jika menemukan issues saat testing:

### Common Fixes
1. **"Auth failed"**:
   - Cek RLS policies
   - Verify auth.uid() valid

2. **"CORS error"**:
   - Tambahkan site URL ke Supabase allowed origins

3. **"File upload failed"**:
   - Cek storage bucket permissions
   - Verify file size limit

4. **"Build failed"**:
   - Cek build logs di Netlify
   - Verify Node version = 18

## 🎉 Go-Live Checklist

Setelah semua testing pass:

- [ ] Share URL ke Netlify site
- [ ] Test dengan real users (friends)
- [ ] Monitor Supabase logs untuk errors
- [ ] Setup error tracking (optional: Sentry)
- [ ] Setup analytics (optional: Google Analytics)

## 📞 Support

Jika ada issues:
1. Cek Netlify build logs
2. Cek Supabase logs
3. Cek browser console untuk errors
4. Review README.md troubleshooting section
5. Buat GitHub issue jika problem persist

---

## URL Penting

Simpan URL-URL ini setelah deployment:

```
Netlify Site URL: _______________________________________
Supabase Project URL: _______________________________________
Supabase Dashboard: _______________________________________
GitHub Repository: _______________________________________
```

Good luck dengan deployment! 🚀
