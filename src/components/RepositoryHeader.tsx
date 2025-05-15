import React from 'react';
import { Button } from "@/components/ui/button";
import { Download, Share2, ExternalLink } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { generateRepositoryAnalysisPDF } from "./RepositoryAnalysis";

interface RepositoryHeaderProps {
  repoName: string;
  repoOwner: string;
  repoUrl: string;
  analysis?: {
    overview: string | null;
    architecture: string | null;
    installation: string | null;
    codeStructure: string | null;
    languages: Record<string, number>;
    totalLines: number;
    commits: number;
    contributors: number;
    license: string;
    description: string;
    dependencies: Record<string, string>;
  };
}

export function RepositoryHeader({ repoName, repoOwner, repoUrl, analysis }: RepositoryHeaderProps) {
  const handleDownload = async () => {
    if (!analysis) {
      toast.error("Analysis data is not available");
      return;
    }
    
    try {
      await generateRepositoryAnalysisPDF({
        owner: repoOwner,
        repo: repoName,
        data: {
          languages: analysis.languages || {},
          totalLines: analysis.totalLines || 0,
          commits: analysis.commits || 0,
          contributors: analysis.contributors || 0,
          license: analysis.license || 'Not specified',
          description: analysis.description || 'No description available',
          dependencies: analysis.dependencies || {}
        }
      });
      toast.success("Analysis report downloaded successfully!");
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error("Failed to generate analysis report");
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: `${repoOwner}/${repoName} - Gitpeek Analysis`,
      text: `Check out the analysis of ${repoOwner}/${repoName} on Gitpeek!`,
      url: window.location.href
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback for browsers that don't support the Web Share API
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Link copied to clipboard!");
      }
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        toast.error("Failed to share the report");
      }
    }
  };

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
          onClick={handleDownload}
          disabled={!analysis}
        >
          <Download className="h-4 w-4" />
          <span className="hidden md:inline">Download Analysis</span>
          <span className="inline md:hidden">Download</span>
        </Button>
        <Button 
          className="flex-1 md:flex-none gap-2 bg-gitpeek-blue hover:bg-gitpeek-blue/80"
          onClick={handleShare}
        >
          <Share2 className="h-4 w-4" />
          <span className="hidden md:inline">Share Report</span>
          <span className="inline md:hidden">Share</span>
        </Button>
      </div>
    </div>
  );
}
