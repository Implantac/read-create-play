import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface WidgetConfig {
  id: string;
  enabled: boolean;
  order: number;
}

export function useDashboardLayout(lotteryId: string) {
  const { user } = useAuth();
  const [layout, setLayout] = useState<WidgetConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const storageKey = `dashboard_layout_${lotteryId}_${user?.id || 'guest'}`;

  useEffect(() => {
    const savedLayout = localStorage.getItem(storageKey);
    if (savedLayout) {
      setLayout(JSON.parse(savedLayout));
      setIsLoading(false);
    } else {
      // Default layout
      const defaultLayout: WidgetConfig[] = [
        { id: "workflow", enabled: true, order: 0 },
        { id: "frequency", enabled: true, order: 1 },
        { id: "heatmap", enabled: true, order: 2 },
        { id: "quick-intel", enabled: true, order: 3 },
        { id: "ai-insights", enabled: true, order: 4 },
        { id: "alpha-engine", enabled: true, order: 5 },
        { id: "personal-performance", enabled: true, order: 6 }
      ];
      setLayout(defaultLayout);
      setIsLoading(false);
    }
  }, [storageKey]);

  const saveLayout = (newLayout: WidgetConfig[]) => {
    setLayout(newLayout);
    localStorage.setItem(storageKey, JSON.stringify(newLayout));
  };

  const toggleWidget = (widgetId: string) => {
    const newLayout = layout.map(w => 
      w.id === widgetId ? { ...w, enabled: !w.enabled } : w
    );
    saveLayout(newLayout);
  };

  const updateOrder = (items: string[]) => {
    const newLayout = items.map((id, index) => {
      const existing = layout.find(w => w.id === id);
      return {
        id,
        enabled: existing?.enabled ?? true,
        order: index
      };
    });
    saveLayout(newLayout);
  };

  const exportLayout = () => {
    const data = JSON.stringify({
      lotteryId,
      layout,
      exportedAt: new Date().toISOString(),
      version: "2.0"
    }, null, 2);
    
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `titan_layout_${lotteryId}_${new Date().getTime()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const importLayout = (jsonData: string) => {
    try {
      const data = JSON.parse(jsonData);
      if (data.layout && Array.isArray(data.layout)) {
        saveLayout(data.layout);
        return true;
      }
      return false;
    } catch (e) {
      console.error("Failed to import layout:", e);
      return false;
    }
  };

  return { layout, toggleWidget, updateOrder, exportLayout, importLayout, isLoading };
}
