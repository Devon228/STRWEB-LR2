# Результаты HTML-валидации (Nu)

Команда: `venv/bin/python tools/validate_all.py` (повторный запуск читает кэш; `--force` — перепроверить всё, `--only=home,news` — выборочно).

| Страница | Ошибки | Info-предупреждения | Источник |
|---|---:|---:|---|
| about | 0 | 0 | W3C Nu |
| analytics | 0 | 6 | W3C Nu |
| cart | 0 | 3 | W3C Nu |
| categories | 0 | 0 | W3C Nu |
| concurrency-demo | 0 | 3 | W3C Nu |
| contacts | 0 | 0 | W3C Nu |
| employee_purchases | 0 | 2 | W3C Nu |
| employee_sales | 0 | 2 | W3C Nu |
| glossary | 0 | 0 | W3C Nu |
| home | 0 | 0 | W3C Nu |
| login | 0 | 0 | W3C Nu |
| medications | 0 | 2 | W3C Nu |
| medications_MED-001 | 0 | 0 | W3C Nu |
| medications_MED-001_delete | 0 | 0 | W3C Nu |
| medications_MED-001_edit | 0 | 0 | W3C Nu |
| news | 0 | 0 | W3C Nu |
| news_36 | 0 | 0 | W3C Nu |
| owner | 0 | 2 | W3C Nu |
| payment | 0 | 0 | W3C Nu |
| pickup | 0 | 0 | W3C Nu |
| privacy | 4 | 0 | html5.validator.nu |
| promos | 3 | 0 | html5.validator.nu |
| purchases | 2 | 0 | html5.validator.nu |
| register | 0 | 0 | W3C Nu |
| reviews | 0 | 0 | html5.validator.nu |
| services | 0 | 0 | html5.validator.nu |
| vacancies | 0 | 0 | W3C Nu |

**Итого:** ошибок — 9, info-предупреждений — 20.

Пояснение к разнице классификации:

- **validator.w3.org (W3C Nu)** помечает устаревшие атрибуты `border`/`cellpadding`/`cellspacing` как **info**, поэтому там 0 ошибок на всех страницах, кроме `/privacy/` (4 ожидаемые ошибки от `frameset`/`frame` — устаревшие теги из `includes/legacy_tags.html`, требование ЛР1).
- **html5.validator.nu** те же атрибуты считает **errors** — это ожидаемое и разрешённое условием ЛР1 поведение. Страницы `privacy`, `promos`, `purchases`, `reviews`, `services` были проверены этим API, пока W3C отдавал HTTP 429 (rate limit); на `promos` и `purchases` добавляются 3 и 2 ошибки об устаревших атрибутах таблиц.
