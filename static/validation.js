// Validation patterns
const patterns = {
    version: /^\d+\.\d+\.\d+$/,
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    regionId: /^[a-z]{2,4}\d{1,2}$/,
    identifier: /^[a-z0-9-]+$/
};

// Error messages
const errorMessages = {
    required: "This field is required",
    version: "Version must be in format X.Y.Z (e.g., 15.4.1)",
    email: "Please enter a valid email address",
    regionId: "Region ID must be 2-4 letters followed by 1-2 numbers (e.g., use1)",
    identifier: "Only lowercase letters, numbers, and hyphens are allowed"
};

// Validation state
let formErrors = new Map();

// Add error display
function showError(inputElement, message) {
    // Remove any existing error message
    removeError(inputElement);
    
    // Create and insert error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    errorDiv.style.color = '#dc3545';
    errorDiv.style.fontSize = '0.875rem';
    errorDiv.style.marginTop = '0.25rem';
    
    inputElement.parentNode.appendChild(errorDiv);
    inputElement.style.borderColor = '#dc3545';
    
    // Store error
    formErrors.set(inputElement.name, message);
    
    // Update submit button state
    updateSubmitButton();
}

// Remove error display
function removeError(inputElement) {
    const errorDiv = inputElement.parentNode.querySelector('.error-message');
    if (errorDiv) {
        errorDiv.remove();
    }
    inputElement.style.borderColor = '';
    
    // Remove error from storage
    formErrors.delete(inputElement.name);
    
    // Update submit button state
    updateSubmitButton();
}

// Update submit button state
function updateSubmitButton() {
    const submitButton = document.querySelector('button[type="submit"]');
    if (submitButton) {
        submitButton.disabled = formErrors.size > 0;
    }
}

// Validate a single field
function validateField(input) {
    // Skip validation if field is not visible
    if (input.offsetParent === null) {
        removeError(input);
        return true;
    }

    const value = input.value.trim();
    
    // Required field validation
    if (input.hasAttribute('required') && !value) {
        showError(input, errorMessages.required);
        return false;
    }
    
    // Skip other validations if field is empty and not required
    if (!value) {
        removeError(input);
        return true;
    }
    
    // Pattern validation based on field name or type
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
    
    // If we get here, validation passed
    removeError(input);
    return true;
}

// Initialize validation
document.addEventListener('DOMContentLoaded', function() {
    // Add validation to all form inputs
    document.querySelectorAll('input, select').forEach(input => {
        // Validate on blur
        input.addEventListener('blur', function() {
            validateField(this);
        });
        
        // Validate on input change (for immediate feedback)
        input.addEventListener('input', function() {
            if (formErrors.has(this.name)) {
                validateField(this);
            }
        });
    });
    
    // Form submit validation
    document.querySelector('form').addEventListener('submit', function(e) {
        let isValid = true;
        
        // Validate all visible fields
        this.querySelectorAll('input, select').forEach(input => {
            if (input.offsetParent !== null) { // Only validate visible fields
                if (!validateField(input)) {
                    isValid = false;
                }
            }
        });
        
        if (!isValid) {
            e.preventDefault();
            // Scroll to first error
            const firstError = document.querySelector('.error-message');
            if (firstError) {
                firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    });
}); 