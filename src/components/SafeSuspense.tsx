import { ReactNode, Suspense } from "react";
import { ErrorBoundary } from "./ErrorBoundary";

interface SafeSuspenseProps {
  children: ReactNode;
  fallback: ReactNode;
  errorMessage?: string;
}

/**
 * A wrapper around Suspense and ErrorBoundary that specifically handles
 * dynamic import failures (ChunkLoadErrors) and provides a retry button.
 */
export function SafeSuspense({ children, fallback, errorMessage }: SafeSuspenseProps) {
  return (
    <ErrorBoundary fallbackMessage={errorMessage}>
      <Suspense fallback={fallback}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
}
