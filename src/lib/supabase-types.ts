// Extended types for the forum application
export type AppRole = 'admin' | 'moderator' | 'member' | 'guest';

export type ReactionType = 'like' | 'upvote' | 'downvote' | 'love' | 'laugh' | 'sad' | 'angry';

export type ReportReason = 'spam' | 'abuse' | 'hate' | 'harassment' | 'misinformation' | 'other';

export type ReportStatus = 'pending' | 'reviewed' | 'resolved' | 'dismissed';

export type ModerationAction = 'warn' | 'delete_post' | 'delete_thread' | 'lock_thread' | 'temp_ban' | 'perm_ban' | 'shadow_ban' | 'unban';

export type BanType = 'temporary' | 'permanent' | 'shadow';

export interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  cover_image_url: string | null;
  language: string;
  location: string | null;
  reputation_points: number;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

export interface Category {
  id: string;
  parent_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  rules: string | null;
  icon: string | null;
  color: string | null;
  is_locked: boolean;
  sort_order: number;
  created_at: string;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string;
  usage_count: number;
  created_at: string;
}

export interface Thread {
  id: string;
  title: string;
  slug: string;
  category_id: string;
  author_id: string;
  is_pinned: boolean;
  is_locked: boolean;
  is_solved: boolean;
  view_count: number;
  reply_count: number;
  last_activity_at: string;
  created_at: string;
  updated_at: string;
  // Joined fields
  author?: Profile;
  category?: Category;
  tags?: Tag[];
  first_post?: Post;
}

export interface Post {
  id: string;
  thread_id: string;
  author_id: string;
  parent_post_id: string | null;
  content: string;
  attachments: any[];
  is_solution: boolean;
  is_edited: boolean;
  edit_history: any[];
  created_at: string;
  updated_at: string;
  // Joined fields
  author?: Profile;
  reactions?: Reaction[];
  replies?: Post[];
}

export interface Reaction {
  id: string;
  post_id: string;
  user_id: string;
  reaction_type: ReactionType;
  created_at: string;
}

export interface Bookmark {
  id: string;
  user_id: string;
  thread_id: string;
  created_at: string;
  thread?: Thread;
}

export interface Follow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string | null;
  link: string | null;
  is_read: boolean;
  data: any;
  created_at: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string;
  required_points: number;
  created_at: string;
}

export interface Poll {
  id: string;
  thread_id: string;
  question: string;
  options: { text: string; votes: number }[];
  is_multiple_choice: boolean;
  expires_at: string | null;
  created_at: string;
}

export interface PrivateMessage {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  sender?: Profile;
  recipient?: Profile;
}
