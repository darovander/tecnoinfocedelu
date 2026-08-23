# TecnoInformática — Sitio web

Sitio estático listo para subir a cualquier hosting (Netlify, Vercel, GitHub Pages, cPanel, etc.).

## Archivos

- `index.html` — página principal (todas las secciones)
- `styles.css` — estilos
- `script.js` — menú, formularios a WhatsApp, lightbox de galería

## WhatsApp

Número configurado: **+54 3442 419123**

Los formularios de presupuesto y contacto abren WhatsApp con el mensaje armado automáticamente.

## Cómo agregar fotos a la galería

1. Creá una carpeta `img/` junto a `index.html`.
2. Subí tus fotos (ej: `img/caso1.jpg`).
3. En `index.html`, reemplazá cada `.gallery-placeholder` por algo así:

```html
<img src="img/caso1.jpg" alt="Descripción del trabajo" loading="lazy">
```

Y actualizá los atributos `data-title` y `data-desc` del `.gallery-item`.

## SEO básico

Ya incluye:
- Título y meta description orientados a “reparación notebooks Concepción del Uruguay”
- Open Graph
- Estructura semántica
- Texto alternativo preparado (al poner imágenes reales)

## Dominio

Podés conectar cualquier dominio. Si usás Netlify o Vercel es solo arrastrar la carpeta o conectar un repo.

## Personalización rápida

- Colores: editá las variables en `:root` de `styles.css`
- Textos: todo está en `index.html`
- Horarios: agregalos en la sección Contacto cuando los tengas definidos

---

Hecho para Darío · TecnoInformática · Concepción del Uruguay
