import json
from pathlib import Path
import unittest

ROOT = Path(__file__).parents[2]


class LearningDictionariesTest(unittest.TestCase):
    def test_each_topic_word_has_its_own_contextual_phrase_and_example(self):
        pack = json.loads((ROOT / 'public/data/learning-dictionaries/usage.json').read_text())
        usage = {entry['normalizedWord']: entry for entry in pack['entries']}
        counts = {'work-english': 60, 'agriculture-english': 80, 'daily-english': 40, 'business-english': 40}
        for context, count in counts.items():
            words = json.loads((ROOT / f'public/dicts/{context}.json').read_text())
            self.assertEqual(len(words), count)
            self.assertEqual(len({word['name'].lower() for word in words}), count)
            for word in words:
                self.assertTrue(word['trans'][0])
                entry = usage[word['name'].lower()]
                self.assertTrue(any(phrase.get('context') == context for phrase in entry['phrases']))
                example = next(example for example in entry['examples'] if example.get('context') == context)
                self.assertEqual(example['text'][example['targetStart']:example['targetEnd']].lower(), word['name'].lower())
                self.assertTrue(example['translation'])
                shard = json.loads((ROOT / f"public/data/word-support/usage/{word['name'][0].lower()}.json").read_text())
                self.assertIn(example, shard[word['name'].lower()]['examples'])


if __name__ == '__main__':
    unittest.main()
