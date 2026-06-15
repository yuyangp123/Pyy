// fatloss-engine-v3 — 减脂引擎 artifact 模板(来自 Notion《减脂引擎》Example)
// recharts 三视图(周/月/年)+ 摄入vs消耗/净值 switcher + 营养审计。数据每日重生成。
// 晨报中作为「🔥 热量/体重」tab,与 sleep-epoch 顶层 tab 拼接。
// ⚠️ recharts 图元必须独立直接子级,绝不包进 React.Fragment(否则线/柱不渲染)。
import React, { useState } from "react";
import {
  ComposedChart, Line, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ReferenceArea, ReferenceDot, ResponsiveContainer,
} from "recharts";

/* ════ palette ════ */
const C = {
  bg: "#faf9f7", card: "#fff", ink: "#1c1917", sub: "#78716c", line: "#e7e5e4",
  weight: "#4338ca", intake: "#ea580c", tdee: "#0e7490", bmr: "#d6d3d1",
  good: "#15803d", goodSoft: "#86efac", goodBg: "#dcfce7", warn: "#b45309", warnBg: "#fef3c7",
  red: "#dc2626", redSoft: "#fca5a5", slate: "#64748b", gold: "#b8860b",
};

/* ════ goal (年视图已含轨迹/进度,这里只留常量供投影) ════ */
const G = { start: 85.0, target: 75.0, now: 79.6, rate: 0.71, r2: 0.74, eta: "~7/26" };

/* ════ DATA ════ */
// WEEK 6/5–6/11 · net=intake−tdee · active=tdee−bmr(1900,含TEF近似)
const WEEK = [
  { x: "6/5", w: 80.8, intake: null, tdee: null, bmr: null, active: null, net: null },
  { x: "6/6", w: null, intake: 3060, tdee: 2942, bmr: 1900, active: 1042, net: 118 },
  { x: "6/7", w: 80.5, intake: 2640, tdee: 2477, bmr: 1900, active: 577, net: 163 },
  { x: "6/8", w: 80.8, intake: 2500, tdee: 2650, bmr: 1900, active: 750, net: -150 },
  { x: "6/9", w: 80.8, intake: null, tdee: null, bmr: null, active: null, net: null },
  { x: "6/10", w: null, intake: 2260, tdee: 2220, bmr: 1900, active: 320, net: 40 },
  { x: "6/11", w: 79.6, intake: null, tdee: null, bmr: null, active: null, net: null },
];
const MONTH = [
  { x: "5/11", w: 82.6 }, { x: "5/17", w: 82.5 }, { x: "5/19", w: 81.8 },
  { x: "5/21", w: 81.4 }, { x: "5/24", w: 81.4 }, { x: "5/25", w: 81.8 },
  { x: "5/26", w: 81.1 }, { x: "5/28", w: 81.5 }, { x: "5/29", w: 81.5 },
  { x: "6/1", w: 80.8 }, { x: "6/4", w: 81.1 }, { x: "6/5", w: 80.8 },
  { x: "6/7", w: 80.5 }, { x: "6/8", w: 80.8 }, { x: "6/9", w: 80.8 }, { x: "6/11", w: 79.6 },
];
const YEAR = [
  { x: "4/19", w: 85.0, p: null }, { x: "5/11", w: 82.6, p: null }, { x: "5/19", w: 81.8, p: null },
  { x: "5/26", w: 81.1, p: null }, { x: "6/1", w: 80.8, p: null }, { x: "6/11", w: 79.6, p: 79.6 },
  { x: "7/1", w: null, p: 77.6 }, { x: "7/26", w: null, p: 75.0 }, { x: "8/24", w: null, p: 75.0 }, { x: "9/30", w: null, p: 75.0 },
];
const AVG = { intake: 2081, tdee: 2712 };
const TGT_LO = AVG.tdee - 770, TGT_HI = AVG.tdee - 500;

const VIEWS = {
  week: { label: "周", range: "近 7 天 · 6/5–6/11", wDom: [79, 81.5] },
  month: { label: "月", range: "近 30 天 · 5/11–6/11", wDom: [79, 83] },
  year: { label: "年", range: "本轮全程 + 目标投影 · 2026", wDom: [74, 86] },
};

