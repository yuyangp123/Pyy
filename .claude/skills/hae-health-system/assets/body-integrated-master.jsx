// body-integrated 母版(3 tab: ⚡现在状态 Realtime + 😴睡眠 SleepVF + 🔥热量 WeightEngine)
// 来源:Notion《Health Auto Export 数据系统》主页底部「母版完整代码」(2026-06-16 实时重构版)。
// 全系统唯一一份完整示例;每天用最新 HAE splice 在前一天文件上改。
// 4 套色板 key: Cs(睡眠)/Cu(?)/Cw(热量)/Cr(现在状态);recharts 图元须独立直接子级,不包 Fragment。

import React, { useState, useEffect } from "react";

function useIsDark() {
  const [d, setD] = useState(typeof window !== "undefined" && window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)").matches : true);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const h = (e) => setD(e.matches);
    mq.addEventListener ? mq.addEventListener("change", h) : mq.addListener(h);
    return () => { mq.removeEventListener ? mq.removeEventListener("change", h) : mq.removeListener(h); };
  }, []);
  return d;
}
import {
  ComposedChart, Line, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ReferenceArea, ReferenceDot, ResponsiveContainer,
} from "recharts";

/* ══════════════════════════════════════════════════════════════════════
   实时整合报告 · 数据截至 2026-06-16(周二)· 大餐次日
   顶层 3 tab(原「实时」+「现在状态」已合并去重):
     ① 现在状态 = UPCSE 5 分 + 5 潜变量 + §9 五通道(6/16 晨:HRV 81↑、RHR 45、腿 DOMS 9/10 见顶)
     😴 睡眠/恢复 = hypnogram + HRV/HR 自主神经(6/15 夜 → 6/16 晨,深睡 0.48h 偏低=大餐压)
     🔥 热量/体重 = 脂肪 vs 水去噪(6/15 Nora 大餐盈余;体重 80.25 +0.65=水非脂)
                   + 能量审计(6/13 比赛日 + 6/15 大餐均已记)
   ══════════════════════════════════════════════════════════════════════ */

/* ════ palette ════ */
const mkCs = (d) => (d ? {
  bg:"#1c1c1e", card:"#2a2a2c", cardEdge:"#3a3a3c", ink:"#f2f2f7", sub:"#a1a1aa", faint:"#71717a",
  awake:"#fb923c", rem:"#a78bfa", core:"#60a5fa", deep:"#818cf8", hr:"#f43f5e", hrv:"#2dd4bf",
  good:"#4ade80", goodBg:"#143a26", amber:"#fbbf24", amberBg:"#3a2a06", red:"#f87171",
  track:"#242426", gridln:"#3a3a3c", lane1:"#242426", lane2:"#2a2a2c", chipGood:"#143a26", chipAmber:"#3a2a06", chipNeutral:"#2a2a2c",
} : {
  bg:"#fdf8ea", card:"#fffdf4", cardEdge:"#ece3c8", ink:"#1c1917", sub:"#57534e", faint:"#8a857c",
  awake:"#ea580c", rem:"#7c3aed", core:"#2563eb", deep:"#4338ca", hr:"#e11d48", hrv:"#0d9488",
  good:"#16a34a", goodBg:"#dcfce7", amber:"#d97706", amberBg:"#fef3c7", red:"#dc2626",
  track:"#f1ead4", gridln:"#e6dcc0", lane1:"#f7f0db", lane2:"#fffdf4", chipGood:"#dcfce7", chipAmber:"#fef3c7", chipNeutral:"#f1ead4",
});
let Cs = mkCs(true);
const HRV_LO = 65, HRV_HI = 85;

/* ════ 6/15夜→6/16晨 · Apple Watch + 自主神经仲裁 · Nora 大餐次日 ════ */
const S = {
  total: 7.29, core: 4.78, deep: 0.48, rem: 2.03, awake: 0.61, inbed: 7.90, eff: 92,
  rhr: 45, hrvAvg: 81, hrvEarly: 73, hrvLate: 97,
  deepTrueLo: 0.62, deepTrueHi: 0.87,
};

/* 三视角对照 */
const SOURCES = [
  { name: "时长", sub: "23:26 上床 · 07:20 醒", tst: "7.29h", eff: "在床7.9h", note: "入睡偏晚(Nora 大餐后),但整夜尚可 —— 在床 7.9h 睡 7.29h,效率 92%", tone: "good" },
  { name: "自主神经", sub: "HRV + HR 仲裁", tst: "HRV 81", eff: "RHR ~45", note: "HRV 中位 81ms(↓vs 昨 89,仍 >基线 72)+ 深睡 HR 谷底 40–43 —— 副交感主导;RHR 回落 ~45(昨赛后 52 已恢复)", tone: "good" },
  { name: "深睡偏低", sub: "大餐代价", tst: "Deep 0.48h", eff: "呼吸 15.1↑", note: "总时长↑但深睡仅 0.48h(29min)偏低 + 呼吸 15.1 略升 —— 晚间大餐压深睡;REM 2.03h 仍好", tone: "amber" },
];

/* hypnogram 段 [起min,止min,阶段] · 0=23:00;阶段总量=实测,时序按 HRV/HR + 周期仲裁 · 入睡23:26 醒07:20 */
const SEG = [
  [26, 62, "core"], [62, 80, "deep"], [80, 110, "core"], [110, 128, "rem"], [128, 136, "awake"],
  [136, 178, "core"], [178, 189, "deep"], [189, 223, "rem"], [223, 261, "core"], [261, 268, "awake"],
  [268, 298, "rem"], [298, 343, "core"], [343, 351, "awake"], [351, 373, "rem"], [373, 411, "core"],
  [411, 429, "rem"], [429, 436, "awake"], [436, 468, "core"], [468, 475, "awake"], [475, 500, "core"],
];
/* 夜间 HRV SDNN [min,ms] · 逐时,中位 81ms,06:00 峰 97 */
const HRV = [
  [60, 73.5], [120, 62.9], [180, 84.6], [240, 77.9], [300, 74.7], [360, 85.6], [420, 96.7], [480, 91.9],
];
/* 夜间 HR 均值 [min,bpm] · 逐时,深睡段谷底 ~40–43(RHR ~45,昨52已恢复) */
const HRD = [
  [60, 48], [120, 49], [180, 46], [240, 47], [300, 44], [360, 43], [420, 44], [480, 50],
];
const STG = { awake: { c: Cs.awake, n: "清醒" }, rem: { c: Cs.rem, n: "REM" }, core: { c: Cs.core, n: "浅睡" }, deep: { c: Cs.deep, n: "深睡" } };

const CHIPS = [
  { k: "deep", label: "深睡", val: "0.48h", pct: "7%", tone: "amber", note: "偏低(29min) —— 大餐压深睡;Apple 低估,还原后 ~0.6–0.9h" },
  { k: "core", label: "浅睡", val: "4.78h", pct: "66%", tone: "core", note: "主体,稳定连续" },
  { k: "rem", label: "REM", val: "2.03h", pct: "28%", tone: "good", note: "REM 充足 —— 情绪整合 + 记忆固化够" },
  { k: "awake", label: "清醒", val: "0.61h", pct: "—", tone: "good", note: "仅醒 0.6h,效率 92%,整夜尚可" },
];

