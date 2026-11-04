/**
 * Ramona Lenesche - Consilier Juridic
 * Client-Side Interactivity & Form Handling
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Sticky Header scroll effect
  const header = document.querySelector('.header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });

  // 2. Mobile Navigation Toggle
  const mobileToggle = document.querySelector('.mobile-toggle');
  const navLinks = document.querySelector('.nav-links');

  const closeMenu = () => {
    navLinks.classList.remove('active');
    document.body.classList.remove('menu-open');
    mobileToggle.setAttribute('aria-expanded', 'false');
  };

  if (mobileToggle && navLinks) {
    mobileToggle.addEventListener('click', () => {
      const open = navLinks.classList.toggle('active');
      document.body.classList.toggle('menu-open', open);
      mobileToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    // Close menu when clicking a link
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', closeMenu);
    });

    // Close on Escape and when resizing back to desktop
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeMenu();
    });
    window.addEventListener('resize', () => {
      if (window.innerWidth > 768) closeMenu();
    });
  }

  // 3. FAQ Accordion Toggle
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const questionBtn = item.querySelector('.faq-question');
    if (questionBtn) {
      questionBtn.addEventListener('click', () => {
        const isActive = item.classList.contains('active');
        
        // Close others
        faqItems.forEach(otherItem => {
          if (otherItem !== item) {
            otherItem.classList.remove('active');
          }
        });

        // Toggle current
        if (isActive) {
          item.classList.remove('active');
        } else {
          item.classList.add('active');
        }
      });
    }
  });

  // 4. Contact Form Handler (WhatsApp only, no required fields)
  const contactForm = document.getElementById('legalContactForm');

  const sendWhatsApp = () => {
    const name = document.getElementById('clientName')?.value.trim() || '';
    const phone = document.getElementById('clientPhone')?.value.trim() || '';
    const email = document.getElementById('clientEmail')?.value.trim() || '';
    const service = document.getElementById('serviceSelect')?.value || '';
    const message = document.getElementById('clientMessage')?.value.trim() || '';

    // Always start with the greeting
    const lines = ['Bună ziua, doamna Ramona Lenesche!'];

    // Only add lines for fields the visitor actually filled in
    const hasDetails = name || phone || email || message;
    if (name) lines.push(`Mă numesc ${name}.`);
    if (phone) lines.push(`Telefon: ${phone}.`);
    if (email) lines.push(`E-mail: ${email}.`);
    if (hasDetails && service) lines.push(`Serviciu solicitat: ${service}.`);
    if (message) lines.push(`Detalii: ${message}`);

    const text = encodeURIComponent(lines.join('\n'));
    window.open(`https://wa.me/40740351606?text=${text}`, '_blank');
  };

  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      sendWhatsApp();
    });
  }

  // 5. Scroll reveal animations (added via JS so content stays visible without JS)
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const revealSelectors = [
    '.section-head', '.service-card', '.process-step', '.about-card-visual',
    '.about-content', '.project-banner', '.faq-item', '.contact-info-card', '.form-card'
  ];
  const revealEls = document.querySelectorAll(revealSelectors.join(','));

  if (!reduceMotion && 'IntersectionObserver' in window) {
    revealEls.forEach((el, i) => {
      el.classList.add('reveal');
      // slight stagger for items inside the same grid
      el.style.transitionDelay = `${(i % 4) * 70}ms`;
    });

    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    revealEls.forEach(el => io.observe(el));
  }

  // 6. Scrollspy — highlight the active section in the navigation
  const navItems = Array.from(document.querySelectorAll('.nav-link'));
  const sections = navItems
    .map(link => {
      const id = link.getAttribute('href');
      return id && id.startsWith('#') ? document.querySelector(id) : null;
    })
    .filter(Boolean);

  if (sections.length && 'IntersectionObserver' in window) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = '#' + entry.target.id;
          navItems.forEach(link => {
            link.classList.toggle('active', link.getAttribute('href') === id);
          });
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });

    sections.forEach(sec => spy.observe(sec));
  }

  // 7. GDPR / Privacy modal
  const gdprModal = document.getElementById('gdprModal');
  if (gdprModal) {
    let lastFocused = null;

    const openModal = () => {
      lastFocused = document.activeElement;
      gdprModal.classList.add('open');
      gdprModal.setAttribute('aria-hidden', 'false');
      document.body.classList.add('menu-open');
      const closeBtn = gdprModal.querySelector('.modal-close');
      if (closeBtn) closeBtn.focus();
    };

    const closeModal = () => {
      gdprModal.classList.remove('open');
      gdprModal.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('menu-open');
      if (lastFocused && lastFocused.focus) lastFocused.focus();
    };

    document.querySelectorAll('[data-open-gdpr]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        openModal();
      });
    });

    gdprModal.querySelectorAll('[data-close-gdpr]').forEach(el => {
      el.addEventListener('click', closeModal);
    });

    // Close on backdrop click
    gdprModal.addEventListener('click', (e) => {
      if (e.target === gdprModal) closeModal();
    });

    // Close on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && gdprModal.classList.contains('open')) closeModal();
    });
  }

  // 8. Cookie consent banner (simple, remembered in localStorage)
  const cookieBanner = document.getElementById('cookieBanner');
  const cookieAccept = document.getElementById('cookieAccept');
  if (cookieBanner) {
    let consent = null;
    try { consent = localStorage.getItem('cookieConsent'); } catch (e) { /* storage blocked */ }

    if (!consent) {
      setTimeout(() => cookieBanner.classList.add('show'), 700);
    }

    if (cookieAccept) {
      cookieAccept.addEventListener('click', () => {
        try { localStorage.setItem('cookieConsent', 'accepted'); } catch (e) { /* ignore */ }
        cookieBanner.classList.remove('show');
      });
    }
  }
});
