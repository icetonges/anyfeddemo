"use client"
// components/anyfed/agent.tsx — shared mouse-follow AI agent.
// Wrap a page in <AgentProvider> and spread agentProps(set, content) onto any
// element; a cursor-following card renders live contextual analysis on hover.
import { createContext, useContext, useEffect, useRef, useState } from "react"
import type { ReactNode } from "react"
import { useTheme } from "./ui"

export interface AgentContent { title: string; lines: string[] }
const Ctx = createContext<(c: AgentContent | null) => void>(() => {})
export const useAgentSet = () => useContext(Ctx)

/** spread onto any element to make it explain itself when hovered */
export function agentProps(set: (c: AgentContent | null) => void, content: AgentContent | (() => AgentContent)) {
  const resolve = () => (typeof content === "function" ? content() : content)
  return {
    onMouseEnter: () => set(resolve()),
    onMouseMove:  () => set(resolve()),
    onMouseLeave: () => set(null),
  }
}

export function AgentProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<AgentContent | null>(null)
  const pos = useRef({ x: 0, y: 0 })
  const [, force] = useState(0)

  useEffect(() => {
    let raf = 0
    const onMove = (e: MouseEvent) => {
      pos.current = { x: e.clientX, y: e.clientY }
      if (!raf) raf = requestAnimationFrame(() => { raf = 0; force(n => n + 1) })
    }
    window.addEventListener("mousemove", onMove)
    return () => { window.removeEventListener("mousemove", onMove); if (raf) cancelAnimationFrame(raf) }
  }, [])

  return (
    <Ctx.Provider value={setContent}>
      {children}
      <AgentCard content={content} x={pos.current.x} y={pos.current.y} />
    </Ctx.Provider>
  )
}

function AgentCard({ content, x, y }: { content: AgentContent | null; x: number; y: number }) {
  const C = useTheme()
  const last = useRef<AgentContent>({ title: "FM Data Agent", lines: ["Hover any figure, row, or bar for live analysis."] })
  if (content) last.current = content
  const info = last.current
  const active = !!content
  const W = 380, H = 170
  const vw = typeof window !== "undefined" ? window.innerWidth : 1200
  const vh = typeof window !== "undefined" ? window.innerHeight : 800
  const left = Math.min(x + 18, vw - W - 12)
  const top  = Math.min(y + 18, vh - H - 12)
  return (
    <div style={{ position:"fixed", left, top, width:W, zIndex:9999, pointerEvents:"none",
                  opacity: active ? 1 : 0, transform:`translateY(${active ? 0 : 6}px)`,
                  transition:"opacity .12s, transform .12s" }}>
      <div style={{ background:C.surface, border:`1px solid ${C.borderAccent}`, borderRadius:12,
                    padding:"11px 13px", boxShadow:"0 10px 30px rgba(0,0,0,0.45)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
          <span style={{ width:22, height:22, borderRadius:7, background:`linear-gradient(135deg,${C.blue},${C.indigo})`,
                         display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>🤖</span>
          <span style={{ fontSize:15.5, fontWeight:700, color:C.text }}>{info.title}</span>
        </div>
        {info.lines.map((l, i) => (
          <div key={i} style={{ fontSize:15.5, color: i === 0 ? C.cyan : C.textSub, lineHeight:1.5,
                                fontFamily: i === 0 ? "var(--font-mono)" : "inherit", marginBottom:3 }}>{l}</div>
        ))}
      </div>
    </div>
  )
}
