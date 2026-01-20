/**
 * CovidWatch - Home Page Functions
 *
 * This file contains the main functionality for the home page including:
 * - User authentication state management (show/hide UI elements)
 * - Dropdown menu functionality
 * - Venue check-in functionality
 * - User account information retrieval
 * - Check-in history display
 */

/**
 * Toggle the user dropdown menu
 * Called when the user icon button is clicked
 */
function dropdown() {
    document.getElementById('myDropdown').classList.toggle('show');
}

/**
 * Close dropdown when clicking outside of it
 * Improves user experience by automatically closing the menu
 */
window.onclick = function(event) {
    if (!event.target.matches('.dropbtn')) {
        var dropdowns = document.getElementsByClassName('dropdown-content');
        for (var i = 0; i < dropdowns.length; i++) {
            var openDropdown = dropdowns[i];
            if (openDropdown.classList.contains('show')) {
                openDropdown.classList.remove('show');
            }
        }
    }
};

/**
 * Show or hide UI elements based on login status
 *
 * Makes an AJAX request to check if the user is logged in,
 * then shows/hides appropriate navigation elements.
 *
 * Elements with class "logged_in" are shown when authenticated.
 * Elements with class "logged_out" are shown when not authenticated.
 */
function showHide() {
    var loggedInElements = document.getElementsByClassName('logged_in');
    var loggedOutElements = document.getElementsByClassName('logged_out');

    var xmlhttp = new XMLHttpRequest();

    xmlhttp.onreadystatechange = function() {
        if (this.readyState === 4 && this.status === 200) {
            var isLoggedIn = this.responseText === 'in';

            // Show/hide elements based on login status
            for (var i = 0; i < loggedInElements.length; i++) {
                loggedInElements[i].style.display = isLoggedIn ? 'block' : 'none';
            }
            for (var j = 0; j < loggedOutElements.length; j++) {
                loggedOutElements[j].style.display = isLoggedIn ? 'none' : 'block';
            }
        }
    };

    xmlhttp.open('GET', '/header', true);
    xmlhttp.send();
}

/**
 * Collapsible sections functionality
 * Allows sections to expand/collapse when clicked
 */
document.addEventListener('DOMContentLoaded', function() {
    var collapsibles = document.getElementsByClassName('collapsible');

    for (var i = 0; i < collapsibles.length; i++) {
        collapsibles[i].addEventListener('click', function() {
            this.classList.toggle('active');
            var content = this.nextElementSibling;
            if (content && content.classList.contains('content')) {
                if (content.style.display === 'block') {
                    content.style.display = 'none';
                } else {
                    content.style.display = 'block';
                }
            }
        });
    }
});

/**
 * Record a venue check-in
 *
 * Gets the check-in code from the input field, generates the current
 * date and time, and sends a check-in request to the server.
 *
 * Security Note: The username is taken from the server session,
 * not from a client-side input, preventing users from checking in
 * as other users.
 */
function check_ins() {
    var checkInInput = document.getElementById('check_in');

    if (!checkInInput || !checkInInput.value.trim()) {
        alert('Please enter a venue check-in code');
        return;
    }

    var checkInCode = checkInInput.value.trim();

    // Validate check-in code format (alphanumeric, 4-10 characters)
    if (!/^[a-zA-Z0-9]{4,10}$/.test(checkInCode)) {
        alert('Invalid check-in code. Please enter a valid venue code.');
        return;
    }

    // Generate current date in YYYY-MM-DD format
    var d = new Date();
    var yyyy = d.getFullYear();
    var mm = String(d.getMonth() + 1).padStart(2, '0');
    var dd = String(d.getDate()).padStart(2, '0');
    var myDate = yyyy + '-' + mm + '-' + dd;

    // Generate current time in HH:MM:SS format
    var myTime = d.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });

    var info = {
        check_in: checkInCode,
        date: myDate,
        time: myTime
    };

    var xmlhttp = new XMLHttpRequest();

    xmlhttp.onreadystatechange = function() {
        if (this.readyState === 4) {
            if (this.status === 201 || this.status === 200) {
                alert('Check-in successful!');
                checkInInput.value = ''; // Clear the input
            } else if (this.status === 401) {
                alert('Please log in to check in to a venue');
                window.location.href = '/login.html';
            } else if (this.status === 400) {
                alert('Invalid check-in code format');
            } else {
                alert('Check-in failed. Please try again.');
            }
        }
    };

    xmlhttp.open('POST', '/users/check_in', true);
    xmlhttp.setRequestHeader('Content-Type', 'application/json');
    xmlhttp.send(JSON.stringify(info));
}

