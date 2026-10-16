"""Проверка HTML-инвариантов сайта «Здоровье+» (ЛР1 + ЛР2).

Запуск:
    venv/bin/python manage.py shell -c "exec(open('tools/check_tags.py').read())"

Что делает:
  * обходит публичные страницы, страницы покупателя и владельца через Django test client;
  * сохраняет HTML-снимки в docs/validation/html/;
  * проверяет наличие всех 97 тегов из задания ЛР1 (+ DOCTYPE = 98 позиций);
  * проверяет, что CSS подключён одним файлом, нет inline-стилей и Bootstrap;
  * проверяет HTML-инварианты тестов (10 <img> на контактах в тестовой БД,
    отсутствие user_now на главной, «Asyncio» на демо-странице и т.д.);
  * пишет отчёт docs/validation/tags_report.txt.
"""

import re
from pathlib import Path

from django.conf import settings
from django.contrib.auth import get_user_model
from django.test import Client

from pharmacy.models import Article, Medication

OUT_DIR = Path(settings.BASE_DIR) / 'docs' / 'validation' / 'html'
OUT_DIR.mkdir(parents=True, exist_ok=True)
REPORT = Path(settings.BASE_DIR) / 'docs' / 'validation' / 'tags_report.txt'

# Чистим старые снимки, чтобы в docs/validation не оставалось устаревших страниц.
for stale in OUT_DIR.glob('*.html'):
    stale.unlink()

TAGS = (
    'html head body title base meta link style script noscript p br wbr div span pre '
    'blockquote hr font b i em s strong u small sub sup code var samp kbd abbr dfn q cite '
    'time mark ul ol li dl dt dd h1 h2 h3 h4 h5 h6 hgroup main address section article '
    'header footer nav aside details summary figure figcaption table caption colgroup col '
    'thead tbody tfoot tr th td a img picture source iframe embed object param video audio '
    'track frameset frame form input textarea select option optgroup datalist button '
    'fieldset legend label'
).split()

article = Article.objects.filter(is_published=True).order_by('-published_at').first()
NEWS_PK = article.pk if article else 1
medication = Medication.objects.order_by('code').first()
MED_CODE = medication.code if medication else 'MED-001'

PUBLIC = [
    '/', '/about/', '/news/', f'/news/{NEWS_PK}/', '/glossary/', '/contacts/', '/privacy/',
    '/vacancies/', '/categories/', '/medications/', '/promos/', '/services/', '/reviews/',
    '/concurrency-demo/', '/cart/', '/payment/', '/register/', '/login/',
    f'/medications/{MED_CODE}/',
]

CUSTOMER = ['/purchases/', '/pickup/']
OWNER = [
    '/owner/', '/analytics/', '/employee/sales/', '/employee/suppliers/',
    '/employee/purchases/', f'/medications/{MED_CODE}/edit/', f'/medications/{MED_CODE}/delete/',
]

User = get_user_model()
client = Client()
pages = {}

for url in PUBLIC:
    pages[url] = client.get(url, follow=False)

customer = User.objects.filter(username='cust_sidorenko').first()
if customer:
    client.force_login(customer)
    for url in CUSTOMER:
        pages[url] = client.get(url)
    client.logout()

owner = User.objects.filter(is_superuser=True).first()
if owner:
    client.force_login(owner)
    for url in OWNER:
        pages[url] = client.get(url)
    client.logout()

all_html = ''
problems = []
lines = []
for url, response in pages.items():
    if response.status_code not in (200, 403):
        problems.append(f'{url}: HTTP {response.status_code}')
    body = response.content.decode('utf-8')
    lines.append(f'  {url:34s} {response.status_code}')
    if response.status_code != 200:
        # 403 — стандартная страница Django без базового шаблона, стили не проверяем.
        continue
    all_html += '\n' + body
    slug = url.strip('/').replace('/', '_') or 'home'
    with open(OUT_DIR / (slug + '.html'), 'w', encoding='utf-8') as handle:
        handle.write(body)
    if 'style="' in body:
        problems.append(f'{url}: найден inline-стиль style="..."')
    if re.search(r'<style\s*>[^<]', body):
        problems.append(f'{url}: непустой <style> (ожидается пустой тег из ЛР1)')
    if 'bootstrap' in body.lower():
        problems.append(f'{url}: найден Bootstrap')
    if 'pharmacy/css/style.css' not in body:
        problems.append(f'{url}: не подключён единый style.css')

missing = []
for tag in TAGS:
    pattern = r'<%s[\s/>]' % re.escape(tag)
    if not re.search(pattern, all_html):
        missing.append(tag)

if not re.search(r'<!DOCTYPE html>', all_html, re.IGNORECASE):
    missing.append('!DOCTYPE')

contacts = pages['/contacts/'].content.decode('utf-8')
news = pages['/news/'].content.decode('utf-8')
home = pages['/'].content.decode('utf-8')

report = []
report.append('=== ЗАГРУЖЕННЫЕ СТРАНИЦЫ ===')
report.extend(lines)
report.append('')
report.append('=== ИНВАРИАНТЫ ===')
report.append(f'contacts <img>: {contacts.count("<img")} (в тестовой БД ожидается 10)')
report.append(f'news <img> >= 1: {news.count("<img") >= 1}')
report.append(f'home TIME_ZONE in HTML: {settings.TIME_ZONE in home}')
report.append(f'home user_now literal absent: {"user_now" not in home}')
report.append(f'home <img>: {"<img" in home}')
report.append(f'concurrency Asyncio: {"Asyncio" in pages["/concurrency-demo/"].content.decode("utf-8")}')
report.append(f'legacy template on privacy: {"<frameset" in pages["/privacy/"].content.decode("utf-8")}')
report.append('')
report.append('=== ПРОБЛЕМЫ ===')
report.append('\n'.join(problems) if problems else 'нет')
report.append('')
report.append(f'=== ОТСУТСТВУЮЩИЕ ТЕГИ ({len(missing)} из {len(TAGS)}) ===')
report.append(', '.join(missing) if missing else 'все 97 тегов присутствуют')

text = '\n'.join(report)
print(text)
with open(REPORT, 'w', encoding='utf-8') as handle:
    handle.write(text + '\n')
print(f'\nСнимки: {OUT_DIR}')
print(f'Отчёт: {REPORT}')
