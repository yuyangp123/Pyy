# 文件操作工作流(所有模块共用底座)

> 实战踩出来的工具现实 + 数据格式 + 解析法。适用于**所有** HAE 数据(不只睡眠)。
> 任何"怎么从 Drive 拿到 / 解析这份数据"的问题,先读本文件。

## 数据管线概览

HAE App(Health Auto Export)按指标分多个自动化,自动导出到 Google Drive,
再由解析层(容器 Python:base64 解码 → JSON/CSV 解析)处理。

**Drive 文件夹**(根 `Health Auto Export/`):
- `Sleep/` — sleep-only 自动化(分段 JSON + HealthMetrics 聚合 CSV)
- `Health Metrics/` `HM JSON/` — 综合指标
- `HRV Export/` — HRV 逐时
- `Workouts/` — 运动

⚠️ HAE 每天把同一份文件**重复写进多个文件夹**(Sleep / HM JSON / HRV Export / Health Metrics)——随便取一份即可。

## Drive 文件夹树(ID,根 `1p_ip9T8m3JRSfqk2LNq7tSGWx39EqDSa`)

| 文件夹 | Folder ID |
|---|---|
| `Sleep/` | `1opIwKkLfoBCNnqJAWb5_Yh8phMz-WdK7` |
| `Health Metrics/` | `1k5LTL7Bl5AqeX_r_z30wzEF78XHqr6EV` |
| `HM JSON/` | `1cikKBUuj1yoZRJ9k-jWrdnulOgTSEsum` |
| `HRV Export/` | `1rotx6CK-eC6QWi1k9Zpu0bmTtAn3Qa5K` |
| `Workouts/` | `1rQG75TqSOosBpdGymu8ieLsIEs5IAm5-` |
| `Diet Tracker/`(摄入/体重,手动) | `0BzRi7CCwX-5iMmVlMzljNmUtNzNmZS00Mzg0LWFkNjQtOWI0MjQ3Y2Q0Y2M0` |

## 怎么找文件(工具实测 · 别再踩)

- ✅ `list_recent_files`(orderBy=modifiedTime desc)= **唯一可靠的枚举器**
- ❌ `google_drive_search` 用 `'<folderId>' in parents` → 返回空
- ❌ `Google Drive:search_files` 直接拒绝 `parents` 参数
- ❌ `read_file_content` 对 JSON 报 unsupported mime type
- ✅ `download_file_content(fileId)` 对 JSON 返回 base64(`content` 字段)→ **可解码**
  (读 JSON 的正道:read_file_content 不行,download 行)

## 数据怎么进 Claude(核心限制 + 突破口)

- Drive 文件以 **base64 进上下文,不落容器磁盘**;要解析必须先誊进容器。
- 誊写**只对小文件可靠**(几千字符内)。分段 JSON 34KB → 约 45K base64 字符 → 誊不准
  (base64 无容错)。
- ⭐ **突破口 1(CSV)**:`list_recent_files` 的 `contentSnippet` 返回的是**已解码、可读的 CSV 文本**
  (不是 base64)→ 落盘直接解析,完全绕开 base64。逐分钟数据就是这么拿到的。
- `download_file_content(exportMimeType='text/csv')` 能把 Sheet 导成 CSV,但仍返回 base64(还得誊)。
- ⭐⭐ **突破口 2(JSON,2026-06-12 打通)**:读 HAE/HRV JSON 的正道 =
  `download_file_content(fileId)` → 取 `content`(base64)→ 誊进 bash heredoc →
  `base64 -d | python3` 解析。HRV Export JSON 9.4KB(~13K base64 字符)誊写+解码 **成功**;
  34KB 分段睡眠 JSON(~45K)仍太大誊不准。即 **≤~10KB 的 JSON 现在能读了**
  (active energy / basal / HRV / workouts 都在 JSON 里)。