/**
 * Fetch and display the current user's username
 * Updates the element with id="username" with the user's name
 */
function username() {
    var xmlhttp = new XMLHttpRequest();

    xmlhttp.onreadystatechange = function() {
        if (this.readyState === 4 && this.status === 200) {
            var usernameElement = document.getElementById('username');
            if (usernameElement) {
                usernameElement.textContent = 'Username: ' + this.responseText;
            }
        }
    };

    xmlhttp.open('GET', '/username', true);
    xmlhttp.send();
}

/**
 * Fetch and display the current user's email address
 * Updates the element with id="email" with the user's email
 */
function email() {
    var xmlhttp = new XMLHttpRequest();

    xmlhttp.onreadystatechange = function() {
        if (this.readyState === 4 && this.status === 200) {
            var emailElement = document.getElementById('email');
            if (emailElement) {
                // Keep any existing buttons/elements, just update the text
                var textNode = emailElement.firstChild;
                if (textNode && textNode.nodeType === Node.TEXT_NODE) {
                    textNode.textContent = 'Email: ' + this.responseText + ' ';
                } else {
                    emailElement.insertBefore(
                        document.createTextNode('Email: ' + this.responseText + ' '),
                        emailElement.firstChild
                    );
                }
            }
        }
    };

    xmlhttp.open('GET', '/email', true);
    xmlhttp.send();
}

/**
 * Fetch and display the user's check-in history
 *
 * Makes a POST request to retrieve check-in history and displays
 * it as a formatted table in the element with id="history"
 */
function history() {
    var xmlhttp = new XMLHttpRequest();

    xmlhttp.onreadystatechange = function() {
        if (this.readyState === 4) {
            var historyElement = document.getElementById('history');
            if (!historyElement) return;

            if (this.status === 200) {
                try {
                    var data = JSON.parse(this.responseText);

                    if (data.length === 0) {
                        historyElement.innerHTML = '<p>No check-in history found.</p>';
                        return;
                    }

                    // Build a table to display history
                    var html = '<table class="history-table">';
                    html += '<thead><tr><th>Venue Code</th><th>Date</th><th>Time</th></tr></thead>';
                    html += '<tbody>';

                    for (var i = 0; i < data.length; i++) {
                        var record = data[i];
                        // Sanitize output to prevent XSS
                        var code = escapeHtml(record.check_in_code || '');
                        var date = escapeHtml(record.date_ || '');
                        var time = escapeHtml(record.time_ || '');

                        html += '<tr>';
                        html += '<td>' + code + '</td>';
                        html += '<td>' + date + '</td>';
                        html += '<td>' + time + '</td>';
                        html += '</tr>';
                    }

                    html += '</tbody></table>';
                    historyElement.innerHTML = html;
                } catch (e) {
                    historyElement.innerHTML = '<p>Error loading history.</p>';
                }
            } else if (this.status === 401) {
                historyElement.innerHTML = '<p>Please log in to view your history.</p>';
            } else {
                historyElement.innerHTML = '<p>Error loading history.</p>';
            }
        }
    };

    xmlhttp.open('POST', '/users/history', true);
    xmlhttp.setRequestHeader('Content-Type', 'application/json');
    xmlhttp.send();
}

/**
 * Escape HTML special characters to prevent XSS attacks
 *
 * Security Note: Always escape user-generated content before
 * inserting it into the DOM to prevent cross-site scripting attacks.
 *
 * @param {string} text - The text to escape
 * @returns {string} The escaped text
 */
function escapeHtml(text) {
    if (!text) return '';
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
