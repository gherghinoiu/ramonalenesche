/**
 * Ramona Leneșche - Consilier Juridic
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
  if (mobileToggle && navLinks) {
    mobileToggle.addEventListener('click', () => {
      navLinks.classList.toggle('active');
    });

    // Close menu when clicking link
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('active');
      });
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

  // 4. Contact Form Handler (Supports WhatsApp & Mailto)
  const contactForm = document.getElementById('legalContactForm');
  const btnWhatsAppSend = document.getElementById('btnWhatsAppSend');
  const formSuccess = document.getElementById('formSuccess');

  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const name = document.getElementById('clientName').value.trim();
      const phone = document.getElementById('clientPhone').value.trim();
      const email = document.getElementById('clientEmail').value.trim();
      const service = document.getElementById('serviceSelect').value;
      const message = document.getElementById('clientMessage').value.trim();

      const subject = encodeURIComponent(`Solicitare Consultanță Juridică - ${name} (${service})`);
      const body = encodeURIComponent(
        `Nume: ${name}\n` +
        `Telefon: ${phone}\n` +
        `Email: ${email}\n` +
        `Serviciu solicitat: ${service}\n\n` +
        `Mesaj / Detalii proiect:\n${message}\n`
      );

      // Open mail client
      window.location.href = `mailto:ramona.lenesche@gmail.com?subject=${subject}&body=${body}`;

      if (formSuccess) {
        formSuccess.style.display = 'block';
      }
    });
  }

  if (btnWhatsAppSend) {
    btnWhatsAppSend.addEventListener('click', (e) => {
      e.preventDefault();
      const name = document.getElementById('clientName')?.value.trim() || 'Client';
      const phone = document.getElementById('clientPhone')?.value.trim() || '-';
      const service = document.getElementById('serviceSelect')?.value || 'Consultanță Generală';
      const message = document.getElementById('clientMessage')?.value.trim() || '';

      const text = encodeURIComponent(
        `Bună ziua, doamna Ramona Leneșche!\n` +
        `Mă numesc ${name} (Tel: ${phone}).\n` +
        `Doresc informații privind: ${service}.\n` +
        (message ? `Detalii: ${message}` : '')
      );

      window.open(`https://wa.me/40740351606?text=${text}`, '_blank');
    });
  }
});
