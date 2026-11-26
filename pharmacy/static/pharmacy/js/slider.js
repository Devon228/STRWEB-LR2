/*
 * LR3 task 1 — class-based image slider.
 *
 * Required features:
 *   - next / previous buttons, slide caption, current/max counter (1/3),
 *     clickable pagination;
 *   - loop (wrap from last to first), navs, pags, auto, stopMouseHover, delay;
 *   - each slide is a link (the <a> is in the HTML);
 *   - implemented with a JavaScript class (see `class Slider` below).
 *
 * The owner (administrator) changes the options through the Django form on the
 * home page. The template serialises those options into data-slider-options.
 */
(function () {
    'use strict';

    var DEFAULT_OPTIONS = {
        loop: true,
        navs: true,
        pags: true,
        auto: true,
        stopMouseHover: true,
        delay: 5
    };

    class Slider {
        constructor(root, options) {
            this.root = root;
            this.options = Object.assign({}, DEFAULT_OPTIONS, options || {});
            this.slides = Array.prototype.slice.call(root.querySelectorAll('[data-slide]'));
            this.currentIndex = 0;
            this.timerId = null;
            this.track = root.querySelector('.slider__track');
            this.status = root.querySelector('[data-slider-status]');
            this.navContainer = root.querySelector('[data-slider-navs]');
            this.paginationContainer = root.querySelector('[data-slider-pags]');
        }

        init() {
            if (!this.track || this.slides.length === 0) {
                return;
            }
            this.normaliseOptions();
            this.buildNavigation();
            this.buildPagination();
            this.bindEvents();
            this.goTo(0, false);
            if (this.options.auto) {
                this.startAuto();
            }
        }

        normaliseOptions() {
            // A delay of 0 or a non-number would create a tight infinite loop.
            var delay = Number(this.options.delay);
            this.options.delay = Number.isFinite(delay) && delay > 0 ? delay : DEFAULT_OPTIONS.delay;
            this.options.auto = Boolean(this.options.auto);
            this.options.loop = Boolean(this.options.loop);
            this.options.navs = Boolean(this.options.navs);
            this.options.pags = Boolean(this.options.pags);
            this.options.stopMouseHover = Boolean(this.options.stopMouseHover);
        }

        buildNavigation() {
            if (!this.navContainer) {
                return;
            }
            if (!this.options.navs) {
                // Option navs=false: remove/hide the arrows completely.
                this.navContainer.hidden = true;
                return;
            }
            var previous = document.createElement('button');
            previous.type = 'button';
            previous.className = 'slider__nav';
            previous.textContent = '‹ Назад';
            previous.setAttribute('aria-label', 'Предыдущий слайд');

            var next = document.createElement('button');
            next.type = 'button';
            next.className = 'slider__nav';
            next.textContent = 'Далее ›';
            next.setAttribute('aria-label', 'Следующий слайд');

            previous.addEventListener('click', () => {
                this.previous();
                this.restartAuto();
            });
            next.addEventListener('click', () => {
                this.next();
                this.restartAuto();
            });

            this.navContainer.appendChild(previous);
            this.navContainer.appendChild(next);
        }

        buildPagination() {
            if (!this.paginationContainer) {
                return;
            }
            this.paginationContainer.textContent = '';
            if (!this.options.pags) {
                this.paginationContainer.hidden = true;
                return;
            }
            this.slides.forEach((slide, index) => {
                var button = document.createElement('button');
                button.type = 'button';
                button.className = 'slider__dot';
                button.textContent = String(index + 1);
                button.setAttribute('aria-label', 'Перейти к слайду ' + (index + 1));
                button.addEventListener('click', () => {
                    this.goTo(index, true);
                    this.restartAuto();
                });
                this.paginationContainer.appendChild(button);
            });
        }

        bindEvents() {
            // stopMouseHover works only when auto is enabled: startAuto() is a
            // no-op for a manual slider. mouseenter clears the interval by id;
            // mouseleave creates a new interval.
            if (this.options.stopMouseHover) {
                this.root.addEventListener('mouseenter', () => this.stopAuto());
                this.root.addEventListener('mouseleave', () => this.startAuto());
            }
            this.root.addEventListener('focusin', () => this.stopAuto());
            this.root.addEventListener('focusout', () => this.startAuto());
        }

        goTo(index, userInitiated) {
            if (this.slides.length === 0) {
                return;
            }
            var slidesCount = this.slides.length;
            if (this.options.loop) {
                // Cyclic scrolling: modulo keeps the index in [0, count).
                this.currentIndex = ((index % slidesCount) + slidesCount) % slidesCount;
            } else {
                this.currentIndex = Math.max(0, Math.min(slidesCount - 1, index));
            }
            this.render();
            if (userInitiated) {
                this.restartAuto();
            }
        }

        next() {
            if (!this.options.loop && this.currentIndex === this.slides.length - 1) {
                return;
            }
            this.goTo(this.currentIndex + 1, false);
        }

        previous() {
            if (!this.options.loop && this.currentIndex === 0) {
                return;
            }
            this.goTo(this.currentIndex - 1, false);
        }

        render() {
            // One flex track; translating by 100% per slide is simpler and
            // smoother than hiding/showing slides one by one.
            this.track.style.transform = 'translateX(-' + (this.currentIndex * 100) + '%)';
            this.slides.forEach((slide, index) => {
                var isCurrent = index === this.currentIndex;
                slide.setAttribute('aria-hidden', isCurrent ? 'false' : 'true');
                slide.classList.toggle('is-active', isCurrent);
            });
            if (this.status) {
                this.status.textContent = (this.currentIndex + 1) + '/' + this.slides.length;
            }
            if (this.paginationContainer && this.options.pags) {
                Array.prototype.forEach.call(
                    this.paginationContainer.children,
                    (button, index) => {
                        var isCurrent = index === this.currentIndex;
                        button.classList.toggle('is-active', isCurrent);
                        if (isCurrent) {
                            button.setAttribute('aria-current', 'true');
                        } else {
                            button.removeAttribute('aria-current');
                        }
                    }
                );
            }
        }

        startAuto() {
            this.stopAuto();
            if (!this.options.auto) {
                return;
            }
            // setInterval returns the id used later by clearInterval.
            this.timerId = window.setInterval(() => {
                this.next();
            }, this.options.delay * 1000);
        }

        stopAuto() {
            if (this.timerId !== null) {
                window.clearInterval(this.timerId);
                this.timerId = null;
            }
        }

        restartAuto() {
            if (this.options.auto) {
                this.startAuto();
            }
        }
    }

    window.PharmacySlider = Slider;

    document.addEventListener('DOMContentLoaded', function () {
        document.querySelectorAll('[data-slider]').forEach(function (root) {
            var options = {};
            try {
                options = JSON.parse(root.getAttribute('data-slider-options') || '{}');
            } catch (error) {
                options = {};
            }
            new Slider(root, options).init();
        });
    });
})();
