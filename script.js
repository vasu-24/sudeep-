/* =====================================================================
   RMS STEEL DETAILING — STRUCTURAL STEEL DETAILING
   Navigation, position tracking, filters, modal, FAQ, counters, form
===================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initPageRouter();
  initHeroVideo();
  initNavigation();
  initProgressBar();
  initProjectFilter();
  initProjectModal();
  initFAQ();
  initCounters();
  initScrollAnimations();
  initFormValidation();
  initBackToTop();
  initHeroGrid();
});

/* ------------------------------------------------------------------
   SHARED HELPERS
------------------------------------------------------------------ */
const SECTIONS = Array.from(document.querySelectorAll('main section[data-section]'));

/* Sections with a dark background, so the side tracker stays visible */
const DARK_SECTIONS = ['process', 'why-rms'];

function headerOffset() {
  const navbar = document.getElementById('navbar');
  const status = document.getElementById('sectionStatus');
  const navH = navbar ? navbar.offsetHeight : 64;
  const statusH = status && status.classList.contains('visible') ? status.offsetHeight : 0;
  return navH + statusH + 10;
}

function scrollToTarget(target) {
  if (!target) return;
  const top = target.getBoundingClientRect().top + window.pageYOffset - headerOffset();
  window.scrollTo({ top: Math.max(top, 0), behavior: 'smooth' });
}

/* ------------------------------------------------------------------
   HERO BACKGROUND VIDEO — played slowly
------------------------------------------------------------------ */
function initHeroVideo() {
  const video = document.getElementById('heroVideo');
  if (!video) return;

  /* 0.5 = half speed. Lower it to 0.35 for an even slower drift. */
  const SPEED = 0.5;

  function slow() {
    try { video.playbackRate = SPEED; } catch (e) {}
  }

  video.addEventListener('loadedmetadata', slow);
  video.addEventListener('play', slow);
  video.addEventListener('ratechange', () => {
    if (video.playbackRate !== SPEED) slow();
  });
  slow();

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    video.pause();
    return;
  }

  const playing = video.play();
  if (playing && playing.catch) playing.catch(() => {});

  /* pause the video once the hero is scrolled past */
  if ('IntersectionObserver' in window) {
    const videoObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const resume = video.play();
          if (resume && resume.catch) resume.catch(() => {});
        } else {
          video.pause();
        }
      });
    }, { threshold: 0.05 });
    videoObserver.observe(video);
  }
}

/* ------------------------------------------------------------------
   NAVIGATION
------------------------------------------------------------------ */
/* ------------------------------------------------------------------
   PAGE ROUTER — five pages living inside one HTML file.
   Each <section> carries data-page="home|services|about|projects|contact".
   Only the sections belonging to the current page are displayed.
------------------------------------------------------------------ */
const PAGE_TITLES = {
  home: 'RMS Steel Detailing — Structural Steel Detailing & 3D BIM Modelling',
  services: 'Services — RMS Steel Detailing',
  about: 'About Us — RMS Steel Detailing',
  projects: 'Projects — RMS Steel Detailing',
  contact: 'Contact — RMS Steel Detailing'
};

