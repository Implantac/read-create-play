import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trophy, Loader2, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { AVAILABLE_LOTTERIES } from "@/hooks/useAlertsConfig";

export function BetResultsCheckerCard() {
  const [lottery, setLottery] = useState<string>("lotofacil");
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("notify-bet-results", {
        body: { lottery_id: lottery },
      });
      if (error) throw error;
      const d = data as { concurso?: number; checked?: number; pushed?: number };
      if (!d?.checked) {
        toast({ title: "Nada a verificar", description: "Você ainda não tem apostas salvas para essa loteria antes do último sorteio." });
      } else if (!d.pushed) {
        toast({
          title: `Concurso ${d.concurso} verificado`,
          description: `${d.checked} aposta(s) analisada(s). Nenhuma atingiu a faixa premiada — bora ajustar a estratégia?`,
        });
      } else {
        toast({
          title: `🎉 Você acertou! Concurso ${d.concurso}`,
          description: `Enviamos um push com o detalhamento das ${d.pushed} notificação(ões) de prêmio.`,
        });
      }
    } catch (e) {
      toast({
        title: "Erro ao verificar apostas",
        description: e instanceof Error ? e.message : "Tente novamente em instantes.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          Conferir minhas apostas
        </CardTitle>
        <CardDescription>
          Compara suas apostas salvas contra o último sorteio oficial e envia um push com os acertos e a faixa premiada.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col sm:flex-row gap-3">
        <Select value={lottery} onValueChange={setLottery}>
          <SelectTrigger className="sm:w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {AVAILABLE_LOTTERIES.map((l) => (
              <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={run} disabled={loading} className="flex-1 sm:flex-none">
          {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
          Conferir agora
        </Button>
      </CardContent>
    </Card>
  );
}
