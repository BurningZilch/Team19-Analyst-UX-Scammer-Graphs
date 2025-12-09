"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"
import type { SelectedNode } from "@/app/page"

interface ScamBreakdownChartProps {
  data: {
    links: Array<{ source: string; target: string; type: string; scam_type?: string }>
  }
  selectedNode: SelectedNode | null
  relatedVictimIds: Set<string> | null
}

const COLORS = {
  Investment: "#8b5cf6",
  Banking: "#ec4899",
  Romance: "#f43f5e",
  Gambling: "#f97316",
}

export function ScamBreakdownChart({ data, selectedNode, relatedVictimIds }: ScamBreakdownChartProps) {
  const filteredAttacks = relatedVictimIds
    ? data.links.filter((l) => l.type === "attack" && relatedVictimIds.has(l.target as string))
    : data.links.filter((l) => l.type === "attack")

  const breakdown = filteredAttacks.reduce(
    (acc, l) => {
      const type = l.scam_type || "Unknown"
      acc[type] = (acc[type] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const chartData = Object.entries(breakdown).map(([name, value]) => ({
    name,
    value,
    color: COLORS[name as keyof typeof COLORS] || "#94a3b8",
  }))

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-foreground">
          {selectedNode ? `Scam Types (${selectedNode.label})` : "Scam Type Distribution"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  color: "hsl(var(--foreground))",
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            No scam data for this selection
          </div>
        )}
      </CardContent>
    </Card>
  )
}
