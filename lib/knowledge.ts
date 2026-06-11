// lib/knowledge.ts — fire-and-forget client hook: every AI surface calls this
// after producing output, feeding the self-evolving knowledge base. Failures
// are silent by design (persistence must never break the UX).
export function saveKnowledge(kind: string, agency: string, title: string, content: string, model?: string) {
  try {
    void fetch("/api/knowledge", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "save", kind, agency, title, content, model }),
      keepalive: true,
    }).catch(() => {})
  } catch { /* never throw into the UI */ }
}
