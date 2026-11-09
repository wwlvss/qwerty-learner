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
        if item['url'] not in ('personal://words', 'unfamiliar://words'):
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
    definitions = {}
    phrases = {}
    missing = []
    dictionaries = resources()
    # Keep lookup definitions from existing dictionaries stable; topic files only fill gaps.
    topic_ids = {'farm-english', 'work-english', 'agriculture-english', 'daily-english', 'business-english'}
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
            for meaning in translations(entry.get('contextTrans', []) if resource['id'] in topic_ids else entry.get('trans')):
                if not re.search(r'[一-鿿]', meaning):
                    continue
                meaning = meaning.strip()
                senses = definitions.setdefault(word, {})
                sense = senses.setdefault(meaning, {'text': meaning, 'sources': []})
                source = resource['id']
                if source not in sense['sources']:
                    sense['sources'].append(source)

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
    for authored_path in [output / 'authored.json', ROOT / 'public/data/learning-dictionaries/usage.json', ROOT / 'public/data/farm-english/usage.json']:
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
    definitions = {word: list(senses.values()) for word, senses in definitions.items()}
    for name, data in [('catalog', catalog), ('usage', usage), ('definitions', definitions)]:
        letters = ([first + second for first in 'abcdefghijklmnopqrstuvwxyz' for second in 'abcdefghijklmnopqrstuvwxyz_'] if name == 'definitions' else list('abcdefghijklmnopqrstuvwxyz')) + ['other']
        shards = {letter: {} for letter in letters}
        for word, entry in sorted(data.items()):
            letter = (word[:2] if re.match(r'^[a-z]{2}', word) else word[0] + '_' if re.match(r'^[a-z]', word) else 'other') if name == 'definitions' else bucket(word)
            shards[letter][word] = entry
        folder = output / name
        folder.mkdir(exist_ok=True)
        for letter, entries in shards.items():
            (folder / (letter + '.json')).write_text(json.dumps(entries, ensure_ascii=False, separators=(',', ':')) + '\n')
    synonyms = json.loads((ROOT / 'scripts/data/synonyms.json').read_text())
    (output / 'synonyms.json').write_text(json.dumps({'source': '项目原创近义表达教学提示；不是权威词典或可无条件互换的同义词表', 'license': 'CC0-1.0 (original teaching material)', 'groups': synonyms}, ensure_ascii=False, indent=2) + '\n')
    synonym_words = {normalize(term['word']) for group in synonyms for term in group['terms']}
    etymologies = json.loads((ROOT / 'public/data/etymology/starter.json').read_text())
    manifest = {
        'englishDictionaries': len(dictionaries), 'availableDictionaries': len(dictionaries) - len(missing),
        'uniqueEntries': len(catalog), 'definitionEntries': len(definitions), 'phraseEntries': sum(bool(v['phrases']) for v in usage.values()),
        'exampleEntries': sum(bool(v['examples']) for v in usage.values()), 'etymologyEntries': len(etymologies['entries']),
        'synonymGroups': len(synonyms), 'synonymEntries': len(synonym_words & catalog.keys()),
        'missingDictionaries': missing,
    }
    (output / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps(manifest, ensure_ascii=False))


if __name__ == '__main__':
    main()