function initPageRouter() {
  const pageSections = Array.from(document.querySelectorAll('[data-page]'));
  if (!pageSections.length) return;

  const pageOfSection = {};
  const firstSectionOfPage = {};
  pageSections.forEach(section => {
    const page = section.dataset.page;
    if (!section.id) return;
    pageOfSection[section.id] = page;
    if (!firstSectionOfPage[page]) firstSectionOfPage[page] = section.id;
  });

  const pageLinks = Array.from(document.querySelectorAll('[data-page-link]'));

  function idFromHref(href) {
    return (href || '').replace(/^#\/?/, '').trim();
  }

  function isRoute(id) {
    return Object.prototype.hasOwnProperty.call(pageOfSection, id);
  }

  function render(page, targetId) {
    pageSections.forEach(section => {
      section.classList.toggle('page-active', section.dataset.page === page);
    });

    pageLinks.forEach(link => {
      const isCurrent = link.getAttribute('data-page-link') === page;
      link.classList.toggle('active', isCurrent);
      if (isCurrent) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });

    document.body.setAttribute('data-current-page', page);
    document.title = PAGE_TITLES[page] || PAGE_TITLES.home;

    // Let other modules react (navbar styling, etc.)
    document.dispatchEvent(new CustomEvent('rms:pagechange', { detail: { page: page } }));

    // Safety net: if the reveal observer misses freshly shown content, show it anyway.
    window.setTimeout(() => {
      document.querySelectorAll('.page-active .reveal:not(.in-view)')
        .forEach(el => el.classList.add('in-view'));
    }, 500);

    const deepLink = targetId && targetId !== firstSectionOfPage[page]
      ? document.getElementById(targetId)
      : null;

    if (deepLink) {
      window.requestAnimationFrame(() => scrollToTarget(deepLink));
    } else {
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  }

  function navigate(href) {
    const id = idFromHref(href);
    const page = isRoute(id) ? pageOfSection[id] : 'home';
    const newHash = '#' + (id || 'home');
    if (window.location.hash !== newHash) {
      window.history.pushState(null, '', newHash);
    }
    render(page, id);
  }

  function syncFromHash() {
    const id = idFromHref(window.location.hash);
    const page = isRoute(id) ? pageOfSection[id] : 'home';
    render(page, id);
  }

  window.addEventListener('popstate', syncFromHash);
  window.addEventListener('hashchange', syncFromHash);

  window.RMSRouter = { navigate: navigate, isRoute: isRoute };

  syncFromHash();
}

/* ------------------------------------------------------------------
   NAVIGATION
------------------------------------------------------------------ */
function initNavigation() {
  const navbar = document.getElementById('navbar');
  const announcementBar = document.getElementById('announcementBar');
  const navToggle = document.getElementById('navToggle');
  const navMenu = document.getElementById('navMenu');
  const scrollLinks = document.querySelectorAll('[data-scroll]');

  function handleScroll() {
    const y = window.scrollY;
    const onHome = document.body.getAttribute('data-current-page') === 'home';
    // Inner pages have no dark hero behind the bar, so it stays solid throughout.
    navbar.classList.toggle('solid', y > 40 || !onHome);
    const announceH = announcementBar ? announcementBar.offsetHeight : 0;
    navbar.classList.toggle('hide-announce', y > announceH);
  }
  window.addEventListener('scroll', handleScroll, { passive: true });
  document.addEventListener('rms:pagechange', handleScroll);
  handleScroll();

  function closeMenu() {
    if (!navMenu) return;
    navMenu.classList.remove('open');
    navToggle.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
  }
  function openMenu() {
    navMenu.classList.add('open');
    navToggle.classList.add('open');
    navToggle.setAttribute('aria-expanded', 'true');
  }

  if (navToggle) {
    navToggle.addEventListener('click', () => {
      navMenu.classList.contains('open') ? closeMenu() : openMenu();
    });
  }

  scrollLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (!href || !href.startsWith('#') || href === '#') return;
      e.preventDefault();
      closeMenu();

      // A link to any section on another page hands over to the router,
      // which swaps the page first and then scrolls to the section.
      const id = href.slice(1);
      if (window.RMSRouter && window.RMSRouter.isRoute(id)) {
        window.RMSRouter.navigate(href);
        return;
      }

      const target = document.querySelector(href);
      if (target) scrollToTarget(target);
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu();
  });
}

