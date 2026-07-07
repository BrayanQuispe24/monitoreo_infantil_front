export interface GuardianCreateRequest {
  full_name: string;
  phone?: string;
  email?: string;
}

export interface GuardianCreateResponse {
  id: string;
  code: string;
  temporary_pin: string;
  full_name: string;
}

export interface GuardianResetPinResponse {
  guardian_code: string;
  temporary_pin: string;
  must_change_pin: boolean;
}

export interface GuardianAdminChild {
  child_code: string;
  child_name: string;
  relationship: string;
}

export interface GuardianAdminDaycare {
  daycare_code: string;
  daycare_name: string;
}

export interface GuardianAdminResponse {
  id: string;
  code: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  status: string;
  children: GuardianAdminChild[];
  daycares: GuardianAdminDaycare[];
}

export interface GuardianChildLinkRequest {
  daycare_code: string;
  child_code: string;
  relationship: string;
}

export interface LinkDaycareRequest {
  daycare_code: string;
}
