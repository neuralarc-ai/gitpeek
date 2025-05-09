
import { Card } from "@/components/ui/card";

interface ReadmeTabProps {
  readme: string | null;
  isLoading: boolean;
}

export function ReadmeTab({ readme, isLoading }: ReadmeTabProps) {
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

  if (!readme) {
    return (
      <div>
        <h2 className="text-xl font-bold">README Content</h2>
        <p className="text-muted-foreground mt-2">
          No README file found in this repository.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">README Content</h2>
      <div className="prose prose-invert max-w-none">
        <pre className="whitespace-pre-wrap text-sm">
          {readme}
        </pre>
      </div>
    </div>
  );
}
