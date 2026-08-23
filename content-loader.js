// content-loader.js
// Lee content.json y completa el sitio con esos datos.
// Así, para editar texto o fotos, alcanza con editar content.json
// (o usar admin.html) sin tocar el HTML.

(function () {
  function waLink(numero, texto) {
    return `https://wa.me/${numero}${texto ? "?text=" + encodeURIComponent(texto) : ""}`;
  }

  function aplicarContenido(data) {
    window.SITE_CONTENT = data;
    window.WA_NUMBER = data.contacto.whatsapp;

    const msgHero = "Hola, quiero consultar sobre una reparación";

    // --- WhatsApp: todos los enlaces del sitio ---
    document.querySelectorAll("[data-wa-link]").forEach((el) => {
      const msg = el.hasAttribute("data-wa-msg")
        ? el.getAttribute("data-wa-msg")
        : msgHero;
      el.href = waLink(data.contacto.whatsapp, msg);
    });
    document.querySelectorAll("[data-wa-text]").forEach((el) => {
      el.textContent = data.contacto.whatsapp.replace(
        /^549?(\d{4})(\d{6})$/,
        "$1 $2"
      );
    });

    // --- Hero ---
    const h = data.hero;
    setText(".badge", h.badge);
    const h1Normal = document.querySelector("[data-hero-title-normal]");
    const h1Accent = document.querySelector("[data-hero-title-accent]");
    if (h1Normal) h1Normal.textContent = h.titulo_normal;
    if (h1Accent) h1Accent.textContent = h.titulo_destacado;
    setText(".hero-sub", h.subtitulo);

    const statEls = document.querySelectorAll(".hero-stats > div");
    h.stats.forEach((s, i) => {
      if (!statEls[i]) return;
      statEls[i].querySelector("strong").textContent = s.titulo;
      statEls[i].querySelector("span").textContent = s.texto;
    });

    // --- Servicios ---
    const sv = data.servicios;
    setText("#servicios .section-header h2", sv.titulo);
    setText("#servicios .section-header p", sv.subtitulo);
    const grid = document.querySelector("#servicios .grid-4");
    if (grid) {
      grid.innerHTML = sv.items
        .map(
          (it) =>
            `<article class="card"><h3>${escapeHtml(it.titulo)}</h3><p>${escapeHtml(
              it.texto
            )}</p></article>`
        )
        .join("");
    }

    // --- Nosotros ---
    const ns = data.nosotros;
    setText("#nosotros .about .lead", ns.lead);
    const parrafoEls = document.querySelectorAll(
      "#nosotros .about > div > p:not(.lead)"
    );
    ns.parrafos.forEach((p, i) => {
      if (parrafoEls[i]) parrafoEls[i].textContent = p;
    });
    const listaEl = document.querySelector("#nosotros .about ul");
    if (listaEl) {
      listaEl.innerHTML = ns.lista.map((li) => `<li>${escapeHtml(li)}</li>`).join("");
    }
    setText("#nosotros .highlight h3", ns.caja_titulo);
    setText("#nosotros .highlight p", ns.caja_texto);

    // --- Trabajos ---
    const tr = data.trabajos;
    setText("#trabajos .section-header h2", tr.titulo);
    setText("#trabajos .section-header p", tr.subtitulo);
    const gallery = document.querySelector("#gallery");
    if (gallery) {
      gallery.innerHTML = tr.items
        .map((it) => {
          const bg = it.imagen
            ? `style="background-image:url('${it.imagen}');background-size:cover;background-position:center"`
            : "";
          return `<div class="work"><div class="work-img" ${bg}></div><div class="work-cap">${escapeHtml(
            it.caption
          )}</div></div>`;
        })
        .join("");
    }

    // --- Contacto ---
    const c = data.contacto;
    setText("[data-contacto-direccion]", c.direccion, true);
    setText("[data-contacto-localidad]", c.localidad, true);
    setText("[data-contacto-horarios]", c.horarios);
    const igEls = document.querySelectorAll("[data-instagram-link]");
    igEls.forEach((el) => {
      el.href = `https://www.instagram.com/${c.instagram}/`;
      el.textContent = "@" + c.instagram;
    });
    const mapFrame = document.querySelector("[data-map]");
    if (mapFrame) {
      mapFrame.src = `https://www.google.com/maps?q=${encodeURIComponent(
        c.direccion + ", " + c.localidad
      )}&output=embed`;
    }

    document.dispatchEvent(new CustomEvent("content-loaded", { detail: data }));
  }

  function setText(selector, value, allowHtml) {
    const el = document.querySelector(selector);
    if (!el || value == null) return;
    if (allowHtml) el.innerHTML = value;
    else el.textContent = value;
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  fetch("content.json")
    .then((r) => r.json())
    .then(aplicarContenido)
    .catch((err) => console.error("No se pudo cargar content.json:", err));
})();
