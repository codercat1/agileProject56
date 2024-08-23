// Function to fetch health stats for a selected date
function fetchHealthStats(date) {
    fetch(`/get-health-stats?date=${date}`)
        .then(response => response.json())
        .then(data => {
            healthStatsDiv.innerHTML = ''; // Clear previous data

            if (data && Object.keys(data).length > 0) {
                const statsContent = `
                    <p>Calories Consumed: ${data.calories_consumed ?? 'N/A'}</p>
                    <p>Steps Taken: ${data.steps_taken ?? 'N/A'}</p>
                    <p>MVPA (mins): ${data.mvpa ?? 'N/A'}</p>
                    <p>Sleep (hours): ${data.sleep_hours ?? 'N/A'}</p>
                `;
                healthStatsDiv.innerHTML = statsContent;
            } else {
                healthStatsDiv.innerHTML = '<p>No data available for this date.</p>';
            }
        })
        .catch(error => {
            console.error('Error fetching health stats:', error);
            healthStatsDiv.innerHTML = '<p>Error fetching data. Please try again later.</p>';
        });
}

// Function to fetch notes for a selected date
function fetchNotes(date) {
    fetch(`/get-notes?date=${date}`)
        .then(response => response.json())
        .then(data => {
            if (data && data.note) {
                notesContentDiv.innerHTML = `<p>${data.note}</p>`;
                notesTextarea.value = data.note;
            } else {
                notesContentDiv.innerHTML = '<p>No notes for this date.</p>';
                notesTextarea.value = '';
            }
        })
        .catch(error => {
            console.error('Error fetching notes:', error);
            notesContentDiv.innerHTML = '<p>Error fetching notes. Please try again later.</p>';
        });
}

// Function to save notes for the selected date
saveNotesButton.addEventListener('click', function() {
    if (!selectedDateGlobal) {
        alert('Please select a date from the calendar before saving notes.');
        return;
    }

    const noteContent = notesTextarea.value.trim();

    fetch('/save-notes', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            date: selectedDateGlobal,
            note: noteContent
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            notesContentDiv.innerHTML = `<p>${noteContent}</p>`;
            alert('Notes saved successfully.');
        } else {
            alert('Failed to save notes. Please try again.');
        }
    })
    .catch(error => {
        console.error('Error saving notes:', error);
        alert('Error saving notes. Please try again later.');
    });
});