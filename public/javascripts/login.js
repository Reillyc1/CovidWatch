/**
 * CovidWatch - Login/Logout Functions
 *
 * Handles user authentication actions from the frontend.
 */

/**
 * Attempt to log in the user
 *
 * Sends credentials to the server and redirects on success.
 * Shows an alert message if login fails.
 */
function login() {
    var usernameInput = document.getElementById('username');
    var passwordInput = document.getElementById('password');

    // Basic client-side validation
    if (!usernameInput || !usernameInput.value.trim()) {
        alert('Please enter your username');
        return;
    }

    if (!passwordInput || !passwordInput.value) {
        alert('Please enter your password');
        return;
    }

    var userInfo = {
        user: usernameInput.value.trim(),
        pass: passwordInput.value
    };

    var xmlhttp = new XMLHttpRequest();

    xmlhttp.onreadystatechange = function() {
        if (this.readyState === 4) {
            if (this.status === 200) {
                // Login successful - redirect to home page
                window.location.href = '/';
            } else if (this.status === 401) {
                alert('Invalid username or password');
            } else if (this.status === 400) {
                alert('Please enter a valid username and password');
            } else {
                alert('Login failed. Please try again.');
            }
        }
    };

    xmlhttp.open('POST', '/users/login', true);
    xmlhttp.setRequestHeader('Content-Type', 'application/json');
    xmlhttp.send(JSON.stringify(userInfo));
}

/**
 * Log out the current user
 *
 * Sends logout request to server and waits for completion
 * before redirecting to home page.
 *
 * Security Note: We wait for the server response before redirecting
 * to ensure the session is properly destroyed on the server side.
 * This prevents a race condition where the redirect happens before
 * the session is cleared.
 */
function logout() {
    var xmlhttp = new XMLHttpRequest();

    xmlhttp.onreadystatechange = function() {
        if (this.readyState === 4) {
            // Redirect to home page after logout completes
            // (regardless of success/failure - user should be logged out either way)
            window.location.href = '/';
        }
    };

    xmlhttp.open('POST', '/users/logout', true);
    xmlhttp.send();
}
