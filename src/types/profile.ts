export interface UserProfile {
  id: string;
  name: string;
  email: string;
  whatsapp: string | null;
  bio: string | null;
  avatar: string | null;
  created_at: string;
  hasPassword?: boolean;
  isGoogleLinked?: boolean;
  is_identity_verified?: boolean;
  verified_at?: string | null;
}

export interface BookingProperty {
  id: string;
  name: string;
  price_per_month: number;
  available_rooms: number;
  gender_type: string;
  facilities: string;
  image_url: string | null;
  address: string | null;
}

export interface BookingItem {
  id: string;
  student_name: string;
  student_whatsapp: string;
  move_in_date: string;
  status: string;
  created_at: string;
  checkin_confirmed_at?: string | null;
  cancellation_reason?: string | null;
  refund_bank_name?: string | null;
  refund_account_number?: string | null;
  refund_account_holder?: string | null;
  refund_note?: string | null;
  refunded_at?: string | null;
  amount?: number;
  security_deposit?: number;
  deposit_status?: string | null;
  deposit_refunded_at?: string | null;
  deposit_claimed_amount?: number | null;
  deposit_claim_reason?: string | null;
  checkout_confirmed_at?: string | null;
  room_type?: {
    id: string;
    name: string;
    price_per_month: number;
    image_url?: string | null;
  } | null;
  property: BookingProperty;
}

export interface VisitScheduleItem {
  id: string;
  student_name: string;
  student_whatsapp: string;
  visit_date: string;
  visit_time_slot: string;
  notes: string | null;
  status: string;
  reschedule_date: string | null;
  reschedule_time_slot: string | null;
  reschedule_note: string | null;
  student_reschedule_count?: number;
  cancellation_reason: string | null;
  created_at: string;
  property: {
    id: string;
    name: string;
    address: string | null;
    image_url: string | null;
    price_per_month: number;
    owner?: {
      name: string;
      whatsapp_number: string;
    };
  };
}
