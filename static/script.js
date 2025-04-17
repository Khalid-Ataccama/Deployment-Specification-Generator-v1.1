console.log("Script loaded and working!");

document.getElementById("deployment_style").addEventListener("change", function () {
  const selectedStyle = this.value;
  console.log("Deployment style selected:", selectedStyle);
  const submitSection = document.getElementById("submit-section");
  const cloudFields = document.getElementById("cloud-fields");
  const dedicatedFields = document.getElementById("dedicated-fields");

  // Hide all sections by default
  cloudFields.classList.add("hidden");
  dedicatedFields.classList.add("hidden");
  submitSection.classList.add("hidden");

  // First enable all inputs to reset state
  const allInputs = document.querySelectorAll('input, select');
  allInputs.forEach(input => input.disabled = false);

  if (selectedStyle === "cloud") {
    cloudFields.classList.remove("hidden");
    submitSection.classList.remove("hidden");
    // Only disable dedicated fields
    const dedicatedInputs = dedicatedFields.querySelectorAll('input, select');
    dedicatedInputs.forEach(input => input.disabled = true);
  } else if (selectedStyle === "dedicated") {
    dedicatedFields.classList.remove("hidden");
    submitSection.classList.remove("hidden");
    // Only disable cloud fields
    const cloudInputs = cloudFields.querySelectorAll('input, select');
    cloudInputs.forEach(input => input.disabled = true);
  }
});
  
