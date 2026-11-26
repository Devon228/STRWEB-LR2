/*
 * LR3 task 11 (variant 14) — scroll animation.
 *
 * The scene contains several medicine bottle images. On every scroll event we
 * read the scene position relative to the viewport and compute progress in the
 * range 0..1. The same formula is used when the user scrolls up, so the bottles
 * move back smoothly (the animation is reversible).
 *
 * Events used:
 *   - window "scroll" (passive listener) — the main animation trigger;
 *   - window "resize" — recalculate after a viewport change;
 *   - IntersectionObserver — add a small reveal animation on first entry.
 */
(function () {
    'use strict';

    class ScrollScene {
        constructor(root) {
            this.root = root;
            this.items = Array.prototype.slice.call(root.querySelectorAll('.scroll-scene__item'));
            this.progress = 0;
            this.frameId = null;
            this.onScroll = this.onScroll.bind(this);
            this.update = this.update.bind(this);
        }

        init() {
            if (!this.root || this.items.length === 0) {
                return;
            }
            // requestAnimationFrame throttles DOM writes to one per frame.
            window.addEventListener('scroll', this.onScroll, { passive: true });
            window.addEventListener('resize', this.onScroll);
            this.observeVisibility();
            this.update();
        }

        observeVisibility() {
            if (!('IntersectionObserver' in window)) {
                return;
            }
            var observer = new IntersectionObserver(
                (entries) => {
                    entries.forEach((entry) => {
                        this.root.classList.toggle('is-visible', entry.isIntersecting);
                    });
                },
                { threshold: 0.15 }
            );
            observer.observe(this.root);
        }

        onScroll() {
            if (this.frameId !== null) {
                return;
            }
            this.frameId = window.requestAnimationFrame(() => {
                this.frameId = null;
                this.update();
            });
        }

        update() {
            var rect = this.root.getBoundingClientRect();
            var viewportHeight = window.innerHeight || document.documentElement.clientHeight;
            var rawProgress = (viewportHeight - rect.top) / (viewportHeight + rect.height);
            this.progress = Math.max(0, Math.min(1, rawProgress));
            this.root.style.setProperty('--scroll-progress', this.progress.toFixed(4));

            this.items.forEach((item, index) => {
                var direction = index % 2 === 0 ? -1 : 1;
                var delay = 0.04 * (index + 1);
                var localProgress = Math.max(0, Math.min(1, this.progress + delay));
                var shiftX = direction * (localProgress * 120);
                var shiftY = (1 - localProgress) * 70;
                var rotation = direction * (5 + localProgress * 22);
                var scale = 0.82 + localProgress * 0.28;
                item.style.transform =
                    'translate3d(' + shiftX.toFixed(2) + 'px, ' +
                    shiftY.toFixed(2) + 'px, 0) rotate(' +
                    rotation.toFixed(2) + 'deg) scale(' + scale.toFixed(3) + ')';
                item.style.opacity = String(0.35 + 0.65 * localProgress);
            });
        }
    }

    document.addEventListener('DOMContentLoaded', function () {
        var scene = document.getElementById('scroll-scene');
        if (scene) {
            new ScrollScene(scene).init();
        }
    });
})();
