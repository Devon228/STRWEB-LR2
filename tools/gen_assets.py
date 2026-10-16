"""Генерация статических ассетов проекта аптеки «Здоровье+» (ЛР2).

Запуск:
    venv/bin/python tools/gen_assets.py

Скрипт создаёт/обновляет:
    pharmacy/static/pharmacy/img/logo.svg, favicon.svg
    pharmacy/static/pharmacy/img/cert-border.png  (рамка для border-image)
    pharmacy/static/pharmacy/img/paper.png        (текстура фона)
    pharmacy/static/pharmacy/docs/certificate.pdf, privacy.pdf
    pharmacy/static/pharmacy/docs/subtitles.vtt, tone.wav
"""

import math
import random
import struct
import wave
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

BASE = Path(__file__).resolve().parent.parent / 'pharmacy' / 'static' / 'pharmacy'
IMG = BASE / 'img'
DOCS = BASE / 'docs'
DOCS.mkdir(parents=True, exist_ok=True)
IMG.mkdir(parents=True, exist_ok=True)

LOGO = '''<svg xmlns="http://www.w3.org/2000/svg" width="240" height="80" viewBox="0 0 240 80" role="img" aria-label="Аптека Здоровье+">
  <title>Аптека «Здоровье+»</title>
  <rect x="8" y="8" width="64" height="64" rx="10" fill="#1d4ed8"/>
  <rect x="32" y="18" width="16" height="44" fill="#ffffff"/>
  <rect x="18" y="32" width="44" height="16" fill="#ffffff"/>
  <text x="84" y="36" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="#1d4ed8">Здоровье+</text>
  <text x="84" y="58" font-family="Arial, sans-serif" font-size="13" fill="#333333">сеть аптек</text>
</svg>
'''

FAVICON = '''<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
  <rect x="1" y="1" width="30" height="30" rx="6" fill="#1d4ed8"/>
  <rect x="13" y="6" width="6" height="20" fill="#ffffff"/>
  <rect x="6" y="13" width="20" height="6" fill="#ffffff"/>
</svg>
'''

VTT = '''WEBVTT

00:00:00.000 --> 00:00:04.000
Аптека «Здоровье+» — забота о вашем здоровье с 2010 года.

00:00:04.000 --> 00:00:08.000
Более 12 филиалов в Минске, онлайн-заказ и самовывоз.

00:00:08.000 --> 00:00:12.000
Лицензия и сертификат соответствия — документы открыты.
'''

BOLD = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
REG = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'

BLUE = (29, 78, 216)
RED = (185, 28, 28)
DARK = (33, 37, 41)
GRAY = (90, 96, 105)
GOLD = (212, 175, 55)


def wrapped(draw, text, font, max_width):
    words = text.split()
    lines, current = [], ''
    for word in words:
        candidate = (current + ' ' + word).strip()
        if draw.textlength(candidate, font=font) <= max_width:
            current = candidate
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines


