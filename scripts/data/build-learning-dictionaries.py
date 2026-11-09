#!/usr/bin/env python3
"""Build four separate topic dictionaries and their original contextual usage data."""
import csv
import json
from pathlib import Path
import re
import runpy

ROOT = Path(__file__).resolve().parents[2]
COUNTS = {'work-english': 120, 'agriculture-english': 160, 'daily-english': 100, 'business-english': 100}


def main():
    books = {key: [] for key in COUNTS}
    usages = {}
    source = {'name': '项目原创场景教学示例', 'url': 'https://github.com/wwlvss/qwerty-learner/blob/master/docs/personal-learning/learning-dictionaries.md', 'license': 'CC0-1.0 (original teaching material)', 'kind': 'original'}
    resources = runpy.run_path(str(ROOT / 'scripts/data/build-word-support.py'))['resources']()
    originals = {}
    meanings = {}
    for resource in resources:
        if resource['id'] in COUNTS or resource['id'] == 'farm-english':
            continue
        for entry in json.loads((ROOT / ('public' + resource['url'])).read_text()):
            key = str(entry.get('name', '')).strip().lower()
            originals.setdefault(key, entry)
            trans = entry.get('trans', [])
            for meaning in ([trans] if isinstance(trans, str) else trans if isinstance(trans, list) else []):
                if isinstance(meaning, str) and re.search(r'[一-鿿]', meaning) and meaning.strip() not in meanings.setdefault(key, []):
                    meanings[key].append(meaning.strip())
    with (ROOT / 'scripts/data/learning-dictionaries.tsv').open(encoding='utf-8') as stream:
        for row in csv.reader(stream, delimiter='\t'):
            if len(row) != 7:
                raise ValueError('Each line must have 7 columns')
            context, word, meaning, phrase, phrase_zh, sentence, sentence_zh = row
            if context not in books:
                raise ValueError('Unknown dictionary ID')
            normalized = word.lower()
            if any(entry['name'].lower() == normalized for entry in books[context]):
                raise ValueError('Duplicate word within a dictionary: ' + word)
            match = re.search(r'(?<![A-Za-z])' + re.escape(word) + r'(?![A-Za-z])', sentence, re.I)
            if not match:
                raise ValueError('Example must contain its exact target: ' + word)
            original = originals.get(normalized, {})
            books[context].append({'name': word, 'trans': list(dict.fromkeys([meaning] + meanings.get(normalized, []))), 'contextTrans': [meaning], 'usphone': original.get('usphone', '') or '', 'ukphone': original.get('ukphone', '') or ''})
            usage = usages.setdefault(normalized, {'normalizedWord': normalized, 'phrases': [], 'examples': []})
            usage['phrases'].append({'text': phrase, 'translation': phrase_zh, 'source': source, 'context': context})
            usage['examples'].append({'text': sentence, 'translation': sentence_zh, 'targetStart': len(sentence[:match.start()].encode('utf-16-le')) // 2, 'targetEnd': len(sentence[:match.end()].encode('utf-16-le')) // 2, 'source': source, 'context': context})
    for key, entries in books.items():
        if len(entries) != COUNTS[key]:
            raise ValueError(f'{key}: expected {COUNTS[key]}, got {len(entries)}')
        (ROOT / f'public/dicts/{key}.json').write_text(json.dumps(entries, ensure_ascii=False, indent=2) + '\n')
    output = ROOT / 'public/data/learning-dictionaries'
    output.mkdir(exist_ok=True)
    (output / 'usage.json').write_text(json.dumps({'format': 'qwerty-word-usage', 'version': 1, 'entries': list(usages.values())}, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({key: len(value) for key, value in books.items()}))


if __name__ == '__main__':
    main()
