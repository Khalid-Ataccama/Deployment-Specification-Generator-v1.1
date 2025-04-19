// Debug log to confirm script loading
console.log("Script loaded and working!");

// Event listener for deployment style selection
document.getElementById("deployment_style").addEventListener("change", function () {
  const selectedStyle = this.value;
  console.log("Deployment style selected:", selectedStyle);
  const submitSection = document.getElementById("submit-section");
  const cloudFields = document.getElementById("cloud-fields");
  const dedicatedFields = document.getElementById("dedicated-fields");

  // Hide all form sections initially
  cloudFields.classList.add("hidden");
  dedicatedFields.classList.add("hidden");
  submitSection.classList.add("hidden");

  // Enable all form inputs first to reset state
  const allInputs = document.querySelectorAll('input, select');
  allInputs.forEach(input => input.disabled = false);

  // Show relevant sections based on deployment style
  if (selectedStyle === "cloud") {
    cloudFields.classList.remove("hidden");
    submitSection.classList.remove("hidden");
    // Disable all inputs in the dedicated section
    const dedicatedInputs = dedicatedFields.querySelectorAll('input, select');
    dedicatedInputs.forEach(input => input.disabled = true);
  } else if (selectedStyle === "dedicated") {
    dedicatedFields.classList.remove("hidden");
    submitSection.classList.remove("hidden");
    // Disable all inputs in the cloud section
    const cloudInputs = cloudFields.querySelectorAll('input, select');
    cloudInputs.forEach(input => input.disabled = true);
  }
});
  
// Handle Cloud SSO vendor selection
document.addEventListener("DOMContentLoaded", function () {
  const ssoCloud = document.getElementById("cloud_sso_vendor");
  const ssoCloudOtherGroup = document.getElementById("cloud_sso_vendor_other_group");

  if (ssoCloud) {
    // Show/hide "Other" input field based on SSO vendor selection
    ssoCloud.addEventListener("change", function () {
    if (this.value === "Other") {
        ssoCloudOtherGroup.style.display = "block";
    } else {
        ssoCloudOtherGroup.style.display = "none";
        document.getElementById("cloud_sso_vendor_other").value = "";
    }
    });
}
});

// Handle Dedicated SSO vendor selection
document.addEventListener("DOMContentLoaded", function () {
  const ssoDedicated = document.getElementById("dedicated_sso_vendor");
  const ssoDedicatedOtherGroup = document.getElementById("dedicated_sso_vendor_other_group");

  if (ssoDedicated) {
    // Show/hide "Other" input field based on SSO vendor selection
    ssoDedicated.addEventListener("change", function () {
    if (this.value === "Other") {
        ssoDedicatedOtherGroup.style.display = "block";
    } else {
        ssoDedicatedOtherGroup.style.display = "none";
        document.getElementById("dedicated_sso_vendor_other").value = "";
    }
    });
}
});

// Handle dedicated deployment "Other" environment option
document.addEventListener('DOMContentLoaded', function () {
  const otherEnvCheckbox = document.getElementById('dedicated-other-env-checkbox');
  const otherEnvInput = document.getElementById('dedicated-other-env-input');

if (otherEnvCheckbox && otherEnvInput) {
    // Show/hide custom environment input based on checkbox
    otherEnvCheckbox.addEventListener('change', function () {
    otherEnvInput.style.display = this.checked ? 'block' : 'none';
    });
}
});

