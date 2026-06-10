// @ts-nocheck
"use client"
import { useState } from "react";

// ───────────────────────────────────────────────────────────────────────────
// PRIMITIVES
// ───────────────────────────────────────────────────────────────────────────
const fmt$ = n => n>=1e6?`$${(n/1e6).toFixed(2)}M`:n>=1e3?`$${(n/1e3).toFixed(0)}K`:`$${n.toLocaleString()}`;
const fmtFull = n => `$${n.toLocaleString()}`;

function OSOBadge({ label, color="blue", small, C }) {
  const maps = {
    red:    [C.redBg,    C.red],
    green:  [C.greenBg,  C.green],
    gold:   [C.goldBg,   C.gold],
    orange: [C.orangeBg, C.orange],
    blue:   [C.cyanBg,   C.blue],
    purple: [C.purpleBg, C.purple],
    cyan:   [C.cyanBg,   C.cyan],
    gray:   [C.dim+"88", C.muted],
    navy:   [C.cyanBg,   C.navy],
  };
  const [bg, txt] = maps[color]||maps.blue;
  return (
    <span style={{ background:bg, color:txt, borderRadius:4,
                   padding:small?"2px 7px":"2px 9px",
                   fontSize:small?10:11, fontWeight:700,
                   letterSpacing:"0.04em", whiteSpace:"nowrap" }}>{label}</span>
  );
}

function OSOKPI({ label, value, sub, color, C }) {
  const ac = color||C.blue;
  return (
    <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10,
                  padding:"16px 18px", flex:1, minWidth:145, borderTop:`3px solid ${ac}` }}>
      <div style={{ fontSize:16, color:C.muted, fontWeight:600,
                    letterSpacing:"0.07em", textTransform:"uppercase", marginBottom:7 }}>{label}</div>
      <div style={{ fontSize:26, fontWeight:800, color:ac,
                    fontFamily:"'IBM Plex Mono',monospace", lineHeight:1 }}>{value}</div>
      {sub && <div style={{ fontSize:15, color:C.muted, marginTop:5 }}>{sub}</div>}
    </div>
  );
}

function OSOCard({ children, style={}, C }) {
  return (
    <div style={{ background:C.card, border:`1px solid ${C.border}`,
                  borderRadius:10, padding:"18px 20px", ...style }}>{children}</div>
  );
}

function SH({ title, sub, action, C }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start",
                  marginBottom:14, paddingBottom:12, borderBottom:`1px solid ${C.border}` }}>
      <div>
        <div style={{ fontSize:16, fontWeight:700, color:C.text }}>{title}</div>
        {sub && <div style={{ fontSize:15, color:C.muted, marginTop:2 }}>{sub}</div>}
      </div>
      {action}
    </div>
  );
}

function OSOTh({ children, right, C }) {
  return <th style={{ padding:"9px 12px", textAlign:right?"right":"left",
                       color:C.muted, fontSize:16, fontWeight:700, letterSpacing:"0.06em",
                       background:C.dim+"44", borderBottom:`1px solid ${C.border}`,
                       whiteSpace:"nowrap" }}>{children}</th>;
}
function OSOTd({ children, right, mono, bold, color, C }) {
  return <td style={{ padding:"9px 12px", textAlign:right?"right":"left",
                       color:color||C.text, fontSize:16,
                       fontFamily:mono?"'IBM Plex Mono',monospace":"inherit",
                       fontWeight:bold?700:400, borderBottom:`1px solid ${C.border}22` }}>{children}</td>;
}

function BurnBar({ pct, C }) {
  const bar = Math.min(pct,100);
  const clr = pct>90?C.red:pct>75?C.gold:C.green;
  return (
    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
      <div style={{ flex:1, background:C.dim, borderRadius:4, height:6, overflow:"hidden" }}>
        <div style={{ width:`${bar}%`, height:"100%", background:clr, borderRadius:4 }} />
      </div>
      <span style={{ fontSize:15, color:clr, fontWeight:700, fontFamily:"monospace",
                     minWidth:38, textAlign:"right" }}>{pct.toFixed(1)}%</span>
    </div>
  );
}

function OSOToggleTheme({ dark, setDark, C }) {
  return (
    <button onClick={()=>setDark(d=>!d)}
      style={{ display:"flex", alignItems:"center", gap:6, background:C.dim,
               border:`1px solid ${C.border}`, borderRadius:20, padding:"5px 12px",
               cursor:"pointer", color:C.textSub, fontSize:15, fontWeight:600 }}>
      {dark ? "☀️ Light" : "🌙 Dark"}
    </button>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// MODAL
// ───────────────────────────────────────────────────────────────────────────
function OSOModal({ initial, onSave, onClose, C }) {
  const [f, setF] = useState(initial || {
    type:"OBLIGATION", ref:"", desc:"", vendor:"N/A", amount:0,
    oc:"25.0", office:"OFS", status:"PENDING REVIEW",
    created:new Date().toISOString().slice(0,10), due:"", adaRisk:"LOW", cor:"", note:""
  });
  const set = (k,v)=>setF(p=>({...p,[k]:v}));
  const fields = [
    ["Action Type","type",["OBLIGATION","GPC PURCHASE","COR ACTION","BUDGET FORMULATION","FACILITY ACTION","FLEET ACTION","PAYROLL ACTION","TRAVEL ACTION","INTERNAL CONTROL","BRIEF/REPORT"]],
    ["Reference #","ref","text"],["Description","desc","text"],
    ["Vendor / Contractor","vendor","text"],["Amount ($)","amount","number"],
    ["Object Class","oc",["11.0","12.0","23.0","24.0","25.0","26.0","31.0","32.0","ALL"]],
    ["OSO Office","office",["OFS","OSBO-PSE","OSBO-PS","OSBO-CL","OSBO-FO","OSBO-FSS","OAMR","BMCB","OHR","ALL"]],
    ["Status","status",["PENDING REVIEW","APPROVED","RECONCILED","PENDING RECONCILE","IN PROGRESS","NOT STARTED","OVERDUE","CLOSED"]],
    ["ADA Risk","adaRisk",["LOW","MEDIUM","HIGH"]],
    ["Due Date","due","date"],["COR Officer","cor","text"],["Notes","note","textarea"],
  ];
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)",
                  display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000 }}>
      <div style={{ background:C.card, borderRadius:12, width:600, maxHeight:"85vh",
                    overflowY:"auto", border:`1px solid ${C.border}` }}>
        <div style={{ background:C.navy, color:"#fff", padding:"14px 20px",
                      borderRadius:"12px 12px 0 0", display:"flex", justifyContent:"space-between" }}>
          <span style={{ fontWeight:700 }}>{initial?"Edit Action":"New Action"}</span>
          <button onClick={onClose} style={{ background:"none",border:"none",color:"#fff",fontSize:18,cursor:"pointer" }}>×</button>
        </div>
        <div style={{ padding:"20px 22px", display:"flex", flexDirection:"column", gap:12 }}>
          {fields.map(([label,key,type])=>(
            <div key={key}>
              <label style={{ fontSize:15,fontWeight:600,color:C.muted,display:"block",marginBottom:3 }}>{label}</label>
              {Array.isArray(type)?(
                <select value={f[key]} onChange={e=>set(key,e.target.value)}
                  style={{ width:"100%",padding:"7px 9px",borderRadius:6,
                           border:`1px solid ${C.inputBorder}`,fontSize:16,
                           color:C.text, background:C.input }}>
                  {type.map(o=><option key={o} value={o}>{o}</option>)}
                </select>
              ):type==="textarea"?(
                <textarea value={f[key]} onChange={e=>set(key,e.target.value)} rows={3}
                  style={{ width:"100%",padding:"7px 9px",borderRadius:6,
                           border:`1px solid ${C.inputBorder}`,fontSize:16,
                           color:C.text,background:C.input,resize:"vertical",fontFamily:"inherit" }} />
              ):(
                <input type={type} value={f[key]} onChange={e=>set(key,type==="number"?+e.target.value:e.target.value)}
                  style={{ width:"100%",padding:"7px 9px",borderRadius:6,
                           border:`1px solid ${C.inputBorder}`,fontSize:16,
                           color:C.text,background:C.input }} />
              )}
            </div>
          ))}
          <div style={{ display:"flex",gap:10,marginTop:6 }}>
            <button onClick={()=>onSave(f)}
              style={{ flex:1,background:C.navy,color:"#fff",border:"none",
                       borderRadius:7,padding:"10px",fontSize:15,fontWeight:700,cursor:"pointer" }}>
              {initial?"Save Changes":"Add Action"}
            </button>
            <button onClick={onClose}
              style={{ flex:1,background:C.dim,color:C.muted,border:"none",
                       borderRadius:7,padding:"10px",fontSize:15,cursor:"pointer" }}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// PAGE: DASHBOARD
