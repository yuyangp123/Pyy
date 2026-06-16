# 实时整合报告 · Realtime Integrated Report(系统日常出口)

> 每次跑数据(通常早上,但**任何时间都行**)→ 一份把睡眠 + 能量 + 训练 + **实时状态**拼在一起的报告。
> **已无「纯晨间报告」——一律实时状态报告**(以 ⚡现在状态 为首)。
> 母版完整代码 = `assets/body-integrated-master.jsx`(全系统唯一一份完整示例)。

## 触发
用户每次跑数据(上传 HAE JSON / 截图 + 报当天饮食 / 训练;通常早上,不限时间)→
**默认产出这份实时整合报告**,不用每次再问要不要。

## 数据来源(三条流)
- **恢复侧** — HAE JSON:睡眠分期 / HRV / RHR。基线:睡眠 ≥7h、HRV 65–85ms、RHR 41–48。
  取数/解析见 `file-operations.md`。
- **能量侧** — Diet Tracker:摄入 / 体重;训练 = CNS 负荷(网球/力量/联赛/休息)。
  ⚠️ **活动量永远以 Workouts / HAE active 实测为准,别信日历事件标题**
  (6/14 教训:日历「休息日」实际两场球 → 差点把缺口算错 −1500)。见 `weight-energy.md`。
- **主观侧** — 30 秒自评:疲劳 / 心情 / 压力 / 动力 各 1–5。研究(Saw/Main/Gastin 2016)证主观敏感度 > 客观
  → 喂 UPCSE 认知+压力两项,最高置信锚。

## 报告结构(3 tab,2026-06-16 重构 · 原「实时」+「现在状态」合并去重)

顶层 3 tab:

- **⚡ 现在状态**(组件 `Realtime`) — UPCSE **5 分数 + 5 生理潜变量** + **§9 五通道**
  (隔夜恢复锚 z / 训练负荷 CTL·ATL·ACWR / DOMS 双指数 / 实时心肺 %HRR + 心理)+「今天·能量+行动」。
  答「整体几成 + **哪个系统拖后腿**」。⭐ **认知分数 = headline**(找工作 #1、减脂+网球为「用脑不崩」)。
- **😴 睡眠 / 恢复**(组件 `SleepVF`) — 单夜 hypnogram + 心率/HRV/呼吸自主神经曲线(SVG)。
- **🔥 热量 / 体重**(组件 `WeightEngine`) — 分解(脂肪vs水)/ 能量 / 目标 / 营养 四子视图 +
  5 秒每日校正计算器(recharts)。

> ⭐ **§9 关键修正**:恢复时间线不同的系统(自主神经 ~24h vs DOMS 峰 24–48h)**不合成单一分**,
> 避免就绪分掩盖 DOMS 背离(典型:HRV 绿灯但腿 DOMS 9/10)。算法见 `upcse.md` §9。
> 核心逻辑:压力 → 恢复 → 结果;单一源会骗人,多源 + 自主神经交叉验证。

## ⭐ 构建原则(踩过坑)

- **整合 = 各完整 artifact 原样拼接 + 顶层 tab,绝不擅自简化**(犯过一次做精简版被退回 → **只拼不删**)。
- ⭐ **重建法(splice)**:在**前一天 artifact** 上改 —— 更新
  现在状态(`RT_SCORE/RT_LAT/RT_Z/RT_CTL/RT_ATL/RT_DLEGS`)+ 睡眠(`S/SEG/HRV/HRD/CHIPS`)+
  热量(`DECOMP/WEEK/YEAR`)+ 横幅;`@babel` 校验 + 交叉核对 **4 套色板 key(`Cs`/`Cu`/`Cw`/`Cr`)**。
- ⭐ **全局更新 SOP(2026-06-16 固化)**:每次更新 = 重新拉最新 HAE + **所有面板刷到同一天 + 日期一致**,
  **不留任何 stale 面板**(别只更一个 tab)。(完整版优先·不按时间降级见 `file-operations.md`。)
- 拼接:各组件命名避冲突(睡眠 `S/SEG/HRV…` vs 热量 `DECOMP/WEEK…` vs 现在状态 `RT_*`)→
  剥 import 合并、各 `export default` 降普通函数(现 3 块:`Realtime` / `SleepVF` / `WeightEngine`)、
  外包 tab wrapper,**零改动各本体**。
- recharts 图元必须**独立直接子级、不包 Fragment**(否则线/柱不渲染);**缺数据标灰不编**;
  设计:移动端单列 ~480、绿/琥珀/红、每块一句结论、禁 localStorage。母版含暗色模式(`useIsDark`)。

## 模板文件
- 最新 = `body-integrated-YYYY-MM-DD.jsx`(**3 tab**:现在状态 `Realtime` + 睡眠 `SleepVF` + 热量 `WeightEngine`)。
- 每天用最新 HAE **splice 重生成**(在前一天文件上改)。
- 母版完整代码 = `assets/body-integrated-master.jsx`(**全系统唯一一份完整示例**;
  睡眠/减脂/UPCSE 子页不再放完整代码)。`assets/sleep-epoch.jsx`、`assets/fatloss-engine.jsx` 为早期单组件参考。

---
*这份报告是整个 HAE 系统的日常出口:三条流(恢复/能量/主观)在这里汇成一张实时图。*
