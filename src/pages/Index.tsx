import { Logo } from "@/components/ui/logo";
import { RepoInput } from "@/components/RepoInput";
import { Button } from "@/components/ui/button";
import { Github, Star, GitFork, Users, Code, BookOpen } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 md:p-8 bg-gradient-to-b from-background to-background/95">
      <div className="w-full max-w-4xl mx-auto flex flex-col items-center">
        <div className="mb-12 flex flex-col items-center gap-4">
          <Logo size="xlarge" />
          <h1 className="text-2xl md:text-3xl text-center max-w-md font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
            Dive Into GitHub Repositories
          </h1>
        </div>
        
        <RepoInput />
        
        <div className="mt-12 text-center text-muted-foreground text-sm">
          <p>Enter a GitHub repository URL to analyze its structure, architecture, and documentation.</p>
          <p className="mt-2">Built for developers. Powered by GitHub API and Gemini AI.</p>
        </div>

        {/* GitHub Features Section */}
        <div className="mt-16 w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="p-6 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50 hover:border-primary/50 transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <Code className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">Code Analysis</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Analyze repository structure, dependencies, and code patterns with AI-powered insights.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50 hover:border-primary/50 transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <BookOpen className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">Documentation</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Generate comprehensive documentation and understand project architecture.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50 hover:border-primary/50 transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <Users className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">Collaboration</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Understand team contributions, commit history, and project evolution.
            </p>
          </div>
        </div>

        {/* GitHub Stats */}
        <div className="mt-12 w-full flex flex-wrap justify-center gap-6">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-card/50 backdrop-blur-sm border border-border/50">
            <Star className="w-4 h-4 text-yellow-500" />
            <span className="text-sm font-medium">1M+ Stars</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-card/50 backdrop-blur-sm border border-border/50">
            <GitFork className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">500K+ Forks</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-card/50 backdrop-blur-sm border border-border/50">
            <Users className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">100K+ Users</span>
          </div>
        </div>

        {/* GitHub Integration */}
        <div className="mt-12 flex flex-col items-center gap-4">
          <Button
            variant="outline"
            className="gap-2 hover:bg-primary/10"
            onClick={() => window.open('https://github.com', '_blank')}
          >
            <Github className="w-4 h-4" />
            Connect with GitHub
          </Button>
          <p className="text-xs text-muted-foreground">
            Securely analyze your repositories with GitHub OAuth
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
