import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TaskPilot AI - Alexa+ Voice Assistant & MCP Server',
  description: 'Voice-style task manager powered by Streamable HTTP Model Context Protocol (MCP) server and SQLite',
  authors: [{ name: 'TaskPilot AI Team' }],
  keywords: ['Alexa+', 'MCP', 'Model Context Protocol', 'Streamable HTTP', 'Task Management', 'AI Agent'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
