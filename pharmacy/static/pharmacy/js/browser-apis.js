/*
 * LR3 task 9 — additional browser APIs.
 *
 * Three independent APIs are demonstrated:
 *   1. Battery Status API — navigator.getBattery();
 *   2. Geolocation API — navigator.geolocation.getCurrentPosition();
 *   3. Speech Synthesis API — window.speechSynthesis.
 *
 * Each block degrades gracefully when a feature is unavailable or permission
 * is denied, so the rest of the lab page remains usable.
 */
(function () {
    'use strict';

    /* ------------------------------- Battery ---------------------------- */

    function initBattery() {
        var status = document.getElementById('battery-status');
        var refresh = document.getElementById('battery-refresh');
        if (!status) {
            return;
        }
        if (!navigator.getBattery) {
            status.textContent = 'Battery Status API не поддерживается этим браузером.';
            if (refresh) {
                refresh.disabled = true;
            }
            return;
        }

        function renderBattery(battery) {
            var level = Math.round(battery.level * 100);
            var charging = battery.charging ? 'заряжается' : 'не заряжается';
            var chargingTime = Number.isFinite(battery.chargingTime)
                ? Math.round(battery.chargingTime / 60) + ' мин до полного заряда'
                : 'время до полного заряда неизвестно';
            var dischargingTime = Number.isFinite(battery.dischargingTime)
                ? Math.round(battery.dischargingTime / 60) + ' мин работы'
                : 'время работы неизвестно';
            status.textContent = 'Заряд: ' + level + '%. Состояние: ' + charging + '. ' +
                (battery.charging ? chargingTime : dischargingTime) + '.';
        }

        function readBattery() {
            navigator.getBattery().then(function (battery) {
                renderBattery(battery);
                ['levelchange', 'chargingchange', 'chargingtimechange', 'dischargingtimechange']
                    .forEach(function (eventName) {
                        battery.addEventListener(eventName, function () {
                            renderBattery(battery);
                        });
                    });
            }).catch(function () {
                status.textContent = 'Не удалось получить состояние батареи.';
            });
        }

        readBattery();
        if (refresh) {
            refresh.addEventListener('click', readBattery);
        }
    }

    /* ----------------------------- Geolocation -------------------------- */

    function initGeolocation() {
        var button = document.getElementById('geolocation-request');
        var status = document.getElementById('geolocation-status');
        var mapLink = document.getElementById('geolocation-map');
        if (!button || !status) {
            return;
        }
        if (!navigator.geolocation) {
            status.textContent = 'Geolocation API не поддерживается этим браузером.';
            button.disabled = true;
            return;
        }

        button.addEventListener('click', function () {
            status.textContent = 'Запрашиваем координаты…';
            navigator.geolocation.getCurrentPosition(
                function (position) {
                    var latitude = position.coords.latitude.toFixed(6);
                    var longitude = position.coords.longitude.toFixed(6);
                    var accuracy = Math.round(position.coords.accuracy);
                    status.textContent =
                        'Широта: ' + latitude + ', долгота: ' + longitude +
                        ', точность: ' + accuracy + ' м.';
                    if (mapLink) {
                        mapLink.href = 'https://www.openstreetmap.org/?mlat=' + latitude +
                            '&mlon=' + longitude + '#map=15/' + latitude + '/' + longitude;
                        mapLink.hidden = false;
                    }
                },
                function (error) {
                    var messages = {
                        1: 'Доступ к геолокации запрещён пользователем.',
                        2: 'Позиция недоступна.',
                        3: 'Истекло время ожидания.'
                    };
                    status.textContent = messages[error.code] || 'Ошибка геолокации.';
                    if (mapLink) {
                        mapLink.hidden = true;
                    }
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
            );
        });
    }

    /* --------------------------- Speech synthesis ----------------------- */

    function initSpeech() {
        var playButton = document.getElementById('speech-play');
        var stopButton = document.getElementById('speech-stop');
        var textInput = document.getElementById('speech-text');
        var voiceSelect = document.getElementById('speech-voice');
        var status = document.getElementById('speech-status');
        if (!playButton || !voiceSelect || !status) {
            return;
        }
        if (!('speechSynthesis' in window)) {
            status.textContent = 'Speech Synthesis API не поддерживается этим браузером.';
            playButton.disabled = true;
            if (stopButton) {
                stopButton.disabled = true;
            }
            return;
        }

        function fillVoices() {
            var voices = window.speechSynthesis.getVoices();
            if (!voices.length) {
                status.textContent = 'Голоса ещё не загрузились.';
                return;
            }
            voiceSelect.textContent = '';
            voices.forEach(function (voice, index) {
                var option = document.createElement('option');
                option.value = String(index);
                option.textContent = voice.name + ' (' + voice.lang + ')';
                voiceSelect.appendChild(option);
            });
            var russianIndex = voices.findIndex(function (voice) {
                return voice.lang && voice.lang.toLowerCase().indexOf('ru') === 0;
            });
            if (russianIndex >= 0) {
                voiceSelect.value = String(russianIndex);
            }
            status.textContent = 'Доступно голосов: ' + voices.length + '.';
        }

        fillVoices();
        window.speechSynthesis.addEventListener('voiceschanged', fillVoices);

        playButton.addEventListener('click', function () {
            var text = textInput ? textInput.value.trim() : '';
            if (!text) {
                status.textContent = 'Введите текст для озвучивания.';
                return;
            }
            var voices = window.speechSynthesis.getVoices();
            var utterance = new SpeechSynthesisUtterance(text);
            var voice = voices[Number(voiceSelect.value)];
            if (voice) {
                utterance.voice = voice;
                utterance.lang = voice.lang;
            } else {
                utterance.lang = 'ru-RU';
            }
            utterance.onstart = function () {
                status.textContent = 'Идёт озвучивание…';
            };
            utterance.onend = function () {
                status.textContent = 'Озвучивание завершено.';
            };
            utterance.onerror = function () {
                status.textContent = 'Не удалось озвучить текст.';
            };
            window.speechSynthesis.cancel();
            window.speechSynthesis.speak(utterance);
        });

        if (stopButton) {
            stopButton.addEventListener('click', function () {
                window.speechSynthesis.cancel();
                status.textContent = 'Озвучивание остановлено.';
            });
        }
    }

    document.addEventListener('DOMContentLoaded', function () {
        initBattery();
        initGeolocation();
        initSpeech();
    });
})();
