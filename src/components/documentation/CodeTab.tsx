
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Check, Code, FileCode } from "lucide-react";

interface CodeTabProps {
  architecture: string | null;
  codeStructure: string | null;
  isLoading: boolean;
}

export function CodeTab({ architecture, codeStructure, isLoading }: CodeTabProps) {
  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-muted rounded w-1/3"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-60 bg-muted rounded"></div>
          <div className="h-60 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (!architecture && !codeStructure) {
    return (
      <div>
        <h2 className="text-2xl font-bold">Code Analysis</h2>
        <p className="text-muted-foreground mt-2">
          No code analysis data available. Please ensure the repository is accessible.
        </p>
      </div>
    );
  }
  
  // Extract potential patterns from architecture text
  const extractPatterns = () => {
    if (!architecture) return [];
    
    const commonPatterns = [
      "MVC", "MVVM", "Singleton", "Factory", "Observer", "Repository",
      "Dependency Injection", "Command", "Strategy", "Adapter", "Decorator",
      "Provider", "Container", "Component", "REST", "GraphQL", "Microservices"
    ];
    
    return commonPatterns.filter(pattern => 
      architecture.toLowerCase().includes(pattern.toLowerCase())
    );
  };
  
  const detectedPatterns = extractPatterns();
  
  // Extract code quality indicators
  const codeQualityChecklist = [
    { name: "Documentation", present: architecture?.includes("document") || false },
    { name: "Testing", present: architecture?.includes("test") || false },
    { name: "Modular Structure", present: architecture?.includes("modul") || codeStructure?.includes("modul") || false },
    { name: "Clear Dependencies", present: architecture?.includes("depend") || codeStructure?.includes("depend") || false },
    { name: "Error Handling", present: architecture?.includes("error") || codeStructure?.includes("error") || false },
    { name: "Consistent Style", present: architecture?.includes("style") || codeStructure?.includes("consistent") || false },
  ];
  
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Code Analysis</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Code className="mr-2 h-5 w-5" />
              Architecture Patterns
            </CardTitle>
            <CardDescription>
              Detected patterns and approaches in the codebase
            </CardDescription>
          </CardHeader>
          <CardContent>
            {detectedPatterns.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {detectedPatterns.map(pattern => (
                  <div 
                    key={pattern} 
                    className="px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-sm font-medium"
                  >
                    {pattern}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No specific patterns detected</p>
            )}
            
            <Table className="mt-4">
              <TableHeader>
                <TableRow>
                  <TableHead>Quality Indicator</TableHead>
                  <TableHead className="w-[100px]">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {codeQualityChecklist.map(item => (
                  <TableRow key={item.name}>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>
                      {item.present ? (
                        <div className="flex items-center">
                          <Check className="h-4 w-4 text-green-500 mr-1" />
                          <span>Present</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Not detected</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileCode className="mr-2 h-5 w-5" />
              Code Structure
            </CardTitle>
            <CardDescription>
              Analysis of the codebase organization
            </CardDescription>
          </CardHeader>
          <CardContent className="max-h-[400px] overflow-y-auto">
            <div className="text-sm whitespace-pre-line">
              {codeStructure || architecture || "No detailed analysis available"}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Detailed Architecture Analysis */}
      {architecture && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Detailed Architecture Analysis</CardTitle>
          </CardHeader>
          <CardContent className="max-h-[300px] overflow-y-auto">
            <div className="text-sm whitespace-pre-line">
              {architecture}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
