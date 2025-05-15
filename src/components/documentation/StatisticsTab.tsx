import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Progress } from "@/components/ui/progress";
import { RepoData, RepoLanguages, RepoStats } from "@/services/githubService";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend, LineChart, Line, PieChart, Pie, Cell, Area, AreaChart, CartesianGrid } from "recharts";
import { CalendarDays, GitBranch, GitPullRequest, Star } from "lucide-react";
import { useMemo, useState, useEffect, lazy, Suspense } from "react";

// Lazy load chart components
const LanguageChart = lazy(() => import('./charts/LanguageChart'));
const CommitActivityChart = lazy(() => import('./charts/CommitActivityChart'));

interface StatisticsTabProps {
  stats: RepoStats | null;
  languages: RepoLanguages | null;
  repoData: RepoData | null;
  isLoading: boolean;
}

export function StatisticsTab({ stats, languages, repoData, isLoading }: StatisticsTabProps) {
  // Memoize language data
  const languageData = useMemo(() => {
    if (!languages || Object.keys(languages).length === 0) return [];
    
    const total = Object.values(languages).reduce((sum, value) => sum + value, 0);
    
    return Object.entries(languages)
      .map(([name, value]) => ({
        name,
        value,
        percentage: Math.round((value / total) * 100)
      }))
      .sort((a, b) => b.value - a.value);
  }, [languages]);
  
  // Memoize commit activity data
  const commitActivityData = useMemo(() => {
    if (!stats?.commitActivity || !Array.isArray(stats.commitActivity)) {
      return Array(12).fill(0).map((_, i) => ({
        week: `Week ${i + 1}`,
        commits: 0
      }));
    }
    
    return stats.commitActivity
      .slice(-12)
      .map((week, index) => ({
        week: `Week ${index + 1}`,
        commits: week?.total || 0
      }));
  }, [stats?.commitActivity]);
  
  // Memoize total commits
  const totalCommits = useMemo(() => 
    Array.isArray(stats?.commitActivity) 
      ? stats.commitActivity.reduce((sum, week) => sum + (week?.total || 0), 0)
      : 0
  , [stats?.commitActivity]);
  
  // Memoize code changes
  const codeChanges = useMemo(() => {
    if (!stats?.codeFrequency || !Array.isArray(stats.codeFrequency)) {
      return { additions: 0, deletions: 0 };
    }
    
    return stats.codeFrequency.reduce(
      (acc, week) => {
        if (Array.isArray(week) && week.length >= 3) {
          const [_, add, remove] = week;
          return { 
            additions: acc.additions + (add || 0), 
            deletions: acc.deletions + Math.abs(remove || 0) 
          };
        }
        return acc;
      }, 
      { additions: 0, deletions: 0 }
    );
  }, [stats?.codeFrequency]);

  if (isLoading || !stats || !repoData) {
    return (
      <div className="flex flex-col items-center justify-center py-12 animate-fadeIn">
        <div
          style={{
            width: '48px',
            height: '48px',
            border: '4px solid #2563eb22',
            borderTop: '4px solid #2563eb',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginBottom: '1rem',
          }}
        ></div>
        <div className="text-lg font-semibold text-primary mb-2">Just a sec... Making things readable for you!</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Repository Statistics</h2>
      
      {/* Key metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-background/50 backdrop-blur-sm border-border/50">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <Star className="h-8 w-8 text-yellow-500 mb-1" />
            <div className="text-2xl font-bold">{repoData.stargazers_count}</div>
            <p className="text-xs text-muted-foreground mt-1">Stars</p>
          </CardContent>
        </Card>
        <Card className="bg-background/50 backdrop-blur-sm border-border/50">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <GitBranch className="h-8 w-8 text-green-500 mb-1" />
            <div className="text-2xl font-bold">{stats.branches || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Branches</p>
          </CardContent>
        </Card>
        <Card className="bg-background/50 backdrop-blur-sm border-border/50">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <GitPullRequest className="h-8 w-8 text-blue-500 mb-1" />
            <div className="text-2xl font-bold">{repoData.forks_count}</div>
            <p className="text-xs text-muted-foreground mt-1">Forks</p>
          </CardContent>
        </Card>
        <Card className="bg-background/50 backdrop-blur-sm border-border/50">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <CalendarDays className="h-8 w-8 text-purple-500 mb-1" />
            <div className="text-2xl font-bold">{totalCommits}</div>
            <p className="text-xs text-muted-foreground mt-1">Total Commits</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Language Distribution */}
        <Card className="bg-background/50 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle>Language Distribution</CardTitle>
            <CardDescription>Breakdown of programming languages used</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] -mx-2">
              <Suspense fallback={<div className="h-full w-full animate-pulse bg-muted/20 rounded-lg" />}>
                <LanguageChart data={languageData} />
              </Suspense>
            </div>
          </CardContent>
        </Card>
        
        {/* Commit Activity */}
        <Card className="bg-background/50 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle>Commit Activity</CardTitle>
            <CardDescription>Weekly commit frequency over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] -mx-2">
              <Suspense fallback={<div className="h-full w-full animate-pulse bg-muted/20 rounded-lg" />}>
                <CommitActivityChart data={commitActivityData} />
              </Suspense>
            </div>
          </CardContent>
        </Card>
        
        {/* Code Changes */}
        <Card className="bg-background/50 backdrop-blur-sm border-border/50">
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
              
              <div>
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
        <Card className="bg-background/50 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle>Repository Timeline</CardTitle>
            <CardDescription>Key dates and age information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 backdrop-blur-sm flex items-center justify-center">
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
                <div className="h-10 w-10 rounded-full bg-primary/10 backdrop-blur-sm flex items-center justify-center">
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
              
              <div>
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
