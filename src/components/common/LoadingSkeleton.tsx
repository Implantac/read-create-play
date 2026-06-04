import React from 'react';
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export const LoadingSkeleton = ({ variant = 'card', count = 1 }: { variant?: 'card' | 'list' | 'chart', count?: number }) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="w-full">
          {variant === 'card' && (
            <>
              <CardHeader className="pb-2">
                <Skeleton className="h-5 w-1/3" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-10 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </>
          )}
          {variant === 'list' && (
            <CardContent className="p-4 flex items-center space-x-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            </CardContent>
          )}
          {variant === 'chart' && (
            <CardContent className="p-6">
              <Skeleton className="h-[300px] w-full" />
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
};