// ───────────────────────────────────────────────────────────────────────────
function PageDashboard({ actions, allotments, oig, gpc, cor, C, news, navigate }) {
  const totalA  = allotments.reduce((s,a)=>s+a.fy26,0);
  const totalY  = allotments.reduce((s,a)=>s+a.ytd,0);
  const burn    = totalY/totalA*100;
  const high    = actions.filter(a=>a.adaRisk==="HIGH");
  const pending = actions.filter(a=>a.status==="PENDING REVIEW"||a.status==="PENDING RECONCILE");
  const overdue = actions.filter(a=>a.status==="OVERDUE");
  const oigOpen = oig.filter(o=>o.status!=="CLOSED");
  const gpcPend = gpc.filter(g=>g.status==="PENDING");
  const COLORS  = [C.red,C.blue,C.purple,C.cyan,C.orange,C.green,C.gold,C.purple];

  return (
    <div style={{ display:"flex",flexDirection:"column",gap:20 }}>
      {high.length>0&&(
        <div style={{ background:C.redBg,border:`1px solid ${C.red}44`,borderRadius:10,
                       padding:"12px 16px",display:"flex",gap:12,alignItems:"flex-start" }}>
          <span style={{ fontSize:18 }}>🚨</span>
          <div>
            <div style={{ fontSize:15,fontWeight:700,color:C.red }}>ADA RISK — {high.length} item(s) require immediate action</div>
            <div style={{ fontSize:15,color:C.textSub,marginTop:2 }}>
              {high.map(a=>`${a.ref}: ${a.desc}`).join(" · ")} · 31 U.S.C.§1341 applies
            </div>
          </div>
        </div>
      )}
      {overdue.length>0&&(
        <div style={{ background:C.goldBg,border:`1px solid ${C.gold}44`,borderRadius:10,
                       padding:"11px 16px",display:"flex",gap:10,alignItems:"center" }}>
          <span>⚠️</span>
          <span style={{ fontSize:16,color:C.gold,fontWeight:600 }}>
            {overdue.length} overdue action(s) — T&M COR surveillance log requires immediate submission (OIG-582 CLOSED; monitoring SOPs remain in effect)
          </span>
        </div>
      )}

      {/* Row 1 — Budget execution */}
      <div style={{ display:"flex",gap:12,flexWrap:"wrap" }}>
        <OSOKPI label="FY26 OSO Allotment"  value={fmt$(totalA)}    sub="Agency Dir & Admin Support"             color={C.blue}   C={C} />
        <OSOKPI label="YTD Obligations"    value={fmt$(totalY)}    sub={`${burn.toFixed(1)}% burn — Month 9 of 12`} color={burn>90?C.red:burn>85?C.gold:C.green} C={C} />
        <OSOKPI label="Pending Actions"     value={pending.length}  sub="Need approval / review"               color={pending.length>3?C.orange:C.blue} C={C} />
        <OSOKPI label="ADA Risk Items"      value={high.length}     sub="Flagged for immediate action"         color={high.length>0?C.red:C.green} C={C} />
        <OSOKPI label="Open OIG Findings"   value={oigOpen.length}  sub="OIG-574 MED · OIG-584 MED (FISMA)"   color={C.gold}   C={C} />
        <OSOKPI label="GPC Pending Recon"   value={gpcPend.length}  sub="Reconcile within 5 biz days"         color={C.purple} C={C} />
      </div>
      {/* Row 2 — Payroll & Travel */}
      {(() => {
        const onboard = PAYROLL_FTE.filter(f=>f.status==="ONBOARD");
        const vacant  = PAYROLL_FTE.filter(f=>f.status==="VACANT");
        const annualPersonnel = onboard.reduce((s,f)=>s+f.salary+f.benefits,0);
        const ytdPayroll = PAYROLL_MONTHLY.reduce((s,m)=>s+m.total,0);
        const payBurn = ytdPayroll/4200000*100;
        const travelBudget = 85000;
        const travelYTD = TRAVEL_REQUESTS.filter(t=>t.status!=="DRAFT").reduce((s,t)=>s+t.est,0);
        const travelBurn = travelYTD/travelBudget*100;
        const vouchersDue = GTC_CARDS.filter(c=>c.status==="VOUCHER DUE").length;
        return (
          <>
            <div style={{ display:"flex",gap:12,flexWrap:"wrap" }}>
              <OSOKPI label="FTE Onboard"       value={`${onboard.length}/${PAYROLL_FTE.length}`} sub={`${vacant.length} vacancy · SK pay scale`}   color={C.cyan}   C={C} />
              <OSOKPI label="Annual OC 11+12"   value={fmt$(annualPersonnel)}  sub="Personnel cost (onboard)"        color={C.green}  C={C} />
              <OSOKPI label="Payroll YTD"       value={fmt$(ytdPayroll)}       sub={`${payBurn.toFixed(1)}% of $4.2M allotment`} color={payBurn>90?C.red:C.green} C={C} />
              <OSOKPI label="OC 21 Travel YTD"  value={fmt$(travelYTD)}        sub={`${travelBurn.toFixed(1)}% of $85K budget`}  color={travelBurn>90?C.red:C.gold} C={C} />
              <OSOKPI label="Travel Pending"    value={TRAVEL_REQUESTS.filter(t=>t.status==="PENDING").length} sub="Awaiting BMCB approval"       color={C.purple} C={C} />
              <OSOKPI label="GTC Vouchers Due"  value={vouchersDue}            sub="File within 5 biz days of return" color={vouchersDue>0?C.red:C.green} C={C} />
            </div>
          </>
        );
      })()}

      {/* ══════════════════════════════════════════════════════
           EXECUTIVE STATUS PANELS — Fund · FTE · Compliance
          ══════════════════════════════════════════════════════ */}
      {(() => {
        const onboard    = PAYROLL_FTE.filter(f=>f.status==="ONBOARD");
        const vacant     = PAYROLL_FTE.filter(f=>f.status==="VACANT");
        const ytdPayroll = PAYROLL_MONTHLY.reduce((s,m)=>s+m.total,0);
        const payBurn    = ytdPayroll/4200000*100;
        const travelYTD  = TRAVEL_REQUESTS.filter(t=>t.status!=="DRAFT").reduce((s,t)=>s+t.est,0);
        const travelBurn = travelYTD/85000*100;
        const corOverdue = cor.filter(c=>c.status==="OVERDUE").length;
        const burnStatus = burn>90?"RED":burn>85?"YELLOW":"GREEN";

        // SVG donut gauge
        const Donut = ({ pct, value, sub, color, size=96, thick=10 }) => {
          const r = (size-thick)/2;
          const circ = 2*Math.PI*r;
          const filled = Math.min(pct,100)/100*circ;
          return (
            <div style={{ position:"relative",width:size,height:size,flexShrink:0 }}>
              <svg width={size} height={size} style={{ transform:"rotate(-90deg)" }}>
                <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={C.dim+"55"} strokeWidth={thick} />
                <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={thick}
                  strokeDasharray={`${filled} ${circ-filled}`} strokeLinecap="round" />
              </svg>
              <div style={{ position:"absolute",inset:0,display:"flex",flexDirection:"column",
                             alignItems:"center",justifyContent:"center" }}>
                <span style={{ fontSize:14,fontWeight:800,color,fontFamily:"monospace",lineHeight:1 }}>{value}</span>
                <span style={{ fontSize:9,color:C.muted,marginTop:2,textAlign:"center",maxWidth:58,lineHeight:1.3 }}>{sub}</span>
              </div>
            </div>
          );
        };

        // Compliance items
        const compItems = [
          { label:"ADA Exposure",        status:high.length>0?"RED":"GREEN",      note:high.length>0?`${high.length} item(s) flagged · 31 U.S.C.§1341`:"No violations projected" },
          { label:"OIG-582 (T&M)",        status:"GREEN",                           note:"CLOSED — all 7 recs implemented before Apr 2025" },
          { label:"COR Surveillance",    status:corOverdue>0?"YELLOW":"GREEN",     note:`${corOverdue} overdue log(s) · ${cor.length} active contracts` },
          { label:"GPC Reconciliation",  status:gpcPend.length>0?"YELLOW":"GREEN", note:gpcPend.length>0?`${gpcPend.length} card(s) pending · 5-day window`:"All cards current" },
          { label:"Burn Rate vs Bench",  status:burnStatus,                        note:`${burn.toFixed(1)}% vs 75.0% benchmark — Month 9` },
          { label:"Lease Renewals",      status:"YELLOW",                          note:"3 leases expiring FY2027 — procurement active" },
          { label:"OIG-574/584 (FISMA)",  status:"YELLOW",                          note:"7 recs open · OIT primary · spring 2026 target" },
        ];
        const redCt    = compItems.filter(c=>c.status==="RED").length;
        const yellowCt = compItems.filter(c=>c.status==="YELLOW").length;
        const greenCt  = compItems.filter(c=>c.status==="GREEN").length;

        const statusCol = { RED:C.red, YELLOW:C.gold, GREEN:C.green };

        return (
          <>
            {/* ─── Row 1: Fund | FTE | Compliance ─── */}
            <div style={{ display:"grid",gridTemplateColumns:"1.3fr 1fr 1fr",gap:16 }}>

              {/* Fund Execution */}
              <OSOCard C={C} style={{ borderTop:`3px solid ${C.blue}` }}>
                <SH title="Fund Execution" sub="FY2026 · Month 9 of 12 · Benchmark 75.0%" C={C} />
                <div style={{ display:"flex",gap:18,alignItems:"center",marginBottom:16 }}>
                  <Donut pct={burn} value={`${burn.toFixed(1)}%`} sub="OSO Burn Rate"
                    color={burn>90?C.red:burn>85?C.orange:burn>75?C.gold:C.green} />
                  <div style={{ flex:1 }}>
                    {[
                      { label:"OC 11+12  Payroll",  pct:payBurn,    val:fmt$(ytdPayroll), color:C.cyan   },
                      { label:"OC 21  Travel",       pct:travelBurn, val:fmt$(travelYTD),  color:C.purple },
                      { label:"OC 23  Rent / Leases",pct:74,         val:"$6.07M",          color:C.gold   },
                      { label:"OC 25  Contracts",    pct:77,         val:"$14.2M",          color:C.blue   },
                    ].map((r,i)=>(
                      <div key={i} style={{ marginBottom:8 }}>
                        <div style={{ display:"flex",justifyContent:"space-between",marginBottom:2 }}>
                          <span style={{ fontSize:11,color:C.muted }}>{r.label}</span>
                          <span style={{ fontSize:11,color:r.color,fontFamily:"monospace",fontWeight:700 }}>{r.val}</span>
                        </div>
                        <div style={{ background:C.dim+"44",borderRadius:3,height:6,position:"relative" }}>
                          <div style={{ width:`${Math.min(r.pct,100)}%`,height:"100%",
                                         background:r.color,borderRadius:3,opacity:0.9 }} />
                          <div style={{ position:"absolute",left:"75%",top:-2,width:1.5,height:10,
                                         background:C.text+"60",borderRadius:1 }} />
                        </div>
                      </div>
                    ))}
                    <div style={{ display:"flex",alignItems:"center",gap:5,marginTop:4 }}>
                      <div style={{ width:1.5,height:10,background:C.text+"60" }} />
                      <span style={{ fontSize:10,color:C.muted }}>75% Month-9 benchmark</span>
                    </div>
                  </div>
                </div>
                <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,
                               paddingTop:12,borderTop:`1px solid ${C.border}22` }}>
                  {[
                    { label:"Allotment", val:fmt$(totalA), color:C.blue  },
                    { label:"Obligated", val:fmt$(totalY), color:C.cyan  },
                    { label:"Remaining", val:fmt$(totalA-totalY), color:C.green },
                  ].map((m,i)=>(
                    <div key={i} style={{ textAlign:"center",padding:"8px 4px",
                                           background:C.dim+"33",borderRadius:6 }}>
                      <div style={{ fontSize:13,fontWeight:800,color:m.color,fontFamily:"monospace" }}>{m.val}</div>
                      <div style={{ fontSize:10,color:C.muted,marginTop:2 }}>{m.label}</div>
                    </div>
                  ))}
                </div>
              </OSOCard>

              {/* FTE Status */}
              <OSOCard C={C} style={{ borderTop:`3px solid ${C.cyan}` }}>
                <SH title="FTE Status" sub="SK pay scale · FY2026 authorized" C={C} />
                <div style={{ display:"flex",alignItems:"center",gap:12,marginBottom:12 }}>
                  <Donut pct={onboard.length/PAYROLL_FTE.length*100}
                    value={`${onboard.length}/${PAYROLL_FTE.length}`}
                    sub="Onboard" color={C.cyan} size={80} thick={9} />
                  <div>
                    <div style={{ fontSize:18,fontWeight:800,color:C.text }}>{onboard.length} Onboard</div>
                    {vacant.length>0&&<div style={{ fontSize:12,color:C.red,fontWeight:600,marginTop:2 }}>
                      ⚠ {vacant.length} Vacant position{vacant.length!==1?"s":""}
                    </div>}
                    <div style={{ fontSize:11,color:C.muted,marginTop:4 }}>Annual OC 11+12</div>
                    <div style={{ fontSize:13,fontWeight:800,color:C.cyan,fontFamily:"monospace" }}>
                      ${onboard.reduce((s,f)=>s+f.salary+f.benefits,0).toLocaleString()}
                    </div>
                  </div>
                </div>
                {[
                  { grade:"SK-14", color:C.blue   },
                  { grade:"SK-13", color:C.cyan   },
                  { grade:"SK-12", color:C.green  },
                  { grade:"SK-11", color:C.gold   },
                ].map((g,i)=>{
                  const cnt = onboard.filter(f=>f.grade===g.grade).length;
                  if (!cnt) return null;
                  return (
                    <div key={i} style={{ display:"flex",alignItems:"center",gap:8,marginBottom:6 }}>
                      <span style={{ fontSize:11,fontFamily:"monospace",color:g.color,
                                      fontWeight:700,minWidth:38 }}>{g.grade}</span>
                      <div style={{ flex:1,background:C.dim+"44",borderRadius:3,height:7 }}>
                        <div style={{ width:`${cnt/onboard.length*100}%`,height:"100%",
                                       background:g.color,borderRadius:3 }} />
                      </div>
                      <span style={{ fontSize:11,color:C.muted,minWidth:14,textAlign:"right" }}>{cnt}</span>
                    </div>
                  );
                })}
                {/* Roster avatar strip */}
                <div style={{ marginTop:10,paddingTop:10,borderTop:`1px solid ${C.border}22`,
                               display:"flex",gap:5,flexWrap:"wrap" }}>
                  {PAYROLL_FTE.map((f,i)=>(
                    <div key={i} title={`${f.name} — ${f.title} (${f.grade})`}
                      style={{ width:28,height:28,borderRadius:"50%",cursor:"default",
                                background:f.status==="ONBOARD"?C.cyan+"25":C.red+"25",
                                border:`2px solid ${f.status==="ONBOARD"?C.cyan:C.red}`,
                                display:"flex",alignItems:"center",justifyContent:"center",
                                fontSize:11,fontWeight:700,
                                color:f.status==="ONBOARD"?C.cyan:C.red }}>
                      {f.status==="ONBOARD"?f.name.slice(0,1):"V"}
                    </div>
                  ))}
                </div>
              </OSOCard>

              {/* Compliance Scorecard */}
              <OSOCard C={C} style={{ borderTop:`3px solid ${C.gold}` }}>
                <SH title="Compliance Health" sub="Real-time risk scorecard — all domains" C={C} />
                {compItems.map((ci,i)=>{
                  const col = statusCol[ci.status];
                  return (
                    <div key={i} style={{ display:"flex",alignItems:"flex-start",gap:10,
                                           padding:"7px 0",borderBottom:`1px solid ${C.border}22` }}>
                      <div style={{ width:9,height:9,borderRadius:"50%",background:col,flexShrink:0,marginTop:3 }} />
                      <div style={{ flex:1,minWidth:0 }}>
                        <div style={{ fontSize:12,fontWeight:600,color:C.text }}>{ci.label}</div>
                        <div style={{ fontSize:10,color:C.muted,marginTop:1 }}>{ci.note}</div>
                      </div>
                      <span style={{ fontSize:9,fontWeight:700,color:col,background:col+"22",
                                      borderRadius:3,padding:"2px 6px",border:`1px solid ${col}44`,
                                      whiteSpace:"nowrap",flexShrink:0 }}>{ci.status}</span>
                    </div>
                  );
                })}
                <div style={{ display:"flex",gap:12,marginTop:12,paddingTop:10,
                               borderTop:`1px solid ${C.border}22`,justifyContent:"center" }}>
                  {[{lbl:"GREEN",n:greenCt,col:C.green},{lbl:"YELLOW",n:yellowCt,col:C.gold},{lbl:"RED",n:redCt,col:C.red}].map((s,i)=>(
                    <div key={i} style={{ textAlign:"center",padding:"6px 14px",
                                           background:s.col+"15",borderRadius:6,border:`1px solid ${s.col}44` }}>
                      <div style={{ fontSize:18,fontWeight:800,color:s.col }}>{s.n}</div>
                      <div style={{ fontSize:9,fontWeight:700,color:s.col,letterSpacing:"0.08em" }}>{s.lbl}</div>
                    </div>
                  ))}
                </div>
              </OSOCard>
            </div>

            {/* ─── Row 2: Enhanced Allotment Execution ─── */}
            <OSOCard C={C}>
              <SH title="OSO Allotment Execution — All Offices"
                sub="FY2026 · June 1 · Month 9 · Sorted by burn rate · Vertical line = 75% benchmark"
                C={C} action={navigate&&
                  <button onClick={()=>navigate("budget")}
                    style={{ background:"none",border:`1px solid ${C.blue}`,borderRadius:6,
                              padding:"3px 10px",fontSize:12,color:C.blue,cursor:"pointer",fontWeight:600 }}>
                    Full Detail →
                  </button>} />
              {[...allotments].sort((a,b)=>b.ytd/b.fy26-a.ytd/a.fy26).map((a,i)=>{
                const pct = a.ytd/a.fy26*100;
                const rCol = pct>90?C.red:pct>85?C.orange:pct>75?C.gold:C.green;
                const risk = pct>90?"ADA RISK":pct>85?"HIGH":pct>75?"MONITOR":"OK";
                return (
                  <div key={i} style={{ display:"grid",
                                         gridTemplateColumns:"170px 1fr 70px 80px 76px",
                                         gap:14,alignItems:"center",marginBottom:11,
                                         paddingBottom:11,
                                         borderBottom:i<allotments.length-1?`1px solid ${C.border}22`:"none" }}>
                    <div>
                      <div style={{ fontSize:12,fontWeight:600,color:C.text }}>{a.label}</div>
                      <div style={{ fontSize:10,color:C.muted,fontFamily:"monospace",marginTop:1 }}>{a.office}</div>
                    </div>
                    <div style={{ position:"relative" }}>
                      <div style={{ background:C.dim+"44",borderRadius:4,height:14,overflow:"hidden" }}>
                        <div style={{ width:`${Math.min(pct,100)}%`,height:"100%",
                                       background:`linear-gradient(90deg,${rCol}80,${rCol})`,
                                       borderRadius:4 }} />
                      </div>
                      <div style={{ position:"absolute",left:"75%",top:-3,width:2,height:20,
                                     background:C.text+"50",borderRadius:1,pointerEvents:"none" }} />
                    </div>
                    <div style={{ textAlign:"right",fontSize:14,fontWeight:800,
                                   color:rCol,fontFamily:"monospace" }}>{pct.toFixed(1)}%</div>
                    <div style={{ textAlign:"right",fontSize:11,color:C.muted,fontFamily:"monospace" }}>{fmt$(a.ytd)}</div>
                    <div style={{ display:"flex",justifyContent:"flex-end" }}>
                      <span style={{ fontSize:10,fontWeight:700,color:rCol,
                                      background:rCol+"22",borderRadius:4,padding:"2px 8px",
                                      border:`1px solid ${rCol}44` }}>{risk}</span>
                    </div>
                  </div>
                );
              })}
              {/* Totals */}
              <div style={{ display:"grid",gridTemplateColumns:"170px 1fr 70px 80px 76px",
                             gap:14,alignItems:"center",paddingTop:10,borderTop:`2px solid ${C.border}` }}>
                <div style={{ fontSize:12,fontWeight:800,color:C.text }}>TOTAL OSO</div>
                <div style={{ position:"relative" }}>
                  <div style={{ background:C.dim+"44",borderRadius:4,height:14 }}>
                    <div style={{ width:`${Math.min(burn,100)}%`,height:"100%",
                                   background:`linear-gradient(90deg,${C.blue}70,${C.blue})`,borderRadius:4 }} />
                  </div>
                  <div style={{ position:"absolute",left:"75%",top:-3,width:2,height:20,background:C.text+"50" }} />
                </div>
                <div style={{ textAlign:"right",fontSize:14,fontWeight:800,color:C.blue,fontFamily:"monospace" }}>{burn.toFixed(1)}%</div>
                <div style={{ textAlign:"right",fontSize:11,fontWeight:700,color:C.blue,fontFamily:"monospace" }}>{fmt$(totalY)}</div>
                <div style={{ display:"flex",justifyContent:"flex-end" }}>
                  <span style={{ fontSize:10,fontWeight:700,color:C.green,background:C.green+"22",
                                  borderRadius:4,padding:"2px 8px" }}>ON TRACK</span>
                </div>
              </div>
              <div style={{ display:"flex",gap:16,marginTop:10,fontSize:10,color:C.muted,flexWrap:"wrap" }}>
                <span style={{ display:"flex",alignItems:"center",gap:5 }}>
                  <div style={{ width:2,height:10,background:C.text+"60",borderRadius:1 }} /> 75% benchmark (Month 9)
                </span>
                <span>Total allotment: <strong style={{color:C.text}}>{fmt$(totalA)}</strong></span>
                <span>Remaining authority: <strong style={{color:C.green}}>{fmt$(totalA-totalY)}</strong></span>
                <span>OSBO-PSE at 83% — highest burn · monitor T4 closely</span>
              </div>
            </OSOCard>

            {/* ─── Row 3: Action Pipeline ─── */}
            <OSOCard C={C}>
              <SH title="Action Pipeline" sub="All operations tabs · Status distribution & top priority items" C={C}
                action={navigate&&
                  <button onClick={()=>navigate("actions")}
                    style={{ background:"none",border:`1px solid ${C.blue}`,borderRadius:6,
                              padding:"3px 10px",fontSize:12,color:C.blue,cursor:"pointer",fontWeight:600 }}>
                    Full Tracker →
                  </button>} />
              {/* Stacked bar */}
              {(() => {
                const segments = [
                  { s:"OVERDUE",           col:C.red    },
                  { s:"PENDING REVIEW",    col:C.orange },
                  { s:"PENDING RECONCILE", col:C.gold   },
                  { s:"IN PROGRESS",       col:C.blue   },
                  { s:"NOT STARTED",       col:C.muted  },
                  { s:"PLANNING",          col:C.purple },
                  { s:"APPROVED",          col:C.green  },
                  { s:"RECONCILED",        col:C.cyan   },
                ].map(sg=>({ ...sg, cnt:actions.filter(a=>a.status===sg.s).length }))
                 .filter(sg=>sg.cnt>0);
                const total = actions.length;
                return (
                  <div>
                    <div style={{ display:"flex",borderRadius:8,overflow:"hidden",height:28,marginBottom:10 }}>
                      {segments.map((sg,i)=>(
                        <div key={i} title={`${sg.s}: ${sg.cnt}`}
                          style={{ width:`${sg.cnt/total*100}%`,background:sg.col,
                                    display:"flex",alignItems:"center",justifyContent:"center",
                                    fontSize:10,fontWeight:700,color:"#fff",transition:"width 0.4s" }}>
                          {sg.cnt/total*100>=7?sg.cnt:""}
                        </div>
                      ))}
                    </div>
                    <div style={{ display:"flex",gap:14,flexWrap:"wrap",marginBottom:14 }}>
                      {segments.map((sg,i)=>(
                        <div key={i} style={{ display:"flex",alignItems:"center",gap:5 }}>
                          <div style={{ width:8,height:8,borderRadius:"50%",background:sg.col,flexShrink:0 }} />
                          <span style={{ fontSize:11,color:C.muted }}>{sg.s}</span>
                          <span style={{ fontSize:11,fontWeight:700,color:sg.col,fontFamily:"monospace" }}>{sg.cnt}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
              {/* Priority items grid */}
              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8 }}>
                {[...actions]
                  .filter(a=>a.status==="OVERDUE"||a.adaRisk==="HIGH"||(a.status==="PENDING REVIEW"&&a.adaRisk==="MEDIUM"))
                  .slice(0,4)
                  .map((a,i)=>{
                    const col = a.adaRisk==="HIGH"?C.red:a.status==="OVERDUE"?C.orange:C.gold;
                    return (
                      <div key={i} style={{ background:col+"12",border:`1px solid ${col}33`,
                                             borderLeft:`3px solid ${col}`,borderRadius:6,padding:"9px 11px" }}>
                        <div style={{ fontSize:12,fontWeight:600,color:C.text,marginBottom:3,
                                       overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{a.desc}</div>
                        <div style={{ display:"flex",gap:6,alignItems:"center",flexWrap:"wrap" }}>
                          <span style={{ fontSize:10,color:C.muted,fontFamily:"monospace" }}>{a.ref}</span>
                          <span style={{ fontSize:10,fontWeight:700,color:col,
                                          background:col+"22",borderRadius:3,padding:"1px 6px" }}>{a.status}</span>
                          <span style={{ fontSize:10,color:C.muted,marginLeft:"auto" }}>Due {a.due}</span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </OSOCard>
          </>
        );
      })()}

      {/* Live Intel + AI Quick Access row */}
      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:16 }}>
        {/* Live Intel highlights */}
        <OSOCard C={C} style={{ borderLeft:`3px solid ${C.gold}` }}>
          <SH title="📡 Live Intelligence Highlights" sub="Top priority items impacting OSO planning" C={C}
            action={navigate&&<button onClick={()=>navigate("news")} style={{ background:"none",border:`1px solid ${C.gold}`,borderRadius:6,padding:"3px 10px",fontSize:15,color:C.gold,cursor:"pointer",fontWeight:600 }}>View All →</button>} />
          {(news||[]).filter(n=>n.urg==="HIGH"||n.urg==="MEDIUM").slice(0,3).map((n,i)=>(
            <div key={i} style={{ marginBottom:12,paddingBottom:12,borderBottom:i<2?`1px solid ${C.border}`:"none" }}>
              <div style={{ display:"flex",gap:6,alignItems:"center",marginBottom:4 }}>
                <span style={{ fontSize:16,fontWeight:700,color:n.urg==="HIGH"?C.red:C.gold,
                                background:`${n.urg==="HIGH"?C.red:C.gold}18`,padding:"1px 7px",borderRadius:3 }}>{n.urg}</span>
                <span style={{ fontSize:16,color:C.muted }}>{n.cat}</span>
                <span style={{ fontSize:16,color:C.muted,marginLeft:"auto" }}>{n.time}</span>
              </div>
              <div style={{ fontSize:16,fontWeight:600,color:C.text,lineHeight:1.4,marginBottom:3 }}>{n.headline}</div>
              <div style={{ fontSize:15,color:C.gold,lineHeight:1.4 }}>→ {n.impact}</div>
            </div>
          ))}
        </OSOCard>

        {/* AI Quick Access */}
        <OSOCard C={C} style={{ borderLeft:`3px solid ${C.purple}` }}>
          <SH title="🤖 AI FM Analyst" sub="OSO-aware · Live intel context · Ask anything" C={C}
            action={navigate&&<button onClick={()=>navigate("ai")} style={{ background:`linear-gradient(135deg,${C.blue},${C.purple})`,border:"none",borderRadius:6,padding:"3px 12px",fontSize:15,color:"#fff",cursor:"pointer",fontWeight:700 }}>Open →</button>} />
          <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
            {[
              "What are OSO's top ADA risks right now?",
              "If we fill both vacant positions, will we exceed our OC 11+12 allotment?",
              "OIG-582 is closed — what T&M controls are now embedded, and what are the current open OIG findings?",
              "Which GTC cards have outstanding vouchers and what's the deadline?",
            ].map((q,i)=>(
              <button key={i} onClick={()=>{ if(navigate) navigate("ai"); }}
                style={{ background:C.dim+"44",border:`1px solid ${C.border}`,borderRadius:6,
                          padding:"7px 10px",fontSize:15,color:C.textSub,cursor:"pointer",
                          textAlign:"left",lineHeight:1.4 }}>
                💬 {q}
              </button>
            ))}
          </div>
          <div style={{ marginTop:10,fontSize:16,color:C.muted,lineHeight:1.5 }}>
            Pre-loaded with OSO BMCB context, SK pay scale FTE roster, OC 11/12/21 budget data, GTC/travel status, OIG findings, and live intelligence feed.
          </div>
        </OSOCard>
      </div>

      <div style={{ display:"grid",gridTemplateColumns:"1.1fr 1fr",gap:16 }}>
        <OSOCard C={C}>
          <SH title="Allotment Burn Rate by OSO Office" sub="FY2026 · June 1 · Month 9 of 12 · Benchmark: 75.0%" C={C} />
          {allotments.map((a,i)=>{
            const pct=a.ytd/a.fy26*100;
            return (
              <div key={i} style={{ marginBottom:13 }}>
                <div style={{ display:"flex",justifyContent:"space-between",marginBottom:4 }}>
                  <span style={{ fontSize:16,color:C.text,fontWeight:500 }}>{a.label}</span>
                  <span style={{ fontSize:15,color:C.muted,fontFamily:"monospace" }}>
                    {fmt$(a.ytd)} / {fmt$(a.fy26)}
                  </span>
                </div>
                <BurnBar pct={pct} C={C} />
              </div>
            );
          })}
        </OSOCard>
        <OSOCard C={C}>
          <SH title="Priority Actions" sub="Sorted by ADA risk" C={C} />
          {[...actions].sort((a,b)=>({HIGH:0,MEDIUM:1,LOW:2}[a.adaRisk]-{HIGH:0,MEDIUM:1,LOW:2}[b.adaRisk])).slice(0,7).map((a,i)=>(
            <div key={i} style={{ display:"flex",gap:10,alignItems:"flex-start",
                                   marginBottom:10,paddingBottom:10,
                                   borderBottom:i<6?`1px solid ${C.border}`:  "none" }}>
              <div style={{ width:3,height:40,borderRadius:2,flexShrink:0,
                             background:{HIGH:C.red,MEDIUM:C.gold,LOW:C.green}[a.adaRisk],marginTop:2 }} />
              <div style={{ flex:1,minWidth:0 }}>
                <div style={{ fontSize:16,fontWeight:600,color:C.text,
                               overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{a.desc}</div>
                <div style={{ fontSize:16,color:C.muted,marginTop:1 }}>{a.ref} · {a.office} · {a.amount>0?fmt$(a.amount):"—"}</div>
              </div>
              <OSOBadge label={a.status} color={a.status==="APPROVED"?"green":a.status==="OVERDUE"?"red":a.status==="CLOSED"?"gray":"gold"} small C={C} />
            </div>
          ))}
        </OSOCard>
      </div>

      {/* Payroll + Travel detail strip */}
      {(() => {
        const completedTravel = TRAVEL_REQUESTS.filter(t=>t.status==="COMPLETED"||t.status==="APPROVED");
        return (
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:16 }}>
            <OSOCard C={C}>
              <SH title="💵 Payroll — FTE Roster Snapshot" sub="OC 11.0 + 12.0 · SK pay scale · FY2026"
                action={navigate&&<button onClick={()=>navigate("payroll")} style={{ background:"none",border:`1px solid ${C.cyan}`,borderRadius:6,padding:"3px 10px",fontSize:15,color:C.cyan,cursor:"pointer",fontWeight:600 }}>Detail →</button>} C={C} />
              <table style={{ width:"100%",borderCollapse:"collapse" }}>
                <thead><tr><OSOTh C={C}>Position</OSOTh><OSOTh C={C}>Grade</OSOTh><OSOTh right C={C}>Annual Cost</OSOTh><OSOTh C={C}>Status</OSOTh></tr></thead>
                <tbody>{PAYROLL_FTE.slice(0,5).map((f,i)=>(
                  <tr key={i} style={{ background:f.status==="VACANT"?C.redBg:i%2===0?C.card:C.dim+"22" }}>
                    <OSOTd C={C}><span style={{fontWeight:f.status==="VACANT"?400:500,color:f.status==="VACANT"?C.muted:C.text,fontSize:14}}>{f.status==="VACANT"?"[VACANT]":f.name} — {f.title}</span></OSOTd>
                    <OSOTd C={C}><span style={{fontFamily:"monospace",fontSize:13,color:C.cyan}}>{f.grade}</span></OSOTd>
                    <OSOTd right mono C={C}>{f.status==="VACANT"?"—":"$"+(f.salary+f.benefits).toLocaleString()}</OSOTd>
                    <OSOTd C={C}><OSOBadge label={f.status} color={f.status==="ONBOARD"?"green":"red"} small C={C} /></OSOTd>
                  </tr>
                ))}</tbody>
              </table>
              {PAYROLL_FTE.length>5&&<div style={{fontSize:14,color:C.muted,marginTop:8,textAlign:"center"}}>+{PAYROLL_FTE.length-5} more — see Payroll page</div>}
            </OSOCard>
            <OSOCard C={C}>
              <SH title="✈️ Travel — Active Requests" sub="OC 21.0 · FTR (41 CFR 301-304) · GTC management"
                action={navigate&&<button onClick={()=>navigate("travel")} style={{ background:"none",border:`1px solid ${C.purple}`,borderRadius:6,padding:"3px 10px",fontSize:15,color:C.purple,cursor:"pointer",fontWeight:600 }}>Detail →</button>} C={C} />
              <table style={{ width:"100%",borderCollapse:"collapse" }}>
                <thead><tr><OSOTh C={C}>Traveler</OSOTh><OSOTh C={C}>Destination</OSOTh><OSOTh right C={C}>Est.</OSOTh><OSOTh C={C}>Status</OSOTh></tr></thead>
                <tbody>{TRAVEL_REQUESTS.filter(t=>t.status!=="DRAFT").slice(0,5).map((t,i)=>(
                  <tr key={i} style={{ background:t.status==="PENDING"?C.goldBg:t.status==="COMPLETED"?C.dim+"22":i%2===0?C.card:C.dim+"22" }}>
                    <OSOTd C={C}><span style={{fontWeight:500,fontSize:14}}>{t.traveler}</span></OSOTd>
                    <OSOTd C={C}><span style={{fontSize:14,color:C.textSub}}>{t.dest}</span></OSOTd>
                    <OSOTd right mono C={C}>${t.est.toLocaleString()}</OSOTd>
                    <OSOTd C={C}><OSOBadge label={t.status} color={t.status==="APPROVED"?"green":t.status==="PENDING"?"gold":t.status==="COMPLETED"?"cyan":"gray"} small C={C} /></OSOTd>
                  </tr>
                ))}</tbody>
              </table>
            </OSOCard>
          </div>
        );
      })()}

      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:16 }}>
        <OSOCard C={C}>
          <SH title="OIG Corrective Action Tracker" sub="Open findings — OSO financial management scope" C={C} />
          {oig.map((o,i)=>(
            <div key={i} style={{ marginBottom:14,background:C.dim+"44",borderRadius:8,padding:"12px 14px" }}>
              <div style={{ display:"flex",justifyContent:"space-between",marginBottom:6 }}>
                <div style={{ fontSize:16,fontWeight:700,color:C.text }}>{o.id}: {o.title}</div>
                <OSOBadge label={o.status} color={o.status==="OPEN"?"red":o.status==="IN PROGRESS"?"gold":"green"} small C={C} />
              </div>
              <div style={{ fontSize:15,color:C.muted,marginBottom:6 }}>Due: {o.due} · {o.recs} open / {o.closed} closed</div>
              <div style={{ background:C.dim,borderRadius:3,height:5 }}>
                <div style={{ width:`${o.closed/o.recs*100}%`,height:"100%",
                               background:o.status==="OPEN"?C.red:C.gold,borderRadius:3 }} />
              </div>
            </div>
          ))}
        </OSOCard>
        <OSOCard C={C}>
          <SH title="GPC Status" sub="GSA SmartPay · 5-day reconciliation window" C={C} />
          <table style={{ width:"100%",borderCollapse:"collapse" }}>
            <thead><tr>
              <OSOTh C={C}>Cardholder</OSOTh><OSOTh right C={C}>Spend</OSOTh><OSOTh right C={C}>Limit</OSOTh><OSOTh C={C}>Status</OSOTh>
            </tr></thead>
            <tbody>{gpc.map((g,i)=>(
              <tr key={i}>
                <OSOTd C={C}>{g.cardholder}</OSOTd>
                <OSOTd right mono C={C}>{fmt$(g.ytdSpend)}</OSOTd>
                <OSOTd right mono C={C}>{fmt$(g.limit)}</OSOTd>
                <OSOTd C={C}><OSOBadge label={g.status} color={g.status==="CURRENT"?"green":"gold"} small C={C} /></OSOTd>
              </tr>
            ))}</tbody>
          </table>
        </OSOCard>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// PAGE: FINANCIAL SYSTEMS
// ───────────────────────────────────────────────────────────────────────────
function PageSystems({ C }) {
  const [active, setActive] = useState(0);
  const systems = [
    {
      name:"Momentum (Core Financial System)", icon:"🖥️", role:"Core Financial System of Record",
      color:C.blue, vendor:"CGI Federal / Momentum",
      description:"Momentum is the SEC's authoritative financial system of record. All budget execution and accounting transactions are recorded here. It maintains the Commission-wide general ledger and produces financial and external reports submitted to the U.S. Department of the Treasury, OMB, and other federal entities. Source: OIG Report No. 488 (2011).",
      whatFMDoes:[
        "View obligation balances against allocated/sub-allocated amounts",
        "Verify that OFM has loaded apportionment and allocation data",
        "Pull obligation reports by object class, office, and appropriation",
        "Coordinate with OFM when budget controls are properly set",
        "Do NOT inactivate budget document controls — this caused ADA risk per OIG-488",
        "Monitor for system alerts on allocation vs. apportionment mismatches",
      ],
      limitations:"BPPAS historically configured to track only one appropriation symbol. SEC-R 14-1 (Administrative Control of Funds Regulation) governs Momentum's control settings.",
      integration:"Receives allocation/sub-allocation downloads from BPPAS. Uploads obligation data back to BPPAS. Feeds Treasury reports (SF-133, GTAS, USSGL).",
    },
    {
      name:"BPPAS (Budget Planning System)", icon:"📊", role:"Budget Formulation & Activity-Based Costing",
      color:C.purple, vendor:"SEC Internal / Activity-Based Costing Tool",
      description:"Budget and Program Performance Analysis System — the SEC's activity-based costing and performance-based budgeting software. Used for budget planning and formulation, and for developing the annual operating budget. BPPAS downloads and updates appropriation, apportionment, allocation, and sub-allocation data to Momentum at varying levels of detail. Source: OIG Report No. 488.",
      whatFMDoes:[
        "Input OSO program office budget requests during formulation season",
        "Review BPPAS allocation data to ensure OSO's allotments are correctly loaded",
        "Cross-reference BPPAS performance data against Momentum obligation data",
        "Identify discrepancies between planned spending (BPPAS) and actual obligations (Momentum)",
        "Use BPPAS reports to build OSO's contribution to the annual CBJ",
        "Coordinate with OFM Budget Branch when BPPAS data does not match Momentum",
      ],
      limitations:"Historically tracked only one appropriation symbol — manual override required for Reserve Fund obligations. OFM manages BPPAS centrally; OSO FM has read/input access.",
      integration:"Pushes allocation data to Momentum. Receives obligation actuals back from Momentum for variance analysis. Feeds CBJ tables.",
    },
    {
      name:"GSA SmartPay (GPC Program)", icon:"💳", role:"Government Purchase Card Management",
      color:C.green, vendor:"GSA / Citibank",
      description:"GSA SmartPay is the government-wide purchase card program. The SEC uses SmartPay for micro-purchases up to $10,000 (individual limit) and $25,000 (monthly limit). OSO cardholders must reconcile transactions within 5 business days of the billing cycle close. The FM Specialist reviews all OSO cardholder activity monthly and reports delinquent accounts to the Approving Official and OFM. Governed by OMB Circular A-123 Appendix B and FAR 13.301.",
      whatFMDoes:[
        "Monthly review of all OSO GPC accounts — flag delinquent reconciliations",
        "Verify transactions are within single-purchase and monthly limits",
        "Confirm proper object class coding for each GPC purchase",
        "Identify split-purchase violations (prohibited under FAR 13.301(b))",
        "Maintain GPC log for internal controls documentation",
        "Coordinate with OFM GPC Program Manager on policy questions",
        "Report suspected misuse immediately to OIG and Brian Williams",
      ],
      limitations:"GPC cannot be used for: recurring services (must be contracted), exceeding micro-purchase thresholds without Competition Advocate approval, or purchases that circumvent the procurement process.",
      integration:"Transaction data flows into Momentum via accounting codes on each purchase. OFM maintains the agency-wide GPC policy. GSA SmartPay portal (IOD) is the cardholder-facing system.",
    },
    {
      name:"SAM.gov / FPDS (Procurement Data)", icon:"🔍", role:"Contract & Procurement Data Repository",
      color:C.gold, vendor:"GSA (gov-wide)",
      description:"SAM.gov is now the authoritative source for federal contract award data following FPDS.gov decommission on February 24, 2026. Contract data migrated to SAM.gov's Contract Awards Management portal (formerly FPDS database). All SEC contract actions above the micro-purchase threshold are reportable. OSO FM Specialist uses SAM.gov to: verify contract data, track ceiling obligations, research vendor registration, and validate COR-reported data against official award records. Source: GSA SAM.gov migration, February 24, 2026.",
      whatFMDoes:[
        "Search OSO contract awards to verify ceiling amounts and period of performance",
        "Confirm vendor SAM.gov active registration before new obligations",
        "Cross-reference COR-reported ceiling utilization against official contract records",
        "Research vendor history for T&M contract type decision analysis (OIG-582 controls now embedded)",
        "Verify contract modifications are properly recorded for obligation tracking",
        "Use SAM.gov ATOM feed / API for automated contract data pulls",
      ],
      limitations:"Requires SAM.gov account (Login.gov) for full access. FPDS.gov legacy portal decommissioned Feb 24, 2026 — use sam.gov/contracting for all new searches.",
      integration:"Contract award data feeds into SAM.gov from SEC's Contract Writing System (CWS). OSO FM reconciles SAM.gov data against Momentum obligation records quarterly.",
    },
    {
      name:"Travel / Concur (Likely)", icon:"✈️", role:"Travel Authorization & Expense (Estimated)",
      color:C.cyan, vendor:"SAP Concur (widely used across federal agencies)",
      description:"Most mid-size federal agencies use SAP Concur or a similar system for travel authorizations and expense reports. The SEC has travel policy managed by OFM (per CBJ). OSO staff travel to COOP alternate sites, FEMA exercises, and training. The FM Specialist tracks travel obligations (OC 21.0) and ensures travel expenses are properly approved, coded, and within per diem limits. Note: Concur/travel system is assumed based on federal agency standard practice — verify actual system name on Day 1. Source: SEC CBJ FY2027 (OC 21.0 travel line).",
      whatFMDoes:[
        "Review travel authorization requests for proper funding citation",
        "Verify OC 21.0 travel obligations do not exceed allotment",
        "Track COOP exercise travel costs against planned budget",
        "Confirm per diem rates (GSA.gov rates) are properly applied",
        "Monitor for bona fide need compliance on year-end travel",
        "Coordinate with OFM on any travel policy interpretation questions",
      ],
      limitations:"Year-end travel obligations must meet bona fide need test — travel that occurs after September 30 cannot be obligated against current-year funds even if the system is open.",
      integration:"Travel expense reports flow into Momentum via object class 21.0. OFM sets the travel policy framework; OSO FM manages OSO-specific travel tracking.",
    },
    {
      name:"HR Connect / WebTA (Payroll/Time)", icon:"👥", role:"Payroll & Timekeeping (Estimated)",
      color:C.orange, vendor:"Interior Business Center (IBC) or SEC internal",
      description:"Federal agencies use OPM-shared service centers or internal systems for payroll and timekeeping. Small agencies often use Interior Business Center (IBC) or NFC. The SEC's payroll system (OC 11.0/12.0) is the single largest obligation driver — 69.1% of total obligations. OSO FM Specialist tracks payroll obligations against allotments, monitors FTE ceiling compliance, and coordinates with OFM when compensation adds are onboarded. Note: Actual system name should be verified on Day 1. Source: OIG Report No. 488 (payroll processing noted as a Momentum budget control concern).",
      whatFMDoes:[
        "Monthly reconciliation of payroll obligations against OC 11.0/12.0 allotment",
        "Track FTE against authorized ceiling by office (FOIA, OSBO, OAMR, BMCB)",
        "Flag any month where personnel compensation pace exceeds 1/12 baseline",
        "Coordinate with OHR when new hires will be onboarded (compensation add impact)",
        "Monitor for payroll obligations exceeding apportionment (OIG-488 finding)",
        "Ensure payroll processing does not require override of Momentum budget controls",
      ],
      limitations:"Payroll is a mandatory obligation — cannot be withheld or deferred. If OC 11.0 is projected to exceed allotment due to unexpected hires, OSO FM must immediately notify OFM for re-allotment.",
      integration:"Payroll data flows into Momentum via OC 11.0/12.0 entries. BPPAS uses payroll actuals to update performance/cost data. FTE reports from HR system used to validate BPPAS FTE tracking.",
    },
  ];
  const sys = systems[active];
  return (
    <div style={{ display:"flex",flexDirection:"column",gap:20 }}>
      <SH title="SEC Financial Systems Reference" C={C}
        sub="Core systems the OSO FM Specialist touches daily — with operational SOPs" />
      <div style={{ display:"grid",gridTemplateColumns:"220px 1fr",gap:16 }}>
        <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
          {systems.map((s,i)=>(
            <button key={i} onClick={()=>setActive(i)}
              style={{ background:active===i?s.color+"22":C.card,
                       border:`1px solid ${active===i?s.color:C.border}`,
                       borderRadius:8,padding:"10px 12px",cursor:"pointer",textAlign:"left" }}>
              <div style={{ fontSize:16,marginBottom:3 }}>{s.icon}</div>
              <div style={{ fontSize:15,fontWeight:700,color:active===i?s.color:C.text,lineHeight:1.3 }}>{s.name.split("(")[0].trim()}</div>
              <div style={{ fontSize:16,color:C.muted,marginTop:2 }}>{s.role}</div>
            </button>
          ))}
        </div>
        <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
          <div style={{ background:sys.color+"18",border:`1px solid ${sys.color}44`,
                         borderRadius:10,padding:"16px 18px" }}>
            <div style={{ display:"flex",gap:12,alignItems:"center",marginBottom:8 }}>
              <span style={{ fontSize:28 }}>{sys.icon}</span>
              <div>
                <div style={{ fontSize:15,fontWeight:700,color:C.text }}>{sys.name}</div>
                <div style={{ fontSize:15,color:sys.color }}>{sys.vendor}</div>
              </div>
            </div>
            <div style={{ fontSize:16,color:C.textSub,lineHeight:1.7 }}>{sys.description}</div>
          </div>
          <OSOCard C={C}>
            <SH title="What the FM Specialist Does in This System" C={C} />
            {sys.whatFMDoes.map((item,i)=>(
              <div key={i} style={{ display:"flex",gap:10,marginBottom:9,alignItems:"flex-start" }}>
                <span style={{ color:sys.color,fontWeight:700,marginTop:1,flexShrink:0 }}>▸</span>
                <span style={{ fontSize:16,color:C.textSub,lineHeight:1.55 }}>{item}</span>
              </div>
            ))}
          </OSOCard>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:14 }}>
            <OSOCard C={C}>
              <SH title="Limitations & Cautions" C={C} />
              <div style={{ fontSize:16,color:C.textSub,lineHeight:1.65 }}>{sys.limitations}</div>
            </OSOCard>
            <OSOCard C={C}>
              <SH title="Integration Points" C={C} />
              <div style={{ fontSize:16,color:C.textSub,lineHeight:1.65 }}>{sys.integration}</div>
            </OSOCard>
          </div>
        </div>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// PAGE: OFM COORDINATION
// ───────────────────────────────────────────────────────────────────────────
function PageOFM({ C }) {
  const steps = [
    { phase:"Oct 1 — Year Start", title:"Apportionment Loaded", ofm:"OFM receives OMB apportionment; loads allocation/sub-allocation into Momentum by office code.", osoFM:"Verify OSO's allocation is correctly loaded in Momentum; compare to prior-year baseline; flag any shortfall to Brian Williams.", urgency:"HIGH", law:"OMB Circular A-11 §120" },
    { phase:"Oct — Monthly",       title:"Obligation Tracking Report", ofm:"OFM publishes agency-wide SF-133 status quarterly. Monthly burn-rate data available in Momentum.", osoFM:"Pull Momentum data for all OSO cost centers; prepare OSO financial status report; distribute to Brian Williams by 10th of each month.", urgency:"ROUTINE", law:"OMB A-11 §145 · SF-133" },
    { phase:"Oct-Nov",              title:"FY2028 Budget Call Opens", ofm:"OFM issues agency-wide budget call per OMB A-11 guidance; provides templates, object class guidance, and DOGE efficiency instructions.", osoFM:"Distribute OFM call to OSO office heads; collect submissions; reconcile; compile OSO package; submit to OFM by internal deadline (typically Nov).", urgency:"HIGH", law:"OMB Circular A-11 §§20–25" },
    { phase:"As Needed",            title:"Reprogramming / Re-Allotment", ofm:"OFM processes realignment requests between cost centers; coordinates with OMB for above-threshold reprogrammings.", osoFM:"Identify when an OSO office is trending over allotment; prepare business case; route to OFM via Brian Williams; track against reprogramming thresholds.", urgency:"ELEVATED", law:"31 U.S.C. §1532" },
    { phase:"Quarterly",            title:"Apportionment Compliance Check", ofm:"OFM verifies agency-wide obligations vs. apportioned amounts; prepares OMB SF-132 apportionment request if needed.", osoFM:"Confirm OSO cumulative obligations do not exceed sub-allotted amounts; provide certification to OFM that no ADA risk is present in OSO cost centers.", urgency:"HIGH", law:"31 U.S.C. §1341 · A-11 §120" },
    { phase:"Sept 1-30",            title:"Year-End Execution Control", ofm:"OFM imposes agency obligation controls; reviews all September actions above threshold; monitors for bona fide need compliance.", osoFM:"Freeze discretionary OSO obligations by Sept 1; review all September needs for bona fide need rule compliance; certify year-end obligation amounts to OFM.", urgency:"CRITICAL", law:"Bona Fide Need Rule · ADA" },
    { phase:"Oct 31",               title:"Final Year-End Close", ofm:"OFM closes prior-year accounts; submits final SF-133; coordinates with Treasury on account close.", osoFM:"Submit final OSO obligation certification to OFM; confirm all de-obligations are processed; reconcile unliquidated obligations for the record.", urgency:"HIGH", law:"OMB A-11 §132" },
    { phase:"Annual",               title:"FMFIA Internal Control Report", ofm:"OFM compiles agency-wide FMFIA §2 and §4 reports; OIG reviews; Chair signs.", osoFM:"Conduct OSO internal control review (OMB A-123); document control effectiveness; provide OSO assessment to OFM for inclusion in agency report.", urgency:"ROUTINE", law:"FMFIA 31 U.S.C. §3512 · OMB A-123" },
  ];
  const urgColor = { HIGH:C.gold, CRITICAL:C.red, ELEVATED:C.orange, ROUTINE:C.green };

  return (
    <div style={{ display:"flex",flexDirection:"column",gap:20 }}>
      <SH title="OFM Coordination Workflows" C={C}
        sub="How OSO FM Specialist works with the Office of Financial Management (CFO: Caryn Kauffman, 202-551-7840)" />

      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14 }}>
        {[
          { icon:"📞", title:"Primary OFM Contact", body:"Office of Financial Management\n202-551-7840\nCaryn Kauffman, CFO\nPlanning & Budget Office\n(Budget Formulation & Execution Branch)", color:C.blue },
          { icon:"📋", title:"OSO Budget Authority Chain", body:"OMB apportions → OFM allocates → OFM sub-allocates to OSO → BMCB tracks obligation pace → Reports back to OFM monthly", color:C.purple },
          { icon:"⚠️", title:"Escalation Path", body:"OSO FM flags issue → Brian Williams notified → OFM Planning & Budget → COO if ADA risk → OMB if apportionment needed → Chair if ADA violation", color:C.red },
        ].map((b,i)=>(
          <OSOCard key={i} C={C} style={{ borderLeft:`3px solid ${b.color}` }}>
            <div style={{ fontSize:22,marginBottom:7 }}>{b.icon}</div>
            <div style={{ fontSize:16,fontWeight:700,color:b.color,marginBottom:7 }}>{b.title}</div>
            <div style={{ fontSize:15,color:C.textSub,lineHeight:1.65,whiteSpace:"pre-line" }}>{b.body}</div>
          </OSOCard>
        ))}
      </div>

      <OSOCard C={C}>
        <SH title="OSO FM ↔ OFM Coordination Calendar" sub="What triggers a touchpoint with OFM and what OSO FM must deliver" C={C} />
        <div style={{ display:"flex",flexDirection:"column",gap:0 }}>
          {steps.map((s,i)=>(
            <div key={i} style={{ display:"grid",gridTemplateColumns:"130px 1fr 1fr 100px",
                                   gap:16,padding:"12px 0",
                                   borderBottom:`1px solid ${C.border}`,alignItems:"start" }}>
              <div>
                <div style={{ fontSize:16,fontFamily:"monospace",color:C.gold,
                               background:C.goldBg,padding:"2px 8px",borderRadius:4,
                               display:"inline-block",marginBottom:4 }}>{s.phase}</div>
                <div style={{ fontSize:16,color:C.muted }}>{s.law}</div>
              </div>
              <div>
                <div style={{ fontSize:16,fontWeight:700,color:C.text,marginBottom:4 }}>{s.title}</div>
                <div style={{ fontSize:15,color:C.textSub,lineHeight:1.55 }}>
                  <span style={{ color:C.muted,fontWeight:600 }}>OFM: </span>{s.ofm}
                </div>
              </div>
              <div style={{ fontSize:15,color:C.textSub,lineHeight:1.55 }}>
                <span style={{ color:C.blue,fontWeight:600 }}>OSO FM: </span>{s.osoFM}
              </div>
              <div style={{ paddingTop:2 }}>
                <OSOBadge label={s.urgency} color={
                  s.urgency==="CRITICAL"?"red":s.urgency==="HIGH"?"gold":
                  s.urgency==="ELEVATED"?"orange":"green"} small C={C} />
              </div>
            </div>
          ))}
        </div>
      </OSOCard>

      <OSOCard C={C}>
        <SH title="ADA Notification Protocol — SEC-R 14-1 Framework" sub="Source: OIG Report No. 488 (2011) · SEC Administrative Control of Funds Regulation" C={C} />
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:20 }}>
          <div>
            <div style={{ fontSize:16,fontWeight:700,color:C.red,marginBottom:10 }}>When ADA Risk is Identified</div>
            {[
              ["Step 1 — Immediate","Verify the data. Reconcile Momentum obligations against allotted amounts. Confirm apportionment category."],
              ["Step 2 — Same Day","Notify Brian Williams verbally, then in writing. Document the date/time of notification."],
              ["Step 3 — Same Day","Notify OFM Planning & Budget Office. OFM coordinates with COO and OMB."],
              ["Step 4 — Simultaneous","If violation has occurred: Report simultaneously to OIG, Agency Head (Chair), OMB, and Congress per 31 U.S.C. §1351. Cannot delay."],
              ["Step 5 — Corrective","Identify corrective options: obligation freeze, OMB reapportionment request, de-obligation of non-bona-fide items."],
              ["Step 6 — Documentation","Maintain contemporaneous records of all notifications, decisions, and corrective actions taken."],
            ].map(([head,body],i)=>(
              <div key={i} style={{ marginBottom:10 }}>
                <div style={{ fontSize:15,fontWeight:700,color:C.orange }}>{head}</div>
                <div style={{ fontSize:15,color:C.textSub,lineHeight:1.5 }}>{body}</div>
              </div>
            ))}
          </div>
          <div>
            <div style={{ fontSize:16,fontWeight:700,color:C.blue,marginBottom:10 }}>Key Documents the FM Specialist Maintains</div>
            {[
              ["SF-132","Apportionment and Reapportionment Schedule — OMB's quarterly funding release"],
              ["SF-133","Report on Budget Execution and Budgetary Resources — quarterly status to OMB"],
              ["SF-50","Notification of Personnel Action — verifies FTE ceiling compliance"],
              ["SEC-R 14-1","Administrative Control of Funds Regulation — the SEC's ADA compliance rules"],
              ["OMB A-11 §120","Apportionment authority and requirements — the governing legal authority"],
              ["OFM Allotment Letter","OSO's formal allotment from OFM — the binding sub-appropriation document"],
              ["Monthly Financial Status","FM Specialist's internal report to Brian Williams / William Buckley"],
            ].map(([doc,desc],i)=>(
              <div key={i} style={{ display:"flex",gap:10,marginBottom:8,alignItems:"flex-start",
                                     padding:"8px 10px",background:C.dim+"44",borderRadius:6 }}>
                <span style={{ fontSize:15,fontWeight:700,color:C.blue,minWidth:110 }}>{doc}</span>
                <span style={{ fontSize:15,color:C.textSub }}>{desc}</span>
              </div>
            ))}
          </div>
        </div>
      </OSOCard>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// PAGE: STAKEHOLDER MAP
// ───────────────────────────────────────────────────────────────────────────
function PageStakeholders({ C }) {
  const stakeholders = [
    { name:"Brian Williams", title:"Chief, BMCB", org:"BMCB · OSO", relation:"DIRECT SUPERVISOR", color:C.red, freq:"Daily", needs:"Monthly financial status brief, ADA risk alerts, OIG corrective action status, year-end projections, budget call coordination. Needs clear, concise analysis — not data dumps.", icon:"👔" },
    { name:"William Buckley", title:"AD for Operations & Business Manager", org:"OAMR · OSO", relation:"CHAIN OF COMMAND", color:C.orange, freq:"Weekly", needs:"High-level OSO financial health; escalated issues requiring AD-level decisions (re-allotment, reprogramming, ADA concerns). Brief format preferred.", icon:"🏛️" },
    { name:"Olivier Girod", title:"OSO Director / Chief FOIA Officer", org:"OSO", relation:"EXECUTIVE SPONSOR", color:C.purple, freq:"Monthly", needs:"OSO financial status for director-level briefings; input to FMFIA report; executive-level summary only. Girod is an engineer by training — he appreciates precise, data-supported analysis.", icon:"⭐" },
    { name:"Caryn Kauffman", title:"CFO, Office of Financial Management", org:"OFM · OCOO", relation:"FINANCIAL AUTHORITY", color:C.blue, freq:"Monthly+", needs:"OSO's allotment requests, re-allotment justifications, year-end certifications, FMFIA input, OIG finding coordination. OFM is the legal authority for all OSO financial actions — you serve under their budget guidance.", icon:"💼" },
    { name:"Ray McInerney", title:"AD FOIA Services / FOIA Officer", org:"OFS · OSO", relation:"INTERNAL CLIENT", color:C.green, freq:"Monthly", needs:"Budget status for OFS allotment; staffing cost projections; contract data for FOIA processing tools; GPC cardholder oversight (Mallon, Taylor). McInerney is operationally focused — translate money into capacity.", icon:"📋" },
    { name:"Katherine Taylor", title:"AD Security & Building Operations", org:"OSBO · OSO", relation:"INTERNAL CLIENT", color:C.gold, freq:"Monthly", needs:"OSBO's largest budget (physical security, facilities, leases, construction). T&M contracts require ongoing COR surveillance per embedded OIG-582 controls (now closed). Needs contract surveillance support and prompt obligation approvals.", icon:"🔐" },
    { name:"Amanda Pomicter", title:"Chief, Records Policy & Compliance", org:"OAMR · OSO", relation:"PEER / COORDINATION", color:C.cyan, freq:"As needed", needs:"Financial support for records management system contracts (FileNet license), NARA mandates, records disposition costs. Pomicter's branch produces OSO policies — FM Specialist ensures financial compliance with those policies.", icon:"📁" },
    { name:"Casey Coleman", title:"Chief, Records Operations / Acting Records Officer", org:"OAMR · OSO", relation:"PEER / COORDINATION", color:C.cyan, freq:"As needed", needs:"Operational records costs — scanning/digitization contractors, storage, system migration expenses. Coleman manages day-to-day records functions.", icon:"🗂️" },
    { name:"Vance Cathell", title:"Director, Office of Acquisitions", org:"OCOO", relation:"FUNCTIONAL PARTNER", color:C.purple, freq:"Per contract", needs:"Contract type justification (OIG-582 controls now embedded and closed), COR appointment, SAM.gov verification, procurement package review. Every OSO obligation above micro-purchase threshold requires Acquisitions coordination.", icon:"🤝" },
    { name:"OIG Liaison", title:"Office of Inspector General", org:"OIG · Independent", relation:"OVERSIGHT", color:C.red, freq:"As needed", needs:"OIG-582 CLOSED (all 7 recs). Current focus: OIG-574/584 FISMA follow-up, ad-hoc audit requests. Responsive, documented responses. OIG is not an adversary — treat every interaction as an audit prep exercise.", icon:"⚖️" },
  ];

  return (
    <div style={{ display:"flex",flexDirection:"column",gap:20 }}>
      <SH title="Stakeholder Map" C={C}
        sub="Who the OSO FM Specialist works with, what they need, and how often — based on public organizational data" />
      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:14 }}>
        {stakeholders.map((s,i)=>(
          <OSOCard key={i} C={C} style={{ borderLeft:`3px solid ${s.color}` }}>
            <div style={{ display:"flex",gap:12,alignItems:"flex-start",marginBottom:8 }}>
              <span style={{ fontSize:26 }}>{s.icon}</span>
              <div style={{ flex:1 }}>
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:2 }}>
                  <div style={{ fontSize:15,fontWeight:700,color:C.text }}>{s.name}</div>
                  <OSOBadge label={s.relation} color={s.relation==="DIRECT SUPERVISOR"?"red":s.relation==="FINANCIAL AUTHORITY"?"blue":s.relation==="OVERSIGHT"?"red":"gray"} small C={C} />
                </div>
                <div style={{ fontSize:15,color:s.color }}>{s.title}</div>
                <div style={{ fontSize:16,color:C.muted }}>{s.org} · Contact: {s.freq}</div>
              </div>
            </div>
            <div style={{ fontSize:15,color:C.textSub,lineHeight:1.6,
                           background:C.dim+"44",borderRadius:6,padding:"9px 11px" }}>
              {s.needs}
            </div>
          </OSOCard>
        ))}
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// PAGE: SOP LIBRARY
// ───────────────────────────────────────────────────────────────────────────
function PageSOPs({ C }) {
  const [active, setActive] = useState(0);
  const sops = [
    {
      title:"SOP-001: New Obligation Processing", icon:"📝", category:"BUDGET EXECUTION",
      purpose:"Establishes the standard process for creating, approving, and recording a new obligation in Momentum for OSO contracts, GPC purchases, and interagency agreements.",
      steps:[
        { n:"1", action:"Receive request from OSO office head or contracting officer", who:"FM Specialist", tool:"Email / OSO Budget Tracker", note:"Document date/time and requestor. Do not proceed with verbal-only requests." },
        { n:"2", action:"Verify funding availability in Momentum against OSO allotment by cost center and OC", who:"FM Specialist", tool:"Momentum (Core Financial System)", note:"Check three levels: (1) total allotment available, (2) OC-specific sub-allocation, (3) apportionment status for current quarter." },
        { n:"3", action:"Verify vendor SAM.gov active registration (mandatory for all contracts)", who:"FM Specialist", tool:"SAM.gov (sam.gov/contracting)", note:"Required under FAR 4.1103. Do not obligate against an expired SAM registration." },
        { n:"4", action:"Confirm bona fide need — is this a genuine FY2026 need?", who:"FM Specialist", tool:"Purpose Statute analysis", note:"Year-end special concern: services beginning after Sept 30 cannot be obligated against current-year funds." },
        { n:"5", action:"For T&M contracts: document scope certainty justification using the contract type decision matrix", who:"FM Specialist + Acquisitions", tool:"OA Contract Type Decision Matrix (from OIG-582 corrective action, now embedded)", note:"OIG-582 CLOSED. Matrix is now standard practice — required before any T&M award. If scope is definable, recommend fixed-price." },
        { n:"6", action:"Route obligation document to Brian Williams for approval", who:"FM Specialist", tool:"OSO internal approval process", note:"All obligations above $10,000 require Branch Chief approval. Above $100,000 may require AD-level." },
        { n:"7", action:"Upon approval: record obligation in Momentum with correct cost center, OC, and appropriation", who:"FM Specialist", tool:"Momentum", note:"Do not override Momentum budget controls (OIG-488 finding). Contact OFM if system prevents entry." },
        { n:"8", action:"Update OSO obligation tracker and confirm COR assignment (if contract)", who:"FM Specialist", tool:"OSO Budget Tracker / COR Surveillance Dashboard", note:"COR must be appointed in writing before work begins (FAR 1.602-2)." },
        { n:"9", action:"File obligation document in OSO records per NARA schedule", who:"FM Specialist", tool:"Records Management System", note:"OAMR/Records Operations coordinates records retention schedules. Obligation documents are federal records." },
      ]
    },
    {
      title:"SOP-002: Monthly Financial Status Report", icon:"📊", category:"REPORTING",
      purpose:"Standard process for preparing the monthly OSO financial status brief for Brian Williams and William Buckley. Report due by the 10th of each month.",
      steps:[
        { n:"1", action:"Pull current-month obligation data from Momentum by OSO cost center and object class", who:"FM Specialist", tool:"Momentum reports", note:"Generate by the 5th to allow review time before the 10th deadline." },
        { n:"2", action:"Reconcile Momentum data against OSO internal obligation tracker", who:"FM Specialist", tool:"OSO Budget Tracker + Momentum", note:"Discrepancies must be resolved before reporting. Document any open reconciling items." },
        { n:"3", action:"Calculate burn rate by office and flag any office > 90% or > 10% above monthly plan", who:"FM Specialist", tool:"OSO Budget Tracker (burn rate calculation)", note:"Expected monthly pace: (month number / 12) × annual allotment. Flag deviations ±10% or greater." },
        { n:"4", action:"Review GPC accounts — confirm reconciliation status for all active cardholders", who:"FM Specialist", tool:"GSA SmartPay IOD portal", note:"Any pending reconciliation beyond 5 business days is a compliance finding. Report to Brian Williams." },
        { n:"5", action:"Check OIG corrective action status — update progress on 582 and 584 actions", who:"FM Specialist", tool:"OIG Tracker / corrective action log", note:"Any missed milestone must be flagged immediately. Do not wait for the monthly report." },
        { n:"6", action:"Draft report using standard OSO Financial Status Brief template", who:"FM Specialist", tool:"Brief Generator (this portal) / Word", note:"Template: Executive Summary (1 paragraph) + Tables (burn rates, pending, GPC) + Management Actions Required." },
        { n:"7", action:"Submit draft to Brian Williams by 8th of month for review", who:"FM Specialist", tool:"Email", note:"Allow 2 business days for Brian Williams to review before finalizing." },
        { n:"8", action:"Finalize and distribute by 10th of month", who:"FM Specialist (with BW approval)", tool:"Email", note:"Distribution: Brian Williams + William Buckley. CC OFM contact as appropriate." },
        { n:"9", action:"File finalized report in records management system", who:"FM Specialist", tool:"Records Management System", note:"Retain per NARA General Records Schedule 1.1 (financial management records: 6 years)." },
      ]
    },
    {
      title:"SOP-003: Year-End Obligation Closeout", icon:"📅", category:"YEAR-END",
      purpose:"Governs OSO's year-end obligation management to ensure ADA compliance, bona fide need rule compliance, and accurate carryover calculation for the FY+1 budget.",
      steps:[
        { n:"1", action:"August 1 — Run year-end projection for all OSO offices", who:"FM Specialist", tool:"OSO Budget Tracker + Momentum", note:"Project full-year obligations at current burn rate. Flag any office trending to exceed allotment." },
        { n:"2", action:"August 15 — Brief Brian Williams on year-end position", who:"FM Specialist", tool:"Financial Status Brief", note:"Include: projected carryover amount, ADA risk assessment, offices requiring attention, and recommended actions." },
        { n:"3", action:"September 1 — Impose discretionary obligation freeze", who:"FM Specialist (with BW direction)", tool:"Written memo to OSO office heads", note:"Freeze all non-mission-critical new obligations. Only essential services and pre-committed contracts may proceed." },
        { n:"4", action:"September 1-30 — Bona fide need review on all proposed September obligations", who:"FM Specialist", tool:"Purpose Statute checklist", note:"Every September obligation must document: (1) the specific FY2026 need, (2) why it cannot wait until October 1, (3) approval chain." },
        { n:"5", action:"September 15 — Review all unliquidated obligations for de-obligation", who:"FM Specialist", tool:"Momentum ULO report", note:"De-obligate any amount no longer needed. This improves carryover projection and reduces risk of recording statute issues." },
        { n:"6", action:"September 28 — Final Momentum reconciliation", who:"FM Specialist + OFM", tool:"Momentum", note:"Last chance to correct object class coding errors, appropriation citation issues, and missing obligation documentation." },
        { n:"7", action:"September 30, COB — Final obligation entries complete", who:"FM Specialist", tool:"Momentum", note:"No new obligations after COB September 30 against FY2026 funds unless no-year authority applies. Coordinate with OFM on exact cutoff time." },
        { n:"8", action:"October 31 — Final year-end close", who:"FM Specialist + OFM", tool:"Momentum", note:"OFM closes prior-year accounts. FM Specialist submits final OSO obligation certification. Reconcile ULOs." },
      ]
    },
    {
      title:"SOP-004: GPC Oversight Review", icon:"💳", category:"COMPLIANCE",
      purpose:"Monthly oversight review of all OSO Government Purchase Card accounts. Ensures compliance with GSA SmartPay program rules, OMB A-123 Appendix B, and FAR 13.301.",
      steps:[
        { n:"1", action:"By 5th of month: Access GSA SmartPay IOD portal and download all OSO cardholder transaction reports", who:"FM Specialist", tool:"GSA SmartPay IOD Portal", note:"All four OSO cardholders: Mallon (OFS), Printis (OSBO-FSS), Hochberg (OSBO-FO), Taylor (OFS-R3)." },
        { n:"2", action:"Check reconciliation status for each account — flag any pending beyond 5 business days", who:"FM Specialist", tool:"SmartPay portal", note:"Delinquent reconciliation is a compliance finding. Contact cardholder immediately; escalate to Brian Williams if unresponsive." },
        { n:"3", action:"Review each transaction for: proper OC coding, split-purchase indicators, and business purpose documentation", who:"FM Specialist", tool:"SmartPay transaction detail", note:"Red flags: multiple transactions same vendor same day (split purchase), personal items, no receipt attached, amounts just under thresholds." },
        { n:"4", action:"Verify all transactions are within single-purchase limit ($10,000) and monthly limit ($25,000)", who:"FM Specialist", tool:"SmartPay limit dashboard", note:"Limit exceptions require Approving Official (AO) advance approval — document in file." },
        { n:"5", action:"Record all OSO GPC obligations in OSO Budget Tracker by OC", who:"FM Specialist", tool:"OSO Budget Tracker", note:"GPC purchases must be coded to correct OC: 26.0 (supplies), 31.0 (equipment), 25.0 (services) per OMB A-11 §79." },
        { n:"6", action:"Include GPC section in monthly Financial Status Report", who:"FM Specialist", tool:"Monthly Financial Status Brief", note:"Report: # accounts, total spend, # pending reconciliations, any compliance issues, any suspected misuse." },
        { n:"7", action:"If misuse suspected: Report immediately to Brian Williams and OIG", who:"FM Specialist", tool:"Written referral", note:"Zero tolerance per GSA SmartPay terms. Do not attempt to investigate internally before referring to OIG." },
      ]
    },
    {
      title:"SOP-005: OIG Finding Corrective Action Management", icon:"⚖️", category:"COMPLIANCE",
      purpose:"Manages OSO's response to open OIG audit recommendations, ensuring timely, documented, and sustainable corrective actions that satisfy OIG closure requirements.",
      steps:[
        { n:"1", action:"Upon receipt of OIG report: assign each recommendation to a responsible official with target date", who:"FM Specialist + Brian Williams", tool:"OIG Tracker (this portal)", note:"FM Specialist coordinates on OCOO-scope recommendations. OIG-582 CLOSED. Current open: OIG-574 (1 rec) and OIG-584 (6 recs) — both FISMA/OIT-led, BMCB awareness required." },
        { n:"2", action:"Within 45 days: Submit written Corrective Action Plan (CAP) to OIG", who:"FM Specialist + Brian Williams", tool:"Written CAP document", note:"CAP must include: responsible official, specific action, completion milestones, and how OSO will demonstrate the control is operating." },
        { n:"3", action:"Monthly: Update OIG Tracker with progress on each recommendation", who:"FM Specialist", tool:"OIG Tracker (this portal)", note:"Include in monthly Financial Status Brief for Brian Williams. Any missed milestone must be flagged immediately." },
        { n:"4", action:"Upon completion: Assemble closure package for each recommendation", who:"FM Specialist", tool:"Closure package template", note:"Closure package format: (1) Agreed action restatement, (2) What was done (narrative), (3) Evidence attached (screenshots, logs, SOPs), (4) Date completed, (5) Contact for verification." },
        { n:"5", action:"Submit closure package to OIG Liaison for review", who:"FM Specialist + Brian Williams", tool:"OIG Liaison coordination", note:"OIG may request additional evidence or conduct follow-up testing. Be responsive — SLA is typically 5 business days." },
        { n:"6", action:"After closure: Maintain evidence file for future audit cycles", who:"FM Specialist", tool:"Records Management System", note:"OIG will test recurrence in next audit cycle. Sustainable controls (automated, embedded) are preferred over manual checklists." },
      ]
    },
  ];
  const s = sops[active];
  return (
    <div style={{ display:"flex",flexDirection:"column",gap:20 }}>
      <SH title="Standard Operating Procedures (SOPs)" C={C}
        sub="OSO BMCB Financial Management · Job aids for daily operations · Based on public law, OMB guidance, and OIG audit findings" />
      <div style={{ display:"grid",gridTemplateColumns:"220px 1fr",gap:16 }}>
        <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
          {sops.map((op,i)=>(
            <button key={i} onClick={()=>setActive(i)}
              style={{ background:active===i?C.blue+"22":C.card,
                       border:`1px solid ${active===i?C.blue:C.border}`,
                       borderRadius:8,padding:"10px 12px",cursor:"pointer",textAlign:"left" }}>
              <div style={{ fontSize:16,marginBottom:3 }}>{op.icon}</div>
              <div style={{ fontSize:15,fontWeight:700,color:active===i?C.blue:C.text,lineHeight:1.3 }}>{op.title}</div>
              <div style={{ fontSize:9,color:C.muted,marginTop:2 }}>
                <OSOBadge label={op.category} color="gray" small C={C} />
              </div>
            </button>
          ))}
        </div>
        <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
          <div style={{ background:C.blue+"18",border:`1px solid ${C.blue}44`,borderRadius:10,padding:"14px 16px" }}>
            <div style={{ display:"flex",gap:12,alignItems:"center",marginBottom:6 }}>
              <span style={{ fontSize:26 }}>{s.icon}</span>
              <div>
                <div style={{ fontSize:16,fontWeight:700,color:C.text }}>{s.title}</div>
                <OSOBadge label={s.category} color="blue" small C={C} />
              </div>
            </div>
            <div style={{ fontSize:16,color:C.textSub,lineHeight:1.65 }}><strong style={{ color:C.text }}>Purpose:</strong> {s.purpose}</div>
          </div>
          <OSOCard C={C} style={{ padding:0 }}>
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%",borderCollapse:"collapse" }}>
                <thead>
                  <tr>
                    <OSOTh C={C}>#</OSOTh><OSOTh C={C}>Action</OSOTh>
                    <OSOTh C={C}>Who</OSOTh><OSOTh C={C}>Tool / System</OSOTh><OSOTh C={C}>Notes & Cautions</OSOTh>
                  </tr>
                </thead>
                <tbody>
                  {s.steps.map((step,i)=>(
                    <tr key={i} style={{ background:i%2===0?C.card:C.dim+"22" }}>
                      <OSOTd C={C}><span style={{ fontSize:15,fontWeight:800,color:C.blue }}>{step.n}</span></OSOTd>
                      <OSOTd C={C}><span style={{ fontSize:16,fontWeight:500 }}>{step.action}</span></OSOTd>
                      <OSOTd C={C}><span style={{ fontSize:15,color:C.muted }}>{step.who}</span></OSOTd>
                      <OSOTd C={C}><span style={{ fontSize:15,color:C.cyan }}>{step.tool}</span></OSOTd>
                      <OSOTd C={C}><span style={{ fontSize:15,color:step.note.includes("Do not")||step.note.includes("must")?C.gold:C.muted }}>{step.note}</span></OSOTd>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </OSOCard>
          <div style={{ fontSize:16,color:C.muted,fontStyle:"italic",textAlign:"right" }}>
            ⚠️ Assumed SOP based on OIG findings, OMB circulars, and standard federal FM practice · Verify actual SEC procedures on Day 1
          </div>
        </div>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// REMAINING PAGES (Actions, Budget, COR, GPC, Time, Formulation, OIG, Briefs)
// ───────────────────────────────────────────────────────────────────────────
function PageActions({ actions, setActions, C }) {
  const [modal,       setModal]       = useState(null);
  const [typeFilter,  setTypeFilter]  = useState("ALL");
  const [statusFilter,setStatusFilter]= useState("ALL");
  const [officeFilter,setOfficeFilter]= useState("ALL");
  const [adaFilter,   setAdaFilter]   = useState("ALL");
  const [sortCol,     setSortCol]     = useState("due");
  const [sortDir,     setSortDir]     = useState("asc");

  const save = (form) => {
    if (form.id) setActions(p=>p.map(a=>a.id===form.id?form:a));
    else         setActions(p=>[...p,{...form,id:Date.now()}]);
    setModal(null);
  };

  // ── Aggregates for KPI cards ──────────────────────────────────────
  const overdue  = actions.filter(a=>a.status==="OVERDUE").length;
  const pending  = actions.filter(a=>a.status==="PENDING REVIEW"||a.status==="PENDING RECONCILE").length;
  const highRisk = actions.filter(a=>a.adaRisk==="HIGH").length;
  const inProg   = actions.filter(a=>a.status==="IN PROGRESS").length;

  // ── Sort handler ──────────────────────────────────────────────────
  const handleSort = (col) => {
    if (sortCol===col) setSortDir(d=>d==="asc"?"desc":"asc");
    else { setSortCol(col); setSortDir("asc"); }
  };
  const SortIcon = ({ col }) => (
    <span style={{ marginLeft:4, opacity:sortCol===col?1:0.3, fontSize:9 }}>
      {sortCol===col ? (sortDir==="asc"?"▲":"▼") : "⇅"}
    </span>
  );

  // ── Filter + sort pipeline ────────────────────────────────────────
  let visible = actions.filter(a => {
    if (typeFilter  !=="ALL" && a.type   !==typeFilter)   return false;
    if (statusFilter!=="ALL" && a.status !==statusFilter) return false;
    if (officeFilter!=="ALL" && a.office !==officeFilter) return false;
    if (adaFilter   !=="ALL" && a.adaRisk!==adaFilter)    return false;
    return true;
  });
  visible = [...visible].sort((a,b) => {
    let av = a[sortCol], bv = b[sortCol];
    if (sortCol==="amount") { av=+av||0; bv=+bv||0; }
    if (sortCol==="due")    { av=new Date(av||0); bv=new Date(bv||0); }
    if (av<bv) return sortDir==="asc"?-1:1;
    if (av>bv) return sortDir==="asc"?1:-1;
    return 0;
  });

  // ── Unique values for inline dropdowns ────────────────────────────
  const allStatuses = ["ALL",...Array.from(new Set(actions.map(a=>a.status))).sort()];
  const allOffices  = ["ALL",...Array.from(new Set(actions.map(a=>a.office))).sort()];

  // ── Type badge color ──────────────────────────────────────────────
  const typeColor = (t) =>
    t==="OBLIGATION"?"blue":t==="GPC PURCHASE"?"purple":t==="COR ACTION"?"orange":
    t==="BUDGET FORMULATION"?"cyan":t==="FACILITY ACTION"?"green":t==="FLEET ACTION"?"navy":
    t==="PAYROLL ACTION"?"gold":t==="TRAVEL ACTION"?"indigo":"gray";

  // ── Tab coverage chips ────────────────────────────────────────────
  const tabGroups = [
    { label:"Budget",   types:["OBLIGATION","BUDGET FORMULATION"], color:C.blue   },
    { label:"COR",      types:["COR ACTION"],                      color:C.orange },
    { label:"GPC",      types:["GPC PURCHASE"],                    color:C.purple },
    { label:"Facility", types:["FACILITY ACTION"],                 color:C.green  },
    { label:"Fleet",    types:["FLEET ACTION"],                    color:C.cyan   },
    { label:"Payroll",  types:["PAYROLL ACTION"],                  color:C.gold   },
    { label:"Travel",   types:["TRAVEL ACTION"],                   color:C.indigo||C.purple },
  ];

  const resetFilters = () => { setTypeFilter("ALL"); setStatusFilter("ALL"); setOfficeFilter("ALL"); setAdaFilter("ALL"); };
  const hasFilters = typeFilter!=="ALL"||statusFilter!=="ALL"||officeFilter!=="ALL"||adaFilter!=="ALL";

  // ── Shared inline select style ────────────────────────────────────
  const selStyle = { background:C.card, border:`1px solid ${C.border}`, color:C.text,
                     borderRadius:6, padding:"5px 8px", fontSize:12, cursor:"pointer" };

  return (
    <div style={{ display:"flex",flexDirection:"column",gap:16 }}>
      {modal&&<OSOModal initial={modal==="new"?null:modal} onSave={save} onClose={()=>setModal(null)} C={C} />}

      <SH title="Actions & Obligation Tracker"
        sub="Unified view across all OPERATIONS tabs — click KPIs or coverage chips to filter instantly" C={C}
        action={<button onClick={()=>setModal("new")} style={{ background:C.navy,color:"#fff",border:"none",borderRadius:7,padding:"7px 14px",fontSize:13,fontWeight:700,cursor:"pointer" }}>+ New Action</button>} />

      {/* ── Clickable KPI strip ── */}
      <div style={{ display:"flex",gap:12,flexWrap:"wrap" }}>
        {[
          { label:"Total Actions",   value:actions.length, sub:"All operations tabs",        color:C.blue,                          onClick:resetFilters },
          { label:"Pending Review",  value:pending,        sub:"Click to filter",            color:pending>3?C.orange:C.gold,       onClick:()=>{ resetFilters(); setStatusFilter("PENDING REVIEW"); } },
          { label:"Overdue",         value:overdue,        sub:"Immediate action required",  color:overdue>0?C.red:C.green,         onClick:()=>{ resetFilters(); setStatusFilter("OVERDUE"); } },
          { label:"ADA Risk — HIGH", value:highRisk,       sub:"31 U.S.C. §1341 exposure",   color:highRisk>0?C.red:C.green,        onClick:()=>{ resetFilters(); setAdaFilter("HIGH"); } },
          { label:"In Progress",     value:inProg,         sub:"Click to filter",            color:C.cyan,                          onClick:()=>{ resetFilters(); setStatusFilter("IN PROGRESS"); } },
        ].map((k,i) => (
          <div key={i} onClick={k.onClick}
            style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10,
                     padding:"14px 18px", flex:1, minWidth:130, borderTop:`3px solid ${k.color}`,
                     cursor:"pointer", transition:"box-shadow 0.15s",
                     boxShadow: (statusFilter==="PENDING REVIEW"&&k.label==="Pending Review")||
                                (statusFilter==="OVERDUE"&&k.label==="Overdue")||
                                (adaFilter==="HIGH"&&k.label==="ADA Risk — HIGH")||
                                (statusFilter==="IN PROGRESS"&&k.label==="In Progress")||
                                (!hasFilters&&k.label==="Total Actions")
                                ? `0 0 0 2px ${k.color}` : "none" }}
            onMouseEnter={e=>e.currentTarget.style.boxShadow=`0 0 0 2px ${k.color}55`}
            onMouseLeave={e=>e.currentTarget.style.boxShadow=
              (statusFilter==="PENDING REVIEW"&&k.label==="Pending Review")||
              (statusFilter==="OVERDUE"&&k.label==="Overdue")||
              (adaFilter==="HIGH"&&k.label==="ADA Risk — HIGH")||
              (statusFilter==="IN PROGRESS"&&k.label==="In Progress")||
              (!hasFilters&&k.label==="Total Actions")
              ? `0 0 0 2px ${k.color}` : "none"}>
            <div style={{ fontSize:11,color:C.muted,fontWeight:600,letterSpacing:"0.07em",textTransform:"uppercase",marginBottom:6 }}>{k.label}</div>
            <div style={{ fontSize:26,fontWeight:800,color:k.color,fontFamily:"monospace",lineHeight:1 }}>{k.value}</div>
            <div style={{ fontSize:11,color:C.muted,marginTop:4 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Coverage chips ── */}
      <div style={{ display:"flex",gap:8,flexWrap:"wrap",padding:"9px 14px",
                     background:C.dim+"33",borderRadius:8,alignItems:"center" }}>
        <span style={{ fontSize:11,color:C.muted,fontWeight:700,letterSpacing:"0.06em" }}>COVERAGE:</span>
        {tabGroups.map((g,i) => {
          const count = actions.filter(a=>g.types.includes(a.type)).length;
          const active = g.types.includes(typeFilter);
          return (
            <button key={i} onClick={()=>{ resetFilters(); setTypeFilter(active?"ALL":g.types[0]); }}
              style={{ background:active?g.color:count>0?g.color+"22":"transparent",
                        border:`1px solid ${active?g.color:count>0?g.color+"55":C.border}`,
                        color:active?"#fff":count>0?g.color:C.muted,
                        borderRadius:20,padding:"3px 12px",fontSize:11,fontWeight:700,cursor:"pointer",transition:"all 0.15s" }}>
              {g.label} ({count})
            </button>
          );
        })}
        {hasFilters && (
          <button onClick={resetFilters}
            style={{ marginLeft:"auto",background:"transparent",border:`1px solid ${C.red}44`,
                      color:C.red,borderRadius:20,padding:"3px 12px",fontSize:11,fontWeight:700,cursor:"pointer" }}>
            ✕ Clear filters · {visible.length}/{actions.length} shown
          </button>
        )}
        {!hasFilters && (
          <span style={{ marginLeft:"auto",fontSize:11,color:C.muted }}>
            {actions.length} total actions
          </span>
        )}
      </div>

      {/* ── Inline column filters ── */}
      <div style={{ display:"flex",gap:10,flexWrap:"wrap",alignItems:"center" }}>
        <span style={{ fontSize:11,color:C.muted,fontWeight:600 }}>FILTER:</span>
        <select value={typeFilter}   onChange={e=>{resetFilters();setTypeFilter(e.target.value)}}   style={selStyle}>
          <option value="ALL">All Types</option>
          {["OBLIGATION","GPC PURCHASE","COR ACTION","BUDGET FORMULATION",
            "FACILITY ACTION","FLEET ACTION","PAYROLL ACTION","TRAVEL ACTION"].map(t=>(
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} style={selStyle}>
          {allStatuses.map(s=><option key={s} value={s}>{s==="ALL"?"All Statuses":s}</option>)}
        </select>
        <select value={officeFilter} onChange={e=>setOfficeFilter(e.target.value)} style={selStyle}>
          {allOffices.map(o=><option key={o} value={o}>{o==="ALL"?"All Offices":o}</option>)}
        </select>
        <select value={adaFilter}    onChange={e=>setAdaFilter(e.target.value)}    style={selStyle}>
          {["ALL","HIGH","MEDIUM","LOW"].map(r=><option key={r} value={r}>{r==="ALL"?"All ADA Risk":r}</option>)}
        </select>
        <span style={{ fontSize:11,color:C.muted,marginLeft:"auto" }}>
          {visible.length} of {actions.length} actions
        </span>
      </div>

      {/* ── Sortable table ── */}
      <OSOCard C={C} style={{ padding:0 }}>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%",borderCollapse:"collapse" }}>
            <thead>
              <tr>
                {[
                  { key:"ref",      label:"Ref #",       right:false },
                  { key:"type",     label:"Type",        right:false },
                  { key:"desc",     label:"Description", right:false },
                  { key:"office",   label:"Office",      right:false },
                  { key:"amount",   label:"Amount",      right:true  },
                  { key:"oc",       label:"OC",          right:false },
                  { key:"adaRisk",  label:"ADA",         right:false },
                  { key:"due",      label:"Due",         right:false },
                  { key:"status",   label:"Status",      right:false },
                  { key:"edit",     label:"",            right:false, noSort:true },
                ].map(col => (
                  <th key={col.key}
                    onClick={col.noSort ? undefined : ()=>handleSort(col.key)}
                    style={{ padding:"9px 12px", textAlign:col.right?"right":"left",
                             color:sortCol===col.key?C.blue:C.muted,
                             fontSize:11, fontWeight:700, letterSpacing:"0.06em",
                             background:C.dim+"44", borderBottom:`1px solid ${C.border}`,
                             whiteSpace:"nowrap", cursor:col.noSort?"default":"pointer",
                             userSelect:"none",
                             borderLeft:sortCol===col.key?`2px solid ${C.blue}`:"2px solid transparent" }}>
                    {col.label}{!col.noSort&&<SortIcon col={col.key} />}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.length===0 ? (
                <tr><td colSpan={10} style={{ padding:"28px",textAlign:"center",color:C.muted,fontSize:13 }}>
                  No actions match the current filters. <button onClick={resetFilters} style={{ background:"none",border:"none",color:C.blue,cursor:"pointer",fontWeight:700 }}>Clear filters</button>
                </td></tr>
              ) : visible.map((a,i)=>(
                <tr key={a.id} style={{ background:a.adaRisk==="HIGH"?C.redBg:i%2===0?C.card:C.dim+"22",
                                         transition:"background 0.1s" }}>
                  <td style={{ padding:"9px 12px",fontFamily:"monospace",fontSize:12,color:C.muted,
                                borderBottom:`1px solid ${C.border}22` }}>{a.ref}</td>
                  <td style={{ padding:"9px 12px",borderBottom:`1px solid ${C.border}22` }}>
                    <OSOBadge label={a.type} color={typeColor(a.type)} small C={C} />
                  </td>
                  <td style={{ padding:"9px 12px",borderBottom:`1px solid ${C.border}22` }}>
                    <div style={{ maxWidth:230 }}>
                      <div style={{ fontSize:13,fontWeight:500,color:C.text }}>{a.desc}</div>
                      {a.note&&<div style={{ fontSize:11,color:C.orange,marginTop:2 }}>⚠ {a.note.slice(0,60)}</div>}
                    </div>
                  </td>
                  <td style={{ padding:"9px 12px",fontSize:12,color:C.text,borderBottom:`1px solid ${C.border}22`,whiteSpace:"nowrap" }}>{a.office}</td>
                  <td style={{ padding:"9px 12px",textAlign:"right",fontFamily:"monospace",fontSize:12,fontWeight:700,color:C.text,borderBottom:`1px solid ${C.border}22` }}>
                    {a.amount>0?fmt$(a.amount):"—"}
                  </td>
                  <td style={{ padding:"9px 12px",fontFamily:"monospace",fontSize:12,color:C.muted,borderBottom:`1px solid ${C.border}22` }}>{a.oc}</td>
                  <td style={{ padding:"9px 12px",borderBottom:`1px solid ${C.border}22` }}>
                    <OSOBadge label={a.adaRisk} color={a.adaRisk==="HIGH"?"red":a.adaRisk==="MEDIUM"?"gold":"green"} small C={C} />
                  </td>
                  <td style={{ padding:"9px 12px",borderBottom:`1px solid ${C.border}22` }}>
                    <span style={{ fontSize:12,fontFamily:"monospace",
                                    color:new Date(a.due)<new Date()&&a.status!=="APPROVED"&&a.status!=="CLOSED"?C.red:C.muted }}>
                      {a.due}
                    </span>
                  </td>
                  <td style={{ padding:"9px 12px",borderBottom:`1px solid ${C.border}22` }}>
                    <OSOBadge label={a.status}
                      color={a.status==="APPROVED"?"green":a.status==="OVERDUE"?"red":
                             a.status==="CLOSED"?"gray":a.status==="IN PROGRESS"?"blue":"gold"} small C={C} />
                  </td>
                  <td style={{ padding:"9px 12px",borderBottom:`1px solid ${C.border}22` }}>
                    <button onClick={()=>setModal(a)}
                      style={{ background:"none",border:"none",color:C.blue,fontSize:12,cursor:"pointer",fontWeight:700 }}>
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {visible.length>0 && (
          <div style={{ padding:"8px 14px",borderTop:`1px solid ${C.border}22`,
                         fontSize:11,color:C.muted,display:"flex",justifyContent:"space-between" }}>
            <span>Sorted by <strong style={{color:C.text}}>{sortCol}</strong> ({sortDir}ending) · Click any column header to sort</span>
            <span>{visible.length} rows</span>
          </div>
        )}
      </OSOCard>
    </div>
  );
}

function PageBudget({ allotments, C }) {
  const total=allotments.reduce((s,a)=>s+a.fy26,0), ytd=allotments.reduce((s,a)=>s+a.ytd,0);
  // FY2026 — Month 9 execution · benchmark 75.0%
  return (
    <div style={{ display:"flex",flexDirection:"column",gap:20 }}>
      <SH title="OSO Budget Execution" sub={`FY2026 Allotments · June 1 · Month 9 of 12 · Total: ${fmt$(total)} · YTD: ${fmt$(ytd)} (${(ytd/total*100).toFixed(1)}% — benchmark 75.0%)`} C={C} />
      <div style={{ display:"flex",gap:12,flexWrap:"wrap" }}>
        <OSOKPI label="Total Allotment" value={fmt$(total)} sub="FY2026 enacted" color={C.blue} C={C} />
        <OSOKPI label="YTD Obligated" value={fmt$(ytd)} sub={`${(ytd/total*100).toFixed(1)}% burn`} color={C.green} C={C} />
        <OSOKPI label="Remaining" value={fmt$(total-ytd)} sub="Available" color={C.cyan} C={C} />
        <OSOKPI label="EOY Projection" value={fmt$(ytd*12)} sub={ytd*12>total?"⚠️ Exceeds allotment":"On track"} color={ytd*12>total?C.red:C.green} C={C} />
      </div>
      <OSOCard C={C}>
        <SH title="Allotment by Office" sub="Source: BPPAS allocations loaded into Momentum · Reasonable assumption" C={C} />
        <table style={{ width:"100%",borderCollapse:"collapse" }}>
          <thead><tr>
            <OSOTh C={C}>OSO Office</OSOTh><OSOTh C={C}>Code</OSOTh><OSOTh right C={C}>FY26 Allotment</OSOTh>
            <OSOTh right C={C}>YTD Obligated</OSOTh><OSOTh right C={C}>Remaining</OSOTh><OSOTh C={C}>Burn Rate</OSOTh><OSOTh C={C}>ADA Status</OSOTh>
          </tr></thead>
          <tbody>
            {allotments.map((a,i)=>{
              const pct=a.ytd/a.fy26*100;
              return (
                <tr key={i} style={{ background:pct>95?C.redBg:i%2===0?C.card:C.dim+"22" }}>
                  <OSOTd bold C={C}>{a.label}</OSOTd><OSOTd mono C={C}>{a.office}</OSOTd>
                  <OSOTd right mono C={C}>{fmtFull(a.fy26)}</OSOTd>
                  <OSOTd right mono color={pct>90?C.red:C.text} C={C}>{fmtFull(a.ytd)}</OSOTd>
                  <OSOTd right mono C={C}>{fmtFull(a.fy26-a.ytd)}</OSOTd>
                  <OSOTd C={C}><BurnBar pct={pct} C={C} /></OSOTd>
                  <OSOTd C={C}><OSOBadge label={pct>95?"ADA RISK":pct>90?"MONITOR":"ON TRACK"} color={pct>95?"red":pct>90?"gold":"green"} small C={C} /></OSOTd>
                </tr>
              );
            })}
            <tr style={{ background:C.dim+"44" }}>
              <OSOTd bold C={C}>TOTAL</OSOTd><OSOTd C={C}>—</OSOTd>
              <OSOTd right mono bold C={C}>{fmtFull(total)}</OSOTd>
              <OSOTd right mono bold C={C}>{fmtFull(ytd)}</OSOTd>
              <OSOTd right mono bold C={C}>{fmtFull(total-ytd)}</OSOTd>
              <OSOTd C={C}><BurnBar pct={ytd/total*100} C={C} /></OSOTd>
              <OSOTd C={C}><OSOBadge label="ON TRACK" color="green" small C={C} /></OSOTd>
            </tr>
          </tbody>
        </table>
      </OSOCard>
    </div>
  );
}

function PageCOR({ cor, C }) {
  return (
    <div style={{ display:"flex",flexDirection:"column",gap:20 }}>
      <SH title="COR Surveillance Tracker" sub="T&M Contract Management · Monthly ceiling utilization · FAR 1.602-2 · OIG-582 controls embedded" C={C} />
      <div style={{ background:C.greenBg,border:`1px solid ${C.green}44`,borderRadius:8,padding:"10px 14px",fontSize:16,color:C.green,fontWeight:600 }}>
        ✅ OIG-582 CLOSED — All 7 recommendations implemented before April 2025 (per SEC Management Report Apr–Sep 2025). T&M COR controls are now embedded standard practice. Monthly surveillance logs and quarterly ceiling utilization reports remain required for all T&M contracts — overdue logs are still a compliance risk.
      </div>
      <OSOCard C={C} style={{ padding:0 }}>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%",borderCollapse:"collapse" }}>
            <thead><tr>
              <OSOTh C={C}>COR Officer</OSOTh><OSOTh C={C}>Contract</OSOTh><OSOTh C={C}>Type</OSOTh>
              <OSOTh right C={C}>Ceiling</OSOTh><OSOTh right C={C}>YTD</OSOTh><OSOTh C={C}>Utilization</OSOTh>
              <OSOTh C={C}>Last Log</OSOTh><OSOTh C={C}>Next Due</OSOTh><OSOTh C={C}>T&M Monitor</OSOTh><OSOTh C={C}>Status</OSOTh>
            </tr></thead>
            <tbody>{cor.map((c,i)=>(
              <tr key={i} style={{ background:c.status==="OVERDUE"?C.redBg:i%2===0?C.card:C.dim+"22" }}>
                <OSOTd bold C={C}>{c.officer}</OSOTd>
                <OSOTd C={C}><div style={{ maxWidth:180,fontSize:15 }}>{c.contract}</div></OSOTd>
                <OSOTd C={C}><OSOBadge label={c.contractType} color={c.contractType==="T&M"?"red":"green"} small C={C} /></OSOTd>
                <OSOTd right mono C={C}>{fmt$(c.ceiling)}</OSOTd>
                <OSOTd right mono C={C}>{fmt$(c.ytdOblig)}</OSOTd>
                <OSOTd C={C}><BurnBar pct={c.utilPct} C={C} /></OSOTd>
                <OSOTd C={C}><span style={{ fontSize:15,fontFamily:"monospace" }}>{c.lastLog}</span></OSOTd>
                <OSOTd C={C}><span style={{ fontSize:15,fontFamily:"monospace" }}>{c.nextDue}</span></OSOTd>
                <OSOTd C={C}>{c.oig582&&<OSOBadge label="T&M SOP" color="gold" small C={C} />}</OSOTd>
                <OSOTd C={C}><OSOBadge label={c.status} color={c.status==="OVERDUE"?"red":"green"} small C={C} /></OSOTd>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </OSOCard>
    </div>
  );
}

function PageGPC({ gpc, C }) {
  const total=gpc.reduce((s,g)=>s+g.ytdSpend,0);
  return (
    <div style={{ display:"flex",flexDirection:"column",gap:20 }}>
      <SH title="Government Purchase Card (GPC)" sub="GSA SmartPay · OMB A-123 Appendix B · FAR 13.301 · 5-day reconciliation" C={C} />
      <div style={{ display:"flex",gap:12,flexWrap:"wrap" }}>
        <OSOKPI label="Active Cards" value={gpc.length} sub="OSO program" color={C.blue} C={C} />
        <OSOKPI label="YTD Total Spend" value={fmt$(total)} sub="All cardholders" color={C.green} C={C} />
        <OSOKPI label="Pending Recon" value={gpc.filter(g=>g.status==="PENDING").length} sub="5-day window" color={C.gold} C={C} />
      </div>
      <OSOCard C={C} style={{ padding:0 }}>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%",borderCollapse:"collapse" }}>
            <thead><tr>
              <OSOTh C={C}>Cardholder</OSOTh><OSOTh right C={C}>Limit</OSOTh><OSOTh right C={C}>YTD Spend</OSOTh>
              <OSOTh right C={C}>Pending $</OSOTh><OSOTh C={C}>% of Limit</OSOTh><OSOTh C={C}>Last Recon</OSOTh><OSOTh C={C}>Status</OSOTh>
            </tr></thead>
            <tbody>{gpc.map((g,i)=>(
              <tr key={i} style={{ background:g.status==="PENDING"?C.goldBg:i%2===0?C.card:C.dim+"22" }}>
                <OSOTd C={C}>{g.cardholder}</OSOTd>
                <OSOTd right mono C={C}>{fmt$(g.limit)}</OSOTd>
                <OSOTd right mono C={C}>{fmt$(g.ytdSpend)}</OSOTd>
                <OSOTd right mono color={g.pending>0?C.gold:C.muted} C={C}>{g.pending>0?fmt$(g.pending):"—"}</OSOTd>
                <OSOTd C={C}><BurnBar pct={g.ytdSpend/g.limit*100} C={C} /></OSOTd>
                <OSOTd C={C}><span style={{ fontSize:15,fontFamily:"monospace" }}>{g.lastRecon}</span></OSOTd>
                <OSOTd C={C}><OSOBadge label={g.status} color={g.status==="CURRENT"?"green":"gold"} small C={C} /></OSOTd>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </OSOCard>
    </div>
  );
}

function PageTime({ timekeeping, C }) {
  const total=timekeeping.reduce((s,t)=>s+t.hrs,0);
  const catC={"BUDGET EXECUTION":C.blue,"FORMULATION":C.purple,"INTERNAL CONTROLS":C.red,"COMPLIANCE":C.gold,"REPORTING":C.cyan,"ADVISORY":C.green,"COOP":C.orange,"ADMIN":C.muted};
  return (
    <div style={{ display:"flex",flexDirection:"column",gap:18 }}>
      <SH title="Timekeeping & Workload" sub="Weekly activity log · May 27-31, 2026 · OSO BMCB FM Specialist · Month 9 of FY2026" C={C} />
      <div style={{ display:"flex",gap:12,flexWrap:"wrap" }}>
        <OSOKPI label="Total Hours" value={`${total}h`} sub="This week" color={C.blue} C={C} />
        <OSOKPI label="Mission-Critical" value={`${timekeeping.filter(t=>t.cat==="BUDGET EXECUTION"||t.cat==="INTERNAL CONTROLS").reduce((s,t)=>s+t.hrs,0)}h`} sub="ADA/OIG priority" color={C.red} C={C} />
        <OSOKPI label="Formulation" value={`${timekeeping.filter(t=>t.cat==="FORMULATION").reduce((s,t)=>s+t.hrs,0)}h`} sub="FY2028 budget call" color={C.purple} C={C} />
      </div>
      <OSOCard C={C}>
        <table style={{ width:"100%",borderCollapse:"collapse" }}>
          <thead><tr><OSOTh C={C}>Activity</OSOTh><OSOTh C={C}>Category</OSOTh><OSOTh right C={C}>Hours</OSOTh><OSOTh C={C}>% of Week</OSOTh></tr></thead>
          <tbody>{timekeeping.map((t,i)=>(
            <tr key={i} style={{ background:i%2===0?C.card:C.dim+"22" }}>
              <OSOTd C={C}>{t.name}</OSOTd>
              <OSOTd C={C}><OSOBadge label={t.cat} color={t.cat==="BUDGET EXECUTION"||t.cat==="FORMULATION"?"blue":t.cat==="INTERNAL CONTROLS"?"red":t.cat==="COMPLIANCE"?"gold":t.cat==="REPORTING"?"cyan":t.cat==="ADVISORY"?"green":t.cat==="COOP"?"orange":"gray"} small C={C} /></OSOTd>
              <OSOTd right mono bold C={C}>{t.hrs}</OSOTd>
              <OSOTd C={C}>
                <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                  <div style={{ width:80,background:C.dim,borderRadius:3,height:5 }}>
                    <div style={{ width:`${t.hrs/total*100}%`,height:"100%",background:catC[t.cat]||C.muted,borderRadius:3 }} />
                  </div>
                  <span style={{ fontSize:15,color:C.muted }}>{(t.hrs/total*100).toFixed(0)}%</span>
                </div>
              </OSOTd>
            </tr>
          ))}</tbody>
        </table>
      </OSOCard>
    </div>
  );
}

function OSOPageFormulation({ C }) {
  const timeline=[
    { phase:"Spring 2026", task:"OMB A-11 Guidance Issued", status:"done", detail:"DOGE 10% efficiency targets embedded in A-11 guidance" },
    { phase:"Oct 2026", task:"OSO Internal Budget Call — OPEN", status:"active", detail:"FM Specialist coordinates OFS, OSBO, OAMR, BMCB submissions" },
    { phase:"Oct 31, 2026", task:"Office Submissions Due to BMCB", status:"active", detail:"OFS: 40% complete · OSBO: NOT STARTED ⚠️ · OAMR: 60% · BMCB: 70%" },
    { phase:"Nov 2026", task:"BMCB Consolidates & Validates", status:"pending", detail:"FM Specialist reconciles, validates, prepares OSO package" },
    { phase:"Dec 2026", task:"OSO Submission to OFM", status:"pending", detail:"William Buckley signs; OFM Planning & Budget reviews" },
    { phase:"Feb 2027", task:"President's Budget to Congress", status:"pending", detail:"SEC FY2028 CBJ submitted per 31 U.S.C. §1105(a)" },
  ];
  return (
    <div style={{ display:"flex",flexDirection:"column",gap:20 }}>
      <SH title="FY2028 Budget Formulation" sub="OSO internal budget call · OMB A-11 · FM Specialist manages coordination" C={C} />
      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:16 }}>
        <OSOCard C={C}>
          <SH title="Budget Call Status by Office" sub="Due Oct 31, 2026 to BMCB" C={C} />
          {[
            { office:"OFS — FOIA Services", status:"IN PROGRESS", owner:"Ray McInerney", pct:40, note:"Personnel submitted; contract data pending" },
            { office:"OSBO — Security & Building Ops", status:"NOT STARTED", owner:"Katherine Taylor", pct:0, note:"⚠️ Not started — follow up required this week" },
            { office:"OAMR — Records Management", status:"IN PROGRESS", owner:"William Buckley", pct:60, note:"Records license renewal documented" },
            { office:"BMCB — Business Mgmt & Continuity", status:"IN PROGRESS", owner:"Brian Williams", pct:70, note:"COOP costs estimated; admin costs pending" },
          ].map((r,i)=>(
            <div key={i} style={{ marginBottom:12,background:C.dim+"44",borderRadius:8,padding:"11px 13px",
                                   borderLeft:`3px solid ${r.status==="NOT STARTED"?C.red:r.status==="IN PROGRESS"?C.gold:C.green}` }}>
              <div style={{ display:"flex",justifyContent:"space-between",marginBottom:3 }}>
                <div style={{ fontSize:16,fontWeight:700,color:C.text }}>{r.office}</div>
                <OSOBadge label={r.status} color={r.status==="NOT STARTED"?"red":r.status==="IN PROGRESS"?"gold":"green"} small C={C} />
              </div>
              <div style={{ fontSize:15,color:C.muted,marginBottom:5 }}>Owner: {r.owner}</div>
              <div style={{ background:C.dim,borderRadius:3,height:5,marginBottom:4 }}>
                <div style={{ width:`${r.pct}%`,height:"100%",background:r.status==="NOT STARTED"?C.red:C.gold,borderRadius:3 }} />
              </div>
              <div style={{ fontSize:16,color:r.note.includes("⚠️")?C.red:C.muted }}>{r.note}</div>
            </div>
          ))}
        </OSOCard>
        <OSOCard C={C}>
          <SH title="A-11 Timeline — FY2028" C={C} />
          {timeline.map((s,i)=>(
            <div key={i} style={{ display:"flex",gap:12,alignItems:"flex-start" }}>
              <div style={{ display:"flex",flexDirection:"column",alignItems:"center" }}>
                <div style={{ width:22,height:22,borderRadius:"50%",
                               background:s.status==="done"?C.green:s.status==="active"?C.blue:C.dim,
                               display:"flex",alignItems:"center",justifyContent:"center",
                               fontSize:15,color:"#fff",fontWeight:700,flexShrink:0 }}>
                  {s.status==="done"?"✓":s.status==="active"?"●":i+1}
                </div>
                {i<timeline.length-1&&<div style={{ width:2,height:24,background:C.border,margin:"2px 0" }} />}
              </div>
              <div style={{ paddingBottom:16 }}>
                <div style={{ display:"flex",gap:8,alignItems:"center" }}>
                  <span style={{ fontSize:16,color:C.gold,fontFamily:"monospace",background:C.goldBg,padding:"1px 7px",borderRadius:3 }}>{s.phase}</span>
                  <span style={{ fontSize:16,fontWeight:600,color:s.status==="active"?C.blue:C.text }}>{s.task}</span>
                </div>
                <div style={{ fontSize:15,color:C.muted,marginTop:2 }}>{s.detail}</div>
              </div>
            </div>
          ))}
        </OSOCard>
      </div>
    </div>
  );
}

function OSOPageOIG({ oig, C }) {
  return (
    <div style={{ display:"flex",flexDirection:"column",gap:20 }}>
      <SH title="OIG Finding Tracker" sub="FMFIA / OMB A-123 · Documented closure packages required" C={C} />
      {oig.map((finding,fi)=>(
        <OSOCard key={fi} C={C} style={{ borderLeft:`4px solid ${finding.priority==="HIGH"?C.red:C.gold}` }}>
          <div style={{ display:"flex",justifyContent:"space-between",marginBottom:12 }}>
            <div>
              <div style={{ fontSize:16,fontWeight:700,color:C.text }}>{finding.id}: {finding.title}</div>
              <div style={{ fontSize:15,color:C.muted,marginTop:2 }}>Due: {finding.due} · {finding.recs} recs · {finding.closed} closed</div>
            </div>
            <div style={{ display:"flex",gap:8 }}>
              <OSOBadge label={finding.priority+" PRIORITY"} color={finding.priority==="HIGH"?"red":"gold"} C={C} />
              <OSOBadge label={finding.status} color={finding.status==="OPEN"?"red":finding.status==="IN PROGRESS"?"gold":"green"} C={C} />
            </div>
          </div>
          <div style={{ background:C.dim,borderRadius:4,height:7,marginBottom:14 }}>
            <div style={{ width:`${finding.closed/finding.recs*100}%`,height:"100%",background:finding.status==="OPEN"?C.red:C.gold,borderRadius:4 }} />
          </div>
          {finding.actions.map((a,ai)=>(
            <div key={ai} style={{ display:"flex",gap:10,alignItems:"center",background:C.dim+"44",borderRadius:7,padding:"9px 12px",marginBottom:8 }}>
              <div style={{ width:10,height:10,borderRadius:"50%",flexShrink:0,background:a.status==="CLOSED"?C.green:a.status==="IN PROGRESS"?C.gold:C.muted }} />
              <div style={{ flex:1 }}>
                <div style={{ fontSize:16,color:C.text }}>{a.text}</div>
                <div style={{ fontSize:15,color:C.muted }}>Owner: {a.owner}</div>
              </div>
              <OSOBadge label={a.status} color={a.status==="CLOSED"?"green":a.status==="IN PROGRESS"?"gold":"gray"} small C={C} />
            </div>
          ))}
        </OSOCard>
      ))}
    </div>
  );
}

function PageBriefs({ allotments, actions, oig, gpc, cor, C }) {
  const [type, setType] = useState("monthly");
  const totalA=allotments.reduce((s,a)=>s+a.fy26,0), totalY=allotments.reduce((s,a)=>s+a.ytd,0);
  const burnPct=(totalY/totalA*100).toFixed(1);
  const pending=actions.filter(a=>a.status==="PENDING REVIEW"||a.status==="PENDING RECONCILE");
  const overdue=actions.filter(a=>a.status==="OVERDUE");
  const high=actions.filter(a=>a.adaRisk==="HIGH");
  const oigOpen=oig.filter(o=>o.status!=="CLOSED");
  const gpcPend=gpc.filter(g=>g.status==="PENDING");

  const briefs = {
    monthly: { title:"OSO MONTHLY FINANCIAL STATUS BRIEF", to:"Brian Williams, Chief — Business Management & Continuity Branch", cc:"William Buckley, AD — Office of Administration & Mission Resilience", from:"Financial Management Specialist, BMCB", sections:[
      { head:"1. BUDGET EXECUTION SUMMARY", body:`FY2026 OSO Allotment: ${fmt$(totalA)} | YTD Obligations: ${fmt$(totalY)} | Burn Rate: ${burnPct}% (Month 9 of 12)\n\nExecution at ${burnPct}% vs. 75.0% benchmark — ${parseFloat(burnPct)>85?"⚠️ ABOVE benchmark — monitor closely":parseFloat(burnPct)<65?"⚠️ BELOW benchmark — risk of year-end surge":"✅ TRACKING TO BENCHMARK"}. ADA risk: ${high.length>0?"⚠️ ELEVATED — "+high.length+" item(s) flagged":"✅ LOW — no violations projected"}. 3 months remaining in FY2026.` },
      { head:"2. PENDING OBLIGATIONS", body:`${pending.length} actions pending approval. ${overdue.length} item(s) OVERDUE.\n${pending.slice(0,3).map(a=>`• ${a.ref}: ${a.desc} — ${fmt$(a.amount)} (${a.office})`).join("\n")}\n\nResolve all pending by ${new Date(Date.now()+7*86400000).toLocaleDateString()}.` },
      { head:"3. OIG CORRECTIVE ACTION", body:`${oigOpen.length} active OIG finding(s). OIG-582 (T&M Contracts): ✅ CLOSED — all 7 recs implemented before April 2025. T&M controls embedded. Current open findings: OIG-574 FISMA FY2022 (1 rec, spring 2026) and OIG-584 FISMA FY2024 (6 recs, spring 2026) — OIT primary; BMCB awareness. No OSO-specific open OIG findings.` },
      { head:"4. GPC STATUS", body:`${gpc.length} active accounts. ${gpcPend.length} pending reconciliation. YTD spend: ${fmt$(gpc.reduce((s,g)=>s+g.ytdSpend,0))}. ${gpcPend.length>0?"⚠️ ACTION: Reconcile pending within 5 business days.":"All reconciliations current."}` },
      { head:"5. MANAGEMENT ACTIONS REQUIRED", body:`1. Approve/deny ${pending.length} pending obligation(s) by ${new Date(Date.now()+7*86400000).toLocaleDateString()}\n2. Direct COR R. Jackson to submit overdue T&M surveillance log — required per embedded T&M COR SOPs (OIG-582 CLOSED, controls remain in force)\n3. Confirm FY2028 Budget Call deadline for OSBO (NOT STARTED — due Oct 31)` },
    ]},
    onepager: { title:"OSO FINANCIAL SNAPSHOT — ONE PAGER", to:"William Buckley / Olivier Girod", from:"BMCB Financial Management", sections:[
      { head:`STATUS: ${high.length>0?"⚠️ ELEVATED RISK":"✅ EXECUTING WITHIN LIMITS"}`, body:`Burn: ${burnPct}% | ADA Risk: ${high.length>0?"⚠️ ELEVATED":"✅ LOW"} | OIG-582: ✅ CLOSED | OIG-574/584: 🟡 IN PROGRESS` },
      { head:"KEY NUMBERS", body:`Allotment: ${fmt$(totalA)} | Obligated: ${fmt$(totalY)} | Remaining: ${fmt$(totalA-totalY)}\nPending: ${pending.length} | Overdue: ${overdue.length} | GPC pending: ${gpcPend.length}` },
      { head:"TOP RISK", body:`T&M COR surveillance log for Patriot Security guard contract OVERDUE (R. Jackson). OIG-582 is closed but T&M monitoring SOPs are now binding standard practice — overdue logs remain a compliance exposure. Action required immediately.` },
      { head:"NEXT STEPS", body:`(1) Close ${pending.length} pending obligations\n(2) OSBO budget call — due Oct 31\n(3) COR log compliance — urgent` },
    ]},
    oig582: { title:"OIG REPORT 582 — CLOSURE CONFIRMATION & SUSTAINED CONTROLS", to:"Brian Williams / OIG Liaison", from:"Financial Management Specialist, BMCB", sections:[
      { head:"CLOSURE STATUS — CONFIRMED", body:`OIG Report 582 (T&M Contract Management, Aug 26, 2024) — ALL 7 RECOMMENDATIONS CLOSED with OIG concurrence prior to April 1, 2025.\n\nSource: SEC Management Report to Congress, Semiannual Period April 1–September 30, 2025 (Table 1 — Report 582 absent from pending corrective actions). Report directed to: Vance Cathell, Director, Office of Acquisitions; Kenneth Johnson, Chief Operating Officer.` },
      { head:"CONTROLS NOW EMBEDDED (all 7 recs)", body:`Rec 1: Quarterly T&M ceiling utilization dashboard — DEPLOYED ✅\nRec 2: Contract type decision matrix — OPERATIONAL ✅\nRec 3: COR surveillance log SOPs and monthly protocol — IN FORCE ✅\nRec 4: T&M contract file documentation requirements updated — COMPLETE ✅\nRec 5: Pre-award contract type analysis process — IMPLEMENTED ✅\nRec 6: T&M contract monitoring procedures — ESTABLISHED ✅\nRec 7: COR and CO T&M training program — DELIVERED ✅` },
      { head:"CURRENT T&M CONTRACTS UNDER SOP", body:`(1) Patriot Security Guard Services — ceiling $1,528,000 | YTD (Month 9): $1,146,000 (75%) | COR: R. Jackson | May log: OVERDUE — action required\n(2) CleanFed Corp Janitorial — ceiling $504,000 | YTD: $378,000 (75%) | COR: L. Torres | Log: CURRENT ✅\n\nNote: OIG-582 is closed. T&M SOPs are now binding standard practice per Office of Acquisitions policy — overdue COR logs remain a compliance risk regardless of OIG status.` },
      { head:"CURRENT OPEN OIG FINDINGS (for awareness)", body:`OIG-574 FISMA FY2022: 1 of 13 recs open — OIT primary, OCOO oversight; spring 2026 target.\nOIG-584 FISMA FY2024: 6 of 10 recs open — OIT primary, OCOO oversight; spring 2026 target.\n\nNeither finding is OSO-specific. FM Specialist maintains awareness and coordinates with OIT/OCOO as needed.` },
    ]},
  };
  const B = briefs[type];
  const dateStr = new Date().toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"});

  return (
    <div style={{ display:"flex",flexDirection:"column",gap:18 }}>
      <SH title="Brief & Document Generator" sub="Monthly Status · One-Pager · OIG-582 Closure Confirmation — auto-populated from live portal data" C={C}
        action={
          <div style={{ display:"flex",gap:8 }}>
            {[["monthly","Monthly Status"],["onepager","One-Pager"],["oig582","OIG-582 Closure"]].map(([v,l])=>(
              <button key={v} onClick={()=>setType(v)} style={{ background:type===v?C.navy:C.card,color:type===v?"#fff":C.muted,border:`1px solid ${type===v?C.navy:C.border}`,borderRadius:6,padding:"5px 12px",fontSize:15,fontWeight:700,cursor:"pointer" }}>{l}</button>
            ))}
          </div>
        }
      />
      <div style={{ background:C.card,border:`1px solid ${C.border}`,borderRadius:10 }}>
        <div style={{ background:"#003087",color:"#fff",borderRadius:"10px 10px 0 0",padding:"20px 26px" }}>
          <div style={{ fontSize:9,letterSpacing:"0.15em",opacity:0.6,marginBottom:3 }}>SECURITIES AND EXCHANGE COMMISSION · OFFICE OF SUPPORT OPERATIONS</div>
          <div style={{ fontSize:15,fontWeight:800,letterSpacing:"-0.01em",marginBottom:10 }}>{B.title}</div>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:4,fontSize:15,opacity:0.85 }}>
            <div><span style={{ opacity:0.6 }}>TO: </span>{B.to}</div>
            {B.cc&&<div><span style={{ opacity:0.6 }}>CC: </span>{B.cc}</div>}
            <div><span style={{ opacity:0.6 }}>FROM: </span>{B.from}</div>
            <div><span style={{ opacity:0.6 }}>DATE: </span>{dateStr}</div>
          </div>
          <div style={{ marginTop:10,background:"rgba(255,255,255,0.15)",borderRadius:4,padding:"4px 10px",fontSize:9,fontWeight:700,display:"inline-block" }}>FOR OFFICIAL USE ONLY (FOUO)</div>
        </div>
        <div style={{ padding:"18px 26px",display:"flex",flexDirection:"column",gap:16 }}>
          {B.sections.map((s,i)=>(
            <div key={i}>
              <div style={{ fontSize:15,fontWeight:800,color:"#003087",letterSpacing:"0.05em",marginBottom:6,borderLeft:"3px solid #003087",paddingLeft:8 }}>{s.head}</div>
              <div style={{ fontSize:16,color:C.text,lineHeight:1.75,whiteSpace:"pre-line",paddingLeft:8 }}>{s.body}</div>
            </div>
          ))}
        </div>
        <div style={{ padding:"10px 26px",borderTop:`1px solid ${C.border}`,fontSize:9,color:C.muted,display:"flex",justifyContent:"space-between" }}>
          <span>OSO · BMCB Financial Management · SEC.gov</span>
          <span style={{ color:C.red,fontWeight:600 }}>⚠️ Demo · Public data + reasonable assumptions only</span>
        </div>
      </div>
      <div style={{ background:C.goldBg,border:`1px solid ${C.gold}44`,borderRadius:8,padding:"9px 14px",fontSize:15,color:C.gold }}>
        💡 Print-to-PDF: Ctrl+P → Save as PDF. Copy brief text into Word for formal distribution.
      </div>
    </div>
  );
}



// ═══════════════════════════════════════════════════════════════════════════
// PAGE: PAYROLL — FTE Tracking, Burn Rate, Forecast
// ═══════════════════════════════════════════════════════════════════════════
const PAYROLL_FTE = [
  { name:"J. Harrison",    title:"Branch Chief, BMCB",             grade:"SK-14", step:5, series:"0501", office:"BMCB",     salary:155700, benefits:46710, status:"ONBOARD", type:"PERM" },
  { name:"FM Specialist",  title:"Financial Management Specialist", grade:"SK-13", step:3, series:"0501", office:"BMCB",     salary:126245, benefits:37874, status:"ONBOARD", type:"PERM" },
  { name:"D. Mitchell",    title:"FOIA Branch Chief",              grade:"SK-14", step:2, series:"0930", office:"OFS",      salary:149300, benefits:44790, status:"ONBOARD", type:"PERM" },
  { name:"C. Reeves",      title:"Physical Security Chief",        grade:"SK-14", step:1, series:"0080", office:"OSBO-PSE", salary:146200, benefits:43860, status:"ONBOARD", type:"PERM" },
  { name:"R. Jackson",     title:"Contracting Officer Rep.",       grade:"SK-12", step:7, series:"1102", office:"OSBO-PSE", salary:109370, benefits:32811, status:"ONBOARD", type:"PERM" },
  { name:"S. Park",        title:"Administrative Officer",         grade:"SK-11", step:4, series:"0341", office:"OAMR",     salary:89125,  benefits:26738, status:"ONBOARD", type:"PERM" },
  { name:"L. Torres",      title:"Facilities COR",                 grade:"SK-12", step:2, series:"1102", office:"OSBO-CL",  salary:101440, benefits:30432, status:"ONBOARD", type:"PERM" },
  { name:"[VACANT]",       title:"Budget Analyst",                 grade:"SK-12", step:1, series:"0560", office:"BMCB",     salary:98230,  benefits:29469, status:"VACANT",  type:"PERM" },
  { name:"[VACANT]",       title:"Program Analyst",                grade:"SK-11", step:1, series:"0343", office:"OFS",      salary:82764,  benefits:24829, status:"VACANT",  type:"PERM" },
];

// FY2026 payroll — grouped by month (2 PPs per month except final entry)
// All OSO offices · OC 11+12 combined · $4.2M FY26 allotment · 26 PPs total
// As of June 1, 2026: 17 of 26 PPs processed (PP01-PP17)
const PAYROLL_MONTHLY = [
  { pp:"Oct 2025  (PP01-02)", oc11:248500, oc12:74600, total:323100, cumulative:323100  },
  { pp:"Nov 2025  (PP03-04)", oc11:248500, oc12:74600, total:323100, cumulative:646200  },
  { pp:"Dec 2025  (PP05-06)", oc11:248500, oc12:74600, total:323100, cumulative:969300  },
  { pp:"Jan 2026  (PP07-08)", oc11:248500, oc12:74600, total:323100, cumulative:1292400 },
  { pp:"Feb 2026  (PP09-10)", oc11:248500, oc12:74600, total:323100, cumulative:1615500 },
  { pp:"Mar 2026  (PP11-12)", oc11:248500, oc12:74600, total:323100, cumulative:1938600 },
  { pp:"Apr 2026  (PP13-14)", oc11:248500, oc12:74600, total:323100, cumulative:2261700 },
  { pp:"May 2026  (PP15-16)", oc11:248500, oc12:74600, total:323100, cumulative:2584800 },
  { pp:"Jun 2026  (PP17) ◀", oc11:124250, oc12:37300, total:161550, cumulative:2746350 },
];

function PagePayroll({ C }) {
  const [tab, setTab] = useState("roster");
  const onboard = PAYROLL_FTE.filter(f=>f.status==="ONBOARD");
  const vacant  = PAYROLL_FTE.filter(f=>f.status==="VACANT");
  const annualOC11 = onboard.reduce((s,f)=>s+f.salary,0);
  const annualOC12 = onboard.reduce((s,f)=>s+f.benefits,0);
  const annualTotal = annualOC11 + annualOC12;
  const ytdOC11 = PAYROLL_MONTHLY.reduce((s,m)=>s+m.oc11,0);
  const ytdOC12 = PAYROLL_MONTHLY.reduce((s,m)=>s+m.oc12,0);
  const ytdTotal = ytdOC11 + ytdOC12;
  // Linear forecast: 26 pay periods/year, 6 processed so far
  const projectedAnnual = (ytdTotal / PAYROLL_MONTHLY.length) * 26;
  const fy27Budget = 4200000; // OC 11.0 + 12.0 OSO allotment
  const burnPct = ytdTotal / fy27Budget * 100;

  const tabs = [
    { id:"roster",   label:"FTE Roster" },
    { id:"burnrate", label:"Burn Rate" },
    { id:"forecast", label:"Forecast Model" },
  ];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      <SH title="Payroll & FTE Management" sub="OC 11.0 Personnel Compensation · OC 12.0 Personnel Benefits · FY2026 Execution · June 1 · Month 9 of 12 · OSO BMCB" C={C} />

      {/* KPI Strip */}
      <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
        <OSOKPI label="Authorized FTE"      value={`${onboard.length}/${PAYROLL_FTE.length}`} sub={`${vacant.length} vacancy(ies)`}    color={C.blue}   C={C} />
        <OSOKPI label="Annual OC 11.0"      value={fmt$(annualOC11)}   sub="Personnel compensation"  color={C.green}  C={C} />
        <OSOKPI label="Annual OC 12.0"      value={fmt$(annualOC12)}   sub="Benefits (30%)"          color={C.cyan}   C={C} />
        <OSOKPI label="YTD Obligations"     value={fmt$(ytdTotal)}     sub={`${burnPct.toFixed(1)}% of FY26 allotment`} color={burnPct>90?C.red:burnPct>75?C.gold:C.green} C={C} />
        <OSOKPI label="Projected Year-End"  value={fmt$(projectedAnnual)} sub="Linear projection (6 PP)" color={projectedAnnual>fy27Budget?C.red:C.gold} C={C} />
      </div>

      {/* Tab bar */}
      <div style={{ display:"flex", gap:8, borderBottom:`1px solid ${C.border}`, paddingBottom:0 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={()=>setTab(t.id)}
            style={{ background:"none", border:"none", borderBottom: tab===t.id?`2px solid ${C.blue}`:"2px solid transparent",
                     padding:"8px 16px", fontSize:15, fontWeight:tab===t.id?700:400,
                     color:tab===t.id?C.blue:C.muted, cursor:"pointer", marginBottom:-1, transition:"all 0.15s" }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* FTE Roster */}
      {tab === "roster" && (
        <OSOCard C={C} style={{ padding:0 }}>
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead><tr>
                <OSOTh C={C}>Name</OSOTh>
                <OSOTh C={C}>Position</OSOTh>
                <OSOTh C={C}>Grade</OSOTh>
                <OSOTh C={C}>Office</OSOTh>
                <OSOTh right C={C}>OC 11.0 Salary</OSOTh>
                <OSOTh right C={C}>OC 12.0 Benefits</OSOTh>
                <OSOTh right C={C}>Total Cost</OSOTh>
                <OSOTh C={C}>Status</OSOTh>
              </tr></thead>
              <tbody>
                {PAYROLL_FTE.map((f,i) => (
                  <tr key={i} style={{ background: f.status==="VACANT" ? C.redBg : i%2===0 ? C.card : C.dim+"22" }}>
                    <OSOTd C={C}><span style={{ fontWeight:f.status==="VACANT"?400:600, color:f.status==="VACANT"?C.muted:C.text }}>{f.name}</span></OSOTd>
                    <OSOTd C={C}><span style={{ fontSize:14, color:C.muted }}>{f.title}</span></OSOTd>
                    <OSOTd C={C}><span style={{ fontFamily:"monospace", fontSize:14, color:C.cyan }}>{f.grade} Stp {f.step}</span></OSOTd>
                    <OSOTd C={C}><span style={{ fontSize:14, color:C.text }}>{f.office}</span></OSOTd>
                    <OSOTd right mono C={C}>{f.status==="VACANT" ? <span style={{color:C.muted}}>—</span> : fmtFull(f.salary)}</OSOTd>
                    <OSOTd right mono C={C}>{f.status==="VACANT" ? <span style={{color:C.muted}}>—</span> : fmtFull(f.benefits)}</OSOTd>
                    <OSOTd right mono bold C={C} color={f.status==="VACANT"?C.muted:C.text}>{f.status==="VACANT" ? "—" : fmtFull(f.salary+f.benefits)}</OSOTd>
                    <OSOTd C={C}><OSOBadge label={f.status} color={f.status==="ONBOARD"?"green":f.status==="VACANT"?"red":"gold"} small C={C} /></OSOTd>
                  </tr>
                ))}
                <tr style={{ background:C.cyanBg, borderTop:`2px solid ${C.border}` }}>
                  <OSOTd C={C}><span style={{fontWeight:700,color:C.text}}>TOTAL (Onboard)</span></OSOTd>
                  <OSOTd C={C}></OSOTd><OSOTd C={C}></OSOTd><OSOTd C={C}></OSOTd>
                  <OSOTd right mono bold C={C} color={C.green}>{fmtFull(annualOC11)}</OSOTd>
                  <OSOTd right mono bold C={C} color={C.cyan}>{fmtFull(annualOC12)}</OSOTd>
                  <OSOTd right mono bold C={C} color={C.blue}>{fmtFull(annualTotal)}</OSOTd>
                  <OSOTd C={C}></OSOTd>
                </tr>
              </tbody>
            </table>
          </div>
        </OSOCard>
      )}

      {/* Burn Rate */}
      {tab === "burnrate" && (
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <OSOCard C={C}>
            <SH title="Pay Period Obligations — FY2026 YTD" sub="OC 11.0 + OC 12.0 · 26 pay periods total · 17 processed through Jun 1" C={C} />
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse" }}>
                <thead><tr>
                  <OSOTh C={C}>Pay Period</OSOTh>
                  <OSOTh right C={C}>OC 11.0</OSOTh>
                  <OSOTh right C={C}>OC 12.0</OSOTh>
                  <OSOTh right C={C}>PP Total</OSOTh>
                  <OSOTh right C={C}>Cumulative</OSOTh>
                  <OSOTh C={C}>Budget Burn</OSOTh>
                </tr></thead>
                <tbody>
                  {PAYROLL_MONTHLY.map((m,i)=>{
                    const pct = m.cumulative/fy27Budget*100;
                    return (
                      <tr key={i} style={{ background:i%2===0?C.card:C.dim+"22" }}>
                        <OSOTd C={C}><span style={{fontFamily:"monospace",fontSize:14}}>{m.pp}</span></OSOTd>
                        <OSOTd right mono C={C}>{fmtFull(m.oc11)}</OSOTd>
                        <OSOTd right mono C={C}>{fmtFull(m.oc12)}</OSOTd>
                        <OSOTd right mono bold C={C}>{fmtFull(m.total)}</OSOTd>
                        <OSOTd right mono bold C={C} color={C.blue}>{fmtFull(m.cumulative)}</OSOTd>
                        <OSOTd C={C}><BurnBar pct={pct} C={C} /></OSOTd>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </OSOCard>
          <OSOCard C={C}>
            <SH title="Object Class Summary — FY2026 Allotment vs. YTD Obligation" sub="OSO BMCB · Personnel cost tracking · Month 9 benchmark: 75.0%" C={C} />
            <div style={{ display:"flex", gap:16, flexWrap:"wrap" }}>
              {[
                { oc:"OC 11.0", label:"Personnel Compensation", budget:3150000, ytd:ytdOC11, color:C.green },
                { oc:"OC 12.0", label:"Personnel Benefits (30%)", budget:1050000, ytd:ytdOC12, color:C.cyan },
                { oc:"TOTAL",   label:"OC 11+12 Combined",        budget:fy27Budget, ytd:ytdTotal, color:C.blue },
              ].map((r,i)=>(
                <div key={i} style={{ flex:1, minWidth:200, background:C.dim+"44", borderRadius:9, padding:"14px 16px", borderLeft:`3px solid ${r.color}` }}>
                  <div style={{ fontSize:13, fontWeight:700, color:r.color, letterSpacing:"0.08em", marginBottom:4 }}>{r.oc} — {r.label}</div>
                  <div style={{ fontSize:11, color:C.muted, marginBottom:8 }}>Budget: {fmtFull(r.budget)} | YTD: {fmtFull(r.ytd)}</div>
                  <BurnBar pct={r.ytd/r.budget*100} C={C} />
                </div>
              ))}
            </div>
          </OSOCard>
        </div>
      )}

      {/* Forecast Model */}
      {tab === "forecast" && (
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <OSOCard C={C}>
            <SH title="Linear Projection Model — FY2026 Personnel Costs" sub="Based on 17 pay periods processed · 26 total PPs · Assumes no grade changes or step increases" C={C} />
            <div style={{ display:"flex", gap:14, flexWrap:"wrap", marginBottom:16 }}>
              {[
                { label:"Avg Cost / Pay Period", value:fmt$(ytdTotal/PAYROLL_MONTHLY.length),    color:C.blue,  note:"Historical avg (6 PPs)" },
                { label:"Projected FY End",      value:fmt$(projectedAnnual),                    color:projectedAnnual>fy27Budget?C.red:C.green, note:"26-PP linear projection" },
                { label:"FY26 Allotment",         value:fmt$(fy27Budget),                         color:C.gold,  note:"OC 11+12 allotment" },
                { label:"Projected Variance",    value:fmt$(Math.abs(projectedAnnual-fy27Budget)),color:projectedAnnual>fy27Budget?C.red:C.green, note:projectedAnnual>fy27Budget?"OVER BUDGET":"UNDER BUDGET" },
              ].map((k,i)=>(
                <div key={i} style={{ flex:1, minWidth:140, background:C.dim+"44", borderRadius:9, padding:"13px 15px", borderTop:`3px solid ${k.color}` }}>
                  <div style={{ fontSize:13, color:C.muted, fontWeight:600, letterSpacing:"0.06em", textTransform:"uppercase" as const, marginBottom:6 }}>{k.label}</div>
                  <div style={{ fontSize:22, fontWeight:800, color:k.color, fontFamily:"monospace" }}>{k.value}</div>
                  <div style={{ fontSize:13, color:C.muted, marginTop:4 }}>{k.note}</div>
                </div>
              ))}
            </div>

            <SH title="Scenario Planning — FTE Change Impact" sub="Effect of vacancy fill or grade change on FY2026 projected end-of-year cost" C={C} />
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse" }}>
                <thead><tr>
                  <OSOTh C={C}>Scenario</OSOTh>
                  <OSOTh right C={C}>Annual Cost Impact</OSOTh>
                  <OSOTh right C={C}>Projected FY End</OSOTh>
                  <OSOTh right C={C}>vs. Budget</OSOTh>
                  <OSOTh C={C}>ADA Risk</OSOTh>
                </tr></thead>
                <tbody>
                  {[
                    { scenario:"Baseline (2 vacancies remain)", delta:0,       color:C.blue },
                    { scenario:"Fill GS-12 Budget Analyst vacancy", delta:127699, color:C.gold },
                    { scenario:"Fill GS-11 Program Analyst vacancy", delta:107593, color:C.gold },
                    { scenario:"Fill both vacancies",                delta:235292, color:C.red  },
                    { scenario:"One GS-13 step increase",            delta:3726,  color:C.cyan },
                    { scenario:"Two GS-13 step increases",           delta:7452,  color:C.cyan },
                  ].map((s,i) => {
                    const proj = projectedAnnual + s.delta;
                    const variance = proj - fy27Budget;
                    return (
                      <tr key={i} style={{ background:i%2===0?C.card:C.dim+"22" }}>
                        <OSOTd C={C}>{s.scenario}</OSOTd>
                        <OSOTd right mono C={C} color={s.delta===0?C.muted:C.gold}>{s.delta===0?"—":"+"+fmt$(s.delta)}</OSOTd>
                        <OSOTd right mono bold C={C} color={proj>fy27Budget?C.red:C.green}>{fmt$(proj)}</OSOTd>
                        <OSOTd right mono C={C} color={variance>0?C.red:C.green}>{variance>0?"+":""}{fmt$(Math.abs(variance))} {variance>0?"OVER":"UNDER"}</OSOTd>
                        <OSOTd C={C}><OSOBadge label={proj>fy27Budget?"HIGH":"LOW"} color={proj>fy27Budget?"red":"green"} small C={C} /></OSOTd>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </OSOCard>

          <OSOCard C={C}>
            <SH title="Key Planning Assumptions & Policy References" sub="Used in FY2026 personnel cost projection" C={C} />
            {[
              { ref:"OPM Salary Tables 2026", note:"GS base pay rates effective Jan 2026; DC locality (31.96% adjustment) applied" },
              { ref:"OMB Circular A-11 §85",  note:"Benefits loaded at 30% of base salary per OMB standard fringe benefit rate" },
              { ref:"26 Pay Periods FY2026",  note:"FY2026 = 26 bi-weekly pay periods (Oct 1, 2025 – Sep 30, 2026) · 17 PPs processed as of Jun 1, 2026" },
              { ref:"ADA Risk Threshold",     note:"Obligations projected >100% of allotment trigger ADA violation review per 31 U.S.C. §1341" },
              { ref:"Vacancy Savings",        note:"Vacant positions = salary lapse; lapse not available for reprogramming without OFM approval" },
            ].map((p,i)=>(
              <div key={i} style={{ display:"flex", gap:12, padding:"9px 0", borderBottom:`1px solid ${C.border}22` }}>
                <div style={{ fontSize:14, fontWeight:700, color:C.cyan, minWidth:220, flexShrink:0 }}>{p.ref}</div>
                <div style={{ fontSize:15, color:C.textSub }}>{p.note}</div>
              </div>
            ))}
          </OSOCard>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PAGE: TRAVEL — Budget, Expenses, Policy, GTC Cards
// ═══════════════════════════════════════════════════════════════════════════
// Travel as of June 1, 2026 · FY2026 · Month 9 · Most early-year trips completed
const TRAVEL_REQUESTS = [
  { id:"TRV-2026-001", traveler:"FM Specialist", dest:"Washington, DC",   purpose:"OMB A-11 Guidance Briefing — OEOB",                        depart:"2025-10-22", return:"2025-10-22", tdy:0, perdiem:0,   est:340,  status:"COMPLETED", gtc:"•••• 7738" },
  { id:"TRV-2026-002", traveler:"J. Harrison",   dest:"Chicago, IL",      purpose:"FMA Annual Conference — Federal FM Leadership Forum",        depart:"2025-11-04", return:"2025-11-07", tdy:4, perdiem:296, est:2180, status:"COMPLETED", gtc:"•••• 4412" },
  { id:"TRV-2026-003", traveler:"C. Reeves",     dest:"Atlanta, GA",      purpose:"Federal Protective Service Regional Security Summit",         depart:"2026-02-10", return:"2026-02-11", tdy:2, perdiem:226, est:1640, status:"COMPLETED", gtc:"•••• 5521" },
  { id:"TRV-2026-004", traveler:"D. Mitchell",   dest:"San Francisco, CA",purpose:"FOIA Federal Agency Cross-Training — OMB/DOJ Review",        depart:"2026-03-17", return:"2026-03-19", tdy:3, perdiem:341, est:2950, status:"COMPLETED", gtc:"•••• 3309" },
  { id:"TRV-2026-005", traveler:"FM Specialist", dest:"New York, NY",     purpose:"OIG-584 FISMA Controls Workshop — GAO/CIGIE (OIG-582 CLOSED)",depart:"2026-04-28", return:"2026-04-29", tdy:1, perdiem:329, est:890,  status:"COMPLETED", gtc:"•••• 7738" },
  { id:"TRV-2026-006", traveler:"S. Park",       dest:"Denver, CO",       purpose:"GSA SmartPay GPC Training — Category Manager Recertification",depart:"2026-06-23", return:"2026-06-24", tdy:2, perdiem:248, est:1320, status:"APPROVED",  gtc:"N/A" },
  { id:"TRV-2026-007", traveler:"J. Harrison",   dest:"Washington, DC",   purpose:"JFMIP Annual Conference — Agency CFO/FM Leadership Forum",    depart:"2026-07-14", return:"2026-07-16", tdy:3, perdiem:294, est:1580, status:"PENDING",   gtc:"•••• 4412" },
  { id:"TRV-2026-008", traveler:"FM Specialist", dest:"Washington, DC",   purpose:"FY2026 Year-End Close Briefing — OFM / Momentum",            depart:"2026-08-18", return:"2026-08-18", tdy:0, perdiem:0,   est:280,  status:"DRAFT",     gtc:"•••• 7738" },
];

// GTC cards as of June 1, 2026 — early-year trips all settled; only recent NYC trip outstanding
const GTC_CARDS = [
  { cardholder:"J. Harrison",  last4:"4412", limit:10000, balance:0,    pendingVoucher:0,    status:"CURRENT",    expiry:"09/28", issuer:"Citibank" },
  { cardholder:"FM Specialist",last4:"7738", limit:7500,  balance:890,  pendingVoucher:890,  status:"VOUCHER DUE",expiry:"12/27", issuer:"Citibank" },  // Apr 28-29 NYC trip; 30-day deadline Jun 3
  { cardholder:"C. Reeves",    last4:"5521", limit:7500,  balance:0,    pendingVoucher:0,    status:"CURRENT",    expiry:"06/28", issuer:"Citibank" },
  { cardholder:"D. Mitchell",  last4:"3309", limit:7500,  balance:0,    pendingVoucher:0,    status:"CURRENT",    expiry:"03/29", issuer:"Citibank" },
  { cardholder:"R. Jackson",   last4:"8801", limit:5000,  balance:0,    pendingVoucher:0,    status:"CURRENT",    expiry:"11/27", issuer:"Citibank" },
];

// Note: The FTR (41 CFR Parts 300-304), issued by GSA, governs travel for all non-DoD
// federal civilian agencies including the SEC. The JTR (Joint Travel Regulations) is
// DoD-specific and does NOT apply to SEC employees.
const TRAVEL_POLICY = [
  { ref:"FTR §301-2",           topic:"TDY Authorization",         note:"All TDY requires written authorization before departure via SEC's travel management system. Verbal approval is insufficient per FTR §301-2.1." },
  { ref:"FTR §301-11",          topic:"Per Diem Rates",            note:"GSA per diem rates apply; M&IE reduced 75% first/last day per FTR §301-11.100. Receipts required for lodging every night regardless of amount." },
  { ref:"FTR §301-70.700",      topic:"GTC Mandatory Use",         note:"Government Travel Card (GTC) must be used for all official travel expenses per FTR §301-70.700. Personal card use requires written exception approved by the AO." },
  { ref:"FTR §301-52",          topic:"Voucher Filing Deadline",   note:"Travel vouchers due within 5 working days of completing TDY per FTR §301-52.3. GTC balance must be settled within 30 days to avoid delinquency." },
  { ref:"OMB Circular A-11 §35",topic:"Travel Budget Controls",    note:"OC 21.0 travel obligations require pre-approval for trips exceeding $1,500 total cost. OSO BMCB approval required before authorizing travel." },
  { ref:"SEC Admin Policy §8",  topic:"Conference Attendance",     note:"Conferences exceeding $500 per person require SES-level approval and post-event report within 15 days per SEC internal policy." },
  { ref:"FTR §301-73",          topic:"Invitational Travel",       note:"Non-federal travelers attending SEC-sponsored events may be reimbursed at FTR rates per 41 CFR §301-73. Travel authorization required before travel commences." },
];

function PageTravel({ C }) {
  const [tab, setTab] = useState("requests");

  const approved  = TRAVEL_REQUESTS.filter(t=>t.status==="APPROVED");
  const pending   = TRAVEL_REQUESTS.filter(t=>t.status==="PENDING");
  const completed = TRAVEL_REQUESTS.filter(t=>t.status==="COMPLETED");
  const ytdSpend  = completed.reduce((s,t)=>s+t.est,0) + approved.reduce((s,t)=>s+t.est,0);
  const fy27Budget = 85000;   // OC 21.0 OSO travel allotment
  const voucherDue = GTC_CARDS.filter(c=>c.status==="VOUCHER DUE").length;

  const statusColor = { APPROVED:"green", PENDING:"gold", COMPLETED:"cyan", DRAFT:"gray" };

  const tabs = [
    { id:"requests", label:"Travel Requests" },
    { id:"gtc",      label:"GTC Cards" },
    { id:"budget",   label:"Budget & Expenses" },
    { id:"policy",   label:"Policy Reference" },
  ];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      <SH title="Travel Management" sub="OC 21.0 · FTR (41 CFR 301-304) · GTC Card Management · OSO BMCB" C={C} />

      {/* KPI Strip */}
      <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
        <OSOKPI label="FY26 Travel Budget"  value={fmt$(fy27Budget)}   sub="OC 21.0 allotment"             color={C.blue}   C={C} />
        <OSOKPI label="YTD Obligated"       value={fmt$(ytdSpend)}     sub={`${(ytdSpend/fy27Budget*100).toFixed(1)}% of budget`} color={ytdSpend/fy27Budget>0.9?C.red:C.green} C={C} />
        <OSOKPI label="Pending Approval"    value={pending.length}     sub="Awaiting BMCB sign-off"         color={pending.length>0?C.gold:C.green} C={C} />
        <OSOKPI label="GTC Cards"           value={GTC_CARDS.length}   sub="Active accounts · Citibank"     color={C.purple} C={C} />
        <OSOKPI label="Vouchers Due"        value={voucherDue}         sub="5-day filing window"             color={voucherDue>0?C.red:C.green} C={C} />
      </div>

      {/* Tab bar */}
      <div style={{ display:"flex", gap:8, borderBottom:`1px solid ${C.border}` }}>
        {tabs.map(t => (
          <button key={t.id} onClick={()=>setTab(t.id)}
            style={{ background:"none", border:"none", borderBottom:tab===t.id?`2px solid ${C.blue}`:"2px solid transparent",
                     padding:"8px 16px", fontSize:15, fontWeight:tab===t.id?700:400,
                     color:tab===t.id?C.blue:C.muted, cursor:"pointer", marginBottom:-1, transition:"all 0.15s" }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Travel Requests */}
      {tab === "requests" && (
        <OSOCard C={C} style={{ padding:0 }}>
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead><tr>
                <OSOTh C={C}>ID</OSOTh>
                <OSOTh C={C}>Traveler</OSOTh>
                <OSOTh C={C}>Destination</OSOTh>
                <OSOTh C={C}>Purpose</OSOTh>
                <OSOTh C={C}>Dates</OSOTh>
                <OSOTh right C={C}>TDY Days</OSOTh>
                <OSOTh right C={C}>Est. Cost</OSOTh>
                <OSOTh C={C}>GTC</OSOTh>
                <OSOTh C={C}>Status</OSOTh>
              </tr></thead>
              <tbody>
                {TRAVEL_REQUESTS.map((t,i) => (
                  <tr key={i} style={{ background:t.status==="PENDING"?C.goldBg:t.status==="COMPLETED"?C.dim+"22":i%2===0?C.card:C.dim+"22" }}>
                    <OSOTd C={C}><span style={{fontFamily:"monospace",fontSize:13,color:C.cyan}}>{t.id}</span></OSOTd>
                    <OSOTd C={C}><span style={{fontWeight:600}}>{t.traveler}</span></OSOTd>
                    <OSOTd C={C}>{t.dest}</OSOTd>
                    <OSOTd C={C}><span style={{fontSize:14,color:C.textSub}}>{t.purpose}</span></OSOTd>
                    <OSOTd C={C}><span style={{fontFamily:"monospace",fontSize:13}}>{t.depart}{t.return!==t.depart?` → ${t.return}`:""}</span></OSOTd>
                    <OSOTd right mono C={C}>{t.tdy > 0 ? t.tdy : "Day"}</OSOTd>
                    <OSOTd right mono bold C={C} color={C.text}>{fmtFull(t.est)}</OSOTd>
                    <OSOTd C={C}><span style={{fontFamily:"monospace",fontSize:13,color:C.muted}}>{t.gtc}</span></OSOTd>
                    <OSOTd C={C}><OSOBadge label={t.status} color={statusColor[t.status]||"gray"} small C={C} /></OSOTd>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </OSOCard>
      )}

      {/* GTC Card Management */}
      {tab === "gtc" && (
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <OSOCard C={C} style={{ padding:0 }}>
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse" }}>
                <thead><tr>
                  <OSOTh C={C}>Cardholder</OSOTh>
                  <OSOTh C={C}>Card (Last 4)</OSOTh>
                  <OSOTh C={C}>Issuer</OSOTh>
                  <OSOTh right C={C}>Credit Limit</OSOTh>
                  <OSOTh right C={C}>Current Balance</OSOTh>
                  <OSOTh right C={C}>Voucher Pending</OSOTh>
                  <OSOTh C={C}>Expiry</OSOTh>
                  <OSOTh C={C}>Status</OSOTh>
                </tr></thead>
                <tbody>
                  {GTC_CARDS.map((c,i) => (
                    <tr key={i} style={{ background:c.status==="VOUCHER DUE"?C.redBg:i%2===0?C.card:C.dim+"22" }}>
                      <OSOTd C={C}><span style={{fontWeight:600}}>{c.cardholder}</span></OSOTd>
                      <OSOTd C={C}><span style={{fontFamily:"monospace",color:C.cyan}}>•••• {c.last4}</span></OSOTd>
                      <OSOTd C={C}>{c.issuer}</OSOTd>
                      <OSOTd right mono C={C}>{fmtFull(c.limit)}</OSOTd>
                      <OSOTd right mono bold C={C} color={c.balance>0?C.gold:C.muted}>{c.balance>0?fmtFull(c.balance):"—"}</OSOTd>
                      <OSOTd right mono C={C} color={c.pendingVoucher>0?C.red:C.muted}>{c.pendingVoucher>0?fmtFull(c.pendingVoucher):"—"}</OSOTd>
                      <OSOTd C={C}><span style={{fontFamily:"monospace",fontSize:14}}>{c.expiry}</span></OSOTd>
                      <OSOTd C={C}><OSOBadge label={c.status} color={c.status==="CURRENT"?"green":c.status==="VOUCHER DUE"?"red":"gold"} small C={C} /></OSOTd>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </OSOCard>
          <div style={{ background:C.redBg, border:`1px solid ${C.red}44`, borderRadius:8, padding:"11px 15px", fontSize:15, color:C.red }}>
            ⚠️ <strong>FTR §301-70.700 / FTR §301-52:</strong> GTC balances with outstanding vouchers must be settled within <strong>30 days</strong> of return per FTR. Cards with "VOUCHER DUE" status risk delinquency — file travel voucher immediately.
          </div>
        </div>
      )}

      {/* Budget & Expenses */}
      {tab === "budget" && (
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <OSOCard C={C}>
            <SH title="OC 21.0 Travel — FY2026 Budget Execution" sub="OSO BMCB · $85,000 allotment · Month 9 · 5 of 8 trips completed" C={C} />
            <div style={{ display:"flex", gap:14, flexWrap:"wrap", marginBottom:16 }}>
              {[
                { label:"Total Allotment",  value:fmt$(fy27Budget),             color:C.blue,  note:"FY26 OC 21.0" },
                { label:"Obligated YTD",    value:fmt$(ytdSpend),               color:C.green, note:"Approved + completed" },
                { label:"Remaining",        value:fmt$(fy27Budget - ytdSpend),  color:fy27Budget-ytdSpend<10000?C.red:C.gold, note:"Available balance" },
                { label:"Pending Requests", value:fmt$(pending.reduce((s,t)=>s+t.est,0)), color:C.gold, note:`${pending.length} awaiting approval` },
              ].map((k,i)=>(
                <div key={i} style={{ flex:1, minWidth:140, background:C.dim+"44", borderRadius:9, padding:"13px 15px", borderTop:`3px solid ${k.color}` }}>
                  <div style={{ fontSize:13, color:C.muted, fontWeight:600, letterSpacing:"0.06em", textTransform:"uppercase" as const, marginBottom:6 }}>{k.label}</div>
                  <div style={{ fontSize:22, fontWeight:800, color:k.color, fontFamily:"monospace" }}>{k.value}</div>
                  <div style={{ fontSize:13, color:C.muted, marginTop:4 }}>{k.note}</div>
                </div>
              ))}
            </div>
            <BurnBar pct={ytdSpend/fy27Budget*100} C={C} />
            <div style={{ fontSize:13, color:C.muted, marginTop:6 }}>{(ytdSpend/fy27Budget*100).toFixed(1)}% of FY2026 OC 21.0 travel allotment obligated · {3} months remaining · year-end travel constraint applies Sep 1</div>
          </OSOCard>

          <OSOCard C={C} style={{ padding:0 }}>
            <div style={{ padding:"14px 18px 10px", borderBottom:`1px solid ${C.border}` }}>
              <div style={{ fontWeight:700, color:C.text }}>Trip-Level Cost Detail</div>
            </div>
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse" }}>
                <thead><tr>
                  <OSOTh C={C}>Trip</OSOTh><OSOTh C={C}>Traveler</OSOTh><OSOTh C={C}>Destination</OSOTh>
                  <OSOTh right C={C}>Est. Cost</OSOTh><OSOTh C={C}>Status</OSOTh>
                </tr></thead>
                <tbody>
                  {TRAVEL_REQUESTS.map((t,i)=>(
                    <tr key={i} style={{ background:i%2===0?C.card:C.dim+"22" }}>
                      <OSOTd C={C}><span style={{fontFamily:"monospace",fontSize:13,color:C.cyan}}>{t.id}</span></OSOTd>
                      <OSOTd C={C}>{t.traveler}</OSOTd>
                      <OSOTd C={C}>{t.dest}</OSOTd>
                      <OSOTd right mono bold C={C}>{fmtFull(t.est)}</OSOTd>
                      <OSOTd C={C}><OSOBadge label={t.status} color={statusColor[t.status]||"gray"} small C={C} /></OSOTd>
                    </tr>
                  ))}
                  <tr style={{ background:C.cyanBg, borderTop:`2px solid ${C.border}` }}>
                    <OSOTd C={C}></OSOTd><OSOTd C={C}></OSOTd>
                    <OSOTd C={C}><span style={{fontWeight:700}}>TOTAL</span></OSOTd>
                    <OSOTd right mono bold C={C} color={C.blue}>{fmtFull(TRAVEL_REQUESTS.reduce((s,t)=>s+t.est,0))}</OSOTd>
                    <OSOTd C={C}></OSOTd>
                  </tr>
                </tbody>
              </table>
            </div>
          </OSOCard>
        </div>
      )}

      {/* Policy Reference */}
      {tab === "policy" && (
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <OSOCard C={C}>
            <SH title="Travel Policy Quick Reference" sub="Federal Travel Regulation (FTR · 41 CFR 301-304) · SEC Admin Policy — FTR governs all non-DoD civilian agency travel; JTR is DoD-only and does not apply to the SEC" C={C} />
            {TRAVEL_POLICY.map((p,i)=>(
              <div key={i} style={{ display:"flex", gap:14, padding:"11px 0", borderBottom:`1px solid ${C.border}22`, alignItems:"flex-start" }}>
                <div style={{ minWidth:180, flexShrink:0 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:C.cyan, fontFamily:"monospace" }}>{p.ref}</div>
                  <div style={{ fontSize:12, color:C.muted, marginTop:2 }}>{p.topic}</div>
                </div>
                <div style={{ fontSize:15, color:C.textSub, lineHeight:1.6 }}>{p.note}</div>
              </div>
            ))}
          </OSOCard>
          <OSOCard C={C}>
            <SH title="Per Diem Reference — Common OSO Destinations" sub="FY2026–2027 GSA Per Diem Rates · M&IE + Lodging" C={C} />
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse" }}>
                <thead><tr>
                  <OSOTh C={C}>City</OSOTh><OSOTh right C={C}>Lodging</OSOTh><OSOTh right C={C}>M&IE</OSOTh><OSOTh right C={C}>Full Day</OSOTh><OSOTh right C={C}>First/Last Day</OSOTh>
                </tr></thead>
                <tbody>
                  {[
                    { city:"Washington, DC",    lodge:215, mie:79  },
                    { city:"New York, NY",      lodge:302, mie:79  },
                    { city:"San Francisco, CA", lodge:275, mie:79  },
                    { city:"Chicago, IL",       lodge:239, mie:76  },
                    { city:"Atlanta, GA",       lodge:198, mie:74  },
                    { city:"Denver, CO",        lodge:210, mie:74  },
                    { city:"Standard CONUS",    lodge:107, mie:59  },
                  ].map((r,i)=>(
                    <tr key={i} style={{ background:i%2===0?C.card:C.dim+"22" }}>
                      <OSOTd C={C}>{r.city}</OSOTd>
                      <OSOTd right mono C={C}>${r.lodge}</OSOTd>
                      <OSOTd right mono C={C}>${r.mie}</OSOTd>
                      <OSOTd right mono bold C={C} color={C.blue}>${r.lodge+r.mie}</OSOTd>
                      <OSOTd right mono C={C} color={C.muted}>${r.lodge + Math.round(r.mie*0.75)}</OSOTd>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ fontSize:13, color:C.muted, marginTop:10 }}>M&IE reduced to 75% on first and last day of TDY per FTR §301-11.100. Receipts required for lodging each night regardless of amount. GSA sets CONUS per diem rates; State Dept sets OCONUS rates.</div>
          </OSOCard>
        </div>
      )}
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// PAGE: FACILITY & FLEET MANAGEMENT
// ───────────────────────────────────────────────────────────────────────────
const FACILITIES = [
  { id:"FAC-001", name:"HQ — Station Place (100 F St NE)", city:"Washington, DC",    sqft:565000, leaseExp:"2031-09-30", annualRent:28400000, poc:"OSBO-CL", notes:"Multi-year GSA lease. Renewal planning begins FY2029." },
  { id:"FAC-002", name:"Northeast Regional Office",         city:"New York, NY",      sqft:68000,  leaseExp:"2028-03-31", annualRent:6100000,  poc:"OSBO-CL", notes:"Renewal option exercised FY2025. Space reduction under review." },
  { id:"FAC-003", name:"Boston District Office",            city:"Boston, MA",        sqft:14200,  leaseExp:"2027-06-30", annualRent:1420000,  poc:"OSBO-CL", notes:"Replacement lease in progress — expires FY2027." },
  { id:"FAC-004", name:"Philadelphia Regional Office",      city:"Philadelphia, PA",  sqft:22000,  leaseExp:"2029-09-30", annualRent:1980000,  poc:"OSBO-CL", notes:"No action required." },
  { id:"FAC-005", name:"Atlanta Regional Office",           city:"Atlanta, GA",       sqft:27500,  leaseExp:"2030-06-30", annualRent:2200000,  poc:"OSBO-CL", notes:"Space utilization review pending." },
  { id:"FAC-006", name:"Chicago Regional Office",           city:"Chicago, IL",       sqft:34000,  leaseExp:"2028-09-30", annualRent:3060000,  poc:"OSBO-CL", notes:"Hybrid work space reconfiguration complete." },
  { id:"FAC-007", name:"Fort Worth Regional Office",        city:"Fort Worth, TX",    sqft:18500,  leaseExp:"2029-03-31", annualRent:1480000,  poc:"OSBO-CL", notes:"No action required." },
  { id:"FAC-008", name:"Denver Regional Office",            city:"Denver, CO",        sqft:16000,  leaseExp:"2027-09-30", annualRent:1440000,  poc:"OSBO-CL", notes:"Assess renewal vs co-location — expires FY2027." },
  { id:"FAC-009", name:"Los Angeles Regional Office",       city:"Los Angeles, CA",   sqft:41000,  leaseExp:"2030-09-30", annualRent:5330000,  poc:"OSBO-CL", notes:"No action required." },
  { id:"FAC-010", name:"Miami Regional Office",             city:"Miami, FL",         sqft:14800,  leaseExp:"2028-06-30", annualRent:1776000,  poc:"OSBO-CL", notes:"Space reduction proposal under DOGE efficiency review." },
  { id:"FAC-011", name:"San Francisco Regional Office",     city:"San Francisco, CA", sqft:29000,  leaseExp:"2029-09-30", annualRent:4350000,  poc:"OSBO-CL", notes:"Renovation complete FY2025." },
  { id:"FAC-012", name:"Seattle District Office",           city:"Seattle, WA",       sqft:9800,   leaseExp:"2027-03-31", annualRent:980000,   poc:"OSBO-CL", notes:"Assess consolidation with SF — expires FY2027." },
];

const FLEET = [
  { id:"VEH-001", plate:"GSA-4821", make:"Ford Escape Hybrid",   year:2023, region:"HQ — DC",            assignment:"General / Pool",       mileage:18420, status:"AVAILABLE",   nextPM:"2026-11-15", fuel:"HYBRID"   },
  { id:"VEH-002", plate:"GSA-4822", make:"Ford Escape Hybrid",   year:2023, region:"HQ — DC",            assignment:"General / Pool",       mileage:22110, status:"IN USE",       nextPM:"2026-12-01", fuel:"HYBRID"   },
  { id:"VEH-003", plate:"GSA-4901", make:"Chevrolet Equinox",    year:2022, region:"Northeast — NY",     assignment:"EXAMS Field Use",      mileage:34500, status:"AVAILABLE",   nextPM:"2026-10-30", fuel:"GAS"      },
  { id:"VEH-004", plate:"GSA-5012", make:"Ford F-150 (utility)", year:2021, region:"HQ — DC",            assignment:"Facilities / Maint.",  mileage:51200, status:"MAINTENANCE", nextPM:"2026-10-22", fuel:"GAS"      },
  { id:"VEH-005", plate:"GSA-5088", make:"Toyota Camry Hybrid",  year:2024, region:"Chicago — IL",       assignment:"ENF / EXAMS Field",    mileage:9800,  status:"AVAILABLE",   nextPM:"2027-01-10", fuel:"HYBRID"   },
  { id:"VEH-006", plate:"GSA-5210", make:"Chevrolet Bolt EV",    year:2024, region:"Los Angeles — CA",   assignment:"General / Pool",       mileage:12300, status:"AVAILABLE",   nextPM:"2027-02-01", fuel:"ELECTRIC" },
  { id:"VEH-007", plate:"GSA-5312", make:"Ford Explorer",        year:2022, region:"Atlanta — GA",       assignment:"ENF Field Operations", mileage:44700, status:"IN USE",       nextPM:"2026-11-05", fuel:"GAS"      },
  { id:"VEH-008", plate:"GSA-5401", make:"Toyota Camry Hybrid",  year:2023, region:"San Francisco — CA", assignment:"General / Pool",       mileage:21600, status:"AVAILABLE",   nextPM:"2026-12-15", fuel:"HYBRID"   },
  { id:"VEH-009", plate:"GSA-5490", make:"Chevrolet Bolt EV",    year:2024, region:"Fort Worth — TX",    assignment:"EXAMS / ENF Field",    mileage:7400,  status:"AVAILABLE",   nextPM:"2027-03-01", fuel:"ELECTRIC" },
  { id:"VEH-010", plate:"GSA-5601", make:"Ford Escape Hybrid",   year:2022, region:"Philadelphia — PA",  assignment:"General / Pool",       mileage:29800, status:"AVAILABLE",   nextPM:"2026-11-20", fuel:"HYBRID"   },
];

function PageFacilityFleet({ C }) {
  const [activeTab, setActiveTab] = useState("facilities");
  const [facFilter, setFacFilter] = useState("ALL");
  const [fleetFilter, setFleetFilter] = useState("ALL");

  const totalSqft    = FACILITIES.reduce((s,f) => s+f.sqft, 0);
  const totalRent    = FACILITIES.reduce((s,f) => s+f.annualRent, 0);
  const expiringSoon = FACILITIES.filter(f => parseInt(f.leaseExp.slice(0,4)) <= 2028);
  const visibleFac   = facFilter === "ALL" ? FACILITIES
    : FACILITIES.filter(f => parseInt(f.leaseExp.slice(0,4)) <= parseInt(facFilter));

  const fleetAvail   = FLEET.filter(v => v.status==="AVAILABLE").length;
  const fleetInUse   = FLEET.filter(v => v.status==="IN USE").length;
  const fleetMaint   = FLEET.filter(v => v.status==="MAINTENANCE").length;
  const hybridEV     = FLEET.filter(v => v.fuel==="HYBRID"||v.fuel==="ELECTRIC").length;
  const visibleFleet = fleetFilter==="ALL" ? FLEET
    : FLEET.filter(v => v.status===fleetFilter||v.fuel===fleetFilter);

  const expColor = (exp) => {
    const yr = parseInt(exp.slice(0,4));
    return yr <= 2027 ? C.red : yr <= 2028 ? C.gold : C.green;
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:22 }}>

      <div style={{ background:C.cyanBg, border:`1px solid ${C.border}`, borderRadius:8,
                     padding:"10px 16px", fontSize:13, color:C.muted }}>
        📋 <strong style={{ color:C.text }}>Source:</strong> SEC FY2027 CBJ p.31 — OSO/OSBO manages office lease
        acquisition &amp; administration, property &amp; facilities management, and transportation (GSA Fleet).
        OC 23.0 (Rent, Comms &amp; Utilities) = <strong style={{ color:C.cyan }}>$108.9M</strong> FY2027 request.
      </div>

      <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
        <OSOKPI label="Locations"       value={FACILITIES.length}  sub="HQ + 11 regional"               color={C.blue}   C={C} />
        <OSOKPI label="Total Sq Ft"     value={`${(totalSqft/1000).toFixed(0)}K`} sub="All GSA leases"  color={C.cyan}   C={C} />
        <OSOKPI label="Annual Rent"     value={fmt$(totalRent)}    sub="OC 23.0 — est. all sites"       color={C.gold}   C={C} />
        <OSOKPI label="Expiring <= FY28" value={expiringSoon.length} sub="Require renewal action"       color={expiringSoon.length>2?C.red:C.orange} C={C} />
        <OSOKPI label="GSA Vehicles"    value={FLEET.length}       sub={`${fleetAvail} avail / ${fleetInUse} in use`} color={C.blue} C={C} />
        <OSOKPI label="Green Fleet"     value={`${Math.round(hybridEV/FLEET.length*100)}%`} sub="Hybrid+EV - E.O. 14008" color={C.green} C={C} />
      </div>

      <div style={{ display:"flex", gap:0, borderBottom:`1px solid ${C.border}` }}>
        {[["facilities","🏢  Office Leases & Facilities"],["fleet","🚗  GSA Fleet Management"]].map(([tab, label]) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            style={{ padding:"10px 24px", border:"none", background:"none", cursor:"pointer",
                     fontSize:13, fontWeight:700,
                     color: activeTab===tab ? C.blue : C.muted,
                     borderBottom: activeTab===tab ? `2px solid ${C.blue}` : "2px solid transparent",
                     marginBottom:-1 }}>
            {label}
          </button>
        ))}
      </div>

      {activeTab==="facilities" && (
        <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:10 }}>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              {["ALL","2027","2028","2029"].map(f => (
                <button key={f} onClick={() => setFacFilter(f)}
                  style={{ background: facFilter===f ? C.blue : C.dim+"44",
                            color: facFilter===f ? "#fff" : C.muted, border:"none",
                            borderRadius:20, padding:"5px 14px", fontSize:12, fontWeight:700, cursor:"pointer" }}>
                  {f==="ALL" ? "All Leases" : `Expires <= ${f}`}
                </button>
              ))}
            </div>
            {expiringSoon.length > 0 && (
              <div style={{ background:C.goldBg, border:`1px solid ${C.gold}44`, borderRadius:6,
                             padding:"5px 14px", fontSize:12, color:C.gold, fontWeight:600 }}>
                ⚠️ {expiringSoon.length} lease(s) expiring by FY2028 — initiate replacement procurement
              </div>
            )}
          </div>

          <OSOCard style={{ padding:0 }} C={C}>
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse" }}>
                <thead>
                  <tr>
                    <OSOTh C={C}>ID</OSOTh><OSOTh C={C}>Facility</OSOTh><OSOTh C={C}>City</OSOTh>
                    <OSOTh right C={C}>Sq Ft</OSOTh><OSOTh right C={C}>Annual Rent</OSOTh>
                    <OSOTh C={C}>Lease Expires</OSOTh><OSOTh C={C}>POC</OSOTh><OSOTh C={C}>Notes</OSOTh>
                  </tr>
                </thead>
                <tbody>
                  {visibleFac.map((f,i) => {
                    const yr = parseInt(f.leaseExp.slice(0,4));
                    return (
                      <tr key={i} style={{ background: yr<=2027?C.redBg:i%2===0?C.card:C.dim+"22" }}>
                        <OSOTd mono C={C}>{f.id}</OSOTd>
                        <OSOTd bold C={C}><div style={{ maxWidth:230, fontSize:13 }}>{f.name}</div></OSOTd>
                        <OSOTd C={C}>{f.city}</OSOTd>
                        <OSOTd right mono C={C}>{f.sqft.toLocaleString()}</OSOTd>
                        <OSOTd right mono bold C={C} color={C.cyan}>{fmt$(f.annualRent)}</OSOTd>
                        <OSOTd C={C}>
                          <span style={{ fontFamily:"monospace", fontWeight:700, color:expColor(f.leaseExp) }}>
                            {yr<=2027?"🔴 ":yr<=2028?"🟡 ":"🟢 "}{f.leaseExp}
                          </span>
                        </OSOTd>
                        <OSOTd C={C}>{f.poc}</OSOTd>
                        <OSOTd C={C}><div style={{ maxWidth:200, fontSize:12, color:C.muted }}>{f.notes}</div></OSOTd>
                      </tr>
                    );
                  })}
                  <tr style={{ background:C.dim+"55" }}>
                    <OSOTd bold C={C}>—</OSOTd>
                    <OSOTd bold C={C}>TOTALS — {visibleFac.length} locations</OSOTd>
                    <OSOTd C={C}>—</OSOTd>
                    <OSOTd right mono bold C={C}>{visibleFac.reduce((s,f)=>s+f.sqft,0).toLocaleString()}</OSOTd>
                    <OSOTd right mono bold C={C} color={C.cyan}>{fmt$(visibleFac.reduce((s,f)=>s+f.annualRent,0))}</OSOTd>
                    <OSOTd C={C}>—</OSOTd><OSOTd C={C}>—</OSOTd><OSOTd C={C}>—</OSOTd>
                  </tr>
                </tbody>
              </table>
            </div>
          </OSOCard>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
            <OSOCard C={C}>
              <SH title="Lease Expiry Timeline" sub="Replacement procurement must start 24 months before expiry" C={C} />
              {[2027,2028,2029,2030,2031].map(yr => {
                const count = FACILITIES.filter(f=>parseInt(f.leaseExp.slice(0,4))===yr).length;
                const rent  = FACILITIES.filter(f=>parseInt(f.leaseExp.slice(0,4))===yr).reduce((s,f)=>s+f.annualRent,0);
                const col   = yr<=2027?C.red:yr<=2028?C.gold:C.blue;
                return (
                  <div key={yr} style={{ marginBottom:14 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                      <span style={{ fontSize:13, color:col, fontWeight:600 }}>
                        FY{yr-1}/{String(yr).slice(2)} — {count} lease{count!==1?"s":""}
                      </span>
                      <span style={{ fontSize:12, color:C.muted, fontFamily:"monospace" }}>{fmt$(rent)}/yr</span>
                    </div>
                    <div style={{ background:C.dim+"44", borderRadius:3, height:7 }}>
                      <div style={{ width:`${count/FACILITIES.length*100}%`, height:"100%", background:col, borderRadius:3 }} />
                    </div>
                  </div>
                );
              })}
            </OSOCard>

            <OSOCard C={C}>
              <SH title="OC 23.0 — Rent, Comms & Utilities" sub="FY2027 CBJ p.7 — $108.9M agency-wide request" C={C} />
              {[
                { label:"Office Leases (est.)",         pct:72, color:C.blue,  amt:"$78.4M" },
                { label:"Telecommunications",            pct:16, color:C.cyan,  amt:"$17.4M" },
                { label:"Utilities (power/HVAC/water)",  pct:8,  color:C.gold,  amt:"$8.7M"  },
                { label:"Other / Miscellaneous",         pct:4,  color:C.muted, amt:"$4.4M"  },
              ].map((r,i) => (
                <div key={i} style={{ marginBottom:13 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                    <span style={{ fontSize:13, color:C.text }}>{r.label}</span>
                    <span style={{ fontSize:12, color:r.color, fontWeight:700, fontFamily:"monospace" }}>{r.pct}% · {r.amt}</span>
                  </div>
                  <div style={{ background:C.dim+"44", borderRadius:3, height:6 }}>
                    <div style={{ width:`${r.pct}%`, height:"100%", background:r.color, borderRadius:3 }} />
                  </div>
                </div>
              ))}
              <div style={{ borderTop:`1px solid ${C.border}`, paddingTop:10, marginTop:6,
                             display:"flex", justifyContent:"space-between" }}>
                <span style={{ fontSize:13, fontWeight:700, color:C.text }}>Total OC 23.0 (FY2027 Request)</span>
                <span style={{ fontSize:14, fontWeight:800, color:C.cyan, fontFamily:"monospace" }}>$108.9M</span>
              </div>
            </OSOCard>
          </div>

          <OSOCard C={C}>
            <SH title="Replacement Lease Actions" sub="OSBO-CL tracks procurement via GSA Occupancy Agreement process" C={C} />
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14 }}>
              {[
                { office:"Boston District Office",  exp:"Jun 2027", status:"IN PROGRESS", col:C.gold,   action:"GSA OA amendment submitted. Target: signed by Feb 2027." },
                { office:"Seattle District Office", exp:"Mar 2027", status:"IN PROGRESS", col:C.gold,   action:"Assessing consolidation with SF regional. Study due Nov 2026." },
                { office:"Denver Regional Office",  exp:"Sep 2027", status:"PLANNING",    col:C.orange, action:"Market survey initiated. RLP to GSA by Q2 FY2027." },
                { office:"Chicago Regional Office", exp:"Sep 2028", status:"MONITORING",  col:C.green,  action:"Begin 24-month planning by Sep 2026. On schedule." },
                { office:"Northeast — NY",          exp:"Mar 2028", status:"MONITORING",  col:C.green,  action:"Space reduction analysis complete. Renewal with reduced footprint." },
                { office:"Philadelphia Regional",   exp:"Sep 2029", status:"NO ACTION",   col:C.muted,  action:"Outside 24-month window. Review in FY2028 cycle." },
              ].map((r,i) => (
                <div key={i} style={{ background:C.dim+"33", borderRadius:8, padding:"14px",
                                       borderLeft:`3px solid ${r.col}` }}>
                  <div style={{ fontSize:13, fontWeight:700, color:C.text, marginBottom:4 }}>{r.office}</div>
                  <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:6 }}>
                    <span style={{ fontSize:11, color:C.muted, fontFamily:"monospace" }}>Exp: {r.exp}</span>
                    <OSOBadge label={r.status}
                      color={r.status==="IN PROGRESS"?"gold":r.status==="PLANNING"?"orange":r.status==="MONITORING"?"green":"gray"}
                      small C={C} />
                  </div>
                  <div style={{ fontSize:12, color:C.muted, lineHeight:1.55 }}>{r.action}</div>
                </div>
              ))}
            </div>
          </OSOCard>
        </div>
      )}

      {activeTab==="fleet" && (
        <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
          <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
            <OSOKPI label="Available"   value={fleetAvail}  sub="Ready for dispatch"           color={C.green}  C={C} />
            <OSOKPI label="In Use"      value={fleetInUse}  sub="Currently dispatched"         color={C.blue}   C={C} />
            <OSOKPI label="Maintenance" value={fleetMaint}  sub="Scheduled / unscheduled"      color={C.gold}   C={C} />
            <OSOKPI label="Hybrid + EV" value={hybridEV}    sub={`${Math.round(hybridEV/FLEET.length*100)}% - E.O. 14008`} color={C.green} C={C} />
            <OSOKPI label="Avg Mileage" value={Math.round(FLEET.reduce((s,v)=>s+v.mileage,0)/FLEET.length).toLocaleString()} sub="Per vehicle" color={C.cyan} C={C} />
          </div>

          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            {["ALL","AVAILABLE","IN USE","MAINTENANCE","HYBRID","ELECTRIC","GAS"].map(f => (
              <button key={f} onClick={() => setFleetFilter(f)}
                style={{ background: fleetFilter===f ? C.blue : C.dim+"44",
                          color: fleetFilter===f ? "#fff" : C.muted, border:"none",
                          borderRadius:20, padding:"5px 14px", fontSize:12, fontWeight:700, cursor:"pointer" }}>
                {f}
              </button>
            ))}
          </div>

          <OSOCard style={{ padding:0 }} C={C}>
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse" }}>
                <thead>
                  <tr>
                    <OSOTh C={C}>Veh ID</OSOTh><OSOTh C={C}>Plate</OSOTh>
                    <OSOTh C={C}>Make / Model</OSOTh><OSOTh C={C}>Yr</OSOTh>
                    <OSOTh C={C}>Region</OSOTh><OSOTh C={C}>Assignment</OSOTh>
                    <OSOTh right C={C}>Mileage</OSOTh><OSOTh C={C}>Fuel</OSOTh>
                    <OSOTh C={C}>Next PM</OSOTh><OSOTh C={C}>Status</OSOTh>
                  </tr>
                </thead>
                <tbody>
                  {visibleFleet.map((v,i) => (
                    <tr key={i} style={{ background:
                      v.status==="MAINTENANCE"?C.goldBg:
                      v.status==="IN USE"?C.greenBg:
                      i%2===0?C.card:C.dim+"22" }}>
                      <OSOTd mono C={C}>{v.id}</OSOTd>
                      <OSOTd mono bold C={C}>{v.plate}</OSOTd>
                      <OSOTd C={C}>{v.make}</OSOTd>
                      <OSOTd mono C={C}>{v.year}</OSOTd>
                      <OSOTd C={C}><div style={{ fontSize:12 }}>{v.region}</div></OSOTd>
                      <OSOTd C={C}><div style={{ fontSize:12 }}>{v.assignment}</div></OSOTd>
                      <OSOTd right mono C={C}>{v.mileage.toLocaleString()}</OSOTd>
                      <OSOTd C={C}>
                        <OSOBadge label={v.fuel}
                          color={v.fuel==="ELECTRIC"?"green":v.fuel==="HYBRID"?"cyan":"gray"}
                          small C={C} />
                      </OSOTd>
                      <OSOTd C={C}>
                        <span style={{ fontSize:12, fontFamily:"monospace",
                                        color: new Date(v.nextPM)<new Date(Date.now()+30*86400000)?C.gold:C.muted }}>
                          {v.nextPM}
                        </span>
                      </OSOTd>
                      <OSOTd C={C}>
                        <OSOBadge label={v.status}
                          color={v.status==="AVAILABLE"?"green":v.status==="IN USE"?"blue":"gold"}
                          small C={C} />
                      </OSOTd>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </OSOCard>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
            <OSOCard C={C}>
              <SH title="Fleet by Fuel Type" sub="E.O. 14008 — Federal fleet electrification mandate" C={C} />
              {[
                { type:"Hybrid",   count:FLEET.filter(v=>v.fuel==="HYBRID").length,   color:C.blue  },
                { type:"Electric", count:FLEET.filter(v=>v.fuel==="ELECTRIC").length, color:C.green },
                { type:"Gas",      count:FLEET.filter(v=>v.fuel==="GAS").length,      color:C.muted },
              ].map((r,i) => {
                const pct = r.count/FLEET.length*100;
                return (
                  <div key={i} style={{ marginBottom:14 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                      <span style={{ fontSize:13, color:C.text }}>{r.type}</span>
                      <span style={{ fontSize:12, color:r.color, fontFamily:"monospace", fontWeight:700 }}>
                        {r.count} vehicles ({pct.toFixed(0)}%)
                      </span>
                    </div>
                    <div style={{ background:C.dim+"44", borderRadius:3, height:7 }}>
                      <div style={{ width:`${pct}%`, height:"100%", background:r.color, borderRadius:3 }} />
                    </div>
                  </div>
                );
              })}
              <div style={{ background:C.greenBg, border:`1px solid ${C.green}44`, borderRadius:6,
                             padding:"8px 12px", fontSize:12, color:C.green, marginTop:6 }}>
                {Math.round(hybridEV/FLEET.length*100)}% Hybrid/EV — meets E.O. 14008 federal green fleet targets.
                Vehicle lifecycle managed via GSA Fleet.
              </div>
            </OSOCard>

            <OSOCard C={C}>
              <SH title="GSA Fleet Policy Reference" sub="Federal Fleet Management compliance requirements" C={C} />
              {[
                { icon:"🔑", title:"GSA Fleet Program",      body:"SEC vehicles procured and managed through GSA Fleet. Annual reporting via FAST (Federal Automotive Statistical Tool)." },
                { icon:"🛢️", title:"WEX Fuel Card",          body:"GSA WEX card issued per vehicle. Transactions monitored monthly for misuse. Personal use is a reportable offense." },
                { icon:"⚡", title:"E.O. 14008 ZEV Targets", body:"Federal agencies must maximize zero-emission vehicle acquisitions. OSO tracks EV/hybrid ratio each replacement cycle." },
                { icon:"🔧", title:"Preventive Maintenance",  body:"PM per GSA mileage intervals. Overdue PM reported. OSBO-FO coordinates with GSA fleet service centers." },
                { icon:"📊", title:"FAST Annual Report",      body:"Fleet usage, fuel cost, and mileage data compiled by OSO and submitted annually to GSA/DOE." },
                { icon:"🚨", title:"Accident / Misuse",       body:"Any incident reported to OSBO-FO within 24 hrs. Insurance through GSA. OIG notified if misuse confirmed." },
              ].map((r,i) => (
                <div key={i} style={{ display:"flex", gap:12, padding:"9px 0",
                                       borderBottom:i<5?`1px solid ${C.border}22`:"none" }}>
                  <span style={{ fontSize:18, flexShrink:0 }}>{r.icon}</span>
                  <div>
                    <div style={{ fontSize:13, fontWeight:700, color:C.text, marginBottom:2 }}>{r.title}</div>
                    <div style={{ fontSize:12, color:C.muted, lineHeight:1.5 }}>{r.body}</div>
                  </div>
                </div>
              ))}
            </OSOCard>
          </div>
        </div>
      )}
    </div>
  );
}

export { OSOBadge, OSOKPI, OSOCard, SH, OSOTh, OSOTd, BurnBar, OSOModal, OSOToggleTheme, PageDashboard, PageSystems, PageOFM, PageStakeholders, PageSOPs, PageActions, PageBudget, PageCOR, PageGPC, PageTime, OSOPageFormulation, OSOPageOIG, PageBriefs, PagePayroll, PageTravel, PageFacilityFleet };
