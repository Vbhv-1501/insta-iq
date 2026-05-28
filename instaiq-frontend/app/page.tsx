"use client"
import { useState, useEffect, useRef } from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import {
  LayoutDashboard, Users, GitCompare, FileText, History,
  Settings, Search, Bell, Shield, Globe, Zap, Star, Check,
  ArrowRight, X, AlertTriangle, Award, Brain, Sparkles,
  Download, BarChart2, Network, Eye, Menu, TrendingUp,
  Activity, Languages, Hash, ChevronRight, MoreHorizontal,
  ArrowUpRight, CheckCircle, Instagram, MapPin, RefreshCw,
  Filter, UserCircle, LogOut, Loader2
} from "lucide-react";

/* ─── INJECTED STYLES ─────────────────────────────────────────────────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&display=swap');

*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body{height:100%;font-family:'DM Sans',system-ui,sans-serif;-webkit-font-smoothing:antialiased}
:root{
  --bg:#ffffff;--surface:#ffffff;--border:#E5E7EB;--text:#111827;--muted:#6B7280;
  --accent:#0284C7;--accent-light:#E0F2FE;--accent-mid:#38BDF8;
  --success:#22C55E;--warning:#F59E0B;--danger:#EF4444;
  --sidebar-w:256px;--topbar-h:64px;
}
.font-display{font-family:'Outfit',sans-serif}

@keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
@keyframes countUp{from{transform:translateY(10px);opacity:0}to{transform:translateY(0);opacity:1}}
@keyframes glow{0%,100%{box-shadow:0 0 20px rgba(2,132,199,.15)}50%{box-shadow:0 0 40px rgba(2,132,199,.35)}}
@keyframes gradPan{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}

.au{animation:fadeUp .55s ease both}
.au1{animation-delay:.05s}.au2{animation-delay:.12s}.au3{animation-delay:.2s}
.au4{animation-delay:.28s}.au5{animation-delay:.38s}.au6{animation-delay:.48s}
.float{animation:float 3.5s ease-in-out infinite}
.pulse{animation:pulse 2s ease-in-out infinite}
.spin{animation:spin 12s linear infinite}
.glow{animation:glow 3s ease-in-out infinite}

.skeleton{background:linear-gradient(90deg,#F3F4F6 25%,#E9EAEC 50%,#F3F4F6 75%);background-size:200% 100%;animation:shimmer 1.4s infinite;border-radius:8px}

.btn{display:inline-flex;align-items:center;gap:8px;padding:10px 20px;border-radius:8px;font-family:'DM Sans',sans-serif;font-weight:600;font-size:14px;cursor:pointer;border:none;transition:all .18s ease;text-decoration:none}
.btn-primary{background:var(--accent);color:#fff}
.btn-primary:hover{background:#0369A1;transform:translateY(-1px);box-shadow:0 6px 24px rgba(2,132,199,.35)}
.btn-outline{background:transparent;color:var(--text);border:1px solid var(--border)}
.btn-outline:hover{background:#F9FAFB;border-color:#D1D5DB}
.btn-ghost{background:transparent;color:var(--muted)}
.btn-ghost:hover{background:#F3F4F6;color:var(--text)}

.card{background:var(--surface);border:1px solid var(--border);border-radius:12px;transition:all .2s ease}
.card:hover{box-shadow:0 4px 24px rgba(0,0,0,.06)}
.card-lift:hover{transform:translateY(-2px);box-shadow:0 8px 30px rgba(0,0,0,.08)}

.nav-item{display:flex;align-items:center;gap:10px;padding:9px 12px;border-radius:8px;cursor:pointer;font-size:14px;font-weight:500;color:var(--muted);transition:all .15s ease;white-space:nowrap}
.nav-item:hover{background:#F3F4F6;color:var(--text)}
.nav-item.active{background:#EFF6FF;color:var(--accent)}

.tag{display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600;letter-spacing:.02em}
.tag-blue{background:#DBEAFE;color:#1D4ED8}
.tag-green{background:#DCFCE7;color:#15803D}
.tag-orange{background:#FEF3C7;color:#B45309}
.tag-red{background:#FEE2E2;color:#DC2626}
.tag-purple{background:#F3E8FF;color:#7C3AED}

.input{width:100%;padding:10px 14px;border:1px solid var(--border);border-radius:8px;font-family:'DM Sans',sans-serif;font-size:14px;color:var(--text);outline:none;transition:border .15s ease;background:white}
.input:focus{border-color:var(--accent);box-shadow:0 0 0 3px rgba(2,132,199,.1)}

.dark-grid{background-color:#050D1A;background-image:radial-gradient(circle,rgba(255,255,255,.055) 1px,transparent 1px);background-size:28px 28px}
.white-grid{background-color:#ffffff;background-image:radial-gradient(circle,#E5E7EB .8px,transparent .8px);background-size:22px 22px}

.sidebar{width:var(--sidebar-w);min-height:100vh;background:#fff;border-right:1px solid var(--border);display:flex;flex-direction:column;flex-shrink:0;position:sticky;top:0}
.topbar{height:var(--topbar-h);background:#fff;border-bottom:1px solid var(--border);display:flex;align-items:center;padding:0 24px;gap:16px;position:sticky;top:0;z-index:10}

.stat-value{font-family:'Outfit',sans-serif;font-weight:700;font-size:28px;color:var(--text);line-height:1;animation:countUp .5s ease both}
.score-ring{position:relative;display:inline-flex;align-items:center;justify-content:center}

.tooltip-custom{background:white;border:1px solid var(--border);border-radius:8px;padding:8px 12px;font-family:'DM Sans',sans-serif;font-size:12px;box-shadow:0 4px 16px rgba(0,0,0,.08)}

.hero-glow{position:absolute;width:600px;height:600px;border-radius:50%;background:radial-gradient(circle,rgba(56,189,248,.12) 0%,transparent 70%);pointer-events:none}

::-webkit-scrollbar{width:5px;height:5px}
::-webkit-scrollbar-track{background:transparent}
::-webkit-scrollbar-thumb{background:#D1D5DB;border-radius:3px}

.recharts-tooltip-wrapper{outline:none}
`;

/* ─── MOCK DATA ───────────────────────────────────────────────────────────── */
const D_COUNTRY = [
  { name: "India", value: 34.2, color: "#0284C7" },
  { name: "USA", value: 22.1, color: "#0EA5E9" },
  { name: "UK", value: 8.4, color: "#38BDF8" },
  { name: "UAE", value: 6.7, color: "#7DD3FC" },
  { name: "Canada", value: 5.2, color: "#BAE6FD" },
  { name: "Others", value: 23.4, color: "#E0F2FE" },
];
const D_LANG = [
  { lang: "English", pct: 48.3 },
  { lang: "Hindi", pct: 29.1 },
  { lang: "Arabic", pct: 7.4 },
  { lang: "Spanish", pct: 5.2 },
  { lang: "French", pct: 3.8 },
  { lang: "Others", pct: 6.2 },
];
const D_GROWTH = [
  { m: "Oct", v: 185 },{ m: "Nov", v: 198 },{ m: "Dec", v: 207 },
  { m: "Jan", v: 219 },{ m: "Feb", v: 235 },{ m: "Mar", v: 248 },
];
const D_BOT = [
  { name: "Real", value: 68.4, color: "#22C55E" },
  { name: "Suspicious", value: 18.2, color: "#F59E0B" },
  { name: "Bot", value: 13.4, color: "#EF4444" },
];
const D_ENG = [
  { d: "Mon", r: 3.2 },{ d: "Tue", r: 4.1 },{ d: "Wed", r: 3.8 },
  { d: "Thu", r: 5.2 },{ d: "Fri", r: 4.7 },{ d: "Sat", r: 6.1 },{ d: "Sun", r: 5.4 },
];
const D_BIO = [
  { t: "Creator", c: 12840 },{ t: "Entrepreneur", c: 9230 },{ t: "Artist", c: 8102 },
  { t: "Fitness", c: 7344 },{ t: "Travel", c: 6891 },{ t: "Fashion", c: 6102 },
  { t: "Photographer", c: 5743 },{ t: "Student", c: 5102 },{ t: "Tech", c: 4821 },
  { t: "Music", c: 4231 },{ t: "Food", c: 3982 },{ t: "Business", c: 3541 },
];
const RECENT = [
  { u: "cristiano", f: "631M", s: 91, t: "2 min ago", v: true },
  { u: "leomessi", f: "504M", s: 88, t: "1 hr ago", v: true },
  { u: "priyankachopra", f: "89.4M", s: 74, t: "3 hrs ago", v: true },
  { u: "virat.kohli", f: "268M", s: 85, t: "Yesterday", v: true },
];
const FEATURES = [
  { icon: Brain, t: "Audience Intelligence", d: "Deep AI analysis of follower demographics, interests, and behavioral patterns at scale.", c: "#0284C7", bg: "#EFF6FF" },
  { icon: Globe, t: "Country Analytics", d: "Precise geographic distribution using language signals, bio data, and timezone inference.", c: "#0369A1", bg: "#EFF6FF" },
  { icon: Network, t: "Mutual Followers", d: "Map audience overlap between any accounts with interactive network graph visualization.", c: "#0284C7", bg: "#EFF6FF" },
  { icon: Shield, t: "Fake Follower Detection", d: "ML-powered bot and suspicious account detection with confidence scoring per account.", c: "#DC2626", bg: "#FEF2F2" },
  { icon: Sparkles, t: "AI Insights", d: "Natural language summaries and actionable intelligence, powered by large language models.", c: "#7C3AED", bg: "#F5F3FF" },
  { icon: BarChart2, t: "Social Graph Analysis", d: "Visualize influence networks and follower relationship pathways at scale.", c: "#059669", bg: "#F0FDF4" },
];
const PLANS = [
  { n: "Free", p: "0", per: "forever", highlight: false, cta: "Get Started",
    features: ["3 analyses per day", "5K followers sampled", "Basic country analytics", "Language detection", "7-day report history"] },
  { n: "Pro", p: "29", per: "month", highlight: true, cta: "Start Free Trial",
    features: ["Unlimited analyses", "Full follower scan", "Advanced bot detection", "AI-powered insights", "Mutual followers engine", "Social graph export", "Priority support", "30-day history"] },
  { n: "Enterprise", p: "99", per: "month", highlight: false, cta: "Contact Sales",
    features: ["Everything in Pro", "REST API access", "Bulk analysis queue", "White-label PDF reports", "Custom integrations", "Dedicated account manager", "99.9% SLA guarantee", "Unlimited history"] },
];
const NAV = [
  { id: "home", icon: LayoutDashboard, label: "Dashboard" },
  { id: "analysis", icon: Users, label: "Audience Analysis" },
  { id: "compare", icon: GitCompare, label: "Compare Accounts" },
  { id: "reports", icon: FileText, label: "Reports" },
  { id: "history", icon: History, label: "History" },
  { id: "settings", icon: Settings, label: "Settings" },
];

