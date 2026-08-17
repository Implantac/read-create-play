import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from "recharts";
import { Smartphone, Download, XCircle, Eye, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
const COLORS = ['#3b82f6', '#10b981', '#ef4444', '#f59e0b'];
export const PWAAnalyticsPanel = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        shown: 0,
        accepted: 0,
        dismissed: 0,
        conversion: 0
    });
    const fetchTrackingData = async () => {
        setLoading(true);
        try {
            const { data: tracking, error } = await supabase
                .from('pwa_tracking')
                .select('*')
                .order('created_at', { ascending: false });
            if (error)
                throw error;
            const counts = (tracking || []).reduce((acc, curr) => {
                acc[curr.event_type] = (acc[curr.event_type] || 0) + 1;
                return acc;
            }, {});
            const shown = counts['prompt_shown'] || 0;
            const accepted = counts['prompt_accepted'] || 0;
            const dismissed = counts['prompt_dismissed'] || 0;
            setStats({
                shown,
                accepted,
                dismissed,
                conversion: shown > 0 ? (accepted / shown) * 100 : 0
            });
            const chartData = [
                { name: 'Exibido', value: shown, color: '#3b82f6' },
                { name: 'Aceito', value: accepted, color: '#10b981' },
                { name: 'Recusado', value: dismissed, color: '#ef4444' }
            ];
            setData(chartData);
        }
        catch (err) {
            console.error('Error fetching PWA tracking:', err);
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchTrackingData();
    }, []);
    if (loading) {
        return (<div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary"/>
      </div>);
    }
    return (<div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Smartphone className="w-5 h-5 text-primary"/>
          Analytics de Instalação PWA
        </h3>
        <Button variant="outline" size="sm" onClick={fetchTrackingData} className="gap-2">
          <RefreshCw className="w-4 h-4"/>
          Atualizar
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card/40 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Eye className="w-4 h-4 text-blue-400"/>
              <span className="text-2xl font-bold font-mono">{stats.shown}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">Visualizações</p>
          </CardContent>
        </Card>
        
        <Card className="bg-card/40 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Download className="w-4 h-4 text-emerald-400"/>
              <span className="text-2xl font-bold font-mono">{stats.accepted}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">Instalações</p>
          </CardContent>
        </Card>

        <Card className="bg-card/40 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <XCircle className="w-4 h-4 text-rose-400"/>
              <span className="text-2xl font-bold font-mono">{stats.dismissed}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">Recusas</p>
          </CardContent>
        </Card>

        <Card className="bg-card/40 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <TrendingUp className="w-4 h-4 text-primary"/>
              <span className="text-2xl font-bold font-mono">{stats.conversion.toFixed(1)}%</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">Conversão</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-card/40 border-border/50">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Distribuição de Ações</CardTitle>
          </CardHeader>
          <CardContent className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333"/>
                <XAxis dataKey="name" stroke="#888" fontSize={12}/>
                <YAxis stroke="#888" fontSize={12}/>
                <Tooltip contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '8px' }} itemStyle={{ color: '#fff' }}/>
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {data.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color}/>))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-card/40 border-border/50">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Engajamento</CardTitle>
          </CardHeader>
          <CardContent className="h-[250px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data.filter(d => d.name !== 'Exibido')} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {data.filter(d => d.name !== 'Exibido').map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color}/>))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '8px' }}/>
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>);
};
const TrendingUp = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
    <polyline points="17 6 23 6 23 12"/>
  </svg>);
