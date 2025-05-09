
import { Card } from "@/components/ui/card";

interface OverviewTabProps {
  overview: string | null;
  isLoading: boolean;
}

export function OverviewTab({ overview, isLoading }: OverviewTabProps) {
  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-6 bg-muted rounded w-1/3"></div>
        <div className="h-4 bg-muted rounded w-full"></div>
        <div className="h-4 bg-muted rounded w-5/6"></div>
        <div className="h-4 bg-muted rounded w-4/6"></div>
      </div>
    );
  }

  if (!overview) {
    return (
      <div>
        <h2 className="text-xl font-bold">Repository Overview</h2>
        <p className="text-muted-foreground mt-2">
          No overview data available. Please ensure the repository is accessible.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Repository Overview</h2>
      <p className="text-muted-foreground">
        {overview}
      </p>
    </div>
  );
}
