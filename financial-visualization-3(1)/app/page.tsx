"use client"

import { useState } from "react"
import { NetworkGraph } from "@/components/network-graph"
import { StatsCards } from "@/components/stats-cards"
import { ScamBreakdownChart } from "@/components/scam-breakdown-chart"
import { LocationChart } from "@/components/location-chart"
import { ActivityTimeline } from "@/components/activity-timeline"
import { VictimDemographics } from "@/components/victim-demographics"
import { AnalysisPanel } from "@/components/analysis-panel"
import graphDataOriginal from "@/data/scam-network.json"
import { X } from "lucide-react"

export interface SelectedNode {
  id: string
  group: string
  label: string
  location: string
  scam_type?: string
}

interface GraphData {
  nodes: Array<{
    id: string
    group: string
    risk: number
    label: string
    location: string
    size: number
    financial_instrument?: string
    scam_type?: string
  }>
  links: Array<{
    source: string
    target: string
    type: string
    amount?: number
    scam_type?: string
    method?: string
  }>
}

export default function Home() {
  const [selectedNode, setSelectedNode] = useState<SelectedNode | null>(null)
  const [graphData, setGraphData] = useState<GraphData>(graphDataOriginal as GraphData)
  const [focusNodeId, setFocusNodeId] = useState<string | null>(null)

  const handleRiskScoreChange = (nodeId: string, newRisk: number) => {
    setGraphData((prev) => ({
      ...prev,
      nodes: prev.nodes.map((node) => (node.id === nodeId ? { ...node, risk: newRisk } : node)),
    }))
  }

  const handleEventSelect = (node: SelectedNode | null) => {
    setSelectedNode(node)
    if (node) {
      setFocusNodeId(node.id)
    }
  }

  const handleNodeSelect = (node: SelectedNode | null) => {
    setSelectedNode(node)
    // Don't set focusNodeId here since the click already handled centering
  }

  const handleFocusComplete = () => {
    setFocusNodeId(null)
  }

  const getRelatedVictimIds = (): Set<string> | null => {
    if (!selectedNode) return null

    const relatedIds = new Set<string>()

    if (selectedNode.group === "victim") {
      relatedIds.add(selectedNode.id)
    } else if (selectedNode.group === "scammer") {
      graphData.links
        .filter((l) => l.type === "attack" && l.source === selectedNode.id)
        .forEach((l) => relatedIds.add(l.target as string))
    } else if (selectedNode.group === "financial_node") {
      const connectedScammers = graphData.links
        .filter((l) => l.type === "laundering" && l.target === selectedNode.id)
        .map((l) => l.source as string)

      graphData.links
        .filter((l) => l.type === "attack" && connectedScammers.includes(l.source as string))
        .forEach((l) => relatedIds.add(l.target as string))
    }

    return relatedIds.size > 0 ? relatedIds : null
  }

  const relatedVictimIds = getRelatedVictimIds()

  return (
    <main className="min-h-screen bg-background p-6">
      <div className="max-w-[1800px] mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Scam Network Intelligence</h1>
          <p className="text-muted-foreground">
            Interactive visualization of scam networks showing relationships between victims, scammers, and financial
            instruments
          </p>
        </div>

        {selectedNode && (
          <div className="space-y-3">
            <div className="flex items-center justify-between bg-primary/10 border border-primary/20 rounded-lg px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">Filtering by:</span>
                <span className="font-medium text-foreground">{selectedNode.label}</span>
                <span className="text-xs px-2 py-0.5 rounded bg-secondary text-secondary-foreground capitalize">
                  {selectedNode.group.replace("_", " ")}
                </span>
                {selectedNode.scam_type && (
                  <span className="text-xs px-2 py-0.5 rounded bg-purple-500/20 text-purple-400">
                    {selectedNode.scam_type}
                  </span>
                )}
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
                Clear filter
              </button>
            </div>
            <AnalysisPanel
              selectedNode={graphData.nodes.find((n) => n.id === selectedNode.id) || null}
              links={graphData.links}
            />
          </div>
        )}

        {/* Stats Overview */}
        <StatsCards data={graphData} selectedNode={selectedNode} relatedVictimIds={relatedVictimIds} />

        {/* Main Network Graph */}
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-foreground">Network Graph</h2>
          <p className="text-sm text-muted-foreground">
            Click on nodes to filter all charts. Drag to reposition. Scroll to zoom.
          </p>
          <NetworkGraph
            data={graphData}
            onNodeSelect={handleNodeSelect}
            onRiskScoreChange={handleRiskScoreChange}
            focusNodeId={focusNodeId}
            onFocusComplete={handleFocusComplete}
          />
        </div>

        {/* Activity Timeline */}
        <ActivityTimeline data={graphData} selectedNode={selectedNode} onEventSelect={handleEventSelect} />

        {/* Charts Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          <ScamBreakdownChart data={graphData} selectedNode={selectedNode} relatedVictimIds={relatedVictimIds} />
          <LocationChart data={graphData} selectedNode={selectedNode} relatedVictimIds={relatedVictimIds} />
        </div>

        {/* Victim Demographics */}
        <VictimDemographics data={graphData} selectedNode={selectedNode} relatedVictimIds={relatedVictimIds} />
      </div>
    </main>
  )
}
