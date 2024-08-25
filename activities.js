document.addEventListener('DOMContentLoaded', function () {
    // Add event listeners to calendar days
    document.querySelectorAll('.calendar-day').forEach(day => {
        day.addEventListener('click', function () {
            const selectedDate = this.dataset.date;

            // Fetch health data for the selected date
            fetch(`/get-health-data?date=${selectedDate}`)
                .then(response => response.json())
                .then(data => {
                    // Clear previous data
                    const postsContainer = document.querySelector('#your-data .posts');
                    postsContainer.innerHTML = '';

                    // Populate new data
                    if (data.length > 0) {
                        data.forEach(stat => {
                            postsContainer.innerHTML += `
                                <div class="post">
                                    <p><strong> Date: ${new Date(stat.date).toLocaleDateString()} </strong> - Calories: ${stat.calories}, Steps: ${stat.steps}, MVPA: ${stat.mvpa}, Sleep: ${stat.sleep} hours</p>
                                </div>`;
                        });
                    } else {
                        postsContainer.innerHTML = '<p>No data available for this date.</p>';
                    }
                })
                .catch(error => console.error('Error fetching health data:', error));
        });
    });
});



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