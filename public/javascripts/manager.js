/**
 * Manager Dashboard JavaScript
 * Handles venue management functionality including unique code generation
 * and capacity calculations for COVID-safe venue operations.
 */

/**
 * Generates a random alphanumeric code for venue check-ins.
 * Uses a mix of uppercase, lowercase letters and numbers for uniqueness.
 *
 * Security Note: This is a client-side convenience function. In a production
 * environment, codes should be generated server-side to prevent duplicates
 * and ensure cryptographic randomness.
 *
 * @param {number} length - The desired length of the generated code
 * @returns {string} A random alphanumeric string
 */
function generateCode(length) {
    var result = '';
    // Character set excludes similar-looking characters (0/O, 1/l) for readability
    var characters = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

/**
 * Generates and displays a unique venue code.
 * Called when the "generate code" button is clicked.
 *
 * @param {number} length - Length of code to generate (default: 6)
 */
function makeid(length) {
    var code = generateCode(length || 6);
    var codeDisplay = document.getElementById('unique_code');
    if (codeDisplay) {
        codeDisplay.textContent = code;
        codeDisplay.style.fontSize = '24px';
        codeDisplay.style.fontWeight = 'bold';
        codeDisplay.style.padding = '10px';
        codeDisplay.style.backgroundColor = '#e8f5e9';
        codeDisplay.style.borderRadius = '5px';
        codeDisplay.style.display = 'inline-block';
        codeDisplay.style.marginTop = '10px';
    }
}

/**
 * Calculates venue capacity based on COVID-safe distancing requirements.
 * Uses 4 square meters per person as per health guidelines.
 *
 * @param {number} area - The total area of the venue in square meters
 * @returns {number} Maximum number of people allowed
 */
function calculateCapacity(area) {
    // COVID-safe requirement: minimum 4 square meters per person
    var sqMetersPerPerson = 4;
    return Math.floor(area / sqMetersPerPerson);
}

/**
 * Updates the capacity display when area input changes.
 * Validates input to ensure only positive numbers are accepted.
 */
function updateCapacity() {
    var areaInput = document.getElementById('venue_area');
    var capacityDisplay = document.getElementById('capacity_result');

    if (areaInput && capacityDisplay) {
        var area = parseFloat(areaInput.value);

        // Input validation: ensure positive number
        if (isNaN(area) || area <= 0) {
            capacityDisplay.textContent = 'Please enter a valid area';
            capacityDisplay.style.color = '#d32f2f';
            return;
        }

        var capacity = calculateCapacity(area);
        capacityDisplay.textContent = capacity + ' people maximum';
        capacityDisplay.style.color = '#2e7d32';
    }
}

// Initialize event listeners when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    var areaInput = document.getElementById('venue_area');
    if (areaInput) {
        areaInput.addEventListener('input', updateCapacity);
    }
});
