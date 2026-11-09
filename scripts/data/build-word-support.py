#!/usr/bin/env python3
"""Build reference-only dictionary lookup shards and attributed phrase/usage shards."""
from pathlib import Path
import collections
import json
import re
import unicodedata

ROOT = Path(__file__).resolve().parents[2]


def normalize(word):
    return unicodedata.normalize('NFC', word).strip().lower()


def resources():
    result = []
    for block in re.findall(r'\{[^{}]*\}', (ROOT / 'src/resources/dictionary.ts').read_text()):
        if not re.search(r"language:\s*'en'", block):
            continue
        fields = {key: re.search(rf"\b{key}:\s*(['\"])(.*?)\1", block) for key in ('id', 'name', 'url')}
        if not all(fields.values()):
            raise ValueError('Unparsed English dictionary resource')
        item = {key: value.group(2) for key, value in fields.items()}
        if item['url'].startswith('./dicts/'):
            item['url'] = '/' + item['url'][2:]
        if item['url'] != 'personal://words':
            result.append(item)
    return result


def bucket(word):
    return word[0] if word and 'a' <= word[0] <= 'z' else 'other'


def translations(value):
    if isinstance(value, str):
        return [value] if value.strip() else []
    return [item for item in value if isinstance(item, str)] if isinstance(value, list) else []


def main():
    output = ROOT / 'public/data/word-support'
    catalog = {}
    phrases = {}
    missing = []
    dictionaries = resources()
    # Keep lookup definitions from existing dictionaries stable; topic files only fill gaps.
    topic_ids = {'work-english', 'agriculture-english', 'daily-english', 'business-english'}
    for resource in sorted(dictionaries, key=lambda resource: resource['id'] in topic_ids):
        path = ROOT / ('public' + resource['url'])
        if not path.is_file():
            missing.append(resource['id'])
            continue
        for index, entry in enumerate(json.loads(path.read_text())):
            word = normalize(str(entry.get('name', '')))
            if not word:
                continue
            catalog.setdefault(word, {'url': resource['url'], 'index': index})
            if ' ' in word and re.fullmatch(r"[a-z]+(?:[ '\-][a-z]+){1,5}", word):
                phrases.setdefault(word, {'text': entry['name'], 'translation': '；'.join(translations(entry.get('trans'))), 'source': {
                    'name': resource['name'] + ' · 原有词库短语', 'url': resource['url'],
                    'license': '沿用原词库资料说明；仅作个人学习，具体来源许可需逐项核对', 'kind': 'builtin',
                }})
    usage = {}
    for phrase, data in sorted(phrases.items(), key=lambda item: (len(item[0].split()), item[0])):
        targets = set(re.findall(r"[a-z]+(?:'[a-z]+)?", phrase)) | {phrase}
        for target in sorted(targets & catalog.keys()):
            entry = usage.setdefault(target, {'normalizedWord': target, 'phrases': [], 'examples': []})
            if len(entry['phrases']) < 6:
                entry['phrases'].append(data)
    for authored_path in [output / 'authored.json', ROOT / 'public/data/learning-dictionaries/usage.json']:
        authored = json.loads(authored_path.read_text())
        for entry in authored['entries']:
            target = usage.setdefault(entry['normalizedWord'], {'normalizedWord': entry['normalizedWord'], 'phrases': [], 'examples': []})
            for field in ['phrases', 'examples']:
                combined = entry[field] + target[field]
                seen = set()
                target[field] = []
                for item in combined:
                    key = (item['text'], item.get('context'))
                    if key not in seen:
                        target[field].append(item)
                        seen.add(key)
    for name, data in [('catalog', catalog), ('usage', usage)]:
        shards = {letter: {} for letter in list('abcdefghijklmnopqrstuvwxyz') + ['other']}
        for word, entry in sorted(data.items()):
            shards[bucket(word)][word] = entry
        folder = output / name
        folder.mkdir(exist_ok=True)
        for letter, entries in shards.items():
            (folder / (letter + '.json')).write_text(json.dumps(entries, ensure_ascii=False, separators=(',', ':')) + '\n')
    etymologies = json.loads((ROOT / 'public/data/etymology/starter.json').read_text())
    manifest = {
        'englishDictionaries': len(dictionaries), 'availableDictionaries': len(dictionaries) - len(missing),
        'uniqueEntries': len(catalog), 'phraseEntries': sum(bool(v['phrases']) for v in usage.values()),
        'exampleEntries': sum(bool(v['examples']) for v in usage.values()), 'etymologyEntries': len(etymologies['entries']),
        'missingDictionaries': missing,
    }
    (output / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps(manifest, ensure_ascii=False))


if __name__ == '__main__':
    main()
