/*
 * LR3 task 3 — contacts table.
 *
 * Features:
 *   - initial data is loaded from the server JSON endpoint;
 *   - sorting by any column (click → ascending, click again → descending);
 *   - client-side pagination, 3 rows per page;
 *   - filtering by substring using the "Найти" button;
 *   - clicking a row prints all fields in the details block;
 *   - add form with URL/phone validation, red/pink invalid state;
 *   - checkboxes persist via localStorage (Set of IDs);
 *   - bonus text for selected employees;
 *   - the LR2 preloader is shown for operations.
 *
 * DOM construction intentionally uses createElement/appendChild and
 * setAttribute (not only innerHTML) so the "how elements are added" question
 * at the defence can be answered directly from this file.
 */
(function () {
    'use strict';

    var SELECTION_KEY = 'pharmacy_contact_selection_v1';
    var PHONE_PATTERN = /^(?:\+375|8)\s*\(?0?\d{2}\)?[\s-]*\d{3}[\s-]?\d{2}[\s-]?\d{2}$/;
    var URL_PATTERN = /^https?:\/\/[^\s]+\.(?:php|html)$/i;

    function normaliseId(value) {
        return String(value);
    }

    function buildAvatarUrl(name) {
        return 'https://ui-avatars.com/api/?name=' +
            encodeURIComponent(name || 'Сотрудник') +
            '&size=150&background=1d4ed8&color=ffffff&bold=true';
    }

    function isValidPhone(value) {
        return PHONE_PATTERN.test(String(value).trim());
    }

    function isValidUrl(value) {
        // Lab criteria: starts with http:// or https:// and ends with .php/.html
        return URL_PATTERN.test(String(value).trim());
    }

    class ContactsTable {
        constructor(root) {
            this.root = root;
            this.apiUrl = root.getAttribute('data-api-url') || '/contacts/api/';
            this.tbody = document.getElementById('contact-table-body');
            this.pagination = document.getElementById('contacts-pagination');
            this.searchForm = document.getElementById('contact-search-form');
            this.searchInput = document.getElementById('contact-search');
            this.sortButtons = Array.prototype.slice.call(root.querySelectorAll('[data-sort]'));
            this.details = document.getElementById('contact-details');
            this.bonusButton = document.getElementById('contact-bonus-button');
            this.bonusOutput = document.getElementById('contact-bonus-output');
            this.selectAll = document.getElementById('contact-select-all');
            this.addToggle = document.getElementById('contact-add-toggle');
            this.addForm = document.getElementById('contact-add-form');
            this.addSubmit = document.getElementById('contact-add-submit');
            this.formStatus = document.getElementById('contact-form-status');
            this.photoInput = document.getElementById('contact-photo');

            this.rows = [];
            this.filteredRows = [];
            this.page = 1;
            this.perPage = 3;
            this.sortKey = 'full_name';
            this.sortDirection = 1;
            this.query = '';
            this.pendingPhoto = '';
            this.localCounter = 0;
            this.selectedIds = this.loadSelection();
        }

        async init() {
            if (!this.tbody) {
                return;
            }
            this.bindEvents();
            this.updateSubmitState();
            await this.loadRows();
        }

        loadSelection() {
            // Set is used deliberately: checking the same id twice must not
            // create duplicates. The array is persisted as JSON.
            var selection = new Set();
            try {
                var raw = localStorage.getItem(SELECTION_KEY);
                var parsed = raw ? JSON.parse(raw) : [];
                if (Array.isArray(parsed)) {
                    parsed.forEach(function (id) {
                        selection.add(normaliseId(id));
                    });
                }
            } catch (error) {
                /* Corrupted storage is treated as an empty selection. */
            }
            return selection;
        }

        saveSelection() {
            try {
                localStorage.setItem(SELECTION_KEY, JSON.stringify(Array.from(this.selectedIds)));
            } catch (error) {
                /* The app still works without persistence. */
            }
        }

        bindEvents() {
            this.sortButtons.forEach((button) => {
                button.addEventListener('click', () => {
                    this.sortBy(button.getAttribute('data-sort'));
                });
            });

            this.searchForm.addEventListener('submit', (event) => {
                event.preventDefault();
                if (window.PharmacyUI) {
                    window.PharmacyUI.withPreloader(() => this.setQuery(this.searchInput.value), 200);
                } else {
                    this.setQuery(this.searchInput.value);
                }
            });

            var resetButton = document.getElementById('contact-search-reset');
            if (resetButton) {
                resetButton.addEventListener('click', () => {
                    this.searchInput.value = '';
                    if (window.PharmacyUI) {
                        window.PharmacyUI.withPreloader(() => this.setQuery(''), 200);
                    } else {
                        this.setQuery('');
                    }
                });
            }

            if (this.selectAll) {
                this.selectAll.addEventListener('change', () => {
                    var pageRows = this.currentPageRows();
                    pageRows.forEach((row) => {
                        if (this.selectAll.checked) {
                            this.selectedIds.add(normaliseId(row.id));
                        } else {
                            this.selectedIds.delete(normaliseId(row.id));
                        }
                    });
                    this.saveSelection();
                    this.render();
                });
            }

            if (this.bonusButton) {
                this.bonusButton.addEventListener('click', () => this.grantBonus());
            }

            if (this.addToggle) {
                this.addToggle.addEventListener('click', () => this.toggleAddForm());
            }

            if (this.addForm) {
                this.addForm.addEventListener('input', () => {
                    this.updateSubmitState();
                    this.validateLiveFields();
                });
                this.addForm.addEventListener('change', () => {
                    this.updateSubmitState();
                    this.validateLiveFields();
                });
                this.addForm.addEventListener('submit', (event) => {
                    event.preventDefault();
                    this.addContactFromForm();
                });
            }

            var cancelButton = document.getElementById('contact-add-cancel');
            if (cancelButton) {
                cancelButton.addEventListener('click', () => this.closeAddForm());
            }

            if (this.photoInput) {
                this.photoInput.addEventListener('change', () => {
                    var file = this.photoInput.files && this.photoInput.files[0];
                    if (!file) {
                        this.pendingPhoto = '';
                        return;
                    }
                    if (!file.type.startsWith('image/')) {
                        this.showFormMessage('Выберите файл изображения.', true);
                        this.photoInput.value = '';
                        this.pendingPhoto = '';
                        return;
                    }
                    var reader = new FileReader();
                    reader.addEventListener('load', () => {
                        this.pendingPhoto = String(reader.result || '');
                    });
                    reader.readAsDataURL(file);
                });
            }
        }

        async loadRows() {
            if (window.PharmacyUI) {
                window.PharmacyUI.showPreloader('Загрузка контактов…');
            }
            try {
                var response = await fetch(this.apiUrl, {
                    headers: { 'X-Requested-With': 'XMLHttpRequest' },
                    credentials: 'same-origin'
                });
                if (!response.ok) {
                    throw new Error('HTTP ' + response.status);
                }
                var data = await response.json();
                this.rows = Array.isArray(data.results) ? data.results : [];
                this.applyFilter(true);
            } catch (error) {
                this.tbody.textContent = '';
                var row = document.createElement('tr');
                var cell = document.createElement('td');
                cell.colSpan = 5;
                cell.textContent = 'Не удалось загрузить контакты с сервера: ' + error.message;
                row.appendChild(cell);
                this.tbody.appendChild(row);
            } finally {
                if (window.PharmacyUI) {
                    window.PharmacyUI.hidePreloader();
                }
            }
        }

        setQuery(query) {
            this.query = String(query || '').trim().toLowerCase();
            this.page = 1;
            this.applyFilter(false);
        }

        sortBy(key) {
            if (!key) {
                return;
            }
            if (this.sortKey === key) {
                // Second click on the same column reverses the direction.
                this.sortDirection *= -1;
            } else {
                this.sortKey = key;
                this.sortDirection = 1;
            }
            this.page = 1;
            if (window.PharmacyUI) {
                window.PharmacyUI.withPreloader(() => this.applyFilter(false), 250);
            } else {
                this.applyFilter(false);
            }
        }

        compareRows(left, right) {
            var leftValue = left[this.sortKey] || '';
            var rightValue = right[this.sortKey] || '';

            if (this.sortKey === 'phone') {
                // Phone sorting as numbers: strip spaces, brackets and dashes.
                // String comparison would put "10..." before "9...".
                var leftDigits = Number(String(leftValue).replace(/\D/g, ''));
                var rightDigits = Number(String(rightValue).replace(/\D/g, ''));
                if (!Number.isNaN(leftDigits) && !Number.isNaN(rightDigits)) {
                    return (leftDigits - rightDigits) * this.sortDirection;
                }
            }

            // Names/e-mails are strings; localeCompare with numeric:true avoids
            // the classic "10 < 2" mistake if a column ever contains numbers.
            return String(leftValue).localeCompare(String(rightValue), 'ru', {
                numeric: true,
                sensitivity: 'base'
            }) * this.sortDirection;
        }

        applyFilter(resetPage) {
            var query = this.query;
            this.filteredRows = this.rows.filter((row) => {
                if (!query) {
                    return true;
                }
                var haystack = [row.full_name, row.job_description, row.phone, row.email]
                    .join(' ')
                    .toLowerCase();
                return haystack.indexOf(query) !== -1;
            });
            this.filteredRows.sort((left, right) => this.compareRows(left, right));
            if (resetPage) {
                this.page = 1;
            }
            this.render();
        }

        totalPages() {
            return Math.max(1, Math.ceil(this.filteredRows.length / this.perPage));
        }

        currentPageRows() {
            var start = (this.page - 1) * this.perPage;
            return this.filteredRows.slice(start, start + this.perPage);
        }

        render() {
            var totalPages = this.totalPages();
            if (this.page > totalPages) {
                this.page = totalPages;
            }
            this.tbody.textContent = '';

            var pageRows = this.currentPageRows();
            if (pageRows.length === 0) {
                var emptyRow = document.createElement('tr');
                var emptyCell = document.createElement('td');
                emptyCell.colSpan = 5;
                emptyCell.textContent = this.rows.length === 0
                    ? 'Контакты не найдены.'
                    : 'По вашему запросу ничего не найдено.';
                emptyRow.appendChild(emptyCell);
                this.tbody.appendChild(emptyRow);
            } else {
                pageRows.forEach((row) => {
                    this.tbody.appendChild(this.createRow(row));
                });
            }

            this.renderPagination(totalPages);
            this.updateSortIndicators();
            this.updateSelectAll(pageRows);
        }

        createRow(row) {
            var tr = document.createElement('tr');
            tr.setAttribute('data-contact-id', normaliseId(row.id));
            tr.setAttribute('tabindex', '0');

            // Checkbox cell: id is persisted in localStorage, not the row node.
            var checkCell = document.createElement('td');
            checkCell.className = 'contact-table__check';
            var checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = this.selectedIds.has(normaliseId(row.id));
            checkbox.setAttribute('aria-label', 'Выбрать ' + row.full_name);
            checkbox.addEventListener('change', () => {
                if (checkbox.checked) {
                    this.selectedIds.add(normaliseId(row.id));
                } else {
                    this.selectedIds.delete(normaliseId(row.id));
                }
                this.saveSelection();
                this.updateSelectAll(this.currentPageRows());
            });
            checkCell.appendChild(checkbox);
            tr.appendChild(checkCell);

            var nameCell = document.createElement('td');
            nameCell.className = 'contact-table__person';
            var photo = document.createElement('img');
            photo.src = row.photo_url || buildAvatarUrl(row.full_name);
            photo.alt = row.full_name;
            photo.width = 64;
            photo.height = 64;
            photo.loading = 'lazy';
            photo.className = 'contact-table__photo';
            nameCell.appendChild(photo);
            var name = document.createElement('strong');
            name.textContent = row.full_name;
            nameCell.appendChild(name);
            tr.appendChild(nameCell);

            var jobCell = document.createElement('td');
            jobCell.textContent = row.job_description;
            tr.appendChild(jobCell);

            var phoneCell = document.createElement('td');
            var phoneLink = document.createElement('a');
            phoneLink.href = 'tel:' + String(row.phone).replace(/[^\d+]/g, '');
            phoneLink.textContent = row.phone;
            phoneCell.appendChild(phoneLink);
            tr.appendChild(phoneCell);

            var emailCell = document.createElement('td');
            var emailLink = document.createElement('a');
            emailLink.href = 'mailto:' + row.email;
            emailLink.textContent = row.email;
            emailCell.appendChild(emailLink);
            tr.appendChild(emailCell);

            tr.addEventListener('click', (event) => {
                if (event.target.closest('input, button, a')) {
                    return;
                }
                this.showDetails(row);
            });
            tr.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    this.showDetails(row);
                }
            });
            return tr;
        }

        renderPagination(totalPages) {
            if (!this.pagination) {
                return;
            }
            this.pagination.textContent = '';
            this.pagination.hidden = totalPages <= 1;

            var previous = document.createElement('button');
            previous.type = 'button';
            previous.textContent = '‹';
            previous.setAttribute('aria-label', 'Предыдущая страница');
            previous.disabled = this.page <= 1;
            previous.addEventListener('click', () => {
                if (this.page > 1) {
                    this.page -= 1;
                    this.render();
                }
            });
            this.pagination.appendChild(previous);

            for (let index = 1; index <= totalPages; index += 1) {
                var button = document.createElement('button');
                button.type = 'button';
                button.textContent = String(index);
                button.setAttribute('aria-label', 'Страница ' + index);
                if (index === this.page) {
                    button.classList.add('is-active');
                    button.setAttribute('aria-current', 'page');
                }
                button.addEventListener('click', () => {
                    this.page = index;
                    this.render();
                });
                this.pagination.appendChild(button);
            }

            var next = document.createElement('button');
            next.type = 'button';
            next.textContent = '›';
            next.setAttribute('aria-label', 'Следующая страница');
            next.disabled = this.page >= totalPages;
            next.addEventListener('click', () => {
                if (this.page < totalPages) {
                    this.page += 1;
                    this.render();
                }
            });
            this.pagination.appendChild(next);
        }

        updateSortIndicators() {
            this.sortButtons.forEach((button) => {
                var key = button.getAttribute('data-sort');
                var indicator = button.querySelector('[data-sort-indicator]');
                var column = button.closest('th');
                if (!indicator) {
                    return;
                }
                if (key === this.sortKey) {
                    indicator.textContent = this.sortDirection === 1 ? '▲' : '▼';
                    if (column) {
                        column.setAttribute(
                            'aria-sort',
                            this.sortDirection === 1 ? 'ascending' : 'descending'
                        );
                    }
                } else {
                    indicator.textContent = '';
                    if (column) {
                        column.setAttribute('aria-sort', 'none');
                    }
                }
            });
        }

        updateSelectAll(pageRows) {
            if (!this.selectAll) {
                return;
            }
            var selectedOnPage = pageRows.filter((row) => {
                return this.selectedIds.has(normaliseId(row.id));
            }).length;
            this.selectAll.checked = pageRows.length > 0 && selectedOnPage === pageRows.length;
            this.selectAll.indeterminate = selectedOnPage > 0 && selectedOnPage < pageRows.length;
        }

        showDetails(row) {
            if (!this.details) {
                return;
            }
            // innerHTML is used here only to clear the container quickly; new
            // nodes are built with createElement/appendChild below.
            this.details.innerHTML = '';
            var heading = document.createElement('h3');
            heading.textContent = row.full_name;
            this.details.appendChild(heading);

            var photo = document.createElement('img');
            photo.src = row.photo_url || buildAvatarUrl(row.full_name);
            photo.alt = row.full_name;
            photo.width = 96;
            photo.height = 96;
            photo.className = 'contact-details__photo';
            this.details.appendChild(photo);

            var list = document.createElement('dl');
            var fields = [
                ['Работа', row.job_description],
                ['Телефон', row.phone],
                ['Почта', row.email],
                ['ID', row.id]
            ];
            fields.forEach(function (field) {
                var term = document.createElement('dt');
                term.textContent = field[0];
                var description = document.createElement('dd');
                description.textContent = field[1];
                list.appendChild(term);
                list.appendChild(description);
            });
            this.details.appendChild(list);
        }

        toggleAddForm() {
            if (!this.addForm) {
                return;
            }
            var willOpen = this.addForm.hidden;
            this.addForm.hidden = !willOpen;
            if (this.addToggle) {
                this.addToggle.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
            }
            if (willOpen) {
                var firstInput = this.addForm.querySelector('input, textarea');
                if (firstInput) {
                    firstInput.focus();
                }
            }
        }

        closeAddForm() {
            if (this.addForm) {
                this.addForm.hidden = true;
            }
            if (this.addToggle) {
                this.addToggle.setAttribute('aria-expanded', 'false');
            }
            this.showFormMessage('');
        }

        updateSubmitState() {
            if (!this.addForm || !this.addSubmit) {
                return;
            }
            var requiredFields = Array.prototype.slice.call(
                this.addForm.querySelectorAll('[required]')
            );
            var allFilled = requiredFields.every(function (field) {
                return String(field.value).trim() !== '';
            });
            // The button is enabled only after every required input is filled.
            this.addSubmit.disabled = !allFilled;
        }

        showFormMessage(message, isError) {
            if (!this.formStatus) {
                return;
            }
            this.formStatus.textContent = message;
            this.formStatus.classList.toggle('form-message--error', Boolean(isError));
            this.formStatus.classList.toggle('form-message--success', !isError && Boolean(message));
        }

        validateLiveFields() {
            // Live validation for the two attributes demanded by the lab:
            // URL and phone. The functions return a boolean; the message is
            // printed below the form, while an invalid field gets a red border.
            if (!this.addForm) {
                return;
            }
            var phoneInput = document.getElementById('contact-phone');
            var websiteInput = document.getElementById('contact-site');
            var messages = [];
            var phone = phoneInput ? phoneInput.value.trim() : '';
            var website = websiteInput ? websiteInput.value.trim() : '';
            var phoneValid = phone === '' || isValidPhone(phone);
            var websiteValid = website === '' || isValidUrl(website);

            this.markField(phoneInput, !phoneValid);
            this.markField(websiteInput, !websiteValid);

            if (!phoneValid) {
                messages.push(
                    'Телефон невалиден. Допустимы: 80291112233, 8 (029) 1112233, +375 (29) 111-22-33, +375 (29) 111 22 33.'
                );
            }
            if (!websiteValid) {
                messages.push('URL невалиден: нужен http:// или https:// и окончание .php или .html.');
            }

            if (messages.length > 0) {
                this.showFormMessage(messages.join(' '), true);
            } else if (phone || website) {
                this.showFormMessage('Проверка телефона/URL пройдена.', false);
            } else {
                this.showFormMessage('');
            }
        }

        markField(input, invalid) {
            if (!input) {
                return;
            }
            input.classList.toggle('invalid-field', Boolean(invalid));
            if (invalid) {
                input.setAttribute('aria-invalid', 'true');
            } else {
                input.removeAttribute('aria-invalid');
            }
        }

        addContactFromForm() {
            if (!this.addForm) {
                return;
            }
            var formData = new FormData(this.addForm);
            var fullName = String(formData.get('full_name') || '').trim();
            var jobDescription = String(formData.get('job_description') || '').trim();
            var phone = String(formData.get('phone') || '').trim();
            var email = String(formData.get('email') || '').trim();
            var website = String(formData.get('website') || '').trim();
            var emailInput = document.getElementById('contact-email');
            var phoneInput = document.getElementById('contact-phone');
            var websiteInput = document.getElementById('contact-site');

            var phoneValid = isValidPhone(phone);
            var websiteValid = website === '' || isValidUrl(website);
            var emailValid = emailInput ? emailInput.checkValidity() : /.+@.+\..+/.test(email);

            this.markField(phoneInput, !phoneValid);
            this.markField(websiteInput, !websiteValid);
            this.markField(emailInput, !emailValid);

            if (!phoneValid) {
                this.showFormMessage(
                    'Невалидный телефон. Допустимы: 80291112233, 8 (029) 1112233, +375 (29) 111-22-33, +375 (29) 111 22 33.',
                    true
                );
                return;
            }
            if (!websiteValid) {
                this.showFormMessage(
                    'Невалидный URL: нужен http:// или https:// и окончание .php или .html.',
                    true
                );
                return;
            }
            if (!emailValid) {
                this.showFormMessage('Невалидный адрес почты.', true);
                return;
            }
            if (!fullName || !jobDescription) {
                this.showFormMessage('Заполните ФИО и описание работы.', true);
                return;
            }

            var operation = () => {
                this.localCounter += 1;
                var newContact = {
                    // Local records get a string id, real records have an int id.
                    id: 'local-' + Date.now() + '-' + this.localCounter,
                    full_name: fullName,
                    job_description: jobDescription,
                    phone: phone,
                    email: email,
                    photo_url: this.pendingPhoto || buildAvatarUrl(fullName)
                };
                this.rows.push(newContact);
                this.pendingPhoto = '';
                this.addForm.reset();
                this.showFormMessage('Сотрудник добавлен в таблицу.', false);
                this.updateSubmitState();
                this.query = '';
                if (this.searchInput) {
                    this.searchInput.value = '';
                }
                this.applyFilter(true);

                // Sorting may place the new row on any page. Find its index
                // in the sorted array and open exactly that page so the user
                // immediately sees the inserted row.
                var newIndex = this.filteredRows.indexOf(newContact);
                this.page = newIndex >= 0
                    ? Math.floor(newIndex / this.perPage) + 1
                    : 1;
                this.render();
            };

            if (window.PharmacyUI) {
                window.PharmacyUI.withPreloader(operation, 300);
            } else {
                operation();
            }
        }

        grantBonus() {
            var selectedRows = this.rows.filter((row) => {
                return this.selectedIds.has(normaliseId(row.id));
            });
            if (!this.bonusOutput) {
                return;
            }
            if (selectedRows.length === 0) {
                this.bonusOutput.textContent = 'Отметьте хотя бы одного сотрудника чекбоксом.';
                return;
            }
            var names = selectedRows.map(function (row) {
                return row.full_name;
            }).join(', ');
            var message =
                'Премирование сотрудников: ' + names + '. Отмечено человек: ' + selectedRows.length + '.';
            if (window.PharmacyUI) {
                window.PharmacyUI.withPreloader(() => {
                    this.bonusOutput.textContent = message;
                }, 250);
            } else {
                this.bonusOutput.textContent = message;
            }
        }
    }

    document.addEventListener('DOMContentLoaded', function () {
        var root = document.getElementById('contacts-app');
        if (root) {
            new ContactsTable(root).init();
        }
    });
})();