/* ════ 针对实际食物的审计 ════ */
const FOOD = {
  keep: {
    title: "继续 — 对皮肤和减脂都好", color: C.good,
    items: [
      ["三文鱼", "6/10 午", "omega-3 抗炎 + 锌 + 瘦蛋白。你单子里最好的一项 ⭐ 想加 HS 收益就多吃"],
      ["烤鸡 腿/胸/翅", "6/6 6/11", "瘦蛋白 + 锌 + B12。注意:翅带皮脂肪高;peri-peri 酱有的含糖,挑清淡的"],
      ["鸡蛋", "6/10 早", "蛋白 + 锌 + 胆碱,饱腹。4 蛋那种早餐就对"],
      ["草莓", "6/8", "低 GI + 抗氧化抗炎 ⭐ 想吃甜的就用它替糖"],
      ["燕麦", "常吃", "纤维 + 低 GI + 养肠道菌群。前提:别加糖/蜂蜜,加蛋白才扛饿"],
    ],
  },
  cut: {
    title: "减少 / 替换 — 皮肤+减脂双重漏", color: C.red,
    items: [
      ["红牛", "6/10 早", "~28g 糖 → 胰岛素/IGF-1 飙(HS 负面)+ 115 空卡。换 sugar-free 红牛 / 黑咖啡 ⭐"],
      ["2 包果泥", "6/11 早", "~165 卡纯糖 0 蛋白,高 GI 又没饱腹 → 又伤皮肤又是糟糕早餐。换成蛋 / Skyr+燕麦 ⭐"],
      ["彩虹糖", "习惯零食", "高 GI 纯糖。HS 负面 + 你缺口最大的那个漏。砍它 = 单刀价值最高 ⭐⭐"],
      ["白米饭", "6/6 6/8 6/11", "高 GI。换糙米 / 减量 / 必配蛋白+菜钝化血糖。蛋炒饭(米+油)尤其要小份"],
      ["土豆泥 / 薯饼", "6/10 6/6", "高 GI + 常加黄油。换红薯(低 GI)或减量"],
    ],
  },
  nuance: {
    title: "看情况 — 不用一刀切", color: C.slate,
    items: [
      ["坚果 / 黑巧", "习惯零食", "坚果好脂肪但热量密(就是那 +200);黑巧选 70%+ 才抗炎,牛奶/含糖巧=糖。各一小份"],
      ["Skyr / cottage cheese", "睡前", "低脂发酵乳益生菌可能抗炎,比高脂乳温和;但仍是乳制品 → 控量。HS 若发作,可试停乳 4–6 周看反应"],
      ["全麦面包 / 香蕉", "6/10 / 常吃", "中 GI + 纤维/钾。放在运动前后吃问题不大"],
    ],
  },
};

