"""Чек-лист требований ЛР2 по единому файлу стилей.

Запуск:
    venv/bin/python tools/check_css_features.py

Скрипт проверяет, что в pharmacy/static/pharmacy/css/style.css присутствуют
все обязательные по заданию ЛР2 подходы (селекторы, псевдоклассы, псевдоэлементы,
шрифты, media-запросы, Grid/Flexbox, float/clear, position, таблицы, анимации,
градиенты, вендорные префиксы и т.д.), и печатает номера строк.
Возвращает код 1, если чего-то не хватает.
"""

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CSS = ROOT / 'pharmacy' / 'static' / 'pharmacy' / 'css' / 'style.css'
BASE = ROOT / 'pharmacy' / 'templates' / 'pharmacy' / 'base.html'
TEMPLATES = ROOT / 'pharmacy' / 'templates'

FEATURES = [
    ('Селекторы', 'селектор элемента', r'(?m)^body\s*\{'),
    ('Селекторы', 'селектор класса', r'\.site-nav'),
    ('Селекторы', 'атрибут: точное значение', r'\[type="email"\]'),
    ('Селекторы', 'атрибут: начинается с подстроки', r'\[href\^='),
    ('Селекторы', 'атрибут: заканчивается подстрокой', r'\[href\$='),
    ('Селекторы', 'атрибут: содержит подстроку', r'\[href\*='),
    ('Селекторы', 'комбинация AND (класс + атрибут)', r'a\.read-more\[href\]'),
    ('Селекторы', 'селектор потомка', r'\.site-nav a\s*\{'),
    ('Селекторы', 'селектор дочернего элемента', r'article\s*>\s*h3'),
    ('Селекторы', 'смежные селекторы', r'label\s*\+\s*input'),
    ('Псевдоклассы', ':link', r':link'),
    ('Псевдоклассы', ':visited', r':visited'),
    ('Псевдоклассы', ':hover', r':hover'),
    ('Псевдоклассы', ':active', r':active'),
    ('Псевдоклассы', ':focus', r':focus'),
    ('Псевдоклассы', ':focus-visible', r':focus-visible'),
    ('Псевдоклассы', ':first-child', r':first-child'),
    ('Псевдоклассы', ':last-child', r':last-child'),
    ('Псевдоклассы', ':nth-child', r':nth-child'),
    ('Псевдоклассы', ':enabled', r':enabled'),
    ('Псевдоклассы', ':disabled', r':disabled'),
    ('Псевдоклассы', ':required', r':required'),
    ('Псевдоклассы', ':optional', r':optional'),
    ('Псевдоклассы', ':checked', r':checked'),
    ('Псевдоклассы', ':out-of-range', r':out-of-range'),
    ('Псевдоклассы', ':in-range', r':in-range'),
    ('Псевдоклассы', ':valid', r':valid'),
    ('Псевдоклассы', ':invalid', r':invalid'),
    ('Псевдоклассы', ':placeholder-shown', r':placeholder-shown'),
    ('Псевдоклассы', 'кавычки :lang(en)', r':lang\(en\)'),
    ('Псевдоклассы', 'кавычки :lang(ru)', r':lang\(ru\)'),
    ('Псевдоклассы', ':empty (пустые ячейки)', r':empty'),
    ('Псевдоклассы', ':not', r':not\('),
    ('Псевдоклассы', 'атрибут hidden', r'\[hidden\]'),
    ('Псевдоэлементы', '::first-letter', r'::first-letter'),
    ('Псевдоэлементы', '::first-line', r'::first-line'),
    ('Псевдоэлементы', '::before', r'::before'),
    ('Псевдоэлементы', '::after', r'::after'),
    ('Псевдоэлементы', '::selection', r'::selection'),
    ('Псевдоэлементы', '::marker (юникод-маркеры)', r'::marker'),
    ('Псевдоэлементы', '::placeholder', r'::placeholder'),
    ('Шрифты', 'шрифт из службы (Montserrat)', r'Montserrat'),
    ('Шрифты', 'альтернативный шрифт (Roboto)', r'Roboto'),
    ('Шрифты', 'семейство sans-serif', r'sans-serif'),
    ('Шрифты', 'капитель font-variant: small-caps', r'font-variant:\s*small-caps'),
    ('Шрифты', 'font: caption', r'font:\s*caption'),
    ('Шрифты', 'font: menu', r'font:\s*menu'),
    ('Шрифты', 'font: button', r'font:\s*button'),
    ('Шрифты', 'font: small-caption', r'font:\s*small-caption'),
    ('Текст', 'text-transform: uppercase', r'text-transform:\s*uppercase'),
    ('Текст', 'text-transform: capitalize', r'text-transform:\s*capitalize'),
    ('Текст', 'красная строка text-indent', r'text-indent'),
    ('Текст', 'line-height', r'line-height'),
    ('Текст', 'word-spacing', r'word-spacing'),
    ('Текст', 'letter-spacing (кернинг)', r'letter-spacing'),
    ('Текст', 'перенос слов hyphens: auto', r'hyphens:\s*auto'),
    ('Текст', 'overflow-wrap', r'overflow-wrap'),
    ('Текст', 'выравнивание text-align', r'text-align'),
    ('Раскладка', 'CSS Grid', r'display:\s*grid'),
    ('Раскладка', 'grid-template-columns', r'grid-template-columns'),
    ('Раскладка', 'Flexbox', r'display:\s*flex'),
    ('Раскладка', 'flex-wrap', r'flex-wrap'),
    ('Раскладка', 'flex: grow/shrink/basis', r'flex:\s*\d'),
    ('Раскладка', 'float: left', r'float:\s*left'),
    ('Раскладка', 'clear: both', r'clear:\s*both'),
    ('Позиционирование', 'position: relative', r'position:\s*relative'),
    ('Позиционирование', 'position: absolute', r'position:\s*absolute'),
    ('Позиционирование', 'position: fixed', r'position:\s*fixed'),
    ('Позиционирование', 'position: sticky (навигация)', r'position:\s*sticky'),
    ('Позиционирование', 'z-index (слои сертификата)', r'z-index'),
    ('Overflow', 'overflow: hidden', r'overflow:\s*hidden'),
    ('Overflow', 'text-overflow: ellipsis', r'text-overflow:\s*ellipsis'),
    ('Overflow', 'многострочное многоточие', r'-webkit-line-clamp'),
    ('Многоколоночность', 'column-count', r'column-count'),
    ('Многоколоночность', 'column-rule', r'column-rule'),
    ('Таблицы', 'border-collapse: collapse', r'border-collapse:\s*collapse'),
    ('Таблицы', 'border-spacing', r'border-spacing'),
    ('Таблицы', 'empty-cells', r'empty-cells'),
    ('Таблицы', 'caption-side: top', r'caption-side:\s*top'),
    ('Таблицы', 'vertical-align', r'vertical-align'),
    ('Таблицы', 'фон пустых ячеек td:empty', r'td:empty'),
    ('Оформление', 'border-radius (скругление)', r'border-radius'),
    ('Оформление', 'box-shadow', r'box-shadow'),
    ('Оформление', 'cursor: pointer', r'cursor:\s*pointer'),
    ('Оформление', 'cursor: not-allowed', r'cursor:\s*not-allowed'),
    ('Оформление', 'visibility', r'visibility:\s*(hidden|visible)'),
    ('Оформление', 'opacity', r'opacity:'),
    ('Оформление', 'list-style', r'list-style'),
    ('Оформление', 'accent-color', r'accent-color'),
    ('Оформление', 'object-fit', r'object-fit'),
    ('Оформление', 'юникод-маркер \\2716', r'\\2716'),
    ('Оформление', 'юникод-маркер \\1F48A', r'\\1F48A'),
    ('Анимация', 'transition', r'transition:'),
    ('Анимация', 'animation', r'animation:'),
    ('Анимация', '@keyframes', r'@keyframes'),
    ('Анимация', 'бесконечная анимация infinite', r'infinite'),
    ('Анимация', 'кривая Безье cubic-bezier', r'cubic-bezier'),
    ('Анимация', 'transform', r'transform:'),
    ('Анимация', '3D: perspective', r'perspective'),
    ('Анимация', '3D: rotateY', r'rotateY'),
    ('Анимация', '3D: rotate3d', r'rotate3d'),
    ('Анимация', 'прелоадер .preloader', r'\.preloader'),
    ('Анимация', 'вращающаяся пилюля pill-spin', r'pill-spin'),
    ('Анимация', 'сцена .scene__stage', r'\.scene__stage'),
    ('Фон', 'linear-gradient', r'linear-gradient'),
    ('Фон', 'radial-gradient', r'radial-gradient'),
    ('Фон', 'conic-gradient', r'conic-gradient'),
    ('Фон', 'background-attachment: fixed', r'background-attachment:\s*fixed'),
    ('Фон', 'border-image (рамка сертификата)', r'border-image:'),
    ('Вендорные префиксы', '-webkit-', r'-webkit-'),
    ('Вендорные префиксы', '-moz-', r'-moz-'),
    ('Вендорные префиксы', '-ms-', r'-ms-'),
    ('Вендорные префиксы', '-o-', r'-o-'),
    ('Медиа-запросы', 'max-width', r'@media[^{]*max-width'),
    ('Медиа-запросы', 'min-width', r'@media[^{]*min-width'),
    ('Медиа-запросы', 'max-height', r'@media[^{]*max-height'),
    ('Медиа-запросы', 'orientation', r'@media[^{]*orientation'),
    ('Медиа-запросы', 'prefers-reduced-motion', r'prefers-reduced-motion'),
    ('Медиа-запросы', 'hover: none', r'hover:\s*none'),
]

