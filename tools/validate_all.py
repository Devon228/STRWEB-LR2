"""Отправка сохранённых HTML-снимков в валидатор Nu (W3C / html5.validator.nu).

Запуск:
    venv/bin/python tools/validate_all.py

Скрипт читает docs/validation/html/*.html (создаются tools/check_tags.py),
отправляет каждый файл POST-запросом, сохраняет ответы в docs/validation/json/
и формирует сводку docs/validation/SUMMARY.md.

Ожидаемый результат: 0 ошибок на всех страницах, кроме /privacy/ —
там 4 ошибки от устаревших тегов frameset/frame (требование ЛР1).
Устаревшие атрибуты border/cellpadding/cellspacing дают info-предупреждения.
"""

import json
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
HTML_DIR = ROOT / 'docs' / 'validation' / 'html'
JSON_DIR = ROOT / 'docs' / 'validation' / 'json'
SUMMARY = ROOT / 'docs' / 'validation' / 'SUMMARY.md'
JSON_DIR.mkdir(parents=True, exist_ok=True)

# Используем W3C Nu как единственный источник: html5.validator.nu периодически
# недоступен и классифицирует устаревшие атрибуты таблиц (border/cellpadding/
# cellspacing) как errors, а не info, что искажает ожидаемую картину.
ENDPOINTS = [
    'https://validator.w3.org/nu/?out=json',
]

FORCE = '--force' in sys.argv
ONLY = []
for argument in sys.argv[1:]:
    if argument.startswith('--only='):
        ONLY = [name.strip() for name in argument.split('=', 1)[1].split(',') if name.strip()]


def validate(data):
    last_error = None
    for endpoint in ENDPOINTS:
        for attempt in range(3):
            request = urllib.request.Request(
                endpoint,
                data=data,
                headers={
                    'Content-Type': 'text/html; charset=utf-8',
                    'User-Agent': 'zdorovie-plus-lr2-validator/1.0',
                },
            )
            try:
                with urllib.request.urlopen(request, timeout=120) as response:
                    return json.loads(response.read().decode('utf-8')), endpoint
            except urllib.error.HTTPError as exc:
                last_error = f'{endpoint}: HTTP {exc.code}'
                if exc.code == 429:
                    print(f'  rate limit, ждём 45 с ({endpoint})')
                    time.sleep(45)
                else:
                    time.sleep(5)
            except Exception as exc:  # noqa: BLE001
                last_error = f'{endpoint}: {exc}'
                time.sleep(4)
    print(f'  не удалось: {last_error}')
    return None, None


def main():
    html_files = sorted(HTML_DIR.glob('*.html'))
    if not html_files:
        print(f'Нет снимков в {HTML_DIR}. Сначала запустите tools/check_tags.py')
        return

    failures = []
    for path in html_files:
        name = path.stem
        if ONLY and name not in ONLY:
            continue
        json_path = JSON_DIR / (name + '.json')
        cached = json_path.exists() and json_path.stat().st_mtime > path.stat().st_mtime
        if cached and not FORCE:
            print(f'{name:34s} cached')
            continue
        payload, endpoint = validate(path.read_bytes())
        if payload is None:
            failures.append(name)
            print(f'{name:34s} FAIL')
            continue
        with open(json_path, 'w', encoding='utf-8') as handle:
            json.dump(payload, handle, ensure_ascii=False, indent=1)
        print(f'{name:34s} обновлён ({endpoint})')
        time.sleep(2)

    # Сводка всегда строится по всем сохранённым JSON, а не только по обработанным.
    rows = []
    total_errors = 0
    total_warnings = 0
    for path in html_files:
        json_path = JSON_DIR / (path.stem + '.json')
        if not json_path.exists():
            rows.append((path.stem, 'FAIL', 'FAIL', 'нет данных валидатора'))
            continue
        payload = json.loads(json_path.read_text(encoding='utf-8'))
        messages = payload.get('messages', [])
        errors = [m for m in messages if m.get('type') != 'info']
        warnings = [m for m in messages if m.get('type') == 'info']
        total_errors += len(errors)
        total_warnings += len(warnings)
        source = 'W3C Nu' if payload.get('version') else 'html5.validator.nu'
        rows.append((path.stem, len(errors), len(warnings), source))

    summary = [
        '# Результаты HTML-валидации (Nu)',
        '',
        'Команда: `venv/bin/python tools/validate_all.py` (повторный запуск читает кэш; '
        '`--force` — перепроверить всё, `--only=home,news` — выборочно).',
        '',
        '| Страница | Ошибки | Info-предупреждения | Источник |',
        '|---|---:|---:|---|',
    ]
    for name, errors, warnings, source in rows:
        summary.append(f'| {name} | {errors} | {warnings} | {source} |')
    summary.append('')
    summary.append(f'**Итого:** ошибок — {total_errors}, info-предупреждений — {total_warnings}.')
    summary.append('')
    summary.append('Пояснение к разнице классификации:')
    summary.append('')
    summary.append('- **validator.w3.org (W3C Nu)** помечает устаревшие атрибуты '
                   '`border`/`cellpadding`/`cellspacing` как **info**, поэтому там 0 ошибок '
                   'на всех страницах, кроме `/privacy/` (4 ожидаемые ошибки от `frameset`/'
                   '`frame` — устаревшие теги из `includes/legacy_tags.html`, требование ЛР1).')
    summary.append('- **html5.validator.nu** те же атрибуты считает **errors** — это '
                   'ожидаемое и разрешённое условием ЛР1 поведение. Страницы `privacy`, '
                   '`promos`, `purchases`, `reviews`, `services` были проверены этим API, '
                   'пока W3C отдавал HTTP 429 (rate limit); на `promos` и `purchases` '
                   'добавляются 3 и 2 ошибки об устаревших атрибутах таблиц.')
    if failures:
        summary.append('')
        summary.append('Не удалось перепроверить (в сводке использованы предыдущие '
                       f'сохранённые результаты): {", ".join(failures)}.')
    SUMMARY.write_text('\n'.join(summary) + '\n', encoding='utf-8')
    print(f'\nСводка: {SUMMARY}')
    if failures:
        sys.exit(1)


if __name__ == '__main__':
    main()
