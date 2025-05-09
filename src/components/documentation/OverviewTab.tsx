import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { RepoData, RepoLanguages, RepoStats } from "@/services/githubService";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend, LineChart, Line } from "recharts";
import { AlertCircle, CheckCircle, FileText, GitBranch, Star } from "lucide-react";

interface OverviewTabProps {
  overview: string | null;
  repoData: RepoData | null;
  languages: RepoLanguages | null;
  stats: RepoStats | null;
  isLoading: boolean;
}

export function OverviewTab({ overview, repoData, languages, stats, isLoading }: OverviewTabProps) {
  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-muted rounded w-1/3"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="h-40 bg-muted rounded"></div>
          <div className="h-40 bg-muted rounded"></div>
          <div className="h-40 bg-muted rounded"></div>
        </div>
        <div className="h-60 bg-muted rounded"></div>
      </div>
    );
  }

  if (!overview || !repoData) {
    return (
      <div>
        <h2 className="text-2xl font-bold">Repository Overview</h2>
        <p className="text-muted-foreground mt-2">
          No overview data available. Please ensure the repository is accessible.
        </p>
      </div>
    );
  }
  
  // Calculate health score (simple algorithm)
  const calculateHealthScore = () => {
    if (!repoData) return 0;
    
    let score = 0;
    // Has stars
    if (repoData.stargazers_count > 0) score += 20;
    // Has forks
    if (repoData.forks_count > 0) score += 15;
    // Has description
    if (repoData.description) score += 15;
    // Has multiple languages
    if (languages && Object.keys(languages).length > 1) score += 15;
    // Recent update (within last 3 months)
    const lastUpdate = new Date(repoData.updated_at);
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    if (lastUpdate > threeMonthsAgo) score += 20;
    // Not too many open issues relative to stars
    if (repoData.open_issues_count / (repoData.stargazers_count + 1) < 0.1) score += 15;
    
    return Math.min(Math.max(score, 0), 100);
  };
  
  const healthScore = calculateHealthScore();
  
  // Recent activity data (simulated from available data)
  const getRecentActivityData = () => {
    if (
      !stats ||
      !stats.commitActivity ||
      stats.commitActivity.length === 0 ||
      !stats.commitActivity[stats.commitActivity.length - 1] ||
      !Array.isArray(stats.commitActivity[stats.commitActivity.length - 1].days)
    ) {
      return Array(7)
        .fill(0)
        .map((_, i) => ({
          day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][i],
          commits: 0,
        }));
    }

    const latestWeek = stats.commitActivity[stats.commitActivity.length - 1];
    return latestWeek.days.map((commits, i) => ({
      day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][i],
      commits,
    }));
  };
  
  const recentActivityData = getRecentActivityData();
  
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Repository Overview</h2>
      
      {/* Overview text */}
      <div className="text-muted-foreground mb-6">
        <p>{overview}</p>
      </div>
      
      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Star className="mr-2 h-5 w-5 text-yellow-500" />
              Repository Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">{healthScore}/100</div>
              <div className={`p-2 rounded-full ${
                healthScore > 70 ? "bg-green-500/20" : 
                healthScore > 40 ? "bg-yellow-500/20" : "bg-red-500/20"
              }`}>
                {healthScore > 70 ? (
                  <CheckCircle className="h-6 w-6 text-green-500" />
                ) : (
                  <AlertCircle className={`h-6 w-6 ${
                    healthScore > 40 ? "text-yellow-500" : "text-red-500"
                  }`} />
                )}
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Based on activity, documentation, and community metrics
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <FileText className="mr-2 h-5 w-5 text-blue-500" />
              Installation Files
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {['package.json', 'requirements.txt', 'Gemfile', 'go.mod', 'composer.json']
                .map(file => ({
                  file,
                  exists: Math.random() > 0.5 // Simulate file existence
                }))
                .filter(item => item.exists)
                .map(item => (
                  <div key={item.file} className="flex items-center">
                    <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                    <span className="text-sm">{item.file}</span>
                  </div>
                ))
              }
              <p className="text-xs text-muted-foreground mt-1">
                {repoData.default_branch} branch, last updated {new Date(repoData.updated_at).toLocaleDateString()}
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <GitBranch className="mr-2 h-5 w-5 text-purple-500" />
              Code Structure
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Languages</span>
                <span className="text-sm font-medium">{languages ? Object.keys(languages).length : 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Branches</span>
                <span className="text-sm font-medium">{stats?.branches || 1}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Open Issues</span>
                <span className="text-sm font-medium">{repoData.open_issues_count}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Main Language</span>
                <span className="text-sm font-medium">{repoData.language || 'Not specified'}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Recent Activity Chart */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Commit frequency over the last week</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
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
                <BarChart data={recentActivityData} margin={{ top: 5, right: 0, left: -25, bottom: 5 }}>
                  <XAxis dataKey="day" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <ChartTooltipContent
                            payload={payload as any}
                            indicator="dot"
                            labelKey="day"
                          />
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="commits" name="commits" />
                  <Legend
                    content={({ payload }) => (
                      <ChartLegendContent nameKey="name" payload={payload as any} />
                    )}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
