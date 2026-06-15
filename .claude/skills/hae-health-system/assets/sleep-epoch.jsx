// sleep-epoch — 睡眠逐分钟版 artifact 模板(来自 Notion《睡眠和恢复》Example)
// hypnogram(精确阶段总量,时序对齐逐分钟 HR)+ 逐分钟心率/呼吸,同一时间轴(SVG)。
// 数据每日重生成;晨报中作为「😴 睡眠/恢复」tab,与 fatloss-engine 顶层 tab 拼接。
import React from "react";
import { Layers, CheckCircle2, AlertTriangle, Activity } from "lucide-react";

/* ===== fused hypnogram (exact stage TOTALS from CSV; timing aligned to per-minute HR) ===== */
const STAGES = {
  Awake: { lane: 0, c: "#fb923c", label: "清醒" },
  REM:   { lane: 1, c: "#38bdf8", label: "REM" },
  Core:  { lane: 2, c: "#3b82f6", label: "核心" },
  Deep:  { lane: 3, c: "#4f46e5", label: "深睡" },
};
const SEG = [
  [22.90, 23.40, "Awake"], [23.40, 24.05, "Core"], [24.05, 24.55, "Deep"],
  [24.55, 25.35, "Core"],  [25.35, 26.30, "Deep"], [26.30, 26.83, "Core"],
  [26.83, 28.40, "Awake"], [28.40, 28.70, "Core"], [28.70, 29.35, "Awake"],
  [29.35, 29.75, "REM"],   [29.75, 30.70, "Core"], [30.70, 31.05, "REM"],
  [31.05, 32.00, "Core"],  [32.00, 32.30, "Awake"],[32.30, 32.55, "Core"],
  [32.55, 32.78, "Awake"],
];

/* ===== per-minute HR (avg) — parsed from HealthMetrics CSV (125 pts) ===== */
const HR = [[24.067,43],[24.117,46],[24.183,49.9],[24.2,48],[24.3,47],[24.35,51],[24.417,47],[24.433,47.3],[24.45,46],[24.55,45],[24.683,44.8],[24.7,44],[24.767,45],[24.9,44],[24.933,44.6],[25.067,45],[25.1,45],[25.183,45],[25.2,45],[25.267,43],[25.4,53.5],[25.433,46.4],[25.5,46],[25.533,43],[25.6,44],[25.683,54.2],[25.75,43],[25.783,43],[25.9,41],[25.933,42.6],[25.95,42],[26.1,43],[26.167,44],[26.183,42.1],[26.233,42],[26.317,41],[26.35,42],[26.433,42.6],[26.45,43],[26.583,41],[26.683,41],[26.7,39.4],[26.717,40],[26.817,45],[26.883,50],[26.95,46.1],[26.967,49],[27.05,47],[27.1,47],[27.183,52.5],[27.217,50],[27.3,49],[27.4,54],[27.433,56],[27.5,50],[27.583,56],[27.633,53],[27.683,54.1],[27.7,54],[27.817,54],[27.85,49],[27.933,82.8],[28.017,53],[28.067,52],[28.133,54],[28.183,56.2],[28.267,58],[28.333,59],[28.367,54],[28.5,63],[28.517,58],[28.633,58],[28.7,53.9],[28.767,54],[28.883,52],[28.933,52.8],[28.967,53],[29.017,60],[29.083,52],[29.117,59],[29.167,49],[29.183,51.3],[29.25,48],[29.267,53],[29.383,51],[29.433,54],[29.45,52],[29.6,53],[29.683,48.4],[29.717,48],[29.833,49],[29.883,48],[29.933,47.6],[30,49],[30.067,51],[30.167,52],[30.183,51.9],[30.267,52],[30.283,52],[30.383,46],[30.417,47],[30.433,46.6],[30.6,46],[30.65,48],[30.683,47.4],[30.733,48],[30.8,48],[30.85,48],[30.883,47],[30.933,46.5],[30.95,47],[31.067,59],[31.133,58],[31.183,68],[31.217,54],[31.283,48],[31.417,48],[31.433,48.5],[31.55,49],[31.633,49],[31.683,53.7],[31.767,53],[31.783,54],[31.9,52],[31.933,51.2]];

