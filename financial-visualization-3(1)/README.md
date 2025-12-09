# Financial Visualization Dashboard

A comprehensive network visualization dashboard for analyzing financial fraud and scam networks. Built with Next.js, D3.js, and Recharts.

## Features

### Network Graph
- Interactive force-directed graph visualization of scammer and victim relationships
- Click-to-center and zoom functionality
- Search nodes by name
- Filter by node type (Scammer, Financial, Victim)
- Visual highlight on selected nodes
- Drag and pan navigation

### Activity Timeline
- Chronological event timeline
- Search events by person, description, or type
- Filter by event type
- Create custom events
- Click to focus on related node in network graph

### Analytics Charts
- **Scam Breakdown**: Pie chart of scam types distribution
- **Victims by Location**: Horizontal bar chart of victim locations
- **Age Distribution**: Bar chart of victim age demographics

### AI Analysis
- Analyze selected persons using Google Gemini AI
- Provides risk assessment, behavioral patterns, and recommendations

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Clone or download the project

2. Install dependencies:
\`\`\`bash
npm install
\`\`\`

3. Create a `.env.local` file in the root directory:
\`\`\`env
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key_here
\`\`\`

4. Run the development server:
\`\`\`bash
npm run dev
\`\`\`

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

\`\`\`
├── app/
│   ├── api/
│   │   └── analyze-person/    # AI analysis API route
│   ├── layout.tsx             # Root layout
│   └── page.tsx               # Main dashboard page
├── components/
│   ├── activity-timeline.tsx  # Event timeline component
│   ├── analysis-panel.tsx     # AI analysis panel
│   ├── location-chart.tsx     # Location bar chart
│   ├── network-graph.tsx      # D3 network visualization
│   ├── scam-breakdown-chart.tsx # Scam types pie chart
│   ├── stats-cards.tsx        # Summary statistics cards
│   └── victim-demographics.tsx # Age distribution chart
├── data/
│   ├── events.json            # Custom events storage
│   └── scam-network.json      # Network data (nodes & links)
└── README.md
\`\`\`

## Data Format

### scam-network.json
\`\`\`json
{
  "nodes": [
    {
      "id": "string",
      "name": "string",
      "type": "scammer" | "victim" | "financial",
      "scamType": "string",
      "amount": number,
      "location": "string",
      "age": number
    }
  ],
  "links": [
    {
      "source": "node_id",
      "target": "node_id",
      "type": "string"
    }
  ]
}
\`\`\`

### events.json
\`\`\`json
{
  "events": [
    {
      "id": "string",
      "personId": "string",
      "personName": "string",
      "type": "string",
      "description": "string",
      "date": "YYYY-MM-DD",
      "isCustom": boolean
    }
  ]
}
\`\`\`

## Tech Stack

- **Framework**: Next.js 15
- **Visualization**: D3.js, Recharts
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **AI**: Vercel AI SDK with Google Gemini

## License

MIT
