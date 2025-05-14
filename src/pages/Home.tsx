import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Github } from "lucide-react";

export function Home() {
  const [repoUrl, setRepoUrl] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (match) {
      const [, owner, repo] = match;
      navigate(`/${owner}/${repo}`);
    }
  };

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-2xl mx-auto text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">
            Welcome to GitPeek
          </h1>
          <p className="text-xl text-muted-foreground">
            Explore and analyze GitHub repositories with AI-powered insights
          </p>
        </div>

        <Card className="w-full">
          <CardHeader>
            <CardTitle>Enter Repository URL</CardTitle>
            <CardDescription>
              Paste a GitHub repository URL to get started
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex gap-4">
              <Input
                type="text"
                placeholder="https://github.com/username/repository"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                className="flex-1"
              />
              <Button type="submit">
                <Github className="mr-2 h-4 w-4" />
                Analyze
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <Card>
            <CardHeader>
              <CardTitle>AI Analysis</CardTitle>
              <CardDescription>
                Get AI-powered insights about the repository
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Code Structure</CardTitle>
              <CardDescription>
                Visualize the repository structure
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Documentation</CardTitle>
              <CardDescription>
                Access comprehensive documentation
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  );
} 