/* ------------------------------------------------------------------
   SCROLL SPY — nav links, side tracker, "you are here" bar
------------------------------------------------------------------ */
function initScrollSpy() {
  if (!SECTIONS.length) return;

  const navLinks = Array.from(document.querySelectorAll('.nav-link'));
  const dots = Array.from(document.querySelectorAll('.tracker-dot'));
  const statusBar = document.getElementById('sectionStatus');
  const statusIndex = document.getElementById('statusIndex');
  const statusName = document.getElementById('statusName');
  const statusPrev = document.getElementById('statusPrev');
  const statusNext = document.getElementById('statusNext');

  const TOTAL = String(SECTIONS.length).padStart(2, '0');
  let currentId = null;

  function findCurrent() {
    const line = window.scrollY + headerOffset() + 60;
    let current = SECTIONS[0];
    SECTIONS.forEach(section => {
      if (section.offsetTop <= line) current = section;
    });
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 4) {
      current = SECTIONS[SECTIONS.length - 1];
    }
    return current;
  }

  function update() {
    const section = findCurrent();
    if (!section) return;

    const id = section.id;
    const idx = SECTIONS.indexOf(section);

    if (statusBar) statusBar.classList.toggle('visible', idx > 0);

    const onDark = DARK_SECTIONS.indexOf(id) !== -1;
    dots.forEach(dot => dot.classList.toggle('on-dark', onDark));

    if (id === currentId) return;
    currentId = id;

    navLinks.forEach(link => {
      const isActive = link.getAttribute('href') === '#' + id;
      link.classList.toggle('active', isActive);
      if (isActive) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    });

    dots.forEach(dot => dot.classList.toggle('active', dot.dataset.section === id));

    if (statusIndex) statusIndex.textContent = (section.dataset.index || '') + ' / ' + TOTAL;
    if (statusName) statusName.textContent = section.dataset.name || '';

    const prev = SECTIONS[idx - 1];
    const next = SECTIONS[idx + 1];

    if (statusPrev) {
      if (prev) {
        statusPrev.href = '#' + prev.id;
        statusPrev.textContent = '\u2191 ' + (prev.dataset.name || 'Previous');
        statusPrev.classList.remove('disabled');
      } else {
        statusPrev.classList.add('disabled');
      }
    }
    if (statusNext) {
      if (next) {
        statusNext.href = '#' + next.id;
        statusNext.textContent = (next.dataset.name || 'Next') + ' \u2193';
        statusNext.classList.remove('disabled');
      } else {
        statusNext.classList.add('disabled');
      }
    }
  }

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { update(); ticking = false; });
  }, { passive: true });

  window.addEventListener('resize', update);
  update();

  [statusPrev, statusNext].forEach(btn => {
    if (!btn) return;
    btn.addEventListener('click', (e) => {
      const target = document.querySelector(btn.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      scrollToTarget(target);
    });
  });
}

/* ------------------------------------------------------------------
   READING PROGRESS BAR
------------------------------------------------------------------ */
function initProgressBar() {
  const bar = document.getElementById('progressBar');
  if (!bar) return;

  function update() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const pct = max > 0 ? (window.scrollY / max) * 100 : 0;
    bar.style.width = Math.min(Math.max(pct, 0), 100) + '%';
  }

  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();
}

/* ------------------------------------------------------------------
   PROJECT FILTER
------------------------------------------------------------------ */
function initProjectFilter() {
  const filterBtns = Array.from(document.querySelectorAll('.filter-btn'));
  const projectCards = Array.from(document.querySelectorAll('.project-card'));
  const emptyState = document.getElementById('projectsEmpty');
  const statusLine = document.getElementById('filterStatus');

  if (!filterBtns.length) return;

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.getAttribute('data-filter');
      const label = btn.textContent.trim();

      filterBtns.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');

      let visibleCount = 0;

      projectCards.forEach(card => {
        const matches = filter === 'all' || card.getAttribute('data-category') === filter;

        if (matches) {
          card.style.display = '';
          card.style.opacity = '0';
          card.style.transform = 'translateY(12px)';
          requestAnimationFrame(() => {
            card.style.transition = 'opacity .35s ease, transform .35s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
          });
          visibleCount++;
        } else {
          card.style.display = 'none';
        }
      });

      if (emptyState) emptyState.hidden = visibleCount !== 0;

      if (statusLine) {
        if (visibleCount === 0) {
          statusLine.textContent = 'No projects in ' + label;
        } else if (filter === 'all') {
          statusLine.textContent = 'Showing all ' + visibleCount + ' projects';
        } else {
          statusLine.textContent = 'Showing ' + visibleCount + ' of ' + projectCards.length + ' projects \u2014 ' + label;
        }
      }
    });
  });
}

