// Define regular expression patterns for form validation
const patterns = {
    version: /^\d+\.\d+\.\d+$/,  // Matches version numbers like 15.4.1
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,  // Basic email validation
    regionId: /^[a-z]{2,4}\d{1,2}$/,  // Matches region IDs like 'use1' or 'usw2'
    identifier: /^[a-z0-9-]+$/  // Matches lowercase letters, numbers, and hyphens
};

// Define error messages for different validation scenarios
const errorMessages = {
    required: "This field is required",
    version: "Version must be in format X.Y.Z (e.g., 15.4.1)",
    email: "Please enter a valid email address",
    regionId: "Region ID must be 2-4 letters followed by 1-2 numbers (e.g., use1)",
    identifier: "Only lowercase letters, numbers, and hyphens are allowed"
};

// Store validation errors in a Map for tracking form state
let formErrors = new Map();

// Function to display error message below an input field
function showError(inputElement, message) {
    // Remove any existing error message first
    removeError(inputElement);
    
    // Create and style error message element
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    errorDiv.style.color = '#dc3545';
    errorDiv.style.fontSize = '0.875rem';
    errorDiv.style.marginTop = '0.25rem';
    
    // Add error message to DOM
    inputElement.parentNode.appendChild(errorDiv);
    inputElement.style.borderColor = '#dc3545';
    
    // Track error in the Map
    formErrors.set(inputElement.name, message);
    
    // Update submit button state based on errors
    updateSubmitButton();
}

// Function to remove error message from an input field
function removeError(inputElement) {
    const errorDiv = inputElement.parentNode.querySelector('.error-message');
    if (errorDiv) {
        errorDiv.remove();
    }
    inputElement.style.borderColor = '';
    
    // Remove error from tracking Map
    formErrors.delete(inputElement.name);
    
    // Update submit button state
    updateSubmitButton();
}

// Function to enable/disable submit button based on validation state
function updateSubmitButton() {
    const submitButton = document.querySelector('button[type="submit"]');
    if (submitButton) {
        submitButton.disabled = formErrors.size > 0;
    }
}

// Main validation function for individual form fields
function validateField(input) {
    // Skip validation for hidden fields
    if (input.offsetParent === null) {
        removeError(input);
        return true;
    }

    const value = input.value.trim();
    
    // Check required fields
    if (input.hasAttribute('required') && !value) {
        showError(input, errorMessages.required);
        return false;
    }
    
    // Skip validation for empty optional fields
    if (!value) {
        removeError(input);
        return true;
    }
    
    // Apply specific validation rules based on field name
    if (input.name.includes('version')) {
        if (!patterns.version.test(value)) {
            showError(input, errorMessages.version);
            return false;
        }
    }
    else if (input.name.includes('manager')) {
        if (!patterns.email.test(value)) {
            showError(input, errorMessages.email);
            return false;
        }
    }
    else if (input.name.includes('region_identifier')) {
        if (!patterns.regionId.test(value)) {
            showError(input, errorMessages.regionId);
            return false;
        }
    }
    else if (input.name.includes('customer_identifier')) {
        if (!patterns.identifier.test(value)) {
            showError(input, errorMessages.identifier);
            return false;
        }
    }
    
    // If all validation passes, remove any existing errors
    removeError(input);
    return true;
}

// Initialize form validation when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Add validation listeners to all form inputs
    document.querySelectorAll('input, select').forEach(input => {
        // Validate when focus leaves the field
        input.addEventListener('blur', function() {
            validateField(this);
        });
        
        // Validate on input change if field already has an error
        input.addEventListener('input', function() {
            if (formErrors.has(this.name)) {
                validateField(this);
            }
        });
    });
    
    // Add form submit validation
    document.querySelector('form').addEventListener('submit', function(e) {
        let isValid = true;
        
        // Validate all visible fields before submit
        this.querySelectorAll('input, select').forEach(input => {
            if (input.offsetParent !== null) { // Only validate visible fields
                if (!validateField(input)) {
                    isValid = false;
                }
            }
        });
        
        // Prevent form submission if validation fails
        if (!isValid) {
            e.preventDefault();
            // Scroll to first error for user visibility
            const firstError = document.querySelector('.error-message');
            if (firstError) {
                firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    });
}); 