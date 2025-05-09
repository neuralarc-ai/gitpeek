
import { Card } from "@/components/ui/card";
import { RepoLanguages } from "@/services/githubService";

interface TechStackTabProps {
  techStack: string | null;
  languages: RepoLanguages | null;
  isLoading: boolean;
}

export function TechStackTab({ techStack, languages, isLoading }: TechStackTabProps) {
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

  if (!techStack) {
    return (
      <div>
        <h2 className="text-xl font-bold">Tech Stack Analysis</h2>
        <p className="text-muted-foreground mt-2">
          No tech stack data available. Please ensure the repository is accessible.
        </p>
      </div>
    );
  }

  // Calculate total bytes for percentage calculation
  const totalBytes = languages ? Object.values(languages).reduce((a, b) => a + b, 0) : 0;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Tech Stack Analysis</h2>
      
      <p className="text-muted-foreground">
        {techStack}
      </p>
      
      {languages && totalBytes > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-4">Language Breakdown</h3>
          <div className="space-y-3">
            {Object.entries(languages).map(([language, bytes]) => {
              const percentage = ((bytes / totalBytes) * 100).toFixed(1);
              return (
                <div key={language} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{language}</span>
                    <span>{percentage}%</span>
                  </div>
                  <div className="w-full bg-gitpeek-border/30 h-2 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gitpeek-blue" 
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