/* ------------------------------------------------------------------
   PROJECT MODAL
------------------------------------------------------------------ */
function initProjectModal() {
  const modal = document.getElementById('projectModal');
  if (!modal) return;

  const modalClose = document.getElementById('modalClose');
  const viewButtons = document.querySelectorAll('.view-project-btn');
  const modalCta = document.getElementById('modalCta');

  const modalImage = document.getElementById('modalImage');
  const modalCategory = document.getElementById('modalCategory');
  const modalTitle = document.getElementById('modalTitle');
  const modalLocation = document.getElementById('modalLocation');
  const modalScope = document.getElementById('modalScope');
  const modalServices = document.getElementById('modalServices');
  const modalDescription = document.getElementById('modalDescription');

  let lastFocusedElement = null;

  function openModal(card) {
    const img = card.querySelector('.project-media img');

    modalImage.src = img ? img.src : '';
    modalImage.alt = img ? img.alt : '';
    modalCategory.textContent = card.getAttribute('data-category-label') || '';
    modalTitle.textContent = card.getAttribute('data-title') || '';
    modalLocation.textContent = card.getAttribute('data-location') || '';
    modalScope.textContent = card.getAttribute('data-scope') || '';
    modalServices.textContent = card.getAttribute('data-services') || '';
    modalDescription.textContent = card.getAttribute('data-description') || '';

    lastFocusedElement = document.activeElement;
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    modalClose.focus();
  }

  function closeModal() {
    modal.hidden = true;
    document.body.style.overflow = '';
    if (lastFocusedElement) lastFocusedElement.focus();
  }

  viewButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const card = btn.closest('.project-card');
      if (card) openModal(card);
    });
  });

  modalClose.addEventListener('click', closeModal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  if (modalCta) {
    modalCta.addEventListener('click', (e) => {
      e.preventDefault();
      closeModal();
      scrollToTarget(document.getElementById('contact'));
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.hidden) closeModal();
  });
}

/* ------------------------------------------------------------------
   FAQ ACCORDION
------------------------------------------------------------------ */
function initFAQ() {
  const faqItems = Array.from(document.querySelectorAll('.faq-item'));
  if (!faqItems.length) return;

  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    const answer = item.querySelector('.faq-answer');

    question.addEventListener('click', () => {
      const isOpen = question.getAttribute('aria-expanded') === 'true';

      faqItems.forEach(other => {
        other.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
        other.querySelector('.faq-answer').style.maxHeight = null;
      });

      if (!isOpen) {
        question.setAttribute('aria-expanded', 'true');
        answer.style.maxHeight = answer.scrollHeight + 'px';
      }
    });
  });

  window.addEventListener('resize', () => {
    faqItems.forEach(item => {
      const question = item.querySelector('.faq-question');
      const answer = item.querySelector('.faq-answer');
      if (question.getAttribute('aria-expanded') === 'true') {
        answer.style.maxHeight = answer.scrollHeight + 'px';
      }
    });
  });
}

