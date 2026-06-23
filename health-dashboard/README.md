# 实时整合健康报告 (Health Dashboard)

A single-page React dashboard that fuses Apple Watch / Health Auto Export data into one
mobile-first, dark/light-aware report. Built as a Claude artifact and wired up here as a
runnable Vite app.

## Tabs

| Tab | 内容 |
| --- | --- |
| ⚡ 现在状态 | UPCSE §2 五分数 + 五潜变量 + §9 五通道(隔夜恢复锚 z 分 · 训练负荷 CTL/ATL/TSB · DOMS 双指数 · 心肺 · 心理)+ 当日能量与行动 + 今日吃法 |
| 😴 睡眠/恢复 | Hypnogram(分期)× HRV(SDNN)× 心率,同一时间轴 · 阶段结构 · 自主神经仲裁 |
| 🔥 热量/体重 | 脂肪 vs 水去噪分解(LOESS/EWMA)· 能量审计 · 85→75 目标投影 · 营养审计 |

## 数据来源 (current build = 2026-06-23 晨)

刷新自 Google Drive 的 Health Auto Export:

- `HealthMetrics-2026-06-23` — 睡眠分期、RHR、呼吸率
  - Total 5.94h / Core 3.73 / Deep 0.73 / REM 1.49 / Awake 0.88 · RHR 46 · 呼吸 ~15.6
- `HealthAutoExport-2026-06-22/23.json` — 逐时 HRV(SDNN)、RHR(6/22 与 6/23 均 46)
- `Workouts-2026-06-22` — 力量训练(练腿)70min · active 1550 kJ ≈ 370 kcal · maxHR 140
- `饮食记录 Diet Tracker [2026-06-23]` — 早餐 590 kcal / 47g 蛋白 · 体重晨 80.1

> n=1，非因果。HR 曲线在缺显式整夜序列时按睡眠阶段 + RHR 推算;深睡按 Apple Watch vs PSG
> 系统性低估还原。

## 运行

```bash
cd health-dashboard
npm install
npm run dev      # 本地开发
npm run build    # 产出 dist/
```

## 技术栈

React 18 · Recharts · Vite。整个仪表盘是单个组件 `src/IntegratedReport.jsx`,
数据以模块顶部的常量数组承载,更新数据 = 改这些常量。
