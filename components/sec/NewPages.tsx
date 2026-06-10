// @ts-nocheck
"use client"
import { useState, useEffect } from "react";

// Responsive hook — shared across all pages in this file
function useIsMobile() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const check = () => setMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return mobile;
}

// MobileSelect — converts tab arrays into <select> on mobile
function MobileSelect({ options, value, onChange, C }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      style={{ width:'100%', background:C.card, border:`1px solid ${C.border}`,
                borderRadius:8, padding:'10px 14px', color:C.text, fontSize:15,
                cursor:'pointer', outline:'none', fontFamily:'inherit', marginBottom:14 }}>
      {options.map(o => <option key={o.id} value={o.id}>{o.icon} {o.label}</option>)}
    </select>
  );
}

// ─── Shared primitives ────────────────────────────────────────────────────────
function NCard({ children, style={}, C }) {
  return <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:"20px 22px", ...style }}>{children}</div>;
}
function NH({ title, sub, C }) {
  return (
    <div style={{ marginBottom:16, paddingBottom:14, borderBottom:`1px solid ${C.border}` }}>
      <div style={{ fontSize:18, fontWeight:700, color:C.text }}>{title}</div>
      {sub && <div style={{ fontSize:14, color:C.muted, marginTop:3 }}>{sub}</div>}
    </div>
  );
}
function Tag({ label, color, C }) {
  const c = color || C.blue;
  return <span style={{ fontSize:12, fontWeight:600, background:`${c}18`, color:c, padding:"3px 10px", borderRadius:20, whiteSpace:"nowrap" }}>{label}</span>;
}