def certificate(path):
    w, h = 1240, 1754
    img = Image.new('RGB', (w, h), 'white')
    d = ImageDraw.Draw(img)
    d.rectangle([28, 28, w - 28, h - 28], outline=BLUE, width=6)
    d.rectangle([46, 46, w - 46, h - 46], outline=RED, width=2)
    f_small = ImageFont.truetype(REG, 22)
    f_text = ImageFont.truetype(REG, 30)
    f_title = ImageFont.truetype(BOLD, 56)
    f_big = ImageFont.truetype(BOLD, 72)
    f_name = ImageFont.truetype(BOLD, 34)
    cx = w // 2
    d.text((cx, 120), 'СЕРТИФИКАТ', font=f_title, fill=RED, anchor='mm')
    d.text((cx, 185), 'о членстве в ассоциации аптек «Здоровье+»', font=f_text, fill=DARK, anchor='mm')
    d.line([200, 225, w - 200, 225], fill=BLUE, width=2)
    d.text((cx, 330), 'СВИДЕТЕЛЬСТВО', font=f_big, fill=BLUE, anchor='mm')
    d.text((cx, 400), 'о внесении сведений в единый реестр аптечных организаций', font=f_small, fill=GRAY, anchor='mm')
    d.text((cx, 540), 'Общество с ограниченной ответственностью', font=f_text, fill=DARK, anchor='mm')
    d.text((cx, 595), '«Аптека Здоровье+»', font=f_name, fill=RED, anchor='mm')
    d.text((cx, 650), '(УНП 123456789, г. Минск, пр-т Независимости, 1)', font=f_small, fill=DARK, anchor='mm')
    d.text((cx, 710), 'Реестровый номер: 8241', font=f_name, fill=RED, anchor='mm')
    d.text((120, 900), 'г. Минск', font=f_small, fill=DARK)
    d.text((w - 120, 900), '15 сентября 2026 г.', font=f_small, fill=DARK, anchor='ra')
    d.line([120, 1380, 480, 1380], fill=DARK, width=1)
    d.text((120, 1395), 'Тарасевич А. П.', font=f_text, fill=DARK)
    d.text((120, 1435), 'Директор ассоциации «Здоровье+»', font=f_small, fill=GRAY)
    d.text((cx, 1560), 'Документ сгенерирован для учебного проекта', font=f_small, fill=GRAY, anchor='mm')
    d.text((cx, 1600), 'тел.: +375 (17) 200-00-00, e-mail: info@zdorovie-plus.by', font=f_small, fill=GRAY, anchor='mm')
    img.save(path, 'PDF', resolution=150)


