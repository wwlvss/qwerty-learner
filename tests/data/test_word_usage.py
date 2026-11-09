import io
import json
from pathlib import Path
import runpy
import unittest

ROOT = Path(__file__).parents[2]
translations = runpy.run_path(str(ROOT / 'scripts/data/build-word-support.py'))['translations']
collect = runpy.run_path(str(ROOT / 'scripts/data/prepare-tatoeba-usage.py'))['collect']


class WordUsageTest(unittest.TestCase):
    def test_streaming_import_matches_whole_words_and_phrases_with_exact_offsets(self):
        fixture = io.StringIO('1\teng\tThe theatre is open.\n2\teng\tHe will take care of the garden.\n3\tfra\tHe will wait here.\n')
        data = collect(fixture, {'he', 'take care of', 'theatre'}, 'CC0 test fixture', limit=1)
        self.assertEqual(len(data['he']['examples']), 1)
        self.assertEqual(data['he']['examples'][0]['text'], 'He will take care of the garden.')
        example = data['take care of']['examples'][0]
        self.assertEqual(example['text'][example['targetStart']:example['targetEnd']], 'take care of')
        self.assertNotIn('garden', data)

    def test_original_dictionary_strings_are_not_split_into_individual_characters(self):
        self.assertEqual(translations('照顾；照料'), ['照顾；照料'])
        self.assertEqual(translations(['照顾', None, '照料']), ['照顾', '照料'])
        self.assertEqual(translations(None), [])

    def test_unicode_context_uses_browser_utf16_offsets(self):
        data = collect(io.StringIO('1\teng\t🙂 He can learn.\n'), {'he'}, 'CC0 test fixture')
        example = data['he']['examples'][0]
        self.assertEqual((example['targetStart'], example['targetEnd']), (3, 5))

    def test_shipped_examples_highlight_the_target_and_reference_a_source(self):
        pack = json.loads((ROOT / 'public/data/word-support/authored.json').read_text())
        self.assertGreaterEqual(len(pack['entries']), 20)
        for entry in pack['entries']:
            for example in entry['examples']:
                target = example['text'][example['targetStart']:example['targetEnd']]
                self.assertEqual(target.lower(), entry['normalizedWord'])
                self.assertTrue(example['source']['license'])
                self.assertEqual(example['source']['kind'], 'original')

    def test_coverage_manifest_counts_actual_shards_not_the_number_of_supported_widgets(self):
        folder = ROOT / 'public/data/word-support'
        manifest = json.loads((folder / 'manifest.json').read_text())
        catalog = {key: value for path in (folder / 'catalog').glob('*.json') for key, value in json.loads(path.read_text()).items()}
        usage = {key: value for path in (folder / 'usage').glob('*.json') for key, value in json.loads(path.read_text()).items()}
        self.assertEqual(manifest['uniqueEntries'], len(catalog))
        self.assertEqual(manifest['phraseEntries'], sum(bool(value['phrases']) for value in usage.values()))
        self.assertEqual(manifest['exampleEntries'], sum(bool(value['examples']) for value in usage.values()))
        for reference in catalog.values():
            self.assertTrue((ROOT / ('public' + reference['url'])).is_file())


if __name__ == '__main__':
    unittest.main()