/* ------------------------------------------------------------------
   ANIMATED COUNTERS
------------------------------------------------------------------ */
function initCounters() {
  const statNumbers = document.querySelectorAll('.stat-number');
  if (!statNumbers.length) return;

  const DURATION = 1600;

  function animateCounter(el) {
    const target = parseInt(el.getAttribute('data-target'), 10) || 0;
    const suffix = el.getAttribute('data-suffix') || '';
    const start = performance.now();

    function tick(now) {
      const progress = Math.min((now - start) / DURATION, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(eased * target) + suffix;
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  const counterObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.4 });

  statNumbers.forEach(el => counterObserver.observe(el));
}

/* ------------------------------------------------------------------
   REVEAL ON SCROLL
------------------------------------------------------------------ */
function initScrollAnimations() {
  const revealEls = document.querySelectorAll('.reveal');
  if (!revealEls.length) return;

  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry, index) => {
      if (entry.isIntersecting) {
        setTimeout(() => entry.target.classList.add('in-view'), (index % 4) * 60);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  revealEls.forEach(el => revealObserver.observe(el));
}

/* ------------------------------------------------------------------
   CONTACT FORM
------------------------------------------------------------------ */
function initFormValidation() {
  const form = document.getElementById('quoteForm');
  if (!form) return;

  const successMsg = document.getElementById('formSuccess');
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const PHONE_REGEX = /^[0-9+\-\s()]{7,20}$/;
  const REQUIRED = ['fullName', 'email', 'phone', 'projectType', 'requiredService'];

  function setError(field, message) {
    const group = field.closest('.form-group');
    const errorEl = form.querySelector('.error-msg[data-error-for="' + field.name + '"]');
    if (group) group.classList.add('invalid');
    if (errorEl) errorEl.textContent = message;
  }

  function clearError(field) {
    const group = field.closest('.form-group');
    const errorEl = form.querySelector('.error-msg[data-error-for="' + field.name + '"]');
    if (group) group.classList.remove('invalid');
    if (errorEl) errorEl.textContent = '';
  }

  function validateField(field) {
    const value = field.value.trim();

    if (field.hasAttribute('required') && !value) {
      setError(field, 'This field is required.');
      return false;
    }
    if (field.name === 'email' && value && !EMAIL_REGEX.test(value)) {
      setError(field, 'Please enter a valid email address.');
      return false;
    }
    if (field.name === 'phone' && value && !PHONE_REGEX.test(value)) {
      setError(field, 'Please enter a valid phone number.');
      return false;
    }

    clearError(field);
    return true;
  }

  REQUIRED.forEach(name => {
    const field = form.elements[name];
    if (!field) return;
    field.addEventListener('blur', () => validateField(field));
    field.addEventListener('change', () => validateField(field));
    field.addEventListener('input', () => {
      const group = field.closest('.form-group');
      if (group && group.classList.contains('invalid')) validateField(field);
    });
  });

  const submitBtn = form.querySelector('.btn-submit');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Spam trap: a real visitor never sees or fills this field.
    const honeypot = form.elements.botcheck;
    if (honeypot && honeypot.value) return;

    const fields = REQUIRED.map(name => form.elements[name]).filter(Boolean);
    let isValid = true;
    fields.forEach(field => { if (!validateField(field)) isValid = false; });

    if (!isValid) {
      const firstInvalid = form.querySelector('.form-group.invalid input, .form-group.invalid select');
      if (firstInvalid) firstInvalid.focus();
      if (successMsg) successMsg.hidden = true;
      return;
    }

    const originalLabel = submitBtn ? submitBtn.textContent : '';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending\u2026';
    }
    if (successMsg) {
      successMsg.hidden = true;
      successMsg.classList.remove('form-failed');
    }

    try {
      const result = await submitEnquiry(collectFormData(form));
      if (!result || result.success !== true) {
        throw new Error(result && result.message ? result.message : 'Submission rejected');
      }
      showMessage('Thank you. Your inquiry has been received. Our detailing manager will review it and reply within 24 working hours.', false);
      form.reset();
    } catch (err) {
      showMessage('Sorry, your inquiry could not be sent just now. Please email info@rmssteeldetailing.com directly, or try again in a moment.', true);
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = originalLabel;
      }
    }
  });

  function showMessage(text, failed) {
    if (!successMsg) return;
    successMsg.hidden = false;
    successMsg.textContent = text;
    successMsg.classList.toggle('form-failed', !!failed);
  }

  function collectFormData(formEl) {
    const data = {};
    Array.from(formEl.elements).forEach(el => {
      if (!el.name || el.type === 'submit') return;
      if (el.name === 'botcheck') return; // never forward the spam trap
      if (el.type === 'file') {
        data[el.name] = el.files[0] ? el.files[0].name : '';
      } else if (el.type === 'checkbox') {
        if (!Array.isArray(data[el.name])) data[el.name] = [];
        if (el.checked) data[el.name].push(el.value);
      } else {
        data[el.name] = el.value;
      }
    });

    // Flatten checkbox groups so the notification email reads cleanly.
    Object.keys(data).forEach(key => {
      if (Array.isArray(data[key])) data[key] = data[key].join(', ');
    });

    return data;
  }

  async function submitEnquiry(data) {
    const response = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(data)
    });
    return response.json();
  }
}

/* ------------------------------------------------------------------
   BACK TO TOP
------------------------------------------------------------------ */
function initBackToTop() {
  const btn = document.getElementById('backToTop');
  if (!btn) return;

  window.addEventListener('scroll', () => {
    btn.hidden = window.scrollY <= 600;
  }, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

/* ------------------------------------------------------------------
   HERO BACKGROUND GRID
------------------------------------------------------------------ */
function initHeroGrid() {
  const canvas = document.getElementById('heroGrid');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const hero = canvas.closest('.hero');
  let width, height, offset = 0;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function resize() {
    width = canvas.width = hero.offsetWidth;
    height = canvas.height = hero.offsetHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  const gridSize = 52;

  function draw() {
    ctx.clearRect(0, 0, width, height);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
    ctx.lineWidth = 1;

    for (let x = -gridSize + (offset % gridSize); x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = -gridSize + (offset % gridSize); y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  }

  if (prefersReducedMotion) {
    draw();
    return;
  }

  function animate() {
    offset += 0.05;
    draw();
    requestAnimationFrame(animate);
  }
  animate();
}