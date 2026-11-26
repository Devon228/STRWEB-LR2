/*
 * Site-wide LR3 behaviour.
 *
 * Responsibilities:
 *   1. Theme switcher (LR3 task 2) + localStorage persistence.
 *   2. Preloader helpers (LR3 task 3: show the LR2 pill preloader for async
 *      operations such as the contacts fetch/sort/filter/add/bonus).
 *   3. Date-of-birth dialog (LR3 task 7): age, weekday, adult/minor check.
 *
 * This file is loaded on every page with `defer`, so the DOM is already parsed.
 * No frameworks and no TypeScript are used — only standard browser APIs.
 */
(function () {
    'use strict';

    var THEME_KEY = 'pharmacy_theme';
    var BIRTH_ACK_KEY = 'pharmacy_birthdate_ack';
    var BIRTH_VALUE_KEY = 'pharmacy_birthdate_value';
    var preloader = document.querySelector('.preloader');
    var preloaderText = preloader ? preloader.querySelector('.preloader__text') : null;

    /* ---------------------------------------------------------------------
     * Preloader
     * ------------------------------------------------------------------ */

    function showPreloader(message) {
        if (!preloader) {
            return;
        }
        if (message && preloaderText) {
            preloaderText.textContent = message;
        }
        preloader.classList.remove('is-hidden');
        preloader.removeAttribute('aria-hidden');
    }

    function hidePreloader() {
        if (!preloader) {
            return;
        }
        preloader.classList.add('is-hidden');
        preloader.setAttribute('aria-hidden', 'true');
        if (preloaderText) {
            preloaderText.textContent = 'Загрузка страницы…';
        }
    }

    /**
     * Run a synchronous or asynchronous task while the preloader is visible.
     * The preloader stays on screen for at least `minDuration` ms so a human
     * can actually see it; this is useful for very fast local operations.
     */
    async function withPreloader(task, minDuration) {
        var minimum = typeof minDuration === 'number' ? minDuration : 350;
        var startedAt = Date.now();
        showPreloader();
        try {
            return await task();
        } finally {
            var elapsed = Date.now() - startedAt;
            var wait = Math.max(0, minimum - elapsed);
            window.setTimeout(hidePreloader, wait);
        }
    }

    window.PharmacyUI = {
        showPreloader: showPreloader,
        hidePreloader: hidePreloader,
        withPreloader: withPreloader
    };

    /* ---------------------------------------------------------------------
     * Theme switcher (LR3 task 2)
     *
     * The early inline script in base.html has already applied the saved
     * theme to <html data-theme="dark"> before CSS is painted. Here we only
     * synchronise the button and handle clicks.
     * ------------------------------------------------------------------ */

    function readStoredTheme() {
        try {
            return localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light';
        } catch (error) {
            return 'light';
        }
    }

    function applyTheme(theme) {
        if (theme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
        } else {
            document.documentElement.removeAttribute('data-theme');
        }
        var button = document.getElementById('theme-toggle');
        if (button) {
            var isDark = theme === 'dark';
            button.textContent = isDark ? 'Светлая тема' : 'Тёмная тема';
            button.setAttribute('aria-pressed', isDark ? 'true' : 'false');
            button.setAttribute('aria-label', isDark ? 'Включить светлую тему' : 'Включить тёмную тему');
        }
    }

    function initTheme() {
        applyTheme(readStoredTheme());
        var button = document.getElementById('theme-toggle');
        if (!button) {
            return;
        }
        button.addEventListener('click', function () {
            var nextTheme = readStoredTheme() === 'dark' ? 'light' : 'dark';
            try {
                localStorage.setItem(THEME_KEY, nextTheme);
            } catch (error) {
                /* Storage may be disabled; the theme still works for this page. */
            }
            applyTheme(nextTheme);
        });

        // Keep two open tabs in sync when localStorage changes.
        window.addEventListener('storage', function (event) {
            if (event.key === THEME_KEY) {
                applyTheme(event.newValue === 'dark' ? 'dark' : 'light');
            }
        });
    }

    /* ---------------------------------------------------------------------
     * Date of birth (LR3 task 7)
     * ------------------------------------------------------------------ */

    function toIsoDate(date) {
        var year = date.getFullYear();
        var month = String(date.getMonth() + 1).padStart(2, '0');
        var day = String(date.getDate()).padStart(2, '0');
        return year + '-' + month + '-' + day;
    }

    /**
     * Parse YYYY-MM-DD as a LOCAL date. new Date('YYYY-MM-DD') treats the
     * value as UTC and can shift the day in negative time zones, so we build
     * the Date object from its parts explicitly.
     */
    function parseLocalDate(value) {
        var parts = String(value).split('-').map(Number);
        if (parts.length !== 3 || parts.some(function (part) { return Number.isNaN(part); })) {
            return null;
        }
        var date = new Date(parts[0], parts[1] - 1, parts[2]);
        if (
            date.getFullYear() !== parts[0] ||
            date.getMonth() !== parts[1] - 1 ||
            date.getDate() !== parts[2]
        ) {
            return null;
        }
        return date;
    }

    function calculateAge(birthDate, today) {
        var age = today.getFullYear() - birthDate.getFullYear();
        var hasHadBirthday =
            today.getMonth() > birthDate.getMonth() ||
            (today.getMonth() === birthDate.getMonth() && today.getDate() >= birthDate.getDate());
        return hasHadBirthday ? age : age - 1;
    }

    function capitalise(value) {
        return value.charAt(0).toUpperCase() + value.slice(1);
    }

    function initBirthDateDialog() {
        var modal = document.getElementById('birthdate-modal');
        var form = document.getElementById('birthdate-form');
        if (!modal || !form) {
            return;
        }
        var input = document.getElementById('birthdate-input');
        var hint = document.getElementById('birthdate-hint');
        var errorBox = document.getElementById('birthdate-error');
        var resultBox = document.getElementById('birthdate-result');
        var today = new Date();
        var todayIso = toIsoDate(today);

        input.max = todayIso;
        hint.textContent = 'Сегодня: ' + today.toLocaleDateString('ru-RU') +
            '. Для проверки попробуйте завтрашнюю дату (получите ошибку) и дату ровно 18 лет назад (получите возраст и день недели).';

        function openModal() {
            var storedValue = null;
            try {
                storedValue = sessionStorage.getItem(BIRTH_VALUE_KEY);
            } catch (error) {
                storedValue = null;
            }
            if (storedValue) {
                input.value = storedValue;
            }
            modal.hidden = false;
            document.body.classList.add('modal-open');
            window.setTimeout(function () { input.focus(); }, 30);
        }

        function closeModal() {
            modal.hidden = true;
            document.body.classList.remove('modal-open');
        }

        function markInvalid(message) {
            errorBox.textContent = message;
            resultBox.textContent = '';
            input.classList.add('invalid-field');
            input.setAttribute('aria-invalid', 'true');
        }

        function markValid(message) {
            errorBox.textContent = '';
            resultBox.textContent = message;
            input.classList.remove('invalid-field');
            input.removeAttribute('aria-invalid');
        }

        form.addEventListener('submit', function (event) {
            event.preventDefault();
            var value = input.value.trim();
            if (!value) {
                markInvalid('Укажите дату рождения.');
                return;
            }
            var birthDate = parseLocalDate(value);
            if (!birthDate) {
                markInvalid('Некорректная дата.');
                return;
            }
            if (birthDate > today) {
                markInvalid('Дата рождения не может быть в будущем.');
                return;
            }

            var age = calculateAge(birthDate, today);
            var weekday = capitalise(birthDate.toLocaleDateString('ru-RU', { weekday: 'long' }));
            var message = 'Вам ' + age + ' лет. День недели введённой даты: ' + weekday + '.';
            markValid(message);

            try {
                sessionStorage.setItem(BIRTH_ACK_KEY, '1');
                sessionStorage.setItem(BIRTH_VALUE_KEY, value);
            } catch (error) {
                /* Ignore unavailable storage. */
            }

            if (age < 18) {
                // The lab explicitly asks for an alert about parental permission.
                window.alert(
                    'Вам ' + age + ' лет. Для использования сайта необходимо разрешение родителей или законных представителей.'
                );
            }
        });

        modal.querySelectorAll('[data-birthdate-close]').forEach(function (element) {
            element.addEventListener('click', closeModal);
        });

        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape' && !modal.hidden) {
                closeModal();
            }
        });

        var reopenButton = document.getElementById('birthdate-open');
        if (reopenButton) {
            reopenButton.addEventListener('click', openModal);
        }

        // Ask once per tab. sessionStorage (not localStorage) means a new tab
        // asks again, which is convenient for demonstrating the validation.
        var acknowledged = false;
        try {
            acknowledged = sessionStorage.getItem(BIRTH_ACK_KEY) === '1';
        } catch (error) {
            acknowledged = false;
        }
        if (!acknowledged) {
            window.setTimeout(openModal, 450);
        }
    }

    document.addEventListener('DOMContentLoaded', function () {
        initTheme();
        initBirthDateDialog();
        // Hide the LR2 preloader shortly after the page has loaded. Other
        // scripts can show it again for real operations.
        window.setTimeout(hidePreloader, 450);
    });
})();
