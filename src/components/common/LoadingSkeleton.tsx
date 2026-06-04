import React from 'react';
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export const LoadingSkeleton = ({ variant = 'card', count = 1 }: { variant?: 'card' | 'list' | 'chart', count?: number }) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="w-full glass-card border-border/40 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-20" />
          {variant === 'card' && (
            <>
              <CardHeader className="pb-4">
                <Skeleton className="h-4 w-1/3 bg-muted/40" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-10 w-2/3 bg-muted/40" />
                <Skeleton className="h-4 w-full bg-muted/20" />
              </CardContent>
            </>
          )}
          {variant === 'list' && (
            <CardContent className="p-5 flex items-center space-x-5">
              <Skeleton className="h-14 w-14 rounded-2xl bg-muted/40" />
              <div className="space-y-3 flex-1">
                <Skeleton className="h-4 w-1/4 bg-muted/40" />
                <Skeleton className="h-3 w-3/4 bg-muted/20" />
              </div>
            </CardContent>
          )}
          {variant === 'chart' && (
            <CardContent className="p-8">
              <div className="flex items-end space-x-2 h-[240px]">
                <Skeleton className="h-1/3 flex-1 bg-muted/20" />
                <Skeleton className="h-2/3 flex-1 bg-muted/30" />
                <Skeleton className="h-full flex-1 bg-muted/40" />
                <Skeleton className="h-1/2 flex-1 bg-muted/30" />
                <Skeleton className="h-3/4 flex-1 bg-muted/20" />
                <Skeleton className="h-2/3 flex-1 bg-muted/30" />
              </div>
            </CardContent>
          )}
        </Card>

      ))}
    </div>
  );
};