function SleepVF() {
  const W = 880, L = 70, R = 838, T = 16, laneH = 28, T_END = 570;
  const xs = (m) => L + (m / T_END) * (R - L);
  const laneY = { awake: T, rem: T + laneH, core: T + 2 * laneH, deep: T + 3 * laneH };
  const auTop = 150, auBot = 300;
  const hrMin = 40, hrMax = 80, hrvMin = 30, hrvMax = 140;
  const hrY = (v) => auBot - ((v - hrMin) / (hrMax - hrMin)) * (auBot - auTop);
  const hrvY = (v) => auBot - ((v - hrvMin) / (hrvMax - hrvMin)) * (auBot - auTop);
  const ticks = [[0, "23:00"], [60, "00:00"], [120, "01:00"], [180, "02:00"], [240, "03:00"], [300, "04:00"], [360, "05:00"], [420, "06:00"], [480, "07:00"], [540, "08:00"]];

  return (
    <div style={{ background: Cs.bg, minHeight: "100vh", padding: "20px 14px 40px", color: Cs.ink,
      fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','Microsoft YaHei',sans-serif",
      maxWidth: 760, margin: "0 auto" }}>

      <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: 1.4, color: Cs.hrv, textTransform: "uppercase" }}>
        🌙 睡眠 VF · Apple Watch + 自主神经仲裁
      </div>
      <h1 style={{ fontSize: 21, fontWeight: 800, lineHeight: 1.3, margin: "7px 0 5px" }}>
        分期 × HRV × 心率,同一时间轴 · 6/15 夜 → 6/16 晨
      </h1>
      <p style={{ fontSize: 12.5, color: Cs.sub, lineHeight: 1.5, margin: "0 0 14px" }}>
        总时长够:在床 7.9h 睡 7.29h、效率 92%、醒 0.6h。但<b style={{ color: Cs.amber }}>深睡仅 0.48h 偏低 + 入睡晚 23:26</b> —— Nora 大餐晚食的代价。HRV 中位 81 仍 >基线、RHR 回落 ~45,自主神经仍向好。
      </p>

      {/* banner */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 16px", alignItems: "center",
        background: Cs.card, border: `1px solid ${Cs.cardEdge}`, borderRadius: 12, padding: "11px 15px", marginBottom: 14, fontSize: 12.5 }}>
        <span style={{ fontWeight: 800, color: Cs.good, fontSize: 14 }}>睡眠 7.29h · 尚可</span>
        <span style={{ color: Cs.faint }}>|</span><span style={{ color: Cs.sub }}>效率 <b style={{ color: Cs.good }}>92%</b></span>
        <span style={{ color: Cs.faint }}>|</span><span style={{ color: Cs.sub }}>醒 0.6h</span>
        <span style={{ color: Cs.faint }}>|</span><span style={{ color: Cs.hrv }}>HRV 均 81ms</span>
        <span style={{ color: Cs.faint }}>|</span><span style={{ color: Cs.amber }}>深睡 0.48h ↓</span>
        <span style={{ color: Cs.faint }}>|</span><span style={{ color: Cs.good }}>RHR ~45 已恢复</span>
      </div>

      {/* 三视角对照 */}
      <Section title="① 时长 vs 质量 · 大餐次日" right="7.29h / 效率 92%">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 9, marginBottom: 4 }}>
          {SOURCES.map((s, i) => {
            const col = s.tone === "good" ? Cs.good : s.tone === "core" ? Cs.core : Cs.amber;
            return (
              <div key={i} style={{ background: Cs.track, border: `1px solid ${col}55`, borderRadius: 10, padding: "10px 10px" }}>
                <div style={{ fontSize: 11.5, fontWeight: 800, color: col }}>{s.name}</div>
                <div style={{ fontSize: 8.5, color: Cs.faint, marginTop: 1, lineHeight: 1.3 }}>{s.sub}</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 7 }}>
                  <span style={{ fontSize: 21, fontWeight: 800, color: Cs.ink }}>{s.tst}</span>
                  <span style={{ fontSize: 10.5, color: Cs.sub }}>{s.eff}</span>
                </div>
                <div style={{ fontSize: 10, color: Cs.sub, marginTop: 6, lineHeight: 1.4 }}>{s.note}</div>
              </div>
            );
          })}
        </div>
        <Note tone="amber">
          总量过关、<b style={{ color: Cs.good }}>7.29h、效率 92%、仅醒 0.6h</b>,但<b style={{ color: Cs.amber }}>深睡只有 0.48h(29min)+ 入睡晚到 23:26</b> —— 昨晚 Nora 大餐(土耳其面包 + 烤肉 + 甜品)晚食把深睡压低、入睡延后,呼吸也略升到 15.1。自主神经侧仍好:<b style={{ color: Cs.hrv }}>HRV 中位 81ms(>基线 72)</b>、<b style={{ color: Cs.good }}>深睡 HR 谷底 40–43</b>、<b style={{ color: Cs.good }}>RHR 回落 ~45(昨赛后 52 已退)</b>。净判:恢复仍 GOOD,但比昨天降一档。
        </Note>
      </Section>

      {/* 融合主图 */}
      <Section title="② 融合 hypnogram + 自主神经" right="同一时间轴">
        <div style={{ display: "flex", flexWrap: "wrap", gap: "5px 13px", padding: "0 2px 8px", fontSize: 10.5, color: Cs.sub }}>
          {["deep", "core", "rem", "awake"].map((s) => (
            <Lgs key={s} c={STG[s].c} sq>{STG[s].n}</Lgs>
          ))}
          <Lgs c={Cs.hr}>心率</Lgs><Lgs c={Cs.hrv}>HRV(SDNN)</Lgs>
          <Lgs c={Cs.goodBg} band>HRV 基线 65–85</Lgs>
        </div>
        <svg viewBox={`0 0 ${W} 326`} style={{ width: "100%", height: "auto" }}>
          {["awake", "rem", "core", "deep"].map((s) => (
            <text key={"l" + s} x={L - 8} y={laneY[s] + laneH / 2 + 4} textAnchor="end" fontSize="11" fontWeight="600" fill={Cs.sub}>{STG[s].n}</text>
          ))}
          {["awake", "rem", "core", "deep"].map((s, i) => (
            <rect key={"lb" + s} x={L} y={laneY[s]} width={R - L} height={laneH} fill={i % 2 ? Cs.lane1 : Cs.lane2} opacity="0.5" />
          ))}
          {SEG.slice(0, -1).map((seg, i) => {
            const nx = SEG[i + 1], x = xs(seg[1]);
            return <line key={"c" + i} x1={x} y1={laneY[seg[2]] + laneH / 2} x2={x} y2={laneY[nx[2]] + laneH / 2} stroke={Cs.gridln} strokeWidth="1.5" />;
          })}
          {SEG.map(([a, b, s], i) => (
            <rect key={"s" + i} x={xs(a)} y={laneY[s] + 5} width={Math.max(2.5, xs(b) - xs(a))} height={laneH - 10} rx="3" fill={STG[s].c} />
          ))}
          <rect x={L} y={hrvY(85)} width={R - L} height={hrvY(65) - hrvY(85)} fill={Cs.goodBg} opacity="0.4" />
          {/* left axis = HR */}
          {[40, 60, 80].map((v) => <text key={"hr" + v} x={L - 8} y={hrY(v) + 4} textAnchor="end" fontSize="9.5" fill={Cs.hr}>{v}</text>)}
          <text x={L - 8} y={auTop - 4} textAnchor="end" fontSize="9" fontWeight="600" fill={Cs.hr}>bpm</text>
          {/* right axis = HRV */}
          {[50, 90, 130].map((v) => <text key={"hv" + v} x={R + 6} y={hrvY(v) + 4} textAnchor="start" fontSize="9.5" fill={Cs.hrv}>{v}</text>)}
          <text x={R + 6} y={auTop - 4} textAnchor="start" fontSize="9" fontWeight="600" fill={Cs.hrv}>ms</text>
          {/* HRV curve */}
          <polyline points={HRV.map(([m, v]) => `${xs(m)},${hrvY(v)}`).join(" ")} fill="none" stroke={Cs.hrv} strokeWidth="1.8" opacity="0.92" />
          {HRV.map(([m, v], i) => <circle key={"hvd" + i} cx={xs(m)} cy={hrvY(v)} r="2" fill={Cs.hrv} />)}
          {/* HR curve */}
          <polyline points={HRD.map(([m, v]) => `${xs(m)},${hrY(v)}`).join(" ")} fill="none" stroke={Cs.hr} strokeWidth="2.1" />
          {HRD.map(([m, v], i) => <circle key={"hrd" + i} cx={xs(m)} cy={hrY(v)} r="2" fill={Cs.hr} />)}
          {/* annotations */}
          <text x={xs(420)} y={hrvY(96.7) - 7} textAnchor="middle" fontSize="9.5" fontWeight="700" fill={Cs.hrv}>HRV 峰 06:00 · 97</text>
          <text x={xs(110)} y={hrvY(73.5) + 15} textAnchor="middle" fontSize="9" fill={Cs.hrv}>入睡初 ~73</text>
          <text x={xs(300)} y={hrY(44) - 6} textAnchor="middle" fontSize="9" fill={Cs.hr}>HR 谷 ~40–43(深睡)· RHR ~45</text>
          {ticks.map(([m, lab]) => (
            <g key={m}>
              <line x1={xs(m)} y1={T} x2={xs(m)} y2={auBot} stroke={Cs.gridln} strokeWidth="1" />
              <text x={xs(m)} y={auBot + 30} textAnchor="middle" fontSize="9" fill={Cs.faint}>{lab}</text>
            </g>
          ))}
        </svg>
        <Note tone="good">
          自主神经曲线仍干净:<b style={{ color: Cs.hr }}>HR 在深睡段沉到 ~40–43</b>(RHR ~45,已从昨 52 恢复)、<b style={{ color: Cs.hrv }}>HRV 从入睡初的 73 爬到 06:00 的 97</b>,中位 81、>基线 72。
          副交感主导没问题 —— 但<b style={{ color: Cs.amber }}>深睡时长被大餐压低</b>(见 ③),所以是"自主好、深睡欠"的一夜。
        </Note>
      </Section>

      {/* 阶段 chips */}
      <Section title="③ 阶段结构" right="Core+Deep+REM=7.29h ✓">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 9 }}>
          {CHIPS.map((c) => {
            const col = c.tone === "good" ? Cs.good : c.tone === "amber" ? Cs.amber : Cs.core;
            return (
              <div key={c.k} style={{ background: Cs.track, border: `1px solid ${STG[c.k].c}44`, borderRadius: 10, padding: "10px 9px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <span style={{ width: 9, height: 9, borderRadius: 2, background: STG[c.k].c }} />
                  <span style={{ fontSize: 11, color: Cs.sub }}>{c.label}</span>
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginTop: 5 }}>
                  <span style={{ fontSize: 18, fontWeight: 800 }}>{c.val}</span>
                  <span style={{ fontSize: 10, color: Cs.faint }}>{c.pct}</span>
                </div>
                <div style={{ fontSize: 9.5, color: c.tone === "amber" ? Cs.amber : Cs.sub, marginTop: 5, lineHeight: 1.4 }}>{c.note}</div>
              </div>
            );
          })}
        </div>
        <Note tone="amber">
          <b style={{ color: Cs.amber }}>深睡只占 7%(0.48h、29min)是这夜的短板</b> —— 晚间大餐(高脂 + 晚食、入睡 23:26)系统性压低深睡;Apple 还会低估深睡,还原后 ~0.6–0.9h,但仍偏低。
          好的一面:<b style={{ color: Cs.good }}>REM 2.03h(28%)充足</b>(情绪整合 + 记忆固化够)。单看一夜不必慌 —— 但这解释了恢复为何比昨天降一档。
        </Note>
      </Section>

      {/* 判断 */}
      <Section title="④ 判断 · 恢复 GOOD 降一档" right="自主好·深睡欠">
        <div style={{ fontSize: 13, lineHeight: 1.6, color: Cs.ink }}>
          <p style={{ margin: "0 0 8px" }}>
            <b style={{ color: Cs.good }}>整体仍是好觉,但比昨天降一档。</b>7.29h、效率 92%、HRV 中位 81、RHR 回落 ~45 —— 自主神经在绿区;唯一短板是<b style={{ color: Cs.amber }}>深睡 0.48h 偏低 + 入睡晚</b>,Nora 大餐晚食的代价。
          </p>
          <p style={{ margin: 0, color: Cs.sub }}>
            落到今天:认知侧够用 —— 是把<b style={{ color: Cs.ink }}>高强度脑力活(找工作 / CMBS 建模)</b>放进来的好窗口。身体侧:<b style={{ color: Cs.ink }}>腿部 DOMS 今天见顶(见「实时」tab),别练腿、别冲强度</b>;晚餐别再晚食 + 复杂碳水照旧护深睡。
          </p>
        </div>
      </Section>

      <div style={{ fontSize: 10, color: Cs.faint, lineHeight: 1.6, padding: "2px 2px 0" }}>
        <b>数据来源:</b> 阶段总量 = HealthAutoExport / HealthMetrics-2026-06-16 sleep_analysis(Apple Watch;Core+Deep+REM 对账 Total 7.29h ✓,入睡 23:26→醒 07:20)。HRV / HR = 同次晨间导出逐时,睡眠窗中位 HRV 81ms、基线 65–85;
        Apple RHR 字段晨间导出暂缺(计算滞后)→ 整夜 HR 谷底 ~40–43 推 RHR ~45(昨午后导出曾显 52,赛后滞后,现已退)。深睡还原依 Apple Watch vs PSG 系统性低估(~30–50%)。阶段条时序按 HRV / HR + 周期仲裁。n=1,非因果。
      </div>
    </div>
  );
}

