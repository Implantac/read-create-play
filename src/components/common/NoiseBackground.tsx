import { cn } from "@/lib/utils";

export const NoiseBackground = ({ className }: { className?: string }) => {
  return (
    <div 
      className={cn(
        "fixed inset-0 pointer-events-none opacity-[0.03] z-[1]",
        "bg-[url('https://grainy-gradients.vercel.app/noise.svg')]",
        className
      )}
    />
  );
};
