/*
 * LR3 task 10 — Chart.js (variant 14).
 *
 * The server (JsLabView) calculates two datasets for
 *     ln(1 - x) = -sum(x^k / k), |x| < 1:
 *   - the partial sum of the series for n terms;
 *   - the exact math.log(1 - x) value.
 * The data is embedded into the page with Django's json_script.
 *
 * The chart uses:
 *   - axes titles, legend and title/subtitle;
 *   - a custom plugin that draws an annotation box inside the canvas;
 *   - Chart.js animation and a "replay" button;
 *   - toBase64Image() + a temporary <a download> to save the chart as PNG.
 */
(function () {
    'use strict';

    function readChartData() {
        var dataElement = document.getElementById('chart-data');
        if (!dataElement) {
            return null;
        }
        try {
            return JSON.parse(dataElement.textContent);
        } catch (error) {
            return null;
        }
    }

    var annotationPlugin = {
        id: 'annotationBox',
        afterDatasetsDraw: function (chart) {
            var context = chart.ctx;
            var area = chart.chartArea;
            var text = 'Вариант 14: ln(1 − x) = −Σ x^k / k, n = ' +
                (chart.options.plugins.lr3terms || 12);
            context.save();
            context.font = '600 12px Montserrat, Arial, sans-serif';
            var padding = 8;
            var width = context.measureText(text).width + padding * 2;
            var height = 26;
            var x = area.left + 12;
            var y = area.top + 12;
            context.fillStyle = 'rgba(255, 255, 255, 0.88)';
            context.strokeStyle = 'rgba(29, 78, 216, 0.7)';
            context.lineWidth = 1;
            // Draw a rounded rectangle manually: CanvasRenderingContext2D
            // roundRect is not available in every browser version.
            var radius = 9;
            context.beginPath();
            context.moveTo(x + radius, y);
            context.lineTo(x + width - radius, y);
            context.quadraticCurveTo(x + width, y, x + width, y + radius);
            context.lineTo(x + width, y + height - radius);
            context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
            context.lineTo(x + radius, y + height);
            context.quadraticCurveTo(x, y + height, x, y + height - radius);
            context.lineTo(x, y + radius);
            context.quadraticCurveTo(x, y, x + radius, y);
            context.closePath();
            context.fill();
            context.stroke();
            context.fillStyle = '#1e3a8a';
            context.fillText(text, x + padding, y + 17);
            context.restore();
        }
    };

    function initChart() {
        var canvas = document.getElementById('series-chart');
        var data = readChartData();
        var status = document.getElementById('chart-status');
        if (!canvas || !data) {
            return;
        }
        if (typeof window.Chart === 'undefined') {
            if (status) {
                status.textContent = 'Chart.js не загрузилась. Проверьте локальный файл vendor/chart.umd.min.js.';
            }
            return;
        }

        var chart = new Chart(canvas, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [
                    {
                        label: 'Сумма ряда (n = ' + data.terms + ')',
                        data: data.series,
                        borderColor: '#b91c1c',
                        backgroundColor: 'rgba(185, 28, 28, 0.12)',
                        borderWidth: 2,
                        pointRadius: 3,
                        pointHoverRadius: 5,
                        tension: 0.25,
                        fill: false
                    },
                    {
                        label: 'Math.log(1 − x)',
                        data: data.exact,
                        borderColor: '#1d4ed8',
                        backgroundColor: 'rgba(29, 78, 216, 0.12)',
                        borderWidth: 2,
                        pointRadius: 3,
                        pointHoverRadius: 5,
                        tension: 0.25,
                        fill: false
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: 1400,
                    easing: 'easeOutQuart'
                },
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                plugins: {
                    lr3terms: data.terms,
                    legend: {
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            boxWidth: 12
                        }
                    },
                    title: {
                        display: true,
                        text: 'Разложение ln(1 − x) в ряд (вариант 14)',
                        font: { size: 17, weight: '700' },
                        color: '#1e3a8a',
                        padding: { bottom: 6 }
                    },
                    subtitle: {
                        display: true,
                        text: 'Красная линия — частичная сумма ряда; синяя — значение функции через Math.log',
                        font: { size: 12 },
                        color: '#5a6069',
                        padding: { bottom: 16 }
                    },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                return context.dataset.label + ': ' + context.formattedValue;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'x'
                        },
                        grid: { color: 'rgba(148, 163, 184, 0.25)' }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'F(x)'
                        },
                        grid: { color: 'rgba(148, 163, 184, 0.25)' }
                    }
                }
            },
            plugins: [annotationPlugin]
        });

        var downloadButton = document.getElementById('chart-download');
        if (downloadButton) {
            downloadButton.addEventListener('click', function () {
                // Create a temporary link, trigger a click and remove it.
                var link = document.createElement('a');
                link.download = 'lr3-chart-variant-14.png';
                link.href = chart.toBase64Image('image/png', 1);
                document.body.appendChild(link);
                link.click();
                link.remove();
                if (status) {
                    status.textContent = 'График сохранён в PNG.';
                }
            });
        }

        var replayButton = document.getElementById('chart-replay');
        if (replayButton) {
            replayButton.addEventListener('click', function () {
                chart.reset();
                chart.update();
                if (status) {
                    status.textContent = 'Анимация построения перезапущена.';
                }
            });
        }
    }

    document.addEventListener('DOMContentLoaded', initChart);
})();
