# sports-watchlist

A Claude Code / Cowork **plugin** with one skill, `watchlist-calendar-update`.

## What it does

When you say things like **"更新赛程 / update schedule / 观赛日历 / 看看关注列表有什么新的 / 加比赛到日历"**, the skill:

- Verifies each followed team/player's next fixture against that sport's **authoritative official source** (NBA, HLTV, ATP/WTA, UEFA, FIFA), not generic search snippets.
- Converts the official local kickoff/order-of-play time to **exact BST**.
- Writes a viewing event into your **Google main calendar** using a dedicated style: `colorId="7"` (peacock blue), **no popup reminders** (`overrideReminders: []`), exact time (never all-day / placeholder).
- Runs a **training-conflict check** against your training import calendar (read-only).
- Builds **conditional** events for series-dependent fixtures (e.g. NBA G5+, tennis R3/R16+, CS playoffs, UCL second legs / finals).

The full behavior spec is in [`skills/watchlist-calendar-update/SKILL.md`](skills/watchlist-calendar-update/SKILL.md).

## ⚠️ Required per-user configuration

The skill references two Google Calendar IDs, which are **placeholders** in this repo and must be filled in for your own account before the skill works. Edit `skills/watchlist-calendar-update/SKILL.md` and replace:

| Placeholder              | Replace with                                                        |
| ------------------------ | ------------------------------------------------------------------- |
| `<MAIN_CALENDAR_ID>`     | Your Google **main** calendar ID (usually your calendar email).     |
| `<TRAINING_CALENDAR_ID>` | The ID/import token of your **training** calendar (read-only).      |

Do **not** commit your real calendar IDs to a shared repository.

## Install in Cowork

This repo (`yuyangp123/pyy`) ships a marketplace catalog at `.claude-plugin/marketplace.json`, so you can add it directly:

**Customize → Plugins → Add plugin → GitHub → `yuyangp123/pyy`**

Then enable the **sports-watchlist** plugin.

## Install in the Claude Code CLI

```shell
/plugin marketplace add yuyangp123/pyy
/plugin install sports-watchlist@yuyang-plugins
```

Or test locally without installing:

```bash
claude --plugin-dir ./sports-watchlist
```

After installing, the skill is model-invoked automatically based on your message; the namespaced form is `/sports-watchlist:watchlist-calendar-update`.

## License

MIT