- ⭐ **历史数据高效取法 = grep transcripts**:Diet Tracker 等在容器 `/mnt/transcripts/` 里生成 →
  过去每天吃什么、体重、能量,grep transcripts 比逐个解析 Drive 文件快得多。
  索引:`/mnt/transcripts/journal.txt`。
- ⚠️ 客户端工具(user_time_v0 / chart_display_v0)近期超时 → 回落系统日期 + 自绘
  (matplotlib / SVG / recharts)。

## HealthMetrics CSV 格式(逐分钟版)

**列**:`Date/Time, 腕温, HR[Min/Max/Avg], 呼吸率, 静息HR, Sleep[Total/Asleep/InBed/Core/Deep/REM/Awake]`

- **第 1 行(00:00:00)= 当日睡眠聚合**:7 个值 = `[Total, Asleep, InBed, Core, Deep, REM, Awake]`(小时)。
  **这就是精确阶段总量的来源**(校验:Core+Deep+REM ≈ Total)。解析逐分钟 HR 时跳过此行;
  要阶段总量时专取此行。
  ⚠️ 睡眠总量永远用此聚合行(精确),**别用刚醒导出的 JSON 聚合值**(低估,曾误报 5.35h vs 实际 6.69h)。
  静息 HR 不在此行 → 从睡眠 HR 谷底估或从 JSON 取。
- 其余行 = **逐分钟样本,稀疏**:不同指标在不同分钟上报,多数字段为空。
  Apple 睡眠时 HR 机会性采样(每几分钟;约 5s 仅 workout 模式),呼吸更稀。
- ⚠️ snippet 会**压掉空字段** → 列位置不可信 → 改用**数值启发式**判列(见下)。

## 解析:数值启发式

逐行取数字 token,按区间分类(两区间不重叠):
- **HR** = 35–110;前 3 个 = min/max/avg(avg 取第 3;单读数则三者相等);第 4 个 = 静息 HR。
- **呼吸率** = 12–26。
- 聚合行的睡眠小时值(0.75 / 4.47 / 9.88…)落两区间外 → 自动忽略。
- ⭐ **校验锚点**(以 6/10 夜为例):HR 谷底 = 39.41 @ 02:42;82.81 @ 03:56 = 单点体动伪迹。
- **覆盖**:snippet 通常截断(该夜为 00:04–07:56)→ 要整夜则导出/解析完整 CSV。
- 产出:逐分钟 HR avg + 呼吸率序列 → 喂给 artifact。

## HRV Export JSON 格式 + 解析(2026-06-12 打通)

- 路径:`HRV Export/` 文件夹;文件名 `HealthAutoExport-YYYY-MM-DD.json`(~9KB)。
- 结构:`data.metrics[]` 里 name=`heart_rate_variability`、units=`ms`、`data[]` 每条 =
  `{date, start, end, qty}`,qty = **SDNN(ms)**,逐时采样(夜间约 30–35 点)。
- 取法:`download_file_content` → base64 → `base64 -d | python3` 提 `(date[11:16], qty)`。
- ⭐ 清洗:剔 **>2× 中位** 的伪迹(6/12 夜中位 69.8 → 剔 3 个 >140ms:06:11=172、06:41=155、06:56=149);
  对比个人基线 **65–85**。
- 产出:逐时 SDNN 序列 → 喂 artifact,和 HR **同一时间轴** plot。

## 当前文件 ID(示例,会变,仅供格式参考)

- HealthMetrics(Sheet,逐分钟,2026-06-11)`1X3LB9We76FfFSToKCZlZ-Xx-EfS8mqyFWW1OwFEtNzc`
- 分段睡眠 JSON(34KB,搬不动,Sleep 文件夹)`11-EzDZ3ZyUM3KhvyI4hPE8VhaUDmRsLR`
- Diet Tracker 文件名格式:`饮食记录 Diet Tracker [YYYY-MM-DD HH:MM]`(CSV;
  三段:Food Log 每餐+宏量 / Targets / Daily Summary;含晨重实测 + 当日 deficit)。
