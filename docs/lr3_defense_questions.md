# ЛР3 — ответы на вопросы к защите (по списку)

Ниже — ответы на вопросы из списка: «Анимация при скроллинге…», «Изменение delay…», «Где сохраняешь тему…», «Добавление сотрудника…», «Сортировка…», «Премирование…», `innerHTML`, `shift/pop`, задания 4, получение элементов, пагинация, параллакс, прототипы/классы, внешние API. Ссылки — `файл:строка` в текущем проекте.

---

### 1. Анимация при скроллинге. Как реализовал, какое событие обрабатывал?

Событие — **`scroll`** на `window`:

```js
window.addEventListener('scroll', this.onScroll, { passive: true });
```

Это `scroll-animation.js:32`. Внутри `onScroll` (`:53`) через `requestAnimationFrame` вызывается `update()` (`:63`). В `update()`:

```js
var rect = this.root.getBoundingClientRect();
var rawProgress = (viewportHeight - rect.top) / (viewportHeight + rect.height);
```

`progress` ограничивается `0..1`; для каждой бутылки считаются `translate3d`, `rotate`, `scale` и `opacity` (`:70–82`). При прокрутке вверх `rect.top` увеличивается, прогресс уменьшается — анимация идёт в обратном направлении. Дополнительно есть `IntersectionObserver` (`:38`) для плавного появления сцены и CSS-пульс `+`.

Показать: главная → «Анимация при скроллинге: лекарства аптеки»; прокрутить вниз/вверх.

---

### 2. Изменение delay для slider в коде. Как проверить, что это может делать только админ?

- Владелец видит форму на главной: `home.html:85–105`.
- Форма отправляет POST на `/slider/settings/`; URL — `urls.py:20`.
- View `slider_settings_view` (`views.py:212`) первой строкой проверяет роль:

```python
if get_user_role(request.user) != Role.OWNER:
    return HttpResponseForbidden('Только владелец может менять настройки слайдера.')
```

- Только после этого вызывается `save_slider_settings` (`slider_settings.py:48`), задержка нормализуется `1..60` (`:26`) и кладётся в сессию.
- Шаблон получает значение из `HomeView` (`views.py:92`), печатает его в `data-slider-options` (`home.html:41`), JS читает `delay` в `slider.js:26` и использует в `setInterval` (`:192`).

Проверка: зайти гостем → формы нет; отправить POST напрямую (например, из консоли/Postman) → `403 Forbidden`. Зайти владельцем → форма есть, значение меняется, слайдер ускоряется/замедляется.

---

### 3. Где сохраняешь тему (светлую/тёмную), чтобы при обновлении не менялась? Где описаны стили?

- Сохранение: `localStorage`, ключ `pharmacy_theme` — `core.js:112`; чтение — `:82`.
- Чтобы не было вспышки светлой темы до загрузки JS, ранний inline-скрипт в `<head>` (`base.html:17–30`) ставит `data-theme="dark"` на `<html>` **до** подключения CSS.
- Переключение кнопки — `core.js:103` (`initTheme`), применение — `:88` (`applyTheme`).
- Стили — `style.css:2427+`: `html[data-theme="dark"]` переопределяет CSS-переменные (`--bg`, `--card`, `--ink`, ...), а затем отдельные компоненты (header, main, aside, таблицы, карточки, slider, JS-лаборатория).
- Все страницы наследуют `base.html`, поэтому кнопка и тема есть везде.

---

### 4. Добавление сотрудника

1. Кнопка «Добавить сотрудника» — `contact_list.html:35`.
2. Открытие формы — `ContactsTable.toggleAddForm` (`contacts.js:531`).
3. Пока не заполнены обязательные `[required]`, кнопка `disabled`; пересчёт — `updateSubmitState` (`contacts.js:558`).
4. Submit → `addContactFromForm` (`contacts.js:629`):
   - `new FormData(this.addForm)`;
   - `isValidPhone`, `isValidUrl`, `emailInput.checkValidity()`;
   - при ошибке `markField` добавляет `.invalid-field` и выводит текст в `#contact-form-status`;
   - при успехе создаётся объект, пушится в `this.rows`, вызывается `applyFilter`/`render`;
   - вычисляется индекс нового элемента и открывается нужная страница (`contacts.js:699–703`).
5. Строка строится в `createRow` (`contacts.js:336`) через `document.createElement`, `appendChild`, `setAttribute`.

---

### 5. Сортировка сотрудников в коде и на странице. Как строки, как числа?

- На странице: кнопки в `thead` — `contact_list.html:84–103`; у них `data-sort="full_name|job_description|phone|email"`.
- Обработчик — `contacts.js:112–116`; метод `sortBy` (`:240`) переключает направление (второй клик — убывание).
- Сравнение — `compareRows` (`:253`):
  - для `phone`: `Number(String(value).replace(/\D/g, ''))`, то есть числа, а не строки;
  - для остальных: `localeCompare` с `{ numeric: true, sensitivity: 'base' }`.
