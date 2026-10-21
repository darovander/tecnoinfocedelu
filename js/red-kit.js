// Kit de difusión de la Red de técnicos: flyer con QR (estado y cuadrado) + textos listos.
// red.js lo llama desde el panel de un alumno aprobado: RedKit.pintar(destino, perfil, ayudas).
(function () {
  "use strict";

  var COL = {
    fondo: "#05080d",
    panel: "#0c1219",
    linea: "#1b2531",
    texto: "#eaf1f8",
    medio: "#9daebf",
    suave: "#6a7a8c",
    azul: "#29a9ff",
    naranja: "#fe9536",
    verde: "#25d366"
  };
  var F_TIT = '"IBM Plex Sans Condensed", "Arial Narrow", sans-serif';
  var F_TXT = '"IBM Plex Sans", system-ui, sans-serif';
  var F_MONO = '"IBM Plex Mono", ui-monospace, monospace';

  var A; // ayudas que pasa red.js (el, boton, enlaceExterno, cajaCon, aviso, dominio)

  function cargarImagen(src, cruzado) {
    return new Promise(function (ok) {
      if (!src) return ok(null);
      var img = new Image();
      if (cruzado) img.crossOrigin = "anonymous";
      img.onload = function () { ok(img); };
      img.onerror = function () { ok(null); };
      img.src = src;
    });
  }

  function fuentesListas() {
    if (!document.fonts || !document.fonts.load) return Promise.resolve();
    return Promise.all([
      document.fonts.load("700 80px " + F_TIT),
      document.fonts.load("600 40px " + F_TIT),
      document.fonts.load("400 36px " + F_TXT),
      document.fonts.load("600 36px " + F_TXT),
      document.fonts.load("500 28px " + F_MONO)
    ]).catch(function () { });
  }

  function telefono(d) {
    if (!d) return "";
    if (/^11/.test(d)) return "11 " + d.slice(2, 6) + "-" + d.slice(6);
    return d.slice(0, 4) + " " + d.slice(4);
  }

  function servicios(s) {
    return String(s || "").split(/\n|,|;/).map(function (x) { return x.trim(); }).filter(Boolean);
  }

  // Corta un texto en renglones que entren en "ancho"; devuelve los renglones.
  function renglones(ctx, texto, ancho, maximo) {
    var palabras = String(texto).split(/\s+/);
    var lineas = [];
    var actual = "";
    palabras.forEach(function (p) {
      var prueba = actual ? actual + " " + p : p;
      if (ctx.measureText(prueba).width > ancho && actual) { lineas.push(actual); actual = p; }
      else actual = prueba;
    });
    if (actual) lineas.push(actual);
    if (maximo && lineas.length > maximo) {
      lineas = lineas.slice(0, maximo);
      var ult = lineas[maximo - 1];
      while (ctx.measureText(ult + "…").width > ancho && ult.length) ult = ult.slice(0, -1);
      lineas[maximo - 1] = ult + "…";
    }
    return lineas;
  }

  function escribir(ctx, texto, x, y, o) {
    ctx.font = o.font;
    ctx.fillStyle = o.color;
    ctx.textAlign = o.align || "left";
    ctx.textBaseline = "alphabetic";
    var lineas = o.ancho ? renglones(ctx, texto, o.ancho, o.max) : [texto];
    var alto = o.alto || 0;
    lineas.forEach(function (l, i) { ctx.fillText(l, x, y + i * alto); });
    return y + (lineas.length - 1) * alto;
  }

  function rect(ctx, x, y, w, h, r, relleno, borde, grosor) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    if (relleno) { ctx.fillStyle = relleno; ctx.fill(); }
    if (borde) { ctx.strokeStyle = borde; ctx.lineWidth = grosor || 2; ctx.stroke(); }
  }

  function foto(ctx, img, nombre, x, y, lado) {
    rect(ctx, x, y, lado, lado, 0, COL.panel, null);
    if (img) {
      var s = Math.min(img.width, img.height);
      ctx.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, x, y, lado, lado);
    } else {
      var ini = String(nombre || "?").split(/\s+/).filter(Boolean).slice(0, 2).map(function (p) { return p[0].toUpperCase(); }).join("");
      escribir(ctx, ini, x + lado / 2, y + lado / 2 + lado * 0.13, { font: "600 " + Math.round(lado * 0.36) + "px " + F_TIT, color: COL.suave, align: "center" });
    }
    ctx.strokeStyle = COL.naranja;
    ctx.lineWidth = 4;
    ctx.strokeRect(x, y, lado, lado);
  }

  function qr(ctx, url, x, y, lado) {
    var q = window.qrcode(0, "M");
    q.addData(url);
    q.make();
    var n = q.getModuleCount();
    var margen = Math.round(lado * 0.06);
    rect(ctx, x, y, lado, lado, 14, "#ffffff", null);
    var celda = (lado - margen * 2) / n;
    ctx.fillStyle = "#05080d";
    for (var f = 0; f < n; f++) {
      for (var c = 0; c < n; c++) {
        if (q.isDark(f, c)) ctx.fillRect(Math.floor(x + margen + c * celda), Math.floor(y + margen + f * celda), Math.ceil(celda), Math.ceil(celda));
      }
    }
  }

  function botonWa(ctx, numero, x, y, w, h, tam) {
    rect(ctx, x, y, w, h, 14, COL.verde, null);
    escribir(ctx, "WhatsApp " + telefono(numero), x + w / 2, y + h / 2 + tam * 0.36, { font: "700 " + tam + "px " + F_TIT, color: COL.fondo, align: "center" });
  }

  // Formato estado / historia: 1080 x 1920. "d" son los datos que el alumno dejó en el editor.
  function dibujarEstado(d, img, logo, url) {
    var W = 1080, H = 1920, M = 90;
    var cv = document.createElement("canvas");
    cv.width = W; cv.height = H;
    var ctx = cv.getContext("2d");
    ctx.fillStyle = COL.fondo;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = COL.naranja;
    ctx.fillRect(0, 0, W, 14);

    if (logo) {
      var lw = 720, lh = lw * logo.height / logo.width;
      ctx.drawImage(logo, (W - lw) / 2, 110, lw, lh);
    }
    escribir(ctx, "RED DE TÉCNICOS", W / 2, 260, { font: "500 32px " + F_MONO, color: COL.naranja, align: "center" });

    var qrLado = 300;
    var baseQr = H - 120 - qrLado;
    var techo = (d.whatsapp ? baseQr - 150 : baseQr) - 40;

    // el bloque del medio se mide primero en un lienzo aparte y después se centra
    function cuerpo(c, y0) {
      var y = y0;
      if (img) {
        foto(c, img, d.nombre, (W - 400) / 2, y, 400);
        y += 510;
      } else {
        y += 90;
      }
      if (d.nombre) y = escribir(c, d.nombre, W / 2, y, { font: "700 96px " + F_TIT, color: COL.texto, align: "center", ancho: W - M * 2, max: 2, alto: 100 });
      if (d.zona) y = escribir(c, d.zona, W / 2, y + 74, { font: "500 46px " + F_TXT, color: COL.azul, align: "center", ancho: W - M * 2, max: 1, alto: 56 });
      if (d.destacado) y = escribir(c, d.destacado, W / 2, y + 76, { font: "600 44px " + F_TIT, color: COL.naranja, align: "center", ancho: W - M * 2, max: 2, alto: 54 });

      y += 40;
      servicios(d.servicios).slice(0, 6).forEach(function (s) {
        if (y + 66 > techo) return;
        y += 66;
        escribir(c, "•  " + s, W / 2, y, { font: "400 42px " + F_TXT, color: COL.texto, align: "center", ancho: W - M * 2, max: 1, alto: 50 });
      });

      if (d.frase) {
        c.font = "400 36px " + F_TXT;
        var lineas = renglones(c, d.frase, W - M * 2, 3);
        while (lineas.length && y + 90 + (lineas.length - 1) * 48 > techo) lineas.pop();
        lineas.forEach(function (l, i) {
          escribir(c, l, W / 2, y + 90 + i * 48, { font: "400 36px " + F_TXT, color: COL.medio, align: "center" });
        });
        if (lineas.length) y += 90 + (lineas.length - 1) * 48;
      }
      return y;
    }
    var prueba = document.createElement("canvas");
    prueba.width = W; prueba.height = H;
    var inicio = 310;
    var fin = cuerpo(prueba.getContext("2d"), inicio);
    var sobra = techo - fin;
    cuerpo(ctx, inicio + (sobra > 0 ? Math.round(sobra / 2) : 0));

    if (d.whatsapp) botonWa(ctx, d.whatsapp, M, baseQr - 150, W - M * 2, 110, 60);
    qr(ctx, url, M, baseQr, qrLado);
    escribir(ctx, "Escaneá y mirá", M + qrLado + 50, baseQr + 120, { font: "600 48px " + F_TIT, color: COL.texto });
    escribir(ctx, "mi perfil", M + qrLado + 50, baseQr + 178, { font: "600 48px " + F_TIT, color: COL.texto });
    escribir(ctx, "Red TecnoInformática", M + qrLado + 50, baseQr + 250, { font: "400 32px " + F_TXT, color: COL.medio });
    escribir(ctx, A.dominio, W / 2, H - 52, { font: "500 28px " + F_MONO, color: COL.suave, align: "center" });
    return cv;
  }

  // Formato cuadrado (Facebook, Marketplace, Instagram): 1080 x 1080
  function dibujarCuadrado(d, img, logo, url) {
    var W = 1080, H = 1080, M = 70;
    var cv = document.createElement("canvas");
    cv.width = W; cv.height = H;
    var ctx = cv.getContext("2d");
    ctx.fillStyle = COL.fondo;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = COL.naranja;
    ctx.fillRect(0, 0, W, 12);

    if (logo) {
      var lw = 500, lh = lw * logo.height / logo.width;
      ctx.drawImage(logo, M, 64, lw, lh);
    }
    escribir(ctx, "RED DE TÉCNICOS", W - M, 100, { font: "500 26px " + F_MONO, color: COL.naranja, align: "right" });

    var lado = 300;
    var xd = M, ancho = W - M * 2;
    if (img) {
      foto(ctx, img, d.nombre, M, 170, lado);
      xd = M + lado + 50;
      ancho = W - xd - M;
    }
    var y = 250;
    if (d.nombre) y = escribir(ctx, d.nombre, xd, y, { font: "700 74px " + F_TIT, color: COL.texto, ancho: ancho, max: 2, alto: 78 });
    if (d.zona) y = escribir(ctx, d.zona, xd, y + 60, { font: "500 38px " + F_TXT, color: COL.azul, ancho: ancho, max: 2, alto: 46 });
    y = escribir(ctx, "Técnico de la Red TecnoInformática", xd, y + 56, { font: "400 30px " + F_TXT, color: COL.medio });

    var qrLado = 240;
    var anchoTexto = W - M * 2 - qrLado - 40;
    var techo = (d.whatsapp ? H - 210 : H - 110) - 24;
    y = Math.max(y + 20, img ? 500 : y + 20);
    if (d.destacado) y = escribir(ctx, d.destacado, M, y + 50, { font: "600 38px " + F_TIT, color: COL.naranja, ancho: W - M * 2, max: 1, alto: 46 });

    y += 10;
    servicios(d.servicios).slice(0, 6).forEach(function (s) {
      if (y + 54 > techo) return;
      y += 54;
      escribir(ctx, "•  " + s, M, y, { font: "400 36px " + F_TXT, color: COL.texto, ancho: anchoTexto, max: 1, alto: 44 });
    });

    if (d.frase) {
      ctx.font = "400 30px " + F_TXT;
      var lineas = renglones(ctx, d.frase, anchoTexto, 2);
      while (lineas.length && y + 60 + (lineas.length - 1) * 40 > techo) lineas.pop();
      lineas.forEach(function (l, i) {
        escribir(ctx, l, M, y + 60 + i * 40, { font: "400 30px " + F_TXT, color: COL.medio });
      });
    }

    qr(ctx, url, W - M - qrLado, H - 150 - qrLado, qrLado);
    escribir(ctx, "Mi perfil", W - M - qrLado / 2, H - 112, { font: "600 30px " + F_TIT, color: COL.texto, align: "center" });
    if (d.whatsapp) botonWa(ctx, d.whatsapp, M, H - 210, anchoTexto, 100, 50);
    escribir(ctx, A.dominio, M, H - 50, { font: "500 24px " + F_MONO, color: COL.suave });
    return cv;
  }

  function aBlob(cv) {
    return new Promise(function (ok, mal) {
      try { cv.toBlob(function (b) { b ? ok(b) : mal(new Error("sin imagen")); }, "image/png"); }
      catch (e) { mal(e); }
    });
  }

  function copiar(texto, boton) {
    var hecho = function () {
      var antes = boton.textContent;
      boton.textContent = "¡Copiado!";
      setTimeout(function () { boton.textContent = antes; }, 1800);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(texto).then(hecho, function () { viejo(); });
    } else viejo();
    function viejo() {
      var t = document.createElement("textarea");
      t.value = texto;
      document.body.appendChild(t);
      t.select();
      try { document.execCommand("copy"); hecho(); } catch (e) { }
      t.remove();
    }
  }

  function textos(p, url) {
    var nom = p.nombre.split(" ")[0];
    var serv = servicios(p.servicios).slice(0, 3).map(function (x) { return x.charAt(0).toLowerCase() + x.slice(1); }).join(", ");
    var wa = p.whatsapp ? "https://wa.me/549" + p.whatsapp : url;
    var donde = p.zona ? " en " + p.zona : "";
    return [
      ["Estado de WhatsApp",
        "🔧 ¿Se te rompió la compu o la notebook?\n" +
        "Reparo PC y notebooks" + donde + (serv ? ": " + serv : "") + ".\n" +
        "Y si es un problema de placa (no enciende, no da video), lo resolvemos con el taller TecnoInformática.\n" +
        "Escribime 👉 " + wa],
      ["Publicación para Facebook / Marketplace",
        "Servicio técnico de PC y notebooks" + donde + "\n\n" +
        (servicios(p.servicios).length ? servicios(p.servicios).map(function (s) { return "✅ " + s; }).join("\n") + "\n\n" : "") +
        "Soy parte de la Red de técnicos TecnoInformática. Las reparaciones de placa (no enciende, sin video, no carga) las resolvemos junto al taller TecnoInformática.\n\n" +
        "📲 WhatsApp: " + (p.whatsapp ? telefono(p.whatsapp) : "") + "\n" +
        "👤 Mi perfil: " + url],
      ["Mensaje para tus contactos",
        "¡Hola! Te cuento que ahora formo parte de la Red de técnicos TecnoInformática. " +
        "Si vos o alguien que conozcas necesita arreglar una PC o notebook, escribime. " +
        "Hasta los problemas de placa los resolvemos con el taller. Acá está mi perfil: " + url]
    ];
  }

  var FRASE = "Problemas de placa (no enciende, sin video): con el respaldo del taller TecnoInformática.";

  function normalizarWa(valor) {
    var d = String(valor || "").replace(/\D/g, "");
    if (!d) return "";
    d = d.replace(/^549/, "").replace(/^54/, "").replace(/^0/, "");
    return d.length === 10 ? d : null;
  }

  function leerGuardado(clave) {
    try { return JSON.parse(localStorage.getItem(clave)) || null; } catch (e) { return null; }
  }
  function guardar(clave, valor) {
    try { localStorage.setItem(clave, JSON.stringify(valor)); } catch (e) { }
  }
  function borrar(clave) {
    try { localStorage.removeItem(clave); } catch (e) { }
  }

  function desdePerfil(p) {
    return {
      nombre: p.nombre || "",
      zona: p.zona || "",
      destacado: "",
      servicios: p.servicios || "",
      frase: FRASE,
      whatsapp: p.whatsapp ? telefono(p.whatsapp) : "",
      conFoto: true,
      textos: null
    };
  }

  function pintar(destino, p, ayudas) {
    A = ayudas;
    var el = A.el;
    var url = "https://" + A.dominio + "/tecnico?t=" + encodeURIComponent(p.slug);
    var CLAVE = "red_kit_" + p.slug;
    var d = Object.assign(desdePerfil(p), leerGuardado(CLAVE) || {});

    var caja = A.cajaCon(destino, "Tu kit de difusión",
      "Personalizá tu flyer, descargalo y publicalo en estados, historias, Facebook y Marketplace.");
    var msj = A.aviso(caja);

    // link
    var fila = el("div", "r-kit-link");
    var campoLink = el("input");
    campoLink.type = "text";
    campoLink.readOnly = true;
    campoLink.value = url;
    campoLink.setAttribute("aria-label", "Link de tu perfil");
    fila.appendChild(campoLink);
    var bl = A.boton("boton hueco chico", "Copiar link");
    bl.addEventListener("click", function () { copiar(url, bl); });
    fila.appendChild(bl);
    caja.appendChild(fila);

    var cuerpo = el("div", "r-kit-cuerpo");
    caja.appendChild(cuerpo);

    // editor
    var editor = el("form", "r-form r-kit-editor");
    editor.addEventListener("submit", function (e) { e.preventDefault(); });
    editor.appendChild(el("h3", "r-kit-sub", "Personalizá tu flyer"));
    function control(tipo, nombre, etiqueta, ayuda, extra) {
      var c = tipo === "textarea" ? el("textarea") : el("input");
      if (tipo !== "textarea") c.type = tipo;
      c.name = nombre;
      Object.keys(extra || {}).forEach(function (k) { c.setAttribute(k, extra[k]); });
      var l = el("label");
      l.appendChild(el("span", null, etiqueta));
      l.appendChild(c);
      if (ayuda) l.appendChild(el("small", null, ayuda));
      editor.appendChild(l);
      return c;
    }
    var cNombre = control("text", "k_nombre", "Nombre", null, { maxlength: "60" });
    var cZona = control("text", "k_zona", "Zona", null, { maxlength: "80" });
    var cDest = control("text", "k_destacado", "Frase destacada (opcional)", "Sale en naranja. Ej: Retiro y entrega a domicilio", { maxlength: "70" });
    var cServ = control("textarea", "k_servicios", "Servicios", "Uno por línea. Entran hasta 6, según el espacio.", { maxlength: "400", rows: "5" });
    var cFrase = control("textarea", "k_frase", "Frase de abajo", "Dejala vacía si no la querés.", { maxlength: "160", rows: "2" });
    var cWa = control("tel", "k_whatsapp", "WhatsApp", "Dejalo vacío para no mostrar el botón.", { maxlength: "20" });
    var lFoto = el("label", "r-kit-check");
    var cFoto = el("input");
    cFoto.type = "checkbox";
    lFoto.appendChild(cFoto);
    lFoto.appendChild(document.createTextNode(p.foto_url ? " Mostrar mi foto" : " Mostrar mi foto (cargala en tu perfil)"));
    cFoto.disabled = !p.foto_url;
    editor.appendChild(lFoto);
    var restaurar = A.boton("boton hueco chico", "Volver a los datos de mi perfil");
    editor.appendChild(restaurar);
    var nota = el("p", "r-kit-nota", "El logo, el QR a tu perfil y el sello de la Red quedan siempre. Tus cambios se guardan en este dispositivo.");
    editor.appendChild(nota);
    cuerpo.appendChild(editor);

    function volcar() {
      cNombre.value = d.nombre; cZona.value = d.zona; cDest.value = d.destacado;
      cServ.value = d.servicios; cFrase.value = d.frase; cWa.value = d.whatsapp;
      cFoto.checked = !!(d.conFoto && p.foto_url);
    }
    volcar();

    // flyers
    var grilla = el("div", "r-kit-flyers");
    cuerpo.appendChild(grilla);
    var formatos = [
      ["Para estados e historias", "estado", dibujarEstado],
      ["Para Facebook y Marketplace", "cuadrado", dibujarCuadrado]
    ].map(function (f) {
      var tarjeta = el("figure", "r-kit-flyer");
      var vista = el("img");
      vista.alt = "Flyer " + f[0].toLowerCase();
      tarjeta.appendChild(vista);
      var pie = el("figcaption");
      pie.appendChild(el("span", null, f[0]));
      var bajar = el("a", "boton chico", "Descargar");
      bajar.download = "flyer-" + p.slug + "-" + f[1] + ".png";
      pie.appendChild(bajar);
      tarjeta.appendChild(pie);
      grilla.appendChild(tarjeta);
      return { dibujar: f[2], vista: vista, bajar: bajar, url: null };
    });

    var imgs = null;
    var fotoBloqueada = false;
    var turno = 0;

    function datosFlyer() {
      var wa = normalizarWa(d.whatsapp);
      return {
        nombre: d.nombre.trim(),
        zona: d.zona.trim(),
        destacado: d.destacado.trim(),
        servicios: d.servicios,
        frase: d.frase.trim(),
        whatsapp: wa || ""
      };
    }

    function regenerar() {
      if (!imgs) return;
      var mio = ++turno;
      var datos = datosFlyer();
      var foto = d.conFoto && !fotoBloqueada ? imgs[0] : null;
      formatos.forEach(function (f) {
        aBlob(f.dibujar(datos, foto, imgs[1], url)).catch(function () {
          // el servidor de la foto no dejó exportarla: se arma sin foto
          fotoBloqueada = true;
          return aBlob(f.dibujar(datos, null, imgs[1], url));
        }).then(function (blob) {
          if (mio !== turno) return;
          if (f.url) URL.revokeObjectURL(f.url);
          f.url = URL.createObjectURL(blob);
          f.vista.src = f.url;
          f.bajar.href = f.url;
        }).catch(function () {
          msj.mostrar("No se pudo armar el flyer en este navegador. Probá desde Chrome.", "error");
        });
      });
    }

    var espera = null;
    function alCambiar() {
      d.nombre = cNombre.value; d.zona = cZona.value; d.destacado = cDest.value;
      d.servicios = cServ.value; d.frase = cFrase.value; d.whatsapp = cWa.value;
      d.conFoto = cFoto.checked;
      if (normalizarWa(d.whatsapp) === null) msj.mostrar("El WhatsApp tiene que tener 10 números (código de área + número, sin 0 ni 15). Mientras tanto no se muestra.", "espera");
      else msj.limpiar();
      guardar(CLAVE, d);
      clearTimeout(espera);
      espera = setTimeout(regenerar, 300);
    }
    [cNombre, cZona, cDest, cServ, cFrase, cWa].forEach(function (c) { c.addEventListener("input", alCambiar); });
    cFoto.addEventListener("change", alCambiar);
    restaurar.addEventListener("click", function () {
      borrar(CLAVE);
      d = desdePerfil(p);
      volcar();
      pintarTextos();
      msj.limpiar();
      regenerar();
    });

    fuentesListas().then(function () {
      return Promise.all([cargarImagen(p.foto_url, true), cargarImagen("img/logo.png", false)]);
    }).then(function (cargadas) {
      imgs = cargadas;
      if (!imgs[0]) { cFoto.checked = false; cFoto.disabled = true; d.conFoto = false; }
      regenerar();
    });

    // textos editables
    caja.appendChild(el("h3", "r-kit-sub", "Textos listos para publicar"));
    caja.appendChild(el("p", "r-kit-nota", "Podés cambiarlos antes de copiar: agregá o sacá lo que quieras."));
    var lista = el("div", "r-kit-textos");
    caja.appendChild(lista);

    function pintarTextos() {
      lista.textContent = "";
      var base = textos(p, url);
      if (!d.textos || d.textos.length !== base.length) d.textos = base.map(function (t) { return t[1]; });
      base.forEach(function (t, i) {
        var bloque = el("div", "r-kit-texto");
        var cab = el("div", "cab");
        cab.appendChild(el("strong", null, t[0]));
        var bc = A.boton("boton hueco chico", "Copiar");
        cab.appendChild(bc);
        bloque.appendChild(cab);
        var area = el("textarea");
        area.value = d.textos[i];
        area.rows = Math.min(12, d.textos[i].split("\n").length + 2);
        area.setAttribute("aria-label", t[0]);
        area.addEventListener("input", function () { d.textos[i] = area.value; guardar(CLAVE, d); });
        bc.addEventListener("click", function () { copiar(area.value, bc); });
        bloque.appendChild(area);
        lista.appendChild(bloque);
      });
    }
    pintarTextos();
  }

  window.RedKit = { pintar: pintar };
})();
