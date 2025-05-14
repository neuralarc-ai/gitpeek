import { Github } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full py-6 px-4 border-t border-border/50 bg-background/50 backdrop-blur-sm">
      <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Github className="h-5 w-5" />
          <span className="text-sm text-muted-foreground">
            Powered by GitHub API
          </span>
        </div>
        <div className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} GitPeek. All rights reserved.
        </div>
      </div>
    </footer>
  );
} 