// Handle cloud environment fields generation
document.addEventListener('DOMContentLoaded', function () {
  const envInput = document.querySelector('input[name="cloud_number_of_envs"]');
  const container = document.getElementById('cloud-environment-fields-container');

  if (envInput && container) {
    // Set input constraints
    envInput.setAttribute('min', '1');
    envInput.setAttribute('max', '6');

    // Generate environment fields dynamically based on number input
    envInput.addEventListener('input', function () {
    const num = parseInt(envInput.value);
    container.innerHTML = ''; // Clear existing fields

      // Validate number of environments
      if (isNaN(num) || num < 1 || num > 6) {
        envInput.setCustomValidity('Number of environments must be between 1 and 6');
        envInput.reportValidity();
        return;
      } else {
        envInput.setCustomValidity('');
      }

      // Create form fields for each environment
      for (let i = 0; i < num; i++) {
        const group = document.createElement('div');
        group.className = 'environment-group';

        const heading = document.createElement('h3');
        heading.textContent = `Environment ${i + 1}`;
        group.appendChild(heading);

        const fieldsContainer = document.createElement('div');
        fieldsContainer.className = 'environment-fields';

        // Create name field
        const nameField = document.createElement('div');
        nameField.className = 'environment-field';
        nameField.innerHTML = `
          <label>Name</label>
          <input type="text" name="cloud_env_name_${i}" required placeholder="e.g., dev">
        `;

        // Create identifier field
        const idField = document.createElement('div');
        idField.className = 'environment-field';
        idField.innerHTML = `
          <label>Identifier</label>
          <input type="text" name="cloud_env_identifier_${i}" required placeholder="e.g., abc123">
        `;

        fieldsContainer.appendChild(nameField);
        fieldsContainer.appendChild(idField);
        group.appendChild(fieldsContainer);
        container.appendChild(group);
      }
    });

    // Validate number of environments when focus leaves the input
    envInput.addEventListener('blur', function() {
      const num = parseInt(envInput.value);
      if (isNaN(num) || num < 1 || num > 6) {
        envInput.setCustomValidity('Number of environments must be between 1 and 6');
        envInput.reportValidity();
      } else {
        envInput.setCustomValidity('');
      }
    });
  }
});

// Basic form validation function
function validateForm() {
  const deploymentStyle = document.getElementById('deployment_style').value;
  const customerName = document.getElementById('customer_name').value;
  
  // Check basic required fields
  if (!deploymentStyle || !customerName) {
    alert('Please fill in all required fields');
    return false;
  }

  // Validate cloud deployment specific fields
  if (deploymentStyle === 'cloud') {
    const numEnvs = parseInt(document.querySelector('input[name="cloud_number_of_envs"]').value);
    if (isNaN(numEnvs) || numEnvs < 1 || numEnvs > 6) {
      alert('Please enter a valid number of environments (1-6)');
      return false;
    }

    // Validate all environment fields are filled
    for (let i = 0; i < numEnvs; i++) {
      const envName = document.querySelector(`input[name="cloud_env_name_${i}"]`);
      const envId = document.querySelector(`input[name="cloud_env_identifier_${i}"]`);
      
      if (!envName || !envId || !envName.value || !envId.value) {
        alert('Please fill in all environment details');
        return false;
      }
    }
  } else if (deploymentStyle === 'dedicated') {
    // Validate dedicated deployment specific fields
    const customerId = document.querySelector('input[name="dedicated_customer_identifier"]').value;
    if (!customerId) {
      alert('Please enter a customer identifier');
      return false;
    }

    // Check if at least one environment is selected
    const selectedEnvironments = document.querySelectorAll('input[name="dedicated_environments"]:checked');
    if (selectedEnvironments.length === 0) {
      alert('Please select at least one environment');
      return false;
    }

    // Validate "Other" environment if selected
    const otherEnvCheckbox = document.getElementById('dedicated-other-env-checkbox');
    const otherEnvInput = document.getElementById('dedicated-other-env-input');
    if (otherEnvCheckbox && otherEnvCheckbox.checked && (!otherEnvInput || !otherEnvInput.value)) {
      alert('Please specify the other environment name');
      return false;
    }

    // Check if at least one URL module is selected
    const selectedUrls = document.querySelectorAll('input[name="dedicated_urls[]"]:checked');
    if (selectedUrls.length === 0) {
      alert('Please select at least one module in the URLs section');
      return false;
    }
  }

  return true;
}

