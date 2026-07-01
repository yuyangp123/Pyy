#!/usr/bin/env python3
"""Monitor Joybuy UK for air-conditioner listings and send a reminder.

By default this checks Joybuy UK every five minutes.  It can alert via:
- an ntfy.sh topic (set JOYBUY_NTFY_TOPIC),
- a generic webhook (set JOYBUY_WEBHOOK_URL), and/or
- a local desktop notification command when available.
"""
from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from html.parser import HTMLParser
from typing import Iterable

DEFAULT_QUERY_URL = "https://www.joybuy.co.uk/search?keyword=air%20conditioner"
DEFAULT_INTERVAL_SECONDS = 300
USER_AGENT = "Mozilla/5.0 (compatible; JoybuyAirconMonitor/1.0)"
PRODUCT_HINTS = ("air conditioner", "air conditioning", "portable aircon", "mobile air conditioner")
NEGATIVE_HINTS = ("out of stock", "sold out", "notify me", "unavailable")
POSITIVE_HINTS = ("add to basket", "add to cart", "buy now", "in stock", "£")


class VisibleTextParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self._skip_depth = 0
        self.parts: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag.lower() in {"script", "style", "noscript"}:
            self._skip_depth += 1

    def handle_endtag(self, tag: str) -> None:
        if tag.lower() in {"script", "style", "noscript"} and self._skip_depth:
            self._skip_depth -= 1

    def handle_data(self, data: str) -> None:
        if not self._skip_depth and data.strip():
            self.parts.append(data.strip())


def fetch(url: str, timeout: int) -> str:
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(request, timeout=timeout) as response:
        charset = response.headers.get_content_charset() or "utf-8"
        return response.read().decode(charset, errors="replace")


def visible_text(html: str) -> str:
    parser = VisibleTextParser()
    parser.feed(html)
    return re.sub(r"\s+", " ", " ".join(parser.parts)).strip()


def has_available_aircon(text: str) -> bool:
    lower = text.lower()
    has_product = any(hint in lower for hint in PRODUCT_HINTS)
    has_positive = any(hint in lower for hint in POSITIVE_HINTS)
    only_unavailable = any(hint in lower for hint in NEGATIVE_HINTS) and not has_positive
    return has_product and has_positive and not only_unavailable


def summarize(text: str, max_len: int = 240) -> str:
    matches = []
    for hint in PRODUCT_HINTS:
        idx = text.lower().find(hint)
        if idx >= 0:
            start = max(0, idx - 80)
            end = min(len(text), idx + 160)
            matches.append(text[start:end].strip())
    summary = matches[0] if matches else text[:max_len]
    return summary[:max_len] + ("…" if len(summary) > max_len else "")


def post_json(url: str, payload: dict[str, str], timeout: int) -> None:
    data = json.dumps(payload).encode("utf-8")
    request = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
    urllib.request.urlopen(request, timeout=timeout).close()


def notify_ntfy(topic: str, title: str, message: str, click_url: str, timeout: int) -> None:
    safe_topic = urllib.parse.quote(topic.strip("/"), safe="/")
    url = f"https://ntfy.sh/{safe_topic}"
    request = urllib.request.Request(
        url,
        data=message.encode("utf-8"),
        headers={"Title": title, "Click": click_url, "Tags": "snowflake,shopping"},
    )
    urllib.request.urlopen(request, timeout=timeout).close()


def notify_desktop(title: str, message: str) -> None:
    if sys.platform == "darwin" and shutil.which("osascript"):
        subprocess.run(["osascript", "-e", f'display notification "{message}" with title "{title}"'], check=False)
    elif sys.platform.startswith("linux") and shutil.which("notify-send"):
        subprocess.run(["notify-send", title, message], check=False)
    elif sys.platform.startswith("win") and shutil.which("powershell"):
        script = (
            "Add-Type -AssemblyName System.Windows.Forms;"
            f"[System.Windows.Forms.MessageBox]::Show('{message}', '{title}')"
        )
        subprocess.run(["powershell", "-NoProfile", "-Command", script], check=False)


def send_notifications(title: str, message: str, url: str, timeout: int) -> None:
    if topic := os.getenv("JOYBUY_NTFY_TOPIC"):
        notify_ntfy(topic, title, message, url, timeout)
    if webhook := os.getenv("JOYBUY_WEBHOOK_URL"):
        post_json(webhook, {"title": title, "message": message, "url": url}, timeout)
    notify_desktop(title, message)


def monitor(url: str, interval: int, timeout: int, once: bool) -> int:
    already_alerted = False
    while True:
        try:
            html = fetch(url, timeout)
            text = visible_text(html)
            available = has_available_aircon(text)
            print(time.strftime("%Y-%m-%d %H:%M:%S"), "available=" + str(available), flush=True)
            if available and not already_alerted:
                message = f"Joybuy UK 可能有空调可买：{summarize(text)} 打开：{url}"
                send_notifications("Joybuy UK 空调提醒", message, url, timeout)
                already_alerted = True
            elif not available:
                already_alerted = False
        except (urllib.error.URLError, TimeoutError, OSError) as exc:
            print(time.strftime("%Y-%m-%d %H:%M:%S"), f"check failed: {exc}", file=sys.stderr, flush=True)
        if once:
            return 0
        time.sleep(interval)


def parse_args(argv: Iterable[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Check Joybuy UK every five minutes for air-conditioner availability.")
    parser.add_argument("--url", default=DEFAULT_QUERY_URL, help="Joybuy search or category URL to monitor.")
    parser.add_argument("--interval", type=int, default=DEFAULT_INTERVAL_SECONDS, help="Seconds between checks.")
    parser.add_argument("--timeout", type=int, default=20, help="HTTP timeout in seconds.")
    parser.add_argument("--once", action="store_true", help="Run one check and exit.")
    return parser.parse_args(argv)


def main(argv: Iterable[str] | None = None) -> int:
    args = parse_args(argv or sys.argv[1:])
    return monitor(args.url, args.interval, args.timeout, args.once)


if __name__ == "__main__":
    raise SystemExit(main())
