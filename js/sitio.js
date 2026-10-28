(function () {
  "use strict";

  // Vista previa desde admin.html: index.html?borrador=1 lee lo que está sin publicar.
  var borrador = null;
  if (location.search.indexOf("borrador=1") > -1) {
    try { borrador = JSON.parse(localStorage.getItem("tecno_borrador")); } catch (e) { borrador = null; }
  }

  var C = borrador || window.CONTENIDO;
  if (!C) return;

  // Aplica la paleta de colores (si el admin la definió) antes de pintar nada.
  (function aplicarColores() {
    var colores = C.colores;
    if (!colores) return;
    var raiz = document.documentElement;
    Object.keys(colores).forEach(function (clave) {
      if (colores[clave]) raiz.style.setProperty(clave, colores[clave]);
    });
  })();

  var neg = C.negocio;
  var mod = C.modulos || {};
  var pagina = document.body.dataset.pagina;

  function el(tag, clase, texto) {
    var nodo = document.createElement(tag);
    if (clase) nodo.className = clase;
    if (texto != null) nodo.textContent = texto;
    return nodo;
  }

  function html(id) { return document.getElementById(id); }

  // ---- Medición de visitas y clics ----
  // Vercel Analytics cuenta las visitas. Si en "analitica.ga4" va un ID (G-XXXXXXX),
  // Google Analytics 4 también registra los clics en WhatsApp, Instagram y compras.
  var ana = C.analitica || { vercel: true };
  var local = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);

  function medir(evento, datos) {
    if (borrador || local) return;
    datos = datos || {};
    datos.pagina = pagina;
    if (pagina === "producto") {
      var t = document.querySelector("h1");
      if (t) datos.producto = t.textContent.slice(0, 80);
    }
    try { if (window.gtag) window.gtag("event", evento, datos); } catch (e) {}
    try { if (window.va) window.va("event", { name: evento, data: datos }); } catch (e) {}
  }

  (function iniciarMedicion() {
    if (borrador || local) return;
    if (ana.vercel !== false) {
      window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };
      var v = document.createElement("script");
      v.defer = true;
      v.src = "/_vercel/insights/script.js";
      document.head.appendChild(v);
    }
    if (ana.ga4 && /^G-[A-Z0-9]{6,}$/.test(ana.ga4)) {
      window.dataLayer = window.dataLayer || [];
      window.gtag = function () { window.dataLayer.push(arguments); };
      window.gtag("js", new Date());
      window.gtag("config", ana.ga4);
      var g = document.createElement("script");
      g.async = true;
      g.src = "https://www.googletagmanager.com/gtag/js?id=" + ana.ga4;
      document.head.appendChild(g);
    }
    document.addEventListener("click", function (ev) {
      var n = ev.target && ev.target.closest ? ev.target.closest("a, button") : null;
      if (!n) return;
      var href = n.getAttribute("href") || "";
      var texto = (n.textContent || "").trim().slice(0, 60);
      if (/wa\.me|whatsapp\.com/.test(href) || (n.tagName === "BUTTON" && /whatsapp/i.test(texto))) return medir("click_whatsapp", { texto: texto });
      if (href.indexOf("instagram.com") > -1) return medir("click_instagram", { texto: texto });
      if (href.indexOf("tel:") === 0) return medir("click_llamada", { texto: texto });
      if (href.indexOf("mailto:") === 0) return medir("click_email", { texto: texto });
      if (/^Comprar ahora/.test(texto)) return medir("comprar_ahora");
      if (/^Agregar al carrito/.test(texto)) return medir("agregar_carrito");
      if (/^Pagar con Mercado Pago/.test(texto)) return medir("pagar_mercado_pago");
    });
  })();

  function linkWa(mensaje) {
    var base = neg.whatsappLink || "#";
    if (!mensaje) return base;
    return base + (base.indexOf("?") > -1 ? "&" : "?") + "text=" + encodeURIComponent(mensaje);
  }

  function imagenO(placeholder, src, alt) {
    if (src) {
      var img = el("img");
      img.src = src;
      img.alt = alt || "";
      img.loading = "lazy";
      img.decoding = "async";
      return img;
    }
    return el("div", "sin-foto", placeholder);
  }

  var paginas = [
    { id: "inicio", texto: "Inicio", url: "index.html" },
    { id: "servicios", texto: "Servicios", url: "servicios.html" },
    { id: "taller", texto: "El taller", url: "taller.html" },
    { id: "tecnicos", texto: "Para técnicos", url: "tecnicos.html" },
    { id: "tienda", texto: "Tienda", url: "tienda.html", modulo: "tienda" },
    { id: "contacto", texto: "Contacto", url: "contacto.html" }
  ];

  // producto.html y carrito.html cuentan como "Tienda" en el menú
  var paginaMenu = (pagina === "producto" || pagina === "carrito") ? "tienda" : pagina;

  function itemsCarrito() {
    try {
      var c = JSON.parse(localStorage.getItem("tecno_carrito")) || [];
      return c.reduce(function (t, l) { return t + (parseInt(l.cantidad, 10) || 0); }, 0);
    } catch (e) { return 0; }
  }

  function navegables() {
    return paginas.filter(function (p) { return !p.modulo || mod[p.modulo]; });
  }

  function bloqueMarca() {
    var a = el("a", "marca");
    a.href = "index.html";
    if (neg.logo) {
      var img = el("img");
      img.src = neg.logo;
      img.alt = neg.nombre;
      a.appendChild(img);
    } else {
      var caja = el("span");
      caja.appendChild(el("span", "marca-nombre", neg.nombre));
      caja.appendChild(el("span", "marca-bajada", neg.ciudad));
      a.appendChild(caja);
    }
    return a;
  }

  function pintarCabecera() {
    var destino = html("cabecera");
    if (!destino) return;

    var barra = el("header", "barra");
    var fila = el("div", "contenedor barra-fila");
    fila.appendChild(bloqueMarca());

    var boton = el("button", "hamburguesa");
    boton.setAttribute("aria-label", "Abrir menú");
    boton.setAttribute("aria-expanded", "false");
    boton.appendChild(el("span"));

    var menu = el("nav", "menu");
    menu.id = "menu-principal";
    navegables().forEach(function (p) {
      var link = el("a", p.id === paginaMenu ? "activo" : "", p.texto);
      link.href = p.url;
      if (p.id === paginaMenu) link.setAttribute("aria-current", "page");
      menu.appendChild(link);
    });
    var carro = null;
    if (mod.tienda) {
      carro = el("a", "menu-carrito" + (pagina === "carrito" ? " activo" : ""));
      carro.href = "carrito.html";
      carro.setAttribute("aria-label", "Carrito");
      carro.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 4h2l2.4 10.2a1.5 1.5 0 0 0 1.5 1.1h8.6a1.5 1.5 0 0 0 1.4-1l2.1-6.3H6.2"/><circle cx="9.5" cy="19.5" r="1.4"/><circle cx="17" cy="19.5" r="1.4"/></svg>';
      var cuenta = el("span", "menu-carrito-n");
      cuenta.id = "carrito-cuenta";
      var n = itemsCarrito();
      cuenta.textContent = n;
      if (!n) cuenta.hidden = true;
      carro.appendChild(cuenta);
    }
    var cta = el("a", "boton wa chico", "WhatsApp");
    cta.href = linkWa("Hola, te consulto por una reparación.");
    cta.target = "_blank";
    cta.rel = "noopener";
    menu.appendChild(cta);

    var actualizandoSombra = false;
    function actualizarSombra() {
      barra.classList.toggle("con-sombra", window.scrollY > 8);
      actualizandoSombra = false;
    }
    window.addEventListener("scroll", function () {
      if (actualizandoSombra) return;
      actualizandoSombra = true;
      requestAnimationFrame(actualizarSombra);
    });
    actualizarSombra();

    boton.addEventListener("click", function () {
      var abierto = menu.classList.toggle("abierto");
      boton.setAttribute("aria-expanded", abierto ? "true" : "false");
    });

    fila.appendChild(menu);
    if (carro) fila.appendChild(carro);
    fila.appendChild(boton);
    barra.appendChild(fila);
    destino.appendChild(barra);
  }

  function pintarPie() {
    var destino = html("pie");
    if (!destino) return;

    var pie = el("footer", "pie");
    var cont = el("div", "contenedor");
    var grilla = el("div", "pie-grilla");

    var col1 = el("div");
    col1.appendChild(bloqueMarca());
    col1.appendChild(el("p", null, neg.lema));
    grilla.appendChild(col1);

    var col2 = el("div");
    col2.appendChild(el("h4", null, "Contacto"));
    var wa = el("a", "wa", "WhatsApp " + neg.whatsapp);
    wa.href = linkWa("Hola, te consulto por una reparación.");
    wa.target = "_blank";
    wa.rel = "noopener";
    col2.appendChild(wa);
    if (neg.instagram) {
      var ig = el("a", null, "Instagram " + neg.instagram);
      ig.href = neg.instagramLink;
      ig.target = "_blank";
      ig.rel = "noopener";
      col2.appendChild(ig);
    }
    if (neg.resenaLink) {
      var res = el("a", null, "Dejanos tu reseña en Google");
      res.href = neg.resenaLink;
      res.target = "_blank";
      res.rel = "noopener";
      col2.appendChild(res);
    }
    if (neg.email) {
      var mail = el("a", null, neg.email);
      mail.href = "mailto:" + neg.email;
      col2.appendChild(mail);
    }
    grilla.appendChild(col2);
    var segui = el("a", null, "Seguí tu reparación");
    segui.href = "seguimiento.html";
    col2.appendChild(segui);
    var presu = el("a", null, "Pedir presupuesto");
    presu.href = "presupuesto.html";
    col2.appendChild(presu);
    var red = el("a", null, "Red de técnicos");
    red.href = "red.html";
    col2.appendChild(red);
    var puntos = el("a", null, "Puntos de recepción");
    puntos.href = "puntos.html";
    col2.appendChild(puntos);
    var acceso = el("a", null, "Acceso técnicos");
    acceso.href = "acceso.html";
    col2.appendChild(acceso);

    var col3 = el("div");
    col3.appendChild(el("h4", null, "Taller"));
    var dir = el("a", null, neg.direccion);
    dir.href = neg.mapa || "#";
    dir.target = "_blank";
    dir.rel = "noopener";
    col3.appendChild(dir);
    col3.appendChild(el("p", null, neg.ciudad));
    col3.appendChild(el("p", null, neg.horarios));
    grilla.appendChild(col3);

    cont.appendChild(grilla);

    var legal = el("div", "pie-legal");
    legal.appendChild(el("span", null, neg.nombre + " · " + new Date().getFullYear()));
    legal.appendChild(el("span", null, neg.dominio || ""));
    cont.appendChild(legal);

    pie.appendChild(cont);
    destino.appendChild(pie);

    var flota = el("a", "wa-flotante");
    flota.href = linkWa("Hola, te consulto por una reparación.");
    flota.target = "_blank";
    flota.rel = "noopener";
    flota.setAttribute("aria-label", "Escribir por WhatsApp");
    flota.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.5 2 12.04 2zm5.8 14.06c-.24.68-1.4 1.3-1.94 1.34-.5.05-.97.24-3.28-.68-2.76-1.09-4.5-3.9-4.64-4.08-.13-.18-1.1-1.46-1.1-2.79 0-1.33.7-1.98.95-2.25.24-.27.53-.34.71-.34.18 0 .35 0 .51.01.16.01.38-.06.6.46.24.55.8 1.9.87 2.04.07.14.12.3.02.48-.09.18-.14.29-.28.45-.14.16-.29.35-.41.47-.14.14-.28.29-.12.56.16.27.72 1.18 1.55 1.92 1.06.95 1.96 1.24 2.24 1.38.27.14.43.12.59-.07.16-.18.68-.79.86-1.06.18-.27.36-.23.6-.14.25.09 1.58.75 1.85.88.27.14.45.2.51.32.07.11.07.64-.17 1.32z"/></svg>';
    document.body.appendChild(flota);
  }

  function pintarMeta(datos) {
    if (!datos) return;
    if (datos.tituloPestana) document.title = datos.tituloPestana;
    var meta = document.querySelector('meta[name="description"]');
    if (meta && datos.metaDescripcion) meta.setAttribute("content", datos.metaDescripcion);
  }

  function cierre(datos) {
    if (!datos) return null;
    var seccion = el("section", "cierre");
    var cont = el("div", "contenedor");
    cont.appendChild(el("div", "etiqueta", "Consultas"));
    cont.appendChild(el("h2", null, datos.titulo));
    cont.appendChild(el("p", null, datos.texto));
    var boton = el("a", "boton wa", datos.boton || "Escribir por WhatsApp");
    boton.href = linkWa(datos.mensaje || "Hola, te consulto por una reparación.");
    boton.target = "_blank";
    boton.rel = "noopener";
    var fila = el("div", "hoja-acciones");
    fila.style.marginBottom = "0";
    fila.appendChild(boton);
    if (pagina !== "presupuesto") {
      var pres = el("a", "boton hueco", "Pedir presupuesto");
      pres.href = "presupuesto.html";
      fila.appendChild(pres);
    }
    cont.appendChild(fila);
    seccion.appendChild(cont);
    return seccion;
  }

  // Franja de Instagram: invita a seguir el perfil y, si hay publicaciones cargadas
  // (código del link: instagram.com/p/CODIGO/), las muestra incrustadas.
  function seccionInstagram(datos) {
    var ig = datos || {};
    if (ig.activo === false || !neg.instagramLink) return null;
    var codigos = (ig.publicaciones || []).filter(function (c) {
      return /^[A-Za-z0-9_-]{5,20}$/.test(c);
    }).slice(0, 2);
    var chips = ig.chips || ["Bajo microscopio", "Soldadura SMD", "Casos reales"];

    var seccion = el("section", "seccion ajustada");
    var cont = el("div", "contenedor");

    // Panel con fondo degradado y resplandores, para que no quede un recuadro flotando sobre el negro.
    var panel = el("div", "aparece");
    panel.style.cssText = "position:relative;overflow:hidden;border:1px solid var(--linea);" +
      "background:linear-gradient(135deg,var(--panel-alto) 0%,var(--panel) 55%,var(--fondo) 100%);" +
      "padding:clamp(26px,5vw,60px)";
    var brilloAzul = el("div");
    brilloAzul.style.cssText = "position:absolute;right:-90px;top:50%;width:560px;height:560px;transform:translateY(-50%);" +
      "background:radial-gradient(circle,rgba(41,169,255,0.20),transparent 66%);pointer-events:none";
    var brilloNaranja = el("div");
    brilloNaranja.style.cssText = "position:absolute;left:-120px;bottom:-200px;width:440px;height:440px;" +
      "background:radial-gradient(circle,rgba(254,149,54,0.13),transparent 66%);pointer-events:none";
    var filete = el("div");
    filete.style.cssText = "position:absolute;left:0;top:0;width:100%;height:3px;" +
      "background:linear-gradient(90deg,var(--naranja),var(--azul) 55%,transparent)";
    panel.appendChild(brilloAzul);
    panel.appendChild(brilloNaranja);
    panel.appendChild(filete);

    // texto a la izquierda y publicación a la derecha; en pantallas angostas se apilan solos
    var fila = el("div");
    fila.style.cssText = "position:relative;display:flex;flex-wrap:wrap;align-items:center;gap:40px 64px";

    var texto = el("div");
    texto.style.cssText = "flex:1 1 320px;min-width:0";
    var cab = el("div", "seccion-cabeza");
    cab.style.marginBottom = "28px";
    cab.appendChild(el("div", "etiqueta", ig.etiqueta || "Instagram"));
    cab.appendChild(el("h2", null, ig.titulo || "Mirá cómo trabajamos"));
    cab.appendChild(el("p", null, ig.texto || "Reparaciones reales y novedades del taller en " + (neg.instagram || "Instagram") + "."));
    texto.appendChild(cab);
    var acciones = el("div", "hoja-acciones");
    acciones.style.marginBottom = "26px";
    var boton = el("a", "boton", ig.boton || "Seguinos en Instagram");
    boton.href = neg.instagramLink;
    boton.target = "_blank";
    boton.rel = "noopener";
    acciones.appendChild(boton);
    texto.appendChild(acciones);
    if (chips.length) {
      var marcas = el("div", "marcas");
      marcas.style.paddingTop = "0";
      chips.forEach(function (c) { marcas.appendChild(el("span", null, c)); });
      texto.appendChild(marcas);
    }
    fila.appendChild(texto);

    if (codigos.length) {
      var videos = el("div");
      videos.style.cssText = "display:flex;flex-wrap:wrap;justify-content:center;gap:32px;flex:0 1 auto;max-width:100%;padding-right:14px";
      var marcos = [];
      codigos.forEach(function (codigo) {
        // marco con borde, sombra profunda y un desplazado azul que le da volumen
        var marcoCaja = el("div");
        marcoCaja.style.cssText = "padding:10px;background:var(--panel-alto);border:1px solid rgba(41,169,255,0.35);" +
          "box-shadow:14px 14px 0 var(--azul-hondo),0 30px 70px rgba(0,0,0,0.6),0 0 70px rgba(41,169,255,0.14);" +
          "transition:transform 0.25s ease;max-width:100%";
        marcoCaja.addEventListener("mouseenter", function () { marcoCaja.style.transform = "translate(-4px,-6px)"; });
        marcoCaja.addEventListener("mouseleave", function () { marcoCaja.style.transform = ""; });
        var marco = el("iframe");
        marco.src = "https://www.instagram.com/p/" + codigo + "/embed";
        marco.title = "Publicación de Instagram";
        marco.loading = "lazy";
        marco.setAttribute("scrolling", "no");
        marco.style.cssText = "display:block;width:min(100%,360px);height:700px;max-width:100%;border:0;border-radius:6px;background:#fff";
        marcos.push(marco);
        marcoCaja.appendChild(marco);
        videos.appendChild(marcoCaja);
      });
      // Instagram avisa cuánto mide su contenido; así el recuadro no queda cortado ni con blanco de más.
      window.addEventListener("message", function (ev) {
        if (String(ev.origin).indexOf("instagram.com") === -1) return;
        var m = ev.data;
        if (typeof m === "string") {
          try { m = JSON.parse(m); } catch (e) { return; }
        }
        if (!m || m.type !== "MEASURE" || !m.details || !m.details.height) return;
        marcos.forEach(function (marco) {
          if (marco.contentWindow === ev.source) {
            marco.style.height = Math.min(1400, Math.max(300, Math.ceil(m.details.height))) + "px";
          }
        });
      });
      fila.appendChild(videos);
    }

    panel.appendChild(fila);
    cont.appendChild(panel);
    seccion.appendChild(cont);
    return seccion;
  }

  function pintarInicio() {
    var d = C.inicio;
    pintarMeta(d);
    var raiz = html("contenido");

    var cabecera = el("section", "contenedor");
    var hoja = el("div", "hoja");
    var interno = el("div", "hoja-contenido");
    interno.appendChild(el("div", "etiqueta", d.hero.etiqueta));
    interno.appendChild(el("h1", null, d.hero.titulo));
    interno.appendChild(el("p", "hoja-texto", d.hero.texto));

    var acciones = el("div", "hoja-acciones");
    var b1 = el("a", "boton wa", d.hero.botonPrimario);
    b1.href = linkWa("Hola, te consulto por una reparación.");
    b1.target = "_blank";
    b1.rel = "noopener";
    var b2 = el("a", "boton hueco", d.hero.botonSecundario);
    b2.href = "servicios.html";
    var b3 = el("a", "boton", "Pedir presupuesto");
    b3.href = "presupuesto.html";
    acciones.appendChild(b1);
    acciones.appendChild(b3);
    acciones.appendChild(b2);
    interno.appendChild(acciones);
    hoja.appendChild(interno);

    var rotulo = el("div", "rotulo");
    [["Especialidad", d.rotulo.linea1], ["Experiencia", d.rotulo.linea2], ["Marcas", d.rotulo.linea3]].forEach(function (par) {
      var caja = el("div");
      caja.appendChild(el("span", null, par[0]));
      caja.appendChild(document.createTextNode(par[1]));
      rotulo.appendChild(caja);
    });
    hoja.appendChild(rotulo);
    cabecera.appendChild(hoja);

    if (d.hero.imagen) {
      var figura = el("figure", "hero-foto");
      var fotoPortada = imagenO("Foto del taller", d.hero.imagen, d.hero.epigrafeImagen);
      if (fotoPortada.tagName === "IMG") {
        fotoPortada.loading = "eager";
        fotoPortada.setAttribute("fetchpriority", "high");
      }
      figura.appendChild(fotoPortada);
      if (d.hero.epigrafeImagen) figura.appendChild(el("figcaption", null, d.hero.epigrafeImagen));
      cabecera.appendChild(figura);
    }
    raiz.appendChild(cabecera);

    var sDif = el("section", "seccion");
    var cDif = el("div", "contenedor");
    var cabDif = el("div", "seccion-cabeza");
    cabDif.appendChild(el("div", "etiqueta", "Cómo trabajamos"));
    cabDif.appendChild(el("h2", null, "La diferencia está en el diagnóstico"));
    cDif.appendChild(cabDif);
    var grilla = el("div", "grilla");
    d.diferenciales.forEach(function (item, i) {
      var tarjeta = el("article", "tarjeta aparece");
      tarjeta.style.setProperty("--i", i);
      tarjeta.appendChild(el("div", "etiqueta", item.etiqueta));
      tarjeta.appendChild(el("h3", null, item.titulo));
      tarjeta.appendChild(el("p", null, item.texto));
      grilla.appendChild(tarjeta);
    });
    cDif.appendChild(grilla);
    sDif.appendChild(cDif);
    raiz.appendChild(sDif);

    var sProc = el("section", "seccion ajustada");
    var cProc = el("div", "contenedor");
    var cabProc = el("div", "seccion-cabeza");
    cabProc.appendChild(el("div", "etiqueta", "Paso a paso"));
    cabProc.appendChild(el("h2", null, "Qué pasa con tu equipo desde que entra"));
    cProc.appendChild(cabProc);
    var lista = el("div", "proceso");
    var ol = el("ol");
    d.proceso.forEach(function (paso, i) {
      var li = el("li", "aparece");
      li.style.setProperty("--i", i);
      var caja = el("div");
      caja.appendChild(el("h3", null, paso.titulo));
      caja.appendChild(el("p", null, paso.texto));
      li.appendChild(caja);
      ol.appendChild(li);
    });
    lista.appendChild(ol);
    cProc.appendChild(lista);

    if (d.marcas && d.marcas.length) {
      var marcas = el("div", "marcas");
      marcas.style.marginTop = "36px";
      d.marcas.forEach(function (m) { marcas.appendChild(el("span", null, m)); });
      cProc.appendChild(marcas);
    }
    sProc.appendChild(cProc);
    raiz.appendChild(sProc);

    if (mod.seguimiento) raiz.appendChild(seccionSeguimiento());

    var sIg = seccionInstagram(d.instagram);
    if (sIg) raiz.appendChild(sIg);

    var fin = cierre(d.cierre);
    if (fin) raiz.appendChild(fin);
  }

  function pintarServicios() {
    var d = C.servicios;
    pintarMeta(d);
    var raiz = html("contenido");

    var seccion = el("section", "seccion");
    var cont = el("div", "contenedor");
    var cab = el("div", "seccion-cabeza");
    cab.appendChild(el("div", "etiqueta", "Qué hacemos"));
    cab.appendChild(el("h1", null, d.titulo));
    cab.appendChild(el("p", null, d.intro));
    cont.appendChild(cab);

    var lista = el("div", "servicios");
    d.items.forEach(function (item, i) {
      var fila = el("article", "servicio aparece");
      fila.style.setProperty("--i", i);

      var izq = el("div");
      izq.appendChild(el("div", "etiqueta", item.etiqueta));
      fila.appendChild(izq);

      var det = el("details", "servicio-detalle");
      var sum = el("summary");
      if (item.imagen) {
        var foto = el("div", "servicio-foto");
        var img = el("img");
        img.src = item.imagen;
        img.alt = item.titulo;
        img.loading = "lazy";
        foto.appendChild(img);
        sum.appendChild(foto);
      }
      sum.appendChild(el("h3", null, item.titulo));
      det.appendChild(sum);

      var cuerpo = el("div", "servicio-cuerpo");
      cuerpo.appendChild(el("p", null, item.texto));
      if (item.detalle && item.detalle.length) {
        var der = el("ul");
        item.detalle.forEach(function (t) { der.appendChild(el("li", null, t)); });
        cuerpo.appendChild(der);
      }
      det.appendChild(cuerpo);

      fila.appendChild(det);
      lista.appendChild(fila);
    });
    cont.appendChild(lista);

    if (d.aviso) {
      var aviso = el("div", "aviso");
      aviso.style.marginTop = "34px";
      aviso.appendChild(el("h3", null, d.aviso.titulo));
      aviso.appendChild(el("p", null, d.aviso.texto));
      cont.appendChild(aviso);
    }

    seccion.appendChild(cont);
    raiz.appendChild(seccion);
    raiz.appendChild(cierre(C.inicio.cierre));
  }

  function pintarTaller() {
    var d = C.taller;
    pintarMeta(d);
    var raiz = html("contenido");

    var seccion = el("section", "seccion");
    var cont = el("div", "contenedor");
    var cab = el("div", "seccion-cabeza");
    cab.appendChild(el("div", "etiqueta", "Quiénes somos"));
    cab.appendChild(el("h1", null, d.titulo));
    cab.appendChild(el("p", null, d.intro));
    cont.appendChild(cab);

    var bloques = el("div", "bloques");
    d.bloques.forEach(function (b) {
      var caja = el("article", "bloque aparece");
      caja.appendChild(el("h3", null, b.titulo));
      caja.appendChild(el("p", null, b.texto));
      bloques.appendChild(caja);
    });
    cont.appendChild(bloques);
    seccion.appendChild(cont);
    raiz.appendChild(seccion);

    if (mod.galeria && d.galeria && d.galeria.length) {
      var sg = el("section", "seccion ajustada");
      var cg = el("div", "contenedor");
      var cabg = el("div", "seccion-cabeza");
      cabg.appendChild(el("div", "etiqueta", "El banco de trabajo"));
      cabg.appendChild(el("h2", null, "Adentro del taller"));
      cg.appendChild(cabg);
      var gal = el("div", "galeria");
      d.galeria.forEach(function (f, i) {
        var fig = el("figure", "aparece");
        fig.style.setProperty("--i", i);
        fig.appendChild(imagenO("Sin foto cargada", f.imagen, f.epigrafe));
        if (f.epigrafe) fig.appendChild(el("figcaption", null, f.epigrafe));
        gal.appendChild(fig);
      });
      cg.appendChild(gal);
      sg.appendChild(cg);
      raiz.appendChild(sg);
    }

    raiz.appendChild(cierre(C.inicio.cierre));
  }

  function pintarTecnicos() {
    var d = C.tecnicos;
    pintarMeta(d);
    var raiz = html("contenido");

    var seccion = el("section", "seccion");
    var cont = el("div", "contenedor");
    var cab = el("div", "seccion-cabeza");
    cab.appendChild(el("div", "etiqueta", "Derivaciones"));
    cab.appendChild(el("h1", null, d.titulo));
    cab.appendChild(el("p", null, d.intro));
    cont.appendChild(cab);

    var bloques = el("div", "bloques");
    d.bloques.forEach(function (b) {
      var caja = el("article", "bloque aparece");
      caja.appendChild(el("h3", null, b.titulo));
      caja.appendChild(el("p", null, b.texto));
      bloques.appendChild(caja);
    });
    cont.appendChild(bloques);
    seccion.appendChild(cont);
    raiz.appendChild(seccion);

    if (d.proceso && d.proceso.length) {
      var sProc = el("section", "seccion ajustada");
      var cProc = el("div", "contenedor");
      var cabProc = el("div", "seccion-cabeza");
      cabProc.appendChild(el("div", "etiqueta", "Cómo trabajamos"));
      cabProc.appendChild(el("h2", null, "Del contacto a la devolución"));
      cProc.appendChild(cabProc);
      var lista = el("div", "proceso");
      var ol = el("ol");
      d.proceso.forEach(function (paso, i) {
        var li = el("li", "aparece");
        li.style.setProperty("--i", i);
        var caja = el("div");
        caja.appendChild(el("h3", null, paso.titulo));
        caja.appendChild(el("p", null, paso.texto));
        li.appendChild(caja);
        ol.appendChild(li);
      });
      lista.appendChild(ol);
      cProc.appendChild(lista);
      sProc.appendChild(cProc);
      raiz.appendChild(sProc);
    }

    // Invitación a la Red de técnicos
    if (d.red && d.red.bloques && d.red.bloques.length) {
      var sRed = el("section", "seccion ajustada");
      var cRed = el("div", "contenedor");
      var cabRed = el("div", "seccion-cabeza");
      cabRed.appendChild(el("div", "etiqueta", d.red.etiqueta || "Red de técnicos"));
      cabRed.appendChild(el("h2", null, d.red.titulo));
      if (d.red.intro) cabRed.appendChild(el("p", null, d.red.intro));
      cRed.appendChild(cabRed);
      var blRed = el("div", "bloques");
      d.red.bloques.forEach(function (b) {
        var caja = el("article", "bloque aparece");
        caja.appendChild(el("h3", null, b.titulo));
        caja.appendChild(el("p", null, b.texto));
        blRed.appendChild(caja);
      });
      cRed.appendChild(blRed);
      if (d.red.nota) {
        var pNota = el("p", null, d.red.nota);
        pNota.style.marginTop = "18px";
        cRed.appendChild(pNota);
      }
      var accRed = el("div");
      accRed.style.display = "flex";
      accRed.style.flexWrap = "wrap";
      accRed.style.gap = "12px";
      accRed.style.marginTop = "22px";
      var aSumar = el("a", "boton", d.red.botonSumar || "Quiero sumarme");
      aSumar.href = "acceso.html";
      accRed.appendChild(aSumar);
      var aVer = el("a", "boton hueco", d.red.botonVer || "Ver la red");
      aVer.href = "red.html";
      accRed.appendChild(aVer);
      cRed.appendChild(accRed);
      sRed.appendChild(cRed);
      raiz.appendChild(sRed);
    }

    if (d.preguntas && d.preguntas.length) {
      var sf = el("section", "seccion ajustada");
      var cf = el("div", "contenedor");
      var cabf = el("div", "seccion-cabeza");
      cabf.appendChild(el("div", "etiqueta", "Preguntas frecuentes"));
      cabf.appendChild(el("h2", null, "Antes de escribirme"));
      cf.appendChild(cabf);
      var faq = el("div", "faq");
      d.preguntas.forEach(function (p) {
        var det = el("details");
        var sum = el("summary", null, p.pregunta);
        det.appendChild(sum);
        det.appendChild(el("p", null, p.respuesta));
        faq.appendChild(det);
      });
      cf.appendChild(faq);
      sf.appendChild(cf);
      raiz.appendChild(sf);
    }

    raiz.appendChild(cierre(d.cierre));
  }

  function pintarTienda() {
    var d = C.tienda;
    pintarMeta(d);
    var raiz = html("contenido");

    if (!mod.tienda) {
      var vacio = el("section", "seccion");
      var cv = el("div", "contenedor");
      cv.appendChild(el("h1", null, "Tienda no disponible"));
      cv.appendChild(el("p", null, "Esta sección está desactivada. Consultá repuestos por WhatsApp."));
      var volver = el("a", "boton", "Volver al inicio");
      volver.href = "index.html";
      cv.appendChild(volver);
      vacio.appendChild(cv);
      raiz.appendChild(vacio);
      return;
    }

    var seccion = el("section", "seccion");
    var cont = el("div", "contenedor");
    var cab = el("div", "seccion-cabeza");
    cab.appendChild(el("div", "etiqueta", "Repuestos y accesorios"));
    cab.appendChild(el("h1", null, d.titulo));
    cab.appendChild(el("p", null, d.intro));
    cont.appendChild(cab);

    var grilla = el("div", "productos");
    (d.productos || []).forEach(function (p, i) {
      var caja = el("article", "producto aparece");
      caja.style.setProperty("--i", i);
      caja.appendChild(imagenO("Sin foto", p.imagen, p.nombre));
      var cuerpo = el("div", "cuerpo");
      if (p.estado) cuerpo.appendChild(el("div", "estado", p.estado));
      cuerpo.appendChild(el("h3", null, p.nombre));
      if (p.texto) cuerpo.appendChild(el("p", null, p.texto));
      if (p.precio) cuerpo.appendChild(el("div", "precio", (d.moneda || "$") + " " + p.precio));
      var pedir = el("a", "boton wa chico", "Consultar");
      pedir.href = linkWa("Hola, me interesa: " + p.nombre);
      pedir.target = "_blank";
      pedir.rel = "noopener";
      cuerpo.appendChild(pedir);
      caja.appendChild(cuerpo);
      grilla.appendChild(caja);
    });
    cont.appendChild(grilla);

    if (d.aviso) {
      var aviso = el("div", "aviso");
      aviso.style.marginTop = "34px";
      aviso.appendChild(el("p", null, d.aviso));
      cont.appendChild(aviso);
    }
    seccion.appendChild(cont);
    raiz.appendChild(seccion);
  }

  function seccionSeguimiento() {
    var s = C.seguimiento || {};
    var seccion = el("section", "seccion ajustada");
    var cont = el("div", "contenedor");
    var caja = el("div", "seguimiento");
    caja.appendChild(el("div", "etiqueta", "Estado de reparación"));
    caja.appendChild(el("h2", null, s.titulo || "Seguí tu reparación"));
    caja.appendChild(el("p", null, s.texto || ""));

    var form = el("form");
    var input = el("input");
    input.type = "text";
    input.placeholder = s.placeholder || "Número de orden";
    input.setAttribute("aria-label", "Número de orden");
    var boton = el("button", "boton", "Consultar estado");
    boton.type = "submit";
    form.appendChild(input);
    form.appendChild(boton);

    var salida = el("div", "resultado-orden");
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var orden = input.value.trim();
      if (!orden) return;
      if (!s.endpoint) {
        salida.textContent = "Consulta de estado no configurada. Escribinos por WhatsApp.";
        return;
      }
      salida.textContent = "Consultando...";
      fetch(s.endpoint.replace("{orden}", encodeURIComponent(orden)))
        .then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); })
        .then(function (datos) {
          salida.textContent = datos.estado
            ? "Orden " + orden + ": " + datos.estado
            : "No encontramos esa orden.";
        })
        .catch(function () {
          salida.textContent = "No pudimos consultar el estado ahora. Escribinos por WhatsApp.";
        });
    });

    caja.appendChild(form);
    caja.appendChild(salida);
    cont.appendChild(caja);
    seccion.appendChild(cont);
    return seccion;
  }

  function pintarContacto() {
    var d = C.contacto;
    pintarMeta(d);
    var raiz = html("contenido");

    var seccion = el("section", "seccion");
    var cont = el("div", "contenedor");
    var cab = el("div", "seccion-cabeza");
    cab.appendChild(el("div", "etiqueta", "Dónde estamos"));
    cab.appendChild(el("h1", null, d.titulo));
    cab.appendChild(el("p", null, d.intro));
    cont.appendChild(cab);

    var datos = el("div", "datos");

    var dWa = el("div", "dato wa");
    dWa.appendChild(el("span", null, "WhatsApp"));
    var aWa = el("a", null, neg.whatsapp);
    aWa.href = linkWa("Hola, te consulto por una reparación.");
    aWa.target = "_blank";
    aWa.rel = "noopener";
    dWa.appendChild(aWa);
    datos.appendChild(dWa);

    var dDir = el("div", "dato");
    dDir.appendChild(el("span", null, "Taller"));
    var aDir = el("a", null, neg.direccion);
    aDir.href = neg.mapa || "#";
    aDir.target = "_blank";
    aDir.rel = "noopener";
    dDir.appendChild(aDir);
    dDir.appendChild(el("p", null, neg.ciudad));
    datos.appendChild(dDir);

    var dHor = el("div", "dato");
    dHor.appendChild(el("span", null, "Turnos"));
    dHor.appendChild(el("strong", null, neg.horarios));
    datos.appendChild(dHor);

    if (neg.instagram) {
      var dIg = el("div", "dato");
      dIg.appendChild(el("span", null, "Instagram"));
      var aIg = el("a", null, neg.instagram);
      aIg.href = neg.instagramLink;
      aIg.target = "_blank";
      aIg.rel = "noopener";
      dIg.appendChild(aIg);
      datos.appendChild(dIg);
    }

    if (neg.resenaLink) {
      var dRes = el("div", "dato ancho");
      var tRes = el("div");
      tRes.appendChild(el("span", null, "Opiniones en Google"));
      tRes.appendChild(el("strong", null, "¿Ya te atendimos? Contanos cómo te fue."));
      if (neg.opinionesLink) {
        var pRes = el("p");
        var aOp = el("a", null, "Leer lo que dicen nuestros clientes");
        aOp.href = neg.opinionesLink;
        aOp.target = "_blank";
        aOp.rel = "noopener";
        pRes.appendChild(aOp);
        tRes.appendChild(pRes);
      }
      dRes.appendChild(tRes);
      var aRes = el("a", "boton", "Dejanos tu reseña");
      aRes.href = neg.resenaLink;
      aRes.target = "_blank";
      aRes.rel = "noopener";
      dRes.appendChild(aRes);
      datos.appendChild(dRes);
    }

    cont.appendChild(datos);

    // Mapa del taller (Google Maps embebido por dirección, sin clave)
    var consulta = [neg.direccion, neg.ciudad].filter(Boolean).join(", ");
    if (consulta) {
      var cajaMapa = el("div", "mapa-taller");
      cajaMapa.style.marginTop = "28px";
      var marco = el("iframe");
      marco.src = "https://www.google.com/maps?q=" + encodeURIComponent(consulta) + "&hl=es&z=16&output=embed";
      marco.title = "Mapa con la ubicación del taller";
      marco.loading = "lazy";
      marco.referrerPolicy = "no-referrer-when-downgrade";
      marco.setAttribute("allowfullscreen", "");
      marco.style.width = "100%";
      marco.style.height = "380px";
      marco.style.border = "1px solid var(--linea)";
      marco.style.borderRadius = "12px";
      marco.style.background = "var(--panel)";
      marco.style.display = "block";
      cajaMapa.appendChild(marco);
      if (neg.mapa) {
        var pMapa = el("p");
        pMapa.style.marginTop = "10px";
        var aMapa = el("a", null, "Abrir en Google Maps · Cómo llegar");
        aMapa.href = neg.mapa;
        aMapa.target = "_blank";
        aMapa.rel = "noopener";
        pMapa.appendChild(aMapa);
        cajaMapa.appendChild(pMapa);
      }
      cont.appendChild(cajaMapa);
    }

    seccion.appendChild(cont);
    raiz.appendChild(seccion);

    if (mod.seguimiento) raiz.appendChild(seccionSeguimiento());

    if (d.preguntas && d.preguntas.length) {
      var sf = el("section", "seccion ajustada");
      var cf = el("div", "contenedor");
      var cabf = el("div", "seccion-cabeza");
      cabf.appendChild(el("div", "etiqueta", "Preguntas frecuentes"));
      cabf.appendChild(el("h2", null, "Antes de escribirnos"));
      cf.appendChild(cabf);
      var faq = el("div", "faq");
      d.preguntas.forEach(function (p) {
        var det = el("details");
        var sum = el("summary", null, p.pregunta);
        det.appendChild(sum);
        det.appendChild(el("p", null, p.respuesta));
        faq.appendChild(det);
      });
      cf.appendChild(faq);
      sf.appendChild(cf);
      raiz.appendChild(sf);
    }

    raiz.appendChild(cierre(C.inicio.cierre));
  }

  function revelar() {
    var objetivos = document.querySelectorAll(".aparece");
    if (!("IntersectionObserver" in window)) {
      objetivos.forEach(function (n) { n.classList.add("visible"); });
      return;
    }
    var obs = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("visible");
          obs.unobserve(e.target);
        }
      });
    }, { rootMargin: "0px 0px -60px 0px" });
    objetivos.forEach(function (n) { obs.observe(n); });
  }

  // La tienda completa vive en js/tienda.js. Si ese archivo no está, queda la grilla simple de antes.
  function pintarConTienda() {
    if (!mod.tienda) return pintarTienda();
    if (window.TiendaApp) {
      return window.TiendaApp.pintar(pagina, {
        C: C, el: el, linkWa: linkWa, pintarMeta: pintarMeta, revelar: revelar, raiz: html("contenido")
      });
    }
    pintarTienda();
  }

  // La red de técnicos (directorio, perfiles y paneles) vive en js/red.js.
  function pintarConRed() {
    var raiz = html("contenido");
    if (!window.RedApp) {
      var s = el("section", "seccion");
      var c = el("div", "contenedor");
      c.appendChild(el("h1", null, "Red de técnicos"));
      c.appendChild(el("p", null, "No se pudo cargar esta sección. Recargá la página en un rato."));
      s.appendChild(c);
      raiz.appendChild(s);
      return;
    }
    window.RedApp.pintar(pagina, {
      C: C, el: el, linkWa: linkWa, pintarMeta: pintarMeta, revelar: revelar, raiz: raiz,
      formPresupuesto: formPresupuesto
    });
  }

  // Formulario de presupuesto: arma el pedido completo y lo manda por WhatsApp.
  var FALLAS_PLACA = ["no-enciende", "sin-video", "no-carga", "liquido"];

  // Deja registro del pedido en la base de la red (no frena nada si falla).
  var SUPABASE_URL = "https://kofqyguccmpjkktlziou.supabase.co";
  var SUPABASE_CLAVE = "sb_publishable_WTMCRpDE19XgV0TMhZ7MSA_MFO6__cM";
  function registrarPedido(datos) {
    try {
      fetch(SUPABASE_URL + "/rest/v1/rpc/registrar_pedido", {
        method: "POST",
        keepalive: true,
        headers: { "Content-Type": "application/json", apikey: SUPABASE_CLAVE },
        body: JSON.stringify({ datos: datos })
      }).catch(function () { });
    } catch (e) { }
  }

  var FALLAS = [
    ["no-enciende", "No enciende / está muerta"],
    ["sin-video", "Enciende pero no da imagen"],
    ["no-carga", "No carga la batería / no toma el cargador"],
    ["se-apaga", "Se apaga sola o calienta mucho"],
    ["liquido", "Se mojó o le cayó líquido"],
    ["golpe", "Se cayó o recibió un golpe"],
    ["pantalla", "Pantalla rota, con líneas o manchas"],
    ["teclado", "Teclado, touchpad o puertos que no andan"],
    ["lenta", "Lenta, con virus o hay que formatear"],
    ["otra", "Otra falla"]
  ];

  function pintarPresupuesto() {
    pintarMeta({
      tituloPestana: "Pedir presupuesto | TecnoInformática",
      metaDescripcion: "Pedí presupuesto para reparar tu notebook o PC en Concepción del Uruguay: contanos la marca, el modelo y qué le pasa, y te respondemos por WhatsApp."
    });
    var raiz = html("contenido");
    var seccion = el("section", "seccion");
    var cont = el("div", "contenedor");
    var cab = el("div", "seccion-cabeza");
    cab.appendChild(el("div", "etiqueta", "Presupuesto"));
    cab.appendChild(el("h1", null, "Contanos qué le pasa a tu equipo"));
    cab.appendChild(el("p", null, "Completá estos datos y se te abre WhatsApp con el pedido listo para mandar. Así te podemos orientar desde el primer mensaje."));
    cont.appendChild(cab);

    var caja = el("div", "r-caja");
    caja.style.maxWidth = "820px";
    formPresupuesto(caja, { enlace: linkWa, saludo: "Hola, quiero pedir un presupuesto:" });
    cont.appendChild(caja);
    seccion.appendChild(cont);
    raiz.appendChild(seccion);
  }

  // Se usa en /presupuesto (llega a TecnoInformática) y en el perfil de cada técnico de la red (le llega a él).
  // op.enlace(mensaje) devuelve el link de WhatsApp; op.saludo es la primera línea del pedido.
  function formPresupuesto(caja, op) {
    var aviso = el("div", "r-aviso");
    aviso.setAttribute("role", "status");
    caja.appendChild(aviso);

    var f = el("form", "r-form dos");
    function campo(etiqueta, control, ayuda, ancho) {
      var l = el("label", ancho ? "ancho" : null);
      l.appendChild(el("span", null, etiqueta));
      l.appendChild(control);
      if (ayuda) l.appendChild(el("small", null, ayuda));
      f.appendChild(l);
      return control;
    }
    function selector(nombre, opciones, valor) {
      var sel = el("select");
      sel.name = nombre;
      opciones.forEach(function (o) {
        var op = el("option", null, o[1]);
        op.value = o[0];
        if (o[0] === valor) op.selected = true;
        sel.appendChild(op);
      });
      return sel;
    }
    function entrada(tipo, nombre, extra) {
      var i = el("input");
      i.type = tipo;
      i.name = nombre;
      Object.keys(extra || {}).forEach(function (k) { i.setAttribute(k, extra[k]); });
      return i;
    }

    var param = new URLSearchParams(location.search).get("falla") || "";
    var marcas = ((C.inicio && C.inicio.marcas) || []).map(function (m) { return [m, m]; });

    var tipo = campo("Tipo de equipo", selector("tipo", [["", "Elegí…"], ["Notebook", "Notebook"], ["PC de escritorio", "PC de escritorio"], ["All-in-one", "All-in-one"], ["Placa madre", "Placa madre suelta"], ["Otro", "Otro"]], ""));
    var marca = campo("Marca", selector("marca", [["", "Elegí…"]].concat(marcas).concat([["Otra", "Otra / no sé"]]), ""));
    var modelo = campo("Modelo (opcional)", entrada("text", "modelo", { maxlength: "80", placeholder: "Ej: IdeaPad 330-15IKB" }), "Suele estar en la etiqueta de abajo del equipo.", true);
    var falla = campo("¿Qué le pasa?", selector("falla", [["", "Elegí la falla…"]].concat(FALLAS), param), null, true);
    if (op.avisoPlaca) {
      var notaPlaca = el("small", "r-nota-placa", op.textoAviso || "Si la falla necesita una reparación más compleja, la resolvemos junto al taller TecnoInformática.");
      falla.parentNode.appendChild(notaPlaca);
      var verNota = function () { notaPlaca.hidden = FALLAS_PLACA.indexOf(falla.value) < 0; };
      falla.addEventListener("change", verNota);
      verNota();
    }
    var detalle = el("textarea");
    detalle.name = "detalle";
    detalle.maxLength = 600;
    detalle.placeholder = "Desde cuándo pasa, si se mojó o se cayó, qué probaste…";
    campo("Contanos más (opcional)", detalle, null, true);
    var revisado = campo("¿Ya lo revisó otro técnico?", selector("revisado", [["No", "No"], ["Sí", "Sí"]], "No"));
    var nombre = campo("Tu nombre", entrada("text", "nombre", { maxlength: "60", autocomplete: "given-name" }));
    var localidad = campo("Localidad (opcional)", entrada("text", "localidad", { maxlength: "60", placeholder: "Ej: Concepción del Uruguay" }));

    var acc = el("div", "acciones ancho");
    var enviar = el("button", "boton wa", "Enviar por WhatsApp");
    enviar.type = "submit";
    acc.appendChild(enviar);
    acc.appendChild(el("small", null, "Si tenés fotos del equipo o de la etiqueta, mandalas después en el mismo chat."));
    f.appendChild(acc);
    caja.appendChild(f);

    function mostrar(texto, tipoAviso) {
      aviso.className = "r-aviso" + (tipoAviso ? " " + tipoAviso : "");
      aviso.textContent = texto;
      if (texto) aviso.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }

    f.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!tipo.value || !falla.value) return mostrar("Elegí el tipo de equipo y qué le pasa.", "error");
      var textoFalla = falla.options[falla.selectedIndex].textContent;
      var equipo = [tipo.value, marca.value && marca.value !== "Otra" ? marca.value : "", modelo.value.trim()].filter(Boolean).join(" ");
      var lineas = [
        op.saludo,
        "• Equipo: " + equipo,
        "• Falla: " + textoFalla
      ];
      if (detalle.value.trim()) lineas.push("• Detalle: " + detalle.value.trim());
      lineas.push("• ¿Lo revisó otro técnico?: " + revisado.value);
      var quien = [nombre.value.trim(), localidad.value.trim() ? "(" + localidad.value.trim() + ")" : ""].filter(Boolean).join(" ");
      if (quien) lineas.push("• Nombre: " + quien);
      window.open(op.enlace(lineas.join("\n")), "_blank", "noopener");
      registrarPedido({
        tecnico: op.tecnico || "",
        tipo: tipo.value,
        marca: marca.value,
        modelo: modelo.value.trim(),
        falla: falla.value,
        falla_texto: textoFalla,
        detalle: detalle.value.trim(),
        revisado: revisado.value,
        nombre: nombre.value.trim(),
        localidad: localidad.value.trim()
      });
      mostrar("¡Listo! Se abrió WhatsApp con tu pedido: solo tocá enviar. Si no se abrió, revisá que el navegador no haya bloqueado la ventana.", "ok");
    });
  }

  var pintores = {
    inicio: pintarInicio,
    servicios: pintarServicios,
    taller: pintarTaller,
    tecnicos: pintarTecnicos,
    tienda: pintarConTienda,
    producto: pintarConTienda,
    carrito: pintarConTienda,
    contacto: pintarContacto,
    presupuesto: pintarPresupuesto,
    seguimiento: function () {
      var raiz = html("contenido");
      if (!window.Seguimiento) {
        raiz.appendChild(el("p", "respaldo", "No se pudo cargar el seguimiento. Escribinos por WhatsApp."));
        return;
      }
      window.Seguimiento.pintar({ el: el, pintarMeta: pintarMeta, linkWa: linkWa, raiz: raiz });
    },
    red: pintarConRed,
    tecnico: pintarConRed,
    puntos: pintarConRed,
    acceso: pintarConRed,
    panel: pintarConRed
  };

  pintarCabecera();
  if (pintores[pagina]) {
    // el HTML trae un titulo y un parrafo fijos para los buscadores; se descartan al pintar
    document.getElementById("contenido").innerHTML = "";
    pintores[pagina]();
  }
  pintarPie();
  revelar();
})();