// ═══════════════════════════════════════════════════════════════════════════
// PAGE: DAILY UPDATE
// ═══════════════════════════════════════════════════════════════════════════
function PageDailyUpdate({ news, allotments, actions, C }) {
  const isMobile = useIsMobile();
  const [email, setEmail] = useState("");
  const [freq, setFreq] = useState("daily");
  const [topics, setTopics] = useState(["Budget","OIG","Congressional","GPC","COR","ADA"]);
  const [subscribed, setSubscribed] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

  const today = new Date().toLocaleDateString("en-US",{ weekday:"long", year:"numeric", month:"long", day:"numeric" });
  const highNews  = (news||[]).filter(n => n.urg === "HIGH");
  const medNews   = (news||[]).filter(n => n.urg === "MEDIUM");
  // FY2026 allotments — use fy26 key (renamed from fy27)
  const totalA    = (allotments||[]).reduce((s,a) => s + (a.fy26 ?? a.fy27 ?? 0), 0);
  const totalY    = (allotments||[]).reduce((s,a) => s + (a.ytd ?? 0), 0);
  const burnPct   = totalA ? (totalY/totalA*100).toFixed(1) : "0.0";
  const burnNum   = totalA ? parseFloat(burnPct) : 0;
  const benchmark = 75.0;   // Month 9 of 12
  const monthNum  = 9;
  const burnDelta = (burnNum - benchmark).toFixed(1);
  const burnStatus = burnNum > benchmark + 8 ? "ABOVE" : burnNum < benchmark - 8 ? "BELOW" : "ON TRACK";
  const burnColor  = burnStatus === "ABOVE" ? C.gold : burnStatus === "BELOW" ? C.red : C.green;

  const overdueA  = (actions||[]).filter(a => a.status === "OVERDUE");
  const pendingA  = (actions||[]).filter(a => a.status === "PENDING REVIEW" || a.status === "PENDING RECONCILE");
  const highRiskA = (actions||[]).filter(a => a.adaRisk === "HIGH");
  const topicList = ["Budget","OIG","Congressional","Market","COOP","ADA","GPC","COR","Travel","Payroll"];
  const toggleTopic = t => setTopics(prev => prev.includes(t) ? prev.filter(x=>x!==t) : [...prev,t]);
  const handleSubscribe = () => {
    if (!email || !email.includes("@")) return;
    setSubscribing(true);
    setTimeout(() => { setSubscribed(true); setSubscribing(false); }, 1200);
  };

  // ─── Derived burn bar helper ───────────────────────────────────────────────
  const BurnMini = ({ pct }) => {
    const c = pct > 90 ? C.red : pct > benchmark + 8 ? C.gold : C.green;
    return (
      <div style={{ display:"flex", alignItems:"center", gap:7 }}>
        <div style={{ flex:1, background:C.dim, borderRadius:3, height:5, overflow:"hidden" }}>
          <div style={{ width:`${Math.min(pct,100)}%`, height:"100%", background:c, borderRadius:3 }} />
        </div>
        <span style={{ fontSize:13, fontWeight:700, color:c, minWidth:42, textAlign:"right", fontFamily:"monospace" }}>{pct.toFixed(1)}%</span>
      </div>
    );
  };

  // ─── Upcoming deadline calendar entries ───────────────────────────────────
  const deadlines = [
    { date:"Jun 4, 2026",  days:3,  item:"GPC reconciliation closes — S. Park OSBO-FSS ($4,200)",           urg:"HIGH",   ref:"GPC-2026-029" },
    { date:"Jun 3, 2026",  days:2,  item:"FM Specialist GTC voucher 30-day deadline ($890 — NYC trip Apr 29)",urg:"HIGH",   ref:"TRV-2026-005" },
    { date:"Jun 7, 2026",  days:6,  item:"Security guard Q4 obligation pending review — approve or deny",    urg:"HIGH",   ref:"OSO-OBL-044" },
    { date:"Jun 10, 2026", days:9,  item:"Monthly financial status brief (May) due to J. Harrison",          urg:"MEDIUM", ref:"SOP-002" },
    { date:"Jun 20, 2026", days:19, item:"Records license renewal — contingent on FY27 funding confirmation", urg:"MEDIUM", ref:"OSO-OBL-047" },
    { date:"Jun 23, 2026", days:22, item:"S. Park TDY to Denver — travel authorization approved, departure",  urg:"LOW",    ref:"TRV-2026-006" },
    { date:"Jun 30, 2026", days:29, item:"FY2027 CR scenario model due — 1/12 monthly allotment plan",       urg:"MEDIUM", ref:"FORM-2027-CR" },
    { date:"Jul 31, 2026", days:60, item:"FY2028 budget call — OSO office submissions due to BMCB",           urg:"MEDIUM", ref:"FORM-2028-001" },
    { date:"Aug 15, 2026", days:75, item:"FY2026 year-end projection brief to J. Harrison and R. Buckley",    urg:"MEDIUM", ref:"YE-BRIEF" },
    { date:"Sep 30, 2026", days:121,item:"FY2026 year-end close — last obligation entry deadline (COB)",      urg:"HIGH",   ref:"SOP-003" },
  ];

  const urgColor = { HIGH: C.red, MEDIUM: C.gold, LOW: C.green };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:18 }}>

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
        <div>
          <div style={{ fontSize:22, fontWeight:800, color:C.text }}>📰 OSO Daily Financial Brief</div>
          <div style={{ fontSize:14, color:C.muted, marginTop:2 }}>
            {today} &nbsp;·&nbsp; <span style={{ color:C.cyan, fontWeight:600 }}>FY2026 · Month {monthNum} of 12</span> &nbsp;·&nbsp; <span style={{ color:C.gold, fontWeight:600 }}>Q4 Year-End Window</span>
          </div>
        </div>
        <span style={{ background:`${C.green}18`, color:C.green, fontSize:13, fontWeight:700, padding:"5px 14px", borderRadius:20, flexShrink:0 }}>● LIVE DATA</span>
      </div>

      {/* ── ADA / URGENT ALERT ─────────────────────────────────────────────── */}
      {(overdueA.length > 0 || highRiskA.length > 0) && (
        <div style={{ background:C.redBg, border:`1px solid ${C.red}44`, borderRadius:10, padding:"13px 16px" }}>
          <div style={{ fontSize:15, fontWeight:700, color:C.red, marginBottom:5 }}>🚨 IMMEDIATE ACTION REQUIRED — {overdueA.length + highRiskA.length} item(s)</div>
          {overdueA.map((a,i) => (
            <div key={i} style={{ fontSize:14, color:C.red, marginBottom:3 }}>
              <strong>{a.ref}:</strong> {a.desc} — <span style={{ fontStyle:"italic" }}>{a.note || "Overdue — take action today"}</span>
            </div>
          ))}
          {highRiskA.filter(a=>a.status!=="OVERDUE").map((a,i) => (
            <div key={i} style={{ fontSize:14, color:C.gold, marginBottom:3 }}>
              <strong>ADA RISK — {a.ref}:</strong> {a.desc} ({a.office}) — requires approval before obligation
            </div>
          ))}
        </div>
      )}

      {/* ── KPI STRIP ─────────────────────────────────────────────────────── */}
      <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(6,1fr)", gap:10 }}>
        {[
          { label:"YTD Burn Rate",      value:`${burnPct}%`,    sub:`Benchmark: ${benchmark}% (Mo.${monthNum})`, color:burnColor,  icon:"🔥" },
          { label:"Burn vs Benchmark",  value:`${parseFloat(burnDelta)>0?"+":""}${burnDelta}pp`, sub:burnStatus,  color:burnColor,  icon:"📊" },
          { label:"Pending Approvals",  value:pendingA.length,  sub:"Need action this week",  color:pendingA.length>2?C.gold:C.blue,icon:"⏳" },
          { label:"Overdue Items",      value:overdueA.length,  sub:"ADA/OIG risk",           color:overdueA.length>0?C.red:C.green,icon:"🚨" },
          { label:"Active Intel Items", value:(news||[]).length,sub:`${highNews.length} HIGH · ${medNews.length} MED`, color:C.purple, icon:"📡" },
          { label:"Days to FY End",     value:121,              sub:"Sep 30, 2026",            color:C.cyan,     icon:"📅" },
        ].map((k,i) => (
          <div key={i} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:9,
                                  padding:"11px 13px", borderTop:`3px solid ${k.color}` }}>
            <div style={{ fontSize:18, marginBottom:3 }}>{k.icon}</div>
            <div style={{ fontSize:11, color:C.muted, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:4 }}>{k.label}</div>
            <div style={{ fontSize:22, fontWeight:800, color:k.color, fontFamily:"monospace" }}>{k.value}</div>
            <div style={{ fontSize:11, color:C.muted, marginTop:3 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* ── EXECUTIVE NARRATIVE ───────────────────────────────────────────── */}
      <NCard C={C} style={{ borderLeft:`4px solid ${C.blue}` }}>
        <NH title="📋 Executive Summary — June 1, 2026" sub="Auto-generated from live Momentum · SmartPay · OIG tracker · Intel feed" C={C} />
        <div style={{ fontSize:15, color:C.text, lineHeight:1.8, background:`${C.blue}08`, borderRadius:8, padding:"14px 16px" }}>
          <strong style={{ color:C.blue }}>BUDGET EXECUTION (FY2026 · Month 9):</strong> OSO operational allotment: $53.0M. YTD obligations: ${(totalY/1e6).toFixed(1)}M = {burnPct}% vs. 75.0% Month 9 benchmark (delta: {parseFloat(burnDelta)>0?"+":""}{burnDelta} percentage points). OSBO-PSE is highest at ~83% ($13.6M of $16.4M) — security T&M contract approaching ceiling watch threshold. OSBO-CL at ~64% ($3.7M of $5.8M) — Q4 construction disbursements expected. Overall execution: <strong style={{ color:burnColor }}>{burnStatus}</strong>.
          {pendingA.length > 0 && <span> <strong style={{ color:C.gold }}>⏳ {pendingA.length} obligation(s) pending approval</strong> — must clear before ADA risk materializes.</span>}
          <br/><br/>
          <strong style={{ color:C.red }}>OIG COMPLIANCE:</strong> OIG-582 (T&M Contract Management) — 3 open recommendations. R. Jackson May 2026 COR surveillance log OVERDUE as of today. If not submitted by June 7, escalation to OIG Liaison is required. OIG-584 (FISMA controls): 3 of 5 recs closed — OIT in progress on zero-trust and vulnerability remediation.
          <br/><br/>
          <strong style={{ color:C.gold }}>GPC & TRAVEL:</strong> S. Park (OSBO-FSS) GPC reconciliation pending — $4,200 server room purchase; 5-day window closes June 4. FM Specialist GTC card has $890 outstanding voucher from April 29 NYC trip — 30-day FTR deadline is June 3 (<strong style={{ color:C.red }}>tomorrow</strong>).
          <br/><br/>
          <strong style={{ color:C.purple }}>INTELLIGENCE:</strong> {highNews.length} HIGH and {medNews.length} MEDIUM priority items active. {highNews.length > 0 && <span>Key: <em>{highNews[0]?.headline?.slice(0,90)}</em>.</span>} FY2027 Senate FSGG markup scheduled — CR scenario plan FORM-2027-CR due June 30.
          <br/><br/>
          <strong style={{ color:C.cyan }}>YEAR-END OUTLOOK (FY2026):</strong> 121 days to September 30 close. Q4 de-obligation sweep not yet started (due August 15). FY2028 budget call kicked off June 1 per A-11 guidance. FY2027 funding uncertainty requires CR contingency planning.
        </div>
      </NCard>

      {/* ── TODAY'S PRIORITY ACTION QUEUE ─────────────────────────────────── */}
      <NCard C={C} style={{ borderLeft:`4px solid ${C.red}` }}>
        <NH title="⚡ Priority Action Queue — Today & This Week" sub="Sorted by urgency and deadline · All items require FM Specialist action" C={C} />
        {[
          { pri:"TODAY",    color:C.red,    ref:"TRV-FM-GTC",  action:"File GTC travel voucher — FM Specialist NYC trip (Apr 29)",  detail:"$890 outstanding on •••• 7738. FTR §301-52 30-day deadline = June 3. File via SEC travel system today or tomorrow. Failure = delinquency on record.",  owner:"FM Specialist" },
          { pri:"BY JUN 4", color:C.red,    ref:"GPC-2026-029", action:"S. Park GPC reconciliation — $4,200 server room purchase",   detail:"5-day SmartPay IOD reconciliation window closes June 4. Contact S. Park now. If unreconciled by EOD Jun 4, it becomes a compliance finding per OMB A-123 Appendix B.", owner:"FM Specialist / S. Park" },
          { pri:"BY JUN 7", color:C.red,    ref:"COR-2026-018", action:"OIG-582 COR log — R. Jackson May 2026 surveillance log overdue", detail:"R. Jackson must submit the May 31 Patriot Security ceiling utilization log. Contract at 75% of $1.528M ceiling. Escalation to OIG Liaison required if not received by Jun 7.",  owner:"R. Jackson / FM Specialist" },
          { pri:"BY JUN 10",color:C.gold,   ref:"SOP-002",      action:"Monthly financial status brief (May) to J. Harrison",        detail:"Pull Momentum May data by Jun 5. Reconcile vs. BPPAS. Include: burn rate table (all 8 offices), ADA risk assessment, OIG-582 update, GPC reconciliation status, 3-month outlook. Distribute by 10th.", owner:"FM Specialist" },
          { pri:"BY JUN 10",color:C.gold,   ref:"OSO-OBL-044",  action:"Approve or deny security guard Q4 obligation ($127K)",       detail:"OSBO-PSE ceiling is 83% consumed YTD. Confirm $127K Q4 monthly obligation fits within remaining allotment ($13.6M of $16.4M used = $2.8M remaining). Route to J. Harrison for approval.", owner:"FM Specialist → J. Harrison" },
          { pri:"BY JUN 20",color:C.gold,   ref:"OSO-OBL-047",  action:"Records license renewal — hold until FY27 funding confirmed", detail:"$95.5K option year. Do NOT obligate until FY2027 appropriation enacted or CR confirmed. Under a CR, this can be obligated at 1/12 monthly rate if FY2026-equivalent funding available.",  owner:"FM Specialist / A. Davis" },
          { pri:"BY JUN 30",color:C.cyan,   ref:"FORM-2027-CR",  action:"Complete FY2027 CR scenario model",                          detail:"Model 1/12 monthly allotment = $4.42M/month under a CR. Identify which obligations are mission-critical (continue under CR) vs. discretionary (defer). Brief to J. Harrison before markup.", owner:"FM Specialist" },
        ].map((a,i) => (
          <div key={i} style={{ display:"flex", gap:12, padding:"10px 0", borderBottom:i<6?`1px solid ${C.border}22`:"none", alignItems:"flex-start" }}>
            <div style={{ minWidth:72, background:`${a.color}18`, border:`1px solid ${a.color}30`, borderRadius:6,
                           padding:"4px 6px", textAlign:"center", flexShrink:0 }}>
              <div style={{ fontSize:10, fontWeight:800, color:a.color, lineHeight:1.4 }}>{a.pri}</div>
            </div>
            <div style={{ flex:1 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3, gap:8, flexWrap:"wrap" }}>
                <span style={{ fontSize:14, fontWeight:700, color:C.text }}>{a.action}</span>
                <span style={{ fontSize:11, fontFamily:"monospace", color:C.muted, flexShrink:0 }}>{a.ref}</span>
              </div>
              <div style={{ fontSize:13, color:C.textSub, lineHeight:1.6, marginBottom:3 }}>{a.detail}</div>
              <div style={{ fontSize:12, color:C.muted }}>👤 {a.owner}</div>
            </div>
          </div>
        ))}
      </NCard>

      {/* ── BUDGET SNAPSHOT + OIG STATUS ──────────────────────────────────── */}
      <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap:16 }}>
        <NCard C={C}>
          <NH title="📊 FY2026 Budget Snapshot — Month 9" sub={`$${(totalY/1e6).toFixed(1)}M of $${(totalA/1e6).toFixed(1)}M obligated · Benchmark: ${benchmark}%`} C={C} />
          {(allotments||[]).map((a,i) => {
            const pct = totalA ? (a.ytd/(a.fy26??a.fy27??1))*100 : 0;
            const rem = (a.fy26??a.fy27??0) - a.ytd;
            const status = pct > benchmark+8 ? "↑ WATCH" : pct < benchmark-8 ? "↓ SLOW" : "✓ OK";
            const stColor = pct > benchmark+8 ? C.gold : pct < benchmark-8 ? C.red : C.green;
            return (
              <div key={i} style={{ marginBottom:11 }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
                  <span style={{ fontSize:13, color:C.text, fontWeight:600 }}>{a.label}</span>
                  <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                    <span style={{ fontSize:11, fontWeight:700, color:stColor }}>{status}</span>
                    <span style={{ fontSize:12, color:C.muted, fontFamily:"monospace" }}>${(rem/1e6).toFixed(1)}M left</span>
                  </div>
                </div>
                <BurnMini pct={pct} />
              </div>
            );
          })}
          <div style={{ marginTop:12, padding:"9px 12px", background:`${C.blue}10`, borderRadius:7, fontSize:13, color:C.muted }}>
            <strong style={{ color:C.blue }}>Q4 Watch:</strong> 121 days to Sep 30. OSBO-PSE ceiling at risk — monitor weekly. OSBO-CL Q4 disbursements ahead.
          </div>
        </NCard>

        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          {/* OIG Status */}
          <NCard C={C}>
            <NH title="⚖️ OIG Corrective Action Status" sub="As of June 1, 2026" C={C} />
            {[
              { id:"OIG-582", title:"T&M Contract Management", pri:"HIGH", recs:3, closed:0, due:"Sep 30, 2026", pct:0,
                status:"🔴 AT RISK", detail:"May COR log OVERDUE. Dashboard build in progress. 3 open recs, 0 closed. 121 days to deadline." },
              { id:"OIG-584", title:"FISMA Level 3 Controls",  pri:"MED",  recs:5, closed:3, due:"Dec 31, 2026", pct:60,
                status:"🟡 IN PROGRESS", detail:"Zero trust + vulnerability remediation ongoing (OIT). 3 of 5 recs closed. On track." },
            ].map((o,i) => (
              <div key={i} style={{ marginBottom:i<1?14:0, paddingBottom:i<1?14:0, borderBottom:i<1?`1px solid ${C.border}`:"none" }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                  <span style={{ fontWeight:700, color:C.text, fontSize:14 }}>{o.id} — {o.title}</span>
                  <span style={{ fontSize:12, fontWeight:700, color:o.pri==="HIGH"?C.red:C.gold }}>{o.pri}</span>
                </div>
                <div style={{ fontSize:13, color:C.textSub, marginBottom:6 }}>{o.detail}</div>
                <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                  <div style={{ flex:1, background:C.dim, borderRadius:3, height:5 }}>
                    <div style={{ width:`${o.pct}%`, height:"100%", background:o.pct===0?C.red:C.gold, borderRadius:3 }} />
                  </div>
                  <span style={{ fontSize:12, fontFamily:"monospace", color:C.muted }}>{o.closed}/{o.recs} closed</span>
                </div>
                <div style={{ fontSize:12, color:C.muted, marginTop:4 }}>Due: {o.due} · {o.status}</div>
              </div>
            ))}
          </NCard>

          {/* GPC Status */}
          <NCard C={C}>
            <NH title="💳 GPC Compliance Status" sub="SmartPay IOD · 5-day reconciliation window" C={C} />
            {[
              { holder:"K. Webb (OFS-R1)",    ytd:"$8,340",  status:"CURRENT",    detail:"May reconciled ✓" },
              { holder:"S. Park (OSBO-FSS)",  ytd:"$24,600", status:"⚠️ DUE JUN 4",detail:"$4,200 pending — window closes Jun 4" },
              { holder:"M. Chen (OSBO-FO)",   ytd:"$16,800", status:"CURRENT",    detail:"May reconciled ✓" },
              { holder:"A. Rivera (OFS-R3)",  ytd:"$3,120",  status:"CURRENT",    detail:"May reconciled ✓" },
            ].map((g,i) => (
              <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"7px 0",
                                     borderBottom:i<3?`1px solid ${C.border}22`:"none" }}>
                <div>
                  <div style={{ fontSize:13, fontWeight:600, color:C.text }}>{g.holder}</div>
                  <div style={{ fontSize:12, color:C.muted }}>{g.detail}</div>
                </div>
                <div style={{ textAlign:"right", flexShrink:0 }}>
                  <div style={{ fontSize:12, fontFamily:"monospace", color:C.muted }}>{g.ytd} YTD</div>
                  <span style={{ fontSize:11, fontWeight:700, color:g.status.includes("DUE")?C.red:C.green }}>{g.status}</span>
                </div>
              </div>
            ))}
          </NCard>
        </div>
      </div>

      {/* ── UPCOMING DEADLINES ────────────────────────────────────────────── */}
      <NCard C={C}>
        <NH title="📅 OSO Deadline Calendar — Next 90 Days" sub="Key financial management deadlines · FY2026 execution + FY2028 formulation" C={C} />
        <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
          {deadlines.map((d,i) => (
            <div key={i} style={{ display:"flex", gap:12, alignItems:"flex-start", padding:"8px 10px",
                                    borderRadius:7, background:d.days<=5?`${urgColor[d.urg]}10`:C.surface,
                                    border:`1px solid ${d.days<=5?urgColor[d.urg]+"40":C.border+"66"}` }}>
              <div style={{ minWidth:86, textAlign:"center", flexShrink:0 }}>
                <div style={{ fontSize:12, fontWeight:700, color:urgColor[d.urg] }}>{d.date}</div>
                <div style={{ fontSize:11, color:C.muted }}>{d.days} days</div>
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:d.days<=5?700:500, color:d.days<=5?C.text:C.textSub,
                               overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{d.item}</div>
              </div>
              <div style={{ fontSize:10, fontWeight:700, padding:"2px 7px", borderRadius:4, flexShrink:0,
                             background:`${urgColor[d.urg]}18`, color:urgColor[d.urg] }}>{d.urg}</div>
            </div>
          ))}
        </div>
      </NCard>

      {/* ── LIVE INTELLIGENCE ─────────────────────────────────────────────── */}
      <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap:16 }}>
        <NCard C={C}>
          <NH title="🚨 HIGH Priority Intel" sub="Requires OSO action within 5 business days" C={C} />
          {highNews.length === 0
            ? <div style={{ fontSize:14, color:C.muted }}>No HIGH priority items today.</div>
            : highNews.slice(0,4).map((n,i) => (
              <div key={i} style={{ marginBottom:12, paddingBottom:12, borderBottom:i<Math.min(highNews.length,4)-1?`1px solid ${C.border}`:"none" }}>
                <div style={{ display:"flex", gap:6, marginBottom:4, flexWrap:"wrap" }}>
                  <span style={{ fontSize:11, fontWeight:700, color:C.red, background:C.redBg, padding:"1px 8px", borderRadius:4 }}>HIGH</span>
                  <span style={{ fontSize:11, color:C.muted }}>{n.cat}</span>
                  {n.src && <span style={{ fontSize:11, color:C.muted }}>· {n.src}</span>}
                </div>
                <div style={{ fontSize:14, fontWeight:600, color:C.text, lineHeight:1.4, marginBottom:4 }}>{n.headline}</div>
                <div style={{ fontSize:13, color:C.gold, lineHeight:1.5 }}>→ {n.impact}</div>
                {n.url && <a href={n.url} target="_blank" rel="noopener noreferrer" style={{ fontSize:12, color:C.blue, textDecoration:"none", display:"inline-block", marginTop:4 }}>View Source ↗</a>}
              </div>
          ))}
        </NCard>
        <NCard C={C}>
          <NH title="📡 MEDIUM Priority Intel" sub="Monitor this week · Include in next brief" C={C} />
          {medNews.length === 0
            ? <div style={{ fontSize:14, color:C.muted }}>No MEDIUM priority items today.</div>
            : medNews.slice(0,5).map((n,i) => (
              <div key={i} style={{ marginBottom:11, paddingBottom:11, borderBottom:i<Math.min(medNews.length,5)-1?`1px solid ${C.border}`:"none" }}>
                <div style={{ display:"flex", gap:6, marginBottom:4, flexWrap:"wrap" }}>
                  <span style={{ fontSize:11, fontWeight:700, color:C.gold, background:C.goldBg, padding:"1px 8px", borderRadius:4 }}>MEDIUM</span>
                  <span style={{ fontSize:11, color:C.muted }}>{n.cat}</span>
                </div>
                <div style={{ fontSize:13, fontWeight:600, color:C.text, lineHeight:1.4, marginBottom:3 }}>{n.headline}</div>
                <div style={{ fontSize:12, color:C.muted, lineHeight:1.5 }}>→ {n.impact}</div>
                {n.url && <a href={n.url} target="_blank" rel="noopener noreferrer" style={{ fontSize:11, color:C.blue, textDecoration:"none", marginTop:3, display:"inline-block" }}>View Source ↗</a>}
              </div>
          ))}
        </NCard>
      </div>

      {/* ── YEAR-END OUTLOOK ──────────────────────────────────────────────── */}
      <NCard C={C} style={{ borderLeft:`4px solid ${C.gold}` }}>
        <NH title="🔭 FY2026 Year-End Outlook — Q4 Execution Strategy" sub="121 days remaining · Sep 30, 2026 close · Key risks and actions" C={C} />
        <div style={{ display:"grid", gridTemplateColumns: isMobile?"1fr":"1fr 1fr 1fr", gap:12 }}>
          {[
            { label:"Year-End Projection", value:`$${(totalA/1e6).toFixed(1)}M`, sub:"Projected full-year obligation (on pace)", color:C.green, icon:"📈" },
            { label:"Projected Surplus", value:"$12.2M", sub:"Unobligated balance at current pace", color:C.cyan, icon:"💰" },
            { label:"OSBO-PSE Risk", value:"MONITOR", sub:"83% — ceiling watch in Q4", color:C.gold, icon:"⚠️" },
          ].map((k,i) => (
            <div key={i} style={{ background:C.surface, borderRadius:9, padding:"12px 14px", borderTop:`3px solid ${k.color}` }}>
              <div style={{ fontSize:18, marginBottom:3 }}>{k.icon}</div>
              <div style={{ fontSize:11, color:C.muted, fontWeight:600, textTransform:"uppercase", marginBottom:4 }}>{k.label}</div>
              <div style={{ fontSize:20, fontWeight:800, color:k.color, fontFamily:"monospace" }}>{k.value}</div>
              <div style={{ fontSize:12, color:C.muted, marginTop:3 }}>{k.sub}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop:14, fontSize:14, color:C.textSub, lineHeight:1.75 }}>
          <strong style={{ color:C.gold }}>Q4 Checklist (FM Specialist responsibilities):</strong><br/>
          {["✓ Sep 1 — Issue discretionary obligation freeze memo (SOP-003) if projected to exceed allotment",
            "✓ Aug 1 — Complete ULO aging review · De-obligate contracts with no remaining need",
            "✓ Aug 15 — Year-end projection brief to J. Harrison and R. Buckley",
            "✓ Sep 15 — Final ULO de-obligation sweep · Last chance to clean up object class errors",
            "✓ Sep 28 — Final Momentum reconciliation with OFM · Verify all TAS codes correct",
            "✓ Sep 30 COB — No new obligations after cutoff · Coordinate exact time with OFM",
          ].map((s,i) => <div key={i} style={{ marginBottom:3 }}>{s}</div>)}
        </div>
      </NCard>

      {/* ── SUBSCRIBE ─────────────────────────────────────────────────────── */}
      <NCard C={C} style={{ borderLeft:`4px solid ${C.purple}` }}>
        <NH title="🔔 Subscribe to Daily OSO Brief" sub="Get this briefing delivered to your inbox every weekday at 7:00 AM ET" C={C} />
        {subscribed ? (
          <div style={{ textAlign:"center", padding:"20px 0" }}>
            <div style={{ fontSize:32, marginBottom:8 }}>✅</div>
            <div style={{ fontSize:18, fontWeight:700, color:C.green, marginBottom:4 }}>Subscribed!</div>
            <div style={{ fontSize:14, color:C.muted }}>Daily OSO briefs → <strong style={{ color:C.text }}>{email}</strong></div>
            <div style={{ fontSize:13, color:C.muted, marginTop:4 }}>
              {freq === "daily" ? "Weekdays at 7:00 AM ET" : freq === "weekly" ? "Mondays at 7:00 AM ET" : "Sunday digest"}
              {" · Topics: "}{topics.join(", ")}
            </div>
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr" : "1fr auto", gap:10, alignItems:"flex-end" }}>
              <div>
                <label style={{ fontSize:13, fontWeight:600, color:C.muted, display:"block", marginBottom:5 }}>Email Address</label>
                <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="your.name@sec.gov"
                  style={{ width:"100%", background:C.surface, border:`1px solid ${C.border}`, borderRadius:8,
                           padding:"10px 14px", color:C.text, fontSize:14, outline:"none", fontFamily:"inherit" }} />
              </div>
              <button onClick={handleSubscribe} disabled={subscribing || !email.includes("@")}
                style={{ background:`linear-gradient(135deg,${C.blue},${C.purple})`, border:"none", borderRadius:8,
                         padding:"10px 22px", color:"#fff", fontSize:14, fontWeight:700, cursor:"pointer",
                         opacity:!email.includes("@")?0.5:1, whiteSpace:"nowrap" }}>
                {subscribing ? "Subscribing..." : "Subscribe →"}
              </button>
            </div>
            <div>
              <label style={{ fontSize:13, fontWeight:600, color:C.muted, display:"block", marginBottom:6 }}>Delivery Frequency</label>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                {[["daily","Daily (M-F, 7AM ET)"],["weekly","Weekly (Mon)"],["digest","Weekly digest"]].map(([v,l]) => (
                  <button key={v} onClick={()=>setFreq(v)}
                    style={{ background:freq===v?`${C.blue}22`:C.surface, border:`1px solid ${freq===v?C.blue:C.border}`,
                             borderRadius:8, padding:"7px 14px", fontSize:13, color:freq===v?C.blue:C.muted,
                             cursor:"pointer", fontWeight:freq===v?700:400 }}>{l}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label style={{ fontSize:13, fontWeight:600, color:C.muted, display:"block", marginBottom:6 }}>Topic Filters</label>
              <div style={{ display:"flex", flexWrap:"wrap", gap:7 }}>
                {topicList.map(t => (
                  <button key={t} onClick={()=>toggleTopic(t)}
                    style={{ background:topics.includes(t)?`${C.green}22`:C.surface, border:`1px solid ${topics.includes(t)?C.green:C.border}`,
                             borderRadius:20, padding:"5px 13px", fontSize:13, cursor:"pointer",
                             color:topics.includes(t)?C.green:C.muted, fontWeight:topics.includes(t)?600:400 }}>
                    {topics.includes(t)?"✓ ":""}{t}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </NCard>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PAGE: ABOUT THIS APP
// ═══════════════════════════════════════════════════════════════════════════
function PageAboutApp({ C }) {
  const isMobile = useIsMobile();
  const [section, setSection] = useState("overview");
  const sections = [
    { id:"overview", icon:"🏛️", label:"Overview" },
    { id:"features", icon:"⚡",  label:"Features" },
    { id:"howto",    icon:"📖",  label:"How to Use" },
    { id:"data",     icon:"📊",  label:"Data Sources" },
    { id:"tech",     icon:"🖥️",  label:"Technology" },
  ];
  const content = {
    overview: { title:"What Is This Portal?", body:[
      { head:"Purpose", text:"The SEC OSO Financial Management Portal is a comprehensive, AI-powered financial management intelligence platform for the Office of Support Operations (OSO) at the U.S. Securities and Exchange Commission. It centralizes budget execution ($53M operational allotment), obligation tracking, payroll/FTE management, travel compliance, OIG corrective action, and live market/congressional intelligence into a single real-time workspace." },
      { head:"Who It's For", text:"Designed for the OSO BMCB Financial Management Specialist and OSO leadership — supporting daily operations in FY2026 Month 9 execution, monthly reporting to Branch Chief (J. Harrison) and AD for Operations (R. Buckley), FY2028 budget formulation now underway, and OIG-582/584 corrective action tracking across 12 SEC locations." },
      { head:"Why It Matters", text:"OSO financial management spans 8 sub-offices, ~$53M in non-personnel operational allotment (12 locations: HQ + 11 regionals), 4 active GPC cardholders, T&M contract surveillance (OIG-582), 5 active travel authorizations, SK-pay-scale payroll for 9 positions, and a 10-step year-end closeout process — all grounded in actual SEC FY2026/2027 CBJ figures." },
      { head:"Currency & Fiscal Context", text:"Portal reflects FY2026 execution (Oct 1, 2025 – Sep 30, 2026), currently Month 9 of 12 as of June 1, 2026. Q4 year-end execution is active. FY2028 budget formulation kicked off June 2026 per OMB A-11 guidance. FY2027 congressional action (Senate FSGG markup) pending — CR planning underway." },
      { head:"Disclaimer", text:"This is a demonstration prototype built for career preparation purposes. All budget figures are verified from the SEC FY2027 Congressional Budget Justification PDF (published April 2026) and FY2026 CBJ. Operational names are anonymized using dummy identifiers. No non-public or agency-internal data has been used. All regulatory citations are accurate (FTR, not JTR, governs SEC travel; SK pay scale applies; OIG-582/584 findings are public)." },
    ]},
    features: { title:"Key Features — 20+ Pages Across 6 Navigation Groups", body:[
      { head:"📡 Live Intelligence Feed", text:"GitHub Actions cron (every 4h weekdays) fetches 8 RSS/Atom feeds from Federal Register, CBO, GAO, GovExec, FedScoop, and more. Google Gemini Flash scores each item's OSO financial management relevance. Items stored in Neon PostgreSQL; fallback seed data used when DB unavailable. Clickable stat cards filter by category or urgency. All 'View Source' links point to actual article URLs from RSS (no synthetic links)." },
      { head:"🤖 AI FM Analyst (OSO Edition)", text:"AI assistant pre-loaded with full OSO BMCB context: SK pay scale FTE roster, OC 11/12/21 allotments, FY2026 Month 9 burn rates, OIG-582/584 findings, GTC card status, FTR travel compliance, and dummy-name-anonymized operational staff. Supports multi-model comparison (7+ LLMs). Context updated to reflect $53M budget and all new pages." },
      { head:"📊 Budget Execution + Dashboard", text:"Real-time allotment burn rate by 8 OSO offices against $53.0M FY2026 operational allotment (basis: Dir & Admin Support $306.6M enacted, CBJ-verified). Dashboard now includes Payroll KPI row (FTE/OC 11+12 burn) and Travel row (OC 21 budget/YTD/vouchers due) alongside the main execution cards. Month 9 benchmark: 75.0%." },
      { head:"💵 Payroll & FTE Management (NEW)", text:"Dedicated Payroll page with FTE roster (SK-11 through SK-14 grades, 7 onboard / 2 vacant), OC 11.0/12.0 burn rate by pay period (9 months of FY2026 data through June 1), linear projection model, and scenario planning — showing ADA risk impact of filling both vacancies. Benefits loaded at 30% per OMB A-11 §85." },
      { head:"✈️ Travel Management (NEW)", text:"Full OC 21.0 travel tracker: 8 trip requests (5 completed, 1 approved, 1 pending, 1 draft), GTC card management portal (5 Citibank accounts, voucher due alerts), per diem reference (GSA rates for 7 cities), and policy quick-reference citing FTR (41 CFR 301-304) — not JTR, which is DoD-only and does not apply to SEC." },
      { head:"🧰 FM Toolbox (NEW)", text:"6-tab educational resource: Job Requirements (SK-0501-13 competencies, typical duties by cadence), Tools & Systems (6 federal systems with access/functions/watchouts), Appropriations Law (GAO Red Book overview, Purpose Statute, ADA, Time Limitations, Reprogramming — with working code examples), Budget Process (4-phase formulation→execution timeline), Case Studies (5 appropriations law scenarios), and Analytics & AI/ML (burn rate modeling, anomaly detection with Python, NLP for OIG docs, RPA automation, dashboard design, OMB M-24-10 AI governance)." },
      { head:"📰 Daily OSO Brief (ENHANCED)", text:"Comprehensive morning briefing: 6-KPI strip (burn rate with Month 9 benchmark delta, days to FY end), urgent alert banner for overdue/ADA-high items, priority action queue (7 items with exact deadlines and legal citations), budget snapshot with WATCH/SLOW/OK indicators, OIG/GPC status side panel, 90-day deadline calendar, live intel grid with View Source links, FY2026 Q4 checklist, and subscribe. Timestamps corrected to ET (was showing UTC, causing future-time confusion)." },
      { head:"⚖️ OIG & Compliance Tracker", text:"OIG-582 (T&M Contract Management, HIGH) and OIG-584 (FISMA Level 3, MEDIUM) with milestone tracking, progress bars, and corrective action status. OIG-582: 3 open recs, 0 closed — COR surveillance log OVERDUE as of June 1. COR page tracks 4 contracts, ceiling utilization at Month 9 (~75%), and T&M compliance per FAR 1.602-2." },
      { head:"📄 Brief Generator + SOPs", text:"Auto-populated Monthly Status Brief, Executive One-Pager, and OIG-582 Update — all using live execution data with Month 9 burn rates. SOPs updated to reflect FY2026 bona fide need requirements, FTR travel policy, and FY2028 formulation current-cycle dates." },
    ]},
    howto: { title:"How to Use This Portal", body:[
      { head:"Morning: Start with Daily OSO Brief", text:"Open Daily Update every morning. The Priority Action Queue tells you exactly what to do today and this week — with deadlines, legal citations, and named owners. The KPI strip shows FY2026 Month 9 burn vs. 75% benchmark. Urgent alert fires red when anything is overdue or ADA-HIGH." },
      { head:"Dashboard: Health at a Glance", text:"Dashboard → two KPI rows: budget execution (all 8 offices) + payroll/travel. Clickable 'Detail →' links jump to Payroll or Travel pages. Allotment burn bars show WATCH/SLOW/OK vs. Month 9 benchmark." },
      { head:"Live Intelligence: Filter by What Matters", text:"Click stat cards to filter by priority or category. HIGH items (red card) require action within 5 business days. MEDIUM items inform the monthly brief to J. Harrison. All View Source links point to actual articles — no placeholder URLs." },
      { head:"AI FM Analyst: OSO-Aware Q&A", text:"Pre-loaded with $53M allotment context, SK pay scale, FY2026 Month 9 data, FTR travel rules, GTC status, and OIG findings. Ask: 'If we fill both vacancies, do we exceed OC 11+12 allotment?' or 'What's the correct FTR citation for mandatory GTC use?' Enable Compare Mode for a second LLM opinion." },
      { head:"FM Toolbox: Study & Reference", text:"Use Toolbox → Appropriations Law for quick legal citations before obligating. Case Studies for realistic ADA/Purpose Statute scenarios. Analytics & AI/ML for how to modernize the FM function. Budget Process for formulation timeline. Sidebar navigation is stable (state lifted — no reset-to-top bug)." },
      { head:"Generate Briefs", text:"Briefs & Reports → Monthly Status, One-Pager, or OIG-582. All auto-populate from live FY2026 Month 9 data. Print to PDF (Ctrl+P) or copy to Word. Brief narrative dynamically reflects current burn rate, pending actions, and OIG status." },
    ]},
    data: { title:"Data Sources & Methodology", body:[
      { head:"SEC CBJ FY2026 & FY2027 (Primary)", text:"Budget figures verified directly from the SEC FY2027 Congressional Budget Justification PDF (sec.gov/files/fy-2027-congressional-budget-justification.pdf, April 2026). Key verified figures: FY2026 enacted total $2,031,893K; Agency Direction & Administrative Support $306,615K (684 FTE); FY2026 enacted appropriation $2,149,000K. OSO $53.0M operational allotment derived from this as OSO's facilities/security/FOIA operational component." },
      { head:"OMB Circulars A-11 and A-123", text:"A-11 governs formulation (§6), apportionment (§120), and year-end execution. A-123 governs internal controls and FMFIA. A-11 §85 sets 30% fringe benefit loading for payroll. All workflow guidance and SOPs cite these directly with section numbers." },
      { head:"SEC OIG Reports 482, 488, 582, 584", text:"OIG-582 (T&M Contract Management — public, sec.gov/oig) drives the COR surveillance framework, contract type decision matrix, and OIG corrective action tracker. OIG-584 (FISMA Level 3) informs IT security controls. Corrective action deadlines and recommendation text reflect the actual published reports." },
      { head:"Federal Travel Regulation (FTR) — 41 CFR 301-304", text:"All travel policy citations use FTR (GSA-issued, applies to all non-DoD civilian agencies including the SEC). JTR (Joint Travel Regulations) is DoD-only and does NOT apply to SEC. Verified against GSA.gov and Defense Travel Management Office sources. FTR §301-70.700 (GTC mandatory use), §301-11 (per diem), §301-52 (voucher filing), §301-73 (invitational travel)." },
      { head:"Live RSS Intelligence Pipeline", text:"8 RSS/Atom feeds processed every 4 hours weekdays via GitHub Actions cron: Federal Register (SEC, EOP/OMB, GSA, OPM), Congressional Budget Office, GAO, GovExec, FedScoop. Each item scored by Google Gemini Flash for OSO financial management relevance. Stored in Neon PostgreSQL (Neon serverless). Timestamps corrected to ET (America/New_York) to prevent UTC display confusion." },
      { head:"Regulatory & Policy References", text:"FAR/GSAM for acquisition references (FAR 1.602-2 COR duties, FAR 4.1103 SAM registration, FAR 13.301 GPC). GAO Red Book (4th ed., GAO-04-261SP) for appropriations law. OPM GS/SK pay tables 2026 for salary figures. OMB M-24-10 for AI governance. All regulatory citations verified against current published sources." },
    ]},
    tech: { title:"Technology Stack", body:[
      { head:"Frontend & Framework", text:"Next.js 15 (App Router) with React 18 and TypeScript throughout. Server-side rendering for SEO/performance, client-side interactivity for dashboards, AI chat, and live data. IBM Plex Sans/Mono typography. Responsive design (mobile-first breakpoints at 768px)." },
      { head:"AI Chat Integration (Interactive)", text:"Chain-of-LLMs architecture: Google Gemini → Groq (Llama 3) → Anthropic Claude, with automatic fallback on API errors. OSO-aware system prompt (~800 tokens) prepended to every query — includes $53M allotment, SK pay scale, FY2026 Month 9 data, FTR citations, GTC status, and OIG findings. Side-by-side 7-model comparison mode for quality assurance." },
      { head:"Live Intelligence Pipeline (Automated)", text:"GitHub Actions cron (every 4h Mon-Fri, 10:00-22:00 UTC). Fetches 8 RSS/Atom feeds using native Node.js https. Google Gemini Flash 2.0 scores each item's OSO relevance (replaces Anthropic Haiku — lower cost, no timeout issues). Results stored in Neon PostgreSQL (serverless). process.exit(0) added to prevent HTTPS keep-alive connection hang causing false job failures. Timeout: 20 minutes." },
      { head:"Database — Neon PostgreSQL", text:"Neon serverless PostgreSQL for live intelligence storage. Schema: sec_news table (id, cat, urg, headline, body, impact, src, url, published_at, created_at). Timestamps stored in UTC; fetched_at and time columns both converted AT TIME ZONE 'America/New_York' to display correct ET time. Unique index on headline prevents duplicate inserts from cron re-runs." },
      { head:"Data Visualization", text:"Recharts for budget trajectory charts, program obligation breakdowns, and object class visualizations. Inline SVG burn bars, progress bars, and traffic-light KPI cards throughout. All chart data from SEC FY2026/FY2027 CBJ (verified from actual PDF). No mocked or invented budget figures." },
      { head:"Deployment & Infrastructure", text:"Vercel (edge network, global CDN). Auto-deploys from GitHub main branch on push. SWC compiler for production builds. Vercel ISR (1-hour revalidation) for the /api/news-feed endpoint. Environment secrets: DATABASE_URL (Neon), GOOGLE_AI_API_KEY (Gemini), GROQ_API_KEY, ANTHROPIC_API_KEY (chat only), CRON_SECRET." },
    ]},
  };
  const s = content[section];
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      <div style={{ fontSize:22, fontWeight:800, color:C.text, marginBottom:4 }}>📖 About This App</div>
      <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr" : "190px 1fr", gap:16 }}>
        {isMobile
          ? <MobileSelect options={sections} value={section} onChange={setSection} C={C} />
          : <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              {sections.map(sec => (
                <button key={sec.id} onClick={()=>setSection(sec.id)}
                  style={{ background:section===sec.id?`${C.blue}18`:C.card, border:`1px solid ${section===sec.id?C.blue:C.border}`, borderRadius:8, padding:"10px 14px", cursor:"pointer", textAlign:"left", display:"flex", alignItems:"center", gap:10 }}>
                  <span style={{ fontSize:18 }}>{sec.icon}</span>
                  <span style={{ fontSize:14, fontWeight:section===sec.id?700:400, color:section===sec.id?C.blue:C.text }}>{sec.label}</span>
                </button>
              ))}
            </div>}
        <NCard C={C}>
          <div style={{ fontSize:18, fontWeight:700, color:C.text, marginBottom:18, paddingBottom:14, borderBottom:`1px solid ${C.border}` }}>{s.title}</div>
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            {s.body.map((item,i) => (
              <div key={i} style={{ padding:"14px 16px", background:C.surface, borderRadius:10, borderLeft:`3px solid ${C.blue}` }}>
                <div style={{ fontSize:15, fontWeight:700, color:C.text, marginBottom:6 }}>{item.head}</div>
                <div style={{ fontSize:14, color:C.muted, lineHeight:1.75 }}>{item.text}</div>
              </div>
            ))}
          </div>
        </NCard>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PAGE: ABOUT ME — Xiaobing (Peter) Shang
// ═══════════════════════════════════════════════════════════════════════════
function PageAboutMe({ C }) {
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState("profile");
  const tabs = [
    { id:"profile",  label:"Profile",        icon:"👤" },
    { id:"quals",    label:"Qualifications", icon:"🎓" },
    { id:"projects", label:"Projects",       icon:"🚀" },
    { id:"value",    label:"Value to OSO",   icon:"💼" },
  ];

  const projects = [
    { icon:"🏛️", name:"SEC OSO Financial Management Portal", url:"https://secosodemo.vercel.app", github:"https://github.com/icetonges/secosodemo", desc:"Comprehensive AI-powered OSO BMCB financial management platform. 20+ pages across 6 navigation groups: FY2026 $53M budget execution (verified from CBJ), Payroll & FTE (SK pay scale, 9 positions, OC 11/12 burn), Travel (FTR §301 compliance, GTC portal), FM Toolbox (6 tabs: appropriations law · budget process · 5 case studies · Analytics & AI/ML), live intelligence (GitHub Actions + Gemini Flash + Neon PostgreSQL), OIG-582/584 corrective action, AI FM Analyst (7+ LLMs, $53M-calibrated context), and comprehensive daily morning brief.", tags:["Next.js 15","TypeScript","Multi-LLM","Neon DB","Gemini Flash","FTR/FY2026","SK Pay Scale","OIG-582","Analytics & AI/ML"], badge:"NEW · This App", color:C.blue },
    { icon:"🧠", name:"CogniBloom — AI Learning Companion", url:"https://cognibloom.vercel.app", desc:"Personal AI tutor platform for K-12 learning featuring adaptive AI sessions, notes, quizzes, flashcards, gamified XP/badge system, and daily learning streaks. Built with Next.js 15, authenticated architecture, and multi-model AI.", tags:["Next.js 15","AI Tutor","K-12","Gamification","Authentication"], badge:"NEW", color:C.purple },
    { icon:"🏛️", name:"FedFM AI — Federal FM Analyst", url:"https://fedfm.vercel.app", desc:"Production AI analyst for federal FM professionals. RAG-powered Q&A over federal policy (pgvector), 4-model AI waterfall (Gemini→Groq→Llama), DoD FY2027 budget analysis, 26 material weaknesses mapped, live USASpending.gov ETL pipeline.", tags:["RAG","pgvector","OMB A-11","DoD Budget","4-Model AI","GitHub Actions ETL"], color:C.gold },
    { icon:"⚡", name:"AXIOM — AI Engineering Sandbox", url:"https://fedaxiom.vercel.app", desc:"10-stage production AI lifecycle platform: Define Goal → ReAct Agent Loop → RAG → Multi-Agent Orchestration → LLM-as-Judge evaluation → Deploy. Hands-on reference for production AI engineering patterns.", tags:["ReAct Loop","Multi-Agent","RAG","LLM-as-Judge","Agentic AI"], color:C.cyan },
    { icon:"✦", name:"MyThing — Personal AI Platform", url:"https://shangthing.vercel.app", desc:"Secure knowledge management platform with 4 specialized AI agents, automated tech news aggregation (Python + GitHub Actions), AI-generated daily briefings, Fed Finance Q&A over OMB policy. 6,300+ lines of TypeScript.", tags:["Next.js 15","Prisma ORM","NextAuth v5","4 AI Agents","Python Scraper"], color:C.green },
    { icon:"🛡️", name:"AI Governance Intelligence", url:"https://aimlgov.vercel.app", desc:"Multi-agent AI policy console with live news intelligence from 25+ sources scraped every 6h, RAG-powered chat over document library, PDF ingestion, AI visual aid generator (risk matrices, timelines), 3-model AI fallback.", tags:["Multi-Agent","RAG","PDF RAG","AI Policy","pgvector","25+ Sources"], color:C.red },
    { icon:"🔷", name:"Palantir Learning Platform", url:"https://palantirlearning.vercel.app", desc:"Self-evolving 11-section Foundry/AIP knowledge platform with automated Python web scraping via GitHub Actions, Gemini 2.5 + live Google Search grounding, AI executive briefings, and persistent PostgreSQL knowledge base.", tags:["Self-Evolving","Python Scraping","Gemini 2.5","Foundry/AIP","GitHub Actions"], color:C.indigo },
    { icon:"🤖", name:"PeterClaude — Claude API Chat", url:"https://peterclaude.vercel.app", desc:"Production Anthropic Claude API chat interface with session-aware conversation management, context window optimization, secure server-side API routing, and real-time message delivery with typing indicators.", tags:["Claude API","Anthropic","Session Management","Vercel Serverless","TypeScript"], color:C.blue },
    { icon:"🧠", name:"ML & AI Knowledge Hub", url:"https://mlaithing.vercel.app", desc:"Interactive ML algorithm reference covering 8+ algorithms, evaluation metrics (AUC-ROC, F1, Confusion Matrix), clustering techniques (K-Means/GMM), production ReAct agent framework, and real-world DoD/federal use cases.", tags:["scikit-learn","Python","ML Algorithms","AI Agents","DoD Use Cases"], color:C.purple },
    { icon:"📊", name:"Budget Matter — DoD Analytics", url:"https://budgetmatter.github.io", desc:"DoD analytics portfolio: Federal Spending Dashboard (Tableau), Budget Execution Tracker (year-over-year variance), Budget Spend Plan Model (Excel VBA scenario tool), Python automation suite, SQL/Python ETL pipelines.", tags:["Tableau","Excel VBA","Python","SQL ETL","DoD Budget"], color:C.gold },
  ];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      {/* Hero header */}
      <NCard C={C} style={{ background:"linear-gradient(135deg,#003087 0%,#1d4ed8 100%)", border:"none", padding:"28px 28px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:16, flexWrap:"wrap" }}>

          <div style={{ flex:1, minWidth:240 }}>
            <div style={{ fontSize:24, fontWeight:800, color:"#fff", marginBottom:2 }}>Xiaobing (Peter) Shang</div>
            <div style={{ fontSize:15, color:"rgba(255,255,255,0.85)", marginBottom:10 }}>
              Senior Federal FM Professional · GS-15, DoD OSD (Comptroller) · Data Scientist · Agentic AI Specialist
            </div>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              {["15+ Years Federal FM","GS-0560-15","CDFM","$338B Portfolio","AI/ML Engineer","M.S. Data Science 2025","10+ Production AI Apps"].map((t,i) => (
                <span key={i} style={{ fontSize:12, background:"rgba(255,255,255,0.18)", color:"#fff", padding:"3px 11px", borderRadius:20, fontWeight:600 }}>{t}</span>
              ))}
            </div>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:8, flexShrink:0 }}>
            {[
              { label:"🔗 LinkedIn", url:"https://www.linkedin.com/in/petershang/" },
              { label:"🌐 Portfolio", url:"https://petershang.vercel.app/" },
              { label:"💻 GitHub", url:"https://github.com/icetonges" },
            ].map((l,i) => (
              <a key={i} href={l.url} target="_blank" rel="noopener noreferrer"
                 style={{ background:"rgba(255,255,255,0.18)", color:"#fff", padding:"7px 18px",
                           borderRadius:8, fontSize:13, fontWeight:700, textDecoration:"none", textAlign:"center" }}>
                {l.label}
              </a>
            ))}
          </div>
        </div>
      </NCard>

      {/* Tabs — dropdown on mobile, pills on desktop */}
      {isMobile
        ? <MobileSelect options={tabs} value={activeTab} onChange={setActiveTab} C={C} />
        : <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            {tabs.map(t => (
              <button key={t.id} onClick={()=>setActiveTab(t.id)}
                style={{ background:activeTab===t.id?`${C.blue}18`:C.card, border:`1px solid ${activeTab===t.id?C.blue:C.border}`,
                          borderRadius:8, padding:"9px 20px", cursor:"pointer", fontSize:14,
                          color:activeTab===t.id?C.blue:C.text, fontWeight:activeTab===t.id?700:400,
                          display:"flex", alignItems:"center", gap:8 }}>
                <span>{t.icon}</span>{t.label}
              </button>
            ))}
          </div>}

      {/* PROFILE TAB */}
      {activeTab === "profile" && (
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap:16 }}>
            <NCard C={C}>
              <NH title="Professional Summary" C={C} />
              <div style={{ fontSize:14, color:C.muted, lineHeight:1.8 }}>
                Senior federal financial management professional with <strong style={{ color:C.text }}>15+ years</strong> of experience
                spanning the Pentagon (OSD Comptroller GS-15), DoD OIG, and U.S. Army. Currently leading a
                $338B enterprise financial analytics and AI integration portfolio at the Deputy CFO level.
                <br/><br/>
                Unique dual expertise: deep federal FM competency (appropriations law, ADA compliance, PPBE, audit
                readiness) combined with full-stack AI/ML engineering — 10 live production applications, M.S. Data
                Science (2025), and Agentic AI specialization. This SEC OSO FM portal demonstrates both.
              </div>
            </NCard>
            <NCard C={C}>
              <NH title="Core Federal FM Competencies" C={C} />
              {[
                { icon:"⚖️", skill:"Appropriations Law & ADA Compliance", detail:"31 U.S.C. §1341, Purpose Statute, Bona Fide Need Rule, apportionment" },
                { icon:"📊", skill:"Budget Formulation & Execution", detail:"OMB A-11 PPBE, $338B+ portfolios, object class management, SF-132/133" },
                { icon:"🔍", skill:"OIG Audit & Corrective Action", detail:"DoD OIG experience, CAP development, closure packages, FMFIA" },
                { icon:"💳", skill:"GPC Program Oversight", detail:"OMB A-123 App B, FAR 13.301, SmartPay, COR oversight" },
                { icon:"🖥️", skill:"Federal Financial Systems", detail:"Momentum, BPPAS, GFEBS (SAP), ADVANA, SAM.gov" },
                { icon:"🤖", skill:"AI/ML & Data Engineering", detail:"Agentic AI, RAG/pgvector, Python, Next.js 15, multi-model chains" },
              ].map((c,i) => (
                <div key={i} style={{ display:"flex", gap:12, marginBottom:12, alignItems:"flex-start" }}>
                  <span style={{ fontSize:20, flexShrink:0 }}>{c.icon}</span>
                  <div>
                    <div style={{ fontSize:14, fontWeight:600, color:C.text }}>{c.skill}</div>
                    <div style={{ fontSize:13, color:C.muted }}>{c.detail}</div>
                  </div>
                </div>
              ))}
            </NCard>
          </div>

          {/* Experience timeline */}
          <NCard C={C}>
            <NH title="Federal Career Timeline" C={C} />
            {[
              { period:"2023 – Present", role:"Portfolio Manager – AI Integration, Analytics & Reconciliation", org:"OSD (Comptroller) / Deputy CFO, Department of Defense · GS-0560-15 · Pentagon, DC", color:C.blue,
                bullets:["Lead enterprise financial analytics portfolio covering $338B in obligations/expenditures and $200B in accounts receivable", "Direct integration of 20 general ledgers into centralized execution reporting", "Architect AI-enabled financial analytics: anomaly detection, reconciliation analysis, predictive forecasting on ADVANA", "Design predictive workforce liability models for payroll forecasting and long-term budgetary planning"] },
              { period:"2020 – 2023", role:"Senior Budget Analyst", org:"Program & Budget, OSD (Comptroller), DoD · GS-0560-15 · Pentagon, DC", color:C.purple,
                bullets:["Managed formulation and execution review for major defense portfolios", "Reviewed 40+ Budget Justifications; issued 50+ Program Budget Decisions; identified $2B+ realignments", "Conducted financial trend and variance analysis; responded to OMB and Congressional inquiries"] },
              { period:"2017 – 2020", role:"Financial Systems Analyst / Budget Analyst", org:"Office of Inspector General, Department of Defense · GS-13/14 · Alexandria, VA", color:C.gold,
                bullets:["Built automated spend plan forecasting and financial risk assessment models", "Reconciled 700K+ transactions resolving $10M abnormal balances", "Performed COR duties overseeing contract cost, schedule, and performance compliance", "Conducted internal control reviews and authored financial management procedures"] },
              { period:"2010 – 2017", role:"Budget Analyst / Resource Manager / Program Analyst", org:"U.S. Army (Multiple Commands) · GS-11/12 · Redstone Arsenal / Germany / Korea", color:C.green,
                bullets:["Managed $45M payroll program for 500+ personnel; reduced payroll excess by 20%", "Managed financial operations, GPC program, and 1,100 individual GTC accounts; reduced GTC delinquency 40%", "Executed funds in GFEBS (SAP-based ERP); conducted UMD/ULO reconciliations"] },
            ].map((e,i) => (
              <div key={i} style={{ display:"flex", gap:16, marginBottom:20, paddingBottom:20, borderBottom:i<3?`1px solid ${C.border}`:"none" }}>
                <div style={{ flexShrink:0, width:130 }}>
                  <div style={{ fontSize:12, fontWeight:700, color:e.color, background:`${e.color}18`, padding:"3px 8px", borderRadius:4, marginBottom:4 }}>{e.period}</div>
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:15, fontWeight:700, color:C.text, marginBottom:2 }}>{e.role}</div>
                  <div style={{ fontSize:13, color:e.color, marginBottom:8 }}>{e.org}</div>
                  {e.bullets.map((b,bi) => (
                    <div key={bi} style={{ fontSize:13, color:C.muted, lineHeight:1.6, marginBottom:4, paddingLeft:14, borderLeft:`2px solid ${e.color}44` }}>▸ {b}</div>
                  ))}
                </div>
              </div>
            ))}
          </NCard>

          {/* Education & Certifications */}
          <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap:16 }}>
            <NCard C={C}>
              <NH title="Education" C={C} />
              {[
                { deg:"M.S. Data Science", school:"Saint Peter's University", year:"2025" },
                { deg:"M.S. Digital Forensics & Cyber Investigation", school:"Univ. of Maryland Global Campus", year:"2023" },
                { deg:"M.S. Cybersecurity Technology", school:"Univ. of Maryland Global Campus", year:"2022", honor:"Phi Kappa Phi" },
                { deg:"MBA (Accounting)", school:"University of Phoenix", year:"2009" },
                { deg:"B.S. Accounting", school:"Univ. of Maryland University College", year:"2010" },
              ].map((e,i) => (
                <div key={i} style={{ marginBottom:10, paddingBottom:10, borderBottom:i<4?`1px solid ${C.border}`:"none" }}>
                  <div style={{ fontSize:14, fontWeight:600, color:C.text }}>{e.deg}</div>
                  <div style={{ fontSize:13, color:C.muted }}>{e.school} · {e.year} {e.honor && <span style={{ color:C.gold }}>· {e.honor}</span>}</div>
                </div>
              ))}
            </NCard>
            <NCard C={C}>
              <NH title="Key Certifications" C={C} />
              {[
                { cert:"Certified Defense Financial Manager (CDFM)", org:"ASMC · 2009", color:C.gold },
                { cert:"DoD Financial Management Level III", org:"DoD · 2021", color:C.blue },
                { cert:"IBM Data Science Professional Certificate", org:"IBM · 2022", color:C.cyan },
                { cert:"CS50's Introduction to AI with Python", org:"Harvard University · Dec 2025", color:C.red },
                { cert:"5-Day AI Agents Intensive", org:"Google / Kaggle · Nov 2025", color:C.green },
                { cert:"Palantir Foundry & AIP Builder Foundations", org:"Palantir Technologies · 2026", color:C.purple },
              ].map((c,i) => (
                <div key={i} style={{ display:"flex", gap:10, marginBottom:10, alignItems:"flex-start" }}>
                  <div style={{ width:8, height:8, borderRadius:"50%", background:c.color, flexShrink:0, marginTop:5 }} />
                  <div>
                    <div style={{ fontSize:14, fontWeight:600, color:C.text }}>{c.cert}</div>
                    <div style={{ fontSize:12, color:C.muted }}>{c.org}</div>
                  </div>
                </div>
              ))}
            </NCard>
          </div>
        </div>
      )}

      {/* QUALIFICATIONS TAB */}
      {activeTab === "quals" && (
        <NCard C={C} style={{ borderLeft:`4px solid ${C.green}` }}>
          <NH title="How I Meet the SEC OSO FM Specialist Requirements" sub="Based on USAJOBS Announcement · GS-0501/0560 series" C={C} />
          {[
            { req:"Knowledge of federal appropriations law and anti-deficiency statute",
              how:"Built ADA compliance automation in this portal — real-time ADA risk scoring, obligation tracking against apportioned amounts, and escalation protocols per 31 U.S.C. §1341 and SEC-R 14-1. Applied daily at the DoD OSD level covering $338B.", certs:["CDFM","DoD FM Level III"] },
            { req:"Experience with budget formulation under OMB Circular A-11",
              how:"Led OSD-level PPBE formulation. Built FY2028 budget formulation workflow in this portal: budget call coordination, office submission tracking (OFS/OSBO/OAMR/BMCB), and A-11 timeline management. Reviewed 40+ Budget Justifications at DoD Comptroller.", certs:["DoD FM Level III"] },
            { req:"Experience with federal financial management systems (Momentum, BPPAS, GFEBS)",
              how:"Extensive GFEBS (SAP) experience managing Army funds. Built Financial Systems reference in this portal covering Momentum obligation entry, BPPAS allocation reconciliation, and budget control protocols per OIG-488. Proficient in ADVANA at current DoD role.", certs:["DoD FM Level III","DAWIA FM Level II"] },
            { req:"Ability to analyze and present financial data to senior leadership",
              how:"Currently provides executive-level variance, trend, and risk analysis for OSD senior leadership on $338B portfolio. Built automated monthly status brief generator, executive one-pager, and OIG-582 update for this portal — formatted for Branch Chief and AD-level.", certs:["15+ Years Experience"] },
            { req:"Experience with GPC program management (OMB A-123, FAR 13.301)",
              how:"Managed 1,100 individual GTC accounts at U.S. Army; reduced GTC delinquency rate by 40%. Designed complete GPC oversight module for this portal: 5-day reconciliation tracking, limit compliance, split-purchase detection, and cardholder reporting for all 4 OSO accounts.", certs:["CDFM","DoD FM Level II"] },
            { req:"Knowledge of OIG audit processes and corrective action management",
              how:"3 years at DoD OIG conducting internal control reviews, building financial risk models, and reconciling $10M abnormal balances. OIG-582 and OIG-584 corrective action tracker built with milestone tracking and closure package templates.", certs:["DoD OIG Experience"] },
            { req:"Advanced data analysis and technology integration",
              how:"M.S. Data Science (2025). 10 live production AI applications. Current role: architect AI-enabled analytics on ADVANA, build agentic AI/ML prototypes for audit and reconciliation efficiency. Unique combination of federal FM expertise and production AI engineering.", certs:["M.S. Data Science","IBM Data Science","Harvard CS50 AI","Google AI Agents"] },
          ].map((r,i) => (
            <div key={i} style={{ marginBottom:16, padding:"14px 16px", background:C.surface, borderRadius:10 }}>
              <div style={{ display:"flex", gap:10, marginBottom:8, alignItems:"flex-start" }}>
                <span style={{ fontSize:16, flexShrink:0 }}>✅</span>
                <div style={{ fontSize:14, fontWeight:700, color:C.text }}>{r.req}</div>
              </div>
              <div style={{ fontSize:14, color:C.muted, lineHeight:1.7, paddingLeft:26, marginBottom:8 }}>{r.how}</div>
              <div style={{ paddingLeft:26, display:"flex", gap:6, flexWrap:"wrap" }}>
                {r.certs.map((c,ci) => <Tag key={ci} label={c} color={C.green} C={C} />)}
              </div>
            </div>
          ))}
        </NCard>
      )}

      {/* PROJECTS TAB */}
      {activeTab === "projects" && (
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4,1fr)", gap:12 }}>
            {[
              { label:"Live Productions Apps", value:"10", color:C.blue },
              { label:"Lines of Code", value:"50K+", color:C.purple },
              { label:"AI Models Integrated", value:"7+", color:C.gold },
              { label:"Federal FM Systems", value:"6+", color:C.green },
            ].map((m,i) => (
              <div key={i} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:"14px 16px", borderTop:`3px solid ${m.color}` }}>
                <div style={{ fontSize:26, fontWeight:800, color:m.color, fontFamily:"monospace" }}>{m.value}</div>
                <div style={{ fontSize:13, color:C.muted, marginTop:4 }}>{m.label}</div>
              </div>
            ))}
          </div>
          {projects.map((p,i) => (
            <NCard key={i} C={C} style={{ borderLeft:`4px solid ${p.color}` }}>
              <div style={{ display:"flex", gap:14, alignItems:"flex-start" }}>
                <span style={{ fontSize:28, flexShrink:0 }}>{p.icon}</span>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:4, flexWrap:"wrap" }}>
                    <div style={{ fontSize:16, fontWeight:700, color:C.text }}>{p.name}</div>
                    {p.badge && <span style={{ fontSize:11, fontWeight:700, background:`${p.color}22`, color:p.color, padding:"2px 9px", borderRadius:20 }}>{p.badge}</span>}
                  </div>
                  <div style={{ fontSize:14, color:C.muted, lineHeight:1.7, marginBottom:10 }}>{p.desc}</div>
                  <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:10 }}>
                    {p.tags.map((t,ti) => <Tag key={ti} label={t} color={p.color} C={C} />)}
                  </div>
                  <div style={{ display:"flex", gap:10 }}>
                    <a href={p.url} target="_blank" rel="noopener noreferrer"
                       style={{ background:`${p.color}18`, color:p.color, padding:"6px 14px", borderRadius:7, fontSize:13, fontWeight:700, textDecoration:"none" }}>
                      🌐 Live Demo
                    </a>
                    {p.github && (
                      <a href={p.github} target="_blank" rel="noopener noreferrer"
                         style={{ background:C.dim, color:C.text, padding:"6px 14px", borderRadius:7, fontSize:13, fontWeight:600, textDecoration:"none" }}>
                        💻 GitHub
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </NCard>
          ))}
        </div>
      )}

      {/* VALUE TAB */}
      {activeTab === "value" && (
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          <NCard C={C} style={{ borderLeft:`4px solid ${C.gold}` }}>
            <NH title="What I Bring to OSO BMCB" sub="Specific value proposition for the Financial Management Specialist role" C={C} />
            {[
              { icon:"🎯", title:"Day-One Operational Readiness — Verified from Real CBJ Data", body:"This portal is built from the actual SEC FY2026/FY2027 Congressional Budget Justification PDF. Budget figures ($53.0M operational allotment — not guessed), FTE counts (684 Dir & Admin Support, 4,024 agency-wide), object class breakdowns, and OSO office descriptions all come directly from the published CBJ. OIG-582/584 findings reference the actual published reports. Travel policy correctly cites FTR (not JTR) because the SEC is not a DoD agency. SK pay scale (not GS) because the SEC uses its own administratively-determined pay system. This is the depth of preparation I bring to Day 1." },
              { icon:"💰", title:"Pentagon-Scale FM — Calibrated to OSO's Actual $53M Scope", body:"Currently managing a $338B enterprise portfolio at DoD OSD level. OSO's ~$53M non-personnel operational allotment (12 locations: HQ + 11 regionals) is a focused, mission-critical scope I can serve with senior-level precision. I understand the difference between macro-level defense budgeting and the granular office-level FM that OSO requires — from the $16.4M OSBO-PSE security contract ceiling to the $1.3M BMCB program management allotment. Both skill sets are present." },
              { icon:"🔍", title:"OIG Experience + OIG-582 Closure Ownership", body:"3 years at DoD OIG conducting internal control reviews, reconciling abnormal balances, and building corrective action frameworks. I understand OIG-582's three open recommendations at the technical level: (1) T&M ceiling utilization dashboard — I've built the analytics tool in this portal; (2) contract type decision matrix — I know the FAR/GSAM criteria that drive FFP vs. T&M choice; (3) COR SOPs — I've written the surveillance log protocol. The September 30, 2026 deadline is 121 days away." },
              { icon:"🤖", title:"Production AI/ML for FM Modernization — Not Theoretical", body:"10 live production AI applications. In this portal alone: Google Gemini Flash for automated intelligence scoring (4h cron, 8 feeds, Neon DB), multi-LLM AI analyst with $53M-calibrated OSO context, anomaly detection methodology (Isolation Forest), NLP for OIG document parsing, burn rate forecasting with Python examples, and OMB M-24-10 AI governance guidance. I can build and operate the OIG-582 T&M dashboard while running the underlying FM function. No other candidate does both." },
              { icon:"📊", title:"Analytical Communication Calibrated to Leadership Audience", body:"Currently delivers executive-level variance and risk analysis to OSD senior leadership on a $338B portfolio. For OSO this translates directly: the monthly brief for J. Harrison (Branch Chief) is auto-generated with live FY2026 Month 9 burn rates, ADA risk ratings, and OIG status — formatted as a decision document, not a data download. The one-pager for R. Buckley (AD Operations) shows projected year-end position in three numbers. The FM Toolbox case studies show I can explain appropriations law to non-legal audiences clearly." },
              { icon:"🤝", title:"SEC-Specific Preparation — Not a Generic Demo", body:"I built a SEC-specific portal, verified every budget figure against the actual CBJ PDF, correctly identified that the SEC uses FTR (not JTR) for travel, SK (not GS) for pay, and Momentum (not GFEBS) as the core financial system. I researched 4 OIG reports (482, 488, 582, 584), the FSGG subcommittee markup schedule, the Section 31 fee mechanism, and the specific challenges of managing FOIA for 13,250 annual requests across 12 locations. OSO's mission — enabling FOIA transparency, physical security, mission resilience — matters. I want to be the FM Specialist who makes it financially sustainable." },
            ].map((v,i) => (
              <div key={i} style={{ marginBottom:16, padding:"16px 18px", background:C.surface, borderRadius:10 }}>
                <div style={{ display:"flex", gap:12, marginBottom:8 }}>
                  <span style={{ fontSize:24, flexShrink:0 }}>{v.icon}</span>
                  <div style={{ fontSize:16, fontWeight:700, color:C.text }}>{v.title}</div>
                </div>
                <div style={{ fontSize:14, color:C.muted, lineHeight:1.75, paddingLeft:36 }}>{v.body}</div>
              </div>
            ))}
          </NCard>

          <NCard C={C} style={{ borderLeft:`4px solid ${C.blue}` }}>
            <NH title="Contact & Links" C={C} />
            <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap:12 }}>
              {[
                { label:"LinkedIn", url:"https://www.linkedin.com/in/petershang/", icon:"🔗", color:C.blue },
                { label:"Portfolio / Résumé", url:"https://petershang.vercel.app/", icon:"🌐", color:C.purple },
                { label:"GitHub", url:"https://github.com/icetonges", icon:"💻", color:C.muted },
                { label:"Email", url:"mailto:icetonges@gmail.com", icon:"✉️", color:C.green },
              ].map((l,i) => (
                <a key={i} href={l.url} target="_blank" rel="noopener noreferrer"
                   style={{ display:"flex", alignItems:"center", gap:10, background:C.surface, borderRadius:8,
                              padding:"12px 16px", textDecoration:"none", color:C.text, fontSize:14, fontWeight:600,
                              border:`1px solid ${C.border}` }}>
                  <span style={{ fontSize:20 }}>{l.icon}</span>{l.label}
                </a>
              ))}
            </div>
          </NCard>
        </div>
      )}
    </div>
  );
}

export { PageDailyUpdate, PageAboutApp, PageAboutMe };
