# Generates the spoken lines as mp3 files: voice/<lang>/<id>.mp3, from voice/lines.json (made by voice-lines.js).
# Trial voices: Microsoft Edge's online "read aloud" voices through the edge-tts package (pip install edge-tts).
# Only lines whose text changed (or whose file is missing) are generated again; voice/done.json remembers the text.
# Before a paid release, regenerate with a properly licensed service or real recordings - the file names stay the same.
import asyncio, json, os, sys
import edge_tts

HERE = os.path.dirname(os.path.abspath(__file__))
VOICES = {
    'en': {'nar': ('en-GB-SoniaNeural', '-4%', '+0Hz'), 'bud': ('en-US-AnaNeural', '+0%', '+12Hz')},
    'de': {'nar': ('de-DE-KatjaNeural', '-4%', '+0Hz'), 'bud': ('de-DE-AmalaNeural', '+6%', '+40Hz')},   # no German child voice on offer: a young voice, pitched up
}

async def one(sem, lang, key, text, kind, done):
    path = os.path.join(HERE, 'voice', lang, key + '.mp3')
    stamp = kind + '|' + text
    if os.path.exists(path) and done.get(lang + '/' + key) == stamp:
        return 0
    voice, rate, pitch = VOICES[lang][kind]
    async with sem:
        for attempt in range(3):
            try:
                await edge_tts.Communicate(text, voice, rate=rate, pitch=pitch).save(path)
                done[lang + '/' + key] = stamp
                return 1
            except Exception as e:  # the service drops a connection now and then
                if attempt == 2:
                    print('FAILED', lang, key, e)
                    return 0
                await asyncio.sleep(1.5)

async def main():
    lines = json.load(open(os.path.join(HERE, 'voice', 'lines.json'), encoding='utf-8'))
    done_path = os.path.join(HERE, 'voice', 'done.json')
    done = json.load(open(done_path, encoding='utf-8')) if os.path.exists(done_path) else {}
    sem = asyncio.Semaphore(4)
    jobs = []
    for lang, items in lines.items():
        os.makedirs(os.path.join(HERE, 'voice', lang), exist_ok=True)
        for key, (text, kind) in items.items():
            jobs.append(one(sem, lang, key, text, kind, done))
    made = sum(await asyncio.gather(*jobs))
    json.dump(done, open(done_path, 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
    print('generated', made, 'of', len(jobs))

asyncio.run(main())
