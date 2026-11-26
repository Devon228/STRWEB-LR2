/*
 * LR3 task 4 (variant 14) — generated <input type="tel">.
 *
 * The checkbox creates the attribute editor AND the first generated field at
 * the same time (the lab asks for the attributes' controls to be generated
 * together with the target element). The editor controls map directly to the
 * variant attributes: name, placeholder, value, pattern, required, maxlength.
 *
 * Each generated field is its own <form> with a validation button, so the
 * browser's constraint validation API can be demonstrated: checkValidity(),
 * validationMessage and reportValidity(). Configurations are stored in
 * localStorage and restored after a page reload.
 */
(function () {
    'use strict';

    var STORAGE_KEY = 'pharmacy_generated_fields_v1';
    var DEFAULT_PATTERN = '^(?:\\+375|8)\\s*\\(?0?\\d{2}\\)?[\\s-]*\\d{3}[\\s-]?\\d{2}[\\s-]?\\d{2}$';
    var generatedContainer = null;
    var generatorHost = null;
    var statusBox = null;
    var toggle = null;
    var configs = [];
    var idCounter = 0;

    function makeId() {
        idCounter += 1;
        return 'field-' + Date.now() + '-' + idCounter;
    }

    function loadConfigs() {
        try {
            var raw = localStorage.getItem(STORAGE_KEY);
            var parsed = raw ? JSON.parse(raw) : [];
            return Array.isArray(parsed) ? parsed.filter(function (item) {
                return item && typeof item === 'object' && item.attrs;
            }) : [];
        } catch (error) {
            return [];
        }
    }

    function persistConfigs() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(configs));
        } catch (error) {
            /* Private mode may reject writes; the current page still works. */
        }
    }

    function setStatus(message, isError) {
        if (!statusBox) {
            return;
        }
        statusBox.textContent = message;
        statusBox.classList.toggle('form-message--error', Boolean(isError));
        statusBox.classList.toggle('form-message--success', !isError && Boolean(message));
    }

    function defaultConfig() {
        return {
            id: makeId(),
            type: 'tel',
            attrs: {
                name: 'phone',
                placeholder: '+375 (29) 111-22-33',
                value: '',
                pattern: DEFAULT_PATTERN,
                required: true,
                maxlength: 22
            }
        };
    }

    /* ---------------------------------------------------------------------
     * Phone input mask for the generated field.
     * The mask is a convenience; validation still comes from pattern/required.
     * ------------------------------------------------------------------ */
    function maskPhone(value) {
        var digits = String(value).replace(/\D/g, '');
        if (digits.indexOf('375') === 0) {
            var rest = digits.slice(3, 12);
            var result = '+375';
            if (rest.length > 0) {
                result += ' (' + rest.slice(0, 2);
            }
            if (rest.length >= 2) {
                result += ')';
            }
            if (rest.length > 2) {
                result += ' ' + rest.slice(2, 5);
            }
            if (rest.length > 5) {
                result += '-' + rest.slice(5, 7);
            }
            if (rest.length > 7) {
                result += '-' + rest.slice(7, 9);
            }
            return result;
        }
        if (digits.charAt(0) === '8') {
            var rest8 = digits.slice(1, 12);
            var operator = rest8.charAt(0) === '0' ? rest8.slice(0, 3) : rest8.slice(0, 2);
            var tail = rest8.slice(operator.length);
            var result8 = '8';
            if (operator) {
                result8 += ' (' + operator + ')';
            }
            if (tail.length > 0) {
                result8 += ' ' + tail.slice(0, 3);
            }
            if (tail.length > 3) {
                result8 += '-' + tail.slice(3, 5);
            }
            if (tail.length > 5) {
                result8 += '-' + tail.slice(5, 7);
            }
            return result8;
        }
        return value;
    }

    /* ---------------------------------------------------------------------
     * Attribute editor. It is created dynamically when the checkbox is set.
     * ------------------------------------------------------------------ */
    function createLabeledInput(id, labelText, input) {
        var paragraph = document.createElement('p');
        var label = document.createElement('label');
        label.setAttribute('for', id);
        label.textContent = labelText;
        input.id = id;
        paragraph.appendChild(label);
        paragraph.appendChild(input);
        return paragraph;
    }

    function buildGeneratorPanel() {
        var form = document.createElement('form');
        form.className = 'field-config-form';
        form.setAttribute('data-generator-panel', 'true');

        var fieldset = document.createElement('fieldset');
        var legend = document.createElement('legend');
        legend.textContent = 'Атрибуты генерируемого <input type="tel">';
        fieldset.appendChild(legend);

        var nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.value = 'phone';
        nameInput.required = true;
        fieldset.appendChild(createLabeledInput('gen-name', 'name', nameInput));

        var placeholderInput = document.createElement('input');
        placeholderInput.type = 'text';
        placeholderInput.value = '+375 (29) 111-22-33';
        fieldset.appendChild(createLabeledInput('gen-placeholder', 'placeholder', placeholderInput));

        var valueInput = document.createElement('input');
        valueInput.type = 'text';
        valueInput.value = '';
        fieldset.appendChild(createLabeledInput('gen-value', 'value', valueInput));

        var patternInput = document.createElement('input');
        patternInput.type = 'text';
        patternInput.value = DEFAULT_PATTERN;
        fieldset.appendChild(createLabeledInput('gen-pattern', 'pattern (регулярное выражение)', patternInput));

        var maxLengthInput = document.createElement('input');
        maxLengthInput.type = 'number';
        maxLengthInput.min = '1';
        maxLengthInput.max = '100';
        maxLengthInput.value = '22';
        fieldset.appendChild(createLabeledInput('gen-maxlength', 'maxlength', maxLengthInput));

        var requiredParagraph = document.createElement('p');
        var requiredLabel = document.createElement('label');
        var requiredInput = document.createElement('input');
        requiredInput.type = 'checkbox';
        requiredInput.checked = true;
        requiredInput.id = 'gen-required';
        requiredLabel.setAttribute('for', 'gen-required');
        requiredLabel.appendChild(requiredInput);
        requiredLabel.appendChild(document.createTextNode(' required — обязательное поле'));
        requiredParagraph.appendChild(requiredLabel);
        fieldset.appendChild(requiredParagraph);

        var actions = document.createElement('p');
        actions.className = 'demo-actions';
        var addButton = document.createElement('button');
        addButton.type = 'submit';
        addButton.textContent = 'Добавить ещё поле';
        var hideButton = document.createElement('button');
        hideButton.type = 'button';
        hideButton.textContent = 'Скрыть настройки';
        hideButton.addEventListener('click', function () {
            if (toggle) {
                toggle.checked = false;
            }
            if (generatorHost) {
                generatorHost.textContent = '';
            }
        });
        actions.appendChild(addButton);
        actions.appendChild(hideButton);
        fieldset.appendChild(actions);
        form.appendChild(fieldset);

        form.addEventListener('submit', function (event) {
            event.preventDefault();
            if (!form.reportValidity()) {
                return;
            }
            var config = readConfig(form);
            if (!isPatternValid(config.attrs.pattern)) {
                setStatus('Pattern не является корректным регулярным выражением.', true);
                return;
            }
            configs.push(config);
            persistConfigs();
            createGeneratedField(config);
            setStatus('Поле создано. Всего полей: ' + configs.length + '.', false);
        });

        return form;
    }

    function readConfig(form) {
        return {
            id: makeId(),
            type: 'tel',
            attrs: {
                name: form.querySelector('#gen-name').value.trim() || 'phone',
                placeholder: form.querySelector('#gen-placeholder').value,
                value: form.querySelector('#gen-value').value,
                pattern: form.querySelector('#gen-pattern').value,
                required: form.querySelector('#gen-required').checked,
                maxlength: parseInt(form.querySelector('#gen-maxlength').value, 10) || null
            }
        };
    }

    function isPatternValid(pattern) {
        if (!pattern) {
            return true;
        }
        try {
            // Validate the pattern once; a broken pattern would make the
            // generated input throw on checkValidity() in some browsers.
            new RegExp(pattern);
            return true;
        } catch (error) {
            return false;
        }
    }

    /* ---------------------------------------------------------------------
     * Generated field itself.
     * ------------------------------------------------------------------ */
    function createGeneratedField(config) {
        if (!generatedContainer) {
            return null;
        }

        var form = document.createElement('form');
        form.className = 'generated-field';
        form.setAttribute('data-generated-id', config.id);
        form.setAttribute('novalidate', 'novalidate');

        var heading = document.createElement('p');
        heading.className = 'generated-field__title';
        heading.textContent = 'Сгенерированное поле: ';
        var code = document.createElement('code');
        code.textContent = '<input type="tel">';
        heading.appendChild(code);
        form.appendChild(heading);

        var input = document.createElement('input');
        input.type = config.type || 'tel';
        input.setAttribute('data-generated-input', 'true');

        // Apply every attribute through setAttribute so the defence can show
        // exactly where attributes are added (name, placeholder, value, ...).
        Object.keys(config.attrs).forEach(function (attribute) {
            var value = config.attrs[attribute];
            if (value === null || value === undefined || value === '') {
                return;
            }
            if (attribute === 'required') {
                if (value) {
                    input.required = true;
                }
                return;
            }
            input.setAttribute(attribute, String(value));
        });

        // Phone mask: format while typing, then let pattern validation decide.
        input.addEventListener('input', function () {
            var masked = maskPhone(input.value);
            if (masked !== input.value) {
                input.value = masked;
            }
        });

        var attrsLine = document.createElement('small');
        attrsLine.className = 'generated-field__attrs';
        attrsLine.textContent = 'Атрибуты: ' + Array.prototype.map.call(
            input.attributes,
            function (attribute) {
                return attribute.name + '="' + attribute.value + '"';
            }
        ).join(' ');

        var actions = document.createElement('p');
        actions.className = 'demo-actions';
        var checkButton = document.createElement('button');
        checkButton.type = 'submit';
        checkButton.textContent = 'Проверить поле';
        var removeButton = document.createElement('button');
        removeButton.type = 'button';
        removeButton.textContent = 'Удалить поле';
        removeButton.addEventListener('click', function () {
            configs = configs.filter(function (item) {
                return item.id !== config.id;
            });
            persistConfigs();
            form.remove(); // DOM removal: the element disappears from the page.
            setStatus('Поле удалено. Осталось полей: ' + configs.length + '.', false);
        });
        actions.appendChild(checkButton);
        actions.appendChild(removeButton);
        form.appendChild(input);
        form.appendChild(actions);
        form.appendChild(attrsLine);

        var result = document.createElement('output');
        result.className = 'form-message';
        result.setAttribute('aria-live', 'polite');
        form.appendChild(result);

        form.addEventListener('submit', function (event) {
            event.preventDefault();
            var isValid = input.checkValidity();
            if (isValid) {
                input.classList.remove('invalid-field');
                result.textContent = 'Значение корректно: все ограничения выполнены.';
                result.classList.remove('form-message--error');
                result.classList.add('form-message--success');
            } else {
                input.classList.add('invalid-field');
                result.textContent = input.validationMessage || 'Значение не соответствует атрибутам поля.';
                result.classList.add('form-message--error');
                result.classList.remove('form-message--success');
                input.reportValidity();
            }
        });

        generatedContainer.appendChild(form);
        return form;
    }

    function init() {
        generatedContainer = document.getElementById('generated-fields');
        generatorHost = document.getElementById('field-generator-host');
        statusBox = document.getElementById('field-generator-status');
        toggle = document.getElementById('field-generator-toggle');
        if (!generatedContainer || !generatorHost || !toggle) {
            return;
        }

        configs = loadConfigs();
        configs.forEach(function (config) {
            createGeneratedField(config);
        });
        if (configs.length > 0) {
            setStatus('Восстановлено полей из localStorage: ' + configs.length + '.', false);
        }

        toggle.addEventListener('change', function () {
            if (!toggle.checked) {
                generatorHost.textContent = '';
                return;
            }
            generatorHost.textContent = '';
            var panel = buildGeneratorPanel();
            generatorHost.appendChild(panel);

            // The first field is generated simultaneously with the controls.
            if (configs.length === 0) {
                var config = defaultConfig();
                configs.push(config);
                persistConfigs();
                createGeneratedField(config);
                setStatus('Создано первое поле. Настройте атрибуты и добавьте ещё.', false);
            }
        });
    }

    document.addEventListener('DOMContentLoaded', init);
})();