/* ─── HOOKS ───────────────────────────────────────────────────────────────── */
function useCountUp(end, dur = 1400) {
  const [v, setV] = useState(0);
  const frame = useRef(null);
  const t0 = useRef(null);
  useEffect(() => {
    t0.current = null;
    const step = (ts) => {
      if (!t0.current) t0.current = ts;
      const p = Math.min((ts - t0.current) / dur, 1);
      const e = 1 - Math.pow(1 - p, 3);
      setV(Math.round(e * end));
      if (p < 1) frame.current = requestAnimationFrame(step);
    };
    frame.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame.current);
  }, [end, dur]);
  return v;
}

/* ─── SMALL SHARED COMPONENTS ────────────────────────────────────────────── */
const CustomTooltip = ({ active, payload, label, fmt }) => {
  if (active && payload && payload.length)
    return (
      <div className="tooltip-custom">
        <p style={{ color: "#6B7280", marginBottom: 4, fontSize: 11 }}>{label}</p>
        {payload.map((e, i) => (
          <p key={i} style={{ color: e.color || "#0284C7", fontWeight: 600, fontSize: 13 }}>
            {fmt ? fmt(e.value) : e.value}
          </p>
        ))}
      </div>
    );
  return null;
};

const ScoreRing = ({ score, size = 88 }) => {
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = score >= 75 ? "#22C55E" : score >= 50 ? "#F59E0B" : "#EF4444";
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#F3F4F6" strokeWidth={8} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={8}
          strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round"
          style={{ transition: "stroke-dasharray 1.2s cubic-bezier(.4,0,.2,1)" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span className="font-display" style={{ fontSize: size > 72 ? 22 : 16, fontWeight: 700, color }}>{score}</span>
        <span style={{ fontSize: 9, color: "#9CA3AF", fontWeight: 500 }}>/ 100</span>
      </div>
    </div>
  );
};

/* ─── LANDING PAGE ────────────────────────────────────────────────────────── */
function LandingNav({ onAuth }) {
  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
      height: 60, display: "flex", alignItems: "center", padding: "0 32px",
      justifyContent: "space-between",
      background: "rgba(5,13,26,.8)", backdropFilter: "blur(16px)",
      borderBottom: "1px solid rgba(255,255,255,.07)"
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 28, height: 28, background: "linear-gradient(135deg,#38BDF8,#0284C7)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Eye size={14} color="white" />
        </div>
        <span className="font-display" style={{ color: "white", fontWeight: 700, fontSize: 17, letterSpacing: "-.02em" }}>InstaIQ</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ display: "flex", gap: 24, marginRight: 16 }}>
          {["Features", "Pricing", "Docs", "Blog"].map(l => (
            <span key={l} style={{ color: "rgba(255,255,255,.55)", fontSize: 14, fontWeight: 500, cursor: "pointer", transition: "color .15s" }}
              onMouseEnter={e => e.target.style.color = "rgba(255,255,255,.9)"}
              onMouseLeave={e => e.target.style.color = "rgba(255,255,255,.55)"}>{l}</span>
          ))}
        </div>
        <button className="btn btn-ghost" style={{ color: "rgba(255,255,255,.7)", fontSize: 13 }} onClick={() => onAuth("login")}>Sign in</button>
        <button className="btn btn-primary" style={{ fontSize: 13, padding: "8px 16px" }} onClick={() => onAuth("signup")}>Get Started</button>
      </div>
    </nav>
  );
}

