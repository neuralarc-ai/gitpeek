import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Folder, Info, PieChart as PieChartIcon, Zap } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, XAxis, YAxis, Bar } from "recharts";
import { FileTree } from "@/types/fileTree";

// Mock data for demo (replace with real props/data as needed)
const mockLanguages = {
  TypeScript: 12000,
  JavaScript: 8000,
  CSS: 2000,
  HTML: 1000,
};
const mockFileTypes = [
  { name: ".ts", value: 18 },
  { name: ".tsx", value: 7 },
  { name: ".js", value: 5 },
  { name: ".css", value: 3 },
  { name: ".md", value: 2 },
];
const COLORS = ["#3b82f6", "#10b981", "#a855f7", "#f59e0b", "#ef4444", "#6b7280"];

interface CodeTabProps {
  architecture: string | null;
  codeStructure: FileTree | undefined;
  isLoading: boolean;
}

export function CodeTab({ isLoading }: CodeTabProps) {
  // Primary Language
  const mainLanguage = Object.entries(mockLanguages).sort((a, b) => b[1] - a[1])[0]?.[0] || "Unknown";
  const mainLanguageColor = COLORS[0];

  // Complexity (simple demo logic)
  const fileCount = mockFileTypes.reduce((sum, f) => sum + f.value, 0);
  const complexityScore = fileCount < 10 ? 30 : fileCount < 20 ? 60 : 90;
  const complexityLabel = complexityScore < 40 ? "Low" : complexityScore < 80 ? "Medium" : "High";
  const complexityColor = complexityScore < 40 ? "bg-green-500" : complexityScore < 80 ? "bg-yellow-500" : "bg-red-500";

  // File Organization (mock)
  const mainFolders = ["components", "pages", "services", "utils"];

  // Best Practices (mock)
  const bestPractices = [
    { name: ".gitignore present", present: true },
    { name: "README.md present", present: true },
    { name: "Tests present", present: false },
    { name: "Lint config", present: true },
    { name: "Prettier config", present: false },
  ];

  // Help & Tips (mock)
  const tips = [
    "Add more tests for critical modules.",
    "Consider splitting large files for better maintainability.",
    "Document complex functions with JSDoc.",
    "Add a CONTRIBUTING.md for open source collaboration.",
  ];

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

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Code Structure</h2>
      {/* Primary Language & Complexity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5 text-blue-500" /> Primary Language
            </CardTitle>
            <CardDescription>Main language used in the repository</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <span className="inline-block w-4 h-4 rounded-full" style={{ background: mainLanguageColor }} />
              <span className="font-semibold text-lg">{mainLanguage}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" /> Complexity
            </CardTitle>
            <CardDescription>Estimated codebase complexity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 mb-2">
              <span className={`px-2 py-1 rounded text-xs font-semibold text-white ${complexityColor}`}>{complexityLabel}</span>
              <span className="text-muted-foreground text-xs">({fileCount} files)</span>
            </div>
            <div className="w-full h-2 bg-muted rounded">
              <div className={`h-2 rounded ${complexityColor}`} style={{ width: `${complexityScore}%` }} />
            </div>
          </CardContent>
        </Card>
      </div>
      {/* File Organization & Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Folder className="h-5 w-5 text-purple-500" /> File Organization
            </CardTitle>
            <CardDescription>How files and folders are organized</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 mb-2">
              {mainFolders.map(folder => (
                <span key={folder} className="inline-flex items-center gap-1 px-2 py-1 bg-muted rounded text-xs">
                  <Folder className="h-3 w-3 text-purple-400" /> {folder}
                </span>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">Project uses a modular folder structure for separation of concerns.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5 text-green-500" /> File Distribution
            </CardTitle>
            <CardDescription>Breakdown of file types in the codebase</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[140px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={mockFileTypes}
                  layout="vertical"
                  margin={{ top: 10, right: 30, left: 20, bottom: 10 }}
                  barCategoryGap={16}
                >
                  <XAxis type="number" stroke="#aaa" allowDecimals={false} />
                  <YAxis type="category" dataKey="name" stroke="#aaa" width={40} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" isAnimationActive fill="#3b82f6">
                    {mockFileTypes.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Best Practices & Tips */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-500" /> Best Practices
            </CardTitle>
            <CardDescription>Detected best practices in the repository</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {bestPractices.map(item => (
                <li key={item.name} className="flex items-center gap-2">
                  {item.present ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <span className="inline-block w-4 h-4 rounded-full bg-red-400" />
                  )}
                  <span className={item.present ? "" : "text-muted-foreground"}>{item.name}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-blue-500" /> Help & Tips
            </CardTitle>
            <CardDescription>Suggestions to improve your codebase</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {tips.map((tip, i) => (
                <li key={i} className="flex items-center gap-2">
                  <Info className="h-4 w-4 text-blue-400" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
