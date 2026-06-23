# Nutrition Data Auto-Sync Setup Guide

## 概览 (Overview)

这个系统自动化了从 Google Drive 读取营养数据、用 Claude LLM 理解转换、生成仪表板数据的完整流程。

**架构**:
```
Google Drive (Diet Tracker) 
    ↓
GitHub Action (手动或定时触发)
    ↓
Node.js Script 
    ↓
Claude API (理解转换)
    ↓
IntegratedReport.jsx (NUTRI 常量)
    ↓
Git commit + push
```

## 前置设置 (Prerequisites)

### 1. Anthropic API Key

```bash
# 在 GitHub repo settings 中添加 secret:
Settings → Secrets and variables → Actions → New repository secret

Name: ANTHROPIC_API_KEY
Value: sk-ant-... (来自 https://console.anthropic.com)
```

### 2. Google Drive Service Account (可选但推荐)

如果要自动读取 Drive 上的 Diet Tracker:

```bash
# 1. 在 Google Cloud Console 创建 service account
# 2. 下载 JSON key，Base64 编码:
cat service-account-key.json | base64

# 3. 添加到 GitHub Secrets:
Name: GOOGLE_DRIVE_SERVICE_ACCOUNT  
Value: <base64-encoded JSON>
```

## 使用方式

### 手动触发

```bash
# GitHub UI: Actions → Sync Nutrition Data from Drive → Run workflow

# 或通过 GitHub CLI:
gh workflow run sync-nutrition.yml \
  -f target_date=2026-06-23
```

### 自动定时

默认每日 3AM UTC (11AM Beijing) 运行。修改 `.github/workflows/sync-nutrition.yml` 中的 `cron`:

```yaml
  schedule:
    - cron: "0 3 * * *"  # 改这里
```

## 数据流转

### Input: Google Drive Diet Tracker CSV

```
| 餐次 | 食物 | 热量kcal | 蛋白g | 碳水g | 脂肪g | 状态 |
|------|------|---------|------|------|------|------|
| 早餐 | 4蛋+全麦 | 590 | 47 | 42 | 26 | ✓实测 |
| 午餐 | 待记录 | 0 | 0 | 0 | 0 | 计划 |
```

### Claude Transform Logic

脚本调用 Claude 来:

1. **理解状态**: 识别 "✓实测" vs "计划" vs "待补"
2. **聚合**: 从逐行数据推导日级别总计
3. **目标匹配**: 训练日 P150/C230/F75 vs 休息日 P150/C150/F70
4. **缺口检测**: 如果有未记录的餐次，设 `incomplete: true`
5. **生成 JSON**: 输出符合 NUTRI 数据结构的对象

### Output: Updated NUTRI Constant

```javascript
const NUTRI = [
  {
    day: "今天 6/23",
    type: "休息日 · 早餐已记 · 目标维持~2300",
    incomplete: true,
    intake: 590,
    expend: 2250,
    net: -1660,
    macros: [
      { e: "P", k: "蛋白", act: 47, tgt: 150 },
      { e: "C", k: "碳水", act: 42, tgt: 150 },
      { e: "F", k: "脂肪", act: 26, tgt: 70 }
    ]
  }
];
```

## 关键文件

| 文件 | 说明 |
|-----|------|
| `scripts/sync-nutrition.js` | 主逻辑脚本 |
| `.github/workflows/sync-nutrition.yml` | GitHub Action 定义 |
| `src/IntegratedReport.jsx` | React 仪表板(NUTRI 常量在此) |

## 故障排查

### 脚本运行失败

```bash
# 本地测试:
ANTHROPIC_API_KEY=sk-ant-... node scripts/sync-nutrition.js

# 查看 GitHub Action 日志:
GitHub UI → Actions → Sync Nutrition Data from Drive → 选择 run
```

### Claude API 错误

- 检查 API key 是否正确
- 检查费用额度是否充足
- 查看 console.anthropic.com 的 usage

### Git push 失败

- 确保 GitHub token 权限足够 (contents:write)
- 检查分支权限设置

## 下一步

### 可选增强

1. **自动部署**: 成功 commit 后自动部署到 Vercel/GitHub Pages
2. **Slack 通知**: 同步失败时发送通知
3. **历史数据追踪**: 保存 JSON 历史版本
4. **多日期支持**: 同时更新今天 + 昨天数据

### Google Drive 集成

完整版本应包括:

```javascript
// 使用 Google Drive API 读取 Diet Tracker
async function fetchDietTrackerFromDrive(serviceAccount, spreadsheetId) {
  // 实现 Google Sheets API 调用
  // 返回 CSV 格式的原始数据
}
```

## 安全注意

- ✅ API keys 存储在 GitHub Secrets (加密)
- ✅ Service account key 需要 Base64 编码
- ✅ 脚本不会上传营养数据到任何外部服务
- ⚠️ Claude API 调用会产生费用 (按 token 计费)

## 成本估计

- 每次同步: ~200-300 tokens
- 每日 1 次: $0.10-0.15/天
- 每月估算: ~$3-5

---

**需要帮助?** 查看 `src/IntegratedReport.jsx` 了解 NUTRI 数据结构, 或运行:

```bash
node scripts/sync-nutrition.js --help
```
