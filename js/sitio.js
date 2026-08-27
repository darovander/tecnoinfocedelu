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
      return img;
    }
    return el("div", "sin-foto", placeholder);
  }

  var paginas = [
    { id: "inicio", texto: "Inicio", url: "index.html" },
    { id: "servicios", texto: "Servicios", url: "servicios.html" },
    { id: "taller", texto: "El taller", url: "taller.html" },
    { id: "tienda", texto: "Tienda", url: "tienda.html", modulo: "tienda" },
    { id: "contacto", texto: "Contacto", url: "contacto.html" }
  ];

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
      var link = el("a", p.id === pagina ? "activo" : "", p.texto);
      link.href = p.url;
      if (p.id === pagina) link.setAttribute("aria-current", "page");
      menu.appendChild(link);
    });
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
    if (neg.email) {
      var mail = el("a", null, neg.email);
      mail.href = "mailto:" + neg.email;
      col2.appendChild(mail);
    }
    grilla.appendChild(col2);

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
    boton.href = linkWa("Hola, te consulto por una reparación.");
    boton.target = "_blank";
    boton.rel = "noopener";
    cont.appendChild(boton);
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
    acciones.appendChild(b1);
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
      figura.appendChild(imagenO("Foto del taller", d.hero.imagen, d.hero.epigrafeImagen));
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

    cont.appendChild(datos);
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

  var pintores = {
    inicio: pintarInicio,
    servicios: pintarServicios,
    taller: pintarTaller,
    tienda: pintarTienda,
    contacto: pintarContacto
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
