/**
 * Smart Billing — Main JavaScript File
 *
 * This script handles all interactive features on the Smart Billing landing page:
 * 1. Utility helpers (DOM selection, math clamps, smooth interpolation)
 * 2. Custom cursor & magnetic buttons
 * 3. Scroll reveal animations & animated counters
 * 4. Text scrub highlight effect
 * 5. Horizontal feature card pinning (#cap)
 * 6. Interactive process deck steps (#how)
 * 7. Sticky navbar & scroll position updates
 * 8. Mobile navigation drawer
 * 9. FAQ accordion
 * 10. Live clock & current year
 * 11. Smooth anchor scrolling
 * 12. de dot-field canvas with mouse repulsion
 */

(() => {
  'use strict';

  /* ==========================================================================
     1. UTILITY HELPERS & DEVICE PREFERENCES
     ========================================================================== */

  // Helper function to query a single DOM element
  const getElement = (selector, context = document) => context.querySelector(selector);

  // Helper function to query multiple DOM elements and return an array
  const getAllElements = (selector, context = document) => [...context.querySelectorAll(selector)];

  // Keeps a numeric value within a minimum and maximum boundary
  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  // Linear interpolation: smoothly transitions from number 'start' to number 'end' by factor 'factor'
  const lerp = (start, end, factor) => start + (end - start) * factor;

  // Check if the user has requested reduced motion in their OS settings
  const prefersReducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Check if the device has a precision pointer (e.g. mouse or trackpad)
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
     2. SITE INITIALIZATION & SCROLL REVEALS
     ========================================================================== */

  // Mark the document as ready to enable CSS transitions
  document.documentElement.classList.add('ready');

  // Select all elements that animate into view when scrolled to
  const revealElements = getAllElements('[data-reveal], .divider-line, .call-to-action .line-reveal');
  let revealsArmed = false;

  // Observer that triggers animations when elements enter the viewport
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -6% 0px' });

  function armScrollReveals() {
    if (revealsArmed) return;
    revealsArmed = true;

    revealElements.forEach((element) => {
      if (element.dataset.delay) {
        element.style.setProperty('--d', `${element.dataset.delay}s`);
      }
      revealObserver.observe(element);
    });

    requestAnimationFrame(checkInitiallyVisibleElements);
  }

  // Immediately reveal elements that are already in the initial viewport
  function checkInitiallyVisibleElements() {
    revealElements.forEach((element) => {
      const rect = element.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.94) {
        element.classList.add('in');
        revealObserver.unobserve(element);
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', armScrollReveals);
  } else {
    armScrollReveals();
  }

  /* ==========================================================================
     3. CUSTOM CURSOR (REMOVED AS REQUESTED)
     ========================================================================== */

  /* ==========================================================================
     4. MAGNETIC BUTTONS
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
     4B. PLATFORM OVERVIEW ROLE CONSOLE (#platform)
     ========================================================================== */

  const platformOverviewSection = getElement('#platform');

  if (platformOverviewSection) {
    const switcherTabs = getAllElements('.po-switcher-tab', platformOverviewSection);
    const dossierPanels = getAllElements('.po-dossier', platformOverviewSection);
    const consoleNumber = getElement('#poNum', platformOverviewSection);
    let activeRoleIndex = -1;

    const setActiveRole = (nextIndex, shouldScrollTab = false) => {
      if (nextIndex === activeRoleIndex || nextIndex < 0 || nextIndex >= switcherTabs.length) return;
      activeRoleIndex = nextIndex;

      switcherTabs.forEach((tab, index) => {
        const isActive = index === nextIndex;
        tab.classList.toggle('is-on', isActive);
        tab.setAttribute('aria-selected', String(isActive));
        tab.tabIndex = isActive ? 0 : -1;

        if (isActive && shouldScrollTab && typeof tab.scrollIntoView === 'function') {
          tab.scrollIntoView({
            behavior: prefersReducedMotion ? 'auto' : 'smooth',
            block: 'nearest',
            inline: 'center'
          });
        }
      });

      dossierPanels.forEach((panel, index) => panel.classList.toggle('is-on', index === nextIndex));

      if (consoleNumber) consoleNumber.textContent = String(nextIndex + 1).padStart(2, '0');
    };

    switcherTabs.forEach((tab, index) => {
      tab.addEventListener('click', () => setActiveRole(index, true));
      tab.addEventListener('focus', () => setActiveRole(index, true));

      if (hasFinePointer) {
        tab.addEventListener('mouseenter', () => setActiveRole(index));
      }

      tab.addEventListener('keydown', (event) => {
        const lastIndex = switcherTabs.length - 1;
        let targetIndex = null;

        if (event.key === 'ArrowDown' || event.key === 'ArrowRight') targetIndex = index === lastIndex ? 0 : index + 1;
        if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') targetIndex = index === 0 ? lastIndex : index - 1;
        if (event.key === 'Home') targetIndex = 0;
        if (event.key === 'End') targetIndex = lastIndex;

        if (targetIndex === null) return;
        event.preventDefault();
        setActiveRole(targetIndex, true);
        switcherTabs[targetIndex].focus();
      });
    });

    setActiveRole(0);
  }

  /* ==========================================================================
     5. ANIMATED NUMBER COUNTERS
     ========================================================================== */

  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      counterObserver.unobserve(entry.target);

      const element = entry.target;
      const targetValue = parseFloat(element.dataset.count);
      const decimalPlaces = +(element.dataset.dec || 0);
      const prefix = element.dataset.prefix || '';
      const suffix = element.dataset.suffix || '';
      const duration = 1800;
      const startTime = performance.now();

      const formatNumber = (val) =>
        prefix +
        val.toLocaleString('en-US', {
          minimumFractionDigits: decimalPlaces,
          maximumFractionDigits: decimalPlaces,
        }) +
        suffix;

      const runCounter = (currentTime) => {
        const progress = clamp((currentTime - startTime) / duration, 0, 1);
        // Ease out quartic curve for smooth slowing down
        const easedProgress = 1 - Math.pow(1 - progress, 4);
        element.textContent = formatNumber(targetValue * easedProgress);

        if (progress < 1) {
          requestAnimationFrame(runCounter);
        } else {
          element.textContent = formatNumber(targetValue);
        }
      };

      runCounter(startTime);
    });
  }, { threshold: 0.55 });

  getAllElements('[data-count]').forEach((counterElement) => {
    counterObserver.observe(counterElement);
  });

  /* ==========================================================================
     6. TEXT SCRUB ANIMATION
     ========================================================================== */

  const scrubContainer = getElement('#scrubText');
  let scrubWords = [];

  if (scrubContainer) {
    // Break sentences into individual span tags so each word can highlight on scroll
    const splitIntoWords = (node, isEmphasis) => {
      [...node.childNodes].forEach((child) => {
        if (child.nodeType === Node.TEXT_NODE) {
          const fragment = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach((token) => {
            if (!token) return;
            if (!token.trim()) {
              fragment.appendChild(document.createTextNode(token));
              return;
            }
            const wordSpan = document.createElement('span');
            wordSpan.className = 'scrub-word' + (isEmphasis ? ' em' : '');
            wordSpan.textContent = token;
            fragment.appendChild(wordSpan);
          });
          node.replaceChild(fragment, child);
        } else if (child.nodeType === Node.ELEMENT_NODE) {
          splitIntoWords(child, isEmphasis || child.tagName === 'EM');
        }
      });
    };

    splitIntoWords(scrubContainer, false);
    scrubWords = getAllElements('.scrub-word', scrubContainer);
  }

  function updateTextScrub() {
    if (!scrubWords.length || !scrubContainer) return;
    const rect = scrubContainer.getBoundingClientRect();
    const startPoint = window.innerHeight * 0.88;
    const endPoint = window.innerHeight * 0.24;
    const scrollProgress = clamp((startPoint - rect.top) / (startPoint - endPoint + rect.height * 0.5), 0, 1);
    const litWordCount = Math.round(scrollProgress * scrubWords.length);

    scrubWords.forEach((word, index) => {
      word.classList.toggle('on', index < litWordCount);
    });
  }

  /* ==========================================================================
     7. FEATURE CARDS CAROUSEL CONTROLLER (#cap)
     ========================================================================== */

  const horizontalSection = getElement('#cap');
  const horizontalTrack = getElement('#hTrack');
  const horizontalStepNumber = getElement('#hNum');
  const horizontalSteps = getAllElements('#hSteps .ps-step');
  const horizontalPrevBtn = getElement('#hPrev');
  const horizontalNextBtn = getElement('#hNext');
  const featureCards = horizontalTrack ? getAllElements('.feature-card', horizontalTrack) : [];
  let currentCardIndex = 0;

  function updateCarouselControlsState() {
    if (horizontalPrevBtn) {
      horizontalPrevBtn.disabled = currentCardIndex === 0;
      horizontalPrevBtn.setAttribute('aria-disabled', String(currentCardIndex === 0));
    }
    if (horizontalNextBtn) {
      horizontalNextBtn.disabled = currentCardIndex === featureCards.length - 1;
      horizontalNextBtn.setAttribute('aria-disabled', String(currentCardIndex === featureCards.length - 1));
    }

    horizontalSteps.forEach((step, index) => {
      const isSelected = index === currentCardIndex;
      step.classList.toggle('is-on', isSelected);
      step.setAttribute('aria-selected', String(isSelected));
      step.tabIndex = isSelected ? 0 : -1;
    });

    featureCards.forEach((card, index) => {
      const isSelected = index === currentCardIndex;
      card.classList.toggle('is-active', isSelected);
      card.setAttribute('aria-hidden', String(!isSelected));
      card.setAttribute('tabindex', isSelected ? '0' : '-1');
    });

    if (horizontalStepNumber) {
      horizontalStepNumber.textContent = String(currentCardIndex + 1).padStart(2, '0');
      horizontalStepNumber.classList.remove('bump');
      void horizontalStepNumber.offsetWidth;
      horizontalStepNumber.classList.add('bump');
    }
  }

  function goToFeatureCard(index, shouldFocus = false) {
    if (!horizontalTrack || !featureCards.length) return;
    const targetIndex = clamp(index, 0, featureCards.length - 1);
    currentCardIndex = targetIndex;

    const targetCard = featureCards[targetIndex];
    if (targetCard) {
      const trackPaddingLeft = parseFloat(getComputedStyle(horizontalTrack).paddingLeft) || 0;
      const offset = targetCard.offsetLeft - trackPaddingLeft;

      if (prefersReducedMotion) {
        horizontalTrack.style.transition = 'none';
        horizontalTrack.style.transform = 'translate3d(' + (-offset) + 'px, 0, 0)';
      } else {
        horizontalTrack.style.transition = 'transform .65s cubic-bezier(.16, 1, .3, 1)';
        horizontalTrack.style.transform = 'translate3d(' + (-offset) + 'px, 0, 0)';
      }

      if (shouldFocus) {
        targetCard.focus({ preventScroll: true });
      }
    }

    updateCarouselControlsState();
  }

  function handleCarouselResize() {
    goToFeatureCard(currentCardIndex);
  }

  if (horizontalPrevBtn) {
    horizontalPrevBtn.addEventListener('click', () => {
      if (currentCardIndex > 0) {
        const nextIndex = currentCardIndex - 1;
        goToFeatureCard(nextIndex);
        if (nextIndex === 0 && horizontalNextBtn) {
          horizontalNextBtn.focus();
        }
      }
    });
  }

  if (horizontalNextBtn) {
    horizontalNextBtn.addEventListener('click', () => {
      if (currentCardIndex < featureCards.length - 1) {
        const nextIndex = currentCardIndex + 1;
        goToFeatureCard(nextIndex);
        if (nextIndex === featureCards.length - 1 && horizontalPrevBtn) {
          horizontalPrevBtn.focus();
        }
      }
    });
  }

  horizontalSteps.forEach((step) => {
    step.addEventListener('click', () => {
      const stepIndex = Number(step.dataset.index) || 0;
      goToFeatureCard(stepIndex);
    });

    step.addEventListener('keydown', (e) => {
      let nextIndex = null;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        nextIndex = (currentCardIndex + 1) % horizontalSteps.length;
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        nextIndex = (currentCardIndex - 1 + horizontalSteps.length) % horizontalSteps.length;
      } else if (e.key === 'Home') {
        nextIndex = 0;
      } else if (e.key === 'End') {
        nextIndex = horizontalSteps.length - 1;
      }

      if (nextIndex !== null) {
        e.preventDefault();
        goToFeatureCard(nextIndex);
        if (horizontalSteps[nextIndex]) horizontalSteps[nextIndex].focus();
      }
    });
  });

  featureCards.forEach((card, index) => {
    card.addEventListener('click', () => {
      if (index !== currentCardIndex) {
        goToFeatureCard(index);
      }
    });
  });

  // Keyboard navigation within the carousel section
  if (horizontalSection) {
    horizontalSection.addEventListener('keydown', (e) => {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        const nextIndex = (currentCardIndex + 1) % featureCards.length;
        goToFeatureCard(nextIndex);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        const prevIndex = (currentCardIndex - 1 + featureCards.length) % featureCards.length;
        goToFeatureCard(prevIndex);
      } else if (e.key === 'Home') {
        e.preventDefault();
        goToFeatureCard(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        goToFeatureCard(featureCards.length - 1);
      }
    });
  }

  // Touch swipe support for smooth mobile interaction
  if (horizontalTrack) {
    let touchStartX = 0;
    let touchStartY = 0;
    let isHorizontalSwipe = false;

    horizontalTrack.addEventListener('touchstart', (e) => {
      if (e.touches.length !== 1) return;
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      isHorizontalSwipe = false;
    }, { passive: true });

    horizontalTrack.addEventListener('touchmove', (e) => {
      if (e.touches.length !== 1) return;
      const dx = e.touches[0].clientX - touchStartX;
      const dy = e.touches[0].clientY - touchStartY;
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10) {
        isHorizontalSwipe = true;
      }
    }, { passive: true });

    horizontalTrack.addEventListener('touchend', (e) => {
      if (!isHorizontalSwipe) return;
      const touchEndX = e.changedTouches[0].clientX;
      const deltaX = touchEndX - touchStartX;
      if (deltaX < -40 && currentCardIndex < featureCards.length - 1) {
        goToFeatureCard(currentCardIndex + 1);
      } else if (deltaX > 40 && currentCardIndex > 0) {
        goToFeatureCard(currentCardIndex - 1);
      }
    }, { passive: true });
  }

  // Initialize carousel at first card
  goToFeatureCard(0);

  /* ==========================================================================
     8. INTERACTIVE PROCESS DECK (#how)
     ========================================================================== */

  const processSection = getElement('#how');
  const processDeck = getElement('#deck');
  const processSteps = getAllElements('.process-step');
  const processDeckDots = getAllElements('#deckDots i');
  let currentProcessStep = -1;

  function setProcessStep(stepIndex, isTriggeredFromScroll = false) {
    if (stepIndex === currentProcessStep || stepIndex < 0 || stepIndex >= processSteps.length) return;
    currentProcessStep = stepIndex;

    processSteps.forEach((step, index) => {
      step.classList.toggle('on', index === stepIndex);
    });

    processDeckDots.forEach((dot, index) => {
      dot.classList.toggle('on', index === stepIndex);
    });

    if (!isTriggeredFromScroll && processDeck) {
      processDeck.style.transform = `translate3d(0, ${-stepIndex * 100}%, 0)`;
    }
  }

  function updateProcessDeckScroll() {
    if (!processSection || !processDeck || window.innerWidth <= 1100 || prefersReducedMotion) return;

    const rect = processSection.getBoundingClientRect();
    const totalScrollableDistance = processSection.offsetHeight - window.innerHeight;
    const progress = clamp(-rect.top / totalScrollableDistance, 0, 1);
    const easedStepPosition = progress * (processSteps.length - 1);

    processDeck.style.transform = `translate3d(0, ${-easedStepPosition * 100}%, 0)`;
    setProcessStep(Math.round(easedStepPosition), true);
  }

  // Click on any process step button to jump directly to it
  processSteps.forEach((stepButton, stepIndex) => {
    stepButton.addEventListener('click', () => {
      if (window.innerWidth <= 1100 || prefersReducedMotion) {
        setProcessStep(stepIndex);
        if (processDeck) processDeck.style.transform = `translate3d(0, ${-stepIndex * 100}%, 0)`;
      } else if (processSection) {
        const totalDistance = processSection.offsetHeight - window.innerHeight;
        const targetScrollY = processSection.offsetTop + (stepIndex / (processSteps.length - 1)) * totalDistance;
        window.scrollTo({ top: targetScrollY, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
      }
    });
  });
  setProcessStep(0);

  /* ==========================================================================
     9. NAVBAR & SCROLL POSITION UPDATES
     ========================================================================== */

  const navbar = getElement('#nav');
  const heroInner = getElement('#heroIn');
  const navbarLinks = getAllElements('.navbar-links a');
  const observedSections = ['problem', 'platform', 'cap', 'how', 'faq'].map((id) => document.getElementById(id));
  let scrollUpdateScheduled = false;

  // Uses requestAnimationFrame to throttle scroll updates for steady 60fps performance
  function handleWindowScroll() {
    if (!scrollUpdateScheduled) {
      requestAnimationFrame(() => {
        executeScrollUpdates();
        scrollUpdateScheduled = false;
      });
      scrollUpdateScheduled = true;
    }
  }

  function executeScrollUpdates() {
    const scrollY = window.scrollY;

    // Toggle sticky navbar elevation after 40px of scrolling
    if (navbar) {
      navbar.classList.toggle('stuck', scrollY > 40);
    }

    // Gentle parallax opacity fade for hero content
    if (heroInner && !prefersReducedMotion) {
      const heroProgress = clamp(scrollY / window.innerHeight, 0, 1);
      heroInner.style.transform = `translate3d(0, ${heroProgress * -70}px, 0)`;
      heroInner.style.opacity = String(1 - heroProgress * 1.1);
    }

    // Highlight active navbar anchor link based on visible section
    let activeSectionId = '';
    observedSections.forEach((section) => {
      if (!section) return;
      const rect = section.getBoundingClientRect();
      if (rect.top <= window.innerHeight * 0.4 && rect.bottom >= window.innerHeight * 0.4) {
        activeSectionId = section.id;
      }
    });

    navbarLinks.forEach((link) => {
      link.classList.toggle('on', link.getAttribute('href') === `#${activeSectionId}`);
    });

    // Update pinned and scrub scroll features
    updateProcessDeckScroll();
    updateTextScrub();
  }

  // Hook into Lenis scroll if available for synchronized updates, with fallback to window scroll
  if (lenis) {
    lenis.on('scroll', handleWindowScroll);
  } else {
    window.addEventListener('scroll', handleWindowScroll, { passive: true });
  }

  window.addEventListener('resize', () => {
    handleCarouselResize();
    handleWindowScroll();
  });

  /* ==========================================================================
     10. MOBILE NAVIGATION DRAWER
     ========================================================================== */

  const menuBurgerButton = getElement('#burger');
  const mobileMenuDrawer = getElement('#menu');

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

  /* ==========================================================================
     11. FAQ ACCORDION
     ========================================================================== */

  const faqItems = getAllElements('.faq-item');

  faqItems.forEach((item) => {
    const questionButton = getElement('.faq-question', item);
    const answerContainer = getElement('.faq-answer', item);

    if (!questionButton || !answerContainer) return;

    const syncAnswerHeight = () => {
      answerContainer.style.maxHeight = item.classList.contains('is-open')
        ? `${answerContainer.scrollHeight}px`
        : '0px';
    };

    questionButton.addEventListener('click', () => {
      const wasOpen = item.classList.contains('is-open');

      // Close all other accordion items
      faqItems.forEach((otherItem) => {
        otherItem.classList.remove('is-open');
        const otherAnswer = getElement('.faq-answer', otherItem);
        if (otherAnswer) otherAnswer.style.maxHeight = '0px';
      });

      // Toggle clicked item
      if (!wasOpen) {
        item.classList.add('is-open');
        syncAnswerHeight();
      }
    });

    syncAnswerHeight();
  });

  window.addEventListener('resize', () => {
    const activeFaqItem = getElement('.faq-item.is-open');
    if (activeFaqItem) {
      const answerContainer = getElement('.faq-answer', activeFaqItem);
      if (answerContainer) {
        answerContainer.style.maxHeight = `${answerContainer.scrollHeight}px`;
      }
    }
  });

  /* ==========================================================================
     12. FOOTER WORDMARK & LIVE CLOCK
     ========================================================================== */

  // Interactive letter lift effect on footer wordmark
  const footerWordmark = getElement('#mega');
  if (footerWordmark) {
    footerWordmark.innerHTML = footerWordmark.textContent
      .split('')
      .map((char) => `<span style="display:inline-block;transition:transform .55s var(--e),color .45s">${char}</span>`)
      .join('');

    const wordmarkLetters = getAllElements('span', footerWordmark);

    footerWordmark.addEventListener('mouseenter', () => {
      wordmarkLetters.forEach((letter, index) => {
        letter.style.transform = 'translateY(-16px)';
        letter.style.transitionDelay = `${index * 0.022}s`;
      });
    });

    footerWordmark.addEventListener('mouseleave', () => {
      wordmarkLetters.forEach((letter) => {
        letter.style.transform = '';
        letter.style.transitionDelay = '0s';
      });
    });
  }

  // Live New York City clock & dynamic footer year
  const clockElement = getElement('#clock');
  const updateClockTime = () => {
    if (!clockElement) return;
    const nycTime = new Date().toLocaleTimeString('en-US', { hour12: false, timeZone: 'America/New_York' });
    clockElement.textContent = `${nycTime} NYC`;
  };
  updateClockTime();
  setInterval(updateClockTime, 1000);

  const yearElement = getElement('#year');
  if (yearElement) {
    yearElement.textContent = String(new Date().getFullYear());
  }

  // Smooth scrolling for anchor links with offset to account for fixed navbar
  getAllElements('a[href^="#"]').forEach((anchorLink) => {
    anchorLink.addEventListener('click', (event) => {
      const targetHash = anchorLink.getAttribute('href');
      if (targetHash.length < 2) return;
      const targetElement = document.querySelector(targetHash);
      if (!targetElement) return;

      event.preventDefault();
      if (lenis) {
        lenis.scrollTo(targetElement, { offset: -60, duration: 1.2 });
      } else {
        const targetTop = targetElement.getBoundingClientRect().top + window.scrollY - 60;
        window.scrollTo({ top: targetTop, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
      }
    });
  });

  /* ==========================================================================
     13. INTERACTIVE BACKGROUND DOT-FIELD CANVAS
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

    // Target and interpolated mouse positions
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
      currentMouseX = lerp(currentMouseX, targetMouseX, 0.12);
      currentMouseY = lerp(currentMouseY, targetMouseY, 0.12);

      canvasContext.clearRect(0, 0, canvasWidth, canvasHeight);

      for (let i = 0; i < particles.length; i++) {
        const particle = particles[i];
        // Gentle undulating wave movement
        const waveOffset = Math.sin(particle.originX * 0.011 + animationTime * 1.4) * Math.cos(particle.originY * 0.013 - animationTime) * 3.4;

        const distanceX = particle.originX - currentMouseX;
        const distanceY = particle.originY - currentMouseY;
        const distanceSquared = distanceX * distanceX + distanceY * distanceY;

        let renderX = particle.originX;
        let renderY = particle.originY + waveOffset;
        let mouseInfluence = 0;

        // Repel particles from cursor position
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

        // Clean neutral dots without red glow on cursor movement
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
     14. INITIAL TRIGGER ON LOAD
     ========================================================================== */

  handleWindowScroll();

  // Web fonts change text metrics, so re-trigger scroll calculations once they settle
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      handleWindowScroll();
    });
  }

  if (document.readyState === 'complete') {
    handleWindowScroll();
  } else {
    window.addEventListener('load', () => {
      handleWindowScroll();
    });
  }
})();
