function fetchHealthStats(selectedDate) {
    fetch(`/get-health-stats?date=${selectedDate}`)
        .then(response => response.json())
        .then(data => {
            const healthStatsDiv = document.getElementById('health-stats');
            healthStatsDiv.innerHTML = '';  // Clear previous data

            if (data.length === 0) {
                healthStatsDiv.innerHTML = '<p>No data available for this date.</p>';
            } else {
                data.forEach(stat => {
                    const statElement = document.createElement('p');
                    statElement.textContent = `${stat.stat_type}: ${stat.stat_value}`;
                    healthStatsDiv.appendChild(statElement);
                });
            }
        })
        .catch(error => {
            console.error('Error fetching health stats:', error);
        });
}
