// ===========================================
// Database Types (matching Supabase schema)
// ===========================================

export type CommentStatus = 'open' | 'resolved';

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  created_at: string;
}

export interface Project {
  id: string;
  owner_id: string;
  name: string;
  url: string;
  api_key: string;
  created_at: string;
}

export interface CommentMeta {
  browser?: string;
  os?: string;
  viewport?: string;
  userAgent?: string;
  url?: string;
  path?: string;
  timestamp?: string;
  // Pin position relative to viewport when comment was created (pixels)
  pinX?: number;
  pinY?: number;
  // Pin position as percentage of viewport (for positioning on screenshot)
  pinXPercent?: number;
  pinYPercent?: number;
  // Document-relative coordinates (absolute position in full page)
  pinDocumentX?: number;
  pinDocumentY?: number;
  // Scroll position when screenshot was taken
  scrollX?: number;
  scrollY?: number;
  // Viewport dimensions when screenshot was taken
  viewportWidth?: number;
  viewportHeight?: number;
}

export interface Comment {
  id: string;
  project_id: string;
  url_path: string;
  selector: string | null;
  content: string;
  status: CommentStatus;
  meta: CommentMeta;
  screenshot_url: string | null;
  created_at: string;
}

// ===========================================
// Supabase Database Type Definition
// This matches the format expected by @supabase/supabase-js v2
// ===========================================

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          full_name: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          full_name?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          full_name?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      projects: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          url: string;
          api_key: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          name: string;
          url: string;
          api_key?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          name?: string;
          url?: string;
          api_key?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      comments: {
        Row: {
          id: string;
          project_id: string;
          url_path: string;
          selector: string | null;
          content: string;
          status: string;
          meta: Json;
          screenshot_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          url_path: string;
          selector?: string | null;
          content: string;
          status?: string;
          meta: Json;
          screenshot_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          url_path?: string;
          selector?: string | null;
          content?: string;
          status?: string;
          meta?: Json;
          screenshot_url?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      comment_status: 'open' | 'resolved';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

// ===========================================
// Legacy export (for backwards compatibility)
// ===========================================

export type PixelPointProject = Project;
