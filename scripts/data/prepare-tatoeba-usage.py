#!/usr/bin/env python3
"""Stream a local Tatoeba English TSV into attributed usage packs. Never downloads data."""
import argparse
import json
from pathlib import Path
import re


def collect(sentences, words, license_name, limit=2):
    result = {}
    for line in sentences:
        parts = line.rstrip('\n').split('\t', 2)
        if len(parts) != 3 or parts[1] != 'eng' or not parts[0].isdigit():
            continue
        sentence_id, _, text = parts
        if not 8 <= len(text) <= 240:
            continue
        tokens = list(re.finditer(r"[A-Za-z]+(?:['-][A-Za-z]+)*", text))
        matched = set()
        for start_index in range(len(tokens)):
            for size in range(1, min(6, len(tokens) - start_index) + 1):
                start, end = tokens[start_index].start(), tokens[start_index + size - 1].end()
                word = text[start:end].lower()
                if word not in words or word in matched:
                    continue
                matched.add(word)
                entry = result.setdefault(word, {'normalizedWord': word, 'phrases': [], 'examples': []})
                if len(entry['examples']) >= limit:
                    continue
                entry['examples'].append({
                    'text': text, 'targetStart': len(text[:start].encode('utf-16-le')) // 2,
                    'targetEnd': len(text[:end].encode('utf-16-le')) // 2,
                    'source': {'name': f'Tatoeba contributors · sentence {sentence_id}',
                               'url': f'https://tatoeba.org/en/sentences/show/{sentence_id}',
                               'license': license_name, 'kind': 'tatoeba'},
                })
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--sentences', type=Path, required=True, help='Locally downloaded and decompressed eng_sentences.tsv')
    parser.add_argument('--words', type=Path, required=True, help='UTF-8 target word list, one word/phrase per line')
    parser.add_argument('--license', required=True, help='Actual text-data license from the selected export (do not guess)')
    parser.add_argument('--output-dir', type=Path, required=True, help='A NEW directory for packs of at most 2000 target words')
    args = parser.parse_args()
    words = {word.strip().lower() for word in args.words.read_text(encoding='utf-8').splitlines() if word.strip()}
    if not args.license.strip():
        parser.error('License and attribution are required')
    with args.sentences.open(encoding='utf-8') as sentences:
        entries = list(collect(sentences, words, args.license).values())
    args.output_dir.mkdir(parents=True, exist_ok=False)
    for offset in range(0, len(entries), 2000):
        pack = {'format': 'qwerty-word-usage', 'version': 1, 'entries': entries[offset:offset + 2000]}
        (args.output_dir / f'usage-{offset // 2000 + 1:03d}.json').write_text(json.dumps(pack, ensure_ascii=False) + '\n', encoding='utf-8')
    print(f'Covered {len(entries)} of {len(words)} targets; absent targets are not synthesized. No translations were generated.')


if __name__ == '__main__':
    main()
