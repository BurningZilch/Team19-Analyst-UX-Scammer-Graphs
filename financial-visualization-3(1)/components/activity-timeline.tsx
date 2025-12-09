"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Search } from "lucide-react"
import type { SelectedNode } from "@/app/page"
import customEventsData from "@/data/events.json"

interface Node {
  id: string
  group: string
  risk: number
  label: string
  location: string
  scam_type?: string
}

interface Link {
  source: string
  target: string
  type: string
  scam_type?: string
  method?: string
}

interface GraphData {
  nodes: Node[]
  links: Link[]
}

interface TimelineEvent {
  id: string
  personId: string
  personLabel: string
  personType: "scammer" | "victim"
  eventType: string
  description: string
  scamType?: string
  method?: string
  date: Date
  connectedTo?: string
  isCustom?: boolean
}

interface CustomEventData {
  id: string
  personId: string
  personLabel: string
  personType: "scammer" | "victim"
  eventType: string
  description: string
  scamType?: string
  method?: string
  date: string
}

interface ActivityTimelineProps {
  data: GraphData
  selectedNode: SelectedNode | null
  onEventSelect?: (node: SelectedNode | null) => void
}

const SCAM_TYPE_COLORS: Record<string, string> = {
  Investment: "#8b5cf6",
  Banking: "#ec4899",
  Romance: "#f43f5e",
  Gambling: "#f97316",
}

const DEFAULT_EVENT_TYPES = ["Account Created", "Suspicious Activity", "Attack Initiated", "Incident Reported"]
const CUSTOM_EVENT_TYPES = [
  "Account Flagged",
  "Recovery Initiated",
  "Investigation Started",
  "Case Closed",
  "Evidence Collected",
  "Other",
]

// Generate synthetic timeline data based on the network
function generateTimelineEvents(data: GraphData): TimelineEvent[] {
  const events: TimelineEvent[] = []
  const baseDate = new Date("2024-01-01")

  const scammers = data.nodes.filter((n) => n.group === "scammer")

  scammers.forEach((scammer) => {
    const creationDate = new Date(baseDate)
    creationDate.setDate(creationDate.getDate() + Math.floor(Math.random() * 30))
    events.push({
      id: `${scammer.id}_creation`,
      personId: scammer.id,
      personLabel: scammer.label,
      personType: "scammer",
      eventType: "Account Created",
      description: `${scammer.label} account detected`,
      scamType: scammer.scam_type,
      date: creationDate,
    })

    const suspiciousDate = new Date(creationDate)
    suspiciousDate.setDate(suspiciousDate.getDate() + Math.floor(Math.random() * 14) + 3)
    events.push({
      id: `${scammer.id}_suspicious`,
      personId: scammer.id,
      personLabel: scammer.label,
      personType: "scammer",
      eventType: "Suspicious Activity",
      description: `Unusual pattern detected for ${scammer.label}`,
      scamType: scammer.scam_type,
      date: suspiciousDate,
    })
  })

  const attackLinks = data.links.filter((l) => l.type === "attack")
  attackLinks.forEach((link, idx) => {
    const scammer = data.nodes.find((n) => n.id === link.source)
    const victim = data.nodes.find((n) => n.id === link.target)

    if (scammer && victim) {
      const attackDate = new Date(baseDate)
      attackDate.setDate(attackDate.getDate() + 30 + Math.floor(Math.random() * 120))

      events.push({
        id: `attack_${idx}`,
        personId: scammer.id,
        personLabel: scammer.label,
        personType: "scammer",
        eventType: "Attack Initiated",
        description: `${scammer.label} contacted ${victim.label} via ${link.method}`,
        scamType: link.scam_type,
        method: link.method,
        date: attackDate,
        connectedTo: victim.id,
      })

      const reportDate = new Date(attackDate)
      reportDate.setDate(reportDate.getDate() + Math.floor(Math.random() * 30) + 1)
      events.push({
        id: `report_${idx}`,
        personId: victim.id,
        personLabel: victim.label,
        personType: "victim",
        eventType: "Incident Reported",
        description: `${victim.label} reported ${link.scam_type} scam`,
        scamType: link.scam_type,
        method: link.method,
        date: reportDate,
        connectedTo: scammer.id,
      })
    }
  })

  return events.sort((a, b) => b.date.getTime() - a.date.getTime())
}