- Индикатор ▲/▼ и `aria-sort` — `updateSortIndicators` (`:452`).

Если бы телефон сравнивали строками, `"909..."` оказался бы меньше `"101..."`; поэтому цифры приводятся к `Number`.

---

### 6. Где премирование, как реализовано?

Кнопка — `contact_list.html:117`, вывод — `:119`.
Метод `grantBonus` (`contacts.js:713`):

```js
var selectedRows = this.rows.filter(function (row) {
    return this.selectedIds.has(String(row.id));
});
var names = selectedRows.map(function (row) { return row.full_name; }).join(', ');
this.bonusOutput.textContent = 'Премирование сотрудников: ' + names + ...;
```

`selectedIds` — это `Set` ID (`contacts.js:85`), поэтому отмеченные на разных страницах сотрудники не теряются. Если ничего не отмечено — сообщение «Отметьте хотя бы одного…».

---

### 7. Что такое `innerHTML`?

`innerHTML` — свойство DOM-элемента, которое содержит HTML-разметку внутри него. Чтение возвращает строку, запись заменяет всех потомков.

В проекте:

- `container.innerHTML = ''` — быстрая очистка перед перерисовкой (`contacts.js:500`, `classes-demo.js:115`);
- новые элементы после очистки создаются через `document.createElement`/`appendChild`.

Важно: `innerHTML` с пользовательскими данными опасен (XSS), поэтому ФИО/телефон/почта выводятся через `textContent`. `textContent` не парсит HTML, а вставляет текст.

---

### 8. Как удалить элемент из начала массива и из конца (`shift`/`pop`)?

```js
var first = array.shift(); // удаляет и возвращает первый элемент, длина -1
var last = array.pop();    // удаляет и возвращает последний элемент, длина -1
```

`shift()` сдвигает все оставшиеся элементы (`O(n)`), `pop()` — `O(1)`.
В проекте для удаления сгенерированного поля используется `form.remove()` (это DOM, не массив), а конфигурация удаляется через `Array.prototype.filter` (`generated-fields.js`, обработчик «Удалить поле»). В контактах фильтрация — `this.rows.filter(...)` (`contacts.js:281`).

---

### 9. Задание 4: покажи, как работает удаление

Каждое сгенерированное поле — отдельная `<form class="generated-field" data-generated-id="...">`. В `createGeneratedField` (`generated-fields.js:259`) создаётся кнопка «Удалить поле». Её обработчик:

```js
configs = configs.filter(function (item) { return item.id !== config.id; });
persistConfigs();
form.remove();
```

То есть: убрать конфигурацию из массива → перезаписать `localStorage` → удалить DOM-узел. После F5 поле не вернётся, так как его больше нет в `pharmacy_generated_fields_v1`.

---

### 10. Задание 4: как отображается и добавляется элемент?

`createGeneratedField(config)` (`generated-fields.js:259`):

1. `document.createElement('form')`, `document.createElement('input')`;
2. `input.type = 'tel'`;
3. атрибуты задаются `input.setAttribute('name', ...)`, `setAttribute('placeholder', ...)`, `setAttribute('pattern', ...)`, `setAttribute('maxlength', ...)`, `input.required = true`;
4. добавляются кнопки «Проверить поле»/«Удалить поле» и `<output>`;
5. `generatedContainer.appendChild(form)` — **после этого элемент появляется на странице**.

Ответ на вопрос «что надо сделать после `createElement`, чтобы элемент появился?» — добавить его в документ: `appendChild`, `append`, `insertBefore`, `replaceChildren` и т.п. В нашем коде — `appendChild` (`generated-fields.js:358`).

---

### 11. Как можно получить элементы из HTML-документа?

- `document.getElementById('id')` — по id;
- `document.querySelector('.class')` — первый по CSS-селектору;
- `document.querySelectorAll('...')` — все (NodeList; в проекте часто `Array.prototype.slice.call(...)` для `forEach`);
- `element.closest('tr')` — ближайший предок по селектору;
- `form.elements` / `form.elements.namedItem('name')` — элементы формы;
- `new FormData(form)` — значения по `name`.

Примеры: `contacts.js:49–62`, `slider.js:30–36`, `classes-demo.js:93`.

---

### 12. Пагинация: как реализовал в коде. Каталог: как выбор количества элементов?

**Контакты** — `ContactsTable` (`contacts.js:45`): `perPage = 3` (`:67`), `totalPages` (`:299`), `currentPageRows` (`:303`), `renderPagination` (`:408`). Кнопки создаются в JS, текущая получает `aria-current="page"`. Сортировка/фильтр применяются до нарезки страницы.

