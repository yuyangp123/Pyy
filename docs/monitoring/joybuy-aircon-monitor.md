# Joybuy UK Air-Conditioner Monitor

This repository includes a small helper script for checking Joybuy UK every five minutes for air-conditioner availability and sending a reminder.

## Run once

```bash
python scripts/joybuy_aircon_monitor.py --once
```

## Run every five minutes

```bash
python scripts/joybuy_aircon_monitor.py
```

The default URL is:

```text
https://www.joybuy.co.uk/search?keyword=air%20conditioner
```

Use `--url` if Joybuy changes the search path or if you want to monitor a specific category/product page.

## Push notifications

For phone push notifications, install the ntfy app, subscribe to a private topic, and set `JOYBUY_NTFY_TOPIC` before running the script:

```bash
export JOYBUY_NTFY_TOPIC="your-private-topic-name"
python scripts/joybuy_aircon_monitor.py
```

You can also set `JOYBUY_WEBHOOK_URL` to send a JSON payload with `title`, `message`, and `url` fields to your own automation endpoint.

If neither environment variable is set, the script still attempts a local desktop notification using `notify-send` on Linux, `osascript` on macOS, or PowerShell on Windows.