export function ActivityTimeline({ data, selectedNode, onEventSelect }: ActivityTimelineProps) {
  const [selectedPerson, setSelectedPerson] = useState<string>("all")
  const [eventTypeFilter, setEventTypeFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [customEvents, setCustomEvents] = useState<TimelineEvent[]>(() => {
    return (customEventsData.events as CustomEventData[]).map((e) => ({
      ...e,
      date: new Date(e.date),
      isCustom: true,
    }))
  })
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newEvent, setNewEvent] = useState({
    personId: "",
    eventType: "",
    customEventType: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
  })

  const allEvents = useMemo(() => {
    const generated = generateTimelineEvents(data)
    const merged = [...generated, ...customEvents]
    return merged.sort((a, b) => b.date.getTime() - a.date.getTime())
  }, [data, customEvents])

  const people = useMemo(() => {
    const scammers = data.nodes.filter((n) => n.group === "scammer")
    const victims = data.nodes.filter((n) => n.group === "victim")
    return [...scammers, ...victims]
  }, [data])

  const eventTypes = useMemo(() => {
    const types = new Set(["all", ...DEFAULT_EVENT_TYPES])
    customEvents.forEach((e) => types.add(e.eventType))
    return Array.from(types)
  }, [customEvents])

  const filteredEvents = useMemo(() => {
    return allEvents
      .filter((event) => {
        if (searchQuery) {
          const query = searchQuery.toLowerCase()
          const matchesName = event.personLabel.toLowerCase().includes(query)
          const matchesDescription = event.description.toLowerCase().includes(query)
          const matchesEventType = event.eventType.toLowerCase().includes(query)
          if (!matchesName && !matchesDescription && !matchesEventType) {
            return false
          }
        }

        if (selectedNode) {
          if (selectedNode.group === "victim") {
            return event.personId === selectedNode.id || event.connectedTo === selectedNode.id
          } else if (selectedNode.group === "scammer") {
            return event.personId === selectedNode.id || event.connectedTo === selectedNode.id
          } else if (selectedNode.group === "financial_node") {
            const connectedScammers = data.links
              .filter((l) => l.type === "laundering" && l.target === selectedNode.id)
              .map((l) => l.source)
            return connectedScammers.includes(event.personId) || connectedScammers.includes(event.connectedTo || "")
          }
        }

        const personMatch = selectedPerson === "all" || event.personId === selectedPerson
        const typeMatch = eventTypeFilter === "all" || event.eventType === eventTypeFilter
        return personMatch && typeMatch
      })
      .slice(0, 50)
  }, [allEvents, selectedPerson, eventTypeFilter, selectedNode, data.links, searchQuery])

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-AU", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  }

  const handleEventClick = (event: TimelineEvent) => {
    const node = data.nodes.find((n) => n.id === event.personId)
    if (node && onEventSelect) {
      onEventSelect({
        id: node.id,
        group: node.group,
        label: node.label,
        location: node.location,
        scam_type: node.scam_type,
      })
    }
  }

  const handleCreateEvent = () => {
    const person = people.find((p) => p.id === newEvent.personId)
    if (!person) return

    const eventType = newEvent.eventType === "Other" ? newEvent.customEventType : newEvent.eventType
    if (!eventType) return

    const newTimelineEvent: TimelineEvent = {
      id: `custom_${Date.now()}`,
      personId: person.id,
      personLabel: person.label,
      personType: person.group === "scammer" ? "scammer" : "victim",
      eventType: eventType,
      description: newEvent.description,
      scamType: person.scam_type,
      date: new Date(newEvent.date),
      isCustom: true,
    }

    setCustomEvents((prev) => [...prev, newTimelineEvent])
    setIsDialogOpen(false)
    setNewEvent({
      personId: "",
      eventType: "",
      customEventType: "",
      description: "",
      date: new Date().toISOString().split("T")[0],
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{selectedNode ? `Activity Timeline (${selectedNode.label})` : "Activity Timeline"}</CardTitle>
        <CardDescription>
          Chronological activity for scammers and victims. Click on an event to focus on that person in the network
          graph.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6 items-end">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-muted-foreground">Search</label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-48 pl-8"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-muted-foreground">Person</label>
            <Select value={selectedPerson} onValueChange={setSelectedPerson}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select person" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All People</SelectItem>
                {people.map((person) => (
                  <SelectItem key={person.id} value={person.id}>
                    {person.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-muted-foreground">Event Type</label>
            <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {eventTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type === "all" ? "All Events" : type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5 bg-transparent">
                <Plus className="h-4 w-4" />
                Add Event
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create New Event</DialogTitle>
                <DialogDescription>
                  Add a custom event to the activity timeline for tracking investigations or updates.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="person">Person</Label>
                  <Select
                    value={newEvent.personId}
                    onValueChange={(v) => setNewEvent((prev) => ({ ...prev, personId: v }))}
                  >
                    <SelectTrigger id="person">
                      <SelectValue placeholder="Select person" />
                    </SelectTrigger>
                    <SelectContent>
                      {people.map((person) => (
                        <SelectItem key={person.id} value={person.id}>
                          <span className="flex items-center gap-2">
                            <span
                              className={`w-2 h-2 rounded-full ${
                                person.group === "scammer" ? "bg-red-500" : "bg-blue-500"
                              }`}
                            />
                            {person.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="eventType">Event Type</Label>
                  <Select
                    value={newEvent.eventType}
                    onValueChange={(v) => setNewEvent((prev) => ({ ...prev, eventType: v }))}
                  >
                    <SelectTrigger id="eventType">
                      <SelectValue placeholder="Select event type" />
                    </SelectTrigger>
                    <SelectContent>
                      {CUSTOM_EVENT_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {newEvent.eventType === "Other" && (
                  <div className="grid gap-2">
                    <Label htmlFor="customType">Custom Event Type</Label>
                    <Input
                      id="customType"
                      placeholder="Enter custom event type"
                      value={newEvent.customEventType}
                      onChange={(e) => setNewEvent((prev) => ({ ...prev, customEventType: e.target.value }))}
                    />
                  </div>
                )}
                <div className="grid gap-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={newEvent.date}
                    onChange={(e) => setNewEvent((prev) => ({ ...prev, date: e.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe the event..."
                    value={newEvent.description}
                    onChange={(e) => setNewEvent((prev) => ({ ...prev, description: e.target.value }))}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateEvent}
                  disabled={!newEvent.personId || !newEvent.eventType || !newEvent.description}
                >
                  Create Event
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Timeline */}
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
            {filteredEvents.map((event) => (
              <div key={event.id} className="relative pl-10 cursor-pointer" onClick={() => handleEventClick(event)}>
                <div
                  className="absolute left-2.5 top-2 w-3 h-3 rounded-full border-2 border-background"
                  style={{
                    backgroundColor: event.scamType
                      ? SCAM_TYPE_COLORS[event.scamType]
                      : event.personType === "scammer"
                        ? "#ef4444"
                        : "#3b82f6",
                  }}
                />

                <div
                  className={`bg-card border rounded-lg p-3 hover:bg-accent/50 transition-colors ${
                    selectedNode?.id === event.personId ? "border-primary ring-2 ring-primary/20" : "border-border"
                  } ${event.isCustom ? "border-l-4 border-l-amber-500" : ""}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded ${
                            event.personType === "scammer"
                              ? "bg-red-500/20 text-red-400"
                              : "bg-blue-500/20 text-blue-400"
                          }`}
                        >
                          {event.personType === "scammer" ? "Scammer" : "Victim"}
                        </span>
                        <span className="text-sm font-medium text-foreground">{event.eventType}</span>
                        {event.scamType && (
                          <span
                            className="text-xs px-2 py-0.5 rounded"
                            style={{
                              backgroundColor: `${SCAM_TYPE_COLORS[event.scamType]}30`,
                              color: SCAM_TYPE_COLORS[event.scamType],
                            }}
                          >
                            {event.scamType}
                          </span>
                        )}
                        {event.isCustom && (
                          <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-500">Custom</span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
                      {event.method && <p className="text-xs text-muted-foreground mt-0.5">Method: {event.method}</p>}
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">{formatDate(event.date)}</span>
                  </div>
                </div>
              </div>
            ))}

            {filteredEvents.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">No events found for the selected filters</div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
