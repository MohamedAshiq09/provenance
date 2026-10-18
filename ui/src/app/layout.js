import "./globals.css";

export const metadata = {
  title: "Saturn",
  description: "A self-auditing knowledge graph that proves every answer through graph traversal and detects stale decisions as organizational knowledge evolves.",
  keywords: ["FalkorDB", "Graph Hacks", "Knowledge Graph", "Company Brain", "AI Agent", "MCP Server", "Decision Provenance"],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="icon" href="/saturn-logo.png" type="image/png" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('theme');
                  var pref = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  var theme = saved || pref;
                  document.documentElement.setAttribute('data-theme', theme);
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
