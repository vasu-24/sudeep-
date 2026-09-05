/* =====================================================================
   RMS BUREAU — SCRIPT
   Division-aware navigation, position tracking, filters, modal, form
===================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initScrollSpy();
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

/* Sections that use a dark background, so the side tracker stays visible */
const DARK_SECTIONS = ['divisions', 'process', 'why-rms'];

/* Sections that belong to a division, used for colour tinting */
const DIVISION_TINT = { architecture: 'a', detailing: 'b' };

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
    navbar.classList.toggle('solid', y > 40);
    const announceH = announcementBar ? announcementBar.offsetHeight : 0;
    navbar.classList.toggle('hide-announce', y > announceH);
  }
  window.addEventListener('scroll', handleScroll, { passive: true });
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
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      closeMenu();
      scrollToTarget(target);
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
  const statusDivision = document.getElementById('statusDivision');
  const statusPrev = document.getElementById('statusPrev');
  const statusNext = document.getElementById('statusNext');
  const progressBar = document.getElementById('progressBar');

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

    const tint = DIVISION_TINT[id] || null;

    if (statusBar) {
      statusBar.classList.remove('tint-a', 'tint-b');
      if (tint) statusBar.classList.add('tint-' + tint);
    }
    if (progressBar) {
      progressBar.classList.remove('tint-a', 'tint-b');
      if (tint) progressBar.classList.add('tint-' + tint);
    }

    navLinks.forEach(link => {
      const isActive = link.getAttribute('href') === '#' + id;
      link.classList.toggle('active', isActive);
      if (isActive) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    });

    dots.forEach(dot => dot.classList.toggle('active', dot.dataset.section === id));

    if (statusIndex) statusIndex.textContent = (section.dataset.index || '') + ' / ' + TOTAL;
    if (statusName) statusName.textContent = section.dataset.name || '';

    if (statusDivision) {
      const division = section.dataset.division;
      if (division) {
        statusDivision.textContent = division;
        statusDivision.hidden = false;
      } else {
        statusDivision.hidden = true;
      }
    }

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
   PROJECT FILTER — division and building type combined
------------------------------------------------------------------ */
function initProjectFilter() {
  const divisionBtns = Array.from(document.querySelectorAll('.div-btn'));
  const typeBtns = Array.from(document.querySelectorAll('.type-btn'));
  const projectCards = Array.from(document.querySelectorAll('.project-card'));
  const emptyState = document.getElementById('projectsEmpty');
  const statusLine = document.getElementById('filterStatus');

  if (!projectCards.length) return;

  let activeDivision = 'all';
  let activeType = 'all';
  let divisionLabel = 'Both Divisions';
  let typeLabel = 'All Types';

  function apply() {
    let visibleCount = 0;

    projectCards.forEach(card => {
      const divisionOk = activeDivision === 'all' || card.getAttribute('data-division') === activeDivision;
      const typeOk = activeType === 'all' || card.getAttribute('data-category') === activeType;

      if (divisionOk && typeOk) {
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
        statusLine.textContent = 'No projects match ' + divisionLabel + ' + ' + typeLabel;
      } else if (activeDivision === 'all' && activeType === 'all') {
        statusLine.textContent = 'Showing all ' + visibleCount + ' projects';
      } else {
        statusLine.textContent = 'Showing ' + visibleCount + ' of ' + projectCards.length +
          ' projects \u2014 ' + divisionLabel + ' \u2022 ' + typeLabel;
      }
    }
  }

  divisionBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      divisionBtns.forEach(b => { b.classList.remove('active'); b.setAttribute('aria-selected', 'false'); });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      activeDivision = btn.getAttribute('data-division');
      divisionLabel = btn.textContent.trim();
      apply();
    });
  });

  typeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      typeBtns.forEach(b => { b.classList.remove('active'); b.setAttribute('aria-selected', 'false'); });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      activeType = btn.getAttribute('data-filter');
      typeLabel = btn.textContent.trim();
      apply();
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
  const modalDivision = document.getElementById('modalDivision');
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

    if (modalDivision) {
      modalDivision.textContent = card.getAttribute('data-division-label') || '';
      modalDivision.classList.remove('badge-a', 'badge-b');
      const div = card.getAttribute('data-division');
      if (div === 'architecture') modalDivision.classList.add('badge-a');
      if (div === 'detailing') modalDivision.classList.add('badge-b');
    }

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

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const fields = REQUIRED.map(name => form.elements[name]).filter(Boolean);
    let isValid = true;
    fields.forEach(field => { if (!validateField(field)) isValid = false; });

    if (!isValid) {
      const firstInvalid = form.querySelector('.form-group.invalid input, .form-group.invalid select');
      if (firstInvalid) firstInvalid.focus();
      if (successMsg) successMsg.hidden = true;
      return;
    }

    const data = collectFormData(form);
    submitEnquiry(data);

    if (successMsg) {
      successMsg.hidden = false;
      successMsg.textContent = 'Thank you. Your inquiry for ' + (data.division || 'RMS Bureau') +
        ' has been received. We will reply within 24 working hours.';
    }

    form.reset();
    const firstChoice = form.querySelector('.division-choice input');
    if (firstChoice) firstChoice.checked = true;
  });

  function collectFormData(formEl) {
    const data = {};
    Array.from(formEl.elements).forEach(el => {
      if (!el.name || el.type === 'submit') return;
      if (el.type === 'file') data[el.name] = el.files[0] ? el.files[0].name : '';
      else if (el.type === 'radio') { if (el.checked) data[el.name] = el.value; }
      else if (el.type === 'checkbox') {
        if (!Array.isArray(data[el.name])) data[el.name] = [];
        if (el.checked) data[el.name].push(el.value);
      } else data[el.name] = el.value;
    });
    return data;
  }

  function submitEnquiry(data) {
    console.log('Project enquiry captured:', data);
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