function Hero({ onAnalyze }) {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const counts = {
    accounts: useCountUp(2481930, 1800),
    dataPoints: useCountUp(8420000, 2000),
    accuracy: useCountUp(94, 1200),
  };

  const handleAnalyze = () => {
    if (!username.trim()) return;
    setLoading(true);
    setTimeout(() => { setLoading(false); onAnalyze(username); }, 1400);
  };

  return (
    <section className="dark-grid" style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 24px 60px", position: "relative", overflow: "hidden" }}>
      <div className="hero-glow" style={{ top: "15%", left: "50%", transform: "translateX(-50%)" }} />
      <div className="hero-glow" style={{ top: "40%", left: "20%", opacity: .5 }} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 680, textAlign: "center" }}>
        <div className="au au1" style={{ marginBottom: 20 }}>
          <span className="tag tag-blue" style={{ background: "rgba(56,189,248,.1)", color: "#38BDF8", border: "1px solid rgba(56,189,248,.2)" }}>
            <Sparkles size={10} /> AI-Powered Instagram Intelligence
          </span>
        </div>

        <h1 className="au au2 font-display" style={{ fontSize: "clamp(38px,6vw,68px)", fontWeight: 800, color: "white", lineHeight: 1.08, letterSpacing: "-.03em", marginBottom: 20 }}>
          Understand Any{" "}
          <span style={{ background: "linear-gradient(135deg,#38BDF8,#0EA5E9,#0284C7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
            Instagram Audience
          </span>{" "}
          with AI
        </h1>

        <p className="au au3" style={{ fontSize: 18, color: "rgba(255,255,255,.55)", lineHeight: 1.65, marginBottom: 40, maxWidth: 520, margin: "0 auto 40px" }}>
          Real audience intelligence. Follower analytics, country distribution,
          mutual audience mapping, fake follower detection, and social graph insights.
        </p>

        <div className="au au4" style={{ display: "flex", gap: 10, maxWidth: 500, margin: "0 auto 16px", background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 12, padding: 6 }}>
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, padding: "0 12px" }}>
            <span style={{ color: "rgba(255,255,255,.3)", fontSize: 15 }}>@</span>
            <input
              value={username}
              onChange={e => setUsername(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleAnalyze()}
              placeholder="Enter Instagram username"
              style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "white", fontSize: 15, fontFamily: "'DM Sans',sans-serif" }}
            />
          </div>
          <button className="btn btn-primary" onClick={handleAnalyze} style={{ borderRadius: 8, padding: "10px 20px", fontSize: 14 }}>
            {loading ? <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> : <><span>Analyze</span><ArrowRight size={14} /></>}
          </button>
        </div>

        <p className="au au5" style={{ fontSize: 12, color: "rgba(255,255,255,.3)", marginBottom: 56 }}>
          Free to try. No credit card required.
        </p>

        <div className="au au6" style={{ display: "flex", gap: 40, justifyContent: "center" }}>
          {[
            { label: "Accounts Analyzed", val: (counts.accounts / 1e6).toFixed(1) + "M+" },
            { label: "Data Points Processed", val: (counts.dataPoints / 1e6).toFixed(1) + "M+" },
            { label: "Accuracy Rate", val: counts.accuracy + "%" },
          ].map(({ label, val }) => (
            <div key={label} style={{ textAlign: "center" }}>
              <div className="font-display" style={{ fontSize: 26, fontWeight: 800, color: "white", letterSpacing: "-.02em" }}>{val}</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,.4)", marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Floating mini cards */}
      <div className="float au" style={{ position: "absolute", left: "6%", top: "30%", background: "rgba(255,255,255,.06)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 12, padding: "14px 18px", animationDelay: ".3s", display: "window" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22C55E" }} />
          <span style={{ fontSize: 11, color: "rgba(255,255,255,.5)" }}>Audience Quality</span>
        </div>
        <div className="font-display" style={{ fontSize: 28, fontWeight: 800, color: "white" }}>86<span style={{ fontSize: 14, color: "#22C55E" }}>/100</span></div>
      </div>
      <div className="float au" style={{ position: "absolute", right: "6%", top: "38%", background: "rgba(255,255,255,.06)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 12, padding: "14px 18px", animationDelay: ".6s" }}>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,.5)", marginBottom: 8 }}>Top Countries</div>
        {[["🇮🇳 India", "34.2%"], ["🇺🇸 USA", "22.1%"]].map(([c, p]) => (
          <div key={c} style={{ display: "flex", justifyContent: "space-between", gap: 20, marginBottom: 4 }}>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,.7)" }}>{c}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#38BDF8" }}>{p}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function FeaturesSection() {
  return (
    <section style={{ padding: "96px 24px", background: "#F9FAFB" }}>
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <span className="tag tag-blue" style={{ marginBottom: 14, display: "inline-flex" }}>What InstaIQ Does</span>
          <h2 className="font-display" style={{ fontSize: "clamp(28px,4vw,42px)", fontWeight: 800, color: "#111827", letterSpacing: "-.025em", marginBottom: 14 }}>
            Intelligence beyond follower counts
          </h2>
          <p style={{ fontSize: 16, color: "#6B7280", maxWidth: 460, margin: "0 auto" }}>
            Every feature is built around one goal: helping you understand who really follows any public Instagram account.
          </p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 20 }}>
          {FEATURES.map(({ icon: Icon, t, d, c, bg }) => (
            <div key={t} className="card card-lift" style={{ padding: "28px 28px 28px" }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: bg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                <Icon size={20} color={c} />
              </div>
              <h3 className="font-display" style={{ fontSize: 17, fontWeight: 700, color: "#111827", marginBottom: 8, letterSpacing: "-.015em" }}>{t}</h3>
              <p style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.6 }}>{d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function DemoSection({ onCTA }) {
  return (
    <section style={{ padding: "80px 24px", background: "white", overflow: "hidden" }}>
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <h2 className="font-display" style={{ fontSize: "clamp(26px,3.5vw,38px)", fontWeight: 800, color: "#111827", letterSpacing: "-.025em", marginBottom: 12 }}>
            Insights that actually move the needle
          </h2>
          <p style={{ fontSize: 15, color: "#6B7280" }}>A live preview of what one analysis looks like</p>
        </div>
        <div className="card" style={{ padding: 28, background: "#F9FAFB" }}>
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <p style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8 }}>Follower Growth</p>
              <ResponsiveContainer width="100%" height={120}>
                <AreaChart data={D_GROWTH} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
                  <defs><linearGradient id="cg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#0284C7" stopOpacity={.2} /><stop offset="95%" stopColor="#0284C7" stopOpacity={0} /></linearGradient></defs>
                  <Area type="monotone" dataKey="v" stroke="#0284C7" strokeWidth={2} fill="url(#cg)" dot={false} />
                  <Tooltip content={<CustomTooltip fmt={v => v + "K"} />} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div style={{ flex: 1, minWidth: 180 }}>
              <p style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8 }}>Audience Origin</p>
              <ResponsiveContainer width="100%" height={120}>
                <PieChart>
                  <Pie data={D_COUNTRY} cx="50%" cy="50%" innerRadius={30} outerRadius={52} paddingAngle={2} dataKey="value">
                    {D_COUNTRY.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip fmt={v => v + "%"} />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ flex: 1.2, minWidth: 200 }}>
              <p style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8 }}>Follower Quality</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, paddingTop: 6 }}>
                {D_BOT.map(({ name, value, color }) => (
                  <div key={name} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }} />
                    <div style={{ flex: 1, height: 7, background: "#F3F4F6", borderRadius: 4, overflow: "hidden" }}>
                      <div style={{ width: `${value}%`, height: "100%", background: color, borderRadius: 4, transition: "width 1.2s ease" }} />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#374151", width: 36, textAlign: "right" }}>{value}%</span>
                    <span style={{ fontSize: 11, color: "#9CA3AF", width: 60 }}>{name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div style={{ marginTop: 20, textAlign: "center" }}>
            <button className="btn btn-primary" onClick={onCTA} style={{ fontSize: 13 }}>
              Run a Full Analysis <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function PricingSection({ onCTA }) {
  return (
    <section className="white-grid" style={{ padding: "80px 24px" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <h2 className="font-display" style={{ fontSize: "clamp(26px,3.5vw,38px)", fontWeight: 800, color: "#111827", letterSpacing: "-.025em", marginBottom: 12 }}>
            Simple, transparent pricing
          </h2>
          <p style={{ fontSize: 15, color: "#6B7280" }}>Start free. Scale when you need to.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}>
          {PLANS.map(({ n, p, per, highlight, cta, features }) => (
            <div key={n} className="card" style={{
              padding: 28,
              border: highlight ? "1.5px solid #0284C7" : "1px solid #E5E7EB",
              boxShadow: highlight ? "0 8px 40px rgba(2,132,199,.12)" : undefined,
              position: "relative"
            }}>
              {highlight && (
                <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)" }}>
                  <span className="tag" style={{ background: "#0284C7", color: "white", fontSize: 10 }}><Star size={9} fill="white" /> Most Popular</span>
                </div>
              )}
              <p style={{ fontSize: 13, fontWeight: 600, color: "#6B7280", marginBottom: 8 }}>{n}</p>
              <div style={{ marginBottom: 4 }}>
                <span className="font-display" style={{ fontSize: 38, fontWeight: 800, color: "#111827", letterSpacing: "-.03em" }}>${p}</span>
                <span style={{ fontSize: 13, color: "#9CA3AF", marginLeft: 4 }}>/{per}</span>
              </div>
              <div style={{ borderTop: "1px solid #F3F4F6", margin: "20px 0", paddingTop: 20 }}>
                {features.map(f => (
                  <div key={f} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 10 }}>
                    <CheckCircle size={14} color={highlight ? "#0284C7" : "#22C55E"} style={{ flexShrink: 0, marginTop: 1 }} />
                    <span style={{ fontSize: 13, color: "#374151" }}>{f}</span>
                  </div>
                ))}
              </div>
              <button className={`btn ${highlight ? "btn-primary" : "btn-outline"}`} onClick={onCTA}
                style={{ width: "100%", justifyContent: "center", fontSize: 14 }}>
                {cta}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function LandingPage({ onAnalyze, onAuth }) {
  return (
    <div>
      <style>{CSS}</style>
      <LandingNav onAuth={onAuth} />
      <Hero onAnalyze={onAnalyze} />
      <FeaturesSection />
      <DemoSection onCTA={() => onAuth("signup")} />
      <PricingSection onCTA={() => onAuth("signup")} />
      <footer style={{ background: "#050D1A", padding: "40px 32px", borderTop: "1px solid rgba(255,255,255,.06)" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 24, height: 24, background: "linear-gradient(135deg,#38BDF8,#0284C7)", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Eye size={12} color="white" />
            </div>
            <span className="font-display" style={{ color: "rgba(255,255,255,.7)", fontWeight: 700, fontSize: 15 }}>InstaIQ</span>
          </div>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,.25)" }}>
            For public accounts only. Not affiliated with Instagram or Meta.
          </p>
        </div>
      </footer>
    </div>
  );
}

/* ─── DASHBOARD SHELL ─────────────────────────────────────────────────────── */
function Sidebar({ active, setActive, username }) {
  return (
    <aside className="sidebar" style={{ padding: "0 12px" }}>
      <div style={{ padding: "20px 12px 16px", borderBottom: "1px solid #F3F4F6" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 28, height: 28, background: "linear-gradient(135deg,#38BDF8,#0284C7)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Eye size={14} color="white" />
          </div>
          <span className="font-display" style={{ fontWeight: 700, fontSize: 17, color: "#111827", letterSpacing: "-.02em" }}>InstaIQ</span>
        </div>
      </div>
      <div style={{ padding: "16px 0", flex: 1 }}>
        <p style={{ fontSize: 10, fontWeight: 700, color: "#D1D5DB", letterSpacing: ".08em", padding: "0 12px", marginBottom: 6 }}>NAVIGATION</p>
        {NAV.map(({ id, icon: Icon, label }) => (
          <div key={id} className={`nav-item ${active === id ? "active" : ""}`} onClick={() => setActive(id)}>
            <Icon size={16} />
            <span>{label}</span>
          </div>
        ))}
      </div>
      <div style={{ padding: "12px 0 16px", borderTop: "1px solid #F3F4F6" }}>
        <div style={{ display: "flex", align: "center", gap: 10, padding: "10px 12px", borderRadius: 8, cursor: "pointer" }}
          onMouseEnter={e => e.currentTarget.style.background = "#F9FAFB"}
          onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
          <div style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg,#0284C7,#38BDF8)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span style={{ color: "white", fontSize: 12, fontWeight: 700 }}>{(username || "U")[0].toUpperCase()}</span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#111827", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{username || "User"}</p>
            <p style={{ fontSize: 11, color: "#9CA3AF" }}>Free plan</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

function Topbar({ activeView, searchedUser, onNewAnalysis }) {
  const [query, setQuery] = useState("");
  return (
    <div className="topbar">
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 8, padding: "7px 12px", maxWidth: 340 }}>
          <Search size={14} color="#9CA3AF" />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search accounts..."
            style={{ background: "transparent", border: "none", outline: "none", fontSize: 13, color: "#374151", fontFamily: "'DM Sans',sans-serif", flex: 1 }} />
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ padding: "6px 12px", background: "#EFF6FF", borderRadius: 6, display: "flex", alignItems: "center", gap: 6 }}>
          <Zap size={11} color="#0284C7" />
          <span style={{ fontSize: 11, fontWeight: 700, color: "#0284C7" }}>3/3 analyses today</span>
        </div>
        <button style={{ width: 34, height: 34, borderRadius: 8, border: "1px solid #E5E7EB", background: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
          <Bell size={15} color="#6B7280" />
          <div style={{ position: "absolute", top: 6, right: 6, width: 6, height: 6, borderRadius: "50%", background: "#EF4444", border: "1.5px solid white" }} />
        </button>
        <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#0284C7,#38BDF8)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <span style={{ color: "white", fontSize: 12, fontWeight: 700 }}>V</span>
        </div>
      </div>
    </div>
  );
}

/* ─── DASHBOARD VIEWS ─────────────────────────────────────────────────────── */
function DashboardHome({ setActive, setAnalysisUser }) {
  const total = useCountUp(2481930, 2000);
  return (
    <div style={{ padding: 28 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 className="font-display" style={{ fontSize: 24, fontWeight: 800, color: "#111827", letterSpacing: "-.02em", marginBottom: 4 }}>Dashboard</h1>
        <p style={{ fontSize: 14, color: "#6B7280" }}>Overview of your recent analyses and account activity.</p>
      </div>

      {/* Quick Analyze */}
      <div className="card" style={{ padding: 24, marginBottom: 24, background: "linear-gradient(135deg,#0F172A,#1E293B)", border: "none", overflow: "hidden", position: "relative" }}>
        <div style={{ position: "absolute", right: -20, top: -20, width: 180, height: 180, borderRadius: "50%", background: "radial-gradient(circle,rgba(56,189,248,.15),transparent 70%)" }} />
        <h2 className="font-display" style={{ fontSize: 18, fontWeight: 700, color: "white", marginBottom: 6 }}>Analyze a new account</h2>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,.45)", marginBottom: 16 }}>Enter any public Instagram username to get AI-powered audience insights.</p>
        <div style={{ display: "flex", gap: 8, maxWidth: 420 }}>
          <div style={{ flex: 1, display: "flex", align: "center", background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.12)", borderRadius: 8, padding: "0 12px" }}>
            <span style={{ color: "rgba(255,255,255,.3)", fontSize: 15, display: "flex", alignItems: "center" }}>@</span>
            <input id="qainput" placeholder="username" style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "white", fontSize: 14, padding: "10px 8px", fontFamily: "'DM Sans',sans-serif" }} />
          </div>
          <button className="btn btn-primary" style={{ fontSize: 13, flexShrink: 0 }}
            onClick={() => { const v = document.getElementById("qainput")?.value; if (v) { setAnalysisUser(v); setActive("analysis"); } }}>
            Analyze <ArrowRight size={13} />
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24 }}>
        {[
          { label: "Total Analyses", val: "247", delta: "+12 this week", up: true, icon: Activity },
          { label: "Accounts in DB", val: (total / 1e6).toFixed(1) + "M", delta: "growing", up: true, icon: Users },
          { label: "Avg Quality Score", val: "74.2", delta: "+2.4 pts", up: true, icon: Award },
          { label: "Bot Rate (avg)", val: "13.4%", delta: "-0.8%", up: false, icon: Shield },
        ].map(({ label, val, delta, up, icon: Icon }) => (
          <div key={label} className="card" style={{ padding: "18px 20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <p style={{ fontSize: 12, color: "#9CA3AF", fontWeight: 500 }}>{label}</p>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: "#F9FAFB", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon size={14} color="#0284C7" />
              </div>
            </div>
            <p className="stat-value" style={{ fontSize: 24, marginBottom: 4 }}>{val}</p>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <ArrowUpRight size={11} color={up ? "#22C55E" : "#EF4444"} style={{ transform: up ? "none" : "rotate(90deg)" }} />
              <span style={{ fontSize: 11, color: up ? "#22C55E" : "#EF4444", fontWeight: 600 }}>{delta}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Recent analyses */}
      <div className="card" style={{ overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #F3F4F6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 className="font-display" style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>Recent Analyses</h3>
          <button className="btn btn-ghost" style={{ fontSize: 12, padding: "6px 10px" }} onClick={() => setActive("history")}>View all <ChevronRight size={12} /></button>
        </div>
        {RECENT.map(({ u, f, s, t, v }) => (
          <div key={u} style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 20px", borderBottom: "1px solid #F9FAFB", cursor: "pointer", transition: "background .15s" }}
            onMouseEnter={e => e.currentTarget.style.background = "#FAFAFA"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            onClick={() => { setAnalysisUser(u); setActive("analysis"); }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#0284C7,#38BDF8)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ color: "white", fontWeight: 700, fontSize: 14 }}>@</span>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>@{u}</span>
                {v && <span className="tag tag-blue" style={{ fontSize: 9, padding: "1px 6px" }}>Verified</span>}
              </div>
              <span style={{ fontSize: 12, color: "#9CA3AF" }}>{f} followers</span>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ marginBottom: 3 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: s >= 80 ? "#22C55E" : s >= 60 ? "#F59E0B" : "#EF4444" }}>{s}/100</span>
              </div>
              <span style={{ fontSize: 11, color: "#D1D5DB" }}>{t}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AnalysisView({ user }) {
  const [loading, setLoading] = useState(true);
  const displayUser = user || "cristiano";

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 1800);
    return () => clearTimeout(t);
  }, [user]);

  if (loading) return <AnalysisSkeleton user={displayUser} />;

  return (
    <div style={{ padding: 28 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: "linear-gradient(135deg,#0284C7,#38BDF8)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "white", fontWeight: 800, fontSize: 20 }}>@</span>
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
              <h1 className="font-display" style={{ fontSize: 22, fontWeight: 800, color: "#111827", letterSpacing: "-.02em" }}>@{displayUser}</h1>
              <span className="tag tag-blue">Verified</span>
              <span className="tag tag-green">Analysis Complete</span>
            </div>
            <p style={{ fontSize: 13, color: "#6B7280" }}>Last analyzed: just now. 5,000 followers sampled (free plan).</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-outline" style={{ fontSize: 13, padding: "8px 14px" }}><Download size={13} /> Export</button>
          <button className="btn btn-primary" style={{ fontSize: 13, padding: "8px 14px" }}><RefreshCw size={13} /> Re-analyze</button>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 14, marginBottom: 22 }}>
        {[
          { label: "Total Followers", val: "631M", sub: "+2.4M this month", color: "#0284C7", icon: Users },
          { label: "Verified %", val: "2.3%", sub: "14.5M accounts", color: "#7C3AED", icon: Award },
          { label: "Inactive %", val: "18.4%", sub: "Below avg. of 22%", color: "#F59E0B", icon: Eye },
          { label: "Engagement Score", val: "7.2", sub: "Top 8% globally", color: "#22C55E", icon: TrendingUp },
          { label: "Quality Score", val: null, score: 86, color: "#22C55E", icon: Shield },
        ].map(({ label, val, sub, color, icon: Icon, score }) => (
          <div key={label} className="card" style={{ padding: "16px 18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <p style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 500 }}>{label}</p>
              <Icon size={13} color={color} />
            </div>
            {score ? (
              <div style={{ display: "flex", justifyContent: "center" }}><ScoreRing score={score} size={70} /></div>
            ) : (
              <>
                <p className="stat-value" style={{ fontSize: 22 }}>{val}</p>
                {sub && <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 4 }}>{sub}</p>}
              </>
            )}
          </div>
        ))}
      </div>

      {/* Growth + Country */}
      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 18, marginBottom: 18 }}>
        <div className="card" style={{ padding: 22 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
            <h3 className="font-display" style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>Follower Growth</h3>
            <span className="tag tag-green" style={{ fontSize: 10 }}><TrendingUp size={9} /> +34.1% YoY</span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={D_GROWTH}>
              <defs><linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#0284C7" stopOpacity={.18} /><stop offset="95%" stopColor="#0284C7" stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="m" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} tickFormatter={v => v + "K"} />
              <Tooltip content={<CustomTooltip fmt={v => v + "K followers"} />} />
              <Area type="monotone" dataKey="v" stroke="#0284C7" strokeWidth={2.5} fill="url(#g1)" dot={{ fill: "#0284C7", strokeWidth: 0, r: 3 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card" style={{ padding: 22 }}>
          <h3 className="font-display" style={{ fontSize: 15, fontWeight: 700, color: "#111827", marginBottom: 18 }}>Country Distribution</h3>
          <ResponsiveContainer width="100%" height={120}>
            <PieChart>
              <Pie data={D_COUNTRY} cx="50%" cy="50%" innerRadius={35} outerRadius={55} paddingAngle={3} dataKey="value">
                {D_COUNTRY.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip content={<CustomTooltip fmt={v => v + "%"} />} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", flexDirection: "column", gap: 5, marginTop: 8 }}>
            {D_COUNTRY.slice(0, 4).map(({ name, value, color }) => (
              <div key={name} style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: color, flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: "#374151", flex: 1 }}>{name}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#111827" }}>{value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Language + Bot detection + Engagement */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 18, marginBottom: 18 }}>
        <div className="card" style={{ padding: 22 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
            <Languages size={15} color="#0284C7" />
            <h3 className="font-display" style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>Language Analytics</h3>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={D_LANG} layout="vertical" margin={{ left: 0, right: 16 }}>
              <XAxis type="number" tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} tickFormatter={v => v + "%"} />
              <YAxis type="category" dataKey="lang" tick={{ fontSize: 12, fill: "#374151" }} axisLine={false} tickLine={false} width={54} />
              <Tooltip content={<CustomTooltip fmt={v => v + "%"} />} />
              <Bar dataKey="pct" fill="#0284C7" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card" style={{ padding: 22 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
            <Shield size={15} color="#EF4444" />
            <h3 className="font-display" style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>Fake Follower Detection</h3>
          </div>
          <ResponsiveContainer width="100%" height={110}>
            <PieChart>
              <Pie data={D_BOT} cx="50%" cy="50%" innerRadius={32} outerRadius={50} paddingAngle={2} dataKey="value">
                {D_BOT.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip content={<CustomTooltip fmt={v => v + "%"} />} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", flexDirection: "column", gap: 7, marginTop: 8 }}>
            {D_BOT.map(({ name, value, color }) => (
              <div key={name} style={{ display: "flex", align: "center", gap: 7 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0, marginTop: 4 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                    <span style={{ fontSize: 12, color: "#374151" }}>{name}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color }}>{value}%</span>
                  </div>
                  <div style={{ height: 4, background: "#F3F4F6", borderRadius: 2, overflow: "hidden" }}>
                    <div style={{ width: `${value}%`, height: "100%", background: color, borderRadius: 2 }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card" style={{ padding: 22 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
            <Activity size={15} color="#22C55E" />
            <h3 className="font-display" style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>Engagement Rate</h3>
          </div>
          <ResponsiveContainer width="100%" height={170}>
            <BarChart data={D_ENG}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="d" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} tickFormatter={v => v + "%"} />
              <Tooltip content={<CustomTooltip fmt={v => v + "%"} />} />
              <Bar dataKey="r" fill="#22C55E" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bio Intelligence */}
      <div className="card" style={{ padding: 22 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
          <Hash size={15} color="#7C3AED" />
          <h3 className="font-display" style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>Bio Intelligence</h3>
          <span className="tag tag-purple" style={{ fontSize: 9 }}>NLP Analysis</span>
        </div>
        <p style={{ fontSize: 12, color: "#9CA3AF", marginBottom: 14 }}>Top keywords, professions, and interests extracted from follower bios.</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {D_BIO.map(({ t, c }) => {
            const size = Math.max(11, Math.min(18, 11 + (c / 12840) * 7));
            const opacity = 0.5 + (c / 12840) * 0.5;
            return (
              <span key={t} style={{ padding: "5px 12px", borderRadius: 20, background: `rgba(2,132,199,${opacity * .12})`, border: `1px solid rgba(2,132,199,${opacity * .25})`, fontSize: size, fontWeight: 600, color: `rgba(2,100,185,${0.6 + opacity * 0.4})`, cursor: "default", transition: "all .15s" }}
                onMouseEnter={e => { e.target.style.background = "#EFF6FF"; e.target.style.borderColor = "#0284C7"; }}
                onMouseLeave={e => { e.target.style.background = `rgba(2,132,199,${opacity * .12})`; e.target.style.borderColor = `rgba(2,132,199,${opacity * .25})`; }}>
                {t}
                <span style={{ fontSize: 10, color: "#9CA3AF", marginLeft: 5 }}>{(c / 1000).toFixed(1)}K</span>
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function AnalysisSkeleton({ user }) {
  return (
    <div style={{ padding: 28 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 32 }}>
        <div className="skeleton" style={{ width: 52, height: 52, borderRadius: 14 }} />
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <div className="skeleton" style={{ width: 180, height: 22 }} />
            <div className="skeleton" style={{ width: 60, height: 18, borderRadius: 20 }} />
          </div>
          <div className="skeleton" style={{ width: 280, height: 14 }} />
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 20px", background: "#F0F9FF", border: "1px solid #BAE6FD", borderRadius: 10, marginBottom: 24 }}>
        <Loader2 size={16} color="#0284C7" style={{ animation: "spin 1s linear infinite" }} />
        <span style={{ fontSize: 14, color: "#0284C7", fontWeight: 500 }}>Analyzing <strong>@{user}</strong>. Sampling followers, running NLP pipeline...</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 14, marginBottom: 22 }}>
        {[...Array(5)].map((_, i) => <div key={i} className="skeleton" style={{ height: 90, borderRadius: 12 }} />)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 18 }}>
        <div className="skeleton" style={{ height: 240, borderRadius: 12 }} />
        <div className="skeleton" style={{ height: 240, borderRadius: 12 }} />
      </div>
    </div>
  );
}

function CompareView() {
  return (
    <div style={{ padding: 28 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 className="font-display" style={{ fontSize: 22, fontWeight: 800, color: "#111827", letterSpacing: "-.02em", marginBottom: 4 }}>Compare Accounts</h1>
        <p style={{ fontSize: 14, color: "#6B7280" }}>Map audience overlap between two public Instagram accounts.</p>
      </div>
      <div className="card" style={{ padding: 28, marginBottom: 20 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 16, alignItems: "center" }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: ".06em", display: "block", marginBottom: 8 }}>Account A</label>
            <div style={{ display: "flex", alignItems: "center", border: "1px solid #E5E7EB", borderRadius: 8, padding: "10px 14px", gap: 8 }}>
              <span style={{ color: "#9CA3AF", fontSize: 15 }}>@</span>
              <input placeholder="username" className="input" style={{ border: "none", padding: 0, flex: 1 }} />
            </div>
          </div>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", marginTop: 20 }}>
            <GitCompare size={16} color="#6B7280" />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: ".06em", display: "block", marginBottom: 8 }}>Account B</label>
            <div style={{ display: "flex", alignItems: "center", border: "1px solid #E5E7EB", borderRadius: 8, padding: "10px 14px", gap: 8 }}>
              <span style={{ color: "#9CA3AF", fontSize: 15 }}>@</span>
              <input placeholder="username" className="input" style={{ border: "none", padding: 0, flex: 1 }} />
            </div>
          </div>
        </div>
        <div style={{ marginTop: 20, display: "flex", justifyContent: "flex-end" }}>
          <button className="btn btn-primary" style={{ fontSize: 13 }}>Compare Audiences <ArrowRight size={13} /></button>
        </div>
      </div>
      <div className="card" style={{ padding: 40, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#FAFAFA" }}>
        <Network size={40} color="#E5E7EB" style={{ marginBottom: 16 }} />
        <p className="font-display" style={{ fontSize: 16, fontWeight: 700, color: "#111827", marginBottom: 8 }}>Mutual followers network graph</p>
        <p style={{ fontSize: 13, color: "#9CA3AF", textAlign: "center", maxWidth: 360 }}>Enter two accounts above and run a comparison to see audience overlap, mutual followers, and shared interests visualized as an interactive network.</p>
        <span className="tag tag-purple" style={{ marginTop: 14, fontSize: 10 }}>Pro Feature</span>
      </div>
    </div>
  );
}

function ReportsView() {
  const reports = [
    { name: "@cristiano", date: "27 May 2026", pages: 12, score: 91, size: "3.4 MB" },
    { name: "@leomessi", date: "26 May 2026", pages: 10, score: 88, size: "2.9 MB" },
    { name: "@priyankachopra", date: "25 May 2026", pages: 11, score: 74, size: "3.1 MB" },
    { name: "@virat.kohli", date: "24 May 2026", pages: 9, score: 85, size: "2.7 MB" },
  ];
  return (
    <div style={{ padding: 28 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 className="font-display" style={{ fontSize: 22, fontWeight: 800, color: "#111827", letterSpacing: "-.02em", marginBottom: 4 }}>Reports</h1>
          <p style={{ fontSize: 14, color: "#6B7280" }}>Download or share your analysis reports.</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-outline" style={{ fontSize: 13, padding: "8px 14px" }}><Filter size={13} /> Filter</button>
        </div>
      </div>
      <div className="card" style={{ overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", padding: "12px 20px", background: "#F9FAFB", borderBottom: "1px solid #F3F4F6" }}>
          {["Account", "Generated", "Score", "Pages", "Actions"].map(h => (
            <span key={h} style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: ".06em" }}>{h}</span>
          ))}
        </div>
        {reports.map(({ name, date, pages, score, size }) => (
          <div key={name} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", padding: "16px 20px", borderBottom: "1px solid #F9FAFB", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg,#0284C7,#38BDF8)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ color: "white", fontWeight: 700, fontSize: 13 }}>@</span>
              </div>
              <span style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>{name}</span>
            </div>
            <span style={{ fontSize: 13, color: "#6B7280" }}>{date}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: score >= 80 ? "#22C55E" : "#F59E0B" }}>{score}/100</span>
            <span style={{ fontSize: 13, color: "#6B7280" }}>{pages} pages</span>
            <div style={{ display: "flex", gap: 6 }}>
              <button className="btn btn-outline" style={{ padding: "5px 10px", fontSize: 11 }}><Download size={11} /> PDF</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function HistoryView({ setAnalysisUser, setActive }) {
  return (
    <div style={{ padding: 28 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 className="font-display" style={{ fontSize: 22, fontWeight: 800, color: "#111827", letterSpacing: "-.02em", marginBottom: 4 }}>Analysis History</h1>
        <p style={{ fontSize: 14, color: "#6B7280" }}>All accounts you have analyzed. Click to view cached results.</p>
      </div>
      <div className="card" style={{ overflow: "hidden" }}>
        {[...RECENT, ...RECENT].map(({ u, f, s, t, v }, i) => (
          <div key={`${u}-${i}`} style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 20px", borderBottom: "1px solid #F9FAFB", cursor: "pointer", transition: "background .15s" }}
            onMouseEnter={e => e.currentTarget.style.background = "#FAFAFA"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            onClick={() => { setAnalysisUser(u); setActive("analysis"); }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#0284C7,#38BDF8)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "white", fontWeight: 700, fontSize: 14 }}>@</span>
            </div>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>@{u}</span>
              <p style={{ fontSize: 12, color: "#9CA3AF" }}>{f} followers</p>
            </div>
            <span className="tag tag-green" style={{ fontSize: 10 }}>Cached</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: s >= 80 ? "#22C55E" : "#F59E0B" }}>{s}/100</span>
            <span style={{ fontSize: 11, color: "#D1D5DB", width: 80, textAlign: "right" }}>{t}</span>
            <ChevronRight size={14} color="#D1D5DB" />
          </div>
        ))}
      </div>
    </div>
  );
}

function SettingsView() {
  return (
    <div style={{ padding: 28 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 className="font-display" style={{ fontSize: 22, fontWeight: 800, color: "#111827", letterSpacing: "-.02em", marginBottom: 4 }}>Settings</h1>
        <p style={{ fontSize: 14, color: "#6B7280" }}>Manage your account and usage preferences.</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: 20 }}>
        <div className="card" style={{ padding: 22 }}>
          <h3 className="font-display" style={{ fontSize: 15, fontWeight: 700, color: "#111827", marginBottom: 16 }}>Plan Usage</h3>
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 13, color: "#374151" }}>Daily analyses</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>3/3</span>
            </div>
            <div style={{ height: 6, background: "#F3F4F6", borderRadius: 3 }}>
              <div style={{ width: "100%", height: "100%", background: "#EF4444", borderRadius: 3 }} />
            </div>
          </div>
          <div style={{ padding: "14px 16px", background: "#EFF6FF", borderRadius: 8, border: "1px solid #BAE6FD", marginTop: 16 }}>
            <p className="font-display" style={{ fontSize: 14, fontWeight: 700, color: "#0284C7", marginBottom: 4 }}>Upgrade to Pro</p>
            <p style={{ fontSize: 12, color: "#0369A1" }}>Unlock unlimited analyses, full scans, and AI insights for $29/mo.</p>
            <button className="btn btn-primary" style={{ marginTop: 10, fontSize: 12, padding: "7px 14px" }}>Upgrade Now</button>
          </div>
        </div>
        <div className="card" style={{ padding: 22 }}>
          <h3 className="font-display" style={{ fontSize: 15, fontWeight: 700, color: "#111827", marginBottom: 16 }}>Account Details</h3>
          {[["Name", "Vaibhav"], ["Email", "v@erasky.in"], ["Plan", "Free"], ["API Key", "Not available on free plan"]].map(([label, val]) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "11px 0", borderBottom: "1px solid #F9FAFB" }}>
              <span style={{ fontSize: 13, color: "#9CA3AF", fontWeight: 500 }}>{label}</span>
              <span style={{ fontSize: 13, fontWeight: 500, color: "#374151" }}>{val}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── APP SHELL (DASHBOARD) ───────────────────────────────────────────────── */
function AppShell({ loginUser, initialUsername }) {
  const [active, setActive] = useState(initialUsername ? "analysis" : "home");
  const [analysisUser, setAnalysisUser] = useState(initialUsername || "");

  const views = {
    home: <DashboardHome setActive={setActive} setAnalysisUser={setAnalysisUser} />,
    analysis: <AnalysisView user={analysisUser} />,
    compare: <CompareView />,
    reports: <ReportsView />,
    history: <HistoryView setAnalysisUser={setAnalysisUser} setActive={setActive} />,
    settings: <SettingsView />,
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#F9FAFB" }}>
      <Sidebar active={active} setActive={setActive} username={loginUser} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <Topbar activeView={active} searchedUser={analysisUser} onNewAnalysis={() => {}} />
        <main style={{ flex: 1, overflow: "auto" }}>
          {views[active]}
        </main>
      </div>
    </div>
  );
}

/* ─── AUTH MODAL ──────────────────────────────────────────────────────────── */
function AuthModal({ mode, onClose, onSuccess }) {
  const [m, setM] = useState(mode);
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = () => {
    if (!email) return;
    setLoading(true);
    setTimeout(() => { setLoading(false); onSuccess(email.split("@")[0]); }, 1000);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="card au" style={{ width: 400, padding: 36, boxShadow: "0 24px 80px rgba(0,0,0,.18)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 26, height: 26, background: "linear-gradient(135deg,#38BDF8,#0284C7)", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Eye size={12} color="white" />
            </div>
            <span className="font-display" style={{ fontWeight: 700, fontSize: 16, color: "#111827" }}>InstaIQ</span>
          </div>
          <button className="btn btn-ghost" style={{ padding: 6, borderRadius: 6 }} onClick={onClose}><X size={16} /></button>
        </div>
        <h2 className="font-display" style={{ fontSize: 22, fontWeight: 800, color: "#111827", marginBottom: 6, letterSpacing: "-.02em" }}>
          {m === "login" ? "Welcome back" : "Create your account"}
        </h2>
        <p style={{ fontSize: 13, color: "#9CA3AF", marginBottom: 24 }}>
          {m === "login" ? "Sign in to access your dashboard." : "Start analyzing Instagram audiences for free."}
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>Email</label>
            <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>Password</label>
            <input className="input" type="password" value={pass} onChange={e => setPass(e.target.value)} placeholder="••••••••" onKeyDown={e => e.key === "Enter" && submit()} />
          </div>
          <button className="btn btn-primary" onClick={submit} style={{ width: "100%", justifyContent: "center", marginTop: 6, padding: "12px", fontSize: 14 }}>
            {loading ? <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> : (m === "login" ? "Sign In" : "Create Account")}
          </button>
        </div>
        <p style={{ fontSize: 13, color: "#9CA3AF", textAlign: "center", marginTop: 20 }}>
          {m === "login" ? "No account?" : "Already have an account?"}{" "}
          <span style={{ color: "#0284C7", fontWeight: 600, cursor: "pointer" }} onClick={() => setM(m === "login" ? "signup" : "login")}>
            {m === "login" ? "Sign up free" : "Sign in"}
          </span>
        </p>
      </div>
    </div>
  );
}

/* ─── ROOT APP ────────────────────────────────────────────────────────────── */
export default function App() {
  const [page, setPage] = useState("landing");
  const [auth, setAuth] = useState(null);
  const [user, setUser] = useState(null);
  const [pendingUser, setPendingUser] = useState("");

  const handleAnalyze = (username) => {
    setPendingUser(username);
    setAuth("signup");
  };
  const handleAuth = (mode) => setAuth(mode);
  const handleAuthSuccess = (u) => {
    setUser(u);
    setAuth(null);
    setPage("dashboard");
  };

  if (page === "dashboard" && user) {
    return (
      <>
        <style>{CSS}</style>
        <AppShell loginUser={user} initialUsername={pendingUser} />
      </>
    );
  }

  return (
    <>
      <LandingPage onAnalyze={handleAnalyze} onAuth={handleAuth} />
      {auth && <AuthModal mode={auth} onClose={() => setAuth(null)} onSuccess={handleAuthSuccess} />}
    </>
  );
}
