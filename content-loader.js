// content-loader.js
// Lee content.json y aplica colores, textos e imágenes en toda la página.
// Si content.json no carga por algún motivo, el sitio se ve igual que antes (contenido fijo en el HTML).

(function () {
  function textoSeguro(v, fallback) {
    return (v === undefined || v === null || v === "") ? fallback : v;
  }

  function aplicarColores(colores) {
    if (!colores) return;
    var root = document.documentElement;
    Object.keys(colores).forEach(function (clave) {
      if (colores[clave]) root.style.setProperty("--" + clave, colores[clave]);
    });
  }

  function aplicarWhatsapp(numero) {
    if (!numero) return;
    // Actualiza el número que usa script.js para armar los mensajes
    if (typeof window.WA !== "undefined") {
      window.WA = numero;
    } else {
      window.WA = numero;
    }
    // Reescribe todos los links wa.me/xxxx que ya están en el HTML
    document.querySelectorAll('a[href*="wa.me/"]').forEach(function (a) {
      a.setAttribute("href", a.getAttribute("href").replace(/wa\.me\/\d+/, "wa.me/" + numero));
    });
    var telHref = document.querySelector('a[href^="https://wa.me/' + '"]');
  }

  function set(id, html) {
    var el = document.getElementById(id);
    if (el) el.innerHTML = html;
  }

  function aplicarHero(hero) {
    if (!hero) return;
    set("heroBadge", textoSeguro(hero.badge, ""));
    set("heroTituloPre", textoSeguro(hero.tituloPre, ""));
    set("heroTituloDestacado", textoSeguro(hero.tituloDestacado, ""));
    set("heroSub", textoSeguro(hero.subtitulo, ""));

    var cont = document.getElementById("heroStats");
    if (cont && Array.isArray(hero.stats)) {
      cont.innerHTML = hero.stats.map(function (s) {
        return '<div><strong>' + textoSeguro(s.titulo, "") + '</strong><span>' + textoSeguro(s.detalle, "") + '</span></div>';
      }).join("");
    }
  }

  function aplicarServicios(servicios) {
    var cont = document.getElementById("serviciosGrid");
    if (!cont || !Array.isArray(servicios)) return;
    cont.innerHTML = servicios.map(function (s) {
      var img = s.imagen
        ? '<div class="card-img"><img src="' + s.imagen + '" alt="' + (s.titulo || "") + '" loading="lazy"></div>'
        : "";
      return '<article class="card">' + img +
        '<h3>' + textoSeguro(s.titulo, "") + '</h3>' +
        '<p>' + textoSeguro(s.descripcion, "") + '</p>' +
        '</article>';
    }).join("");
  }

  function aplicarNosotros(n) {
    if (!n) return;
    set("nosotrosLead", textoSeguro(n.lead, ""));
    set("nosotrosParrafo1", textoSeguro(n.parrafo1, ""));
    set("nosotrosParrafo2", textoSeguro(n.parrafo2, ""));
    set("nosotrosHighlightTitulo", textoSeguro(n.highlightTitulo, ""));
    set("nosotrosHighlightTexto", textoSeguro(n.highlightTexto, ""));

    var lista = document.getElementById("nosotrosLista");
    if (lista && Array.isArray(n.items)) {
      lista.innerHTML = n.items.map(function (it) { return "<li>" + it + "</li>"; }).join("");
    }
  }

  function aplicarTrabajos(trabajos) {
    var cont = document.getElementById("gallery");
    if (!cont || !Array.isArray(trabajos)) return;
    cont.innerHTML = trabajos.map(function (t) {
      var img = t.imagen ? '<img src="' + t.imagen + '" alt="' + (t.caption || "") + '" loading="lazy">' : "";
      return '<div class="work"><div class="work-img">' + img + '</div><div class="work-cap">' + textoSeguro(t.caption, "") + '</div></div>';
    }).join("");
  }

  function aplicarContacto(c) {
    if (!c) return;
    set("contactoDireccion", textoSeguro(c.direccion, "") + "<br>" + textoSeguro(c.localidad, ""));
    set("contactoInstagramTexto", textoSeguro(c.instagram, ""));
    set("contactoHorarios", textoSeguro(c.horarios, ""));
  }

  function aplicarFooter(f) {
    if (!f) return;
    set("footerDescripcion", textoSeguro(f.descripcion, ""));
    set("footerCopy", textoSeguro(f.copyright, ""));
  }

  fetch("content.json", { cache: "no-store" })
    .then(function (r) { return r.json(); })
    .then(function (data) {
      aplicarColores(data.colores);
      aplicarWhatsapp(data.whatsapp);
      aplicarHero(data.hero);
      aplicarServicios(data.servicios);
      aplicarNosotros(data.nosotros);
      aplicarTrabajos(data.trabajos);
      aplicarContacto(data.contacto);
      aplicarFooter(data.footer);
    })
    .catch(function (err) {
      console.warn("No se pudo cargar content.json, se muestra el contenido fijo del HTML.", err);
    });
})();
