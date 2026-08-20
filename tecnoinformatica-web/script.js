(function () {
  'use strict';

  const WA_NUMBER = '543442419123';
  const WA_BASE = `https://wa.me/${WA_NUMBER}`;

  // Year in footer
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Header scroll
  const header = document.getElementById('header');
  function onScroll() {
    if (window.scrollY > 20) header.classList.add('scrolled');
    else header.classList.remove('scrolled');
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Mobile menu
  const menuToggle = document.getElementById('menuToggle');
  const nav = document.getElementById('nav');
  if (menuToggle && nav) {
    menuToggle.addEventListener('click', () => {
      nav.classList.toggle('open');
    });
    nav.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => nav.classList.remove('open'));
    });
  }

  // Active nav on scroll
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');
  function updateActiveNav() {
    let current = '';
    sections.forEach(sec => {
      const top = sec.offsetTop - 100;
      if (window.scrollY >= top) current = sec.getAttribute('id');
    });
    navLinks.forEach(link => {
      link.classList.toggle('active', link.getAttribute('href') === '#' + current);
    });
  }
  window.addEventListener('scroll', updateActiveNav, { passive: true });
  updateActiveNav();

  // Gallery lightbox
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxTitle = document.getElementById('lightboxTitle');
  const lightboxDesc = document.getElementById('lightboxDesc');
  const lightboxClose = document.getElementById('lightboxClose');

  document.querySelectorAll('.gallery-item').forEach(item => {
    item.addEventListener('click', () => {
      const title = item.dataset.title || '';
      const desc = item.dataset.desc || '';
      const emoji = item.querySelector('.gallery-placeholder span')?.textContent || '🔧';
      lightboxImg.textContent = emoji;
      lightboxTitle.textContent = title;
      lightboxDesc.textContent = desc;
      lightbox.hidden = false;
      document.body.style.overflow = 'hidden';
    });
  });

  function closeLightbox() {
    lightbox.hidden = true;
    document.body.style.overflow = '';
  }

  if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
  if (lightbox) {
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) closeLightbox();
    });
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lightbox && !lightbox.hidden) closeLightbox();
  });

  // Budget form → WhatsApp
  const budgetForm = document.getElementById('budgetForm');
  if (budgetForm) {
    budgetForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const nombre = document.getElementById('nombre').value.trim();
      const telefono = document.getElementById('telefono').value.trim();
      const tipo = document.getElementById('tipo').value;
      const marca = document.getElementById('marca').value.trim();
      const problema = document.getElementById('problema').value.trim();

      if (!nombre || !telefono || !tipo || !problema) {
        alert('Por favor completá los campos obligatorios.');
        return;
      }

      let msg = `Hola, quiero consultar sobre una reparación.\n\n`;
      msg += `*Nombre:* ${nombre}\n`;
      msg += `*Teléfono:* ${telefono}\n`;
      msg += `*Tipo de equipo:* ${tipo}\n`;
      if (marca) msg += `*Marca/modelo:* ${marca}\n`;
      msg += `*Problema:* ${problema}`;

      const url = `${WA_BASE}?text=${encodeURIComponent(msg)}`;
      window.open(url, '_blank', 'noopener');
    });
  }

  // Contact form → WhatsApp
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const nombre = document.getElementById('c-nombre').value.trim();
      const telefono = document.getElementById('c-telefono').value.trim();
      const mensaje = document.getElementById('c-mensaje').value.trim();

      if (!nombre || !telefono || !mensaje) {
        alert('Por favor completá todos los campos.');
        return;
      }

      let msg = `Hola, mensaje desde la web de TecnoInformática.\n\n`;
      msg += `*Nombre:* ${nombre}\n`;
      msg += `*Teléfono:* ${telefono}\n`;
      msg += `*Mensaje:* ${mensaje}`;

      const url = `${WA_BASE}?text=${encodeURIComponent(msg)}`;
      window.open(url, '_blank', 'noopener');
    });
  }
})();
