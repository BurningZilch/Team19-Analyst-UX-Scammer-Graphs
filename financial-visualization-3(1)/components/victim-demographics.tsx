"use client"

import { useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, BarChart, XAxis, YAxis, ResponsiveContainer, Cell, LabelList } from "recharts"
import type { SelectedNode } from "@/app/page"

interface Node {
  id: string
  group: string
  risk: number
  label: string
  location: string
}

interface Link {
  source: string
  target: string
  type: string
  scam_type?: string
}

interface GraphData {
  nodes: Node[]
  links: Link[]
}

interface DemographicData {
  id: string
  age: number
  ageGroup: string
  gender: string
  scamType: string
}

interface VictimDemographicsProps {
  data: GraphData
  selectedNode: SelectedNode | null
  relatedVictimIds: Set<string> | null
}

// Generate synthetic demographic data for victims
function generateDemographics(data: GraphData, relatedVictimIds: Set<string> | null): DemographicData[] {
  const victims = relatedVictimIds
    ? data.nodes.filter((n) => n.group === "victim" && relatedVictimIds.has(n.id))
    : data.nodes.filter((n) => n.group === "victim")
  const attackLinks = data.links.filter((l) => l.type === "attack")

  const genders = ["Male", "Female", "Non-binary"]

  const getAgeForScamType = (scamType: string): number => {
    switch (scamType) {
      case "Romance":
        return 45 + Math.floor(Math.random() * 30)
      case "Investment":
        return 35 + Math.floor(Math.random() * 35)
      case "Banking":
        return 25 + Math.floor(Math.random() * 50)
      case "Gambling":
        return 20 + Math.floor(Math.random() * 30)
      default:
        return 30 + Math.floor(Math.random() * 40)
    }
  }

  const getAgeGroup = (age: number): string => {
    if (age < 25) return "18-24"
    if (age < 35) return "25-34"
    if (age < 45) return "35-44"
    if (age < 55) return "45-54"
    if (age < 65) return "55-64"
    return "65+"
  }

  return victims.map((victim) => {
    const attack = attackLinks.find((l) => l.target === victim.id)
    const scamType = attack?.scam_type || "Unknown"
    const age = getAgeForScamType(scamType)

    return {
      id: victim.id,
      age,
      ageGroup: getAgeGroup(age),
      gender: genders[Math.floor(Math.random() * genders.length)],
      scamType,
    }
  })
}

const AGE_COLORS = ["#22c55e", "#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#ef4444"]

export function VictimDemographics({ data, selectedNode, relatedVictimIds }: VictimDemographicsProps) {
  const demographics = useMemo(() => generateDemographics(data, relatedVictimIds), [data, relatedVictimIds])

  const ageData = useMemo(() => {
    const counts: Record<string, number> = {}
    demographics.forEach((d) => {
      counts[d.ageGroup] = (counts[d.ageGroup] || 0) + 1
    })
    const order = ["18-24", "25-34", "35-44", "45-54", "55-64", "65+"]
    return order.map((group, idx) => ({
      name: group,
      value: counts[group] || 0,
      color: AGE_COLORS[idx],
    }))
  }, [demographics])

  const ageByScamType = useMemo(() => {
    const byType: Record<string, number[]> = {}
    demographics.forEach((d) => {
      if (!byType[d.scamType]) byType[d.scamType] = []
      byType[d.scamType].push(d.age)
    })
    return Object.entries(byType).map(([type, ages]) => ({
      type,
      avgAge: Math.round(ages.reduce((a, b) => a + b, 0) / ages.length),
      minAge: Math.min(...ages),
      maxAge: Math.max(...ages),
    }))
  }, [demographics])

  const avgAge =
    demographics.length > 0 ? Math.round(demographics.reduce((sum, d) => sum + d.age, 0) / demographics.length) : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>{selectedNode ? `Victim Demographics (${selectedNode.label})` : "Victim Demographics"}</CardTitle>
        <CardDescription>Age distribution of victims</CardDescription>
      </CardHeader>
      <CardContent>
        {demographics.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2">
            {/* Age Distribution */}
            <div>
              <h4 className="text-sm font-medium mb-3 text-foreground">Age Distribution</h4>
              <div className="bg-muted/50 rounded-lg p-3">
                <ResponsiveContainer width="100%" height={192}>
                  <BarChart data={ageData} layout="vertical">
                    <XAxis type="number" tick={{ fill: "#ffffff", fontSize: 12, fontWeight: 500 }} />
                    <YAxis
                      dataKey="name"
                      type="category"
                      width={50}
                      tick={{ fill: "#ffffff", fontSize: 12, fontWeight: 500 }}
                    />
                    <Bar dataKey="value" radius={4}>
                      {ageData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
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
              </div>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Average Age: <span className="font-medium text-foreground">{avgAge} years</span>
              </p>
            </div>

            {/* Age by Scam Type */}
            <div>
              <h4 className="text-sm font-medium mb-3 text-foreground">Average Age by Scam Type</h4>
              <div className="space-y-3">
                {ageByScamType.map((item) => {
                  const scamColors: Record<string, string> = {
                    Investment: "#8b5cf6",
                    Banking: "#ec4899",
                    Romance: "#f43f5e",
                    Gambling: "#f97316",
                  }
                  return (
                    <div key={item.type} className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: scamColors[item.type] || "#94a3b8" }}
                      />
                      <span className="text-sm text-foreground w-24">{item.type}</span>
                      <div className="flex-1 bg-secondary rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${(item.avgAge / 80) * 100}%`,
                            backgroundColor: scamColors[item.type] || "#94a3b8",
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium text-foreground w-16 text-right">{item.avgAge} yrs</span>
                    </div>
                  )
                })}
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Romance scam victims tend to be older, while Gambling scams target younger demographics
              </p>
            </div>
          </div>
        ) : (
          <div className="h-[200px] flex items-center justify-center text-muted-foreground">
            No victim data for this selection
          </div>
        )}
      </CardContent>
    </Card>
  )
}
