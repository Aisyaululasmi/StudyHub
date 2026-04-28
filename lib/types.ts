// =====================================================
// Database Types
// =====================================================

export interface Profile {
  id: string
  name: string
  jurusan: string | null
  avatar_url: string | null
  bio: string | null
  created_at: string
  updated_at: string
}

export interface Post {
  id: string
  user_id: string
  title: string
  description: string | null
  type: 'link' | 'file' | 'text'
  url: string | null
  file_url: string | null
  file_name: string | null
  mata_kuliah: string
  jurusan: string
  tags: string[] | null
  upvotes: number
  created_at: string
  updated_at: string
  search_vector?: string // TSVECTOR, only for queries
}

export interface Vote {
  id: string
  user_id: string
  post_id: string
  value: 1 | -1
  created_at: string
}

export interface Comment {
  id: string
  user_id: string
  post_id: string
  content: string
  created_at: string
  updated_at: string
}

export interface Bookmark {
  id: string
  user_id: string
  post_id: string
  created_at: string
}

// =====================================================
// Joined/Extended Types
// =====================================================

export interface PostWithAuthor extends Post {
  profiles: Profile | null
  user_vote?: Vote | null
  is_bookmarked?: boolean
}

export interface CommentWithAuthor extends Comment {
  profiles: Profile | null
}

export interface PostWithDetails extends PostWithAuthor {
  comments?: CommentWithAuthor[]
  comment_count?: number
}

// =====================================================
// Form/Input Types
// =====================================================

export interface CreatePostInput {
  title: string
  description?: string
  type: 'link' | 'file' | 'text'
  url?: string
  file?: File
  mata_kuliah: string
  jurusan: string
  tags?: string[]
}

export interface UpdatePostInput {
  title?: string
  description?: string
  url?: string
  mata_kuliah?: string
  jurusan?: string
  tags?: string[]
}

export interface CreateCommentInput {
  post_id: string
  content: string
}

export interface UpdateProfileInput {
  name?: string
  jurusan?: string
  avatar_url?: string
  bio?: string
}

// =====================================================
// Search/Filter Types
// =====================================================

export interface SearchFilters {
  query?: string
  jurusan?: string
  type?: 'link' | 'file' | 'text'
  mata_kuliah?: string
  tags?: string[]
  sort?: 'newest' | 'oldest' | 'most_upvotes' | 'least_upvotes'
  limit?: number
  offset?: number
}

export interface PaginationParams {
  limit: number
  offset: number
}

export interface PaginatedResponse<T> {
  data: T[]
  count: number
  has_more: boolean
}

// =====================================================
// API Response Types
// =====================================================

export interface ApiResponse<T> {
  data: T | null
  error: string | null
}

export interface ApiError {
  message: string
  code?: string
  details?: any
}

// =====================================================
// Utility Types
// =====================================================

export type PostType = 'link' | 'file' | 'text'

export type VoteValue = 1 | -1

export type SortOrder = 'asc' | 'desc'

export type DbTable = 'profiles' | 'posts' | 'votes' | 'comments' | 'bookmarks'

// =====================================================
// Storage Types
// =====================================================

export interface StorageFile {
  name: string
  url: string
  size: number
  content_type: string
  updated_at: string
}

export interface UploadProgress {
  loaded: number
  total: number
  percentage: number
}

// =====================================================
// Auth Types
// =====================================================

export interface AuthUser {
  id: string
  email: string
  email_confirmed_at?: string
  created_at: string
  updated_at: string
}

export interface AuthSession {
  access_token: string
  refresh_token: string
  expires_in: number
  token_type: string
  user: AuthUser
}

