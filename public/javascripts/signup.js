/**
 * CovidWatch - Signup Functions
 *
 * Handles user registration from the frontend.
 */

/**
 * Register a new user account
 *
 * Validates form inputs, sends registration request to server,
 * and redirects to login page on success.
 */
function signup() {
    // Get form elements
    var userTypeUser = document.getElementById('user');
    var userTypeManager = document.getElementById('manager');
    var givenNameInput = document.getElementById('given_name');
    var familyNameInput = document.getElementById('family_name');
    var emailInput = document.getElementById('email');
    var usernameInput = document.getElementById('username');
    var passwordInput = document.getElementById('password');
    var confirmPasswordInput = document.getElementById('confirm_password');

    // Determine selected user type
    var userType = null;
    if (userTypeUser && userTypeUser.checked) {
        userType = 'user';
    } else if (userTypeManager && userTypeManager.checked) {
        userType = 'manager';
    }

    // Client-side validation
    if (!userType) {
        alert('Please select an account type (User or Venue Manager)');
        return;
    }

    if (!givenNameInput || !givenNameInput.value.trim()) {
        alert('Please enter your first name');
        return;
    }

    if (!familyNameInput || !familyNameInput.value.trim()) {
        alert('Please enter your last name');
        return;
    }

    if (!emailInput || !emailInput.value.trim()) {
        alert('Please enter your email address');
        return;
    }

    // Basic email format check
    var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(emailInput.value.trim())) {
        alert('Please enter a valid email address');
        return;
    }

    if (!usernameInput || !usernameInput.value.trim()) {
        alert('Please enter a username');
        return;
    }

    // Username format check
    var usernamePattern = /^[a-zA-Z0-9_]{3,30}$/;
    if (!usernamePattern.test(usernameInput.value.trim())) {
        alert('Username must be 3-30 characters and contain only letters, numbers, and underscores');
        return;
    }

    if (!passwordInput || !passwordInput.value) {
        alert('Please enter a password');
        return;
    }

    if (passwordInput.value.length < 6) {
        alert('Password must be at least 6 characters long');
        return;
    }

    // Check password confirmation if the field exists
    if (confirmPasswordInput && confirmPasswordInput.value !== passwordInput.value) {
        alert('Passwords do not match');
        return;
    }

    var userInfo = {
        user: usernameInput.value.trim(),
        pass: passwordInput.value,
        given_name: givenNameInput.value.trim(),
        family_name: familyNameInput.value.trim(),
        email: emailInput.value.trim(),
        type: userType
    };

    var xmlhttp = new XMLHttpRequest();

    xmlhttp.onreadystatechange = function() {
        if (this.readyState === 4) {
            if (this.status === 201 || this.status === 200) {
                // Registration successful - redirect to login page
                alert('Account created successfully! Please log in.');
                window.location.href = '/login.html';
            } else if (this.status === 409) {
                alert('Username or email already exists. Please choose a different one.');
            } else if (this.status === 400) {
                // Try to parse error message from server
                try {
                    var response = JSON.parse(this.responseText);
                    alert(response.error || 'Please check your information and try again.');
                } catch (e) {
                    alert('Please check your information and try again.');
                }
            } else {
                alert('Registration failed. Please try again later.');
            }
        }
    };

    xmlhttp.open('POST', '/users/signup', true);
    xmlhttp.setRequestHeader('Content-Type', 'application/json');
    xmlhttp.send(JSON.stringify(userInfo));
}