// Cloud SSO vendor handling
document.addEventListener("DOMContentLoaded", function () {
  const ssoCloud = document.getElementById("cloud_sso_vendor");
  const ssoCloudOtherGroup = document.getElementById("cloud_sso_vendor_other_group");

  if (ssoCloud) {
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

// Dedicated SSO vendor handling
document.addEventListener("DOMContentLoaded", function () {
  const ssoDedicated = document.getElementById("dedicated_sso_vendor");
  const ssoDedicatedOtherGroup = document.getElementById("dedicated_sso_vendor_other_group");

  if (ssoDedicated) {
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

// Dedicated other environment handling
document.addEventListener('DOMContentLoaded', function () {
  const otherEnvCheckbox = document.getElementById('dedicated-other-env-checkbox');
  const otherEnvInput = document.getElementById('dedicated-other-env-input');

  if (otherEnvCheckbox && otherEnvInput) {
    otherEnvCheckbox.addEventListener('change', function () {
      otherEnvInput.style.display = this.checked ? 'block' : 'none';
    });
  }
});

// Cloud environment fields handling
document.addEventListener('DOMContentLoaded', function () {
  const envInput = document.querySelector('input[name="cloud_number_of_envs"]');
  const container = document.getElementById('cloud-environment-fields-container');

  if (envInput && container) {
    // Add min and max attributes to the input
    envInput.setAttribute('min', '1');
    envInput.setAttribute('max', '6');

    envInput.addEventListener('input', function () {
      const num = parseInt(envInput.value);
      container.innerHTML = ''; // Clear previous fields

      // Add validation
      if (isNaN(num) || num < 1 || num > 6) {
        envInput.setCustomValidity('Number of environments must be between 1 and 6');
        envInput.reportValidity();
        return;
      } else {
        envInput.setCustomValidity('');
      }

      for (let i = 0; i < num; i++) {
        const group = document.createElement('div');
        group.className = 'environment-group';

        const heading = document.createElement('h3');
        heading.textContent = `Environment ${i + 1}`;
        group.appendChild(heading);

        const fieldsContainer = document.createElement('div');
        fieldsContainer.className = 'environment-fields';

        const nameField = document.createElement('div');
        nameField.className = 'environment-field';
        nameField.innerHTML = `
          <label>Name</label>
          <input type="text" name="cloud_env_name_${i}" required placeholder="e.g., dev">
        `;

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

    // Also validate on blur (when the field loses focus)
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

// Form validation function
function validateForm() {
  const deploymentStyle = document.getElementById('deployment_style').value;
  const customerName = document.getElementById('customer_name').value;
  
  if (!deploymentStyle || !customerName) {
    alert('Please fill in all required fields');
    return false;
  }

  if (deploymentStyle === 'cloud') {
    const numEnvs = parseInt(document.querySelector('input[name="cloud_number_of_envs"]').value);
    if (isNaN(numEnvs) || numEnvs < 1 || numEnvs > 6) {
      alert('Please enter a valid number of environments (1-6)');
      return false;
    }

    // Check if all environment fields are filled
    for (let i = 0; i < numEnvs; i++) {
      const envName = document.querySelector(`input[name="cloud_env_name_${i}"]`);
      const envId = document.querySelector(`input[name="cloud_env_identifier_${i}"]`);
      
      if (!envName || !envId || !envName.value || !envId.value) {
        alert('Please fill in all environment details');
        return false;
      }
    }
  } else if (deploymentStyle === 'dedicated') {
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

    // Check if "Other" environment is selected but no value provided
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

function validateFormForPreview() {
  const deploymentStyle = document.getElementById('deployment_style').value;
  
  if (deploymentStyle === 'cloud') {
    // First check if region identifier is provided
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

    // Check if all environment fields are filled
    for (let i = 0; i < numEnvs; i++) {
      const envName = document.querySelector(`input[name="cloud_env_name_${i}"]`);
      const envId = document.querySelector(`input[name="cloud_env_identifier_${i}"]`);
      
      if (!envName || !envId || !envName.value || !envId.value) {
        alert('Please fill in all environment details');
        return false;
      }
    }
  } else if (deploymentStyle === 'dedicated') {
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

    // Check if "Other" environment is selected but no value provided
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

function validateFormForPDF() {
  const deploymentStyle = document.getElementById('deployment_style').value;
  const customerName = document.getElementById('customer_name').value;
  
  if (!customerName) {
    alert('Please enter a customer name');
    return false;
  }

  if (deploymentStyle === 'cloud') {
    // Check required fields for cloud deployment
    const regionId = document.querySelector('input[name="cloud_region_identifier"]').value.trim();
    const ssoVendor = document.getElementById('cloud_sso_vendor').value;
    const cloudRegion = document.querySelector('input[name="cloud_region"]').value.trim();
    const ataccamaVersion = document.querySelector('input[name="cloud_ataccama_version"]').value.trim();
    const upgradeStream = document.querySelector('select[name="cloud_upgrade_stream"]').value;
    const userConnectivity = document.querySelector('select[name="cloud_user_connectivity"]').value;
    const dataSourceConnectivity = document.querySelector('select[name="cloud_data_source_connectivity"]').value;

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

    if (ssoVendor === 'Other') {
      const otherSsoVendor = document.getElementById('cloud_sso_vendor_other').value.trim();
      if (!otherSsoVendor) {
        alert('Please specify the other SSO vendor');
        return false;
      }
    }

    const numEnvs = parseInt(document.querySelector('input[name="cloud_number_of_envs"]').value);
    if (isNaN(numEnvs) || numEnvs < 1 || numEnvs > 6) {
      alert('Please specify between 1 and 6 environments');
      return false;
    }

    // Check if all environment fields are filled
    for (let i = 0; i < numEnvs; i++) {
      const envName = document.querySelector(`input[name="cloud_env_name_${i}"]`);
      const envId = document.querySelector(`input[name="cloud_env_identifier_${i}"]`);
      
      if (!envName || !envId || !envName.value || !envId.value) {
        alert(`Please fill in all details for Environment ${i + 1}`);
        return false;
      }
    }
  } else if (deploymentStyle === 'dedicated') {
    // Check required fields for dedicated deployment
    const customerId = document.querySelector('input[name="dedicated_customer_identifier"]').value.trim();
    const ssoVendor = document.getElementById('dedicated_sso_vendor').value;
    const cloudRegion = document.querySelector('input[name="dedicated_cloud_region"]').value.trim();
    const ataccamaVersion = document.querySelector('input[name="dedicated_ataccama_version"]').value.trim();

    let missingFields = [];
    if (!customerId) missingFields.push('Customer Identifier');
    if (!ssoVendor) missingFields.push('SSO Vendor');
    if (!cloudRegion) missingFields.push('Cloud Region');
    if (!ataccamaVersion) missingFields.push('Ataccama Version');

    if (missingFields.length > 0) {
      alert('Please fill in the following required fields:\n- ' + missingFields.join('\n- '));
      return false;
    }

    if (ssoVendor === 'Other') {
      const otherSsoVendor = document.getElementById('dedicated_sso_vendor_other').value.trim();
      if (!otherSsoVendor) {
        alert('Please specify the other SSO vendor');
        return false;
      }
    }

    // Check if at least one environment is selected
    const selectedEnvironments = document.querySelectorAll('input[name="dedicated_environments"]:checked');
    if (selectedEnvironments.length === 0) {
      alert('Please select at least one environment');
      return false;
    }

    // Check if "Other" environment is selected but no value provided
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

// URL Preview functionality
document.addEventListener('DOMContentLoaded', function() {
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

    if (deploymentStyle === 'cloud') {
      const regionId = document.querySelector('input[name="cloud_region_identifier"]').value;
      const numEnvs = parseInt(document.querySelector('input[name="cloud_number_of_envs"]').value);

      urls += '<div class="url-section">';
      urls += '<h3>Environment URLs</h3>';
      
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
      const customerId = document.querySelector('input[name="dedicated_customer_identifier"]').value;
      const selectedEnvs = Array.from(document.querySelectorAll('input[name="dedicated_environments"]:checked'))
        .map(checkbox => checkbox.value);
      
      // Add other environment if specified
      const otherEnvCheckbox = document.getElementById('dedicated-other-env-checkbox');
      const otherEnvInput = document.getElementById('dedicated-other-env-input');
      if (otherEnvCheckbox && otherEnvCheckbox.checked && otherEnvInput && otherEnvInput.value) {
        selectedEnvs.push(otherEnvInput.value);
      }

      // Get selected URLs
      const selectedUrls = Array.from(document.querySelectorAll('input[name="dedicated_urls[]"]:checked'))
        .map(checkbox => checkbox.value);

      // URL patterns for each service
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
      
      for (const env of selectedEnvs) {
        if (env !== 'other') { // Skip the 'other' value from checkbox
          urls += `<div class="url-item">`;
          urls += `<h4>Environment: ${env.toUpperCase()}</h4>`;
          
          // Only show URLs for selected services
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

  // Close modal
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
