---
name: hae-health-system
description: >-
  个人 n=1 健康数据系统(Health Auto Export / HAE)。当用户上传 HAE JSON / Apple Health 截图、
  报告当天饮食 / 训练、或要求晨间整合报告、睡眠分析、当日热量结算、体重趋势(脂肪 vs 水)、
  能量可用性(EA/RED-S)、或身体/认知状态(UPCSE)时使用。
  数据流:Apple Health/Apple Watch → Google Drive → 解析 → 多源 + 自主神经交叉验证 → artifact。
  核心铁律:任何单一数据源都会骗人(导出低估、截图高估、设备误判)——必须多源交叉验证。
---

# HAE 健康数据系统

Apple Health / Apple Watch 数据 → Google Drive → 解析 → 判断 → 可视化 的全流程。
本系统的日常出口 = **晨间整合报告**;其下有 4 个可独立调用的分析模块。

## ⛓️ 贯穿一切的核心原则(任何模块都先记住)

> **任何单一数据源都会骗人** —— HAE 聚合导出会**低估**(刚醒导出 Apple 没定稿);
> 截图(=Apple Watch)会**高估**(漏报清醒);设备会把"安静仰卧清醒"误判成睡眠。
> **解法 = 多源 + 自主神经(HR/HRV/呼吸)交叉验证**;HR/HRV 是"清醒 vs 睡眠"的生理裁判。
> 配套纪律:**别目测先算;n=1 非因果;跨午夜务必确认日期;缺数据标灰不编;
> 完整版优先、不按时间降级(任何时间跑都读完整 JSON 全量分析,不做晨间精简版);
> 活动量以 Workouts/HAE active 实测为准,别信日历事件标题。**

## 何时用哪个模块(决策树)

| 用户输入 / 诉求 | 走哪条 | 参考文件 |
|---|---|---|
| 早上上传数据 / "跑一下今天" / 不指定 | **晨报(默认出口)** = 睡眠+能量+训练拼一张图 | `references/morning-report.md` |
| 问睡得怎么样 / 睡眠结构 / 恢复 | 睡眠多源融合 | `references/sleep-recovery.md` |
| "结算今天热量" / 吃了 X 算缺口 / 体重为什么涨 | 减脂引擎(热量结算 + 脂肪 vs 水) | `references/weight-energy.md` |
| "我现在整体状态" / 今天能不能高强度用脑/打球 | UPCSE 状态分数 | `references/upcse.md` |
| 任何"怎么从 Drive 拿到/解析这份数据" | 文件操作工作流(所有模块共用底座) | `references/file-operations.md` |

**任何取数 / 解析问题永远先读 `references/file-operations.md`** —— 它是所有模块的共用底座
(Drive 文件夹树、工具实测、base64 突破口、CSV/JSON 格式、数值启发式解析)。

## 端到端主流程(晨报默认路径)

1. **取数** — `list_recent_files`(orderBy=modifiedTime desc)枚举 Drive;`contentSnippet` 直接给已解码 CSV;
   **完整 JSON 用 `create_file` 写 `.b64` → `base64 -d > x.json` → python3**(取代 bash heredoc)。
   历史数据 `grep /mnt/transcripts/`。**完整版优先,不退回 snippet。** 详见 `file-operations.md`。
2. **解析** — HealthMetrics CSV:首行(00:00:00)= 当夜睡眠阶段聚合(精确总量);其余行逐分钟样本,
   用数值启发式分列(HR 35–110、呼吸 12–26)。HRV Export JSON → SDNN 逐时(剔 >2×中位伪迹)。
   RHR:晨间导出 JSON 无 RHR 字段 → 从整夜 HR 谷底推。
3. **分模块判断** — 睡眠(多源融合)/ 能量(当日结算 + 脂肪vs水)/ 训练负荷。每模块都做自主神经交叉验证。
   ⚠️ 活动量以 Workouts/HAE active 实测为准,别信日历标题。
4. **(可选)状态融合** — UPCSE:5 潜变量 → 5 分数(恢复/压力/睡眠/就绪/认知),贝叶斯精度加权。
5. **渲染 artifact** — 两个完整 artifact **原样拼接 + 顶层 tab**(绝不擅自简化);recharts 图元必须独立直接子级。
   **splice 重建**:在前一天 `body-integrated-*.jsx` 上改(换睡眠块+UPCSE块、续期数组),`@babel` 校验 + 色板 key 核对。
6. **收口** — 每块一句话结论 + 行动;deficit 报区间下端、体重预测报上端,**永不单点**。

## 关键常量速查(全系统统一,细节见各 reference)

- **能量**:Active energy HAE 原始 **×0.85**;BMR baseline **1900**;运动净卡 = `Active Energy(kJ) ÷ 4.184`;
  TDEE = BMR + 运动净卡 + NEAT(~200–250) + TEF(~10%摄入)。
- **摄入估高纪律**:餐厅 +30% / 家做 +20% / 隐藏油糖 +10–20% / 习惯零食 buffer +200/天。
- **体重**:1kg 脂肪 ≈ 7700 kcal;~600 缺口 → 每天最多掉 ~0.08kg 真脂肪 → **单日 >0.10–0.15kg 必是水**;
  趋势用 EWMA(α=0.1–0.15)实时 / LOESS 回溯;体重永远看 **trend** 不看单日。
- **能量可用性 EA** =(摄入−运动消耗)/FFM:≥45 最优、30–45 reduced、<30 低 EA、男性 <25 风险;FFM 估 ~67kg。
- **睡眠基线**:睡眠 ≥7h、深睡 ≥1h、HRV(SDNN)65–85ms、RHR 41–48bpm;HRV 剔 >2×中位伪迹。
- **解析阈值**:HR 区间 35–110(前 3=min/max/avg,第 4=静息 HR)、呼吸率 12–26。
- **输出位置**:artifact 落 `/mnt/user-data/outputs`;cite 放对话、artifact 内放纯文本;禁 localStorage;移动端单列 ~480。

## 模板文件(assets/)

- `assets/sleep-epoch.jsx` — 睡眠逐分钟版:hypnogram + 心率/呼吸 同一时间轴(SVG)。
- `assets/fatloss-engine.jsx` — 减脂引擎:周/月/年三视图 + 摄入vs消耗/净值 switcher + 营养审计(recharts)。
- 晨报 = 上述两者顶层 tab 拼接(`body-integrated-*.jsx`),每天用最新数据重生成。
