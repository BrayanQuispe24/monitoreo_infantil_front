import { Settings } from "lucide-react";
import ModulePage from "../../../shared/components/ModulePage";

export default function SettingsPage() {
  return (
    <ModulePage
      title="Configuración"
      description="Configura parámetros generales del sistema, tiempos de expiración de QR, políticas de alertas y opciones administrativas."
      icon={<Settings size={28} />}
      primaryAction="Guardar configuración"
      actions={[
        "Tiempo de expiración QR",
        "Parámetros de alertas",
        "Precisión mínima GPS",
        "Configuración global",
      ]}
      columns={["Parámetro", "Valor", "Descripción", "Estado", "Módulo"]}
      rows={[
        ["QR_EXPIRATION_MINUTES", "10", "Duración del código QR temporal", "Activo", "Rastreadores"],
        ["GPS_MIN_ACCURACY", "25m", "Precisión mínima aceptada", "Activo", "Monitoreo"],
        ["ALERT_REPEAT_INTERVAL", "5 min", "Intervalo de repetición de alerta", "Activo", "Alertas"],
      ]}
    />
  );
}