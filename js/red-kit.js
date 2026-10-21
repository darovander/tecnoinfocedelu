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

  // Formato estado / historia: 1080 x 1920
  function dibujarEstado(p, img, logo, url) {
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

    foto(ctx, img, p.nombre, (W - 400) / 2, 310, 400);

    var y = escribir(ctx, p.nombre, W / 2, 820, { font: "700 96px " + F_TIT, color: COL.texto, align: "center", ancho: W - M * 2, max: 2, alto: 100 });
    if (p.zona) y = escribir(ctx, p.zona, W / 2, y + 74, { font: "500 46px " + F_TXT, color: COL.azul, align: "center", ancho: W - M * 2, max: 1, alto: 56 });

    var qrLado = 300;
    var baseQr = H - 120 - qrLado;
    var techo = baseQr - 150 - 40; // lo que haya arriba del botón de WhatsApp

    var serv = servicios(p.servicios).slice(0, 4);
    y += 40;
    serv.forEach(function (s) {
      if (y + 66 > techo) return;
      y += 66;
      escribir(ctx, "•  " + s, W / 2, y, { font: "400 42px " + F_TXT, color: COL.texto, align: "center", ancho: W - M * 2, max: 1, alto: 50 });
    });

    if (y + 90 + 48 <= techo) {
      escribir(ctx, "Problemas de placa (no enciende, sin video): con el respaldo del taller TecnoInformática.", W / 2, y + 90,
        { font: "400 36px " + F_TXT, color: COL.medio, align: "center", ancho: W - M * 2, max: 2, alto: 48 });
    } else if (y + 80 <= techo) {
      escribir(ctx, "Problemas de placa: con el respaldo de TecnoInformática.", W / 2, y + 80,
        { font: "400 34px " + F_TXT, color: COL.medio, align: "center", ancho: W - M * 2, max: 1, alto: 44 });
    }

    if (p.whatsapp) botonWa(ctx, p.whatsapp, M, baseQr - 150, W - M * 2, 110, 60);
    qr(ctx, url, M, baseQr, qrLado);
    escribir(ctx, "Escaneá y mirá", M + qrLado + 50, baseQr + 120, { font: "600 48px " + F_TIT, color: COL.texto });
    escribir(ctx, "mi perfil", M + qrLado + 50, baseQr + 178, { font: "600 48px " + F_TIT, color: COL.texto });
    escribir(ctx, "Formación DR Computers", M + qrLado + 50, baseQr + 250, { font: "400 32px " + F_TXT, color: COL.medio });
    escribir(ctx, A.dominio, W / 2, H - 52, { font: "500 28px " + F_MONO, color: COL.suave, align: "center" });
    return cv;
  }

  // Formato cuadrado (Facebook, Marketplace, Instagram): 1080 x 1080
  function dibujarCuadrado(p, img, logo, url) {
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
    foto(ctx, img, p.nombre, M, 170, lado);
    var xd = M + lado + 50, ancho = W - xd - M;
    var y = escribir(ctx, p.nombre, xd, 250, { font: "700 74px " + F_TIT, color: COL.texto, ancho: ancho, max: 2, alto: 78 });
    if (p.zona) y = escribir(ctx, p.zona, xd, y + 60, { font: "500 38px " + F_TXT, color: COL.azul, ancho: ancho, max: 2, alto: 46 });
    escribir(ctx, "Formación DR Computers", xd, Math.max(y + 60, 440), { font: "400 30px " + F_TXT, color: COL.medio });

    var serv = servicios(p.servicios).slice(0, 4);
    var ys = 560;
    serv.forEach(function (s, i) {
      escribir(ctx, "•  " + s, M, ys + i * 54, { font: "400 36px " + F_TXT, color: COL.texto, ancho: W - M * 2 - 280, max: 1, alto: 44 });
    });
    escribir(ctx, "Problemas de placa: con el respaldo del taller TecnoInformática.", M, ys + serv.length * 54 + 30,
      { font: "400 30px " + F_TXT, color: COL.medio, ancho: W - M * 2 - 280, max: 2, alto: 40 });

    var qrLado = 240;
    qr(ctx, url, W - M - qrLado, H - 150 - qrLado, qrLado);
    escribir(ctx, "Mi perfil", W - M - qrLado / 2, H - 112, { font: "600 30px " + F_TIT, color: COL.texto, align: "center" });
    if (p.whatsapp) botonWa(ctx, p.whatsapp, M, H - 210, W - M * 2 - qrLado - 40, 100, 50);
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
        "Soy parte de la Red de técnicos TecnoInformática, con formación en DR Computers. Las reparaciones de placa (no enciende, sin video, no carga) las resolvemos junto al taller TecnoInformática.\n\n" +
        "📲 WhatsApp: " + (p.whatsapp ? telefono(p.whatsapp) : "") + "\n" +
        "👤 Mi perfil: " + url],
      ["Mensaje para tus contactos",
        "¡Hola! Te cuento que ahora formo parte de la Red de técnicos TecnoInformática. " +
        "Si vos o alguien que conozcas necesita arreglar una PC o notebook, escribime. " +
        "Hasta los problemas de placa los resolvemos con el taller. Acá está mi perfil: " + url]
    ];
  }

  function pintar(destino, p, ayudas) {
    A = ayudas;
    var el = A.el;
    var url = "https://" + A.dominio + "/tecnico?t=" + encodeURIComponent(p.slug);

    var caja = A.cajaCon(destino, "Tu kit de difusión",
      "Descargá tu flyer y publicalo en estados, historias, Facebook y Marketplace. Si cambiás tu perfil, el flyer se actualiza solo.");
    var msj = A.aviso(caja);

    // link
    var fila = el("div", "r-kit-link");
    var campo = el("input");
    campo.type = "text";
    campo.readOnly = true;
    campo.value = url;
    campo.setAttribute("aria-label", "Link de tu perfil");
    fila.appendChild(campo);
    var bl = A.boton("boton hueco chico", "Copiar link");
    bl.addEventListener("click", function () { copiar(url, bl); });
    fila.appendChild(bl);
    caja.appendChild(fila);

    if (!p.whatsapp || !p.zona || !servicios(p.servicios).length) {
      msj.mostrar("Tu flyer queda mejor con WhatsApp, zona y servicios completos en tu perfil.", "espera");
    }

    var grilla = el("div", "r-kit-flyers");
    caja.appendChild(grilla);
    var espera = el("p", "r-vacio", "Armando tu flyer…");
    grilla.appendChild(espera);

    fuentesListas().then(function () {
      return Promise.all([cargarImagen(p.foto_url, true), cargarImagen("img/logo.png", false)]);
    }).then(function (imgs) {
      espera.remove();
      [
        ["Para estados e historias", "estado", dibujarEstado],
        ["Para Facebook y Marketplace", "cuadrado", dibujarCuadrado]
      ].forEach(function (f) {
        var cv = f[2](p, imgs[0], imgs[1], url);
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

        aBlob(cv).catch(function () {
          // la foto no dejó exportar (permisos del servidor): se arma sin foto
          return aBlob(f[2](p, null, imgs[1], url));
        }).then(function (blob) {
          var u = URL.createObjectURL(blob);
          vista.src = u;
          bajar.href = u;
        }).catch(function () {
          tarjeta.remove();
          msj.mostrar("No se pudo armar el flyer en este navegador. Probá desde Chrome.", "error");
        });
      });
    });

    // textos
    var lista = el("div", "r-kit-textos");
    textos(p, url).forEach(function (t) {
      var bloque = el("div", "r-kit-texto");
      var cab = el("div", "cab");
      cab.appendChild(el("strong", null, t[0]));
      var bc = A.boton("boton hueco chico", "Copiar");
      bc.addEventListener("click", function () { copiar(t[1], bc); });
      cab.appendChild(bc);
      bloque.appendChild(cab);
      bloque.appendChild(el("pre", null, t[1]));
      lista.appendChild(bloque);
    });
    caja.appendChild(el("h3", "r-kit-sub", "Textos listos para publicar"));
    caja.appendChild(lista);
  }

  window.RedKit = { pintar: pintar };
})();
