// public/js/healthTrackerChart.js

document.addEventListener('DOMContentLoaded', function() {
    const ctx = document.getElementById('myChart').getContext('2d');

    // Define the dynamic data (you will replace these with actual values from EJS)
    const calories = parseFloat(document.getElementById('calories-data').value);
    const steps = parseFloat(document.getElementById('steps-data').value);
    const mvpa = parseFloat(document.getElementById('mvpa-data').value);
    const sleep = parseFloat(document.getElementById('sleep-data').value);

    // Calculate angles for the doughnut chart
    const caloriesAngle = Math.min((calories / 2000) * 45, 45);
    const stepsAngle = Math.min((steps / 5000) * 45, 45);
    const mvpaAngle = Math.min((mvpa / 30) * 45, 45);
    const sleepAngle = Math.min((sleep / 7) * 45, 45);

    const myChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Calories', '', 'Steps', '', 'MVPA', '', 'Sleep', ''],
            datasets: [{
                data: [
                    caloriesAngle,
                    45 - caloriesAngle,
                    stepsAngle,
                    45 - stepsAngle,
                    mvpaAngle,
                    45 - mvpaAngle,
                    sleepAngle,
                    45 - sleepAngle
                ],
                backgroundColor: [
                    'rgba(255, 99, 132, 0.2)',
                    'rgba(192, 192, 192, 0.2)',
                    'rgba(54, 162, 235, 0.2)',
                    'rgba(192, 192, 192, 0.2)',
                    'rgba(255, 206, 86, 0.2)',
                    'rgba(192, 192, 192, 0.2)',
                    'rgba(75, 192, 192, 0.2)',
                    'rgba(192, 192, 192, 0.2)'
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(255, 255, 255, 0)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 255, 255, 0)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(255, 255, 255, 0)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(255, 255, 255, 0)'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            rotation: 270,
            circumference: 180,
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const labelIndex = context.dataIndex / 2;
                            const labels = [
                                `${calories} Calories`,
                                `${steps} Steps`,
                                `${mvpa} Mins`,
                                `${sleep} Hours`
                            ];
                            return labels[Math.floor(labelIndex)];
                        }
                    },
                    displayColors: false,
                },
                legend: {
                    labels: {
                        filter: function(legendItem, chartData) {
                            return chartData.labels[legendItem.index] !== '';
                        }
                    }
                }
            }
        }
    });
});
