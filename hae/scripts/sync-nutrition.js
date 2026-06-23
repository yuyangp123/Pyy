#!/usr/bin/env node

/**
 * GitHub Action script: sync nutrition data from Google Drive
 * Uses Claude API to understand + transform raw meal data into NUTRI JSON
 *
 * Environment variables needed:
 * - ANTHROPIC_API_KEY: Claude API key
 * - GOOGLE_DRIVE_SERVICE_ACCOUNT: Base64-encoded service account JSON
 * - TARGET_DATE: Date to sync (default: today)
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

const API_BASE = 'https://api.anthropic.com/v1';
const MODEL = 'claude-opus-4-8';

// Example raw data from Google Drive Diet Tracker (this would come from actual Drive API)
const SAMPLE_DIET_TRACKER = `
| 餐次 | 食物 | 热量kcal | 蛋白g | 碳水g | 脂肪g | 备注 |
|------|------|---------|------|------|------|------|
| 早餐 | 4蛋 + 全麦餐包 + Skyr | 590 | 47 | 42 | 26 | 实测 |
| 早餐 | 黑咖啡 | 0 | 0 | 0 | 0 | 实测 |
| 午餐 | 待补 | 0 | 0 | 0 | 0 | 计划 |
| 晚餐 | 待补 | 0 | 0 | 0 | 0 | 计划 |
`;

// Example workout data
const SAMPLE_WORKOUT = {
  date: '2026-06-22',
  type: '力量训练(练腿)',
  duration: 70,
  activeEnergy: 370,
  maxHR: 140
};

async function callClaude(prompt) {
  const response = await fetch(`${API_BASE}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Claude API error: ${error.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

async function parseNutritionData(dietTrackerText, workoutData, targetDate) {
  const prompt = `你是一个营养数据分析器。请分析以下数据并生成结构化的营养信息。

目标日期: ${targetDate}
运动数据: ${JSON.stringify(workoutData)}

Diet Tracker 数据:
\`\`\`
${dietTrackerText}
\`\`\`

请生成一个JSON对象，符合以下结构：
{
  "day": "日期描述 (e.g., '今天 6/23')",
  "type": "日期类型描述 (e.g., '休息日 · 早餐已记 · 目标维持~2300')",
  "incomplete": boolean,
  "intake": 总摄入热量,
  "expend": 消耗热量,
  "net": 热量净值,
  "macros": [
    { "e": "P", "k": "蛋白", "act": 实际值, "tgt": 目标值 },
    { "e": "C", "k": "碳水", "act": 实际值, "tgt": 目标值 },
    { "e": "F", "k": "脂肪", "act": 实际值, "tgt": 目标值 }
  ]
}

关键规则：
1. 聚合所有"实测"的食物，计算总摄入热量和三大营养素
2. 如果有未记录的餐次，设置 incomplete: true
3. expend 基于 TDEE 估计（休息日 ~2250，训练日 ~2600）
4. 目标值：训练日 P150/C230/F75，休息日 P150/C150/F70
5. 只返回 JSON，不要额外文字`;

  try {
    const response = await callClaude(prompt);
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in Claude response');
    }
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Error parsing nutrition data:', error.message);
    throw error;
  }
}

async function updateIntegratedReportComponent(todayData, yesterdayData) {
  const componentPath = path.join(__dirname, '../src/IntegratedReport.jsx');
  let componentContent = fs.readFileSync(componentPath, 'utf-8');

  // Build NUTRI array with both today and yesterday
  const nutriArray = [todayData];
  if (yesterdayData) {
    nutriArray.push(yesterdayData);
  }

  // Format with proper indentation
  const nutriLines = ['const NUTRI = ['];
  nutriArray.forEach((item, idx) => {
    nutriLines.push('  ' + JSON.stringify(item, null, 2).split('\n').join('\n  ') + (idx < nutriArray.length - 1 ? ',' : ''));
  });
  nutriLines.push('];');
  const nutriReplacement = nutriLines.join('\n');

  // Find the current NUTRI definition - match multiline
  const nutriMatch = componentContent.match(/const NUTRI = \[\s*\{[\s\S]*?\}\s*(?:,\s*\{[\s\S]*?\}\s*)*\];/);
  if (!nutriMatch) {
    throw new Error('Could not find NUTRI definition in IntegratedReport.jsx');
  }

  componentContent = componentContent.replace(nutriMatch[0], nutriReplacement);
  fs.writeFileSync(componentPath, componentContent, 'utf-8');
  console.log('✅ Updated IntegratedReport.jsx with new nutrition data');
}

async function gitCommitAndPush(nutriData) {
  const { execSync } = require('child_process');

  try {
    // Stage changes
    execSync('git add src/IntegratedReport.jsx', { cwd: path.join(__dirname, '..') });

    // Create commit
    const commitMsg = `Refresh nutrition data for ${nutriData.day} · intake ${nutriData.intake} kcal · protein ${nutriData.macros[0].act}g`;
    execSync(`git commit -m "${commitMsg}"`, { cwd: path.join(__dirname, '..') });

    // Push to current branch
    execSync('git push -u origin HEAD', { cwd: path.join(__dirname, '..') });
    console.log('✅ Committed and pushed changes');
  } catch (error) {
    console.log('ℹ️  No changes to commit or git push failed:', error.message);
  }
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY environment variable is required');
  }

  const targetDate = process.env.TARGET_DATE || new Date().toISOString().split('T')[0];
  console.log(`📊 Syncing nutrition data for ${targetDate}...`);

  try {
    // Step 1: Parse nutrition data for today using Claude
    const todayData = await parseNutritionData(SAMPLE_DIET_TRACKER, SAMPLE_WORKOUT, targetDate);
    console.log('✅ Parsed today nutrition data:', todayData);

    // Step 2: Parse yesterday data (optional - for now just use sample)
    // In production, this would fetch yesterday's Drive data
    let yesterdayData = null;
    // If needed, uncomment below to sync yesterday too:
    // const yesterday = new Date(new Date(targetDate).getTime() - 86400000).toISOString().split('T')[0];
    // yesterdayData = await parseNutritionData(SAMPLE_YESTERDAY_DIET, SAMPLE_YESTERDAY_WORKOUT, yesterday);

    // Step 3: Update component
    await updateIntegratedReportComponent(todayData, yesterdayData);

    // Step 4: Git commit and push
    await gitCommitAndPush(todayData);

    console.log('✨ Nutrition sync complete!');
  } catch (error) {
    console.error('❌ Sync failed:', error.message);
    throw error;
  }
}

main().catch(error => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
