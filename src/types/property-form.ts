export interface PropertyMediaItem {
  id?: string;
  url: string;
  type: string; // "IMAGE" | "VIDEO"
}

export interface RoomTypeFormItem {
  id?: string;
  name: string;
  price_per_month: number | string;
  security_deposit?: number | string;
  available_rooms: number | string;
  facilities?: string | null;
  specifications?: string | null;
  image_url?: string | null;
  image_file?: File | null;
  image_preview?: string | null;
}

export interface PropertyFormData {
  name: string;
  owner_id?: string;
  address: string;
  latitude: string;
  longitude: string;
  gender_type: string;
  price_per_month: string;
  available_rooms: string;
  facilities: string;
  description: string;
  rules: string;
  rental_terms: string;
  youtube_url: string;
  image_url: string;
  is_pet_friendly: boolean;
  is_24_hours: boolean;
}

export interface OwnerOption {
  id: string;
  name: string;
  whatsapp_number: string;
}

export const initialPropertyFormData: PropertyFormData = {
  name: "",
  owner_id: "",
  address: "",
  latitude: "",
  longitude: "",
  gender_type: "CAMPUR",
  price_per_month: "",
  available_rooms: "",
  facilities: "",
  description: "",
  rules: "",
  rental_terms: "",
  youtube_url: "",
  image_url: "",
  is_pet_friendly: false,
  is_24_hours: false,
};
