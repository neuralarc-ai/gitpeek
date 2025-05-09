
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Progress } from "@/components/ui/progress";
import { RepoData, RepoLanguages, RepoStats } from "@/services/githubService";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { CalendarDays, GitBranch, GitPullRequest, Star } from "lucide-react";

interface StatisticsTabProps {
  stats: RepoStats | null;
  languages: RepoLanguages | null;
  repoData: RepoData | null;
  isLoading: boolean;
}

export function StatisticsTab({ stats, languages, repoData, isLoading }: StatisticsTabProps) {
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

  if (!stats || !repoData) {
    return (
      <div>
        <h2 className="text-2xl font-bold">Repository Statistics</h2>
        <p className="text-muted-foreground mt-2">
          No statistics data available. Please ensure the repository is accessible.
        </p>
      </div>
    );
  }
  
  // Transform languages data for visualization
  const prepareLanguageData = () => {
    if (!languages || Object.keys(languages).length === 0) return [];
    
    const total = Object.values(languages).reduce((sum, value) => sum + value, 0);
    
    return Object.entries(languages)
      .map(([name, value]) => ({
        name,
        value,
        percentage: Math.round((value / total) * 100)
      }))
      .sort((a, b) => b.value - a.value);
  };
  
  const languageData = prepareLanguageData();
  
  // Colors for the charts
  const COLORS = ['#3b82f6', '#10b981', '#a855f7', '#f59e0b', '#ef4444', '#6b7280', '#0ea5e9', '#ec4899'];
  
  // Prepare commit activity data for the chart
  const prepareCommitActivityData = () => {
    if (!stats?.commitActivity) return [];
    
    return stats.commitActivity
      .slice(-12) // Last 12 weeks
      .map((week, index) => ({
        week: `Week ${index + 1}`,
        commits: week.total
      }));
  };
  
  const commitActivityData = prepareCommitActivityData();
  
  // Calculate code addition/deletion statistics
  const calculateCodeChanges = () => {
    if (!stats?.codeFrequency) return { additions: 0, deletions: 0 };
    
    const totals = stats.codeFrequency.reduce(
      (acc, [_, add, remove]) => ({ 
        additions: acc.additions + add, 
        deletions: acc.deletions + Math.abs(remove) 
      }), 
      { additions: 0, deletions: 0 }
    );
    
    return totals;
  };
  
  const codeChanges = calculateCodeChanges();
  
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Repository Statistics</h2>
      
      {/* Key metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <Star className="h-8 w-8 text-yellow-500 mb-1" />
            <div className="text-2xl font-bold">{repoData.stargazers_count}</div>
            <p className="text-xs text-muted-foreground mt-1">Stars</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <GitBranch className="h-8 w-8 text-green-500 mb-1" />
            <div className="text-2xl font-bold">{stats.branches}</div>
            <p className="text-xs text-muted-foreground mt-1">Branches</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <GitPullRequest className="h-8 w-8 text-blue-500 mb-1" />
            <div className="text-2xl font-bold">{repoData.forks_count}</div>
            <p className="text-xs text-muted-foreground mt-1">Forks</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <CalendarDays className="h-8 w-8 text-purple-500 mb-1" />
            <div className="text-2xl font-bold">{stats.commitActivity?.reduce((sum, week) => sum + week.total, 0) || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Total Commits</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Language Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Language Distribution</CardTitle>
            <CardDescription>Breakdown of programming languages used</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ChartContainer
                config={
                  Object.fromEntries(
                    languageData.slice(0, 8).map((lang, i) => [
                      lang.name,
                      { color: COLORS[i % COLORS.length] }
                    ])
                  )
                }
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={languageData.slice(0, 8)}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {languageData.slice(0, 8).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="rounded-lg border bg-background p-2 shadow-md">
                              <div className="font-medium">{data.name}</div>
                              <div className="text-xs text-muted-foreground">{data.percentage}%</div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
            
            <div className="space-y-2 mt-4">
              {languageData.slice(0, 5).map((lang, i) => (
                <div key={lang.name} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>{lang.name}</span>
                    <span className="text-muted-foreground">{lang.percentage}%</span>
                  </div>
                  <Progress value={lang.percentage} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        {/* Commit Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Commit Activity</CardTitle>
            <CardDescription>Weekly commit frequency over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ChartContainer
                config={{
                  commits: {
                    label: "Commits",
                    theme: {
                      light: "#3b82f6",
                      dark: "#60a5fa",
                    },
                  },
                }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={commitActivityData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                    <XAxis dataKey="week" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <ChartTooltipContent
                              payload={payload as any}
                              indicator="line"
                              labelKey="week"
                            />
                          );
                        }
                        return null;
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="commits" 
                      name="commits" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>
        
        {/* Code Changes */}
        <Card>
          <CardHeader>
            <CardTitle>Code Changes</CardTitle>
            <CardDescription>Lines of code added and removed</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">Additions</div>
                <div className="font-mono text-sm font-medium">+{codeChanges.additions.toLocaleString()}</div>
              </div>
              <Progress value={100} className="h-2 bg-green-950">
                <div className="h-full bg-green-500" />
              </Progress>
              
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">Deletions</div>
                <div className="font-mono text-sm font-medium">-{codeChanges.deletions.toLocaleString()}</div>
              </div>
              <Progress value={100} className="h-2 bg-red-950">
                <div className="h-full bg-red-500" />
              </Progress>
              
              <div className="rounded-md bg-muted p-4">
                <div className="text-sm font-medium">Code Churn Rate</div>
                <div className="text-2xl font-bold mt-1">
                  {Math.round((codeChanges.deletions / (codeChanges.additions + 0.1)) * 100)}%
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Lower is better - indicates more stable, incremental development
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Repository Age */}
        <Card>
          <CardHeader>
            <CardTitle>Repository Timeline</CardTitle>
            <CardDescription>Key dates and age information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <CalendarDays className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-medium">Created</div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(repoData.created_at).toLocaleDateString(undefined, { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <CalendarDays className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-medium">Last Updated</div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(repoData.updated_at).toLocaleDateString(undefined, { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </div>
                </div>
              </div>
              
              <div>
                <div className="text-sm font-medium mb-1">Repository Age</div>
                <div className="text-3xl font-bold">
                  {Math.floor((new Date().getTime() - new Date(repoData.created_at).getTime()) / (1000 * 60 * 60 * 24 * 30))} months
                </div>
              </div>
              
              <div className="rounded-md bg-muted p-4 mt-3">
                <div className="text-sm font-medium">Activity Score</div>
                <div className="flex items-center mt-2">
                  <Progress 
                    value={Math.min(
                      (new Date().getTime() - new Date(repoData.updated_at).getTime()) / (1000 * 60 * 60 * 24 * 30) < 1 ? 100 : 
                      (new Date().getTime() - new Date(repoData.updated_at).getTime()) / (1000 * 60 * 60 * 24 * 30) < 3 ? 70 : 
                      (new Date().getTime() - new Date(repoData.updated_at).getTime()) / (1000 * 60 * 60 * 24 * 30) < 6 ? 40 : 
                      20, 100
                    )} 
                    className="h-2 flex-1 mr-3" 
                  />
                  <span className="text-sm font-medium">
                    {(new Date().getTime() - new Date(repoData.updated_at).getTime()) / (1000 * 60 * 60 * 24) < 7 ? "Active" :
                     (new Date().getTime() - new Date(repoData.updated_at).getTime()) / (1000 * 60 * 60 * 24) < 30 ? "Recent" :
                     (new Date().getTime() - new Date(repoData.updated_at).getTime()) / (1000 * 60 * 60 * 24) < 90 ? "Moderate" :
                     "Low"}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