/* ════ components ════ */
function Section({ title, right, children }) {
  return (
    <div style={{ background: Cs.card, border: `1px solid ${Cs.cardEdge}`, borderRadius: 14, padding: "14px 14px 13px", marginBottom: 13 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 11 }}>
        <div style={{ fontSize: 15, fontWeight: 800 }}>{title}</div>
        <div style={{ fontSize: 10.5, color: Cs.faint }}>{right}</div>
      </div>
      {children}
    </div>
  );
}
function Note({ children, tone }) {
  const m = { good: [Cs.good, Cs.chipGood], amber: [Cs.amber, Cs.chipAmber] }[tone] || [Cs.sub, Cs.chipNeutral];
  return <div style={{ fontSize: 12, color: Cs.ink, lineHeight: 1.55, marginTop: 11, borderLeft: `3px solid ${m[0]}`, background: m[1], padding: "9px 12px", borderRadius: "0 8px 8px 0" }}>{children}</div>;
}
function Lgs({ c, children, sq, band }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
      {band ? <span style={{ width: 14, height: 9, background: c, borderRadius: 2, border: "1px solid #4ade80" }} />
        : sq ? <span style={{ width: 10, height: 10, background: c, borderRadius: 2 }} />
          : <span style={{ width: 14, height: 0, borderTop: `2px solid ${c}` }} />}
      {children}
    </span>
  );
}


const mkCu = (d) => (d ? {
  bg:"#1c1c1e", card:"#2a2a2c", edge:"#3a3a3c", ink:"#f2f2f7", sub:"#a1a1aa", faint:"#71717a",
  green:"#4ade80", good:"#4ade80", greenBg:"#143a26", amber:"#fbbf24", red:"#f87171",
  hrvN:"#3a6f68", hrvD:"#2dd4bf", hr:"#fb923c", band:"#22c55e", track:"#242426", gridln:"#3a3a3c",
} : {
  bg:"#fdf8ea", card:"#fffdf4", edge:"#ece3c8", ink:"#1c1917", sub:"#57534e", faint:"#8a857c",
  green:"#16a34a", good:"#16a34a", greenBg:"#dcfce7", amber:"#d97706", red:"#dc2626",
  hrvN:"#99c9c0", hrvD:"#0d9488", hr:"#ea580c", band:"#16a34a", track:"#f1ead4", gridln:"#e6dcc0",
});
let Cu = mkCu(true);
const tone = (v, inv) => (inv ? (v <= 35 ? Cu.green : v <= 60 ? Cu.amber : Cu.red) : (v >= 67 ? Cu.green : v >= 45 ? Cu.amber : Cu.red));

function SecTitle({ children }) {
  return <div style={{ fontSize: 12, fontWeight: 800, color: Cu.sub, margin: "2px 2px 8px", letterSpacing: 0.3 }}>{children}</div>;
}
function Lgu({ c, children, dot }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
      {dot ? <span style={{ width: 7, height: 7, borderRadius: 4, background: c }} /> : <span style={{ width: 13, height: 0, borderTop: `2px solid ${c}` }} />}{children}
    </span>
  );
}


/* ═══════ palette ═══════ */
const mkCw = (d) => (d ? {
  bg:"#1c1c1e", card:"#2a2a2c", ink:"#f2f2f7", sub:"#a1a1aa", line:"#3a3a3c",
  weight:"#818cf8", trend:"#22d3ee", intake:"#fb923c", tdee:"#22d3ee", bmr:"#52525b",
  good:"#4ade80", goodSoft:"#16a34a", goodBg:"#143a26", warn:"#fbbf24", warnBg:"#3a2a06",
  red:"#f87171", redSoft:"#b91c1c", slate:"#a1a1aa", gold:"#fbbf24",
  water:"#38bdf8", waterBg:"#082f49", softBg:"#242426",
} : {
  bg:"#fdf8ea", card:"#fffdf4", ink:"#1c1917", sub:"#78716c", line:"#ece3c8",
  weight:"#4338ca", trend:"#0e7490", intake:"#ea580c", tdee:"#0e7490", bmr:"#d6d3d1",
  good:"#15803d", goodSoft:"#86efac", goodBg:"#dcfce7", warn:"#b45309", warnBg:"#fef3c7",
  red:"#dc2626", redSoft:"#fca5a5", slate:"#64748b", gold:"#b8860b",
  water:"#0ea5e9", waterBg:"#e0f2fe", softBg:"#fbf6e3",
});
let Cw = mkCw(true);

/* ═══════ DATA ═══════ */
// 真实速率(LOESS 去噪 trend 斜率)
const RATE = { full: -0.71, d30: -0.55, d14: -0.61 };
// 物理锚(由近30天速率推)
const PHYS = { deficit: 600, fatDay: 0.08, thresh: 0.15 };

// 分解:原始 vs 真实(LOESS) + 残差(=水)
const DECOMP = [
  { x: "5/19", w: 81.8, t: 81.95, r: -0.15 }, { x: "5/21", w: 81.4, t: 81.73, r: -0.33 },
  { x: "5/24", w: 81.4, t: 81.47, r: -0.07 }, { x: "5/25", w: 81.8, t: 81.45, r: 0.35 },
  { x: "5/26", w: 81.1, t: 81.45, r: -0.35 }, { x: "5/28", w: 81.5, t: 81.35, r: 0.15 },
  { x: "5/29", w: 81.5, t: 81.27, r: 0.23 }, { x: "6/1", w: 80.8, t: 81.11, r: -0.31 },
  { x: "6/4", w: 81.1, t: 80.86, r: 0.24 }, { x: "6/5", w: 80.8, t: 80.82, r: -0.02 },
  { x: "6/7", w: 80.5, t: 80.71, r: -0.21 }, { x: "6/8", w: 80.8, t: 80.57, r: 0.23 },
  { x: "6/9", w: 80.8, t: 80.44, r: 0.36 }, { x: "6/11", w: 79.6, t: 80.19, r: -0.59 },
  { x: "6/12", w: 80.2, t: 80.06, r: 0.14 }, { x: "6/13", w: 81.0, t: 80.00, r: 1.00 },
  { x: "6/14", w: 79.6, t: 79.93, r: -0.33 }, { x: "6/15", w: 79.6, t: 79.88, r: -0.28 }, { x: "6/16", w: 80.25, t: 79.92, r: 0.33 },
];

// 能量(近7天 6/9–6/15)· 6/9=估算 · 6/13=比赛日 · 6/15=Nora大餐盈余
const WEEK = [
  { x: "6/9", w: 80.8, intake: 2060, bmr: 1900, active: 1500, net: -1340, est: true },
  { x: "6/10", w: null, intake: 2260, bmr: 1900, active: 320, net: 40 },
  { x: "6/11", w: 79.6, intake: 2355, bmr: 1900, active: 855, net: -400 },
  { x: "6/12", w: 80.2, intake: 3250, bmr: 1900, active: 570, net: 780 },
  { x: "6/13", w: 81.0, intake: 2540, bmr: 1900, active: 1900, net: -1260 },
  { x: "6/14", w: 79.6, intake: 3100, bmr: 1900, active: 1790, net: -590 },
  { x: "6/15", w: 79.6, intake: 3795, bmr: 1900, active: 650, net: 1245, big: true },
];

// 目标(实测 → 投影扇)
const YEAR = [
  { x: "4/19", w: 85.0, p: null }, { x: "5/11", w: 82.6, p: null },
  { x: "5/26", w: 81.1, p: null }, { x: "6/15", w: 79.6, p: 79.6 }, { x: "6/16", w: 80.25, p: 79.9 },
  { x: "7/1", w: null, p: 78.4 }, { x: "7/15", w: null, p: 77.1 },
  { x: "8/1", w: null, p: 75.6 }, { x: "8/24", w: null, p: 75.0 },
];

const FOOD = {
  keep: { title: "继续 — 皮肤+减脂都好", color: Cw.good, items: [
    ["三文鱼", "omega-3 抗炎 + 锌 + 瘦蛋白。单子里最好的一项 ⭐"],
    ["烤鸡 腿/胸", "瘦蛋白 + 锌 + B12。翅带皮脂肪高;peri-peri 酱挑清淡"],
    ["鸡蛋", "蛋白 + 锌 + 胆碱,饱腹。4 蛋早餐就对"],
    ["草莓 / 燕麦", "低 GI + 抗炎 / 纤维养菌。燕麦别加糖、配蛋白才扛饿"],
  ]},
  cut: { title: "减少/替换 — 皮肤+减脂双漏", color: Cw.red, items: [
    ["红牛", "~28g 糖 → 胰岛素/IGF-1 飙(HS 负面)。换 sugar-free / 黑咖 ⭐"],
    ["果泥", "~165 卡纯糖 0 蛋白,高 GI 没饱腹。换蛋 / Skyr+燕麦 ⭐"],
    ["彩虹糖", "高 GI 纯糖。HS 负面 + 缺口最大漏。砍它单刀价值最高 ⭐⭐"],
    ["白米饭 / 薯泥", "高 GI。换糙米/红薯,必配蛋白+菜钝化血糖"],
  ]},
  nuance: { title: "看情况", color: Cw.slate, items: [
    ["坚果/黑巧", "坚果热量密(那 +200);黑巧 70%+ 才抗炎。各一小份"],
    ["Skyr/cottage", "发酵乳益生菌可能抗炎;仍是乳制品控量。HS 发作可试停乳 4–6 周"],
  ]},
};

