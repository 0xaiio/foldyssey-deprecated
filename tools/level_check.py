"""Drive every puzzle level through the real UI with its canonical cut.

For each level: fold -> set angle/offset/wrong-side fix -> snip -> unfold ->
read the verdict. Proves the shipped levels are solvable without touching code.

Usage:
    python tools/level_check.py --url http://localhost:4173/ --out ./.artifacts
"""

from __future__ import annotations

import argparse
import json
import os
import shutil
import subprocess
import sys
import tempfile
import time
import urllib.request

from ui_check import CDP, click_by_text, console_errors, find_edge, free_port, scroll_top, set_slider

SQRT1_2 = 0.7071067811865476

LEVELS = [
    # id, angle(deg), offset, removedSide ('positive' | 'negative')
    ("corner-first", 45, 1.55 * SQRT1_2, "positive"),
    ("mirror-gate", 45, 1.2 * SQRT1_2, "positive"),
    ("diamond-miracle", 45, 0.34 * SQRT1_2, "negative"),
    ("size-riddle", 45, 0.62 * SQRT1_2, "negative"),
    ("angle-riddle", 30, 0.3, "negative"),
    ("diamond-from-square", 45, 1.0 * SQRT1_2, "positive"),
]


def current_side(cdp: CDP):
    txt = cdp.eval(
        "(() => { const b = Array.from(document.querySelectorAll('button'))"
        ".find(x => (x.innerText||'').includes('换保留侧')); return b ? b.innerText : null; })()"
    )
    if not txt:
        return None
    return "positive" if "正侧" in txt else "negative"


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--url", default="http://localhost:5173/")
    ap.add_argument("--out", default="./.artifacts")
    args = ap.parse_args()

    os.makedirs(args.out, exist_ok=True)
    port = free_port()
    profile = tempfile.mkdtemp(prefix="foldyssey-levels-")
    proc = subprocess.Popen(
        [
            find_edge(),
            "--headless=new",
            "--disable-gpu",
            "--no-proxy-server",
            "--no-first-run",
            "--no-default-browser-check",
            f"--user-data-dir={profile}",
            f"--remote-debugging-port={port}",
            "about:blank",
        ],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )

    opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
    ws_url = None
    for _ in range(80):
        try:
            data = json.loads(opener.open(f"http://127.0.0.1:{port}/json/list", timeout=2).read())
            pages = [d for d in data if d.get("type") == "page"]
            if pages:
                ws_url = pages[0]["webSocketDebuggerUrl"]
                break
        except Exception:
            pass
        time.sleep(0.4)

    if not ws_url:
        print("EDGE DEVTOOLS NOT REACHABLE")
        proc.terminate()
        return 7

    cdp = CDP(ws_url)
    results = []
    try:
        cdp.send("Page.enable")
        cdp.send("Runtime.enable")
        cdp.viewport(1440, 1000)

        for level_id, angle, offset, side in LEVELS:
            cdp.navigate(f"{args.url}#/puzzle/{level_id}")
            time.sleep(1.0)
            scroll_top(cdp)
            click_by_text(cdp, "折叠")
            time.sleep(1.4)

            angle_disabled = cdp.eval(
                "(() => { const e = document.querySelector('#cut-angle'); return e ? e.disabled : null; })()"
            )
            if not angle_disabled:
                set_slider(cdp, "#cut-angle", angle)
            set_slider(cdp, "#cut-offset", round(offset, 4))

            now_side = current_side(cdp)
            flipped = False
            if now_side and now_side != side:
                click_by_text(cdp, "换保留侧")
                flipped = True
                time.sleep(0.3)

            click_by_text(cdp, "剪一刀")
            time.sleep(0.95)
            click_by_text(cdp, "展开")
            time.sleep(2.0)

            body = cdp.eval("document.body.innerText")
            iou = cdp.eval(
                "(() => { const t = document.body.innerText; const m = t.match(/iou\\s*\\n?\\s*([0-9.]+)/i); return m ? m[1] : null; })()"
            )
            results.append(
                {
                    "level": level_id,
                    "angleLocked": bool(angle_disabled),
                    "flippedSide": flipped,
                    "perfect": "完全吻合" in body,
                    "iou": iou,
                    "verdictText": next(
                        (v for v in ["完全吻合", "接近", "未匹配"] if v in body), None
                    ),
                }
            )
            scroll_top(cdp)
            cdp.shot(os.path.join(args.out, f"level-{level_id}.png"))

        report = {
            "url": args.url,
            "levels": results,
            "allPerfect": all(r["perfect"] for r in results),
            "errors": console_errors(cdp),
        }
    finally:
        try:
            cdp.ws.close()
        except Exception:
            pass
        proc.terminate()
        time.sleep(0.4)
        shutil.rmtree(profile, ignore_errors=True)

    print(json.dumps(report, ensure_ascii=False, indent=2))
    with open(os.path.join(args.out, "levels.json"), "w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=2)
    return 0


if __name__ == "__main__":
    sys.exit(main())