/* ===== per-minute respiratory rate (40 pts) ===== */
const RESP = [[24.117,15.5],[24.3,14.5],[24.4,15.5],[24.683,15],[24.867,14.5],[25.033,14.5],[25.1,14.5],[25.367,18],[25.45,14],[25.617,14.5],[25.783,14.5],[25.967,14],[26.117,14.5],[26.283,14],[26.483,14.5],[26.6,13],[27.6,18],[27.833,13.5],[27.967,20],[28.067,17],[28.267,16],[28.433,19],[28.717,16.5],[28.733,16.5],[29.4,15.5],[29.45,15],[29.7,16.5],[29.867,16],[29.967,15],[30.117,16],[30.25,17],[30.55,16],[30.7,13.5],[30.833,13.5],[30.917,13.5],[31.1,16.5],[31.383,17.5],[31.467,16.5],[31.717,19],[31.817,16.5]];

const FINALS = [26.83, 29.17];
const TOTALS = [
  { label: "深睡", min: 89, pct: 22, c: "#4f46e5", tag: "达标", ok: true },
  { label: "核心", min: 268, pct: 67, c: "#3b82f6", tag: "偏高", ok: null },
  { label: "REM", min: 45, pct: 11, c: "#38bdf8", tag: "偏低", ok: false },
  { label: "清醒", min: 191, pct: null, c: "#fb923c", tag: null, ok: null },
];
const WINDOWS = [
  { label: "深睡 01:50–02:45", hr: 41.8, rp: 14.0, c: "#4f46e5" },
  { label: "看球 02:50–05:10", hr: 54.2, rp: 17.1, c: "#fb923c", hot: true },
  { label: "重新入睡 05:30–07:00", hr: 48.6, rp: 15.2, c: "#3b82f6" },
];

/* geometry */
const W = 1000, PADL = 60, PADR = 54, T0 = 22.78, T1 = 32.85;
const sx = (t) => PADL + ((t - T0) / (T1 - T0)) * (W - PADL - PADR);
const HYP_TOP = 50, LANE_H = 30, BAR_H = 17;
const laneTop = (l) => HYP_TOP + l * LANE_H;
const AU_TOP = 230, AU_BOT = 412;
const HRMIN = 38, HRMAX = 68, RPMIN = 12, RPMAX = 22;
const hrY = (v) => AU_BOT - ((Math.min(v, HRMAX) - HRMIN) / (HRMAX - HRMIN)) * (AU_BOT - AU_TOP);
const rpY = (v) => AU_BOT - ((v - RPMIN) / (RPMAX - RPMIN)) * (AU_BOT - AU_TOP);
const TICKS = [[23, "23:00"], [24, "00:00"], [26, "02:00"], [28, "04:00"], [30, "06:00"], [32, "08:00"]];

