import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { DashboardWidget } from "@/components/DashboardWidget";
import { GripVertical, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SortableWidgetProps {
  id: string;
  title?: string;
  subtitle?: string;
  icon?: any;
  children: React.ReactNode;
  onToggle?: () => void;
  enabled?: boolean;
  className?: string;
  noPadding?: boolean;
}

export function SortableWidget({ 
  id, 
  title, 
  subtitle, 
  icon, 
  children, 
  onToggle, 
  enabled = true,
  className,
  noPadding
}: SortableWidgetProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: enabled ? 1 : 0.5,
  };

  return (
    <div ref={setNodeRef} style={style} className={cn(isDragging && "shadow-2xl ring-2 ring-primary/20 rounded-xl")}>
      <DashboardWidget
        title={title}
        subtitle={subtitle}
        icon={icon}
        className={cn(className, !enabled && "grayscale")}
        noPadding={noPadding}
        headerAction={
          <div className="flex items-center gap-1">
            {onToggle && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-muted-foreground hover:text-primary"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggle();
                }}
              >
                {enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </Button>
            )}
            <div 
              {...attributes} 
              {...listeners} 
              className="h-8 w-8 flex items-center justify-center cursor-grab active:cursor-grabbing text-muted-foreground hover:text-primary"
            >
              <GripVertical className="w-4 h-4" />
            </div>
          </div>
        }
      >
        {enabled ? children : (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground italic text-sm">
            Widget desativado
          </div>
        )}
      </DashboardWidget>
    </div>
  );
}