FILE_CHECKS = [
    ('HTML', 'base.html подключает единый style.css', BASE, r'pharmacy/css/style\.css'),
    ('HTML', 'base.html подключает Google Fonts', BASE, r'fonts\.googleapis\.com'),
    ('HTML', 'пустой тег <style> сохранён (чек-лист ЛР1)', BASE, r'<style></style>'),
]


def first_line(pattern, text):
    match = re.search(pattern, text)
    if not match:
        return None
    return text[:match.start()].count('\n') + 1


def main():
    css = CSS.read_text(encoding='utf-8')
    base = BASE.read_text(encoding='utf-8')
    failures = []

    current_group = None
    for group, name, pattern in FEATURES:
        if group != current_group:
            print(f'\n--- {group} ---')
            current_group = group
        line = first_line(pattern, css)
        if line is None:
            failures.append(f'{group}: {name}')
            print(f'  FAIL  {name}')
        else:
            print(f'  OK    {name:44s} style.css:{line}')

    print('\n--- Файлы ---')
    for group, name, path, pattern in FILE_CHECKS:
        text = path.read_text(encoding='utf-8')
        line = first_line(pattern, text)
        if line is None:
            failures.append(f'{group}: {name}')
            print(f'  FAIL  {name}')
        else:
            print(f'  OK    {name:44s} {path.name}:{line}')

    print('\n--- Запрещённое ---')
    for path in TEMPLATES.rglob('*.html'):
        text = path.read_text(encoding='utf-8')
        if 'style="' in text:
            failures.append(f'{path}: inline style')
            print(f'  FAIL  inline style в {path.relative_to(ROOT)}')
        if 'bootstrap' in text.lower():
            failures.append(f'{path}: bootstrap')
            print(f'  FAIL  Bootstrap в {path.relative_to(ROOT)}')
    if not failures:
        print('  OK    inline-стилей и Bootstrap нет')

    print()
    if failures:
        print(f'НЕ ВЫПОЛНЕНО ({len(failures)}):')
        for item in failures:
            print(f'  - {item}')
        return 1
    print(f'Все проверки ЛР2 пройдены: {len(FEATURES) + len(FILE_CHECKS)} пунктов.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
