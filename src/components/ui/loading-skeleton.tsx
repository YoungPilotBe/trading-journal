import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface LoadingSkeletonProps {
  children: ReactNode;
  isLoading: boolean;
  className?: string;
}

export const LoadingSkeleton = ({
  children,
  isLoading,
  className,
}: LoadingSkeletonProps) => {
  if (isLoading) {
    return <Skeleton className={cn("h-4 w-full", className)} />;
  }

  return <>{children}</>;
};
