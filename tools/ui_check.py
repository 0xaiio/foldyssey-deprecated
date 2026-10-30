"""CDP-driven UI verification for Foldyssey.

Runs against a live dev/preview server. Captures screenshots, drives the full
puzzle loop (fold -> snip -> unfold -> score) and reports console errors.

Usage:
    python tools/ui_check.py --url http://localhost:5173/ --out ./.artifacts
"""

from __future__ import annotations

import argparse
import base64
import json
import os
import socket
import subprocess
import sys
import tempfile
import time
import urllib.request

import websocket

EDGE_CANDIDATES = [
    r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
]


def free_port() -> int:
    s = socket.socket()
    s.bind(("127.0.0.1", 0))
    port = s.getsockname()[1]
    s.close()
    return port


def find_edge() -> str:
    for p in EDGE_CANDIDATES:
        if os.path.exists(p):
            return p
    raise SystemExit("Edge not found")


class CDP:
    def __init__(self, ws_url: str):
        self.ws = websocket.create_connection(ws_url, suppress_origin=True, timeout=30)
        self.id = 0
        self.events: list[dict] = []

    def send(self, method: str, params: dict | None = None, timeout: float = 30) -> dict:
        self.id += 1
        mid = self.id
        self.ws.send(json.dumps({"id": mid, "method": method, "params": params or {}}))
        deadline = time.time() + timeout
        while time.time() < deadline:
            msg = json.loads(self.ws.recv())
            if msg.get("id") == mid:
                if "error" in msg:
                    raise RuntimeError(f"{method} failed: {msg['error']}")
                return msg.get("result", {})
            if "method" in msg:
                self.events.append(msg)
        raise TimeoutError(method)

    def eval(self, expression: str, await_promise: bool = True):
        res = self.send(
            "Runtime.evaluate",
            {"expression": expression, "returnByValue": True, "awaitPromise": await_promise},
        )
        if "exceptionDetails" in res:
            raise RuntimeError(f"JS error: {res['exceptionDetails'].get('text')} :: {expression[:160]}")
        return res.get("result", {}).get("value")

    def wait_ready(self, timeout: float = 25) -> None:
        end = time.time() + timeout
        while time.time() < end:
            try:
                if self.eval("document.readyState") == "complete":
                    return
            except Exception:
                pass
            time.sleep(0.2)
        raise TimeoutError("page never reached readyState=complete")

    def navigate(self, url: str) -> None:
        self.send("Page.navigate", {"url": url})
        time.sleep(0.6)
        self.wait_ready()

    def viewport(self, width: int, height: int, scale: float = 1.0) -> None:
        self.send(
            "Emulation.setDeviceMetricsOverride",
            {
                "width": width,
                "height": height,
                "deviceScaleFactor": scale,
                "mobile": width < 600,
            },
        )

    def shot(self, path: str) -> None:
        res = self.send("Page.captureScreenshot", {"format": "png", "captureBeyondViewport": False})
        with open(path, "wb") as f:
            f.write(base64.b64decode(res["data"]))


def scroll_top(cdp: CDP) -> None:
    cdp.eval("window.scrollTo({top: 0, behavior: 'instant'})")
    time.sleep(0.35)



def element_center(cdp: CDP, selector: str):
    js = """
    (() => {
      const el = document.querySelector(%s);
      if (!el) return null;
      el.scrollIntoView({block: 'center'});
      const r = el.getBoundingClientRect();
      return {x: r.left + r.width/2, y: r.top + r.height/2, w: r.width, h: r.height};
    })()
    """ % json.dumps(selector)
    return cdp.eval(js)


def drag(cdp: CDP, selector: str, dx: float, dy: float) -> bool:
    c = element_center(cdp, selector)
    if not c:
        return False
    time.sleep(0.3)
    c = element_center(cdp, selector)
    if not c:
        return False
    x, y = c["x"], c["y"]
    cdp.send("Input.dispatchMouseEvent", {"type": "mouseMoved", "x": x, "y": y, "button": "none"})
    cdp.send(
        "Input.dispatchMouseEvent",
        {"type": "mousePressed", "x": x, "y": y, "button": "left", "buttons": 1, "clickCount": 1},
    )
    steps = 6
    for i in range(1, steps + 1):
        cdp.send(
            "Input.dispatchMouseEvent",
            {
                "type": "mouseMoved",
                "x": x + dx * i / steps,
                "y": y + dy * i / steps,
                "button": "left",
                "buttons": 1,
            },
        )
        time.sleep(0.02)
    cdp.send(
        "Input.dispatchMouseEvent",
        {"type": "mouseReleased", "x": x + dx, "y": y + dy, "button": "left", "buttons": 0, "clickCount": 1},
    )
    time.sleep(0.25)
    return True


def read_offset(cdp: CDP):
    js = """
    (() => {
      const rows = Array.from(document.querySelectorAll('dl div'));
      const row = rows.find(r => (r.innerText||'').includes('偏移'));
      if (!row) return null;
      const m = (row.innerText||'').match(/([0-9]+\.[0-9]+)/);
      return m ? m[1] : null;
    })()
    """
    return cdp.eval(js)


