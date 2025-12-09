"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell, LabelList } from "recharts"
import type { SelectedNode } from "@/app/page"

interface LocationChartProps {
  data: {
    nodes: Array<{ id: string; group: string; location: string }>
  }
  selectedNode: SelectedNode | null
  relatedVictimIds: Set<string> | null
}

export function LocationChart({ data, selectedNode, relatedVictimIds }: LocationChartProps) {
  const filteredVictims = relatedVictimIds
    ? data.nodes.filter((n) => n.group === "victim" && relatedVictimIds.has(n.id))
    : data.nodes.filter((n) => n.group === "victim")

  const victimLocations = filteredVictims.reduce(
    (acc, n) => {
      const city = n.location.split(",")[0]
      acc[city] = (acc[city] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const chartData = Object.entries(victimLocations)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-foreground">
          {selectedNode ? `Victims by Location (${selectedNode.label})` : "Victims by Location"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} layout="vertical">
              <XAxis type="number" stroke="#ffffff" tick={{ fill: "#ffffff" }} fontSize={12} />
              <YAxis
                type="category"
                dataKey="name"
                stroke="#ffffff"
                tick={{ fill: "#ffffff" }}
                fontSize={12}
                width={100}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  color: "hsl(var(--foreground))",
                }}
                cursor={{ fill: "hsl(var(--muted))", opacity: 0.5 }}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {chartData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={`hsl(217, 91%, ${60 - index * 4}%)`} />
                ))}
                <LabelList
                  dataKey="value"
                  position="right"
                  fill="hsl(var(--foreground))"
                  fontSize={12}
                  fontWeight={500}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            No victim data for this selection
          </div>
        )}
      </CardContent>
    </Card>
  )
}
