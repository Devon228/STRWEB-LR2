/*
 * LR3 tasks 5 and 6 — catalog pagination + 3D/parallax product cards.
 *
 * Task 5: 3 items per page by default, with an optional user-selectable page
 * size. Both the card grid and the table view are paginated by the same class.
 * Task 6: TiltCard reads the mouse position and writes CSS custom properties;
 * CSS uses those properties for perspective rotation and layer parallax.
 */
(function () {
    'use strict';

    class CatalogPaginator {
        constructor() {
            this.cards = Array.prototype.slice.call(
                document.querySelectorAll('.product-card[data-catalog-item]')
            );
            this.rows = Array.prototype.slice.call(
                document.querySelectorAll('#medication-table-body tr[data-catalog-item]')
            );
            this.pageSizeSelect = document.getElementById('catalog-page-size');
            this.pagination = document.getElementById('catalog-pagination');
            this.status = document.getElementById('catalog-page-status');
            this.totalItems = Math.max(this.cards.length, this.rows.length);
            this.perPage = this.pageSizeSelect ? Number(this.pageSizeSelect.value) || 3 : 3;
            this.page = 1;
        }

        init() {
            if (this.totalItems === 0) {
                if (this.pagination) {
                    this.pagination.hidden = true;
                }
                return;
            }
            if (this.pageSizeSelect) {
                this.pageSizeSelect.addEventListener('change', () => {
                    this.perPage = Math.max(1, Number(this.pageSizeSelect.value) || 3);
                    this.page = 1;
                    this.render();
                });
            }
            this.render();
        }

        totalPages() {
            return Math.max(1, Math.ceil(this.totalItems / this.perPage));
        }

        render() {
            var totalPages = this.totalPages();
            if (this.page > totalPages) {
                this.page = totalPages;
            }
            var start = (this.page - 1) * this.perPage;
            var end = start + this.perPage;

            // `hidden` is enough: CSS already has [hidden] { display:none }.
            this.cards.forEach((card, index) => {
                card.hidden = index < start || index >= end;
            });
            this.rows.forEach((row, index) => {
                row.hidden = index < start || index >= end;
            });

            this.renderPagination(totalPages);
            if (this.status) {
                this.status.textContent =
                    'Страница ' + this.page + ' из ' + totalPages +
                    ' (всего ' + this.totalItems + ' элементов)';
            }
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
            previous.setAttribute('aria-label', 'Предыдущая страница каталога');
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
            next.setAttribute('aria-label', 'Следующая страница каталога');
            next.disabled = this.page >= totalPages;
            next.addEventListener('click', () => {
                if (this.page < totalPages) {
                    this.page += 1;
                    this.render();
                }
            });
            this.pagination.appendChild(next);
        }
    }

    class TiltCard {
        constructor(card) {
            this.card = card;
            this.frameId = null;
            this.lastEvent = null;
        }

        init() {
            // Do not gate this on `(hover: hover)`: some headless browsers
            // report no hover capability, while a desktop mouse still sends
            // mousemove. Touch devices simply never send mousemove, so they
            // are unaffected. Users who prefer reduced motion keep a static card.
            var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            if (reducedMotion) {
                return;
            }
            this.card.addEventListener('mouseenter', () => {
                this.card.classList.add('is-tilting');
            });
            this.card.addEventListener('mousemove', (event) => {
                // Keep only the latest pointer event for the next animation frame.
                this.lastEvent = event;
                if (this.frameId !== null) {
                    return;
                }
                this.frameId = window.requestAnimationFrame(() => {
                    this.frameId = null;
                    this.updateTilt(this.lastEvent);
                });
            });
            this.card.addEventListener('mouseleave', () => {
                this.card.classList.remove('is-tilting');
                this.card.style.setProperty('--tilt-x', '0deg');
                this.card.style.setProperty('--tilt-y', '0deg');
                this.card.style.setProperty('--shift-x', '0px');
                this.card.style.setProperty('--shift-y', '0px');
            });
        }

        updateTilt(event) {
            if (!event) {
                return;
            }
            var rect = this.card.getBoundingClientRect();
            var x = (event.clientX - rect.left) / rect.width;
            var y = (event.clientY - rect.top) / rect.height;
            // Rotate around X based on vertical position (max 10deg) and around
            // Y based on horizontal position (max 12deg).
            var rotateX = (0.5 - y) * 10;
            var rotateY = (x - 0.5) * 12;
            this.card.style.setProperty('--tilt-x', rotateX.toFixed(2) + 'deg');
            this.card.style.setProperty('--tilt-y', rotateY.toFixed(2) + 'deg');
            this.card.style.setProperty('--shift-x', ((x - 0.5) * 10).toFixed(2) + 'px');
            this.card.style.setProperty('--shift-y', ((y - 0.5) * 10).toFixed(2) + 'px');
        }
    }

    document.addEventListener('DOMContentLoaded', function () {
        var pageSizeSelect = document.getElementById('catalog-page-size');
        if (pageSizeSelect || document.querySelector('.product-card[data-catalog-item]')) {
            new CatalogPaginator().init();
        }
        document.querySelectorAll('.product-card').forEach(function (card) {
            new TiltCard(card).init();
        });
    });
})();