**Каталог** — `CatalogPaginator` (`catalog.js:12`):

- `this.perPage` читается из `<select id="catalog-page-size">` (`:20`), по умолчанию 3;
- `change` на select (`:36`) меняет `perPage`, сбрасывает на 1-ю страницу;
- `render` (`:49`) скрывает карточки/строки через `hidden` по индексам;
- `renderPagination` (`:73`) строит кнопки;
- сервер отдаёт полный отфильтрованный список (`views.py:295`, `paginate_by = None`), поэтому клиент может paginate всё.

---

### 13. Покажи, как реализовал параллакс

`TiltCard` (`catalog.js:124`). На `mousemove` (`:141`) координаты мыши переводятся в проценты:

```js
var x = (event.clientX - rect.left) / rect.width;
var y = (event.clientY - rect.top) / rect.height;
var rotateX = (0.5 - y) * 10;
var rotateY = (x - 0.5) * 12;
```

Затем записываются CSS-переменные (`:171–174`): `--tilt-x`, `--tilt-y`, `--shift-x`, `--shift-y`. CSS (`style.css:2950+`) применяет `transform: rotateX(...) rotateY(...)` к `.product-card__inner` и `translate3d(var(--shift-x), var(--shift-y), 35px)` к изображению. При `mouseleave` переменные сбрасываются в 0. `requestAnimationFrame` не даёт обрабатывать больше одного события за кадр.

---

### 14. Покажи, как создаёшь объект класса в стиле прототипного наследования

```js
var client = new PrototypeBankClient('Иванов Иван', 'BY-1001', 1500);
var vip = new PrototypeVipBankClient('Морозов Олег', 'BY-5001', 7000, 'Орлова Н. Н.');
```

Конструктор — `classes-demo.js:64`; создание VIP — `:185`. В форме объект создаётся в `PrototypeBankClient.prototype.addFromForm` (`:92`): читаются `FormData`, затем `new PrototypeBankClient(...)` или `new PrototypeVipBankClient(...)`, и `this.items.push(client)`.

---

### 15. Где наследуешься с помощью прототипа?

`classes-demo.js:185–195`:

```js
function PrototypeVipBankClient(fullName, accountNumber, amount, manager) {
    PrototypeBankClient.call(this, fullName, accountNumber, amount);
    this._manager = manager || '—';
}
PrototypeVipBankClient.prototype = Object.create(PrototypeBankClient.prototype);
PrototypeVipBankClient.prototype.constructor = PrototypeVipBankClient;
```

`Object.create` создаёт новый объект с прототипом базового класса; `constructor` возвращается, чтобы `instanceof`/отладка были корректны. Геттеры/сеттеры менеджера — `:191–196`. Классовый аналог — `class ClassVipBankClient extends ClassBankClient` (`:326`) с `super(...)`.

---

### 16. Покажи, где у тебя внешняя API. «У тебя всего лишь одна API? Только батарея?»

Три независимых браузерных API в `browser-apis.js`:

1. **Battery Status API** — `:24`, `navigator.getBattery()`, события `levelchange`/`chargingchange`; если API нет (Firefox), выводится сообщение.
2. **Geolocation API** — `:73`, `navigator.geolocation.getCurrentPosition(...)`, показ координат и ссылки на OpenStreetMap.
3. **Speech Synthesis API** — `:120`, `speechSynthesis.getVoices()`, `new SpeechSynthesisUtterance(text)`, `speak()`/`cancel()`.

Дополнительно в Django-проекте есть серверные интеграции (OpenWeatherMap, курсы валют) из предыдущих лабораторных; на защите ЛР3 показывать нужно именно браузерные API в `/js-lab/`.

---

## Быстрые ответы на «убийственные» вопросы

- **Что надо сделать после `createElement`?** Добавить в документ: `parent.appendChild(element)` (или `append`, `insertBefore`). Иначе элемент существует только в памяти.
- **Где добавляются атрибуты?** `element.setAttribute('name', 'value')`, либо свойства (`input.required = true`, `input.type = 'tel'`). В контактах — `createRow` (`contacts.js:336–385`), в задании 4 — `createGeneratedField` (`generated-fields.js:270–290`).
- **Где элемент удаляется?** `element.remove()` (задание 4), `form.remove()`; для массива — `filter`/`splice`/`shift`/`pop`.
- **Где обновляется таблица после добавления?** `addContactFromForm` → `applyFilter` → `render` (`contacts.js:629/281/308`).
- **`eventListener` — что это?** `element.addEventListener('click', handler)` подписывает элемент на событие; внутри `handler` доступен объект `event` (`event.target`, `event.preventDefault()`). В проекте — почти каждый файл.
- **`trim()`** — удаляет пробелы по краям строки, используется при валидации (`contacts.js:37/41`).
