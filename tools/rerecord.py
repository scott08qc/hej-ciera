"""Re-record Danish lines with the official Microsoft voices, through the sync service (which holds the speech key).
   python tools/rerecord.py texts.json            -> writes audio/f and audio/m in this repo
   python tools/rerecord.py names.json --server   -> keeps the clips on the sync service instead (lines with a name)
The free speech tier allows about 20 requests a minute, so this paces itself and takes a while."""
import json, os, re, sys, time, urllib.request, urllib.error

URL = "https://sync-production-16d2f.up.railway.app/admin/tts"
KEY = open(".admin-key").read().strip()

def slug(t):
    t = t.lower().replace("æ", "ae").replace("ø", "oe").replace("å", "aa")
    return re.sub(r"[^a-z0-9]+", "-", t).strip("-")

def voice(text, who, save):
    body = json.dumps({"text": text, "who": who, "save": save}).encode("utf-8")
    req = urllib.request.Request(URL, data=body, headers={"content-type": "application/json", "x-admin-key": KEY, "user-agent": "hej-danmark-tools"})
    for attempt in range(6):
        try:
            with urllib.request.urlopen(req, timeout=60) as r:
                return r.read()
        except urllib.error.HTTPError as e:
            time.sleep(25 if e.code == 429 else 5)
        except Exception:
            time.sleep(5)
    return None

texts = json.load(open(sys.argv[1], encoding="utf-8"))
server = "--server" in sys.argv
done = failed = 0
for t in texts:
    for who in ("f", "m"):
        buf = voice(t, who, server)
        if not buf or len(buf) < 500:
            failed += 1
            print("FAILED", who, t, flush=True)
        else:
            if not server:
                os.makedirs(os.path.join("audio", who), exist_ok=True)
                open(os.path.join("audio", who, slug(t) + ".mp3"), "wb").write(buf)
            done += 1
        time.sleep(3.3)
    if done % 20 == 0:
        print(done, "clips so far", flush=True)
print(f"{len(texts)} lines: {done} recorded, {failed} failed")
