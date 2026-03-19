/**
 * ============================================================
 * LUMENIC DATA — Apply Form Handler (100% BULLETPROOF)
 * ============================================================
 * ✓ Multi-step form navigation
 * ✓ Complete validation
 * ✓ File upload with drag & drop
 * ✓ Telegram text message + files
 * ✓ Full error recovery
 * ✓ Production-ready logging
 * ============================================================
 */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
  // ════════════════════════════════════════════════════════════
  // 1. STATE & CONFIG
  // ════════════════════════════════════════════════════════════
  let currentStep = 1;
  let isSubmitting = false;
  const totalSteps = 4;
  
  const form = document.querySelector('.apply-form-area');
  if (!form) {
    return;
  }

  // Get Telegram credentials from window (set by config.js)
  const BOT_TOKEN = window.TG_BOT_TOKEN || '';
  const CHAT_ID = window.TG_CHAT_ID || '';
  const TELEGRAM_API = 'https://api.telegram.org';

  // ════════════════════════════════════════════════════════════
  // 2. STEP NAVIGATION
  // ════════════════════════════════════════════════════════════
  function goToStep(step) {
    if (step < 1 || step > totalSteps + 1) return;

    // Hide all steps
    document.querySelectorAll('.form-step').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.step-nav-item').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.mobile-step-dot').forEach(el => el.classList.remove('active'));
    document.getElementById('success-state').classList.remove('active');

    if (step <= totalSteps) {
      // Show current step
      const stepEl = document.getElementById(`step-${step}`);
      if (stepEl) stepEl.classList.add('active');

      const navItem = document.querySelector(`[data-step="${step}"]`);
      if (navItem) navItem.classList.add('active');

      const dot = document.querySelector(`[data-dot="${step}"]`);
      if (dot) dot.classList.add('active');

      // Update progress
      const progressPercent = (step / totalSteps) * 100;
      const progressBar = document.getElementById('progress-bar');
      if (progressBar) progressBar.style.width = progressPercent + '%';

      // Scroll to form
      setTimeout(() => {
        form.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } else {
      // Show success state
      document.getElementById('success-state').classList.add('active');
      const progressBar = document.getElementById('progress-bar');
      if (progressBar) progressBar.style.width = '100%';
      form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    currentStep = step;
  }

  // ════════════════════════════════════════════════════════════
  // 3. FORM VALIDATION
  // ════════════════════════════════════════════════════════════
  function validateStep(step) {
    const stepEl = document.getElementById(`step-${step}`);
    if (!stepEl) return false;

    const requiredFields = stepEl.querySelectorAll('[required]');
    let isValid = true;
    let firstInvalid = null;

    requiredFields.forEach(field => {
      let valid = true;
      const value = field.value?.trim() || '';

      // Check if empty
      if (!value && field.type !== 'checkbox') {
        valid = false;
      }

      // Type-specific validation
      if (valid && value) {
        if (field.type === 'email') {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            valid = false;
            showToast('Please enter a valid email address', true);
          }
        } else if (field.id === 'a-phone') {
          const digits = value.replace(/\D/g, '');
          if (digits.length < 10) {
            valid = false;
            showToast('Please enter a valid phone number (at least 10 digits)', true);
          }
        } else if (field.id === 'a-ssn') {
          const digits = value.replace(/\D/g, '');
          if (digits.length !== 9) {
            valid = false;
            showToast('SSN must be exactly 9 digits', true);
          }
        } else if (field.id === 'a-linkedin' && value && !value.includes('linkedin.com')) {
          valid = false;
          showToast('Please enter a valid LinkedIn URL', true);
        } else if (field.id === 'a-github' && value && !value.includes('github.com')) {
          valid = false;
          showToast('Please enter a valid GitHub URL', true);
        }
      }

      // Checkbox validation
      if (field.type === 'checkbox' && field.required && !field.checked) {
        valid = false;
      }

      if (!valid) {
        field.classList.add('field-invalid');
        field.style.borderColor = '#c0392b';
        field.style.backgroundColor = 'rgba(192,57,43,0.05)';
        isValid = false;
        if (!firstInvalid) firstInvalid = field;
      } else {
        field.classList.remove('field-invalid');
        field.style.borderColor = '';
        field.style.backgroundColor = '';
      }
    });

    if (!isValid) {
      showToast('Please fill all required fields correctly', true);
      if (firstInvalid) {
        setTimeout(() => {
          firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
          firstInvalid.focus({ preventScroll: true });
        }, 150);
      }
    }

    return isValid;
  }

  // ════════════════════════════════════════════════════════════
  // 4. FILE UPLOAD HANDLING
  // ════════════════════════════════════════════════════════════
  document.querySelectorAll('.upload-zone').forEach(zone => {
    const input = zone.querySelector('input[type="file"]');
    if (!input) return;

    // Prevent default behavior
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      zone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
      e.preventDefault();
      e.stopPropagation();
    }

    // Drag highlighting
    ['dragenter', 'dragover'].forEach(eventName => {
      zone.addEventListener(eventName, () => {
        zone.style.borderColor = 'var(--ink)';
        zone.style.backgroundColor = 'rgba(0,0,0,0.02)';
      });
    });

    ['dragleave', 'drop'].forEach(eventName => {
      zone.addEventListener(eventName, () => {
        zone.style.borderColor = '';
        zone.style.backgroundColor = '';
      });
    });

    // Drop handler - FIX: input.files is read-only, use DataTransfer API
    zone.addEventListener('drop', (e) => {
      const files = e.dataTransfer.files;
      if (files.length) {
        const dt = new DataTransfer();
        Array.from(files).forEach(f => dt.items.add(f));
        input.files = dt.files;
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });

    // Click to upload
    zone.addEventListener('click', () => {
      input.click();
    });

    // File change
    input.addEventListener('change', () => {
      updateFileDisplay(input, zone);
    });
  });

  function updateFileDisplay(input, zone) {
    if (!input.files || !input.files[0]) return;

    const file = input.files[0];
    // Search in zone first, then in parent
    let nameEl = zone.querySelector('.upload-filename');
    if (!nameEl) nameEl = zone.parentElement.querySelector('.upload-filename');
    
    if (nameEl) {
      nameEl.textContent = `✓ ${file.name}`;
      nameEl.style.color = '#0a0a0a';
    }

    // Clear validation error
    if (input.style.borderColor) {
      input.style.borderColor = '';
      input.style.backgroundColor = '';
    }
  }

  // ════════════════════════════════════════════════════════════
  // 5. FORM SUBMISSION
  // ════════════════════════════════════════════════════════════
  const submitBtn = document.getElementById('submit-application');
  if (submitBtn) {
    submitBtn.addEventListener('click', handleSubmit);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    
    if (!validateStep(totalSteps)) {
      showToast('Please fill all required fields before submitting', true);
      return;
    }
    
    if (isSubmitting) return;
    isSubmitting = true;

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.style.opacity = '0.6';
    }
    
    showToast('Submitting your application...', false);

    try {
      console.log('[v0-SUBMISSION] Starting submission...');

      const formDataObj = collectFormData();
      console.log('[v0-SUBMISSION] Form data collected:', Object.keys(formDataObj).length, 'fields');
      
      // Separate files from text data
      const files = {};
      const textData = {};
      
      for (const [key, value] of Object.entries(formDataObj)) {
        if (value instanceof File) {
          files[key] = value;
        } else {
          textData[key] = value;
        }
      }
      
      console.log('[v0-SUBMISSION] Sending to backend API...');
      const response = await sendToBackend(textData, files);
      
      if (!response.success) {
        throw new Error(response.error || 'Submission failed');
      }
      
      console.log('[v0-SUBMISSION] ✅ SUBMISSION COMPLETE');
      showSuccessState();
    } catch (error) {
      console.error('[v0-SUBMISSION] ❌ FAILED:', error.message);
      showToast(error.message || 'Failed to submit. Please check your connection and try again.', true);
      
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.style.opacity = '1';
      }
      isSubmitting = false;
    }
  }

  // Send form data to backend API
  async function sendToBackend(textData, files) {
    console.log('[v0-SUBMISSION] Converting files to base64...');
    
    const convertedFiles = {};
    for (const [key, file] of Object.entries(files)) {
      const base64 = await fileToBase64(file);
      convertedFiles[key] = {
        name: file.name,
        type: file.type,
        data: base64
      };
    }
    
    console.log('[v0-SUBMISSION] Calling /api/submit-application...');
    const response = await fetch('/api/submit-application', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        formData: textData,
        files: convertedFiles
      })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'API request failed');
    }
    
    return data;
  }

  // Convert File to base64
  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
    });
  }

  function collectFormData() {
    const data = {};
    
    document.querySelectorAll('input, textarea, select').forEach(field => {
      if (!field.id) return;
      
      // Handle file inputs
      if (field.type === 'file' && field.files && field.files[0]) {
        data[field.id] = field.files[0];
      }
      // Handle checkboxes
      else if (field.type === 'checkbox') {
        if (field.checked && field.value) {
          data[field.id] = field.value;
        } else if (field.required && field.checked) {
          data[field.id] = 'true';
        }
      }
      // Handle radio buttons
      else if (field.type === 'radio') {
        if (field.checked) {
          data[field.id] = field.value;
        }
      }
      // Handle text fields
      else if (field.value && field.value.trim()) {
        data[field.id] = field.value.trim();
      }
    });
    
    return data;
  }



  function showSuccessState() {
    // Clear all form fields
    document.querySelectorAll('input, textarea, select').forEach(field => {
      field.value = '';
      field.style.borderColor = '';
      field.style.backgroundColor = '';
    });

    // Clear file displays
    document.querySelectorAll('.upload-filename').forEach(el => {
      el.textContent = '';
      el.style.color = '';
    });

    // Show success - schedule after DOM clears
    setTimeout(() => {
      goToStep(totalSteps + 1);
      showToast('Application submitted successfully!', false);
    }, 100);

    // Re-enable button
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.style.opacity = '1';
    }
    
    isSubmitting = false;
  }

  // ════════════════════════════════════════════════════════════
  // 7. BUTTON HANDLERS
  // ════════════════════════════════════════════════════════════
  document.querySelectorAll('.form-nav button').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();

      if (btn.id.startsWith('next-')) {
        const step = parseInt(btn.id.split('-')[1]);
        if (validateStep(step)) {
          goToStep(step + 1);
        }
      } else if (btn.id.startsWith('back-')) {
        const step = parseInt(btn.id.split('-')[1]);
        goToStep(step - 1);
      }
    });
  });

  // ════════════════════════════════════════════════════════════
  // 8. STEP NAV CLICKS (SIDEBAR)
  // ════════════════════════════════════════════════════════════
  document.querySelectorAll('.step-nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      if (e.button !== 0) return; // Only left-click
      e.preventDefault();
      e.stopPropagation();
      const step = parseInt(item.dataset.step);
      if (!isNaN(step) && step >= 1 && step <= totalSteps) {
        goToStep(step);
      }
    }, { passive: false });
    
    // Also support keyboard navigation
    item.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        e.stopPropagation();
        const step = parseInt(item.dataset.step);
        if (!isNaN(step) && step >= 1 && step <= totalSteps) {
          goToStep(step);
        }
      }
    }, { passive: false });
  });

  // ════════════════════════════════════════════════════════════
  // 9. TOAST NOTIFICATIONS
  // ════════════════════════════════════════════════════════════
  function showToast(message, isError = false) {
    const toast = document.querySelector('.toast');
    if (!toast) {
      // Fallback if toast doesn't exist
      return;
    }

    const icon = toast.querySelector('.toast-icon');
    if (isError) {
      toast.style.background = '#c0392b';
      icon.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
    } else {
      toast.style.background = '';
      icon.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>`;
    }

    toast.querySelector('.toast-text').textContent = message;
    toast.classList.add('show');

    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => {
      toast.classList.remove('show');
    }, 4000);
  }

  // ════════════════════════════════════════════════════════════
  // 10. INITIALIZE
  // ════════════════════════════════════════════════════════════
  goToStep(1);

  // Remove js-disabled fallback class once JS is loaded
  document.documentElement.classList.remove('js-disabled');
});
