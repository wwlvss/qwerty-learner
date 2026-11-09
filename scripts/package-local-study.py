#!/usr/bin/env python3
"""Package a root-base production build with a dependency-free portable launcher."""
import argparse
from pathlib import Path
import zipfile
import subprocess

ROOT = Path(__file__).resolve().parents[1]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--site', required=True, type=Path)
    parser.add_argument('--output', required=True, type=Path)
    args = parser.parse_args()
    if not (args.site / 'index.html').is_file():
        raise ValueError('Missing built site')
    if '/qwerty-learner/assets/' in (args.site / 'index.html').read_text():
        raise ValueError('Use a normal root-base build, not a Pages build')
    args.output.parent.mkdir(parents=True, exist_ok=True)
    commit = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip()
    with zipfile.ZipFile(args.output, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=6) as archive:
        archive.write(ROOT / 'LICENSE', 'qwerty-local-study/LICENSE')
        archive.writestr('qwerty-local-study/SOURCE.txt', f'Source (GPL-3.0): https://github.com/wwlvss/qwerty-learner/tree/{commit}\nDictionary data retains its original source and license notices.\n')
        for file in sorted(args.site.rglob('*')):
            if file.is_file():
                archive.write(file, 'qwerty-local-study/site/' + str(file.relative_to(args.site)))
        for file in sorted((ROOT / 'scripts/local-study').iterdir()):
            if file.is_file():
                data = file.read_bytes()
                if file.suffix in ('.cmd', '.ps1'):
                    data = data.replace(b'\r\n', b'\n').replace(b'\n', b'\r\n')
                archive.writestr('qwerty-local-study/' + file.name, data)
    print(f'Created {args.output.name}: {args.output.stat().st_size / 1024 / 1024:.1f} MiB')


if __name__ == '__main__':
    main()
