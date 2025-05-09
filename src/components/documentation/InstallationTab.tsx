
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Download, FileCode } from "lucide-react";

interface InstallationTabProps {
  installation: string | null;
  readme: string | null;
  isLoading: boolean;
}

export function InstallationTab({ installation, readme, isLoading }: InstallationTabProps) {
  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-muted rounded w-1/3"></div>
        <div className="h-60 bg-muted rounded"></div>
      </div>
    );
  }

  if (!installation && !readme) {
    return (
      <div>
        <h2 className="text-2xl font-bold">Installation Guide</h2>
        <p className="text-muted-foreground mt-2">
          No installation instructions available. Please check the repository's README for more information.
        </p>
      </div>
    );
  }
  
  // Extract installation instructions from README if Gemini didn't provide them
  const getInstallationFromReadme = () => {
    if (!readme) return null;
    
    // Look for common installation headers in the README
    const installationRegex = /(?:##?\s+(?:installation|getting started|setup|how to use|quick start)|```(?:bash|sh))/i;
    if (installationRegex.test(readme)) {
      const matches = readme.split(installationRegex);
      if (matches.length > 1) {
        // Extract the section after the installation header
        let installSection = matches[1];
        
        // Limit to the next section if it exists
        const nextSectionMatch = installSection.match(/##?\s+[a-z\s]+/i);
        if (nextSectionMatch && nextSectionMatch.index) {
          installSection = installSection.substring(0, nextSectionMatch.index);
        }
        
        return installSection.trim();
      }
    }
    return null;
  };
  
  const readmeInstallation = getInstallationFromReadme();
  const installationInstructions = installation || readmeInstallation;
  
  // Create a checklist of prerequisites based on common development needs
  const prerequisiteChecklist = [
    { name: "Git", command: "git --version" },
    { name: "Node.js", command: "node --version" },
    { name: "npm or yarn", command: "npm --version" },
    { name: "Docker", command: "docker --version" },
    { name: "Python", command: "python --version" },
  ];
  
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Installation Guide</h2>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Check className="mr-2 h-5 w-5" />
            Prerequisites
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Make sure you have the necessary tools installed before proceeding:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {prerequisiteChecklist.map(item => (
              <div key={item.name} className="flex items-center p-2 border rounded-md">
                <div className="h-4 w-4 border rounded-sm mr-2 flex items-center justify-center">
                  {/* Intentionally left unchecked for user to check */}
                </div>
                <div>
                  <div className="text-sm font-medium">{item.name}</div>
                  <div className="text-xs text-muted-foreground font-mono">{item.command}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Download className="mr-2 h-5 w-5" />
            Installation Steps
          </CardTitle>
        </CardHeader>
        <CardContent className="max-h-[500px] overflow-y-auto">
          {installationInstructions ? (
            <div className="prose prose-sm prose-invert max-w-none">
              <pre className="whitespace-pre-wrap text-sm bg-muted p-4 rounded-md">
                {installationInstructions}
              </pre>
            </div>
          ) : (
            <div className="text-muted-foreground bg-muted p-4 rounded-md">
              <p>No detailed installation instructions found.</p>
              <p className="mt-2">General installation steps:</p>
              <ol className="list-decimal pl-5 mt-2 space-y-2">
                <li>Clone the repository: <code className="bg-background px-1 rounded">git clone [repository URL]</code></li>
                <li>Navigate to the project directory: <code className="bg-background px-1 rounded">cd [repository name]</code></li>
                <li>Install dependencies (if applicable)</li>
                <li>Follow configuration instructions in the README</li>
                <li>Start the application</li>
              </ol>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileCode className="mr-2 h-5 w-5" />
            Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            After installation, you may need to configure the application by:
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-2 text-sm">
            <li>Setting up environment variables</li>
            <li>Configuring database connections</li>
            <li>Setting API keys and tokens</li>
            <li>Adjusting application settings</li>
          </ul>
          <div className="mt-4 p-3 bg-primary/10 border border-primary/20 rounded-md text-sm">
            <p className="font-medium">💡 Tip:</p>
            <p className="mt-1">Check for configuration files like <code>.env.example</code>, <code>config.json</code>, or documentation in the README for specific configuration instructions.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