def privacy(path):
    w, h = 1240, 1754
    img = Image.new('RGB', (w, h), 'white')
    d = ImageDraw.Draw(img)
    d.rectangle([28, 28, w - 28, h - 28], outline=BLUE, width=4)
    f_title = ImageFont.truetype(BOLD, 44)
    f_text = ImageFont.truetype(REG, 26)
    f_line = ImageFont.truetype(REG, 22)
    d.text((w // 2, 110), 'Политика конфиденциальности', font=f_title, fill=BLUE, anchor='mm')
    d.text((w // 2, 165), 'аптеки «Здоровье+»', font=f_text, fill=DARK, anchor='mm')
    d.line([100, 200, w - 100, 200], fill=RED, width=2)
    paragraphs = [
        '1. Оператор персональных данных — ООО «Аптека Здоровье+», г. Минск, пр-т Независимости, 1.',
        '2. Сайт обрабатывает: имя, логин, телефон, e-mail, дату рождения, историю заказов и отзывов.',
        '3. Данные используются для оформления заказов, самовывоза, обратной связи и статистики.',
        '4. Cookie и localStorage применяются для часового пояса и локальной корзины без передачи на сервер.',
        '5. Персональные данные не передаются третьим лицам, кроме случаев, предусмотренных законом.',
        '6. Пользователь вправе запросить изменение или удаление своих данных по адресу info@zdorovie-plus.by.',
        '7. Срок хранения данных — не более 3 лет с момента последнего обращения к сервису.',
        '8. Политика может обновляться; новая редакция публикуется на этой странице.',
    ]
    y = 270
    for paragraph in paragraphs:
        for line in wrapped(d, paragraph, f_text, w - 220):
            d.text((110, y), line, font=f_text, fill=DARK)
            y += 42
        y += 18
    d.text((w // 2, 1620), 'Редакция от 15.09.2026', font=f_line, fill=GRAY, anchor='mm')
    img.save(path, 'PDF', resolution=150)


def tone(path, seconds=2.0, rate=22050, freq=440.0, volume=0.3):
    frames = bytearray()
    total = int(rate * seconds)
    for i in range(total):
        value = int(volume * 32767 * math.sin(2 * math.pi * freq * i / rate))
        frames += struct.pack('<h', value)
    with wave.open(str(path), 'wb') as f:
        f.setnchannels(1)
        f.setsampwidth(2)
        f.setframerate(rate)
        f.writeframes(bytes(frames))


def cert_border(path, size=240, band=44):
    """Декоративная рамка для CSS-свойства border-image.

    Рисуем орнамент по периметру квадрата: внешняя золотая полоса,
    внутренняя синяя линия, ромбы по углам и «таблетки» по сторонам.
    При border-image с slice=band средняя часть изображения не используется,
    поэтому важны только края.
    """
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    # внешняя и внутренняя линии рамки
    d.rectangle([0, 0, size - 1, size - 1], outline=GOLD, width=6)
    d.rectangle([band - 10, band - 10, size - band + 9, size - band + 9], outline=BLUE, width=3)
    # ромбы в углах
    for cx, cy in (
        (band // 2, band // 2),
        (size - band // 2, band // 2),
        (band // 2, size - band // 2),
        (size - band // 2, size - band // 2),
    ):
        d.polygon(
            [(cx, cy - 14), (cx + 14, cy), (cx, cy + 14), (cx - 14, cy)],
            fill=RED,
            outline=GOLD,
        )
    # «пилюли» по сторонам (чередование вдоль каждой стороны)
    pill_w, pill_h = 34, 16
    for i in range(band // 2, size - band // 2, pill_w + 10):
        d.rounded_rectangle(
            [i, band // 2 - pill_h // 2, i + pill_w, band // 2 + pill_h // 2],
            radius=pill_h // 2,
            fill=BLUE,
            outline=GOLD,
            width=2,
        )
        d.rounded_rectangle(
            [i, size - band // 2 - pill_h // 2, i + pill_w, size - band // 2 + pill_h // 2],
            radius=pill_h // 2,
            fill=RED,
            outline=GOLD,
            width=2,
        )
    for i in range(band // 2, size - band // 2, pill_w + 10):
        d.rounded_rectangle(
            [band // 2 - pill_h // 2, i, band // 2 + pill_h // 2, i + pill_w],
            radius=pill_h // 2,
            fill=RED,
            outline=GOLD,
            width=2,
        )
        d.rounded_rectangle(
            [size - band // 2 - pill_h // 2, i, size - band // 2 + pill_h // 2, i + pill_w],
            radius=pill_h // 2,
            fill=BLUE,
            outline=GOLD,
            width=2,
        )
    img.save(path, 'PNG')


def paper(path, size=180, seed=2026):
    """Полупрозрачная текстура «бумаги» для фона body и сертификата."""
    rnd = random.Random(seed)
    img = Image.new('RGBA', (size, size), (255, 255, 255, 0))
    d = ImageDraw.Draw(img)
    for _ in range(260):
        x, y = rnd.randrange(size), rnd.randrange(size)
        length = rnd.randrange(2, 9)
        shade = rnd.choice([(29, 78, 216, 10), (212, 175, 55, 14), (33, 37, 41, 8)])
        d.line([x, y, x + length, y + rnd.choice([-1, 0, 1])], fill=shade, width=1)
    for _ in range(120):
        x, y = rnd.randrange(size), rnd.randrange(size)
        d.point((x, y), fill=(33, 37, 41, 16))
    img.save(path, 'PNG')


(IMG / 'logo.svg').write_text(LOGO, encoding='utf-8')
(IMG / 'favicon.svg').write_text(FAVICON, encoding='utf-8')
(DOCS / 'subtitles.vtt').write_text(VTT, encoding='utf-8')

certificate(DOCS / 'certificate.pdf')
privacy(DOCS / 'privacy.pdf')
tone(DOCS / 'tone.wav')
cert_border(IMG / 'cert-border.png')
paper(IMG / 'paper.png')

print('assets generated')
for p in sorted(BASE.rglob('*')):
    if p.is_file():
        print(p.relative_to(BASE), p.stat().st_size)
