# Передача проекта «Аптека Здоровье+» — состояние после ЛР2 (CSS)

Корень: `/home/dimas/University/sem_5/STRWEB/LR2`
База: Django-проект из ЛР5 + HTML-вёрстка ЛР1, поверх которой выполнена ЛР2 (оформление CSS).
Соседний каталог `/home/dimas/University/sem_5/STRWEB/LR1` — сданная HTML-лаба, **не трогать**.

## 1. Что сделано в ЛР2

- Добавлен **один** файл стилей `pharmacy/static/pharmacy/css/style.css` (без разбиения по страницам), подключён в `base.html` и `concurrency_demo.html`. Bootstrap/CDN-фреймворков нет.
- Google Fonts (Montserrat + Roboto) подключены как «шрифт из службы»; в CSS есть fallback-семейства.
- Реализованы все пункты задания: селекторы, псевдоклассы/псевдоэлементы, медиа-запросы (ширина/высота/ориентация), Grid-каталог, Flexbox-контакты, float/clear-вакансии, круглые блоки партнёров, sticky-навигация, position/z-index (сертификат, бейдж статьи), таблицы, прелоадер «вращающаяся пилюля» и CSS-анимация варианта «Аптека» (сгорбленный покупатель, аптекарь, лекарство, название компании), 3D-трансформации, градиенты, вендорные префиксы.
- Новых JS-скриптов нет: вся анимация и прелоадер — чистый CSS. Существующий JS ЛР1 (корзина localStorage, демо-оплата, авто-часовой пояс, форма регистрации) сохранён.
- `seed_data.py`: добавлены 4 статьи (итого **7** новостей) и локальные картинки новостей (внешний loremflickr отдаёт 401 без API-ключа).
- Добавлены ответы на вопросы защиты: `docs/lr2_css_qa.md` (сгруппировано по темам) и `docs/lr2_answers.md` (дословно по присланным спискам вопросов), со ссылками на строки `style.css`.
- Добавлены инструменты проверки в `tools/` и результаты в `docs/validation/`.

## 2. Запуск

```bash
cd /home/dimas/University/sem_5/STRWEB/LR2
venv/bin/python manage.py migrate
venv/bin/python manage.py seed_data --flush   # 7 статей, 8 партнёров, 12 контактов
venv/bin/python manage.py runserver           # http://127.0.0.1:8000/
```

Демо-аккаунты (пароль `demo1234`): `cust_sidorenko`, `cust_kozlov` (покупатели), `emp_ivanov`, `emp_petrova` (сотрудники). Владелец — `createsuperuser`.

## 3. Тесты

```bash
venv/bin/python -m pytest
# эталон: 75 passed, 1 failed (test_resolve_timezone_fallback — известный, не чинить), coverage 84–85%
```

Тесты и `settings.py`/`forms.py`/`services/**` не менялись. HTML-инварианты тестов соблюдены: 10 `<img>` на `/contacts/` в тестовой БД, `<img>` отсутствует в `base.html`, `user_now` не попадает на главную, ошибки форм выводятся, «Asyncio» на демо-странице.

## 4. Проверки ЛР2

```bash
# 1) HTML: 97 тегов + DOCTYPE, инварианты, снимки страниц
venv/bin/python manage.py shell -c "exec(open('tools/check_tags.py').read())"

# 2) Чек-лист CSS-требований (122 пункта) с номерами строк
venv/bin/python tools/check_css_features.py

# 3) HTML-валидация (кэшируется; W3C Nu)
venv/bin/python tools/validate_all.py                 # повторный запуск читает кэш
venv/bin/python tools/validate_all.py --only=home     # выборочно
venv/bin/python tools/validate_all.py --force         # всё заново (осторожно: rate limit)
```

- Итог валидации: `docs/validation/SUMMARY.md`. W3C Nu: 0 ошибок на всех страницах, кроме `/privacy/` (4 ожидаемые ошибки от `frameset`/`frame`, требование ЛР1). При недоступности W3C часть страниц проверена `html5.validator.nu`, который считает устаревшие атрибуты таблиц `border/cellpadding/cellspacing` ошибками, а не info — это ожидаемо и разрешено условием ЛР1.
- Снимки страниц: `docs/validation/html/`, JSON-ответы: `docs/validation/json/`, отчёт по тегам: `docs/validation/tags_report.txt`.
- Ассеты (логотипы, PDF, WAV, VTT, рамка сертификата, текстура фона) пересоздаются: `venv/bin/python tools/gen_assets.py`.

## 5. Ограничения, о которых важно помнить

- Только CSS; для оформления JS не добавлять. Один файл стилей.
- В `base.html:21` намеренно оставлен пустой `<style></style>` — тег `style` входит в чек-лист 97 тегов ЛР1.
- Устаревшие атрибуты таблиц (`border`, `cellpadding`, `cellspacing`) сохранены из ЛР1; CSS (`border-collapse: collapse`) их перекрывает.
- Тесты, `settings.py`, `forms.py`, `services/**`, `manage.py`, docker-файлы — не менять.
- Внешний `loremflickr.com` больше не отдаёт изображения (401), поэтому картинки статей привязываются из `static/pharmacy/img/news/` при `seed_data`.
- Google Fonts требуют сети; без интернета сработает fallback-шрифт.
- `validator.w3.org` жёстко ограничивает частоту запросов (HTTP 429) — не гонять `validate_all.py --force` подряд.

## 6. Git-порядок

Из отслеживания убраны (`git rm --cached`, локально файлы остаются): `db.sqlite3`, `media/`, `venv/`, `.coverage`, `app.log`, `logs/`, `htmlcov/`, `__pycache__/`, `*.pyc`. Они добавлены в `.gitignore`. Это уменьшает репозиторий на ~11 тысяч служебных файлов.
