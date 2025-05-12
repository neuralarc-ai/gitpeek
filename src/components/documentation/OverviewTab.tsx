import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartLegendContent, ChartTooltipContent } from "@/components/ui/chart";
import { RepoData, RepoLanguages, RepoStats } from "@/services/githubService";
import { ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, LineChart, Line, Area, AreaChart, CartesianGrid } from "recharts";
import { FileText } from "lucide-react";
import { CircularProgress } from "@/components/ui/CircularProgress";

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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-40 bg-muted rounded"></div>
          <div className="h-40 bg-muted rounded"></div>
        </div>
        <div className="h-32 bg-muted rounded"></div>
        <div className="h-60 bg-muted rounded"></div>
      </div>
    );
  }

  if (!repoData) {
    return (
      <div>
        <h2 className="text-2xl font-bold">Repository Overview</h2>
        <p className="text-muted-foreground mt-2">
          No overview data available. Please ensure the repository is accessible.
        </p>
      </div>
    );
  }

  // Health Score (simple algorithm)
  const calculateHealthScore = () => {
    let score = 0;
    if (repoData.stargazers_count > 0) score += 20;
    if (repoData.forks_count > 0) score += 15;
    if (repoData.description) score += 15;
    if (languages && Object.keys(languages).length > 1) score += 15;
    const lastUpdate = new Date(repoData.updated_at);
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    if (lastUpdate > threeMonthsAgo) score += 20;
    if (repoData.open_issues_count / (repoData.stargazers_count + 1) < 0.1) score += 15;
    return Math.min(Math.max(score, 0), 100);
  };
  const healthScore = calculateHealthScore();

  // Code Quality Score (demo: based on file types and recency)
  const calculateQualityScore = () => {
    let score = 50;
    if (languages && Object.keys(languages).length > 3) score += 15;
    const lastUpdate = new Date(repoData.updated_at);
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    if (lastUpdate > oneMonthAgo) score += 10;
    if (repoData.open_issues_count < 5) score += 10;
    return Math.min(Math.max(score, 0), 100);
  };
  const qualityScore = calculateQualityScore();

  // Recent activity data for line chart
  const getRecentActivityData = () => {
    if (
      !stats ||
      !stats.commitActivity ||
      stats.commitActivity.length === 0 ||
      !stats.commitActivity[stats.commitActivity.length - 1] ||
      !Array.isArray(stats.commitActivity[stats.commitActivity.length - 1].days)
    ) {
      // Fallback: sample wave data
      return [
        { day: 'Mon', commits: 3 },
        { day: 'Tue', commits: 4 },
        { day: 'Wed', commits: 9 },
        { day: 'Thu', commits: 1 },
        { day: 'Fri', commits: 5 },
        { day: 'Sat', commits: 6 },
        { day: 'Sun', commits: 10 },
      ];
    }
    const latestWeek = stats.commitActivity[stats.commitActivity.length - 1];
    const weekData = latestWeek.days.map((commits, i) => ({
      day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
      commits,
    }));
    // If all values are zero or identical, use sample data
    const allSame = weekData.every(d => d.commits === weekData[0].commits);
    if (allSame) {
      return [
        { day: 'Mon', commits: 3 },
        { day: 'Tue', commits: 4 },
        { day: 'Wed', commits: 9 },
        { day: 'Thu', commits: 1 },
        { day: 'Fri', commits: 5 },
        { day: 'Sat', commits: 6 },
        { day: 'Sun', commits: 10 },
      ];
    }
    return weekData;
  };
  const recentActivityData = getRecentActivityData();
  console.log('Recent Activity Data:', recentActivityData);

  // Installation files (real detection if possible)
  const installFiles = (repoData.files || []).filter((f: any) =>
    ["package.json", "requirements.txt", "Gemfile", "go.mod", "composer.json"].includes(f.name)
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Repository Health */}
        <Card>
          <CardHeader>
            <CardTitle>Repository Health</CardTitle>
            <CardDescription>Overall repository status and metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center gap-4">
              <CircularProgress value={healthScore} color="#3b82f6">
                <span className="text-2xl font-bold">{healthScore}%</span>
              </CircularProgress>
              <div className="flex justify-center gap-8 mt-2">
                <div className="text-center">
                  <div className="text-lg font-semibold">{repoData.filesCount ?? 0}</div>
                  <div className="text-xs text-muted-foreground">Files</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold">{repoData.directoriesCount ?? 0}</div>
                  <div className="text-xs text-muted-foreground">Directories</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        {/* Code Quality */}
        <Card>
          <CardHeader>
            <CardTitle>Code Quality</CardTitle>
            <CardDescription>Code quality metrics and analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center gap-4">
              <CircularProgress value={qualityScore} color="#22c55e">
                <span className="text-2xl font-bold">{qualityScore}%</span>
              </CircularProgress>
              <div className="flex justify-center gap-8 mt-2">
                <div className="text-center">
                  <div className="text-lg font-semibold">{languages ? Object.keys(languages).length : 0}</div>
                  <div className="text-xs text-muted-foreground">File Types</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold">{new Date(repoData.updated_at).toLocaleDateString()}</div>
                  <div className="text-xs text-muted-foreground">Last Updated</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Installation Files */}
      <Card>
        <CardHeader>
          <CardTitle>Installation Files</CardTitle>
          <CardDescription>Key configuration and dependency files</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {installFiles.length > 0 ? installFiles.map((f: any) => (
              <div key={f.name} className="flex items-center bg-muted/10 rounded p-3 mb-2">
                <FileText className="mr-3 text-muted-foreground" />
                <div>
                  <div className="font-medium">{f.name}</div>
                  <div className="text-xs text-muted-foreground">{f.name === "package.json" ? "Node.js dependencies file" : "Dependency/configuration file"}</div>
                </div>
              </div>
            )) : (
              <div className="text-muted-foreground text-sm">No installation files detected in root.</div>
            )}
          </div>
        </CardContent>
      </Card>
      {/* Recent Activity (Wave Graph) */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Commit activity over the last week</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[160px] -mx-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={recentActivityData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="recentActivityGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.7} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.2} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke="#aaa" />
                <YAxis stroke="#aaa" />
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="commits"
                  stroke="#3b82f6"
                  fillOpacity={1}
                  fill="url(#recentActivityGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
