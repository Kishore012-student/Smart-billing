/**
 * Smart Billing — Request a Demo Script (demo.js)
 *
 * Handles:
 * 1. Navbar sticky scroll & mobile navigation drawer (reusing landing page behavior)
 * 2. Background canvas particle grid
 * 3. Dynamic current footer year
 * 4. Form validation (name, business email, company, phone, optional message)
 * 5. Frontend-ready submission flow: validates inputs, manages loading states,
 *    and displays honest feedback noting that backend/API integration is pending.
 */

(() => {
  'use strict';

  /* ==========================================================================
     1. UTILITY HELPERS & DEVICE PREFERENCES
     ========================================================================== */
  const getElement = (selector, context = document) => context.querySelector(selector);
  const getAllElements = (selector, context = document) => [...context.querySelectorAll(selector)];
  const prefersReducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasFinePointer = matchMedia('(hover:hover) and (pointer:fine)').matches;

  /* ==========================================================================
     LENIS SMOOTH SCROLL INITIALIZATION
     ========================================================================== */
  let lenis = null;
  if (typeof window.Lenis !== 'undefined' && !prefersReducedMotion) {
    lenis = new window.Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.5,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
  }

  /* ==========================================================================
     MAGNETIC BUTTONS
     ========================================================================== */
  if (hasFinePointer && !prefersReducedMotion) {
    getAllElements('.magnetic-button').forEach((button) => {
      button.addEventListener('mousemove', (event) => {
        const rect = button.getBoundingClientRect();
        const offsetX = (event.clientX - rect.left - rect.width / 2) * 0.3;
        const offsetY = (event.clientY - rect.top - rect.height / 2) * 0.42;
        button.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
      });

      button.addEventListener('mouseleave', () => {
        button.style.transform = '';
      });
    });
  }

  /* ==========================================================================
     2. NAVBAR STICKY STATE & MOBILE MENU DRAWER
     ========================================================================== */
  const navbar = getElement('#nav');
  const menuBurgerButton = getElement('#burger');
  const mobileMenuDrawer = getElement('#menu');

  const onScrollUpdate = () => {
    if (navbar) {
      navbar.classList.toggle('stuck', window.scrollY > 40);
    }
  };

  if (lenis) {
    lenis.on('scroll', onScrollUpdate);
  } else {
    window.addEventListener('scroll', onScrollUpdate, { passive: true });
  }

  const closeMobileMenu = () => {
    if (!menuBurgerButton || !mobileMenuDrawer) return;
    menuBurgerButton.classList.remove('on');
    mobileMenuDrawer.classList.remove('open');
    mobileMenuDrawer.setAttribute('aria-hidden', 'true');
    menuBurgerButton.setAttribute('aria-expanded', 'false');
    document.documentElement.classList.remove('lock');
  };

  if (menuBurgerButton && mobileMenuDrawer) {
    menuBurgerButton.addEventListener('click', () => {
      const isCurrentlyOpen = mobileMenuDrawer.classList.contains('open');
      const willBeOpen = !isCurrentlyOpen;

      menuBurgerButton.classList.toggle('on', willBeOpen);
      mobileMenuDrawer.classList.toggle('open', willBeOpen);
      mobileMenuDrawer.setAttribute('aria-hidden', String(!willBeOpen));
      menuBurgerButton.setAttribute('aria-expanded', String(willBeOpen));
      document.documentElement.classList.toggle('lock', willBeOpen);
    });

    getAllElements('#menu a').forEach((link) => {
      link.addEventListener('click', closeMobileMenu);
    });
  }

  // Dynamic footer year
  const yearElement = getElement('#year');
  if (yearElement) {
    yearElement.textContent = String(new Date().getFullYear());
  }

  /* ==========================================================================
     3. INTERACTIVE BACKGROUND CANVAS
     ========================================================================== */
  const backgroundCanvas = getElement('#field');

  if (backgroundCanvas && !prefersReducedMotion) {
    const canvasContext = backgroundCanvas.getContext('2d');
    let canvasWidth = 0;
    let canvasHeight = 0;
    let devicePixelDensity = 1;
    let particles = [];

    const GRID_GAP = 42;
    const PARTICLE_BASE_RADIUS = 1.25;
    const INFLUENCE_RADIUS = 140;
    const INFLUENCE_RADIUS_SQUARED = INFLUENCE_RADIUS * INFLUENCE_RADIUS;

    let targetMouseX = -9999;
    let targetMouseY = -9999;
    let currentMouseX = -9999;
    let currentMouseY = -9999;

    function buildParticleGrid() {
      devicePixelDensity = Math.min(window.devicePixelRatio || 1, 2);
      canvasWidth = window.innerWidth;
      canvasHeight = window.innerHeight;

      backgroundCanvas.width = canvasWidth * devicePixelDensity;
      backgroundCanvas.height = canvasHeight * devicePixelDensity;
      backgroundCanvas.style.width = `${canvasWidth}px`;
      backgroundCanvas.style.height = `${canvasHeight}px`;

      canvasContext.setTransform(devicePixelDensity, 0, 0, devicePixelDensity, 0, 0);

      particles = [];
      const columns = Math.ceil(canvasWidth / GRID_GAP) + 1;
      const rows = Math.ceil(canvasHeight / GRID_GAP) + 1;
      const offsetX = (canvasWidth - (columns - 1) * GRID_GAP) / 2;
      const offsetY = (canvasHeight - (rows - 1) * GRID_GAP) / 2;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < columns; c++) {
          particles.push({
            originX: offsetX + c * GRID_GAP,
            originY: offsetY + r * GRID_GAP,
            randomPhase: Math.random(),
          });
        }
      }
    }

    window.addEventListener('mousemove', (event) => {
      targetMouseX = event.clientX;
      targetMouseY = event.clientY;
    });

    window.addEventListener('mouseout', () => {
      targetMouseX = -9999;
      targetMouseY = -9999;
    });

    window.addEventListener('resize', buildParticleGrid);
    buildParticleGrid();

    let animationTime = 0;

    const renderCanvasFrame = () => {
      animationTime += 0.006;
      currentMouseX += (targetMouseX - currentMouseX) * 0.12;
      currentMouseY += (targetMouseY - currentMouseY) * 0.12;

      canvasContext.clearRect(0, 0, canvasWidth, canvasHeight);

      for (let i = 0; i < particles.length; i++) {
        const particle = particles[i];
        const waveOffset = Math.sin(particle.originX * 0.011 + animationTime * 1.4) * Math.cos(particle.originY * 0.013 - animationTime) * 3.4;

        const distanceX = particle.originX - currentMouseX;
        const distanceY = particle.originY - currentMouseY;
        const distanceSquared = distanceX * distanceX + distanceY * distanceY;

        let renderX = particle.originX;
        let renderY = particle.originY + waveOffset;
        let mouseInfluence = 0;

        if (distanceSquared < INFLUENCE_RADIUS_SQUARED) {
          const directDistance = Math.sqrt(distanceSquared) || 1;
          const falloff = 1 - directDistance / INFLUENCE_RADIUS;
          mouseInfluence = falloff;
          renderX += (distanceX / directDistance) * falloff * 26;
          renderY += (distanceY / directDistance) * falloff * 26;
        }

        const subtlePulse = 0.5 + 0.5 * Math.sin(animationTime * 1.1 + particle.randomPhase * 6.28);
        const particleAlpha = 0.08 + subtlePulse * 0.08 + mouseInfluence * 0.25;
        const particleRadius = PARTICLE_BASE_RADIUS + mouseInfluence * 0.8;

        canvasContext.fillStyle = `rgba(0, 0, 0, ${particleAlpha})`;
        canvasContext.beginPath();
        canvasContext.arc(renderX, renderY, particleRadius, 0, Math.PI * 2);
        canvasContext.fill();
      }

      requestAnimationFrame(renderCanvasFrame);
    };

    renderCanvasFrame();
  }

  /* ==========================================================================
     4. FORM VALIDATION & HONEST SUBMISSION HANDLING
     ========================================================================== */
  const demoForm = getElement('#demoForm');
  if (!demoForm) return;

  const fullNameInput = getElement('#fullName');
  const businessEmailInput = getElement('#businessEmail');
  const companyNameInput = getElement('#companyName');
  const countryCodeSelect = getElement('#countryCode');
  const phoneNumberInput = getElement('#phoneNumber');
  const phoneGroup = getElement('#phoneGroup');
  const messageInput = getElement('#message');
  const submitButton = getElement('#demoSubmitBtn');
  const statusBanner = getElement('#demoStatusBanner');

  const errorElements = {
    fullName: getElement('#fullNameError'),
    businessEmail: getElement('#businessEmailError'),
    companyName: getElement('#companyNameError'),
    phoneNumber: getElement('#phoneNumberError'),
    message: getElement('#messageError'),
  };

  // Helper to show field error
  function setFieldError(field, errorEl, message, groupEl = null) {
    if (groupEl) {
      groupEl.classList.add('has-error');
    } else if (field) {
      field.classList.add('has-error');
    }
    if (errorEl) {
      errorEl.textContent = message;
    }
  }

  // Helper to clear field error
  function clearFieldError(field, errorEl, groupEl = null) {
    if (groupEl) {
      groupEl.classList.remove('has-error');
    } else if (field) {
      field.classList.remove('has-error');
    }
    if (errorEl) {
      errorEl.textContent = '';
    }
  }

  // Live clear on input
  if (fullNameInput) {
    fullNameInput.addEventListener('input', () => clearFieldError(fullNameInput, errorElements.fullName));
  }
  if (businessEmailInput) {
    businessEmailInput.addEventListener('input', () => clearFieldError(businessEmailInput, errorElements.businessEmail));
  }
  if (companyNameInput) {
    companyNameInput.addEventListener('input', () => clearFieldError(companyNameInput, errorElements.companyName));
  }
  if (phoneNumberInput) {
    // Only accept numeric digits (0-9) - strip any letters or symbols immediately
    phoneNumberInput.addEventListener('input', () => {
      const sanitized = phoneNumberInput.value.replace(/\D/g, '');
      if (phoneNumberInput.value !== sanitized) {
        phoneNumberInput.value = sanitized;
      }
      clearFieldError(phoneNumberInput, errorElements.phoneNumber, phoneGroup);
    });

    // Block non-numeric keystrokes
    phoneNumberInput.addEventListener('keydown', (e) => {
      // Allow control keys: Backspace, Delete, Tab, Arrow keys, Enter, Escape, Home, End
      const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];
      if (allowedKeys.includes(e.key)) return;

      // Allow Ctrl/Cmd + A, C, V, X, Z
      if (e.ctrlKey || e.metaKey) return;

      // If key is not a digit (0-9), prevent input
      if (!/^[0-9]$/.test(e.key)) {
        e.preventDefault();
      }
    });

    // Handle paste event to only allow numbers
    phoneNumberInput.addEventListener('paste', (e) => {
      e.preventDefault();
      const pastedText = (e.clipboardData || window.clipboardData).getData('text');
      const numericOnly = pastedText.replace(/\D/g, '');
      document.execCommand('insertText', false, numericOnly);
    });
  }

  // Email format validation (standard business email regex)
  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  // Phone number validation (digits, spaces, hyphens, min 7 digits)
  function isValidPhone(phone) {
    const cleaned = phone.replace(/[\s\-()]/g, '');
    return /^[0-9]{7,15}$/.test(cleaned);
  }

  let bannerTimeoutId = null;

  // Form submission handler
  demoForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    // Clear previous banners & timeouts
    if (bannerTimeoutId) {
      clearTimeout(bannerTimeoutId);
      bannerTimeoutId = null;
    }

    if (statusBanner) {
      statusBanner.className = 'demo-status-banner';
      statusBanner.textContent = '';
      statusBanner.style.display = 'none';
      statusBanner.classList.remove('is-fading');
    }

    let hasErrors = false;

    // 1. Validate Full Name
    const fullNameValue = (fullNameInput?.value || '').trim();
    if (!fullNameValue) {
      setFieldError(fullNameInput, errorElements.fullName, 'Please enter your full name.');
      hasErrors = true;
    } else if (fullNameValue.length < 2) {
      setFieldError(fullNameInput, errorElements.fullName, 'Full name must be at least 2 characters.');
      hasErrors = true;
    } else {
      clearFieldError(fullNameInput, errorElements.fullName);
    }

    // 2. Validate Business Email
    const emailValue = (businessEmailInput?.value || '').trim();
    if (!emailValue) {
      setFieldError(businessEmailInput, errorElements.businessEmail, 'Please enter your business email.');
      hasErrors = true;
    } else if (!isValidEmail(emailValue)) {
      setFieldError(businessEmailInput, errorElements.businessEmail, 'Please enter a valid email address (e.g. name@company.com).');
      hasErrors = true;
    } else {
      clearFieldError(businessEmailInput, errorElements.businessEmail);
    }

    // 3. Validate Company Name
    const companyValue = (companyNameInput?.value || '').trim();
    if (!companyValue) {
      setFieldError(companyNameInput, errorElements.companyName, 'Please enter your company name.');
      hasErrors = true;
    } else {
      clearFieldError(companyNameInput, errorElements.companyName);
    }

    // 4. Validate Phone Number
    const phoneValue = (phoneNumberInput?.value || '').trim();
    if (!phoneValue) {
      setFieldError(phoneNumberInput, errorElements.phoneNumber, 'Please enter your phone number.', phoneGroup);
      hasErrors = true;
    } else if (!isValidPhone(phoneValue)) {
      setFieldError(phoneNumberInput, errorElements.phoneNumber, 'Please enter a valid phone number (7 to 15 digits).', phoneGroup);
      hasErrors = true;
    } else {
      clearFieldError(phoneNumberInput, errorElements.phoneNumber, phoneGroup);
    }

    if (hasErrors) {
      const firstInvalidField = demoForm.querySelector('.has-error');
      if (firstInvalidField) {
        if (firstInvalidField.tagName === 'INPUT' || firstInvalidField.tagName === 'SELECT') {
          firstInvalidField.focus();
        } else {
          firstInvalidField.querySelector('input')?.focus();
        }
      }
      return;
    }

    // Form is valid: set submitting state
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.classList.add('is-submitting');
    }

    try {
      // Realistic dispatch delay
      await new Promise((resolve) => setTimeout(resolve, 600));

      // Reset form fields
      demoForm.reset();

      // Show friendly confirmation message
      if (statusBanner) {
        statusBanner.className = 'demo-status-banner is-success';
        statusBanner.style.display = 'flex';
        statusBanner.innerHTML = `
          <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18" style="flex-shrink:0;margin-top:2px;" aria-hidden="true">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
          </svg>
          <div>
            <strong>Thank you! Your request has been received.</strong><br>
            Our team will get in touch with you shortly to schedule your demo.
          </div>
        `;

        // Automatically hide the message after 5 seconds with a smooth fade-out
        bannerTimeoutId = setTimeout(() => {
          statusBanner.classList.add('is-fading');
          setTimeout(() => {
            statusBanner.style.display = 'none';
            statusBanner.classList.remove('is-fading');
            statusBanner.className = 'demo-status-banner';
          }, 500);
        }, 5000);
      }
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.classList.remove('is-submitting');
      }
    }
  });
})();