// Validation function specifically for URL preview
function validateFormForPreview() {
  const deploymentStyle = document.getElementById('deployment_style').value;
  
  if (deploymentStyle === 'cloud') {
    // Validate cloud-specific fields for preview
    const regionId = document.querySelector('input[name="cloud_region_identifier"]').value.trim();
    if (!regionId) {
      alert('Please enter a Region Identifier before previewing URLs.');
      return false;
    }

    const numEnvs = parseInt(document.querySelector('input[name="cloud_number_of_envs"]').value);
    if (isNaN(numEnvs) || numEnvs < 1 || numEnvs > 6) {
      alert('Please enter a valid number of environments (1-6)');
      return false;
    }

    // Check all environment fields
    for (let i = 0; i < numEnvs; i++) {
      const envName = document.querySelector(`input[name="cloud_env_name_${i}"]`);
      const envId = document.querySelector(`input[name="cloud_env_identifier_${i}"]`);
      
      if (!envName || !envId || !envName.value || !envId.value) {
        alert('Please fill in all environment details');
        return false;
      }
    }
  } else if (deploymentStyle === 'dedicated') {
    // Validate dedicated-specific fields for preview
    const customerId = document.querySelector('input[name="dedicated_customer_identifier"]').value;
    if (!customerId) {
      alert('Please enter a customer identifier');
      return false;
    }

    // Validate environment selection
    const selectedEnvironments = document.querySelectorAll('input[name="dedicated_environments"]:checked');
    if (selectedEnvironments.length === 0) {
      alert('Please select at least one environment');
      return false;
    }

    // Validate "Other" environment if selected
    const otherEnvCheckbox = document.getElementById('dedicated-other-env-checkbox');
    const otherEnvInput = document.getElementById('dedicated-other-env-input');
    if (otherEnvCheckbox && otherEnvCheckbox.checked && (!otherEnvInput || !otherEnvInput.value)) {
      alert('Please specify the other environment name');
      return false;
    }

    // Validate URL module selection
    const selectedUrls = document.querySelectorAll('input[name="dedicated_urls[]"]:checked');
    if (selectedUrls.length === 0) {
      alert('Please select at least one module in the URLs section');
      return false;
    }
  }

  return true;
}

// Validation function specifically for PDF generation
function validateFormForPDF() {
  const deploymentStyle = document.getElementById('deployment_style').value;
  const customerName = document.getElementById('customer_name').value;
  
  // Validate customer name
  if (!customerName) {
    alert('Please enter a customer name');
    return false;
  }

  if (deploymentStyle === 'cloud') {
    // Validate required fields for cloud deployment
    const regionId = document.querySelector('input[name="cloud_region_identifier"]').value.trim();
    const ssoVendor = document.getElementById('cloud_sso_vendor').value;
    const cloudRegion = document.querySelector('input[name="cloud_region"]').value.trim();
    const ataccamaVersion = document.querySelector('input[name="cloud_ataccama_version"]').value.trim();
    const upgradeStream = document.querySelector('select[name="cloud_upgrade_stream"]').value;
    const userConnectivity = document.querySelector('select[name="cloud_user_connectivity"]').value;
    const dataSourceConnectivity = document.querySelector('select[name="cloud_data_source_connectivity"]').value;

    // Check for missing required fields
    let missingFields = [];
    if (!regionId) missingFields.push('Region Identifier');
    if (!ssoVendor) missingFields.push('SSO Vendor');
    if (!cloudRegion) missingFields.push('Cloud Region');
    if (!ataccamaVersion) missingFields.push('Ataccama Version');
    if (!upgradeStream) missingFields.push('Upgrade Stream');
    if (!userConnectivity) missingFields.push('User Connectivity Method');
    if (!dataSourceConnectivity) missingFields.push('Data Source Connectivity Method');

    if (missingFields.length > 0) {
      alert('Please fill in the following required fields:\n- ' + missingFields.join('\n- '));
      return false;
    }

    // Validate SSO vendor "Other" field if selected
    if (ssoVendor === 'Other') {
      const otherSsoVendor = document.getElementById('cloud_sso_vendor_other').value.trim();
      if (!otherSsoVendor) {
        alert('Please specify the other SSO vendor');
        return false;
      }
    }

    // Validate number of environments
    const numEnvs = parseInt(document.querySelector('input[name="cloud_number_of_envs"]').value);
    if (isNaN(numEnvs) || numEnvs < 1 || numEnvs > 6) {
      alert('Please specify between 1 and 6 environments');
      return false;
    }

    // Validate all environment fields
    for (let i = 0; i < numEnvs; i++) {
      const envName = document.querySelector(`input[name="cloud_env_name_${i}"]`);
      const envId = document.querySelector(`input[name="cloud_env_identifier_${i}"]`);
      
      if (!envName || !envId || !envName.value || !envId.value) {
        alert(`Please fill in all details for Environment ${i + 1}`);
        return false;
      }
    }
  } else if (deploymentStyle === 'dedicated') {
    // Validate required fields for dedicated deployment
    const customerId = document.querySelector('input[name="dedicated_customer_identifier"]').value.trim();
    const ssoVendor = document.getElementById('dedicated_sso_vendor').value;
    const cloudRegion = document.querySelector('input[name="dedicated_cloud_region"]').value.trim();
    const ataccamaVersion = document.querySelector('input[name="dedicated_ataccama_version"]').value.trim();

    // Check for missing required fields
    let missingFields = [];
    if (!customerId) missingFields.push('Customer Identifier');
    if (!ssoVendor) missingFields.push('SSO Vendor');
    if (!cloudRegion) missingFields.push('Cloud Region');
    if (!ataccamaVersion) missingFields.push('Ataccama Version');

    if (missingFields.length > 0) {
      alert('Please fill in the following required fields:\n- ' + missingFields.join('\n- '));
      return false;
    }

    // Validate SSO vendor "Other" field if selected
    if (ssoVendor === 'Other') {
      const otherSsoVendor = document.getElementById('dedicated_sso_vendor_other').value.trim();
      if (!otherSsoVendor) {
        alert('Please specify the other SSO vendor');
        return false;
      }
    }

    // Validate environment selection
    const selectedEnvironments = document.querySelectorAll('input[name="dedicated_environments"]:checked');
    if (selectedEnvironments.length === 0) {
      alert('Please select at least one environment');
      return false;
    }

    // Validate "Other" environment if selected
    const otherEnvCheckbox = document.getElementById('dedicated-other-env-checkbox');
    const otherEnvInput = document.getElementById('dedicated-other-env-input');
    if (otherEnvCheckbox && otherEnvCheckbox.checked && (!otherEnvInput || !otherEnvInput.value)) {
      alert('Please specify the other environment name');
      return false;
    }

    // Validate URL module selection
    const selectedUrls = document.querySelectorAll('input[name="dedicated_urls[]"]:checked');
    if (selectedUrls.length === 0) {
      alert('Please select at least one module in the URLs section');
      return false;
    }
  }

  return true;
}

