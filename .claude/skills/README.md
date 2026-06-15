# Skills 目录

这里存放本项目专用的 Claude Code **Skills（技能）**。

## 什么是 Skill

每个 skill 是一个子文件夹，核心是一个 `SKILL.md` 文件，用自然语言描述：
- **何时使用**这个技能（触发场景）
- **怎么做**（操作步骤、流程）
- 可选附带脚本、模板、参考资料

Claude 平时只看到每个 skill 的名字和简短描述，不会自动加载全部内容；当你的需求匹配某个
skill 时，Claude 才会展开它并按步骤执行。你也可以用 `/技能名` 主动触发。

## 目录结构

```
.claude/skills/
  README.md              <- 本说明
  <skill-name>/
    SKILL.md             <- 技能定义（必需）
    ...                  <- 可选脚本/模板/资料
```

## 新增一个 Skill

1. 在本目录下新建文件夹，例如 `optimize-portfolio/`
2. 在其中创建 `SKILL.md`，开头用 YAML frontmatter 写元数据：

```markdown
---
name: optimize-portfolio
description: 何时该用这个技能的简要说明（让 Claude 判断是否触发）
---

# 技能正文：具体步骤……
```

3. 提交到仓库后，在本项目的会话里即可复用。
