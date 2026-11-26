# STRWEB-LR2

Сайт аптеки «Здоровье+»: Django-проект (ЛР5) + HTML-вёрстка (ЛР1) + CSS-оформление (ЛР2).

## Стек

Python 3.12, Django 6.0, SQLite (dev), pytest + pytest-django + coverage.
Оформление — один файл CSS без фреймворков и JS-анимаций.

## Запуск

```bash
python -m venv venv
venv/bin/pip install -r requirements.txt
venv/bin/python manage.py migrate
venv/bin/python manage.py seed_data --flush   # демо-данные: 7 новостей, партнёры, контакты
venv/bin/python manage.py runserver           # http://127.0.0.1:8000/
```

Демо-аккаунты (пароль `demo1234`): `cust_sidorenko`, `cust_kozlov` — покупатели,
`emp_ivanov`, `emp_petrova` — сотрудники. Владелец создаётся командой `createsuperuser`.

## Тесты и проверки

```bash
venv/bin/python -m pytest                              # 75 passed, 1 known failed, coverage ≥80%
venv/bin/python tools/check_css_features.py            # чек-лист требований ЛР2 (122 пункта)
venv/bin/python manage.py shell -c "exec(open('tools/check_tags.py').read())"
venv/bin/python tools/validate_all.py                  # HTML-валидация (W3C Nu), кэшируется
```

## Документация

- `docs/HANDOVER.md` — состояние проекта и передача;
- `docs/lr2_css_qa.md` — ответы на вопросы по темам;
- `docs/lr2_answers.md` — ответы дословно по спискам вопросов;
- `docs/validation/SUMMARY.md` — результаты HTML-валидации;
- `docs/defense_qa.md` — шпаргалка к защите ЛР1.

## Секреты

Реальные ключи лежат в `.env` (в git не попадает). Для локального запуска `.env` не обязателен:
используются значения по умолчанию из `PharmacyProject/settings.py`.
