import json
from pathlib import Path
import unittest

ROOT = Path(__file__).parents[2]


class FarmMaterialsTest(unittest.TestCase):
    def test_uploaded_learning_fields_are_preserved_without_relabeling_them_as_verified_etymology(self):
        source = json.loads((ROOT / 'scripts/data/farm-source.json').read_text())
        material = json.loads((ROOT / 'public/data/farm-english/materials.json').read_text())
        self.assertEqual(len(source['vocabulary']), 119)
        self.assertEqual(len(material['vocabulary']), 160)
        for original, integrated in zip(source['vocabulary'], material['vocabulary']):
            self.assertEqual({key: integrated[key] for key in original}, original)
            self.assertEqual(integrated['sourceKind'], 'user')
        self.assertTrue(all(word['sourceKind'] == 'original' for word in material['vocabulary'][119:]))
        for field in ['sentences', 'guidance', 'morphologyGuide']:
            self.assertEqual(material[field], source[field])
        self.assertEqual(len(material['sentences']), 64)
        self.assertEqual(len(material['morphologyGuide']), 15)
        self.assertEqual(material['profile']['varietyCodes'], ['L25', 'L29', 'L11', 'L36', 'L37'])
        self.assertTrue(any('不代表' in note for note in material['notes']))

    def test_farm_dictionary_is_independent_and_annotated_examples_use_exact_target_offsets(self):
        words = json.loads((ROOT / 'public/dicts/farm-english.json').read_text())
        self.assertEqual(len(words), 160)
        self.assertEqual(words[0]['name'], 'timesheet')
        self.assertEqual(len({word['name'].lower() for word in words}), 160)
        for word in words:
            self.assertIn(word['contextTrans'][0], word['trans'])
        pack = json.loads((ROOT / 'public/data/farm-english/usage.json').read_text())
        self.assertEqual(len(pack['entries']), 160)
        for entry in pack['entries']:
            for example in entry['examples']:
                encoded = example['text'].encode('utf-16-le')
                selected = encoded[example['targetStart'] * 2:example['targetEnd'] * 2].decode('utf-16-le')
                self.assertEqual(selected.lower(), entry['normalizedWord'])
                self.assertIn(example['source']['kind'], ['user', 'original'])
                self.assertTrue(example['source']['license'])