// URL Preview functionality
document.addEventListener('DOMContentLoaded', function() {
  // Get modal elements
  const modal = document.getElementById('preview-modal');
  const previewButton = document.getElementById('preview-button');
  const closeModal = document.querySelector('.close-modal');
  const closePreview = document.getElementById('close-preview');
  const generatePdf = document.getElementById('generate-pdf');
  const mainForm = document.getElementById('main-form');

  // Function to generate URLs based on form data
  function generateUrls() {
    const deploymentStyle = document.getElementById('deployment_style').value;
    const customerName = document.getElementById('customer_name').value;
    const previewContent = document.getElementById('preview-content');
    let urls = '';

    // Generate URLs for cloud deployment
    if (deploymentStyle === 'cloud') {
      const regionId = document.querySelector('input[name="cloud_region_identifier"]').value;
      const numEnvs = parseInt(document.querySelector('input[name="cloud_number_of_envs"]').value);

      urls += '<div class="url-section">';
      urls += '<h3>Environment URLs</h3>';
      
      // Generate URLs for each environment
      for (let i = 0; i < numEnvs; i++) {
        const envName = document.querySelector(`input[name="cloud_env_name_${i}"]`).value;
        const envId = document.querySelector(`input[name="cloud_env_identifier_${i}"]`).value;
        
        urls += `<div class="url-item">`;
        urls += `<h4>Environment: ${envName.toUpperCase()}</h4>`;
        urls += `<p>DQ: https://one-${envId}.worker-01-${regionId}.prod.ataccama.link/</p>`;
        urls += `<p>Keycloak: https://one-${envId}.worker-01-${regionId}.prod.ataccama.link/auth/</p>`;
        urls += `<p>Minio Console: https://minio-console-one-${envId}.worker-01-${regionId}.prod.ataccama.link/</p>`;
        urls += `<p>Audit: https://one-${envId}.worker-01-${regionId}.prod.ataccama.link/audit-operations</p>`;
        urls += `<p>DPM: https://dpm-one-${envId}.worker-01-${regionId}.prod.ataccama.link/jobs</p>`;
        urls += `<p>Orchestration Server: https://runtime-server-one-${envId}.worker-01-${regionId}.prod.ataccama.link/</p>`;
        urls += `</div>`;
      }
      
      urls += '</div>';
    } else if (deploymentStyle === 'dedicated') {
      // Generate URLs for dedicated deployment
      const customerId = document.querySelector('input[name="dedicated_customer_identifier"]').value;
      const selectedEnvs = Array.from(document.querySelectorAll('input[name="dedicated_environments"]:checked'))
        .map(checkbox => checkbox.value);
      
      // Handle "Other" environment
      const otherEnvCheckbox = document.getElementById('dedicated-other-env-checkbox');
      const otherEnvInput = document.getElementById('dedicated-other-env-input');
      if (otherEnvCheckbox && otherEnvCheckbox.checked && otherEnvInput && otherEnvInput.value) {
        selectedEnvs.push(otherEnvInput.value);
      }

      // Get selected URL modules
      const selectedUrls = Array.from(document.querySelectorAll('input[name="dedicated_urls[]"]:checked'))
        .map(checkbox => checkbox.value);

      // Define URL patterns for each service
      const urlPatterns = {
        'one': { label: 'ONE', pattern: env => `https://${customerId}.${env}.ataccama.online` },
        'keycloak': { label: 'Keycloak', pattern: env => `https://${customerId}.${env}.ataccama.online/auth` },
        'dpm': { label: 'DPM', pattern: env => `https://dpm.${customerId}.${env}.ataccama.online` },
        'minio_console': { label: 'MinIO Console', pattern: env => `https://minio-console.${customerId}.${env}.ataccama.online` },
        'mdm_ui': { label: 'MDM UI', pattern: env => `https://mdm.${customerId}.${env}.ataccama.online` },
        'mdm_server': { label: 'MDM Server', pattern: env => `https://mdm-server.${customerId}.${env}.ataccama.online` },
        'rdm_ui': { label: 'RDM UI', pattern: env => `https://rdm.${customerId}.${env}.ataccama.online` },
        'rdm_server': { label: 'RDM Server', pattern: env => `https://rdm-server.${customerId}.${env}.ataccama.online` },
        'portal': { label: 'Portal', pattern: env => `https://portal.${customerId}.${env}.ataccama.online` },
        'datastories': { label: 'Data Stories', pattern: env => `https://datastories.${customerId}.${env}.ataccama.online` }
      };

      urls += '<div class="url-section">';
      urls += '<h3>Environment URLs</h3>';
      
      // Generate URLs for each environment
      for (const env of selectedEnvs) {
        if (env !== 'other') { // Skip the 'other' value from checkbox
          urls += `<div class="url-item">`;
          urls += `<h4>Environment: ${env.toUpperCase()}</h4>`;
          
          // Generate URLs for selected services
          for (const urlKey of selectedUrls) {
            const urlInfo = urlPatterns[urlKey];
            if (urlInfo) {
              urls += `<p>${urlInfo.label}: ${urlInfo.pattern(env)}</p>`;
            }
          }
          
          urls += `</div>`;
        }
      }
      
      urls += '</div>';
    }

    previewContent.innerHTML = urls;
  }

  // Show modal with preview validation
  previewButton.addEventListener('click', function() {
    if (validateFormForPreview()) {
      generateUrls();
      modal.style.display = 'block';
    }
  });

  // Form submit with full validation
  mainForm.addEventListener('submit', function(e) {
    if (!validateFormForPDF()) {
      e.preventDefault();
    }
  });

  // Close modal handlers
  closeModal.addEventListener('click', function() {
    modal.style.display = 'none';
  });

  closePreview.addEventListener('click', function() {
    modal.style.display = 'none';
  });

  // Close modal when clicking outside
  window.addEventListener('click', function(event) {
    if (event.target === modal) {
      modal.style.display = 'none';
    }
});
});

// File upload handling
document.addEventListener('DOMContentLoaded', function() {
  const fileInputs = document.querySelectorAll('input[type="file"]');
  
  fileInputs.forEach(input => {
    const fileInfo = input.nextElementSibling;
    
    // Handle file selection
    input.addEventListener('change', function() {
      const file = this.files[0];
      if (file) {
        // Validate file type
        const validTypes = ['image/png', 'image/jpeg', 'image/jpg'];
        if (!validTypes.includes(file.type)) {
          fileInfo.textContent = 'Please upload a PNG or JPEG image';
          fileInfo.classList.add('error');
          this.value = ''; // Clear the input
          return;
        }
        
        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
          fileInfo.textContent = 'File size must be less than 5MB';
          fileInfo.classList.add('error');
          this.value = ''; // Clear the input
          return;
        }
        
        // Show success message with file info
        fileInfo.textContent = `Selected: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`;
        fileInfo.classList.remove('error');
      } else {
        fileInfo.textContent = '';
        fileInfo.classList.remove('error');
      }
    });
});
});
