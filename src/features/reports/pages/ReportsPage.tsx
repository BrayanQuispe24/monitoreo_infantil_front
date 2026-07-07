import { BarChart3 } from "lucide-react";
import ModulePage from "../../../shared/components/ModulePage";

export default function ReportsPage() {
  return (
    <ModulePage
      title="Reportes"
      description="Consulta reportes básicos de alertas, niños monitoreados, rastreadores, guarderías y tutores vinculados."
      icon={<BarChart3 size={28} />}
      primaryAction="Generar reporte"
      actions={[
        "Alertas por fecha",
        "Niños monitoreados",
        "Rastreadores activos",
        "Exportación simple",
      ]}
      columns={["Reporte", "Periodo", "Registros", "Estado", "Formato"]}
      rows={[
        ["Alertas por fecha", "Últimos 7 días", "32", "Disponible", "PDF / Excel"],
        ["Niños fuera del área", "Hoy", "4", "Disponible", "PDF / Excel"],
        ["Rastreadores activos", "Mes actual", "218", "Disponible", "PDF / Excel"],
      ]}
    />
  );
}