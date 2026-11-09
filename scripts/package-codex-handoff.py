#!/usr/bin/env python3
"""Package a documentation/data handoff, never runtime secrets or user databases."""
import hashlib
import io
import json
from pathlib import Path
import zipfile

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / 'public/data'
DOCS = ROOT / 'docs/personal-learning'
PREFIX = 'Qwerty-Learner-Codex-Handoff/'


def main():
    PUBLIC.mkdir(exist_ok=True)
    # Fixed input paths avoid packaging the workspace, credentials, raw uploads or learning DBs.
    entries = {
        'START_HERE.txt': DOCS / 'START_HERE.txt',
        'FIRST_MESSAGE_TO_CODEX.txt': DOCS / 'LOCAL_CODEX_FIRST_MESSAGE.txt',
        'PROJECT_PROGRESS.xlsx': PUBLIC / 'project-progress.xlsx',
    }
    for file in sorted(DOCS.rglob('*')):
        if file.is_file() and file.suffix in ('.md', '.txt'):
            entries['docs/personal-learning/' + file.relative_to(DOCS).as_posix()] = file
    for filename in ['farm-source.json', 'farm-extra.tsv', 'synonyms.json', 'project-milestones.json']:
        entries['reference-data/' + filename] = ROOT / 'scripts/data' / filename
    contents = {name: file.read_bytes() for name, file in entries.items()}
    contents['SOURCE_GITHUB.txt'] = ('Source: https://github.com/wwlvss/qwerty-learner\nBranch: master\nZIP: https://github.com/wwlvss/qwerty-learner/archive/refs/heads/master.zip\nWebsite: https://wwlvss.github.io/qwerty-learner/\nThis is a context handoff, not a full source checkout. Use the latest master; do not reset to the historical feature baseline.\n').encode()
    contents['MANIFEST.json'] = json.dumps({
        'repository': 'wwlvss/qwerty-learner', 'branch': 'master',
        'featureBaseline': 'ba2feb44c1b977222620c7c68f75e1f7870f57db',
        'scope': 'Documentation working-tree snapshot plus selected reference data; latest source is on master. No credentials, raw uploaded XLSX, browser databases or node_modules.',
        'files': [{'path': name, 'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()} for name, data in sorted(contents.items())],
    }, ensure_ascii=False, indent=2).encode()
    output = PUBLIC / 'codex-handoff.zip'
    with zipfile.ZipFile(output, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
        for name, data in sorted(contents.items()):
            archive.writestr(PREFIX + name, data)
    with zipfile.ZipFile(output) as archive:
        assert archive.testzip() is None
        for name, data in contents.items():
            assert archive.read(PREFIX + name) == data
        with zipfile.ZipFile(io.BytesIO(archive.read(PREFIX + 'PROJECT_PROGRESS.xlsx'))) as workbook:
            assert workbook.testzip() is None
    (PUBLIC / 'local-codex-handoff.md').write_bytes((DOCS / 'LOCAL_CODEX_HANDOFF.md').read_bytes())
    (PUBLIC / 'local-codex-first-message.txt').write_bytes((DOCS / 'LOCAL_CODEX_FIRST_MESSAGE.txt').read_bytes())
    (PUBLIC / 'master-handoff.md').write_bytes((DOCS / 'MASTER_HANDOFF.md').read_bytes())
    print(json.dumps({'file': str(output.relative_to(ROOT)), 'files': len(contents), 'bytes': output.stat().st_size, 'verified': True}))


if __name__ == '__main__':
    main()
