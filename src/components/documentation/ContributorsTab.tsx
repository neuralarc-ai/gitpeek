import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Contributor } from "@/services/githubService";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ZAxis } from "recharts";
import { Users } from "lucide-react";

interface ContributorsTabProps {
  contributors: Contributor[] | null;
  isLoading: boolean;
}

export function ContributorsTab({ contributors, isLoading }: ContributorsTabProps) {
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
  
  // Sort contributors by contributions (descending)
  const sortedContributors = [...contributors].sort((a, b) => b.contributions - a.contributions);
  
  // Prepare data for bubble chart
  const prepareContributionData = () => {
    const topContributors = sortedContributors.slice(0, 5);
    const othersContributions = sortedContributors.slice(5).reduce((sum, c) => sum + c.contributions, 0);
    
    return topContributors.map((c, index) => ({
      name: c.login,
      x: index + 1, // Position on x-axis
      y: c.contributions, // Size of bubble
      z: c.contributions, // Size of bubble
      others: othersContributions
    }));
  };
  
  const contributionData = prepareContributionData();
  
  // Colors for the chart
  const COLORS = ['#3b82f6', '#10b981', '#a855f7', '#f59e0b', '#ef4444', '#6b7280'];
  
  // Calculate contribution statistics
  const totalContributions = sortedContributors.reduce((sum, c) => sum + c.contributions, 0);
  const avgContributions = Math.round(totalContributions / sortedContributors.length);
  const topContributor = sortedContributors[0];
  const topContributionPercentage = Math.round((topContributor.contributions / totalContributions) * 100);
  
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
                  contributions: { color: COLORS[0] },
                  others: { color: COLORS[5] }
                }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart
                    margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                    <XAxis 
                      type="number" 
                      dataKey="x" 
                      name="Rank" 
                      stroke="#aaa"
                      domain={[0, 6]}
                      tickCount={6}
                    />
                    <YAxis 
                      type="number" 
                      dataKey="y" 
                      name="Contributions" 
                      stroke="#aaa"
                    />
                    <ZAxis 
                      type="number" 
                      dataKey="z" 
                      range={[50, 400]} 
                      name="Size" 
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-background border border-border p-2 rounded shadow-lg">
                              <p className="font-medium">{data.name}</p>
                              <p className="text-sm text-muted-foreground">
                                Contributions: {data.y}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Others: {data.others}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend />
                    <Scatter
                      name="Contributions"
                      data={contributionData}
                      fill={COLORS[0]}
                    >
                      {contributionData.map((entry, index) => (
                        <circle
                          key={`cell-${index}`}
                          cx={entry.x}
                          cy={entry.y}
                          r={Math.sqrt(entry.z) / 2}
                          fill={COLORS[index % COLORS.length]}
                          fillOpacity={0.6}
                        />
                      ))}
                    </Scatter>
                  </ScatterChart>
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
                <div className="text-2xl font-bold">{totalContributions}</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Avg. Commits</div>
                <div className="text-2xl font-bold">{avgContributions}</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Top Contributor</div>
                <div className="text-2xl font-bold">{topContributionPercentage}%</div>
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
            <div className="max-h-[320px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Contributions</TableHead>
                    <TableHead className="w-[100px]">%</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedContributors.slice(0, 10).map(contributor => (
                    <TableRow key={contributor.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          <img
                            src={contributor.avatar_url}
                            alt={contributor.login}
                            className="w-6 h-6 rounded-full mr-2"
                          />
                          {contributor.login}
                        </div>
                      </TableCell>
                      <TableCell>{contributor.contributions}</TableCell>
                      <TableCell>
                        {Math.round((contributor.contributions / totalContributions) * 100)}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
