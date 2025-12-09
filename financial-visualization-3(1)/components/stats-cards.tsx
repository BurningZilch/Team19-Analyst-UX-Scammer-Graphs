"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, Users, AlertTriangle, Building2 } from "lucide-react"
import type { SelectedNode } from "@/app/page"

interface StatsCardsProps {
  data: {
    nodes: Array<{ id: string; group: string; risk: number; scam_type?: string }>
    links: Array<{ source: string; target: string; type: string; amount?: number; scam_type?: string }>
  }
  selectedNode: SelectedNode | null
  relatedVictimIds: Set<string> | null
}

function formatNumber(num: number): string {
  return new Intl.NumberFormat("en-US").format(num)
}

export function StatsCards({ data, selectedNode, relatedVictimIds }: StatsCardsProps) {
  const filteredVictims = relatedVictimIds
    ? data.nodes.filter((n) => n.group === "victim" && relatedVictimIds.has(n.id))
    : data.nodes.filter((n) => n.group === "victim")

  const filteredScammers = selectedNode
    ? selectedNode.group === "scammer"
      ? data.nodes.filter((n) => n.id === selectedNode.id)
      : selectedNode.group === "financial_node"
        ? data.nodes.filter((n) => {
            const connectedScammers = data.links
              .filter((l) => l.type === "laundering" && l.target === selectedNode.id)
              .map((l) => l.source)
            return connectedScammers.includes(n.id)
          })
        : data.nodes.filter((n) => n.group === "scammer")
    : data.nodes.filter((n) => n.group === "scammer")

  const filteredLaunderingLinks = selectedNode
    ? selectedNode.group === "financial_node"
      ? data.links.filter((l) => l.type === "laundering" && l.target === selectedNode.id)
      : selectedNode.group === "scammer"
        ? data.links.filter((l) => l.type === "laundering" && l.source === selectedNode.id)
        : data.links.filter((l) => l.type === "laundering")
    : data.links.filter((l) => l.type === "laundering")

  const stats = {
    totalVictims: filteredVictims.length,
    totalScammers: filteredScammers.length,
    totalLaundered: filteredLaunderingLinks.reduce((sum, l) => sum + (l.amount || 0), 0),
    avgRisk:
      filteredScammers.length > 0
        ? Math.round(filteredScammers.reduce((sum, n) => sum + n.risk, 0) / filteredScammers.length)
        : 0,
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {selectedNode ? "Related Victims" : "Total Victims"}
          </CardTitle>
          <Users className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">{stats.totalVictims}</div>
          <p className="text-xs text-muted-foreground">
            {selectedNode ? `Connected to ${selectedNode.label}` : "Across Australia"}
          </p>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {selectedNode ? "Related Scammers" : "Active Scammers"}
          </CardTitle>
          <AlertTriangle className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">{stats.totalScammers}</div>
          <p className="text-xs text-muted-foreground">Avg Risk: {stats.avgRisk}%</p>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Money Laundered</CardTitle>
          <DollarSign className="h-4 w-4 text-amber-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">${formatNumber(stats.totalLaundered)}</div>
          <p className="text-xs text-muted-foreground">
            {selectedNode ? `Via selected node` : "Via offshore accounts"}
          </p>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Financial Nodes</CardTitle>
          <Building2 className="h-4 w-4 text-purple-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">
            {selectedNode?.group === "financial_node"
              ? 1
              : data.nodes.filter((n) => n.group === "financial_node").length}
          </div>
          <p className="text-xs text-muted-foreground">Active money channels</p>
        </CardContent>
      </Card>
    </div>
  )
}