export default function SleepEpoch() {
  return (
    <div className="min-h-screen w-full bg-slate-50 px-5 py-7 text-slate-900 [font-feature-settings:'tnum']">
      <div className="mx-auto max-w-3xl">

        <div className="flex items-start gap-2 text-indigo-600">
          <Layers size={20} className="mt-0.5" />
          <div>
            <div className="text-[12px] font-medium uppercase tracking-[0.16em]">睡眠全景 · 逐分钟版</div>
            <h1 className="mt-0.5 text-xl font-bold tracking-tight text-slate-900">分期 × 心率 × 呼吸,同一时间轴 · 6/10 夜→6/11 晨</h1>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[12px]">
          <span className="font-semibold text-indigo-700">真实睡眠 ~6.9h</span>
          <span className="text-slate-300">|</span><span className="text-slate-600">效率 ~70%</span>
          <span className="text-slate-300">|</span><span className="text-slate-600">在床 9h53m</span>
          <span className="text-slate-300">|</span>
          <span className="text-cyan-700">125 个逐分钟心率点</span>
          <span className="text-slate-300">|</span><span className="font-medium text-emerald-700">D-2 可以</span>
        </div>

        {/* unified chart */}
        <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-3">
          <svg viewBox={`0 0 ${W} 462`} className="w-full" style={{ height: "auto" }}>
            <rect x={sx(FINALS[0])} y={HYP_TOP - 8} width={sx(FINALS[1]) - sx(FINALS[0])} height={AU_BOT - HYP_TOP + 8} fill="#fffbeb" stroke="#fde68a" />
            <text x={(sx(FINALS[0]) + sx(FINALS[1])) / 2} y={HYP_TOP - 13} textAnchor="middle" fontSize="11" fontWeight="700" fill="#d97706">看球唤醒 · 心率↑ + 呼吸↑</text>

            <text x={PADL} y={32} fontSize="12" fontWeight="700" fill="#334155">① 睡眠分期</text>
            <text x={PADL} y={AU_TOP - 14} fontSize="12" fontWeight="700" fill="#334155">② 逐分钟心率(玫红) + 呼吸率(青)</text>

            {/* hypnogram */}
            {Object.entries(STAGES).map(([k, s]) => (
              <g key={k}>
                <rect x={PADL} y={laneTop(s.lane)} width={W - PADL - PADR} height={LANE_H} fill={s.lane % 2 ? "#f8fafc" : "#fff"} />
                <text x={PADL - 7} y={laneTop(s.lane) + LANE_H / 2 + 4} textAnchor="end" fontSize="10.5" fontWeight="600" fill="#64748b">{s.label}</text>
              </g>
            ))}
            {SEG.slice(0, -1).map((seg, i) => {
              const nx = SEG[i + 1], x = sx(seg[1]);
              return <line key={`c${i}`} x1={x} y1={laneTop(STAGES[seg[2]].lane) + LANE_H / 2} x2={x} y2={laneTop(STAGES[nx[2]].lane) + LANE_H / 2} stroke="#e2e8f0" strokeWidth="1.5" />;
            })}
            {SEG.map((seg, i) => {
              const [a, b, st] = seg;
              return <rect key={i} x={sx(a)} y={laneTop(STAGES[st].lane) + (LANE_H - BAR_H) / 2} width={Math.max(2.5, sx(b) - sx(a))} height={BAR_H} rx={4} fill={STAGES[st].c} />;
            })}

            {/* autonomic axes */}
            {[40, 50, 60].map((v) => <text key={v} x={PADL - 7} y={hrY(v) + 4} textAnchor="end" fontSize="9.5" fill="#f43f5e">{v}</text>)}
            <text x={PADL - 7} y={AU_TOP - 2} textAnchor="end" fontSize="9" fontWeight="600" fill="#f43f5e">bpm</text>
            {[13, 17, 21].map((v) => <text key={v} x={W - PADR + 7} y={rpY(v) + 4} textAnchor="start" fontSize="9.5" fill="#0d9488">{v}</text>)}
            <text x={W - PADR + 7} y={AU_TOP - 2} textAnchor="start" fontSize="9" fontWeight="600" fill="#0d9488">br/min</text>

            {/* respiratory (under HR) */}
            <polyline fill="none" stroke="#0d9488" strokeWidth="1.6" strokeOpacity="0.75" points={RESP.map(([t, v]) => `${sx(t)},${rpY(v)}`).join(" ")} />
            {RESP.map(([t, v], i) => <circle key={`rp${i}`} cx={sx(t)} cy={rpY(v)} r="1.8" fill="#0d9488" />)}

            {/* per-minute HR curve */}
            <polyline fill="none" stroke="#f43f5e" strokeWidth="2" points={HR.map(([t, v]) => `${sx(t)},${hrY(v)}`).join(" ")} />
            {/* spike marker */}
            <text x={sx(27.933)} y={hrY(68) - 5} textAnchor="middle" fontSize="9" fontWeight="700" fill="#9f1239">↑82 体动</text>

            {/* annotations */}
            <text x={sx(26.7)} y={hrY(39.4) + 15} textAnchor="middle" fontSize="9.5" fontWeight="700" fill="#4f46e5">深睡谷底·HR39·呼吸14</text>
            <text x={sx(28.05)} y={AU_TOP + 12} textAnchor="middle" fontSize="9.5" fontWeight="700" fill="#d97706">HR均54 · 呼吸均17</text>
            <text x={sx(31.18)} y={hrY(68) - 4} textAnchor="middle" fontSize="9.5" fontWeight="700" fill="#f43f5e">07:00+ 醒</text>

            {TICKS.map(([t, lab]) => (
              <g key={t}>
                <line x1={sx(t)} y1={HYP_TOP} x2={sx(t)} y2={AU_BOT} stroke="#f1f5f9" />
                <text x={sx(t)} y={AU_BOT + 17} textAnchor="middle" fontSize="10.5" fill="#94a3b8">{lab}</text>
              </g>
            ))}
          </svg>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 px-1 text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5"><span className="h-[2px] w-4 rounded bg-rose-500" />心率(bpm,左)</span>
            <span className="flex items-center gap-1.5"><span className="h-[2px] w-4 rounded bg-teal-600" />呼吸率(br/min,右)</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-3 rounded-sm bg-amber-100 ring-1 ring-amber-300" />看球唤醒</span>
          </div>
        </div>

        {/* window cross-validation */}
        <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-700">
            <Activity size={14} className="text-amber-600" /> 分窗交叉验证:心率 + 呼吸 同时在看球段抬升
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {WINDOWS.map((w) => (
              <div key={w.label} className={`rounded-xl border px-2.5 py-2 ${w.hot ? "border-amber-300 bg-amber-50/70" : "border-slate-200 bg-slate-50/50"}`}>
                <div className="text-[10.5px] font-medium text-slate-500">{w.label}</div>
                <div className="mt-1 flex items-baseline gap-1"><span className="text-[10px] text-rose-500">HR</span><span className={`text-base font-bold tabular-nums ${w.hot ? "text-amber-700" : "text-slate-800"}`}>{w.hr}</span></div>
                <div className="flex items-baseline gap-1"><span className="text-[10px] text-teal-600">呼吸</span><span className={`text-sm font-semibold tabular-nums ${w.hot ? "text-amber-700" : "text-slate-700"}`}>{w.rp}</span></div>
              </div>
            ))}
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
            深睡时心率 42、呼吸 14(低而规律);看球段心率跳到 <b className="text-amber-700">54</b>、呼吸升到 <b className="text-amber-700">17</b> —— <b>两个独立信号同时抬升</b>,把"手表记成睡眠"的这段坐实为清醒。
          </p>
        </div>

        {/* exact stage chips */}
        <div className="mt-3 grid grid-cols-4 gap-2">
          {TOTALS.map((s) => (
            <div key={s.label} className="rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-center">
              <div className="flex items-center justify-center gap-1">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.c }} /><span className="text-[11px] font-medium text-slate-600">{s.label}</span>
              </div>
              <div className="mt-0.5 text-sm font-bold tabular-nums text-slate-800">{s.min}m</div>
              {s.pct != null && (
                <div className={`flex items-center justify-center gap-0.5 text-[10px] ${s.ok === true ? "text-emerald-600" : s.ok === false ? "text-rose-600" : "text-slate-400"}`}>
                  {s.ok === true && <CheckCircle2 size={10} />}{s.ok === false && <AlertTriangle size={10} />}{s.pct}% · {s.tag}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-3 text-[12px] leading-relaxed text-amber-950">
          <b>逐分钟数据把判断坐实了(~6.9h 不变,但证据更硬):</b> 02:42 深睡谷底(HR39/呼吸14)→ 02:50–05:10 看球唤醒(HR54/呼吸17,含 03:56 体动尖峰)→ 之后重新入睡。
          <b className="text-amber-700"> 被吃掉的仍是 REM(凌晨),深睡保住</b> → 今晚补后半夜,明天 D-1 守 8h,SS#3 没问题。
        </div>

        <p className="mt-3 px-1 text-[10px] leading-relaxed text-slate-400">
          心率/呼吸=HAE HealthMetrics 逐分钟样本(00:04–07:56,数值启发式分列:35–110=心率、12–26=呼吸;nadir 39.41@02:42 校验通过)。Apple 睡眠时心率为机会性采样(每几分钟),非每分钟连续;03:56 的 82bpm 为单点体动伪迹。阶段总量=HAE 精确导出(双源合并,对账在床 9h53m);分期条时间位置按心率/呼吸事件对齐。HRV(稀疏)本版未叠加。真实 TST ~6.9h 为手表(8h 高估)与合并(6.7h)间融合估计。n=1,非因果。
        </p>
      </div>
    </div>
  );
}