export default function FatLossEngineV3() {
  const [view, setView] = useState("week");
  const [eMode, setEMode] = useState("breakdown"); // net | breakdown (week only)
  const V = VIEWS[view];
  const data = view === "week" ? WEEK : view === "month" ? MONTH : YEAR;

  const isWeek = view === "week";
  const showKcal = view !== "year";
  const kgOrient = isWeek ? "right" : "left";
  const kcalOrient = isWeek ? "left" : "right";
  const kcalDom = isWeek ? (eMode === "net" ? [-800, 420] : [0, 3300]) : [1700, 3300];

  return (
    <div style={{ background: C.bg, minHeight: "100vh", padding: "18px 13px 38px",
      fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','Microsoft YaHei',sans-serif",
      color: C.ink, maxWidth: 480, margin: "0 auto" }}>

      <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: 1.3, color: C.sub, textTransform: "uppercase" }}>
        减脂引擎 · 摄入 vs 消耗 vs 结果
      </div>
      <h1 style={{ fontSize: 19.5, fontWeight: 800, lineHeight: 1.32, margin: "7px 0 5px" }}>
        盈余,是<span style={{ color: C.intake }}>吃得多</span>还是<span style={{ color: C.tdee }}>动得少</span>?切到「摄入vs消耗」看
      </h1>
      <p style={{ fontSize: 12.5, color: C.sub, lineHeight: 1.5, margin: "0 0 13px" }}>
        消耗柱 = <b style={{ color: C.bmr }}>BMR</b>(灰,只是活着)+ <b style={{ color: C.tdee }}>活动</b>(青,动得越多越高);橙点 = 吃进。橙点高于柱顶 = 盈余。
      </p>

      {/* main tabs */}
      <div style={{ display: "flex", gap: 7, marginBottom: 10 }}>
        {Object.keys(VIEWS).map((k) => {
          const on = k === view;
          return (
            <button key={k} onClick={() => setView(k)}
              style={{ flex: 1, padding: "9px 0", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer",
                border: `1.5px solid ${on ? C.ink : C.line}`, background: on ? C.ink : C.card, color: on ? "#fff" : C.sub }}>
              {VIEWS[k].label}视图
            </button>
          );
        })}
      </div>

      {/* energy sub-switcher (week only) */}
      {isWeek && (
        <div style={{ display: "flex", gap: 6, marginBottom: 12, background: "#f1f5f9", padding: 4, borderRadius: 10 }}>
          {[["breakdown", "摄入 vs 消耗"], ["net", "净值 (缺口)"]].map(([k, lab]) => {
            const on = k === eMode;
            return (
              <button key={k} onClick={() => setEMode(k)}
                style={{ flex: 1, padding: "7px 0", borderRadius: 7, fontSize: 12.5, fontWeight: 700, cursor: "pointer",
                  border: "none", background: on ? C.card : "transparent", color: on ? C.ink : C.sub,
                  boxShadow: on ? "0 1px 2px rgba(0,0,0,.08)" : "none" }}>
                {lab}
              </button>
            );
          })}
        </div>
      )}

      {/* CHART */}
      <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: "14px 11px 12px",
        marginBottom: 12, boxShadow: "0 1px 2px rgba(0,0,0,.03)" }}>
        <div style={{ fontSize: 15, fontWeight: 800, padding: "0 4px 7px" }}>{V.range}</div>

        {/* legend */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 11px", padding: "0 4px 8px", fontSize: 10.5, color: C.sub }}>
          <Lg c={C.weight} sq>体重</Lg>
          {isWeek && eMode === "breakdown" && <><Lg c={C.bmr} sq>BMR</Lg><Lg c={C.tdee} sq>活动</Lg><Lg c={C.intake}>摄入(点)</Lg></>}
          {isWeek && eMode === "net" && <><Lg c={C.goodSoft} sq>缺口</Lg><Lg c={C.redSoft} sq>盈余</Lg><Lg c={C.goodBg} band>目标减脂区</Lg></>}
          {view === "month" && <><Lg c={C.intake} dash>摄入均</Lg><Lg c={C.tdee} dash>消耗均</Lg><Lg c={C.goodBg} band>目标摄入区</Lg></>}
          {view === "year" && <><Lg c={C.gold} dash>投影→75</Lg><Lg c={C.gold} dash>目标线</Lg></>}
        </div>

        <div style={{ height: 256 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 14, right: 8, left: -14, bottom: 0 }}>
              <CartesianGrid stroke={C.line} vertical={false} />
              <XAxis dataKey="x" tick={{ fontSize: 10, fill: C.sub }} axisLine={{ stroke: C.line }} tickLine={false}
                interval={view === "month" ? 2 : 0} minTickGap={4} />
              <YAxis yAxisId="kg" orientation={kgOrient} domain={V.wDom} tick={{ fontSize: 10, fill: C.weight }}
                axisLine={false} tickLine={false} width={32} tickFormatter={(v) => v.toFixed(0)} />
              {showKcal &&
                <YAxis yAxisId="kcal" orientation={kcalOrient} domain={kcalDom} tick={{ fontSize: 9, fill: C.sub }}
                  axisLine={false} tickLine={false} width={34}
                  tickFormatter={(v) => (isWeek && eMode === "net") ? v : (v / 1000).toFixed(1) + "k"} />}

              {/* WEEK · net mode refs */}
              {isWeek && eMode === "net" &&
                <ReferenceArea yAxisId="kcal" y1={-770} y2={-500} fill={C.goodBg} fillOpacity={0.7} />}
              {isWeek && eMode === "net" &&
                <ReferenceLine yAxisId="kcal" y={0} stroke={C.slate} strokeDasharray="2 3"
                  label={{ value: "维持", position: "insideTopLeft", fontSize: 9.5, fill: C.slate }} />}

              {/* MONTH refs (each a DIRECT child — no fragment) */}
              {view === "month" &&
                <ReferenceArea yAxisId="kcal" y1={TGT_LO} y2={TGT_HI} fill={C.goodBg} fillOpacity={0.7} />}
              {view === "month" &&
                <ReferenceLine yAxisId="kcal" y={AVG.tdee} stroke={C.tdee} strokeDasharray="5 4" strokeWidth={1.4}
                  label={{ value: `消耗均 ${AVG.tdee}`, position: "insideTopLeft", fontSize: 9, fill: C.tdee }} />}
              {view === "month" &&
                <ReferenceLine yAxisId="kcal" y={AVG.intake} stroke={C.intake} strokeDasharray="5 4" strokeWidth={1.4}
                  label={{ value: `摄入均 ${AVG.intake}`, position: "insideBottomLeft", fontSize: 9, fill: C.intake }} />}

              {/* YEAR refs */}
              {view === "year" &&
                <ReferenceLine yAxisId="kg" y={75} stroke={C.gold} strokeDasharray="6 3" strokeWidth={1.6}
                  label={{ value: "目标 75", position: "insideTopRight", fontSize: 10.5, fontWeight: 700, fill: C.gold }} />}
              {view === "year" &&
                <ReferenceLine yAxisId="kg" x="8/24" stroke={C.gold} strokeWidth={1}
                  label={{ value: "目标日", position: "top", fontSize: 9, fill: C.gold }} />}
              {view === "year" &&
                <ReferenceDot yAxisId="kg" x="7/26" y={75} r={5} fill={C.gold} stroke="#fff" strokeWidth={2}
                  label={{ value: "到 75 · ~7/26", position: "top", fontSize: 10, fontWeight: 700, fill: C.gold }} />}

              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${C.line}` }} labelStyle={{ fontWeight: 700 }}
                formatter={(val, name) => {
                  if (val == null) return ["—", name];
                  if (name.includes("体重") || name.includes("投影")) return [`${val} kg`, name];
                  return [`${val} kcal`, name];
                }} />

              {/* WEEK · breakdown: stacked TDEE (bmr+active) + intake dots — DIRECT children */}
              {isWeek && eMode === "breakdown" &&
                <Bar yAxisId="kcal" dataKey="bmr" name="BMR" stackId="t" fill={C.bmr} radius={[0, 0, 3, 3]} barSize={26} />}
              {isWeek && eMode === "breakdown" &&
                <Bar yAxisId="kcal" dataKey="active" name="活动" stackId="t" fill={C.tdee} radius={[3, 3, 0, 0]} barSize={26} />}
              {isWeek && eMode === "breakdown" &&
                <Line yAxisId="kcal" dataKey="intake" name="摄入" stroke={C.intake} strokeWidth={0}
                  dot={{ r: 5, fill: C.intake, stroke: "#fff", strokeWidth: 1.5 }} connectNulls={false} isAnimationActive={false} />}

              {/* WEEK · net: diverging bars */}
              {isWeek && eMode === "net" &&
                <Bar yAxisId="kcal" dataKey="net" name="净值" barSize={20} radius={[3, 3, 3, 3]}>
                  {WEEK.map((d, i) => <Cell key={i} fill={d.net == null ? "transparent" : d.net > 0 ? C.redSoft : C.goodSoft} />)}
                </Bar>}

              {/* YEAR projection */}
              {view === "year" &&
                <Line yAxisId="kg" dataKey="p" name="投影" stroke={C.gold} strokeWidth={2} strokeDasharray="2 3"
                  dot={{ r: 2.5, fill: C.gold }} connectNulls />}

              {/* weight (all views) — DIRECT child, never fragment-wrapped */}
              <Line yAxisId="kg" dataKey="w" name="体重" stroke={C.weight} strokeWidth={2.6}
                dot={{ r: view === "month" ? 2.5 : 3.4, fill: C.weight, strokeWidth: 0 }} connectNulls />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* conclusion */}
        {isWeek && eMode === "breakdown" && (
          <Concl tone="warn">
            <b style={{ color: C.intake }}>6/6、6/7 橙点冲到 3060/2640</b> — 青柱也高(练球动得多),但橙点更高 → 盈余=<b>吃得太多</b>。
            <b style={{ color: C.tdee }}>6/10 青柱缩到贴近 BMR</b>(活动段薄=几乎没动),橙点 2260 就压住了 → <b>动得少</b>。
            <br />两类盈余你都有:练球日放开吃 + 休息日不动还照吃。
          </Concl>
        )}
        {isWeek && eMode === "net" && (
          <Concl tone="warn">
            有数的 3 天净值全贴维持线(<b style={{ color: C.red }}>6/7 +163 盈余</b>),没一条进绿色减脂区。要掉秤,缺口得回到 −500~−770。
          </Concl>
        )}
        {view === "month" && (
          <Concl tone="good">
            真实体重(密点)从 82.6 抖着降到 79.6。<b style={{ color: C.good }}>5/18–6/6 实测均:吃 2081 / 烧 2712 = −631</b>,摄入正好落目标区 → 这段扎实在减。
            <b style={{ color: C.warn }}>近一周漂到维持</b>(见周视图)→ 最近平了。
          </Concl>
        )}
        {view === "year" && (
          <Concl tone="good">
            85.0(4/19)→79.6,长期 <b>−0.71kg/周</b>。投影 <b style={{ color: C.gold }}>~7/26 撞上目标线 75</b>,比 8 月下旬目标提前约 4 周。风险:近期若真停滞,交点右移。
          </Concl>
        )}
      </div>

      {/* NUTRITION — 针对实际食物 */}
      <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: "15px 15px 13px",
        marginBottom: 12, boxShadow: "0 1px 2px rgba(0,0,0,.03)" }}>
        <div style={{ fontSize: 15.5, fontWeight: 800, marginBottom: 3 }}>营养审计 · 你 6/5–6/11 实际吃的</div>
        <div style={{ fontSize: 11.5, color: C.sub, lineHeight: 1.45, marginBottom: 13 }}>
          按 HS(化脓性汗腺炎)+ 减脂双标准,逐项过你真吃的东西。⭐ = 优先级最高的动作。
        </div>

        {[FOOD.keep, FOOD.cut, FOOD.nuance].map((grp, gi) => (
          <div key={gi} style={{ marginBottom: gi < 2 ? 16 : 4 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: grp.color, marginBottom: 8,
              display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: grp.color }} />{grp.title}
            </div>
            {grp.items.map((it, i) => (
              <div key={i} style={{ display: "flex", gap: 9, padding: "7px 0", borderBottom: `1px solid ${C.line}` }}>
                <div style={{ width: 96, flexShrink: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, lineHeight: 1.2 }}>{it[0]}</div>
                  <div style={{ fontSize: 9.5, color: C.sub, marginTop: 1 }}>{it[1]}</div>
                </div>
                <div style={{ fontSize: 12, color: C.ink, lineHeight: 1.45, flex: 1 }}>{it[2]}</div>
              </div>
            ))}
          </div>
        ))}

        {/* pattern callout */}
        <div style={{ fontSize: 12.5, lineHeight: 1.55, color: C.ink, background: "#f8fafc", border: `1px solid ${C.line}`,
          borderRadius: 9, padding: "11px 12px", marginTop: 6 }}>
          <b>三个模式:</b><br />
          ① 早餐忽好忽糖(<b>4 蛋</b> vs <b>2 包果泥</b>)—— 糖那种又伤皮肤又留不住饱腹。<br />
          ② 糖水/糖零食反复(<b>红牛 · 果泥 · 彩虹糖</b>)= 同一组敌人:HS 触发 + 减脂最大漏。<br />
          ③ 蛋白来源很棒(<b>三文鱼/鸡/蛋</b>),别动;问题全在糖和高 GI 碳水那侧。
        </div>
        <div style={{ fontSize: 11, color: C.sub, lineHeight: 1.5, marginTop: 10, background: C.warnBg, padding: "8px 10px", borderRadius: 7 }}>
          <b>边界:</b> HS 饮食是<b>辅助</b>证据(整体偏弱),不替代 NHS 皮肤科路径(转诊+验维D 还 pending)。
        </div>
      </div>

      {/* footer */}
      <div style={{ fontSize: 11, color: C.sub, lineHeight: 1.6, padding: "0 2px" }}>
        <b>数据诚实:</b> 体重实测晨重(5/11–6/11 已补全;6/6、6/10 未称)。摄入/消耗拆解:6/6/6/7/6/10 实测、6/8 估、6/9 缺、6/11 进行中。
        「活动」段 = TDEE − BMR(1900,含 TEF 近似)。消耗均 2712 / 摄入均 2081 = 20 天(5/18–6/6)回算实测。年视图投影按 −0.71kg/周(R²0.74)外推。
      </div>
    </div>
  );
}

/* ════ sub ════ */
function Lg({ c, children, sq, dash, band }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
      {band ? <span style={{ width: 15, height: 9, background: c, borderRadius: 2, border: `1px solid ${C.good}` }} />
        : dash ? <span style={{ width: 13, height: 0, borderTop: `2px dashed ${c}` }} />
          : <span style={{ width: 9, height: 9, background: c, borderRadius: sq ? 2 : 5 }} />}
      {children}
    </span>
  );
}
function Concl({ children, tone }) {
  const m = { warn: [C.warn, C.warnBg], good: [C.good, C.goodBg] }[tone] || [C.slate, "#f1f5f9"];
  return (
    <div style={{ fontSize: 12.5, color: C.ink, lineHeight: 1.55, marginTop: 10, borderLeft: `3px solid ${m[0]}`,
      background: m[1], padding: "9px 11px", borderRadius: "0 8px 8px 0" }}>{children}</div>
  );
}
