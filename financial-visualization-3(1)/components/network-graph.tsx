"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import * as d3 from "d3"
import type { SelectedNode } from "@/app/page"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

interface Node {
  id: string
  group: string
  risk: number
  label: string
  location: string
  size: number
  financial_instrument?: string
  scam_type?: string
  x?: number
  y?: number
  fx?: number | null
  fy?: number | null
}

interface Link {
  source: string | Node
  target: string | Node
  type: string
  amount?: number
  scam_type?: string
  method?: string
}

interface GraphData {
  nodes: Node[]
  links: Link[]
}

const NODE_COLORS: Record<string, string> = {
  financial_node: "#f59e0b",
  scammer: "#ef4444",
  victim: "#3b82f6",
}

const SCAM_TYPE_COLORS: Record<string, string> = {
  Investment: "#8b5cf6",
  Banking: "#ec4899",
  Romance: "#f43f5e",
  Gambling: "#f97316",
}

export function NetworkGraph({
  data,
  onNodeSelect,
  onRiskScoreChange,
  focusNodeId,
  onFocusComplete,
}: {
  data: GraphData
  onNodeSelect?: (node: SelectedNode | null) => void
  onRiskScoreChange?: (nodeId: string, newRisk: number) => void
  focusNodeId?: string | null
  onFocusComplete?: () => void
}) {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null)
  const gRef = useRef<d3.Selection<SVGGElement, unknown, null, undefined> | null>(null)
  const nodesRef = useRef<Node[]>([])
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })
  const [filter, setFilter] = useState<string>("all")
  const [minRiskScore, setMinRiskScore] = useState<number>(0)
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [searchResults, setSearchResults] = useState<Node[]>([])
  const [showSearchResults, setShowSearchResults] = useState<boolean>(false)

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: Math.max(500, window.innerHeight - 300),
        })
      }
    }
    updateDimensions()
    window.addEventListener("resize", updateDimensions)
    return () => window.removeEventListener("resize", updateDimensions)
  }, [])

  const filteredData = useCallback(() => {
    let filteredNodes = data.nodes.filter((node) => node.risk >= minRiskScore)

    if (filter !== "all") {
      filteredNodes = filteredNodes.filter((node) => {
        if (filter === "financial_node") return node.group === "financial_node"
        if (filter === "scammer") return node.group === "scammer"
        if (filter === "victim") return node.group === "victim"
        if (["Investment", "Banking", "Romance", "Gambling"].includes(filter)) {
          return node.scam_type === filter || node.group === "financial_node" || node.group === "victim"
        }
        return true
      })
    }

    const nodeIds = new Set(filteredNodes.map((n) => n.id))
    const filteredLinks = data.links.filter((link) => {
      const sourceId = typeof link.source === "string" ? link.source : link.source.id
      const targetId = typeof link.target === "string" ? link.target : link.target.id
      return nodeIds.has(sourceId) && nodeIds.has(targetId)
    })

    return { nodes: filteredNodes, links: filteredLinks }
  }, [data, filter, minRiskScore])

  useEffect(() => {
    if (!svgRef.current || !data) return

    const svg = d3.select(svgRef.current)
    svg.selectAll("*").remove()

    const { width, height } = dimensions
    const graphData = filteredData()

    const nodes: Node[] = graphData.nodes.map((d) => ({ ...d }))
    const links: Link[] = graphData.links.map((d) => ({ ...d }))

    nodesRef.current = nodes

    const g = svg.append("g")
    gRef.current = g

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform)
      })

    zoomRef.current = zoom
    svg.call(zoom)

    svg
      .append("defs")
      .selectAll("marker")
      .data(["laundering", "attack"])
      .join("marker")
      .attr("id", (d) => `arrow-${d}`)
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 20)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("fill", (d) => (d === "laundering" ? "#f59e0b" : "#94a3b8"))
      .attr("d", "M0,-5L10,0L0,5")

    const simulation = d3
      .forceSimulation(nodes)
      .force(
        "link",
        d3
          .forceLink<Node, Link>(links)
          .id((d) => d.id)
          .distance(100),
      )
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(30))

    const link = g
      .append("g")
      .attr("class", "links")
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke", (d) => (d.type === "laundering" ? "#f59e0b" : "#94a3b8"))
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", (d) => (d.type === "laundering" ? 3 : 1))
      .attr("marker-end", (d) => `url(#arrow-${d.type})`)

    const node = g
      .append("g")
      .attr("class", "nodes")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .attr("cursor", "pointer")
      .call(
        d3
          .drag<SVGGElement, Node>()
          .on("start", (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart()
            d.fx = d.x
            d.fy = d.y
          })
          .on("drag", (event, d) => {
            d.fx = event.x
            d.fy = event.y
          })
          .on("end", (event, d) => {
            if (!event.active) simulation.alphaTarget(0)
            d.fx = null
            d.fy = null
          }),
      )

    node
      .append("circle")
      .attr("r", (d) => {
        if (d.group === "financial_node") return 24
        if (d.group === "scammer") return 16
        return 10
      })
      .attr("fill", (d) => {
        if (d.scam_type) return SCAM_TYPE_COLORS[d.scam_type] || NODE_COLORS[d.group]
        return NODE_COLORS[d.group]
      })
      .attr("stroke", "#1e293b")
      .attr("stroke-width", 2)
      .attr("opacity", 0.9)

    node
      .append("circle")
      .attr("r", (d) => {
        if (d.group === "financial_node") return 28
        if (d.group === "scammer") return 20
        return 14
      })
      .attr("fill", "none")
      .attr("stroke", (d) => {
        if (d.risk >= 80) return "#ef4444"
        if (d.risk >= 50) return "#f59e0b"
        return "#22c55e"
      })
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", "4,2")
      .attr("opacity", 0.7)

    node
      .filter((d) => d.group !== "victim")
      .append("text")
      .attr("dy", (d) => (d.group === "financial_node" ? 40 : 32))
      .attr("text-anchor", "middle")
      .attr("fill", "#e2e8f0")
      .attr("font-size", "10px")
      .attr("font-weight", "500")
      .text((d) => d.label.split(" ").slice(0, 2).join(" "))

    node.on("click", (_event, d) => {
      const freshNode = data.nodes.find((n) => n.id === d.id) || d
      setSelectedNode(freshNode)
      onNodeSelect?.({
        id: freshNode.id,
        group: freshNode.group,
        label: freshNode.label,
        location: freshNode.location,
        scam_type: freshNode.scam_type,
      })

      if (zoomRef.current && d.x !== undefined && d.y !== undefined) {
        const scale = 1.5
        const x = width / 2 - d.x * scale
        const y = height / 2 - d.y * scale

        svg.transition().duration(750).call(zoomRef.current.transform, d3.zoomIdentity.translate(x, y).scale(scale))
      }
    })

    simulation.on("tick", () => {
      link
        .attr("x1", (d) => (d.source as Node).x!)
        .attr("y1", (d) => (d.source as Node).y!)
        .attr("x2", (d) => (d.target as Node).x!)
        .attr("y2", (d) => (d.target as Node).y!)

      node.attr("transform", (d) => `translate(${d.x},${d.y})`)

      nodesRef.current = nodes
    })

    svg.call(zoom.transform, d3.zoomIdentity.translate(0, 0).scale(0.8))

    return () => {
      simulation.stop()
    }
  }, [data, dimensions, filteredData, onNodeSelect])

  useEffect(() => {
    if (selectedNode) {
      const updatedNode = data.nodes.find((n) => n.id === selectedNode.id)
      if (updatedNode && updatedNode.risk !== selectedNode.risk) {
        setSelectedNode(updatedNode)
      }
    }
  }, [data, selectedNode])

  useEffect(() => {
    if (!focusNodeId || !svgRef.current || !zoomRef.current) return

    const node = nodesRef.current.find((n) => n.id === focusNodeId)
    if (node && node.x !== undefined && node.y !== undefined) {
      const svg = d3.select(svgRef.current)
      const { width, height } = dimensions
      const scale = 1.5
      const x = width / 2 - node.x * scale
      const y = height / 2 - node.y * scale

      svg
        .transition()
        .duration(750)
        .call(zoomRef.current.transform, d3.zoomIdentity.translate(x, y).scale(scale))
        .on("end", () => {
          onFocusComplete?.()
        })

      const freshNode = data.nodes.find((n) => n.id === focusNodeId)
      if (freshNode) {
        setSelectedNode(freshNode)
      }
    }
  }, [focusNodeId, dimensions, data.nodes, onFocusComplete])

  const handleClearSelection = () => {
    setSelectedNode(null)
    onNodeSelect?.(null)
  }

  const handleRiskChange = (value: number[]) => {
    if (selectedNode && onRiskScoreChange) {
      onRiskScoreChange(selectedNode.id, value[0])
    }
  }

  const handleSearch = useCallback(
    (query: string) => {
      setSearchQuery(query)
      if (query.trim() === "") {
        setSearchResults([])
        setShowSearchResults(false)
        return
      }
      const results = data.nodes.filter((node) => node.label.toLowerCase().includes(query.toLowerCase()))
      setSearchResults(results)
      setShowSearchResults(true)
    },
    [data.nodes],
  )

  const handleSelectFromSearch = useCallback(
    (node: Node) => {
      setSearchQuery("")
      setSearchResults([])
      setShowSearchResults(false)

      const currentNode = nodesRef.current.find((n) => n.id === node.id)
      if (
        currentNode &&
        currentNode.x !== undefined &&
        currentNode.y !== undefined &&
        svgRef.current &&
        zoomRef.current
      ) {
        const svg = d3.select(svgRef.current)
        const { width, height } = dimensions
        const scale = 1.5
        const x = width / 2 - currentNode.x * scale
        const y = height / 2 - currentNode.y * scale

        svg.transition().duration(750).call(zoomRef.current.transform, d3.zoomIdentity.translate(x, y).scale(scale))
      }

      const freshNode = data.nodes.find((n) => n.id === node.id) || node
      setSelectedNode(freshNode)
      onNodeSelect?.({
        id: freshNode.id,
        group: freshNode.group,
        label: freshNode.label,
        location: freshNode.location,
        scam_type: freshNode.scam_type,
      })
    },
    [data.nodes, dimensions, onNodeSelect],
  )

  return (
    <div className="flex flex-col gap-4">
      {/* Filter Controls */}
      <div className="flex flex-wrap gap-4 p-4 bg-card rounded-lg border border-border">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by name..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => searchQuery && setShowSearchResults(true)}
            onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
            className="pl-9 w-48"
          />
          {/* Search Results Dropdown */}
          {showSearchResults && searchResults.length > 0 && (
            <div className="absolute z-50 top-full left-0 mt-1 w-64 bg-card border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {searchResults.map((node) => (
                <button
                  key={node.id}
                  onClick={() => handleSelectFromSearch(node)}
                  className="w-full px-3 py-2 text-left hover:bg-secondary/50 flex items-center gap-2 text-sm"
                >
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{
                      backgroundColor: node.scam_type
                        ? SCAM_TYPE_COLORS[node.scam_type] || NODE_COLORS[node.group]
                        : NODE_COLORS[node.group],
                    }}
                  />
                  <span className="truncate text-foreground">{node.label}</span>
                  <span className="text-xs text-muted-foreground ml-auto capitalize">
                    {node.group.replace("_", " ")}
                  </span>
                </button>
              ))}
            </div>
          )}
          {showSearchResults && searchQuery && searchResults.length === 0 && (
            <div className="absolute z-50 top-full left-0 mt-1 w-64 bg-card border border-border rounded-lg shadow-lg p-3 text-sm text-muted-foreground">
              No results found
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground mr-2">Filter:</span>
          {["all", "financial_node", "scammer", "victim", "Investment", "Banking", "Romance", "Gambling"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                filter === f
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              {f === "all" ? "All" : f === "financial_node" ? "Financial" : f}
            </button>
          ))}
        </div>

        {/* Min Risk Score Slider */}
        <div className="flex items-center gap-3 ml-auto border-l border-border pl-4">
          <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">Min Risk Score:</span>
          <Slider
            value={[minRiskScore]}
            onValueChange={(value) => setMinRiskScore(value[0])}
            max={100}
            min={0}
            step={1}
            className="w-32"
          />
          <span
            className={`min-w-[3rem] text-sm font-medium px-2 py-0.5 rounded ${
              minRiskScore >= 80
                ? "bg-red-500/20 text-red-400"
                : minRiskScore >= 50
                  ? "bg-amber-500/20 text-amber-400"
                  : "bg-green-500/20 text-green-400"
            }`}
          >
            {minRiskScore}+
          </span>
        </div>
      </div>

      <div className="flex gap-4">
        {/* Graph Container */}
        <div ref={containerRef} className="flex-1 bg-card rounded-lg border border-border overflow-hidden">
          <svg ref={svgRef} width={dimensions.width} height={dimensions.height} className="bg-slate-950" />
        </div>

        {/* Node Details Panel */}
        {selectedNode && (
          <div className="w-80 bg-card rounded-lg border border-border p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">{selectedNode.label}</h3>
              <button onClick={handleClearSelection} className="text-muted-foreground hover:text-foreground">
                ✕
              </button>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type:</span>
                <span className="capitalize text-foreground">{selectedNode.group.replace("_", " ")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Location:</span>
                <span className="text-foreground">{selectedNode.location}</span>
              </div>
              <div className="space-y-2 pt-2">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Risk Score:</span>
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-medium ${
                      selectedNode.risk >= 80
                        ? "bg-red-500/20 text-red-400"
                        : selectedNode.risk >= 50
                          ? "bg-amber-500/20 text-amber-400"
                          : "bg-green-500/20 text-green-400"
                    }`}
                  >
                    {selectedNode.risk}
                  </span>
                </div>
                <Slider
                  value={[selectedNode.risk]}
                  onValueChange={handleRiskChange}
                  max={100}
                  min={0}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Low</span>
                  <span>Medium</span>
                  <span>High</span>
                </div>
              </div>
              {selectedNode.scam_type && (
                <div className="flex justify-between pt-2">
                  <span className="text-muted-foreground">Scam Type:</span>
                  <span
                    className="px-2 py-0.5 rounded text-xs font-medium"
                    style={{
                      backgroundColor: `${SCAM_TYPE_COLORS[selectedNode.scam_type]}30`,
                      color: SCAM_TYPE_COLORS[selectedNode.scam_type],
                    }}
                  >
                    {selectedNode.scam_type}
                  </span>
                </div>
              )}
              {selectedNode.financial_instrument && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Instrument:</span>
                  <span className="text-foreground">{selectedNode.financial_instrument}</span>
                </div>
              )}
            </div>

            {/* Connected Nodes */}
            <div className="pt-4 border-t border-border">
              <h4 className="text-sm font-medium text-foreground mb-2">Connections</h4>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {data.links
                  .filter((l) => {
                    const sourceId = typeof l.source === "string" ? l.source : l.source.id
                    const targetId = typeof l.target === "string" ? l.target : l.target.id
                    return sourceId === selectedNode.id || targetId === selectedNode.id
                  })
                  .map((l, i) => {
                    const sourceId = typeof l.source === "string" ? l.source : l.source.id
                    const targetId = typeof l.target === "string" ? l.target : l.target.id
                    const connectedId = sourceId === selectedNode.id ? targetId : sourceId
                    const connectedNode = data.nodes.find((n) => n.id === connectedId)
                    return (
                      <div key={i} className="text-xs text-muted-foreground flex items-center gap-2">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{
                            backgroundColor: l.type === "laundering" ? "#f59e0b" : "#94a3b8",
                          }}
                        />
                        <span className="truncate">{connectedNode?.label}</span>
                        {l.amount && <span className="text-amber-400 ml-auto">${l.amount.toLocaleString()}</span>}
                      </div>
                    )
                  })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-6 p-4 bg-card rounded-lg border border-border">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-muted-foreground">Nodes:</span>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full bg-amber-500" />
            <span className="text-xs text-foreground">Financial Node</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-xs text-foreground">Scammer</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <span className="text-xs text-foreground">Victim</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-muted-foreground">Scam Types:</span>
          {Object.entries(SCAM_TYPE_COLORS).map(([type, color]) => (
            <div key={type} className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-xs text-foreground">{type}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-muted-foreground">Links:</span>
          <div className="flex items-center gap-2">
            <span className="w-6 h-0.5 bg-amber-500" />
            <span className="text-xs text-foreground">Money Laundering</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-6 h-0.5 bg-slate-400" />
            <span className="text-xs text-foreground">Attack</span>
          </div>
        </div>
      </div>
    </div>
  )
}
