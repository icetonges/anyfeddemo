// lib/text.ts — plain-text sanitizer for LLM output. Models (Gemini especially)
// emit markdown (###, **, `code`) even when asked not to; the portal renders
// plain text, so we strip the syntax while preserving the structure.
export function plainText(md: string): string {
  if (!md) return md
  return md
    .replace(/^#{1,6}\s*/gm, "")                  // # ## ### headings
    .replace(/\*\*\*([^*]+)\*\*\*/g, "$1")        // bold-italic
    .replace(/\*\*([^*]+)\*\*/g, "$1")            // **bold**
    .replace(/__([^_]+)__/g, "$1")                // __bold__
    .replace(/\*([^*\n]+)\*/g, "$1")              // *italic*
    .replace(/`{3}[a-z]*\n?/g, "").replace(/`/g, "") // code fences + inline code
    .replace(/^\s*[-*+]\s+/gm, "• ")              // normalize bullets
    .replace(/^\s*>\s?/gm, "")                    // blockquotes
    .replace(/\|/g, " ")                          // table pipes
    .replace(/^[ \t]*[-=]{3,}[ \t]*$/gm, "")      // hr / table separators
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}
