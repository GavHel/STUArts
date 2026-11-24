export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type Table<Row, Insert, Update> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type Artist = {
  id: string;
  slug: string;
  display_name: string;
  university: string | null;
  program: string | null;
  location: string | null;
  bio: string | null;
  profile_image_url: string | null;
  graduation_year: number | null;
  owner_user_id: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

export type Artwork = {
  id: string;
  artist_id: string;
  title: string;
  medium: string;
  description: string | null;
  image_url: string;
  image_alt: string;
  year: number | null;
  price_cad: number | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

export type CommissionRequest = {
  id: string;
  artist_slug: string;
  medium: string;
  placement: string;
  project_brief: string | null;
  width: number | null;
  height: number | null;
  units: string;
  scale_guide: string | null;
  inspiration_url: string | null;
  requested_delivery_date: string | null;
  requester_name: string;
  requester_email: string;
  customer_user_id: string | null;
  estimated_materials_cad: number;
  estimated_artist_fee_cad: number;
  estimated_total_cad: number;
  estimated_studio_time: string;
  request_status: "new" | "in_review" | "accepted" | "declined" | "completed";
  admin_notes: string | null;
  artist_response: string | null;
  artist_responded_at: string | null;
  created_at: string;
  updated_at: string;
};

type Mutable<T> = Omit<T, "id" | "created_at" | "updated_at">;

export type Database = {
  public: {
    Tables: {
      artists: Table<
        Artist,
        Mutable<Artist> &
          Partial<Pick<Artist, "id" | "created_at" | "updated_at" | "owner_user_id">>,
        Partial<Mutable<Artist>> & Partial<Pick<Artist, "updated_at">>
      >;
      artworks: Table<
        Artwork,
        Mutable<Artwork> & Partial<Pick<Artwork, "id" | "created_at" | "updated_at">>,
        Partial<Mutable<Artwork>> & Partial<Pick<Artwork, "updated_at">>
      >;
      commission_requests: Table<
        CommissionRequest,
        Omit<
          CommissionRequest,
          | "id"
          | "created_at"
          | "updated_at"
          | "request_status"
          | "admin_notes"
          | "customer_user_id"
          | "artist_response"
          | "artist_responded_at"
        > &
          Partial<
            Pick<
              CommissionRequest,
              | "id"
              | "created_at"
              | "updated_at"
              | "request_status"
              | "admin_notes"
              | "customer_user_id"
              | "artist_response"
              | "artist_responded_at"
            >
          >,
        Partial<
          Pick<
            CommissionRequest,
            | "request_status"
            | "admin_notes"
            | "artist_response"
            | "artist_responded_at"
            | "updated_at"
          >
        >
      >;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