def set_slider(cdp: CDP, selector: str, value: float) -> bool:
    js = """
    (() => {
      const el = document.querySelector(%s);
      if (!el) return false;
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(el, String(%s));
      el.dispatchEvent(new Event('input', {bubbles: true}));
      el.dispatchEvent(new Event('change', {bubbles: true}));
      return true;
    })()
    """ % (json.dumps(selector), value)
    ok = bool(cdp.eval(js))
    time.sleep(0.35)
    return ok


def click_by_text(cdp: CDP, text: str, tag: str = "button") -> bool:
    js = """
    (() => {
      const t = %s, tag = %s;
      const nodes = Array.from(document.querySelectorAll(tag));
      const el = nodes.find(n => (n.innerText || '').replace(/\\s+/g, '').includes(t));
      if (!el) return false;
      el.scrollIntoView({block: 'center'});
      el.click();
      return true;
    })()
    """ % (
        json.dumps(text.replace(" ", "")),
        json.dumps(tag),
    )
    return bool(cdp.eval(js))


def console_errors(cdp: CDP) -> list[str]:
    out = []
    for e in cdp.events:
        if e.get("method") == "Runtime.consoleAPICalled":
            p = e["params"]
            if p.get("type") in ("error", "assert"):
                out.append(" ".join(str(a.get("value", a.get("description", ""))) for a in p.get("args", [])))
        if e.get("method") == "Runtime.exceptionThrown":
            d = e["params"].get("exceptionDetails", {})
            out.append(d.get("text", "") + " " + str(d.get("exception", {}).get("description", "")))
    return out


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--url", default="http://localhost:5173/")
    ap.add_argument("--out", default="./.artifacts")
    ap.add_argument("--attach", type=int, default=0)
    args = ap.parse_args()

    os.makedirs(args.out, exist_ok=True)
    port = args.attach or free_port()
    profile = tempfile.mkdtemp(prefix="foldyssey-edge-")
    proc = None
    report: dict = {"url": args.url, "steps": [], "errors": []}

    if not args.attach:
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
        if proc:
            proc.terminate()
        return 7

    cdp = CDP(ws_url)
    try:
        cdp.send("Page.enable")
        cdp.send("Runtime.enable")
        cdp.send("Log.enable")

        # ---------- desktop home ----------
        cdp.viewport(1440, 900)
        cdp.navigate(args.url)
        time.sleep(1.4)
        cdp.shot(os.path.join(args.out, "01-home-desktop.png"))
        report["steps"].append(
            {
                "step": "home-desktop",
                "title": cdp.eval("document.title"),
                "h1": cdp.eval("(document.querySelector('h1')||{}).innerText"),
                "paperPaths": cdp.eval("document.querySelectorAll('svg.paper-svg path').length"),
                "overflowX": cdp.eval("document.documentElement.scrollWidth > window.innerWidth"),
            }
        )

        # ---------- puzzle flow ----------
        cdp.navigate(args.url + "#/puzzle")
        time.sleep(1.0)
        scroll_top(cdp)
        cdp.shot(os.path.join(args.out, "02-puzzle-ready.png"))

        ok_fold = click_by_text(cdp, "折叠")
        time.sleep(1.5)
        scroll_top(cdp)
        cdp.shot(os.path.join(args.out, "03-puzzle-folded.png"))
        folded_label = cdp.eval("(document.body.innerText.includes('折叠中') ? 'busy' : 'idle')")

        # --- drag test: sliding the mid handle must change the offset ---
        before_offset = read_offset(cdp)
        dragged = drag(cdp, '[data-handle="mid"]', 0, 46)
        after_offset = read_offset(cdp)
        cdp.shot(os.path.join(args.out, "03b-puzzle-dragged.png"))

        # --- solve the level through the real UI ---
        set_slider(cdp, "#cut-angle", 45)
        set_slider(cdp, "#cut-offset", 1.0960)
        solved_offset = read_offset(cdp)

        ok_snip = click_by_text(cdp, "剪一刀")
        time.sleep(1.0)
        scroll_top(cdp)
        cdp.shot(os.path.join(args.out, "04-puzzle-cut.png"))

        ok_unfold = click_by_text(cdp, "展开")
        time.sleep(2.0)
        scroll_top(cdp)
        cdp.shot(os.path.join(args.out, "05-puzzle-revealed.png"))

        body = cdp.eval("document.body.innerText")
        report["steps"].append(
            {
                "step": "puzzle-flow",
                "clickedFold": ok_fold,
                "foldedLabel": folded_label,
                "clickedSnip": ok_snip,
                "clickedUnfold": ok_unfold,
                "dragChangedOffset": bool(before_offset and after_offset and before_offset != after_offset),
                "offsetBefore": before_offset,
                "offsetAfterDrag": after_offset,
                "offsetSolved": solved_offset,
                "perfect": "完全吻合" in body,
                "hasVerdict": ("完全吻合" in body) or ("未匹配" in body) or ("接近" in body),
                "hasIou": "IoU" in body,
                "iouText": cdp.eval(
                    "(() => { const m = document.body.innerText.match(/IoU\\s*\\n?\\s*([0-9.]+)/); return m ? m[1] : null; })()"
                ),
                "paperSubpaths": cdp.eval(
                    "(() => { const p = document.querySelector('svg.paper-svg path'); return p ? (p.getAttribute('d').match(/M/g)||[]).length : null; })()"
                ),
            }
        )

        # ---------- studio ----------
        cdp.navigate(args.url + "#/studio")
        time.sleep(1.2)
        scroll_top(cdp)
        cdp.shot(os.path.join(args.out, "06-studio.png"))
        paths_before = cdp.eval("document.querySelectorAll('svg path').length")
        cuts_before = cdp.eval("(document.body.innerText.match(/第 \\d+ 刀/g) || []).length")

        added = click_by_text(cdp, "加一刀")
        time.sleep(0.7)
        cuts_after = cdp.eval("(document.body.innerText.match(/第 \\d+ 刀/g) || []).length")
        scroll_top(cdp)
        cdp.shot(os.path.join(args.out, "06b-studio-added.png"))

        saved = click_by_text(cdp, "保存作品")
        time.sleep(0.6)
        gallery_keys = cdp.eval("Object.keys(localStorage).filter(k => k.indexOf('foldyssey') === 0)")

        exported = click_by_text(cdp, "导出 SVG")
        time.sleep(0.5)

        report["steps"].append(
            {
                "step": "studio",
                "hasPreview": cdp.eval("document.querySelectorAll('svg path').length > 4"),
                "pathsBefore": paths_before,
                "cutsBefore": cuts_before,
                "cutsAfterAdd": cuts_after,
                "addCutWorked": bool(added and cuts_after == cuts_before + 1),
                "saved": bool(saved),
                "storageKeys": gallery_keys,
                "exportClicked": bool(exported),
                "areaText": cdp.eval(
                    "(() => { const t = document.body.innerText; const m = t.match(/剩余面积\\s*\\n?\\s*([0-9.]+)/); return m ? m[1] : null; })()"
                ),
                "overflowX": cdp.eval("document.documentElement.scrollWidth > window.innerWidth"),
            }
        )

        # ---------- gallery ----------
        cdp.navigate(args.url + "#/gallery")
        time.sleep(1.0)
        scroll_top(cdp)
        cdp.shot(os.path.join(args.out, "06c-gallery.png"))
        report["steps"].append(
            {
                "step": "gallery",
                "cards": cdp.eval("document.querySelectorAll('article').length"),
                "thumbPaths": cdp.eval("document.querySelectorAll('article svg path').length"),
            }
        )

        # ---------- explore ----------
        cdp.navigate(args.url + "#/explore")
        time.sleep(0.9)
        scroll_top(cdp)
        cdp.shot(os.path.join(args.out, "07-explore.png"))
        report["steps"].append(
            {
                "step": "explore",
                "cards": cdp.eval("document.querySelectorAll('article').length"),
                "widgetSvgs": cdp.eval("document.querySelectorAll('article svg').length"),
            }
        )

        # ---------- about ----------
        cdp.navigate(args.url + "#/about")
        time.sleep(0.8)
        scroll_top(cdp)
        cdp.shot(os.path.join(args.out, "07b-about.png"))
        report["steps"].append(
            {
                "step": "about",
                "statesNoRuntimeAI": "没有调用任何大模型" in cdp.eval("document.body.innerText"),
            }
        )

        # ---------- mobile ----------
        cdp.viewport(390, 844, 2.0)
        cdp.navigate(args.url)
        time.sleep(1.2)
        cdp.shot(os.path.join(args.out, "08-home-mobile.png"))
        cdp.navigate(args.url + "#/puzzle")
        time.sleep(1.0)
        click_by_text(cdp, "折叠")
        time.sleep(1.5)
        cdp.shot(os.path.join(args.out, "09-puzzle-mobile-folded.png"))
        report["steps"].append(
            {
                "step": "mobile",
                "overflowX": cdp.eval("document.documentElement.scrollWidth > window.innerWidth"),
                "viewport": cdp.eval("[window.innerWidth, window.innerHeight]"),
                "handleCount": cdp.eval("document.querySelectorAll('.cut-handle').length"),
            }
        )

        report["errors"] = console_errors(cdp)
    finally:
        try:
            cdp.ws.close()
        except Exception:
            pass
        if proc:
            proc.terminate()
            time.sleep(0.5)
        import shutil

        shutil.rmtree(profile, ignore_errors=True)

    print(json.dumps(report, ensure_ascii=False, indent=2))
    with open(os.path.join(args.out, "report.json"), "w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=2)
    return 0


if __name__ == "__main__":
    sys.exit(main())
