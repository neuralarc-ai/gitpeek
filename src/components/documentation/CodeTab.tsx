
import { Card } from "@/components/ui/card";

interface CodeTabProps {
  architecture: string | null;
  isLoading: boolean;
}

export function CodeTab({ architecture, isLoading }: CodeTabProps) {
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

  if (!architecture) {
    return (
      <div>
        <h2 className="text-xl font-bold">Code Analysis</h2>
        <p className="text-muted-foreground mt-2">
          No code analysis data available. Please ensure the repository is accessible.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Code Analysis</h2>
      <p className="text-muted-foreground">
        {architecture}
      </p>
    </div>
  );
}