const TABS = [["decomp", "分解 脂肪vs水"], ["energy", "能量"], ["goal", "目标"], ["food", "营养"]];

/* ═══════ daily calculator coefficients (教科书默认) ═══════ */
const CARB_OPT = [["低碳 / 空腹久", -0.4], ["正常", 0], ["偏高 +150~250g", 0.5], ["Refeed / 碳水加载", 1.0]];

function WeightEngine() {
  const [tab, setTab] = useState("decomp");
  const [scale, setScale] = useState(80.25);
  const [ci, setCi] = useState(1);          // carb index
  const [sodium, setSodium] = useState(false);
  const [flare, setFlare] = useState(false);
  const [train, setTrain] = useState(false);

  const offset = CARB_OPT[ci][1] + (sodium ? 0.4 : 0) + (flare ? 0.5 : 0) + (train ? 0.4 : 0);
  const adj = scale - offset;

  return (
    <div style={{ background: Cw.bg, minHeight: "100vh", padding: "18px 13px 40px", color: Cw.ink,
      fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','Microsoft YaHei',sans-serif", maxWidth: 480, margin: "0 auto" }}>

      <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: 1.3, color: Cw.sub, textTransform: "uppercase" }}>体重引擎 · 脂肪 vs 水 × 能量 × 目标</div>
      <h1 style={{ fontSize: 19, fontWeight: 800, lineHeight: 1.32, margin: "7px 0 4px" }}>
        scale 每天骗你 —— <span style={{ color: Cw.trend }}>真实趋势</span>才是脂肪,<span style={{ color: Cw.water }}>残差</span>是水
      </h1>
      <p style={{ fontSize: 12, color: Cw.sub, lineHeight: 1.5, margin: "0 0 12px" }}>
        缺口 ~{PHYS.deficit}/天 → 真脂肪每天只掉 <b>~{PHYS.fatDay}kg</b>;单日 &gt;0.15kg 的变化数学上必然是水/糖原。
      </p>

      {/* tabs */}
      <div style={{ display: "flex", gap: 5, marginBottom: 12 }}>
        {TABS.map(([k, lab]) => {
          const on = k === tab;
          return (
            <button key={k} onClick={() => setTab(k)}
              style={{ flex: 1, padding: "8px 0", borderRadius: 9, fontSize: 12, fontWeight: 700, cursor: "pointer",
                border: `1.5px solid ${on ? Cw.ink : Cw.line}`, background: on ? Cw.ink : Cw.card, color: on ? "#fff" : Cw.sub, lineHeight: 1.2 }}>
              {lab}
            </button>
          );
        })}
      </div>

      {tab === "decomp" && <Decomp scale={scale} setScale={setScale} ci={ci} setCi={setCi}
        sodium={sodium} setSodium={setSodium} flare={flare} setFlare={setFlare} train={train} setTrain={setTrain} offset={offset} adj={adj} />}
      {tab === "energy" && <Energy />}
      {tab === "goal" && <Goal />}
      {tab === "food" && <Food />}

      <div style={{ fontSize: 9.5, color: Cw.sub, lineHeight: 1.55, marginTop: 14, padding: "0 2px" }}>
        方法:真实体重 = LOESS/EWMA 去噪(同 TrendWeight / Hacker's Diet);糖原结合水 ~3:1(Olsson & Saltin 1970,情境依赖);1kg 脂肪 ≈ 7700kcal 作物理锚。残差 = scale − trend = 水/糖原/肠内容物。个人系数需 ~8–10 周数据标定(现用教科书默认)。n=1,非因果;单日校正 ±0.5kg,只信 trend。
      </div>
    </div>
  );
}

/* ═══════ TAB 1 · 分解 ═══════ */
function Decomp(p) {
  return (
    <>
      {/* headline */}
      <div style={{ background: Cw.card, border: `1px solid ${Cw.line}`, borderRadius: 13, padding: "13px 15px", marginBottom: 11 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <span style={{ fontSize: 12.5, fontWeight: 700, color: Cw.sub }}>真实减脂速率(去噪)</span>
          <span style={{ fontSize: 22, fontWeight: 800, color: Cw.good }}>≈ −0.55 <span style={{ fontSize: 13, color: Cw.sub }}>kg/周</span></span>
        </div>
        <div style={{ fontSize: 11.5, color: Cw.ink, lineHeight: 1.5, marginTop: 5 }}>
          今天 scale <b>80.2</b>,真实趋势 <b style={{ color: Cw.trend }}>80.1</b> —— 差的 +0.1 是水。近 2 周 trend 仍以 ~0.55–0.6kg/周 下降。
        </div>
      </div>

      {/* chart: raw vs trend */}
      <Card title="原始体重 vs 真实趋势" sub="散点 = 每天 scale(噪);线 = LOESS 去噪真实体重(脂肪)">
        <div style={{ height: 210 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={DECOMP} margin={{ top: 8, right: 8, left: 2, bottom: 0 }}>
              <CartesianGrid stroke={Cw.line} vertical={false} />
              <XAxis dataKey="x" tick={{ fontSize: 9.5, fill: Cw.sub }} axisLine={{ stroke: Cw.line }} tickLine={false} interval={1} />
              <YAxis domain={[79, 82.4]} tick={{ fontSize: 10, fill: Cw.sub }} axisLine={false} tickLine={false} width={34} tickFormatter={(v) => v.toFixed(1)} />
              <Tooltip cursor={{ fill: Cw.line, fillOpacity: 0.2 }} contentStyle={{ fontSize: 12, borderRadius: 8, background: Cw.card, border: `1px solid ${Cw.line}`, color: Cw.ink, boxShadow: "0 4px 14px rgba(0,0,0,0.35)" }} labelStyle={{ color: Cw.sub, fontWeight: 700, marginBottom: 2 }} itemStyle={{ color: Cw.ink }} formatter={(v, n) => [`${v} kg`, n === "w" ? "scale" : "真实趋势"]} />
              <Line dataKey="w" name="w" stroke={Cw.weight} strokeWidth={0} dot={{ r: 3, fill: Cw.weight }} isAnimationActive={false} />
              <Line dataKey="t" name="t" stroke={Cw.trend} strokeWidth={2.6} dot={false} isAnimationActive={false} />
              <ReferenceDot x="6/11" y={79.6} r={4} fill={Cw.water} stroke="#fff" strokeWidth={1.5}
                label={{ value: "水低·练球耗糖原", position: "bottom", fontSize: 8.5, fill: Cw.water }} />
              <ReferenceDot x="6/12" y={80.2} r={4} fill={Cw.intake} stroke="#fff" strokeWidth={1.5}
                label={{ value: "refeed 水回", position: "top", fontSize: 8.5, fill: Cw.intake }} />
              <ReferenceDot x="6/13" y={81.0} r={4.5} fill={Cw.warn} stroke="#fff" strokeWidth={1.5}
                label={{ value: "6/13 碳水加载水峰", position: "top", fontSize: 8.5, fill: Cw.warn }} />
              <ReferenceDot x="6/15" y={79.6} r={4.5} fill={Cw.good} stroke="#fff" strokeWidth={1.5}
                label={{ value: "次晨·水全回落", position: "bottom", fontSize: 8.5, fill: Cw.good }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <Concl tone="good">
          散点上下乱跳 ±0.5–1kg,但去噪线平滑下降 —— <b style={{ color: Cw.water }}>跳的是水</b>,<b style={{ color: Cw.good }}>降的才是脂肪</b>。<b style={{ color: Cw.warn }}>6/13 飙到 81.0 = D-1 碳水加载水峰</b>;<b>6/14 隔夜回落 79.6</b>(−1.4kg 全是水);<b>6/15 继续稳在 79.6</b> —— 加载水排完没反弹,<b style={{ color: Cw.good }}>真实体重锚定 ~79.6,去噪线 ~79.86 仍以 ~−0.6kg/周下行</b>。预判过的"回弹到 80.0"没发生,反而守在水分谷底:加载→回落周期跑完、真实体重稳住。
        </Concl>
      </Card>

      {/* physics anchor */}
      <div style={{ background: Cw.warnBg, border: `1px solid ${Cw.warn}44`, borderRadius: 12, padding: "11px 14px", marginBottom: 11, fontSize: 11.5, lineHeight: 1.55 }}>
        <b style={{ color: Cw.warn }}>⚓ 物理锚:</b> 缺口 ~600/天 ÷ 7700 = 真脂肪 <b>~0.08kg/天</b>。6/11→6/12 的 <b>+0.6kg</b> 若是脂肪需 +4600kcal 盈余 → 不可能。<b>必然是糖原-水</b>(碳水加载 ~3g 水/g 糖原)。
      </div>

      {/* residual bars */}
      <Card title="每日残差 = 水/糖原偏移" sub="scale − 真实趋势;带 = 脂肪可解释区 ±0.15kg">
        <div style={{ height: 168 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={DECOMP} margin={{ top: 8, right: 8, left: 2, bottom: 0 }}>
              <CartesianGrid stroke={Cw.line} vertical={false} />
              <XAxis dataKey="x" tick={{ fontSize: 9, fill: Cw.sub }} axisLine={{ stroke: Cw.line }} tickLine={false} interval={1} />
              <YAxis domain={[-0.8, 0.6]} tick={{ fontSize: 9.5, fill: Cw.sub }} axisLine={false} tickLine={false} width={36} tickFormatter={(v) => v.toFixed(1)} />
              <Tooltip cursor={{ fill: Cw.line, fillOpacity: 0.2 }} contentStyle={{ fontSize: 12, borderRadius: 8, background: Cw.card, border: `1px solid ${Cw.line}`, color: Cw.ink, boxShadow: "0 4px 14px rgba(0,0,0,0.35)" }} labelStyle={{ color: Cw.sub, fontWeight: 700, marginBottom: 2 }} itemStyle={{ color: Cw.ink }} formatter={(v) => [`${v > 0 ? "+" : ""}${v} kg`, "水偏移"]} />
              <ReferenceArea y1={-0.15} y2={0.15} fill={Cw.good} fillOpacity={0.12} />
              <ReferenceLine y={0} stroke={Cw.slate} strokeWidth={1} />
              <Bar dataKey="r" name="水偏移" barSize={15} radius={[2, 2, 2, 2]}>
                {DECOMP.map((d, i) => <Cell key={i} fill={Math.abs(d.r) <= 0.15 ? Cw.bmr : d.r > 0 ? Cw.intake : Cw.water} />)}
              </Bar>
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <Concl tone="slate">
          15 天里只有 ~4 天落在 ±0.15 脂肪可解释区内,其余都在区外晃 —— <b style={{ color: Cw.warn }}>单日体重几乎全是水主导</b>。<b style={{ color: Cw.intake }}>橙=水偏多</b>(碳水/钠),<b style={{ color: Cw.water }}>蓝=水偏少</b>(耗糖原/脱水)。
        </Concl>
      </Card>

      {/* plateau verdict */}
      <div style={{ background: Cw.goodBg, border: `1px solid ${Cw.good}55`, borderRadius: 12, padding: "11px 14px", marginBottom: 11, fontSize: 11.5, lineHeight: 1.55 }}>
        <b style={{ color: Cw.good }}>✅ 没有平台(之前"漂到维持"是水假象)。</b> 6 月初 raw ~80.8 看着停了,但那几天残差为正(水偏多)在掩盖;去噪 trend 一直降,6/11 跌 79.6 是水低露出真实位置。<b>当前缺口继续即可</b>,2–3 天体重确认。
      </div>

      {/* daily calculator */}
      <Card title="⚡ 5 秒每日校正" sub="输今天情况 → 去掉水、得真实体重(教科书默认系数)">
        <div style={{ display: "flex", flexDirection: "column", gap: 9, padding: "2px 2px 4px" }}>
          <Row label="今天 scale (kg)">
            <input type="number" step="0.1" value={p.scale} onChange={(e) => p.setScale(parseFloat(e.target.value) || 0)}
              style={{ width: 78, padding: "6px 8px", fontSize: 14, fontWeight: 700, border: `1.5px solid ${Cw.line}`, borderRadius: 8, textAlign: "right", background: Cw.bg, color: Cw.ink, outline: "none" }} />
          </Row>
          <Row label="昨天碳水">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, justifyContent: "flex-end" }}>
              {CARB_OPT.map(([lab], i) => (
                <button key={i} onClick={() => p.setCi(i)} style={chip(i === p.ci)}>{lab}</button>
              ))}
            </div>
          </Row>
          <Row label="钠 / 训练 / 炎症">
            <div style={{ display: "flex", gap: 4, justifyContent: "flex-end", flexWrap: "wrap" }}>
              <button onClick={() => p.setSodium(!p.sodium)} style={chip(p.sodium)}>高钠 +0.4</button>
              <button onClick={() => p.setTrain(!p.train)} style={chip(p.train)}>硬/新训练 +0.4</button>
              <button onClick={() => p.setFlare(!p.flare)} style={chip(p.flare)}>HS flare +0.5</button>
            </div>
          </Row>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 9, padding: "11px 13px", background: Cw.bg, borderRadius: 10, border: `1px solid ${Cw.line}` }}>
          <div>
            <div style={{ fontSize: 10.5, color: Cw.sub }}>水/糖原偏移</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: p.offset > 0 ? Cw.intake : p.offset < 0 ? Cw.water : Cw.sub }}>{p.offset > 0 ? "+" : ""}{p.offset.toFixed(1)} kg</div>
          </div>
          <div style={{ fontSize: 22, color: Cw.line }}>→</div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 10.5, color: Cw.sub }}>校正(真实)体重</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: Cw.trend }}>{p.adj.toFixed(1)} kg</div>
          </div>
        </div>
        <div style={{ fontSize: 9.5, color: Cw.sub, lineHeight: 1.5, marginTop: 7 }}>
          ±0.5kg 单日误差 → 只看校正体重的 <b>trend</b>,别盯单日。creatine ~+0.7kg 已在 baseline,不计入。
        </div>
      </Card>
    </>
  );
}

