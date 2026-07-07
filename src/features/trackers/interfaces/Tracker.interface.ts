export type PairingCodeStatus = 'ACTIVE' | 'USED' | 'EXPIRED' | 'CANCELLED';

export interface PairingCodeCreate {
  child_code: string;
  expires_in_minutes: number;
}

export interface PairingCodeResponse {
  pairing_code: string;
  child_code: string;
  child_name: string;
  daycare_code: string;
  daycare_name: string;
  expires_at: string;
  qr_payload: string;
}

export interface PairingCodeListResponse {
  code: string;
  status: PairingCodeStatus;
  expires_at: string;
  used_at: string | null;
  child_code: string;
  child_name: string;
  daycare_code: string;
  daycare_name: string;
}

export interface DeviceDetails {
  device_code: string | null;
  platform: string | null;
  device_identifier: string | null;
  is_active: boolean;
  last_seen_at: string | null;
  paired_at: string | null;
}

export interface ChildTrackerResponse {
  child_code: string;
  child_name: string;
  device: DeviceDetails | null;
}
