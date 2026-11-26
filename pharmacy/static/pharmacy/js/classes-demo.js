/*
 * LR3 task 8 (variant 14) — arrays of objects, base class + heir.
 *
 * The same bank-client algorithm is implemented twice:
 *   1. prototype inheritance (function constructors + Object.create);
 *   2. ES class / extends.
 *
 * Base class fields: full name, account number, deposit amount.
 * Subclass fields: VIP personal manager.
 *
 * Each implementation exposes five method groups:
 *   - getters and setters;
 *   - addFromForm(form) — reads HTML form components and pushes a new object;
 *   - renderAll(container) — outputs every object in the array;
 *   - renderResult(container, query) — solves the variant and prints the result.
 */
(function () {
    'use strict';

    function formatMoney(value) {
        // Number() is safer than string concatenation: "100" + "200" would
        // produce "100200"; Number("100") + Number("200") produces 300.
        return Number(value).toFixed(2);
    }

    function normaliseName(value) {
        return String(value).trim().toLowerCase();
    }

    function createTextCell(text) {
        var cell = document.createElement('td');
        cell.textContent = text;
        return cell;
    }

    function buildTable(headers) {
        var table = document.createElement('table');
        table.className = 'result-table';
        var thead = document.createElement('thead');
        var headRow = document.createElement('tr');
        headers.forEach(function (header) {
            var th = document.createElement('th');
            th.textContent = header;
            headRow.appendChild(th);
        });
        thead.appendChild(headRow);
        table.appendChild(thead);
        var tbody = document.createElement('tbody');
        table.appendChild(tbody);
        return { table: table, tbody: tbody };
    }

    function showEmpty(container, message) {
        container.innerHTML = '';
        var paragraph = document.createElement('p');
        paragraph.textContent = message;
        container.appendChild(paragraph);
    }

    /* =====================================================================
     * Variant 1: prototype inheritance
     * ================================================================== */

    function PrototypeBankClient(fullName, accountNumber, amount) {
        // Registry array lives on the instance. A subclass instance gets its
        // own array because its constructor calls this function with `this`.
        this.items = [];
        this._fullName = fullName || '';
        this._accountNumber = accountNumber || '';
        this._amount = Number(amount) || 0;
    }

    PrototypeBankClient.prototype.getFullName = function () {
        return this._fullName;
    };
    PrototypeBankClient.prototype.setFullName = function (value) {
        this._fullName = String(value);
    };
    PrototypeBankClient.prototype.getAccountNumber = function () {
        return this._accountNumber;
    };
    PrototypeBankClient.prototype.setAccountNumber = function (value) {
        this._accountNumber = String(value);
    };
    PrototypeBankClient.prototype.getAmount = function () {
        return this._amount;
    };
    PrototypeBankClient.prototype.setAmount = function (value) {
        this._amount = Number(value) || 0;
    };

    PrototypeBankClient.prototype.addFromForm = function (form) {
        var data = new FormData(form);
        var fullName = String(data.get('fullName') || '').trim();
        var accountNumber = String(data.get('account') || '').trim();
        var amount = Number(data.get('amount')) || 0;
        var clientType = String(data.get('clientType') || 'base');
        var client;

        if (clientType === 'vip') {
            client = new PrototypeVipBankClient(
                fullName,
                accountNumber,
                amount,
                String(data.get('manager') || '').trim()
            );
        } else {
            client = new PrototypeBankClient(fullName, accountNumber, amount);
        }
        this.items.push(client);
        return client;
    };

    PrototypeBankClient.prototype.renderAll = function (container) {
        container.innerHTML = '';
        if (this.items.length === 0) {
            showEmpty(container, 'Массив пуст.');
            return;
        }
        var built = buildTable(['ФИО', 'Счёт', 'Вклад, BYN', 'Тип', 'Менеджер']);
        this.items.forEach(function (client) {
            var row = document.createElement('tr');
            row.setAttribute('data-account', client.getAccountNumber());
            row.appendChild(createTextCell(client.getFullName()));
            row.appendChild(createTextCell(client.getAccountNumber()));
            row.appendChild(createTextCell(formatMoney(client.getAmount())));
            var isVip = client instanceof PrototypeVipBankClient;
            row.appendChild(createTextCell(isVip ? 'VIP' : 'Обычный'));
            row.appendChild(createTextCell(isVip ? client.getManager() : '—'));
            built.tbody.appendChild(row);
        });
        container.appendChild(built.table);
    };

    PrototypeBankClient.prototype.renderResult = function (container, query) {
        var needle = normaliseName(query || '');
        var groups = {};
        this.items.forEach(function (client) {
            var name = client.getFullName();
            var key = normaliseName(name);
            if (needle && key.indexOf(needle) === -1) {
                return;
            }
            if (!groups[key]) {
                groups[key] = {
                    name: name,
                    total: 0,
                    accounts: [],
                    managers: []
                };
            }
            groups[key].total += Number(client.getAmount());
            groups[key].accounts.push(client.getAccountNumber());
            if (client instanceof PrototypeVipBankClient) {
                groups[key].managers.push(client.getManager());
            }
        });

        var multiple = Object.keys(groups)
            .map(function (key) { return groups[key]; })
            .filter(function (group) { return group.accounts.length > 1; });

        if (multiple.length === 0) {
            showEmpty(container, 'Клиентов с несколькими счетами не найдено.');
            return;
        }

        container.innerHTML = '';
        var built = buildTable(['ФИО', 'Счета', 'Общая сумма, BYN', 'Менеджер']);
        multiple.forEach(function (group) {
            var row = document.createElement('tr');
            row.appendChild(createTextCell(group.name));
            row.appendChild(createTextCell(group.accounts.join(', ')));
            row.appendChild(createTextCell(formatMoney(group.total)));
            row.appendChild(createTextCell(group.managers.length ? group.managers.join(', ') : '—'));
            built.tbody.appendChild(row);
        });
        var caption = document.createElement('p');
        caption.textContent = 'Найдено клиентов с несколькими счетами: ' + multiple.length + '.';
        container.appendChild(caption);
        container.appendChild(built.table);
    };

    // Subclass: VipBankClient inherits all base methods, adds a manager.
    function PrototypeVipBankClient(fullName, accountNumber, amount, manager) {
        PrototypeBankClient.call(this, fullName, accountNumber, amount);
        this._manager = manager || '—';
    }
    PrototypeVipBankClient.prototype = Object.create(PrototypeBankClient.prototype);
    PrototypeVipBankClient.prototype.constructor = PrototypeVipBankClient;
    PrototypeVipBankClient.prototype.getManager = function () {
        return this._manager;
    };
    PrototypeVipBankClient.prototype.setManager = function (value) {
        this._manager = String(value);
    };

    /* =====================================================================
     * Variant 2: class / extends
     * ================================================================== */

    class ClassBankClient {
        constructor(fullName, accountNumber, amount) {
            this.items = [];
            this._fullName = fullName || '';
            this._accountNumber = accountNumber || '';
            this._amount = Number(amount) || 0;
        }

        get fullName() {
            return this._fullName;
        }

        set fullName(value) {
            this._fullName = String(value);
        }

        get accountNumber() {
            return this._accountNumber;
        }

        set accountNumber(value) {
            this._accountNumber = String(value);
        }

        get amount() {
            return this._amount;
        }

        set amount(value) {
            this._amount = Number(value) || 0;
        }

        addFromForm(form) {
            var data = new FormData(form);
            var fullName = String(data.get('fullName') || '').trim();
            var accountNumber = String(data.get('account') || '').trim();
            var amount = Number(data.get('amount')) || 0;
            var clientType = String(data.get('clientType') || 'base');
            var client;

            if (clientType === 'vip') {
                client = new ClassVipBankClient(
                    fullName,
                    accountNumber,
                    amount,
                    String(data.get('manager') || '').trim()
                );
            } else {
                client = new ClassBankClient(fullName, accountNumber, amount);
            }
            this.items.push(client);
            return client;
        }

        renderAll(container) {
            container.innerHTML = '';
            if (this.items.length === 0) {
                showEmpty(container, 'Массив пуст.');
                return;
            }
            var built = buildTable(['ФИО', 'Счёт', 'Вклад, BYN', 'Тип', 'Менеджер']);
            this.items.forEach((client) => {
                var row = document.createElement('tr');
                row.setAttribute('data-account', client.accountNumber);
                row.appendChild(createTextCell(client.fullName));
                row.appendChild(createTextCell(client.accountNumber));
                row.appendChild(createTextCell(formatMoney(client.amount)));
                var isVip = client instanceof ClassVipBankClient;
                row.appendChild(createTextCell(isVip ? 'VIP' : 'Обычный'));
                row.appendChild(createTextCell(isVip ? client.manager : '—'));
                built.tbody.appendChild(row);
            });
            container.appendChild(built.table);
        }

        renderResult(container, query) {
            var needle = normaliseName(query || '');
            var groups = {};
            this.items.forEach((client) => {
                var key = normaliseName(client.fullName);
                if (needle && key.indexOf(needle) === -1) {
                    return;
                }
                if (!groups[key]) {
                    groups[key] = {
                        name: client.fullName,
                        total: 0,
                        accounts: [],
                        managers: []
                    };
                }
                groups[key].total += Number(client.amount);
                groups[key].accounts.push(client.accountNumber);
                if (client instanceof ClassVipBankClient) {
                    groups[key].managers.push(client.manager);
                }
            });

            var multiple = Object.keys(groups)
                .map((key) => groups[key])
                .filter((group) => group.accounts.length > 1);

            if (multiple.length === 0) {
                showEmpty(container, 'Клиентов с несколькими счетами не найдено.');
                return;
            }

            container.innerHTML = '';
            var built = buildTable(['ФИО', 'Счета', 'Общая сумма, BYN', 'Менеджер']);
            multiple.forEach((group) => {
                var row = document.createElement('tr');
                row.appendChild(createTextCell(group.name));
                row.appendChild(createTextCell(group.accounts.join(', ')));
                row.appendChild(createTextCell(formatMoney(group.total)));
                row.appendChild(createTextCell(group.managers.length ? group.managers.join(', ') : '—'));
                built.tbody.appendChild(row);
            });
            var caption = document.createElement('p');
            caption.textContent = 'Найдено клиентов с несколькими счетами: ' + multiple.length + '.';
            container.appendChild(caption);
            container.appendChild(built.table);
        }
    }

    class ClassVipBankClient extends ClassBankClient {
        constructor(fullName, accountNumber, amount, manager) {
            super(fullName, accountNumber, amount);
            this._manager = manager || '—';
        }

        get manager() {
            return this._manager;
        }

        set manager(value) {
            this._manager = String(value);
        }
    }

    /* =====================================================================
     * Wiring to the HTML forms
     * ================================================================== */

    function bindVipField(form) {
        var select = form.querySelector('select[name="clientType"]');
        var vipField = form.querySelector('.vip-field');
        if (!select || !vipField) {
            return;
        }
        select.addEventListener('change', function () {
            vipField.hidden = select.value !== 'vip';
        });
    }

    function seedPrototypeRegistry() {
        var registry = new PrototypeBankClient('', '', 0);
        var baseRows = [
            ['Иванов Иван Иванович', 'BY-1001', 1500],
            ['Иванов Иван Иванович', 'BY-1002', 2500],
            ['Петрова Анна Сергеевна', 'BY-2001', 3000],
            ['Сидоров Пётр Олегович', 'BY-3001', 1200],
            ['Сидоров Пётр Олегович', 'BY-3002', 800],
            ['Сидоров Пётр Олегович', 'BY-3003', 2000],
            ['Козлова Мария Викторовна', 'BY-4001', 5000]
        ];
        baseRows.forEach(function (values) {
            registry.items.push(new PrototypeBankClient(values[0], values[1], values[2]));
        });
        registry.items.push(new PrototypeVipBankClient('Морозов Олег Петрович', 'BY-5001', 7000, 'Орлова Н. Н.'));
        registry.items.push(new PrototypeVipBankClient('Морозов Олег Петрович', 'BY-5002', 3000, 'Орлова Н. Н.'));
        return registry;
    }

    function seedClassRegistry() {
        var registry = new ClassBankClient('', '', 0);
        var baseRows = [
            ['Иванов Иван Иванович', 'BY-1001', 1500],
            ['Иванов Иван Иванович', 'BY-1002', 2500],
            ['Петрова Анна Сергеевна', 'BY-2001', 3000],
            ['Сидоров Пётр Олегович', 'BY-3001', 1200],
            ['Сидоров Пётр Олегович', 'BY-3002', 800],
            ['Сидоров Пётр Олегович', 'BY-3003', 2000],
            ['Козлова Мария Викторовна', 'BY-4001', 5000]
        ];
        baseRows.forEach(function (values) {
            registry.items.push(new ClassBankClient(values[0], values[1], values[2]));
        });
        registry.items.push(new ClassVipBankClient('Морозов Олег Петрович', 'BY-5001', 7000, 'Орлова Н. Н.'));
        registry.items.push(new ClassVipBankClient('Морозов Олег Петрович', 'BY-5002', 3000, 'Орлова Н. Н.'));
        return registry;
    }

    function initPrototypeDemo() {
        var form = document.getElementById('proto-client-form');
        var allContainer = document.getElementById('proto-all');
        var resultContainer = document.getElementById('proto-result');
        if (!form || !allContainer || !resultContainer) {
            return;
        }
        var registry = seedPrototypeRegistry();
        bindVipField(form);
        registry.renderAll(allContainer);
        registry.renderResult(resultContainer, '');

        form.addEventListener('submit', function (event) {
            event.preventDefault();
            if (!form.reportValidity()) {
                return;
            }
            registry.addFromForm(form);
            registry.renderAll(allContainer);
            registry.renderResult(resultContainer, '');
        });

        form.querySelector('[data-proto-action="all"]').addEventListener('click', function () {
            registry.renderAll(allContainer);
        });
        form.querySelector('[data-proto-action="result"]').addEventListener('click', function () {
            registry.renderResult(resultContainer, form.elements.namedItem('filter').value);
        });
    }

    function initClassDemo() {
        var form = document.getElementById('class-client-form');
        var allContainer = document.getElementById('class-all');
        var resultContainer = document.getElementById('class-result');
        if (!form || !allContainer || !resultContainer) {
            return;
        }
        var registry = seedClassRegistry();
        bindVipField(form);
        registry.renderAll(allContainer);
        registry.renderResult(resultContainer, '');

        form.addEventListener('submit', function (event) {
            event.preventDefault();
            if (!form.reportValidity()) {
                return;
            }
            registry.addFromForm(form);
            registry.renderAll(allContainer);
            registry.renderResult(resultContainer, '');
        });

        form.querySelector('[data-class-action="all"]').addEventListener('click', function () {
            registry.renderAll(allContainer);
        });
        form.querySelector('[data-class-action="result"]').addEventListener('click', function () {
            registry.renderResult(resultContainer, form.elements.namedItem('filter').value);
        });
    }

    document.addEventListener('DOMContentLoaded', function () {
        initPrototypeDemo();
        initClassDemo();
    });
})();