/* ═══════ TAB 2 · 能量 ═══════ */
function Energy() {
  const [mode, setMode] = useState("breakdown");
  return (
    <>
      <div style={{ display: "flex", gap: 6, marginBottom: 11, background: Cw.softBg, padding: 4, borderRadius: 10 }}>
        {[["breakdown", "摄入 vs 消耗"], ["net", "净值 (缺口)"]].map(([k, lab]) => {
          const on = k === mode;
          return <button key={k} onClick={() => setMode(k)}
            style={{ flex: 1, padding: "7px 0", borderRadius: 7, fontSize: 12.5, fontWeight: 700, cursor: "pointer", border: "none",
              background: on ? Cw.card : "transparent", color: on ? Cw.ink : Cw.sub, boxShadow: on ? "0 1px 2px rgba(0,0,0,.08)" : "none" }}>{lab}</button>;
        })}
      </div>
      <Card title="近 7 天 · 6/9–6/15(比赛日 6/13 + Nora 大餐 6/15)" sub={mode === "breakdown" ? "消耗 = BMR灰 + 活动青;橙点 = 吃进。橙点高于柱顶 = 盈余" : "分叉柱;绿区 = 目标减脂 −500~−770;灰柱 = 估算"}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 11px", padding: "0 4px 8px", fontSize: 10, color: Cw.sub }}>
          <Lgw c={Cw.weight} sq>体重</Lgw>
          {mode === "breakdown" ? <><Lgw c={Cw.bmr} sq>BMR</Lgw><Lgw c={Cw.tdee} sq>活动</Lgw><Lgw c={Cw.intake}>摄入</Lgw></>
            : <><Lgw c={Cw.goodSoft} sq>缺口</Lgw><Lgw c={Cw.redSoft} sq>盈余</Lgw></>}
        </div>
        <div style={{ height: 240 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={WEEK} margin={{ top: 12, right: 8, left: 2, bottom: 0 }}>
              <CartesianGrid stroke={Cw.line} vertical={false} />
              <XAxis dataKey="x" tick={{ fontSize: 10, fill: Cw.sub }} axisLine={{ stroke: Cw.line }} tickLine={false} />
              <YAxis yAxisId="kg" orientation="right" domain={[79, 81.5]} tick={{ fontSize: 10, fill: Cw.weight }} axisLine={false} tickLine={false} width={32} tickFormatter={(v) => v.toFixed(0)} />
              <YAxis yAxisId="kcal" orientation="left" domain={mode === "net" ? [-1500, 420] : [0, 4000]} tick={{ fontSize: 9, fill: Cw.sub }} axisLine={false} tickLine={false} width={34}
                tickFormatter={(v) => mode === "net" ? v : (v / 1000).toFixed(1) + "k"} />
              <Tooltip cursor={{ fill: Cw.line, fillOpacity: 0.2 }} contentStyle={{ fontSize: 12, borderRadius: 8, background: Cw.card, border: `1px solid ${Cw.line}`, color: Cw.ink, boxShadow: "0 4px 14px rgba(0,0,0,0.35)" }} labelStyle={{ color: Cw.sub, fontWeight: 700, marginBottom: 2 }} itemStyle={{ color: Cw.ink }} formatter={(v, n) => v == null ? ["—", n] : n.includes("重") ? [`${v} kg`, n] : [`${v} kcal`, n]} />
              {mode === "net" && <ReferenceArea yAxisId="kcal" y1={-770} y2={-500} fill={Cw.goodBg} fillOpacity={0.7} />}
              {mode === "net" && <ReferenceLine yAxisId="kcal" y={0} stroke={Cw.slate} strokeDasharray="2 3" label={{ value: "维持", position: "insideTopLeft", fontSize: 9, fill: Cw.slate }} />}
              {mode === "breakdown" && <Bar yAxisId="kcal" dataKey="bmr" name="BMR" stackId="t" fill={Cw.bmr} radius={[0, 0, 3, 3]} barSize={26} />}
              {mode === "breakdown" && <Bar yAxisId="kcal" dataKey="active" name="活动" stackId="t" fill={Cw.tdee} radius={[3, 3, 0, 0]} barSize={26} />}
              {mode === "breakdown" && <Line yAxisId="kcal" dataKey="intake" name="摄入" stroke={Cw.intake} strokeWidth={0} dot={{ r: 5, fill: Cw.intake, stroke: "#fff", strokeWidth: 1.5 }} connectNulls={false} isAnimationActive={false} />}
              {mode === "net" && <Bar yAxisId="kcal" dataKey="net" name="净值" barSize={20} radius={[3, 3, 3, 3]}>
                {WEEK.map((d, i) => <Cell key={i} fill={d.net == null ? "transparent" : d.est ? Cw.bmr : d.net > 0 ? Cw.redSoft : Cw.goodSoft} />)}
              </Bar>}
              <Line yAxisId="kg" dataKey="w" name="体重" stroke={Cw.weight} strokeWidth={2.4} dot={{ r: 3.2, fill: Cw.weight }} connectNulls isAnimationActive={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <Concl tone="warn">
          <b style={{ color: Cw.warn }}>6/13 = −1260 比赛日大缺口</b>(实测比赛烧 1591,EA~15 落 LEA 区);<b style={{ color: Cw.slate }}>6/9 灰柱 = 估算</b>(赛后晚餐从未记录,net 仅估算带 ±300)。6/12 +780 是 D-1 碳水加载豁免。<b>以体重 trend 为结果锚</b>:两个比赛日缺口大但碳水补足,真实体重稳 ~79.6–80.0。⭐比赛日要把赛后晚餐当 must-log。
        </Concl>
      </Card>
    </>
  );
}

/* ═══════ TAB 3 · 目标 ═══════ */
function Goal() {
  return (
    <Card title="全程 85 → 75 + 投影" sub="实测到 6/14(79.6,略超前),按 −0.55~0.71kg/周 投影到 75">
      <div style={{ height: 250 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={YEAR} margin={{ top: 14, right: 10, left: 2, bottom: 0 }}>
            <CartesianGrid stroke={Cw.line} vertical={false} />
            <XAxis dataKey="x" tick={{ fontSize: 10, fill: Cw.sub }} axisLine={{ stroke: Cw.line }} tickLine={false} />
            <YAxis domain={[74, 86]} tick={{ fontSize: 10, fill: Cw.weight }} axisLine={false} tickLine={false} width={32} tickFormatter={(v) => v.toFixed(0)} />
            <Tooltip cursor={{ fill: Cw.line, fillOpacity: 0.2 }} contentStyle={{ fontSize: 12, borderRadius: 8, background: Cw.card, border: `1px solid ${Cw.line}`, color: Cw.ink, boxShadow: "0 4px 14px rgba(0,0,0,0.35)" }} labelStyle={{ color: Cw.sub, fontWeight: 700, marginBottom: 2 }} itemStyle={{ color: Cw.ink }} formatter={(v, n) => [`${v} kg`, n === "w" ? "实测" : "投影"]} />
            <ReferenceLine y={75} stroke={Cw.gold} strokeDasharray="6 3" strokeWidth={1.6} label={{ value: "目标 75", position: "insideTopRight", fontSize: 10.5, fontWeight: 700, fill: Cw.gold }} />
            <ReferenceLine y={72.25} stroke={Cw.red} strokeDasharray="2 3" strokeWidth={1} label={{ value: "HS −15% 阈 72.25", position: "insideBottomRight", fontSize: 8.5, fill: Cw.red }} />
            <Line dataKey="p" name="p" stroke={Cw.gold} strokeWidth={2} strokeDasharray="3 3" dot={{ r: 2.5, fill: Cw.gold }} connectNulls isAnimationActive={false} />
            <Line dataKey="w" name="w" stroke={Cw.weight} strokeWidth={2.6} dot={{ r: 3.4, fill: Cw.weight }} connectNulls isAnimationActive={false} />
            <ReferenceDot x="8/1" y={75.6} r={4} fill={Cw.gold} stroke="#fff" strokeWidth={1.5} label={{ value: "75 ~8月初-中", position: "top", fontSize: 9, fontWeight: 700, fill: Cw.gold }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <Concl tone="good">
        85.0(4/19)→ 79.6 真实(6/14)。按近期 −0.55 到全程 −0.71kg/周,<b>~8 月初至中旬撞 75</b> —— 正好你"8 月下旬"目标内,从容。早期掉得快(85→82.6)所以全程均速比近期快。
      </Concl>
    </Card>
  );
}

/* ═══════ TAB 4 · 营养 ═══════ */
function Food() {
  return (
    <div style={{ background: Cw.card, border: `1px solid ${Cw.line}`, borderRadius: 14, padding: "14px 15px 12px" }}>
      <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 3 }}>营养审计 · 按 HS + 减脂双标准</div>
      <div style={{ fontSize: 11, color: Cw.sub, lineHeight: 1.45, marginBottom: 13 }}>逐项过你常吃的东西。⭐ = 优先级最高的动作。</div>
      {[FOOD.keep, FOOD.cut, FOOD.nuance].map((grp, gi) => (
        <div key={gi} style={{ marginBottom: gi < 2 ? 15 : 4 }}>
          <div style={{ fontSize: 12.5, fontWeight: 800, color: grp.color, marginBottom: 7, display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: grp.color }} />{grp.title}
          </div>
          {grp.items.map((it, i) => (
            <div key={i} style={{ display: "flex", gap: 9, padding: "6px 0", borderBottom: `1px solid ${Cw.line}` }}>
              <div style={{ width: 80, flexShrink: 0, fontSize: 12, fontWeight: 700, lineHeight: 1.25 }}>{it[0]}</div>
              <div style={{ fontSize: 11.5, color: Cw.ink, lineHeight: 1.45, flex: 1 }}>{it[1]}</div>
            </div>
          ))}
        </div>
      ))}
      <div style={{ fontSize: 11.5, lineHeight: 1.55, color: Cw.ink, background: Cw.softBg, border: `1px solid ${Cw.line}`, borderRadius: 9, padding: "10px 12px", marginTop: 6 }}>
        <b>模式:</b> 蛋白来源(三文鱼/鸡/蛋)很棒别动;问题全在<b>糖 + 高 GI 碳水</b>那侧(红牛/果泥/彩虹糖 = 同一组敌人:HS 触发 + 减脂最大漏)。
      </div>
      <div style={{ fontSize: 10, color: Cw.sub, lineHeight: 1.5, marginTop: 9, background: Cw.warnBg, padding: "8px 10px", borderRadius: 7 }}>
        <b>边界:</b> HS 饮食是<b>辅助</b>证据(整体偏弱),不替代 NHS 皮肤科路径(转诊+验维D pending)。
      </div>
    </div>
  );
}

/* ═══════ sub-components ═══════ */
function Card({ title, sub, children }) {
  return (
    <div style={{ background: Cw.card, border: `1px solid ${Cw.line}`, borderRadius: 14, padding: "13px 12px 11px", marginBottom: 11, boxShadow: "0 1px 2px rgba(0,0,0,.03)" }}>
      <div style={{ fontSize: 14.5, fontWeight: 800, padding: "0 3px" }}>{title}</div>
      {sub && <div style={{ fontSize: 10.5, color: Cw.sub, lineHeight: 1.4, padding: "2px 3px 8px" }}>{sub}</div>}
      {children}
    </div>
  );
}
function Concl({ children, tone }) {
  const m = { warn: [Cw.warn, Cw.warnBg], good: [Cw.good, Cw.goodBg], slate: [Cw.slate, Cw.softBg] }[tone] || [Cw.slate, Cw.softBg];
  return <div style={{ fontSize: 11.5, color: Cw.ink, lineHeight: 1.55, marginTop: 9, border: `1px solid ${m[0]}55`, background: m[1], padding: "10px 13px", borderRadius: 11 }}>{children}</div>;
}
function Row({ label, children }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: Cw.sub, flexShrink: 0 }}>{label}</span>{children}
    </div>
  );
}
function chip(on) {
  return { padding: "5px 9px", borderRadius: 7, fontSize: 11, fontWeight: 700, cursor: "pointer",
    border: `1.5px solid ${on ? Cw.trend : Cw.line}`, background: on ? Cw.trend : Cw.card, color: on ? "#fff" : Cw.sub };
}
function Lgw({ c, children, sq }) {
  return <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
    <span style={{ width: 9, height: 9, background: c, borderRadius: sq ? 2 : 5 }} />{children}</span>;
}


/* ════════════════════ 顶层整合外壳 ════════════════════ */
/* ═══════ palette · 实时多通道 ═══════ */
const mkCr = (d) => (d ? {
  bg:"#1c1c1e", card:"#2a2a2c", edge:"#3a3a3c", ink:"#f2f2f7", sub:"#a1a1aa", faint:"#71717a",
  good:"#4ade80", goodBg:"#143a26", amber:"#fbbf24", amberBg:"#3a2a06", red:"#f87171", redBg:"#3a1414",
  ctl:"#38bdf8", atl:"#f472b6", legs:"#fb923c", sh:"#a78bfa", core:"#2dd4bf",
  track:"#242426", gridln:"#3a3a3c", chipBg:"#242428",
} : {
  bg:"#fdf8ea", card:"#fffdf4", edge:"#ece3c8", ink:"#1c1917", sub:"#57534e", faint:"#8a857c",
  good:"#16a34a", goodBg:"#dcfce7", amber:"#d97706", amberBg:"#fef3c7", red:"#dc2626", redBg:"#fee2e2",
  ctl:"#0284c7", atl:"#db2777", legs:"#ea580c", sh:"#7c3aed", core:"#0d9488",
  track:"#f1ead4", gridln:"#e6dcc0", chipBg:"#f4eed8",
});
let Cr = mkCr(true);

/* ════ 实时多通道数据 · 6/16 晨 (UPCSE §2 5分数/5潜变量 + §9 五通道) ════ */
const RT_SCORE = [
  { k: "恢复", v: 72, inv: false, note: "HRV高+RHR恢复" },
  { k: "压力", v: 25, inv: true,  note: "自主平静" },
  { k: "睡眠", v: 68, inv: false, note: "深睡差+入睡晚" },
  { k: "就绪", v: 69, inv: false, note: "体能尚可·腿是真限制" },
  { k: "认知", v: 76, inv: false, note: "可做案头/建模" },
];
const RT_LAT = [
  { l: "自主", v: 64 }, { l: "能量", v: 80 }, { l: "睡债低", v: 72 }, { l: "炎症", v: 14, inv: true }, { l: "认知储备", v: 77 },
];
const RT_Z = [
  { n: "HRV(隔夜)", v: "81ms", z: 1.1, adv: false },
  { n: "静息心率", v: "45bpm", z: 0.0, adv: false },
  { n: "呼吸率", v: "15.1", z: 1.5, adv: true },
  { n: "睡眠时长", v: "7.29h", z: 0.4, adv: false },
];
const RT_DAYS = ["5/27","5/28","5/29","5/30","5/31","6/1","6/2","6/3","6/4","6/5","6/6","6/7","6/8","6/9","6/10","6/11","6/12","6/13","6/14","6/15","6/16"];
const RT_CTL = [206,217,236,277,297,290,313,307,343,335,339,337,337,355,347,348,340,369,377,376,367];
const RT_ATL = [402,439,519,726,784,672,754,657,819,702,674,617,578,650,557,535,458,620,628,588,504];
const RT_DLEGS = [1.1,1.0,0.9,2.3,4.3,5.4,5.9,6.0,5.9,5.6,5.3,4.9,7.5,8.8,9.3,9.3,9.1,8.6,8.0,7.4,6.8,6.2,5.6,5.1,4.6,4.2,3.7,3.4,3.0];
const RT_DSH = [0,0,0,0.8,2.0,2.6,2.9,3.0,3.0,2.8,2.7,2.5,3.9,4.6,4.9,4.9,4.8,4.5,4.2,3.9,3.6,3.3,3.0,2.7,2.4,2.2,2.0,1.8,1.6];
const RT_DCORE = [0,0,0,0.6,1.4,1.9,2.1,2.2,2.2,2.1,2.0,1.8,3.2,4.0,4.4,4.4,4.3,4.1,3.9,3.6,3.3,3.0,2.7,2.5,2.2,2.0,1.8,1.6,1.5];

function Realtime() {
  const ringCol = (v, inv) => { const x = inv ? 100 - v : v; return x >= 70 ? Cr.good : x >= 50 ? Cr.amber : Cr.red; };
  const latCol = (v, inv) => inv ? (v < 25 ? Cr.good : Cr.amber) : (v >= 70 ? Cr.good : v >= 50 ? Cr.amber : Cr.red);
  const LW = 448, LH = 150, lx0 = 30, lx1 = 438, ly0 = 12, ly1 = 120;
  const lxm = (i) => lx0 + i / 20 * (lx1 - lx0);
  const lym = (v) => ly1 - ((v - 180) / (850 - 180)) * (ly1 - ly0);
  const DN = RT_DLEGS.length, dx0 = 24, dx1 = 438, dy0 = 12, dy1 = 120;
  const dxm = (i) => dx0 + i / (DN - 1) * (dx1 - dx0);
  const dym = (v) => dy1 - (v / 10) * (dy1 - dy0);
  const nowX = dx0 + (80 / 168) * (dx1 - dx0);
  return (
    <div style={{ background: Cr.bg, minHeight: "100vh", padding: "20px 13px 38px", color: Cr.ink,
      fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','Microsoft YaHei',sans-serif", maxWidth: 480, margin: "0 auto" }}>

      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.4, color: Cr.ctl, textTransform: "uppercase" }}>UPCSE · 现在状态 · §2 分数 + §9 多通道</div>
      <h1 style={{ fontSize: 19, fontWeight: 800, margin: "5px 0 2px" }}>现在状态 · 6/16 周二 · 晨</h1>
      <p style={{ fontSize: 11.5, color: Cr.sub, margin: "0 0 12px" }}>5 分数(整体) + 5 潜变量 + §9 五通道(各自独立·不合成) · ~08:00</p>

      <div style={{ background: Cr.amberBg, border: `1px solid ${Cr.amber}66`, borderRadius: 11, padding: "9px 13px", marginBottom: 14, fontSize: 12, lineHeight: 1.5 }}>
        <b style={{ color: Cr.good }}>整体大体绿、认知 76 可用脑</b>(找工作/CMBS),但 <b style={{ color: Cr.amber }}>就绪 69 把腿 DOMS 9/10 吸收掩盖了</b> —— 正是 §9 不合成的理由。<b style={{ color: Cr.ink }}>今天别练腿、别冲强度</b>;恢复仍 GOOD 但比昨天降一档(大餐压深睡)。
      </div>

      <SecTitle>UPCSE 5 分数 · 整体状态(§2)</SecTitle>
      <div style={{ display: "flex", gap: 3, marginBottom: 5 }}>
        {RT_SCORE.map((s) => {
          const col = ringCol(s.v, s.inv), r = 24, circ = 2 * Math.PI * r;
          return (
            <div key={s.k} style={{ flex: 1, textAlign: "center", minWidth: 0 }}>
              <svg width="58" height="58" viewBox="0 0 60 60">
                <circle cx="30" cy="30" r={r} fill="none" stroke={Cr.track} strokeWidth="6" />
                <circle cx="30" cy="30" r={r} fill="none" stroke={col} strokeWidth="6" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ * (1 - s.v / 100)} transform="rotate(-90 30 30)" />
                <text x="30" y="35" textAnchor="middle" fontSize="16" fontWeight="800" fill={Cr.ink}>{s.v}</text>
              </svg>
              <div style={{ fontSize: 11, fontWeight: 800, marginTop: -2 }}>{s.k}{s.inv ? "↓" : ""}</div>
              <div style={{ fontSize: 8, color: Cr.faint, lineHeight: 1.25 }}>{s.note}</div>
            </div>
          );
        })}
      </div>
      <div style={{ fontSize: 8.5, color: Cr.faint, marginBottom: 13, padding: "0 2px" }}>压力↓ = 低为好 · 分数=潜变量加权·权重见 Notion UPCSE §2</div>

      <SecTitle>5 生理潜变量(latent)</SecTitle>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
        {RT_LAT.map((l, i) => {
          const col = latCol(l.v, l.inv);
          return (
            <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 5, background: Cr.card, border: `1px solid ${Cr.edge}`, borderRadius: 20, padding: "4px 10px", fontSize: 10.5 }}>
              <span style={{ width: 7, height: 7, borderRadius: 4, background: col }} /><span style={{ color: Cr.sub }}>{l.l}</span><b style={{ color: col }}>{l.v}</b>
            </span>
          );
        })}
      </div>

      <SecTitle>§9 ④ 隔夜恢复锚 · z 分(vs 本周基线)</SecTitle>
      <div style={{ background: Cr.card, border: `1px solid ${Cr.edge}`, borderRadius: 12, padding: "11px 12px 9px", marginBottom: 13 }}>
        {RT_Z.map((o) => {
          const mag = Math.min(Math.abs(o.z) / 3, 1), col = o.adv ? (o.z > 1 ? Cr.red : Cr.amber) : Cr.good;
          return (
            <div key={o.n} style={{ marginBottom: 8 }}>
              <div style={{ display: "flex", fontSize: 10.5, marginBottom: 3 }}><span style={{ fontWeight: 700 }}>{o.n}</span><span style={{ marginLeft: "auto", color: Cr.sub }}>{o.v} · z {o.z > 0 ? "+" : ""}{o.z}</span></div>
              <div style={{ position: "relative", height: 8, background: Cr.track, borderRadius: 6 }}>
                <div style={{ position: "absolute", left: "50%", top: -1, bottom: -1, width: 1, background: Cr.faint }} />
                <div style={{ position: "absolute", top: 0, bottom: 0, borderRadius: 6, background: col, ...(o.adv ? { left: "50%", width: `${mag * 50}%` } : { right: "50%", width: `${mag * 50}%` }) }} />
              </div>
            </div>
          );
        })}
        <div style={{ marginTop: 4, padding: "7px 9px", borderRadius: 8, background: Cr.goodBg, fontSize: 10, color: Cr.good, fontWeight: 700, lineHeight: 1.4 }}>✓ 仅 1 项偏离(呼吸 15.1) → 未触发多指标警报。HRV 81 向好、RHR 回落 45(昨 52 赛后抬升已恢复);呼吸↑ + 深睡 0.48h = Nora 大餐晚食代价。</div>
      </div>

      <SecTitle>§9 ② 训练负荷 · CTL/ATL/TSB(实测 active energy)</SecTitle>
      <div style={{ background: Cr.card, border: `1px solid ${Cr.edge}`, borderRadius: 12, padding: "11px 10px 8px", marginBottom: 13 }}>
        <div style={{ display: "flex", gap: 13, flexWrap: "wrap", fontSize: 11, marginBottom: 7, padding: "0 4px" }}>
          <span style={{ color: Cr.sub }}>慢性CTL <b style={{ color: Cr.ctl }}>367</b></span>
          <span style={{ color: Cr.sub }}>急性ATL <b style={{ color: Cr.atl }}>504</b></span>
          <span style={{ color: Cr.sub }}>TSB <b style={{ color: Cr.red }}>−137</b></span>
          <span style={{ color: Cr.sub }}>ACWR <b style={{ color: Cr.amber }}>1.37</b></span>
        </div>
        <svg viewBox={`0 0 ${LW} ${LH}`} style={{ width: "100%", height: "auto" }}>
          {[300, 600].map((v) => (<g key={v}><line x1={lx0} y1={lym(v)} x2={lx1} y2={lym(v)} stroke={Cr.gridln} strokeWidth="1" /><text x={lx0 - 4} y={lym(v) + 3} textAnchor="end" fontSize="8" fill={Cr.faint}>{v}</text></g>))}
          {[0, 6, 12, 18, 20].map((i) => (<text key={i} x={lxm(i)} y={LH - 3} textAnchor="middle" fontSize="8" fill={Cr.faint}>{RT_DAYS[i]}</text>))}
          <polyline points={RT_CTL.map((v, i) => `${lxm(i)},${lym(v)}`).join(" ")} fill="none" stroke={Cr.ctl} strokeWidth="1.8" />
          <polyline points={RT_ATL.map((v, i) => `${lxm(i)},${lym(v)}`).join(" ")} fill="none" stroke={Cr.atl} strokeWidth="1.8" />
        </svg>
        <div style={{ display: "flex", gap: 13, padding: "2px 4px 0", fontSize: 9.5, color: Cr.sub }}><Lgu c={Cr.ctl} dot>慢性体能</Lgu><Lgu c={Cr.atl} dot>急性疲劳</Lgu></div>
        <div style={{ fontSize: 10.5, color: Cr.ink, lineHeight: 1.5, padding: "5px 4px 0" }}>ACWR <b style={{ color: Cr.amber }}>1.37</b>(自 1.46 缓和)、TSB 仍负 = 急性疲劳偏高但在退。<span style={{ color: Cr.faint }}>HR 自 ~6/8 停记 → 负荷用 active energy。6/4 4h(1789)客观 &gt; SS#3(1591)。</span></div>
      </div>

      <SecTitle>§9 ③ 肌肉酸痛 DOMS · 双指数(腿今天见顶)</SecTitle>
      <div style={{ background: Cr.card, border: `1px solid ${Cr.edge}`, borderRadius: 12, padding: "11px 10px 8px", marginBottom: 13 }}>
        <div style={{ display: "flex", gap: 16, fontSize: 11, marginBottom: 7, padding: "0 4px" }}>
          <span style={{ color: Cr.sub }}>腿 <b style={{ color: Cr.legs }}>9.0</b>/10</span>
          <span style={{ color: Cr.sub }}>肩 <b style={{ color: Cr.sh }}>4.7</b></span>
          <span style={{ color: Cr.sub }}>核心 <b style={{ color: Cr.core }}>4.2</b></span>
        </div>
        <svg viewBox={`0 0 ${LW} ${LH}`} style={{ width: "100%", height: "auto" }}>
          {[5, 10].map((v) => (<g key={v}><line x1={dx0} y1={dym(v)} x2={dx1} y2={dym(v)} stroke={Cr.gridln} strokeWidth="1" /><text x={dx0 - 3} y={dym(v) + 3} textAnchor="end" fontSize="8" fill={Cr.faint}>{v}</text></g>))}
          {[0, 4, 8, 12, 16, 20, 24, 28].map((i) => (<text key={i} x={dxm(i)} y={LH - 3} textAnchor="middle" fontSize="7.5" fill={Cr.faint}>{`6/${13 + Math.round(i * 6 / 24)}`}</text>))}
          <line x1={nowX} y1={dy0} x2={nowX} y2={dy1} stroke={Cr.ink} strokeWidth="1.2" strokeDasharray="2 2" />
          <text x={nowX + 2} y={dy0 + 8} fontSize="8" fill={Cr.ink}>今晨</text>
          <polyline points={RT_DLEGS.map((v, i) => `${dxm(i)},${dym(v)}`).join(" ")} fill="none" stroke={Cr.legs} strokeWidth="2.2" />
          <polyline points={RT_DSH.map((v, i) => `${dxm(i)},${dym(v)}`).join(" ")} fill="none" stroke={Cr.sh} strokeWidth="1.5" />
          <polyline points={RT_DCORE.map((v, i) => `${dxm(i)},${dym(v)}`).join(" ")} fill="none" stroke={Cr.core} strokeWidth="1.5" />
        </svg>
        <div style={{ display: "flex", gap: 13, padding: "2px 4px 0", fontSize: 9.5, color: Cr.sub }}><Lgu c={Cr.legs} dot>腿</Lgu><Lgu c={Cr.sh} dot>肩</Lgu><Lgu c={Cr.core} dot>核心</Lgu></div>
        <div style={{ fontSize: 10.5, color: Cr.ink, lineHeight: 1.5, padding: "5px 4px 0" }}><b style={{ color: Cr.legs }}>腿 9.0/10 今天见顶</b>(SS#3 + 昨晚腿日叠加),约 6–7 天消退。酸痛 ≠ 力量恢复 → 独立通道。<b style={{ color: Cr.ink }}>今天别练腿</b>。</div>
      </div>

      <SecTitle>§9 ① 实时心肺 + ⑤ 心理</SecTitle>
      <div style={{ background: Cr.card, border: `1px solid ${Cr.edge}`, borderRadius: 12, padding: "11px 13px", marginBottom: 13, fontSize: 10.5, lineHeight: 1.55, color: Cr.sub }}>
        <div style={{ marginBottom: 6 }}><b style={{ color: Cr.ink }}>① 心肺</b>:刚醒 HR 66 → <b style={{ color: Cr.good }}>~14% HRR</b>,日间数据待积累(08:00 刚起)。%HRR =(HR−45)/(190−45)。</div>
        <div><b style={{ color: Cr.ink }}>⑤ 心理</b>:HRV 高 → <b style={{ color: Cr.good }}>tonic 唤醒低</b>。效价 valence 生理信号分不出(压力 vs 兴奋同画像,需面部 EMG/EEG)→ 不追踪。神经肌肉(需 CMJ 纵跳)同。</div>
      </div>

      <SecTitle>今天 · 能量 + 行动</SecTitle>
      <div style={{ background: Cr.card, border: `1px solid ${Cr.edge}`, borderRadius: 12, padding: "11px 13px", marginBottom: 11 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", fontSize: 11.5, marginBottom: 6 }}>
          <b style={{ color: Cr.ink }}>大餐次日 · 体重 80.25 <span style={{ color: Cr.amber }}>+0.65</span></b>
          <span style={{ color: Cr.faint, fontSize: 10 }}>水+糖原,非脂肪</span>
        </div>
        <div style={{ fontSize: 10.5, color: Cr.sub, lineHeight: 1.55 }}>
          昨天 6/15 = Nora 大餐<b style={{ color: Cr.amber }}>盈余日</b>(摄入 ~3795,净 +600~965)→ 79.6→80.25 是食物+糖原结合水+钠,1–3 天回落。<b style={{ color: Cr.ink }}>今天正常缺口即可、别补偿</b>;晚餐复杂碳水照旧、别再晚食(护深睡)。
        </div>
      </div>
      <div style={{ background: Cr.goodBg, border: `1px solid ${Cr.good}44`, borderRadius: 12, padding: "11px 13px", marginBottom: 13, fontSize: 11.5, lineHeight: 1.6 }}>
        <div style={{ marginBottom: 5 }}><b style={{ color: Cr.good }}>✅ 认知窗口:</b> 自主回升 + 睡够 + 认知 76 → 今天适合<b style={{ color: Cr.ink }}>高强度脑力(找工作 / CMBS 建模 / 面试准备)</b>,趁状态推进。</div>
        <div style={{ color: Cr.sub }}><b style={{ color: Cr.amber }}>⚠️ 身体侧:</b> 腿 DOMS 今天见顶 → <b style={{ color: Cr.ink }}>别练腿、别冲强度</b>;要动选上肢 / 轻有氧 / 主动恢复。</div>
      </div>
      <div style={{ fontSize: 9, color: Cr.faint, lineHeight: 1.5, marginTop: 4 }}>
        §9 计算法见 Notion UPCSE:%HRR · Banister TRIMP · CTL/ATL EWMA(/42,/7)· DOMS 双指数(τr16/τd55)· z + SWC(0.5×CV)· arousal 可读 / valence 不可读。各通道独立、不合成 · n=1 非因果。
      </div>
    </div>
  );
}

function IntegratedReport() {
  const [tab, setTab] = useState("rt");
  const isDark = useIsDark();
  Cs = mkCs(isDark); Cu = mkCu(isDark); Cw = mkCw(isDark); Cr = mkCr(isDark);
  const W = isDark ? {
    bg:"#1c1c1e", grad:"linear-gradient(135deg,#2a2a2c 0%,#1c1c1e 100%)", bd:"#3a3a3c",
    ink:"#f2f2f7", sub:"#a1a1aa", sub2:"#c9c9ce", faint:"#71717a",
    good:"#4ade80", goodBg:"#143a26", amber:"#fbbf24", band:"#22c55e",
    tabOnBg:"#3a3a3c", tabOnBd:"#52525b", tabOffBd:"#2a2a2c", barBg:"#1c1c1e", barBd:"#2a2a2c", dash:"#3a3a3c",
  } : {
    bg:"#fdf8ea", grad:"linear-gradient(135deg,#fffdf4 0%,#fbf3da 100%)", bd:"#ece3c8",
    ink:"#1c1917", sub:"#57534e", sub2:"#44403c", faint:"#8a857c",
    good:"#16a34a", goodBg:"#dcfce7", amber:"#d97706", band:"#16a34a",
    tabOnBg:"#fffdf4", tabOnBd:"#d8cda8", tabOffBd:"#ece3c8", barBg:"#fdf8ea", barBd:"#ece3c8", dash:"#e6dcc0",
  };
  const TABS = [
    { k: "rt", emoji: "⚡", label: "现在状态" },
    { k: "sleep",  emoji: "\ud83d\ude34", label: "睡眠/恢复" },
    { k: "energy", emoji: "\ud83d\udd25", label: "热量/体重" },
  ];
  return (
    <div style={{ maxWidth: 480, margin: "0 auto", background: W.bg,
      fontFamily: "-apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', sans-serif" }}>

      <div style={{ padding: "15px 16px 13px", background: W.grad, color: W.ink,
        borderBottom: `1px solid ${W.bd}` }}>
        <div style={{ fontSize: 12, color: W.sub, letterSpacing: 0.3 }}>
          📅 6/16 周二 · <span style={{ color: W.amber, fontWeight: 700 }}>大餐次日</span>
          <span style={{ color: W.faint }}> · 腿 DOMS 见顶 · 别练腿</span>
        </div>
        <div style={{ fontSize: 19, fontWeight: 800, margin: "5px 0 2px", display: "flex", alignItems: "baseline", gap: 8 }}>
          今晨 80.25<span style={{ fontSize: 13, fontWeight: 600, color: W.sub }}>kg</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: W.amber, background: W.goodBg, padding: "2px 7px", borderRadius: 6 }}>大餐 blip +0.65 ↑</span>
        </div>
        <div style={{ fontSize: 11.5, color: W.sub2, lineHeight: 1.5 }}>
          79.6→80.25 隔夜 <b style={{ color: W.amber }}>+0.65kg = 食物+糖原结合水+钠潴留</b>(Nora 大餐)，非脂肪，1–3 天回落。<b style={{ color: W.good }}>只看周趋势</b>。
        </div>
        <div style={{ fontSize: 10, color: W.faint, lineHeight: 1.5, marginTop: 6,
          borderTop: `1px dashed ${W.dash}`, paddingTop: 6 }}>
          ⓘ 全部面板已更新到 6/16：<b style={{ color: W.band }}>现在状态</b>=5分数+5潜变量+§9五通道 · <b style={{ color: W.band }}>睡眠</b>=6/15夜→6/16晨(深睡偏低) · <b style={{ color: W.band }}>热量</b>=体重 80.25+近7天能量(6/15 盈余) · 实时与现在状态已合并去重(3 tab 均 6/16)
        </div>
      </div>

      <div style={{ display: "flex", gap: 6, padding: "10px 12px",
        background: W.barBg, position: "sticky", top: 0, zIndex: 20,
        borderBottom: `1px solid ${W.barBd}` }}>
        {TABS.map((t) => {
          const on = tab === t.k;
          return (
            <button key={t.k} onClick={() => setTab(t.k)} style={{
              flex: 1, padding: "9px 4px", borderRadius: 9, cursor: "pointer",
              fontSize: 12.5, fontWeight: on ? 800 : 600,
              border: on ? `1px solid ${W.tabOnBd}` : `1px solid ${W.tabOffBd}`,
              background: on ? W.tabOnBg : "transparent",
              color: on ? W.ink : W.faint, transition: "all .15s",
            }}>
              <div style={{ fontSize: 16, marginBottom: 1 }}>{t.emoji}</div>{t.label}
            </button>
          );
        })}
      </div>

      <div>
        {tab === "rt"     && <Realtime />}
        {tab === "sleep"  && <SleepVF />}
        {tab === "energy" && <WeightEngine />}
      </div>
    </div>
  );
}

export default IntegratedReport;
