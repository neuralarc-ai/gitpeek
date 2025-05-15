import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Contributor } from "@/services/githubService";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Users } from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { useVirtualizer } from '@tanstack/react-virtual';

interface ContributorsTabProps {
  contributors: Contributor[] | null;
  isLoading: boolean;
}

export function ContributorsTab({ contributors, isLoading }: ContributorsTabProps) {
  const [parentRef, setParentRef] = useState<HTMLDivElement | null>(null);
  
  // Memoize sorted contributors
  const sortedContributors = useMemo(() => {
    if (!contributors) return [];
    return [...contributors].sort((a, b) => b.contributions - a.contributions);
  }, [contributors]);

  // Memoize contribution data
  const contributionData = useMemo(() => {
    if (!sortedContributors.length) return [];
    
    const COLORS = ['#3b82f6', '#10b981', '#a855f7', '#f59e0b', '#ef4444', '#6b7280'];
    const topContributors = sortedContributors.slice(0, 5);
    const othersContributions = sortedContributors.slice(5).reduce((sum, c) => sum + c.contributions, 0);
    
    return [
      ...topContributors.map((c, index) => ({
        name: c.login,
        value: c.contributions,
        fill: COLORS[index % COLORS.length]
      })),
      {
        name: "Others",
        value: othersContributions,
        fill: COLORS[5]
      }
    ];
  }, [sortedContributors]);

  // Memoize statistics
  const stats = useMemo(() => {
    if (!sortedContributors.length) return null;
    
    const totalContributions = sortedContributors.reduce((sum, c) => sum + c.contributions, 0);
    const avgContributions = Math.round(totalContributions / sortedContributors.length);
    const topContributor = sortedContributors[0];
    const topContributionPercentage = Math.round((topContributor.contributions / totalContributions) * 100);
    
    return {
      totalContributions,
      avgContributions,
      topContributor,
      topContributionPercentage
    };
  }, [sortedContributors]);

  // Setup virtualization for the contributors table
  const rowVirtualizer = useVirtualizer({
    count: sortedContributors.length,
    getScrollElement: () => parentRef,
    estimateSize: () => 40, // Estimated row height
    overscan: 5
  });

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

  if (!contributors || contributors.length === 0) {
    return (
      <div>
        <h2 className="text-2xl font-bold">Contributors</h2>
        <p className="text-muted-foreground mt-2">
          No contributor data available. Please ensure the repository is accessible.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Contributors</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="mr-2 h-5 w-5" />
              Contribution Distribution
            </CardTitle>
            <CardDescription>
              How contributions are distributed across contributors
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ChartContainer
                config={{
                  value: { color: '#3b82f6' }
                }}
              >
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={contributionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                      nameKey="name"
                    >
                      {contributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          const percentage = Math.round((data.value / stats?.totalContributions) * 100);
                          return (
                            <div className="bg-background border border-border p-2 rounded shadow-lg">
                              <p className="font-medium">{data.name}</p>
                              <p className="text-sm text-muted-foreground">
                                Contributions: {data.value}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Percentage: {percentage}%
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend
                      layout="vertical"
                      verticalAlign="middle"
                      align="right"
                      formatter={(value) => (
                        <span className="text-sm">{value}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Contributors</div>
                <div className="text-2xl font-bold">{contributors.length}</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Total Commits</div>
                <div className="text-2xl font-bold">{stats?.totalContributions}</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Avg. Commits</div>
                <div className="text-2xl font-bold">{stats?.avgContributions}</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Top Contributor</div>
                <div className="text-2xl font-bold">{stats?.topContributionPercentage}%</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Top Contributors</CardTitle>
            <CardDescription>
              Based on number of contributions to the repository
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div 
              ref={setParentRef}
              className="max-h-[320px] overflow-auto"
            >
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Contributions</TableHead>
                    <TableHead className="w-[100px]">%</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <div
                    style={{
                      height: `${rowVirtualizer.getTotalSize()}px`,
                      width: '100%',
                      position: 'relative',
                    }}
                  >
                    {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                      const contributor = sortedContributors[virtualRow.index];
                      return (
                        <TableRow
                          key={contributor.id}
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            transform: `translateY(${virtualRow.start}px)`,
                          }}
                        >
                          <TableCell className="font-medium">
                            <div className="flex items-center">
                              <img
                                src={contributor.avatar_url}
                                alt={contributor.login}
                                className="w-6 h-6 rounded-full mr-2"
                                loading="lazy"
                              />
                              {contributor.login}
                            </div>
                          </TableCell>
                          <TableCell>{contributor.contributions}</TableCell>
                          <TableCell>
                            {Math.round((contributor.contributions / stats?.totalContributions) * 100)}%
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </div>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
