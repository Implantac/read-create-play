import { AffiliateDashboard } from "@/components/AffiliateDashboard";
import { PageHeader } from "@/components/layout/PageHeader";
import { Users } from "lucide-react";

export default function AffiliatePage() {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Programa de Afiliados" 
        description="Transforme sua rede em receita recorrente com o Titan Loterias."
        icon={Users}
      />
      <AffiliateDashboard />
    </div>
  );
}
