import json
from pathlib import Path
import runpy
import tempfile
import unittest

prepare = runpy.run_path(str(Path(__file__).parents[2] / 'scripts/data/prepare-etymology.py'))['prepare']


class PrepareEtymologyTest(unittest.TestCase):
    def test_only_selected_english_evidence_is_retained_without_inferred_facts(self):
        # Synthetic strings test extraction behavior, not historical assertions.
        rows = [
            {'word': 'Sample', 'lang_code': 'en', 'etymology_text': 'SOURCE PASSAGE A'},
            {'word': 'Sample', 'lang_code': 'en', 'etymology_text': 'SOURCE PASSAGE A'},
            {'word': 'Sample', 'lang_code': 'en', 'etymology_text': 'SOURCE PASSAGE B'},
            {'word': 'Sample', 'lang_code': 'fr', 'etymology_text': 'NOT ENGLISH'},
            {'word': 'Other', 'lang_code': 'en', 'etymology_text': 'NOT SELECTED'},
        ]
        with tempfile.TemporaryDirectory() as folder:
            source = Path(folder) / 'input.jsonl'
            source.write_text('\n'.join(json.dumps(row) for row in rows), encoding='utf-8')
            pack = prepare(source, {'sample'})
        self.assertEqual(pack['roots'], [])
        self.assertEqual(pack['relations'], [])
        self.assertEqual(len(pack['entries']), 1)
        entry = pack['entries'][0]
        self.assertEqual(entry['historicalEvolution'], ['SOURCE PASSAGE A', 'SOURCE PASSAGE B'])
        self.assertEqual(entry['verificationStatus'], 'pending')
        self.assertEqual(entry['morphologicalAnalysis'], [])
        self.assertEqual(entry['originalForm'], '待核实')
        self.assertEqual(entry['sources'][0]['verificationStatus'], 'pending')


if __name__ == '__main__':
    unittest.main()
