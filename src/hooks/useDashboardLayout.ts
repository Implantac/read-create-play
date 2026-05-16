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

  return { layout, toggleWidget, updateOrder, isLoading };
}
