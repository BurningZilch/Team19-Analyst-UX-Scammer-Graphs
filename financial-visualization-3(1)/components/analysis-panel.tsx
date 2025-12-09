"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Sparkles, Loader2, X } from "lucide-react"

interface Node {
  id: string
  group: string
  risk: number
  label: string
  location: string
  scam_type?: string
  financial_instrument?: string
  size: number
}

interface Link {
  source: string | Node
  target: string | Node
  type: string
  amount?: number
  method?: string
  scam_type?: string
}

interface AnalysisPanelProps {
  selectedNode: Node | null
  links: Link[]
}

export function AnalysisPanel({ selectedNode, links }: AnalysisPanelProps) {
  const [analysis, setAnalysis] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAnalyze = async () => {
    if (!selectedNode) return

    setIsLoading(true)
    setError(null)
    setAnalysis(null)

    try {
      // Find connections for this node
      const connections = links
        .filter((link) => {
          const sourceId = typeof link.source === "object" ? link.source.id : link.source
          const targetId = typeof link.target === "object" ? link.target.id : link.target
          return sourceId === selectedNode.id || targetId === selectedNode.id
        })
        .map((link) => {
          const sourceId = typeof link.source === "object" ? link.source.id : link.source
          const targetId = typeof link.target === "object" ? link.target.id : link.target
          return {
            type: link.type,
            target: sourceId === selectedNode.id ? targetId : sourceId,
            amount: link.amount,
            method: link.method,
          }
        })

      const response = await fetch("/api/analyze-person", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ person: selectedNode, connections }),
      })

      if (!response.ok) {
        throw new Error("Failed to analyze")
      }

      const data = await response.json()
      setAnalysis(data.analysis)
    } catch (err) {
      setError("Failed to analyze. Please check your API key is configured.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setAnalysis(null)
    setError(null)
  }

  if (!selectedNode) {
    return null
  }

  return (
    <div className="space-y-3">
      <Button onClick={handleAnalyze} disabled={isLoading} className="w-full bg-transparent" variant="outline">
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Analyzing...
          </>
        ) : (
          <>
            <Sparkles className="mr-2 h-4 w-4" />
            Analyze with AI
          </>
        )}
      </Button>

      {(analysis || error) && (
        <Card className="bg-muted/50">
          <CardHeader className="pb-2 pt-3 px-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">AI Analysis</CardTitle>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleClose}>
                <X className="h-3 w-3" />
              </Button>
            </div>
            <CardDescription className="text-xs">{selectedNode.label}</CardDescription>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            {error ? (
              <p className="text-sm text-destructive">{error}</p>
            ) : (
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{analysis}</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
