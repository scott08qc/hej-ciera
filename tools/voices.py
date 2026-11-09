"""Record every Danish line in index.html in two voices. Run from the repo root:
   node tools/texts.js > texts.json   then   python tools/voices.py texts.json
Skips clips that already exist, so it is safe to re-run after adding lessons."""
import asyncio, json, os, re, sys
import edge_tts

VOICES = {"f": "da-DK-ChristelNeural", "m": "da-DK-JeppeNeural"}

def slug(t):
    t = t.lower().replace("æ", "ae").replace("ø", "oe").replace("å", "aa")
    return re.sub(r"[^a-z0-9]+", "-", t).strip("-")

async def one(text, who, sem):
    path = os.path.join("audio", who, slug(text) + ".mp3")
    if os.path.exists(path) and os.path.getsize(path) > 500:
        return 0
    async with sem:
        for attempt in range(3):
            try:
                await edge_tts.Communicate(text, VOICES[who], rate="-8%").save(path)
                return 1
            except Exception as e:
                err = e
                await asyncio.sleep(1 + attempt)
        print("FAILED", who, text, err)
        return 0

async def main():
    texts = json.load(open(sys.argv[1], encoding="utf-8"))
    for who in VOICES:
        os.makedirs(os.path.join("audio", who), exist_ok=True)
    sem = asyncio.Semaphore(2)
    made = await asyncio.gather(*[one(t, w, sem) for t in texts for w in VOICES])
    print(f"{len(texts)} lines, {sum(made)} new clips")

asyncio.run(main())
