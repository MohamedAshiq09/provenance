import "./globals.css";

export const metadata = {
  title: "Provenance — Company Brain powered by FalkorDB",
  description: "A self-auditing knowledge graph that proves every answer through graph traversal and detects stale decisions as organizational knowledge evolves.",
  keywords: ["FalkorDB", "Graph Hacks", "Knowledge Graph", "Company Brain", "AI Agent", "MCP Server", "Decision Provenance"],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body>{children}</body>
    </html>
  );
}
