#!/usr/bin/env python3
"""Create a source ZIP without .env, user data, DB dumps, signing keys or dependencies.
Usage (from any directory): python scripts/package-share.py
                      or: python scripts/package-share.py --check
"""
from __future__ import annotations

import argparse
import re
import subprocess
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile

ROOT = Path(__file__).resolve().parents[1]
BLOCKED_DIRS = {
    '.git', '.svn', '.hg', 'node_modules', 'backups', 'uploads', 'coverage', 'dist',
    'build', '.expo', '.gradle', '.idea', 'secrets', 'private', 'credentials',
    'backup', 'generated-media', 'recordings', 'exports', '__pycache__',
}
BLOCKED_SUFFIXES = {'.bak', '.bacpac', '.mdf', '.ndf', '.ldf', '.pem', '.key',
    '.p12', '.pfx', '.jks', '.keystore', '.sqlite', '.sqlite3', '.db', '.log',
    '.mp3', '.mp4', '.wav', '.webm', '.mov', '.m4a', '.ogg'}
BLOCKED_NAMES = {'id_rsa', 'id_ed25519', '.npmrc', '.pypirc', 'google-services.json', 'google-service-info.plist', 'test-errors.txt', 'eas-build.json'}
CHECK_TEXT = {'.js', '.jsx', '.mjs', '.ts', '.tsx', '.json', '.yml', '.yaml', '.txt', '.md', '.env', '.sql', '.properties', '.xml'}
PATTERNS = (
    re.compile(r'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----'),
    re.compile(r'\b(?:ghp_|gho_|ghu_|ghs_)[A-Za-z0-9]{20,}\b'),
    re.compile(r'\bsk-[A-Za-z0-9]{24,}\b'),
    re.compile(r'\bAKIA[0-9A-Z]{16}\b'),
)


def is_private(path: Path) -> bool:
    relative = path.relative_to(ROOT)
    parts = relative.parts
    if any(part in BLOCKED_DIRS for part in parts[:-1]):
        return True
    if parts[:2] == ('db', 'data'):
        return True
    # Generated media is not publishable; assets under docs are only safe when explicitly non-private.
    if any(part.lower() in {'uploads', 'media-output', 'media-generated'} for part in parts[:-1]):
        return True
    name = path.name.lower()
    if name in BLOCKED_NAMES or name in {'.env', 'env', '.envrc'}:
        return True
    if name.startswith('.env') and name != '.env.example':
        return True
    if name.endswith(('.tar.gz', '.sql.gz', '.sql.zip', '.bak.gz')) or path.suffix.lower() in BLOCKED_SUFFIXES:
        return True
    if name.endswith(('.orig', '.swp', '.swo')):
        return True
    return False


def list_safe_files():
    selected = []
    excluded = []
    for path in sorted(ROOT.rglob('*')):
        if not path.is_file() and not path.is_symlink():
            continue
        if path.is_symlink() or is_private(path):
            excluded.append(str(path.relative_to(ROOT)))
            continue
        selected.append(path)
    return selected, excluded


def tracked_private_paths():
    # .gitignore does not protect files already committed to Git.
    if not (ROOT / '.git').exists():
        return []
    process = subprocess.run(['git', '-C', str(ROOT), 'ls-files', '-z'],
                             stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, check=False)
    if process.returncode:
        return []
    return [name for item in process.stdout.split(b'\0') if item
            for name in [item.decode('utf-8', errors='replace')]
            if is_private(ROOT / name)]


def scan_for_secrets(paths):
    risks = []
    for file in paths:
        if file.suffix.lower() not in CHECK_TEXT or file.stat().st_size > 5_000_000:
            continue
        text = file.read_text(encoding='utf-8', errors='replace')
        if any(regex.search(text) for regex in PATTERNS):
            risks.append(str(file.relative_to(ROOT)))
    return risks


def main():
    cli = argparse.ArgumentParser(description=__doc__)
    cli.add_argument('--check', action='store_true', help='only scan, do not create a ZIP')
    cli.add_argument('--output', type=Path, help='destination ZIP outside the source tree')
    args = cli.parse_args()
    selected, excluded = list_safe_files()
    tracked = tracked_private_paths()
    if tracked:
        raise SystemExit('DỪNG: file riêng tư vẫn đang được Git theo dõi; dùng git rm --cached để bỏ theo dõi: '
                         + ', '.join(tracked[:20]))
    risks = scan_for_secrets(selected)
    if risks:
        raise SystemExit('DỪNG: phát hiện chuỗi giống bí mật trong: ' + ', '.join(risks))
    if not selected:
        raise SystemExit('Không có file an toàn để đóng gói')
    print(f'PASS: {len(selected)} file nguồn; loại {len(excluded)} file riêng tư, tệp rác hoặc thư viện.')
    if args.check:
        return
    destination = (args.output or (ROOT.parent / 'Dubchef_Nguon_An_Toan_De_Chia_Se.zip')).resolve()
    if destination.is_relative_to(ROOT):
        raise SystemExit('Đặt ZIP đầu ra bên ngoài thư mục dự án để tránh đóng gói lồng nhau.')
    destination.parent.mkdir(parents=True, exist_ok=True)
    with ZipFile(destination, 'w', ZIP_DEFLATED, compresslevel=6) as archive:
        for file in selected:
            archive.write(file, arcname='CNPM/' + file.relative_to(ROOT).as_posix())
    with ZipFile(destination) as archive:
        names = archive.namelist()
        if any(is_private(ROOT / name.removeprefix('CNPM/')) for name in names):
            destination.unlink(missing_ok=True)
            raise SystemExit('Đóng gói thất bại: ZIP chứa đường dẫn bí mật.')
        if archive.testzip() is not None:
            destination.unlink(missing_ok=True)
            raise SystemExit('Đóng gói thất bại: ZIP hỏng.')
    print('Đã tạo ZIP an toàn:', destination)


if __name__ == '__main__':
    main()
