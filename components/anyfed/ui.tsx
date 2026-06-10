"use client"
// components/anyfed/ui.tsx — shared design system for the AnyFed portal.
// Same visual language as the SEC portal (dark/light, KPI cards, tooltips).
import { createContext, useContext, useEffect, useState } from "react"
import type { ReactNode } from "react"

export const DARK = {
  bg:"#03070e", sidebar:"#060c18", surface:"#0a1020", card:"#0d1528",
  border:"rgba(14,100,200,0.16)", borderAccent:"rgba(14,165,233,0.38)",
  blue:"#0ea5e9", cyan:"#22d3ee", gold:"#f59e0b", green:"#10b981",
  red:"#ef4444", orange:"#f97316", purple:"#a78bfa", indigo:"#6366f1",
  text:"#ffffff", textSub:"#d7e1ee", muted:"#aebdd0", dim:"#1e3050",
}
export const LIGHT = {
  bg:"#f0f4f8", sidebar:"#e2e8f0", surface:"#ffffff", card:"#f8fafc",
  border:"rgba(14,100,200,0.20)", borderAccent:"rgba(14,165,233,0.45)",
  blue:"#0369a1", cyan:"#0891b2", gold:"#b45309", green:"#047857",
  red:"#b91c1c", orange:"#c2410c", purple:"#6d28d9", indigo:"#4338ca",
  text:"#020617", textSub:"#1a2638", muted:"#3b4a63", dim:"#e2e8f0",
}
export type Theme = typeof DARK
export const ThemeContext = createContext<Theme>(DARK)
export const useTheme = (): Theme => useContext(ThemeContext)

export function useIsMobile(breakpoint = 860): boolean {
  const [mobile, setMobile] = useState(false)
  useEffect(() => {
    const check = () => setMobile(window.innerWidth < breakpoint)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [breakpoint])
  return mobile
}

export const fmtMoney = (v: number, unit: "K" | "raw" = "raw"): string => {
  const n = unit === "K" ? v * 1000 : v
  const abs = Math.abs(n)
  if (abs >= 1e12) return `$${(n / 1e12).toFixed(2)}T`
  if (abs >= 1e9)  return `$${(n / 1e9).toFixed(1)}B`
  if (abs >= 1e6)  return `$${(n / 1e6).toFixed(1)}M`
  if (abs >= 1e3)  return `$${(n / 1e3).toFixed(1)}K`
  return `$${n.toFixed(0)}`
}

export const Tip = ({ active, payload, label }: { active?: boolean; payload?: { name?: string; value?: number | string; color?: string }[]; label?: string }) => {
  const C = useTheme()
  if (!active || !payload?.length) return null
  return (
    <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:8, padding:"10px 14px" }}>
      <div style={{ fontSize:16, color:C.muted, marginBottom:5 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ fontSize:16, color:p.color || C.text, marginBottom:2 }}>
          {p.name}: <b>{typeof p.value === "number" ? fmtMoney(p.value) : p.value}</b>
        </div>
      ))}
    </div>
  )
}

export function KPI({ label, value, sub, accent, icon }: {
  label: string; value: string; sub?: string; accent?: string; icon?: string
}) {
  const C = useTheme()
  const ac = accent || C.blue
  return (
    <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10,
                  padding:"16px 18px", flex:1, minWidth:150, position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute", top:0, left:0, right:0, height:2,
                    background:`linear-gradient(90deg,${ac},transparent)` }} />
      <div style={{ fontSize:15, color:C.muted, letterSpacing:"0.07em",
                    textTransform:"uppercase", marginBottom:6 }}>{icon} {label}</div>
      <div style={{ fontSize:32.5, fontWeight:700, color:ac, fontFamily:"var(--font-mono)" }}>{value}</div>
      {sub && <div style={{ fontSize:16, color:C.textSub, marginTop:4 }}>{sub}</div>}
    </div>
  )
}

export function Card({ title, sub, children, accent, style }: {
  title?: string; sub?: string; children: ReactNode; accent?: string; style?: React.CSSProperties
}) {
  const C = useTheme()
  return (
    <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:12,
                  padding:20, ...style }}>
      {title && (
        <div style={{ marginBottom:14 }}>
          <div style={{ fontSize:20, fontWeight:600, color:accent || C.text }}>{title}</div>
          {sub && <div style={{ fontSize:16, color:C.muted, marginTop:3 }}>{sub}</div>}
        </div>
      )}
      {children}
    </div>
  )
}

export function Badge({ children, color }: { children: ReactNode; color?: string }) {
  const C = useTheme()
  const c = color || C.blue
  return (
    <span style={{ display:"inline-block", padding:"2px 9px", borderRadius:20, fontSize:15,
                   fontWeight:600, color:c, background:`${c}1a`, border:`1px solid ${c}55` }}>
      {children}
    </span>
  )
}

export function SectionTitle({ title, sub }: { title: string; sub?: string }) {
  const C = useTheme()
  return (
    <div style={{ marginBottom:18 }}>
      <h2 style={{ fontSize:27, fontWeight:700, color:C.text, margin:0 }}>{title}</h2>
      {sub && <div style={{ fontSize:17.5, color:C.muted, marginTop:4 }}>{sub}</div>}
    </div>
  )
}

export function Row({ children, wrap = true, gap = 14 }: { children: ReactNode; wrap?: boolean; gap?: number }) {
  return <div style={{ display:"flex", gap, flexWrap: wrap ? "wrap" : "nowrap" }}>{children}</div>
}

export function SourceTag({ source }: { source?: string }) {
  const C = useTheme()
  const folder = source?.startsWith("folder")
  return (
    <span style={{ fontSize:14, color: folder ? C.green : C.gold, letterSpacing:"0.04em" }}>
      {folder ? "● SOURCE: sourcedata/ folder (default)" : "● SOURCE: live USAspending.gov (fallback)"}
    </span>
  )
}

export function Spinner({ label }: { label?: string }) {
  const C = useTheme()
  return (
    <div style={{ padding:40, textAlign:"center", color:C.muted, fontSize:17.5 }}>
      <div style={{ display:"inline-block", width:22, height:22, border:`3px solid ${C.dim}`,
                    borderTopColor:C.blue, borderRadius:"50%", animation:"afspin 0.8s linear infinite",
                    marginBottom:10 }} />
      <div>{label ?? "Loading data…"}</div>
      <style>{`@keyframes afspin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
