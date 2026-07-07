export type AlertType = 'OUT_OF_AREA' | 'NO_SIGNAL' | 'GPS_ERROR';
export type AlertSeverity = 'LOW' | 'MEDIUM' | 'HIGH';
export type AlertStatus = 'NEW' | 'VIEWED' | 'RESOLVED';

export interface AlertResponse {
  id: string;
  code: string;
  child_id: string;
  child_code: string;
  child_name: string;
  daycare_id: string;
  daycare_code: string;
  daycare_name: string;
  location_id: string | null;
  alert_type: AlertType;
  severity: AlertSeverity;
  status: AlertStatus;
  title: string;
  message: string;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
}
