#!/usr/bin/env python3
"""Build one farm dictionary from extracted user learning material and explicit additions."""
import csv
import json
from pathlib import Path
import re
import runpy

ROOT = Path(__file__).resolve().parents[2]
OUTPUT = ROOT / 'public/data/farm-english'
CONTEXT = 'farm-english'


def main():
    source = json.loads((ROOT / 'scripts/data/farm-source.json').read_text())
    originals, meanings = {}, {}
    resources = runpy.run_path(str(ROOT / 'scripts/data/build-word-support.py'))['resources']()
    for resource in resources:
        if resource['id'] in {'farm-english', 'work-english', 'agriculture-english', 'daily-english', 'business-english'}:
            continue
        for entry in json.loads((ROOT / ('public' + resource['url'])).read_text()):
            key = str(entry.get('name', '')).strip().lower()
            originals.setdefault(key, entry)
            trans = entry.get('trans', [])
            for text in ([trans] if isinstance(trans, str) else trans if isinstance(trans, list) else []):
                if isinstance(text, str) and re.search('[一-鿿]', text) and text not in meanings.setdefault(key, []):
                    meanings[key].append(text)
    user_source = {'name': source['source'] + ' · 用户学习资料', 'url': 'https://github.com/wwlvss/qwerty-learner/blob/master/docs/personal-learning/farm-english.md', 'license': '用户提供的学习资料；原文未声明开放许可', 'kind': 'user'}
    extra_source = {**user_source, 'name': '农场场景原创补充教学材料', 'license': 'CC0-1.0 (original teaching material)', 'kind': 'original'}
    vocabulary = [{**word, 'sourceKind': 'user'} for word in source['vocabulary']]
    with (ROOT / 'scripts/data/farm-extra.tsv').open() as stream:
        for row in csv.reader(stream, delimiter='\t'):
            if len(row) != 7:
                raise ValueError('Farm extension rows need seven columns')
            name, meaning, category, phrase, phrase_zh, example, translation = row
            vocabulary.append({'name': name, 'meaning': meaning, 'category': category, 'example': example, 'translation': translation, 'phrase': phrase, 'phraseTranslation': phrase_zh, 'sourceKind': 'original', 'sheet': '本轮补充'})
    if len(vocabulary) != 160 or len({word['name'].lower() for word in vocabulary}) != 160:
        raise ValueError('Expected 160 distinct farm entries')
    words, usage = [], {}
    for word in vocabulary:
        normalized = word['name'].lower()
        original = originals.get(normalized, {})
        words.append({'name': word['name'], 'trans': list(dict.fromkeys([word['meaning']] + meanings.get(normalized, []))), 'contextTrans': [word['meaning']], 'usphone': original.get('usphone', '') or '', 'ukphone': original.get('ukphone', '') or ''})
        entry = usage.setdefault(normalized, {'normalizedWord': normalized, 'phrases': [], 'examples': []})
        word_source = user_source if word['sourceKind'] == 'user' else extra_source
        if word.get('phrase') or ' ' in word['name']:
            entry['phrases'].append({'text': word.get('phrase', word['name']), 'translation': word.get('phraseTranslation', word['meaning']), 'source': word_source, 'context': CONTEXT})
        candidates = [{'text': word['example'], 'translation': word['translation'], 'source': word_source}] + [{**sentence, 'source': user_source} for sentence in source['sentences']]
        seen = set()
        for sentence in candidates:
            text = sentence['text']
            match = re.search(r'(?<![A-Za-z0-9])' + re.escape(word['name']) + r'(?![A-Za-z0-9])', text, re.I)
            if match and text not in seen:
                seen.add(text)
                entry['examples'].append({'text': text, 'translation': sentence['translation'], 'targetStart': len(text[:match.start()].encode('utf-16-le')) // 2, 'targetEnd': len(text[:match.end()].encode('utf-16-le')) // 2, 'source': sentence['source'], 'context': CONTEXT})
    materials = {'profile': {'farmLabel': '龙潭农场', 'farmLabelSource': '上传文件标题', 'role': '生产主管', 'roleEnglish': 'production supervisor', 'region': '云南红河蒙自', 'regionEnglish': 'Mengzi, Honghe, Yunnan', 'varietyCodes': ['L25', 'L29', 'L11', 'L36', 'L37'], 'profileSource': '用户在本轮对话确认'}, 'source': source['source'], 'vocabulary': vocabulary, 'sentences': source['sentences'], 'guidance': source['guidance'], 'morphologyGuide': source['morphologyGuide'], 'sourceVocabularyCount': len(source['vocabulary']), 'extensionVocabularyCount': len(vocabulary) - len(source['vocabulary']), 'sourceSentenceCount': len(source['sentences']), 'notes': ['所有产量、月份、工人数量等原句数字均为教学场景，不代表本农场事实。', '品种代号仅按用户提供保留，不推断品种特性、产量或管理参数。', '构词提示来自原资料，尚未按历史词源标准核实；发音参考不是标准音标。']}
    OUTPUT.mkdir(exist_ok=True)
    for filename, data in [('materials.json', materials), ('usage.json', {'format': 'qwerty-word-usage', 'version': 1, 'entries': list(usage.values())})]:
        (OUTPUT / filename).write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')
    (ROOT / 'public/dicts/farm-english.json').write_text(json.dumps(words, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({'words': len(words), 'sourceWords': len(source['vocabulary']), 'addedWords': len(vocabulary) - len(source['vocabulary']), 'sourceSentences': len(source['sentences']), 'annotatedWords': sum(bool(entry['examples']) for entry in usage.values())}))


if __name__ == '__main__':
    main()
