
import { Button } from "@/components/ui/button";
import { Download, Share2, ExternalLink } from "lucide-react";

interface RepositoryHeaderProps {
  repoName: string;
  repoOwner: string;
  repoUrl: string;
}

export function RepositoryHeader({ repoName, repoOwner, repoUrl }: RepositoryHeaderProps) {
  return (
    <div className="w-full flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-4 bg-gitpeek-card rounded-lg border border-gitpeek-border">
      <div className="flex flex-col">
        <h1 className="text-2xl font-bold flex items-center">
          <span className="text-muted-foreground mr-1">{repoOwner} /</span> {repoName}
        </h1>
        <a 
          href={repoUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-sm text-muted-foreground hover:text-gitpeek-blue flex items-center gap-1 mt-1"
        >
          View on GitHub <ExternalLink className="h-3 w-3" />
        </a>
      </div>
      
      <div className="flex gap-2 w-full md:w-auto">
        <Button 
          variant="outline"
          className="flex-1 md:flex-none gap-2"
        >
          <Download className="h-4 w-4" />
          <span className="hidden md:inline">Download Analysis</span>
          <span className="inline md:hidden">Download</span>
        </Button>
        <Button 
          className="flex-1 md:flex-none gap-2 bg-gitpeek-blue hover:bg-gitpeek-blue/80"
        >
          <Share2 className="h-4 w-4" />
          <span className="hidden md:inline">Share Report</span>
          <span className="inline md:hidden">Share</span>
        </Button>
      </div>
    </div>
  );
}
