#!/usr/bin/env python3
"""Select English Wiktextract JSONL entries for manual review. No network or inference."""
import argparse
import datetime
import json
from pathlib import Path
import unicodedata
from urllib.parse import quote


def normalize(word):
    return unicodedata.normalize('NFC', word).strip().lower()


def prepare(input_path, words):
    selected = {}
    with input_path.open(encoding='utf-8') as stream:
        for line in stream:
            item = json.loads(line)
            word = normalize(item.get('word', ''))
            if item.get('lang_code') != 'en' or word not in words:
                continue
            evidence = item.get('etymology_text')
            if not isinstance(evidence, str) or not evidence.strip():
                continue
            if evidence not in selected.setdefault(word, []):
                selected[word].append(evidence)
    entries = []
    for word, passages in sorted(selected.items()):
        sources = [{
            'name': 'Wiktionary contributors / Wiktextract export',
            'url': f'https://en.wiktionary.org/wiki/{quote(word, safe="")}#English',
            'license': 'CC BY-SA 4.0; retain attribution and verify the specific upstream dump terms',
            'originalEntry': word,
            'evidence': passage,
            'verificationStatus': 'pending',
        } for passage in passages]
        entries.append({
            'id': f'en:{word}', 'wordId': f'en:{word}', 'normalizedWord': word,
            'morphologicalAnalysis': [],
            'morphologyNote': '待人工核实，未从拼写自动推断词根或构词边界。',
            'originLanguage': '待核实', 'originalForm': '待核实', 'originalMeaning': '待核实',
            'historicalEvolution': passages,
            'etymologyExplanation': '原始英文材料，多个词源/词性记录需人工区分。未自动认定历史路径。',
            'memoryTip': '尚未编写辅助记忆。', 'sources': sources,
            'confidence': 0, 'verificationStatus': 'pending',
            'updatedAt': datetime.date.today().isoformat(),
        })
    return {'format': 'qwerty-etymology', 'version': 1, 'id': 'wiktextract-pending-review', 'entries': entries, 'roots': [], 'relations': []}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--input', type=Path, required=True, help='Locally obtained Wiktextract JSONL')
    parser.add_argument('--words', type=Path, required=True, help='UTF-8 word list, one word per line (at most 1000)')
    parser.add_argument('--output', type=Path, required=True, help='New JSON package; existing files are not overwritten')
    args = parser.parse_args()
    words = {normalize(w) for w in args.words.read_text(encoding='utf-8').splitlines() if w.strip()}
    if not 0 < len(words) <= 1000:
        parser.error('Select between 1 and 1000 words')
    payload = json.dumps(prepare(args.input, words), ensure_ascii=False, indent=2) + '\n'
    if len(payload.encode('utf-8')) > 5 * 1024 * 1024:
        parser.error('Package exceeds 5 MB; split the word list')
    with args.output.open('x', encoding='utf-8') as output:
        output.write(payload)
    print('Prepared pending-review package; no automatic verification, morphology or relations.')


if __name__ == '__main__':
    main()
