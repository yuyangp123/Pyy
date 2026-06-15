---
name: watchlist-calendar-update
description: >-
  更新用户的观赛日历（Sports Watchlist Calendar）。触发：更新赛程 / update schedule / 观赛日历 / 看看关注列表有什么新的 / 加比赛到日历。
  按每项运动的权威官方源核实关注的队/选手下一场，写成 Google 主日历 color-7（孔雀蓝）观赛事件，确切 BST 时间、无弹窗、带训练冲突检查。
---

# 观赛日历更新 · Sports Watchlist Calendar Update

## 用途
用户说"更新赛程 / update schedule / 看看关注列表有什么新的 / 加比赛到日历"时执行：把关注的队/选手的比赛，以确切时间写进 Google 主日历的观赛专用色块。

## 核心原则
Watchlist = 信息便利，不是 commitment。帮用户省搜索时间，不替用户决定看不看。宁可漏"看不看的建议"，也要保证"时间和对阵准确"。

## 日历目标与事件规范
- 写入主日历：<MAIN_CALENDAR_ID>
- 每个观赛事件：colorId="7"（孔雀蓝）、overrideReminders: []（无弹窗）、确切 BST 时间（非全天、非占位）。
- 标题模板：[emoji] [短描述] (vs [对手]) [冲突标记]
- 描述必含：赛事全名 + Series/Round 状态 + 对手/排名 + 当天训练冲突检查 ⚠️ + 观赛优先级 ⭐ + 直播平台。
- 冲突检查读：主日历 + 训练导入日历 <TRAINING_CALENDAR_ID>（只读）。比赛日/D-1/D-2/三练日 → flag；SS 比赛日永远跳直播。

## Watchlist 与"笨但准"的权威源矩阵
铁律：每个 focus 先走它那项运动的官方/权威源，不靠泛搜索片段；先在官方"选手/球队页"确认"这周在哪个赛事、今天/此刻是否在打"。

- 🏀 NBA（San Antonio Spurs / Wembanyama）：NBA 官网 nba.com（球队页 + schedule + bracket）｜交叉 ESPN｜英国转播 Sky Sports NBA（ET→BST）｜赛季约 10–6 月，否则 dormant。
- 🎮 CS2（Vitality HLTV id 9565 / Team Falcons）：HLTV 队伍页（Upcoming/Results）+ 单场页（BO/官方流）+ 赛事页｜bracket→Liquipedia｜赛事官网 + Twitch eslcs/YouTube｜HLTV 默认 CEST = BST+1。
- 🎾 ATP（Sinner/Alcaraz/Fils/Zverev）：ATP 官网 atptour.com（选手页确认报名赛事 + Order of Play）｜直播 Tennis TV｜英国时间 Sky Sports tennis｜live 交叉 Sofascore/Flashscore 选手页｜只加 M1000+大满贯。
- 🎾 WTA（郑钦文 / Raducanu）：WTA 官网 wtatennis.com（选手页确认赛事 + OOP）｜直播 Tennis TV/赛事官网｜live 交叉 Sofascore/Flashscore。
- ⚽ UCL（PSG/Arsenal）：UEFA uefa.com + 俱乐部官网｜英国转播 TNT Sports｜休赛期 dormant｜KO R16 起逐场。
- ⚽ World Cup（France）：FIFA fifa.com（fixtures + 法国队页）｜英国转播 BBC/ITV｜2026 美加墨办，ET/CT/PT/MT→BST。

## 统一 5 步（每个 focus 都走）
1. 先开该运动官方源，不用泛搜索片段下结论。
2. 官方"选手/球队页"确认本周实际在哪个赛事（不照搬、不臆测；同周 250/500 并行选手会分流）。
3. 官方 OOP/fixture 取确切当地时间 → 转 BST。
4. live 源交叉核对当天/此刻状态（网球 Sofascore/Flashscore；CS HLTV/Liquipedia；球类官网）。时间不明先确认"是否今天就打"，排除当天才放后一天，绝不静默占位到明天。
5. 直播平台从权威转播方取（Sky/TNT/BBC/ITV/Tennis TV/Twitch）。

## Conditional
序列依赖的（NBA G5+、网球 R3/R16+、CS 季后赛后续、UCL 次回合/决赛）建 conditional，标题加 [conditional]，描述首行写"仅当 [前置条件] 才执行"，最多一层。每次运行能回填确切时间的就 update。

## 红线
不替用户下"看不看"结论；不弹通知；观赛事件不混训练/饮食；不删已有事件（过期的列出来让用户定）；一次别铺满整条 chain。

## 汇报格式
每个赛事分块：✅ 新建/更新 / ⏳ conditional / ⚠️ 冲突；末尾列"今晚/明天需 attention 的" + "确切 vs 待确认"。本轮无变化就说"无 update"。
