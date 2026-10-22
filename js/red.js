// Red de técnicos: directorio público, perfil, acceso de alumnos y paneles.
// sitio.js llama a RedApp.pintar() en red.html, tecnico.html, acceso.html y panel.html.
// Los datos viven en Supabase; la seguridad la ponen las reglas de supabase/red-de-tecnicos.sql.
(function () {
  "use strict";

  var SUPABASE_URL = "https://kofqyguccmpjkktlziou.supabase.co";
  var SUPABASE_CLAVE = "sb_publishable_WTMCRpDE19XgV0TMhZ7MSA_MFO6__cM";
  var BUCKET = "fotos-tecnicos";

  var ESTADOS_TRABAJO = {
    recibido: "Recibido",
    en_reparacion: "En reparación",
    entregado: "Entregado",
    cancelado: "Cancelado"
  };
  var ESTADOS_TECNICO = { pendiente: "Pendiente", aprobado: "Aprobado", suspendido: "Suspendido" };

  var K;
  var sb = null;

  function db() {
    if (!sb) {
      if (!window.supabase) throw new Error("No cargó la librería de Supabase");
      sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_CLAVE);
    }
    return sb;
  }

  // ---------- utilidades ----------

  function el(tag, clase, texto) { return K.el(tag, clase, texto); }

  function enlace(clase, texto, href) {
    var a = el("a", clase, texto);
    a.href = href;
    return a;
  }

  function enlaceExterno(clase, texto, href) {
    var a = enlace(clase, texto, href);
    a.target = "_blank";
    a.rel = "noopener";
    return a;
  }

  function boton(clase, texto, tipo) {
    var b = el("button", clase, texto);
    b.type = tipo || "button";
    return b;
  }

  function seccion() {
    var s = el("section", "seccion");
    var c = el("div", "contenedor");
    s.appendChild(c);
    K.raiz.appendChild(s);
    return c;
  }

  function cabeza(destino, etiqueta, titulo, texto) {
    var cab = el("div", "seccion-cabeza");
    cab.appendChild(el("div", "etiqueta", etiqueta));
    cab.appendChild(el("h1", null, titulo));
    if (texto) cab.appendChild(el("p", null, texto));
    destino.appendChild(cab);
    return cab;
  }

  function aviso(destino) {
    var a = el("div", "r-aviso");
    a.setAttribute("role", "status");
    destino.appendChild(a);
    return {
      nodo: a,
      mostrar: function (texto, tipo) { a.className = "r-aviso" + (tipo ? " " + tipo : ""); a.textContent = texto || ""; },
      limpiar: function () { a.className = "r-aviso"; a.textContent = ""; }
    };
  }

  function campo(etiqueta, control, ayuda, ancho) {
    var l = el("label", ancho ? "ancho" : null);
    l.appendChild(el("span", null, etiqueta));
    l.appendChild(control);
    if (ayuda) l.appendChild(el("small", null, ayuda));
    return l;
  }

  function entrada(tipo, nombre, valor, extra) {
    var i = el("input");
    i.type = tipo;
    i.name = nombre;
    if (valor != null) i.value = valor;
    Object.keys(extra || {}).forEach(function (k) { i.setAttribute(k, extra[k]); });
    return i;
  }

  function texto(nombre, valor, extra) {
    var t = el("textarea");
    t.name = nombre;
    if (valor != null) t.value = valor;
    Object.keys(extra || {}).forEach(function (k) { t.setAttribute(k, extra[k]); });
    return t;
  }

  function selector(nombre, opciones, valor) {
    var s = el("select");
    s.name = nombre;
    opciones.forEach(function (o) {
      var op = el("option", null, o[1]);
      op.value = o[0];
      if (String(o[0]) === String(valor == null ? "" : valor)) op.selected = true;
      s.appendChild(op);
    });
    return s;
  }

  function limpio(v) {
    v = String(v == null ? "" : v).trim();
    return v === "" ? null : v;
  }

  var formatoPesos = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 2 });
  function pesos(n) { return n == null ? "—" : "$ " + formatoPesos.format(Number(n)); }

  function fecha(iso) {
    if (!iso) return "";
    var d = new Date(iso);
    return d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "2-digit" });
  }

  function iniciales(nombre) {
    return String(nombre || "?").split(/\s+/).filter(Boolean).slice(0, 2).map(function (p) { return p[0].toUpperCase(); }).join("");
  }

  function foto(url, nombre) {
    var caja = el("div", "r-foto");
    if (url) {
      var img = el("img");
      img.src = url;
      img.alt = "Foto de " + nombre;
      img.loading = "lazy";
      caja.appendChild(img);
    } else {
      caja.appendChild(el("span", "iniciales", iniciales(nombre)));
    }
    return caja;
  }

  function estadoChip(clave, etiquetas) {
    return el("span", "r-estado " + clave, (etiquetas || ESTADOS_TRABAJO)[clave] || clave);
  }

  // Guardamos 10 dígitos (área + número, sin 0 ni 15); WhatsApp necesita 549 adelante.
  function normalizarWa(valor) {
    var d = String(valor || "").replace(/\D/g, "");
    if (!d) return "";
    d = d.replace(/^549/, "").replace(/^54/, "").replace(/^0/, "");
    return d.length === 10 ? d : null;
  }

  function linkWaTecnico(numero, mensaje) {
    return "https://wa.me/549" + numero + (mensaje ? "?text=" + encodeURIComponent(mensaje) : "");
  }

  var LOCALIDADES = ["Concepción del Uruguay", "Colón", "San José", "Villa Elisa", "Villa Mantero", "Basavilbaso",
    "Caseros", "Pronunciamiento", "Rocamora", "Herrera", "Santa Anita", "Primero de Mayo", "Arroyo Barú", "San Justo",
    "Gualeguaychú", "Urdinarrain", "Larroque", "Rosario del Tala", "Villaguay", "Paraná"];

  function lugar(t) { return [t.localidad, t.zona].filter(Boolean).join(" · "); }

  function lineas(s) {
    return String(s || "").split(/\n|,|;/).map(function (x) { return x.trim(); }).filter(Boolean);
  }

  function traducirError(err) {
    var m = (err && (err.message || err.error_description || err)) + "";
    if (/Invalid login credentials/i.test(m)) return "Email o contraseña incorrectos.";
    if (/already registered|already been registered/i.test(m)) return "Ya hay una cuenta con ese email. Probá ingresar.";
    if (/Email not confirmed/i.test(m)) return "Todavía no confirmaste tu email. Revisá tu correo (también en spam).";
    if (/Password should be at least/i.test(m)) return "La contraseña tiene que tener al menos 8 caracteres.";
    if (/rate limit|too many/i.test(m)) return "Demasiados intentos seguidos. Esperá unos minutos y probá de nuevo.";
    if (/valid email|invalid format/i.test(m)) return "Revisá que el email esté bien escrito.";
    if (/Failed to fetch|NetworkError/i.test(m)) return "No hay conexión. Revisá internet y probá de nuevo.";
    if (/violates check constraint/i.test(m)) return "Algún dato es demasiado largo o tiene un formato inválido.";
    return m.replace(/^Error:\s*/, "");
  }

  function ocupado(b, si, textoMientras) {
    if (si) { b.dataset.texto = b.textContent; b.textContent = textoMientras || "Guardando…"; b.disabled = true; }
    else { b.textContent = b.dataset.texto || b.textContent; b.disabled = false; }
  }

  function cargando(destino) {
    var p = el("p", "r-vacio", "Cargando…");
    destino.appendChild(p);
    return p;
  }

  function falla(destino, err) {
    destino.textContent = "";
    var c = el("div", "r-caja");
    c.appendChild(el("h2", null, "No se pudo cargar"));
    c.appendChild(el("p", null, traducirError(err) + " Recargá la página en un rato."));
    destino.appendChild(c);
  }

  // Achica la foto en el navegador antes de subirla (máx. 800 px, JPEG).
  function achicarFoto(archivo) {
    return new Promise(function (ok, mal) {
      var lector = new FileReader();
      lector.onerror = function () { mal(new Error("No se pudo leer la foto")); };
      lector.onload = function () {
        var img = new Image();
        img.onerror = function () { mal(new Error("Ese archivo no es una imagen válida")); };
        img.onload = function () {
          var lado = 800;
          var escala = Math.min(1, lado / Math.max(img.width, img.height));
          var lienzo = document.createElement("canvas");
          lienzo.width = Math.round(img.width * escala);
          lienzo.height = Math.round(img.height * escala);
          lienzo.getContext("2d").drawImage(img, 0, 0, lienzo.width, lienzo.height);
          lienzo.toBlob(function (b) { b ? ok(b) : mal(new Error("No se pudo procesar la foto")); }, "image/jpeg", 0.85);
        };
        img.src = lector.result;
      };
      lector.readAsDataURL(archivo);
    });
  }

  // ---------- directorio público ----------

  function pintarDirectorio() {
    K.pintarMeta({
      tituloPestana: "Red de técnicos | TecnoInformática",
      metaDescripcion: "Técnicos en reparación de PC y notebooks de la Red TecnoInformática, en Concepción del Uruguay y la zona. Encontrá uno cerca tuyo."
    });
    var c = seccion();
    cabeza(c, "Red de técnicos", "Encontrá un técnico cerca tuyo",
      "Técnicos que trabajan junto a TecnoInformática. Escribile directo al que te quede más cómodo.");
    var espera = cargando(c);

    db().rpc("red_publica").then(function (r) {
      espera.remove();
      if (r.error) return falla(c, r.error);
      var lista = r.data || [];
      if (!lista.length) {
        var v = el("div", "r-caja");
        v.appendChild(el("h2", null, "Muy pronto"));
        v.appendChild(el("p", null, "Estamos sumando a los primeros técnicos de la red. Mientras tanto, consultanos directamente."));
        var wa = enlaceExterno("boton wa", "Escribir a TecnoInformática", K.linkWa("Hola, busco un técnico para reparar mi equipo."));
        v.appendChild(wa);
        c.appendChild(v);
        return;
      }

      var clave = function (t) { return t.localidad || t.zona || ""; };
      var zonas = [];
      lista.forEach(function (t) { var z = clave(t); if (z && zonas.indexOf(z) < 0) zonas.push(z); });
      zonas.sort(function (a, b) { return a.localeCompare(b, "es"); });

      var filtros = el("div", "r-filtros");
      var buscar = entrada("search", "buscar", "", { placeholder: "Buscar por nombre o servicio…", "aria-label": "Buscar técnico" });
      filtros.appendChild(buscar);
      var zonaSel = null;
      if (zonas.length > 1) {
        zonaSel = selector("zona", [["", "Todas las localidades"]].concat(zonas.map(function (z) { return [z, z]; })), "");
        zonaSel.setAttribute("aria-label", "Filtrar por localidad");
        filtros.appendChild(zonaSel);
      }
      c.appendChild(filtros);

      var grilla = el("div", "r-grilla");
      c.appendChild(grilla);
      var nada = el("p", "r-vacio", "No hay técnicos que coincidan con la búsqueda.");

      function dibujar() {
        grilla.textContent = "";
        var q = (buscar.value || "").toLowerCase();
        var z = zonaSel ? zonaSel.value : "";
        var vis = lista.filter(function (t) {
          if (z && clave(t) !== z) return false;
          if (!q) return true;
          return [t.nombre, t.servicios, t.descripcion, t.zona, t.localidad].join(" ").toLowerCase().indexOf(q) > -1;
        });
        if (!vis.length) { grilla.appendChild(nada); return; }
        vis.forEach(function (t) { grilla.appendChild(tarjeta(t)); });
      }
      buscar.addEventListener("input", dibujar);
      if (zonaSel) zonaSel.addEventListener("change", dibujar);
      dibujar();

      var pie = el("p", "r-vacio");
      pie.appendChild(document.createTextNode("¿Sos técnico? "));
      pie.appendChild(enlace(null, "Sumate a la red", "acceso.html"));
      c.appendChild(pie);
    });
  }

  function tarjeta(t) {
    var a = el("article", "r-tarjeta");
    a.appendChild(foto(t.foto_url, t.nombre));
    var cu = el("div", "cuerpo");
    if (lugar(t)) cu.appendChild(el("div", "zona", lugar(t)));
    if (t.punto_recepcion) cu.appendChild(el("span", "r-punto", "Punto de recepción"));
    cu.appendChild(el("h3", null, t.nombre));
    var serv = lineas(t.servicios).slice(0, 4).join(" · ");
    if (serv) cu.appendChild(el("p", null, serv));
    var bs = el("div", "botones");
    bs.appendChild(enlace("boton hueco chico", "Ver perfil", "tecnico.html?t=" + encodeURIComponent(t.slug)));
    if (t.whatsapp) {
      bs.appendChild(enlaceExterno("boton wa chico", "WhatsApp",
        linkWaTecnico(t.whatsapp, "Hola " + t.nombre.split(" ")[0] + ", te encontré en la Red de técnicos de TecnoInformática. Te consulto por una reparación.")));
    }
    cu.appendChild(bs);
    a.appendChild(cu);
    return a;
  }

  // ---------- puntos de recepción ----------

  function pintarPuntos() {
    K.pintarMeta({
      tituloPestana: "Puntos de recepción | TecnoInformática",
      metaDescripcion: "Dejá tu notebook o PC para reparación de placa en tu localidad: puntos de recepción de TecnoInformática en Entre Ríos."
    });
    var neg = K.C.negocio || {};
    var c = seccion();
    cabeza(c, "Puntos de recepción", "Reparación de placa cerca de tu casa",
      "¿Tu notebook o PC no enciende, no da video o no carga? No hace falta que viajes: dejala en el punto de recepción de tu localidad. La reparamos en el taller y vuelve a tus manos.");

    var pasos = el("ol", "r-pasos");
    [["Dejás el equipo", "en el punto de recepción de tu localidad, con la falla anotada."],
     ["Lo reparamos en el taller", "diagnóstico y reparación a nivel componente en TecnoInformática. Te pasamos el presupuesto antes de reparar."],
     ["Lo retirás", "en el mismo punto donde lo dejaste."]].forEach(function (p) {
      var li = el("li");
      li.appendChild(el("strong", null, p[0]));
      li.appendChild(document.createTextNode(" " + p[1]));
      pasos.appendChild(li);
    });
    c.appendChild(pasos);

    var espera = cargando(c);
    db().rpc("red_publica").then(function (r) {
      espera.remove();
      var puntos = r.error ? [] : (r.data || []).filter(function (t) { return t.punto_recepcion; });

      var grupos = {};
      puntos.forEach(function (t) {
        var l = t.localidad || "Otras localidades";
        (grupos[l] = grupos[l] || []).push(t);
      });
      var orden = Object.keys(grupos).sort(function (a, b) { return a.localeCompare(b, "es"); });

      // el taller va primero
      var bloqueTaller = el("div", "r-localidad");
      bloqueTaller.appendChild(el("h2", null, "Concepción del Uruguay"));
      var gt = el("div", "r-grilla");
      var taller = el("article", "r-tarjeta r-taller");
      var cu = el("div", "cuerpo");
      cu.appendChild(el("div", "zona", "Taller central"));
      cu.appendChild(el("h3", null, neg.nombre || "TecnoInformática"));
      cu.appendChild(el("p", null, [neg.direccion, neg.ciudad].filter(Boolean).join(", ")));
      var bs = el("div", "botones");
      if (neg.mapa) bs.appendChild(enlaceExterno("boton hueco chico", "Cómo llegar", neg.mapa));
      bs.appendChild(enlaceExterno("boton wa chico", "WhatsApp", K.linkWa("Hola, quiero consultar por una reparación de placa.")));
      cu.appendChild(bs);
      taller.appendChild(cu);
      gt.appendChild(taller);
      (grupos["Concepción del Uruguay"] || []).forEach(function (t) { gt.appendChild(tarjetaPunto(t)); });
      bloqueTaller.appendChild(gt);
      c.appendChild(bloqueTaller);

      orden.forEach(function (l) {
        if (l === "Concepción del Uruguay") return;
        var b = el("div", "r-localidad");
        b.appendChild(el("h2", null, l));
        var g = el("div", "r-grilla");
        grupos[l].forEach(function (t) { g.appendChild(tarjetaPunto(t)); });
        b.appendChild(g);
        c.appendChild(b);
      });

      var pie = el("p", "r-vacio");
      pie.appendChild(document.createTextNode("¿Tu localidad no está? "));
      pie.appendChild(enlaceExterno(null, "Escribinos", K.linkWa("Hola, soy de otra localidad y quiero hacer una reparación de placa.")));
      pie.appendChild(document.createTextNode(" y coordinamos el envío. ¿Sos técnico y querés ser punto de recepción? "));
      pie.appendChild(enlace(null, "Sumate a la red", "acceso.html"));
      c.appendChild(pie);
    });
  }

  function tarjetaPunto(t) {
    var a = el("article", "r-tarjeta");
    a.appendChild(foto(t.foto_url, t.nombre));
    var cu = el("div", "cuerpo");
    if (t.zona) cu.appendChild(el("div", "zona", t.zona));
    cu.appendChild(el("h3", null, t.nombre));
    if (t.horarios) cu.appendChild(el("p", null, t.horarios));
    var bs = el("div", "botones");
    bs.appendChild(enlace("boton hueco chico", "Ver perfil", "tecnico.html?t=" + encodeURIComponent(t.slug)));
    if (t.whatsapp) {
      bs.appendChild(enlaceExterno("boton wa chico", "WhatsApp",
        linkWaTecnico(t.whatsapp, "Hola " + t.nombre.split(" ")[0] + ", quiero dejarte un equipo para reparación de placa con TecnoInformática.")));
    }
    cu.appendChild(bs);
    a.appendChild(cu);
    return a;
  }

  // ---------- perfil público ----------

  function pintarPerfil() {
    var slug = new URLSearchParams(location.search).get("t") || "";
    var c = seccion();
    var espera = cargando(c);

    db().rpc("red_publica").then(function (r) {
      espera.remove();
      if (r.error) return falla(c, r.error);
      var t = (r.data || []).filter(function (x) { return x.slug === slug; })[0];
      if (!t) {
        var v = el("div", "r-caja");
        v.appendChild(el("h2", null, "No encontramos ese técnico"));
        v.appendChild(el("p", null, "Puede que el link esté mal escrito o que el perfil ya no esté publicado."));
        v.appendChild(enlace("boton", "Ver la red de técnicos", "red.html"));
        c.appendChild(v);
        return;
      }

      K.pintarMeta({
        tituloPestana: t.nombre + " | Red de técnicos TecnoInformática",
        metaDescripcion: "Técnico en reparación de PC y notebooks" + (lugar(t) ? " en " + lugar(t) : "") + ". Parte de la Red TecnoInformática."
      });

      var p = el("div", "r-perfil");
      p.appendChild(foto(t.foto_url, t.nombre));
      var d = el("div");
      d.appendChild(el("span", "r-sello", "Técnico de la Red TecnoInformática"));
      d.appendChild(el("h1", null, t.nombre));
      if (lugar(t)) d.appendChild(el("div", "zona", lugar(t)));
      if (t.punto_recepcion) {
        var pr = el("div", "r-aviso ok");
        pr.appendChild(el("strong", null, "Punto de recepción TecnoInformática. "));
        pr.appendChild(document.createTextNode("Podés dejarle tu equipo para reparación de placa (no enciende, sin video, no carga): lo reparamos en el taller y te vuelve por acá."));
        d.appendChild(pr);
      }
      if (t.descripcion) {
        t.descripcion.split(/\n+/).forEach(function (par) { if (par.trim()) d.appendChild(el("p", null, par.trim())); });
      }
      var serv = lineas(t.servicios);
      if (serv.length) {
        d.appendChild(el("h3", null, "Servicios"));
        var ul = el("ul");
        serv.forEach(function (s) { ul.appendChild(el("li", null, s)); });
        d.appendChild(ul);
      }
      if (t.horarios) {
        d.appendChild(el("h3", null, "Horarios"));
        d.appendChild(el("p", null, t.horarios));
      }
      if (t.whatsapp) {
        d.appendChild(enlaceExterno("boton wa", "Escribirle por WhatsApp",
          linkWaTecnico(t.whatsapp, "Hola " + t.nombre.split(" ")[0] + ", te encontré en la Red de técnicos de TecnoInformática. Te consulto por una reparación.")));
      }
      d.appendChild(el("p", "nota", "Técnico independiente de la Red TecnoInformática. Los casos más complejos los resuelve en conjunto con el taller de TecnoInformática."));
      p.appendChild(d);
      c.appendChild(p);

      var volver = el("p", "r-vacio");
      volver.appendChild(enlace(null, "← Ver todos los técnicos", "red.html"));
      c.appendChild(volver);
    });
  }

  // ---------- acceso (ingresar / crear cuenta / recuperar) ----------

  function pintarAcceso() {
    K.pintarMeta({ tituloPestana: "Acceso técnicos | TecnoInformática" });
    var c = seccion();
    var caja = el("div", "r-caja angosta");
    c.appendChild(caja);
    caja.appendChild(el("div", "etiqueta", "Red de técnicos"));
    var titulo = el("h2", null, "Acceso para técnicos");
    caja.appendChild(titulo);
    caja.appendChild(el("p", null, "Para técnicos que quieran formar parte de la red."));

    var pest = el("div", "r-pestanas");
    pest.setAttribute("role", "tablist");
    caja.appendChild(pest);
    var msj = aviso(caja);
    var cuerpo = el("div");
    caja.appendChild(cuerpo);

    var vistas = {
      ingresar: ["Ingresar", formIngresar],
      crear: ["Crear cuenta", formCrear],
      olvide: ["Olvidé mi contraseña", formOlvide]
    };
    var botones = {};
    Object.keys(vistas).forEach(function (k) {
      var b = boton(null, vistas[k][0]);
      b.setAttribute("role", "tab");
      b.addEventListener("click", function () { ir(k); });
      botones[k] = b;
      pest.appendChild(b);
    });

    function ir(k) {
      msj.limpiar();
      Object.keys(botones).forEach(function (x) { botones[x].setAttribute("aria-selected", x === k ? "true" : "false"); });
      cuerpo.textContent = "";
      vistas[k][1]();
    }

    function formIngresar() {
      var f = el("form", "r-form");
      var email = entrada("email", "email", "", { autocomplete: "email", required: "" });
      var clave = entrada("password", "clave", "", { autocomplete: "current-password", required: "" });
      f.appendChild(campo("Email", email));
      f.appendChild(campo("Contraseña", clave));
      var ac = el("div", "acciones");
      var b = boton("boton", "Ingresar", "submit");
      ac.appendChild(b);
      f.appendChild(ac);
      f.addEventListener("submit", function (e) {
        e.preventDefault();
        ocupado(b, true, "Ingresando…");
        db().auth.signInWithPassword({ email: email.value.trim(), password: clave.value }).then(function (r) {
          if (r.error) { ocupado(b, false); return msj.mostrar(traducirError(r.error), "error"); }
          location.href = "panel.html";
        });
      });
      cuerpo.appendChild(f);
      email.focus();
    }

    function formCrear() {
      var f = el("form", "r-form");
      var nombre = entrada("text", "nombre", "", { autocomplete: "name", required: "", maxlength: "80" });
      var email = entrada("email", "email", "", { autocomplete: "email", required: "" });
      var clave = entrada("password", "clave", "", { autocomplete: "new-password", required: "", minlength: "8" });
      f.appendChild(campo("Nombre y apellido", nombre, "Así va a aparecer en tu perfil público."));
      f.appendChild(campo("Email", email));
      f.appendChild(campo("Contraseña", clave, "Mínimo 8 caracteres."));
      var ac = el("div", "acciones");
      var b = boton("boton", "Crear cuenta", "submit");
      ac.appendChild(b);
      f.appendChild(ac);
      f.addEventListener("submit", function (e) {
        e.preventDefault();
        if (clave.value.length < 8) return msj.mostrar("La contraseña tiene que tener al menos 8 caracteres.", "error");
        ocupado(b, true, "Creando cuenta…");
        db().auth.signUp({
          email: email.value.trim(),
          password: clave.value,
          options: { data: { nombre: nombre.value.trim() }, emailRedirectTo: location.origin + "/panel" }
        }).then(function (r) {
          ocupado(b, false);
          if (r.error) return msj.mostrar(traducirError(r.error), "error");
          if (r.data && r.data.session) { location.href = "panel.html"; return; }
          cuerpo.textContent = "";
          msj.mostrar("¡Listo! Te mandamos un email a " + email.value.trim() + " para confirmar la cuenta. Abrilo y tocá el link (revisá también spam).", "ok");
        });
      });
      cuerpo.appendChild(f);
      nombre.focus();
    }

    function formOlvide() {
      var f = el("form", "r-form");
      var email = entrada("email", "email", "", { autocomplete: "email", required: "" });
      f.appendChild(campo("Email de tu cuenta", email));
      var ac = el("div", "acciones");
      var b = boton("boton", "Mandarme el link", "submit");
      ac.appendChild(b);
      f.appendChild(ac);
      f.addEventListener("submit", function (e) {
        e.preventDefault();
        ocupado(b, true, "Enviando…");
        db().auth.resetPasswordForEmail(email.value.trim(), { redirectTo: location.origin + "/acceso" }).then(function (r) {
          ocupado(b, false);
          if (r.error) return msj.mostrar(traducirError(r.error), "error");
          msj.mostrar("Si hay una cuenta con ese email, te llega un link para elegir una contraseña nueva.", "ok");
        });
      });
      cuerpo.appendChild(f);
      email.focus();
    }

    function formNuevaClave() {
      pest.hidden = true;
      titulo.textContent = "Elegí una contraseña nueva";
      cuerpo.textContent = "";
      var f = el("form", "r-form");
      var clave = entrada("password", "clave", "", { autocomplete: "new-password", required: "", minlength: "8" });
      f.appendChild(campo("Contraseña nueva", clave, "Mínimo 8 caracteres."));
      var ac = el("div", "acciones");
      var b = boton("boton", "Guardar contraseña", "submit");
      ac.appendChild(b);
      f.appendChild(ac);
      f.addEventListener("submit", function (e) {
        e.preventDefault();
        if (clave.value.length < 8) return msj.mostrar("La contraseña tiene que tener al menos 8 caracteres.", "error");
        ocupado(b, true);
        db().auth.updateUser({ password: clave.value }).then(function (r) {
          ocupado(b, false);
          if (r.error) return msj.mostrar(traducirError(r.error), "error");
          location.href = "panel.html";
        });
      });
      cuerpo.appendChild(f);
    }

    var recuperando = /type=recovery/.test(location.hash);
    db().auth.onAuthStateChange(function (evento) {
      if (evento === "PASSWORD_RECOVERY") { recuperando = true; formNuevaClave(); }
    });

    if (recuperando) { formNuevaClave(); return; }
    db().auth.getSession().then(function (r) {
      if (recuperando) return;
      if (r.data && r.data.session) { location.href = "panel.html"; return; }
      ir("ingresar");
    });
  }

  // ---------- panel ----------

  function pintarPanel() {
    K.pintarMeta({ tituloPestana: "Mi panel | Red de técnicos" });
    var c = seccion();
    var espera = cargando(c);

    db().auth.getSession().then(function (r) {
      var sesion = r.data && r.data.session;
      if (!sesion) { location.href = "acceso.html"; return; }
      var usuario = sesion.user;

      Promise.all([
        db().rpc("es_admin"),
        db().from("tecnicos").select("*").eq("id", usuario.id).maybeSingle()
      ]).then(function (res) {
        if (res[0].error) throw res[0].error;
        if (res[1].error) throw res[1].error;
        var esAdmin = !!res[0].data;
        var yo = res[1].data;

        // la cuenta se creó con nombre pero sin perfil todavía: lo creamos pendiente
        var nombreInicial = usuario.user_metadata && usuario.user_metadata.nombre;
        if (!yo && !esAdmin && nombreInicial) {
          return db().from("tecnicos").insert({ id: usuario.id, nombre: nombreInicial }).select("*").single()
            .then(function (ins) {
              if (ins.error) throw ins.error;
              return { esAdmin: esAdmin, yo: ins.data };
            });
        }
        return { esAdmin: esAdmin, yo: yo };
      }).then(function (estado) {
        espera.remove();
        armarPanel(c, usuario, estado.esAdmin, estado.yo);
      }).catch(function (err) { falla(c, err); });
    });
  }

  function armarPanel(c, usuario, esAdmin, yo) {
    c.textContent = "";
    var cab = el("div", "r-cabeza-panel");
    var izq = el("div");
    izq.appendChild(el("div", "etiqueta", esAdmin ? "Panel de TecnoInformática" : "Red de técnicos"));
    var nombre = (yo && yo.nombre) || (usuario.user_metadata && usuario.user_metadata.nombre) || "";
    izq.appendChild(el("h1", null, nombre ? "Hola, " + nombre.split(" ")[0] : "Hola"));
    cab.appendChild(izq);
    var salir = boton("boton hueco chico", "Cerrar sesión");
    salir.addEventListener("click", function () {
      db().auth.signOut().then(function () { location.href = "acceso.html"; });
    });
    cab.appendChild(salir);
    c.appendChild(cab);

    var recargar = function () { pintarPanelDeNuevo(c, usuario); };

    if (esAdmin) panelAdmin(c, recargar);
    if (!esAdmin || yo) panelAlumno(c, usuario, yo, recargar);
  }

  function pintarPanelDeNuevo(c, usuario) {
    Promise.all([
      db().rpc("es_admin"),
      db().from("tecnicos").select("*").eq("id", usuario.id).maybeSingle()
    ]).then(function (res) {
      if (res[0].error) throw res[0].error;
      if (res[1].error) throw res[1].error;
      armarPanel(c, usuario, !!res[0].data, res[1].data);
    }).catch(function (err) { falla(c, err); });
  }

  function cajaCon(destino, titulo, bajada) {
    var caja = el("div", "r-caja");
    caja.appendChild(el("h2", null, titulo));
    if (bajada) caja.appendChild(el("p", null, bajada));
    destino.appendChild(caja);
    return caja;
  }

  function reglaTexto(tipo, valor) {
    if (valor == null) return "—";
    return tipo === "fijo" ? pesos(valor) + " por trabajo" : formatoPesos.format(valor) + "% del monto";
  }

  // ----- alumno -----

  function panelAlumno(c, usuario, yo, recargar) {
    if (yo) {
      var est = el("div", "r-aviso " + (yo.estado === "aprobado" ? "ok" : yo.estado === "pendiente" ? "espera" : "error"));
      if (yo.estado === "pendiente") {
        est.appendChild(el("p", null, "Tu perfil está esperando la aprobación de TecnoInformática. Completá tus datos y tu foto, y después avisale a Dario para que te apruebe."));
        est.appendChild(enlaceExterno("boton wa chico", "Avisar a Dario por WhatsApp",
          K.linkWa("Hola Dario, soy " + yo.nombre + ". Me registré en la Red de técnicos y ya completé mi perfil. ¿Me aprobás?")));
      } else if (yo.estado === "aprobado") {
        est.appendChild(document.createTextNode("Tu perfil está publicado en la Red de técnicos. "));
        est.appendChild(enlaceExterno(null, "Ver mi perfil público", "tecnico.html?t=" + encodeURIComponent(yo.slug)));
      } else {
        est.textContent = "Tu perfil está suspendido y no aparece en la red. Consultá con TecnoInformática.";
      }
      c.appendChild(est);
    }

    // aprobado: primero el trabajo del día a día, el perfil abajo
    var zonaTrabajos = el("div");
    var zonaPerfil = el("div");
    if (yo && yo.estado === "aprobado") { c.appendChild(zonaTrabajos); c.appendChild(zonaPerfil); }
    else { c.appendChild(zonaPerfil); c.appendChild(zonaTrabajos); }
    formPerfil(zonaPerfil, usuario, yo, recargar);
    if (!yo) return;
    c = zonaTrabajos;

    Promise.all([
      db().from("trabajos").select("*").eq("tecnico_id", usuario.id).order("creado", { ascending: false }),
      db().from("config_comisiones").select("*").eq("id", 1).maybeSingle()
    ]).then(function (res) {
      if (res[0].error) throw res[0].error;
      var trabajos = res[0].data || [];
      var conf = res[1].data || {};

      var cobrar = 0, pagar = 0;
      trabajos.forEach(function (t) {
        if (t.comision_pagada || t.comision == null) return;
        if (t.sentido === "deriva") cobrar += Number(t.comision); else pagar += Number(t.comision);
      });

      var resumen = el("div", "datos");
      resumen.style.marginBottom = "26px";
      resumen.appendChild(dato("Te debe TecnoInformática", pesos(cobrar), "Comisiones de trabajos que derivaste, sin cobrar"));
      resumen.appendChild(dato("Le debés a TecnoInformática", pesos(pagar), "Comisiones de trabajos que te pasaron, sin pagar"));
      resumen.appendChild(dato("Tus comisiones",
        "Cobrás " + reglaTexto(yo.deriva_tipo || conf.deriva_tipo, yo.deriva_valor != null ? yo.deriva_valor : conf.deriva_valor),
        "Pagás " + reglaTexto(yo.recibe_tipo || conf.recibe_tipo, yo.recibe_valor != null ? yo.recibe_valor : conf.recibe_valor)));
      c.appendChild(resumen);

      if (yo.estado === "aprobado") {
        if (window.RedKit) {
          window.RedKit.pintar(c, yo, {
            el: el, boton: boton, enlaceExterno: enlaceExterno, cajaCon: cajaCon, aviso: aviso,
            dominio: (K.C.negocio && K.C.negocio.dominio) || "tecnoinformatica-cdu.com.ar"
          });
        }
        formDerivar(c, usuario, yo, recargar);
        formPedirArchivo(c, yo);
        preciosAlumno(c);
      }

      var deriv = trabajos.filter(function (t) { return t.sentido === "deriva"; });
      var recib = trabajos.filter(function (t) { return t.sentido === "recibe"; });
      tablaDerivados(c, deriv);
      tablaRecibidos(c, recib, recargar);
    }).catch(function (err) {
      var a = el("div", "r-aviso error", "No se pudieron cargar tus trabajos: " + traducirError(err));
      c.appendChild(a);
    });
  }

  function dato(titulo, valor, nota) {
    var d = el("div", "dato");
    d.appendChild(el("span", null, titulo));
    d.appendChild(el("strong", "r-numero", valor));
    if (nota) d.appendChild(el("p", null, nota));
    return d;
  }

  function formPerfil(c, usuario, yo, recargar) {
    var caja = cajaCon(c, yo ? "Tu perfil público" : "Completá tu perfil",
      "Esto es lo que ven los clientes en la Red de técnicos.");
    var msj = aviso(caja);
    var f = el("form", "r-form dos");
    var v = yo || {};
    var nombre = entrada("text", "nombre", v.nombre || (usuario.user_metadata && usuario.user_metadata.nombre) || "", { required: "", maxlength: "80" });
    var localidad = entrada("text", "localidad", v.localidad, { maxlength: "80", placeholder: "Ej: Villa Mantero", list: "r-localidades", autocomplete: "off" });
    var lista = el("datalist");
    lista.id = "r-localidades";
    LOCALIDADES.forEach(function (l) { var o = el("option"); o.value = l; lista.appendChild(o); });
    var zona = entrada("text", "zona", v.zona, { maxlength: "80", placeholder: "Ej: Centro, barrio, o zona rural" });
    var wa = entrada("tel", "whatsapp", v.whatsapp, { placeholder: "3442 419123", inputmode: "tel" });
    var horarios = entrada("text", "horarios", v.horarios, { maxlength: "160", placeholder: "Lun a vie 9 a 18 h" });
    var servicios = texto("servicios", v.servicios, { maxlength: "600", placeholder: "Formateo e instalación de Windows\nLimpieza y pasta térmica\nCambio de pantalla" });
    var desc = texto("descripcion", v.descripcion, { maxlength: "1200", placeholder: "Contá en pocas líneas quién sos y cómo trabajás." });
    var archivo = entrada("file", "foto", null, { accept: "image/*" });

    f.appendChild(campo("Nombre y apellido", nombre));
    f.appendChild(campo("Localidad", localidad, "Elegila de la lista o escribila."));
    f.appendChild(lista);
    f.appendChild(campo("Barrio o zona (opcional)", zona));
    f.appendChild(campo("WhatsApp", wa, "Con código de área, sin 0 ni 15 (10 números)."));
    f.appendChild(campo("Horarios", horarios));
    f.appendChild(campo("Servicios", servicios, "Uno por línea.", true));
    f.appendChild(campo("Sobre vos", desc, null, true));

    var filaFoto = el("div", "ancho");
    var vista = foto(v.foto_url, v.nombre || nombre.value);
    vista.style.width = "120px";
    vista.style.height = "120px";
    vista.style.marginBottom = "10px";
    filaFoto.appendChild(vista);
    filaFoto.appendChild(campo("Foto de perfil", archivo, "Una foto tuya, de frente y con buena luz. JPG o PNG."));
    f.appendChild(filaFoto);

    archivo.addEventListener("change", function () {
      if (!archivo.files[0]) return;
      var url = URL.createObjectURL(archivo.files[0]);
      vista.textContent = "";
      var img = el("img");
      img.src = url;
      img.alt = "Vista previa";
      vista.appendChild(img);
    });

    var ac = el("div", "acciones ancho");
    var b = boton("boton", yo ? "Guardar cambios" : "Guardar perfil", "submit");
    ac.appendChild(b);
    f.appendChild(ac);
    caja.appendChild(f);

    f.addEventListener("submit", function (e) {
      e.preventDefault();
      msj.limpiar();
      var numero = normalizarWa(wa.value);
      if (numero === null) return msj.mostrar("El WhatsApp tiene que tener 10 números: código de área + número, sin 0 ni 15. Ej: 3442 419123", "error");
      if (!limpio(nombre.value)) return msj.mostrar("Falta tu nombre.", "error");

      ocupado(b, true);
      var subir = Promise.resolve(v.foto_url || null);
      if (archivo.files[0]) {
        subir = achicarFoto(archivo.files[0]).then(function (blob) {
          var ruta = usuario.id + "/" + Date.now() + ".jpg";
          return db().storage.from(BUCKET).upload(ruta, blob, { contentType: "image/jpeg", cacheControl: "31536000" })
            .then(function (up) {
              if (up.error) throw up.error;
              return db().storage.from(BUCKET).getPublicUrl(ruta).data.publicUrl;
            });
        });
      }

      subir.then(function (fotoUrl) {
        var datos = {
          nombre: limpio(nombre.value),
          localidad: limpio(localidad.value),
          zona: limpio(zona.value),
          whatsapp: numero || null,
          horarios: limpio(horarios.value),
          servicios: limpio(servicios.value),
          descripcion: limpio(desc.value),
          foto_url: fotoUrl
        };
        var q = yo
          ? db().from("tecnicos").update(datos).eq("id", usuario.id)
          : db().from("tecnicos").insert(Object.assign({ id: usuario.id }, datos));
        return q.then(function (r) { if (r.error) throw r.error; });
      }).then(function () {
        ocupado(b, false);
        recargar();
      }).catch(function (err) {
        ocupado(b, false);
        msj.mostrar(traducirError(err), "error");
      });
    });
  }

  function formDerivar(c, usuario, yo, recargar) {
    var caja = cajaCon(c, "Derivar un trabajo a TecnoInformática",
      "¿Te llegó un equipo que no podés resolver (no enciende, sin video, cortos en placa)? Cargalo acá y coordinamos la entrega. Cobrás tu comisión cuando se entrega.");
    var msj = aviso(caja);
    var f = el("form", "r-form dos");
    var equipo = entrada("text", "equipo", "", { required: "", maxlength: "160", placeholder: "Ej: Lenovo IdeaPad 330" });
    var falla = texto("falla", "", { maxlength: "1000", placeholder: "Qué le pasa y qué ya probaste" });
    var cli = entrada("text", "cliente_nombre", "", { maxlength: "120" });
    var tel = entrada("tel", "cliente_telefono", "", { maxlength: "40" });
    f.appendChild(campo("Equipo (marca y modelo)", equipo, null, true));
    f.appendChild(campo("Falla", falla, null, true));
    f.appendChild(campo("Cliente (opcional)", cli));
    f.appendChild(campo("Teléfono del cliente (opcional)", tel));
    var ac = el("div", "acciones ancho");
    var b = boton("boton", "Derivar trabajo", "submit");
    ac.appendChild(b);
    f.appendChild(ac);
    caja.appendChild(f);

    f.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!limpio(equipo.value)) return msj.mostrar("Falta el equipo.", "error");
      ocupado(b, true, "Enviando…");
      var datos = {
        sentido: "deriva",
        tecnico_id: usuario.id,
        equipo: limpio(equipo.value),
        falla: limpio(falla.value),
        cliente_nombre: limpio(cli.value),
        cliente_telefono: limpio(tel.value)
      };
      db().from("trabajos").insert(datos).then(function (r) {
        ocupado(b, false);
        if (r.error) return msj.mostrar(traducirError(r.error), "error");
        pasoAviso(caja, f, msj, "Trabajo cargado. Último paso: avisale a Dario para coordinar la entrega.",
          "Avisar a Dario por WhatsApp",
          K.linkWa("Hola Dario, soy " + yo.nombre + " de la Red de técnicos. Te derivé un trabajo: " + datos.equipo +
            (datos.falla ? " — " + datos.falla : "") +
            (datos.cliente_nombre ? " (cliente: " + datos.cliente_nombre + ")" : "") + ". ¿Cuándo te lo llevo?"),
          recargar);
      });
    });
  }

  // Después de cargar algo, el aviso por WhatsApp queda como paso visible de un toque.
  function pasoAviso(caja, form, msj, textoAviso, textoBoton, url, recargar) {
    form.style.display = "none";
    msj.limpiar();
    var paso = el("div", "r-aviso ok");
    paso.appendChild(el("p", null, textoAviso));
    var ac = el("div", "acciones");
    ac.style.display = "flex";
    ac.style.flexWrap = "wrap";
    ac.style.gap = "10px";
    var wa = enlaceExterno("boton wa", textoBoton, url);
    wa.addEventListener("click", function () { setTimeout(recargar, 1500); });
    ac.appendChild(wa);
    var listo = boton("boton hueco chico", "Ya avisé");
    listo.addEventListener("click", recargar);
    ac.appendChild(listo);
    paso.appendChild(ac);
    caja.appendChild(paso);
  }

  // No se sube nada a la web: arma el pedido y lo manda por WhatsApp a Dario.
  function formPedirArchivo(c, yo) {
    var caja = cajaCon(c, "Pedir un archivo",
      "¿Necesitás un BIOS, esquemático o boardview? Completá los datos y se te abre WhatsApp con el pedido listo para mandar.");
    var msj = aviso(caja);
    var f = el("form", "r-form dos");
    var tipo = selector("tipo", [["BIOS", "BIOS"], ["Esquemático", "Esquemático"], ["Boardview", "Boardview"], ["Datasheet", "Datasheet"], ["Otro", "Otro"]], "BIOS");
    var marca = entrada("text", "marca", "", { required: "", maxlength: "60", placeholder: "Ej: Lenovo" });
    var modelo = entrada("text", "modelo", "", { required: "", maxlength: "80", placeholder: "Ej: IdeaPad 330-15IKB" });
    var placa = entrada("text", "placa", "", { maxlength: "80", placeholder: "Ej: LA-F841P / DA0LV6MB6F0" });
    var nota = texto("nota", "", { maxlength: "400", placeholder: "Ej: necesito el BIOS limpio, la placa es rev 1.0" });
    f.appendChild(campo("Qué necesitás", tipo));
    f.appendChild(campo("Marca", marca));
    f.appendChild(campo("Modelo", modelo));
    f.appendChild(campo("Código de placa (opcional)", placa, "El que está impreso en la placa madre."));
    f.appendChild(campo("Comentario (opcional)", nota, null, true));
    var ac = el("div", "acciones ancho");
    var b = boton("boton wa", "Pedir por WhatsApp", "submit");
    ac.appendChild(b);
    f.appendChild(ac);
    caja.appendChild(f);

    f.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!limpio(marca.value) || !limpio(modelo.value)) return msj.mostrar("Completá marca y modelo.", "error");
      var lineasPedido = [
        "Hola Dario, soy " + yo.nombre + " de la Red de técnicos. Te pido un archivo:",
        "• Tipo: " + tipo.value,
        "• Equipo: " + limpio(marca.value) + " " + limpio(modelo.value)
      ];
      if (limpio(placa.value)) lineasPedido.push("• Placa: " + limpio(placa.value));
      if (limpio(nota.value)) lineasPedido.push("• Comentario: " + limpio(nota.value));
      window.open(K.linkWa(lineasPedido.join("\n")), "_blank", "noopener");
      msj.mostrar("Se abrió WhatsApp con tu pedido. Si no se abrió, revisá que el navegador no haya bloqueado la ventana.", "ok");
      f.reset();
    });
  }

  // ----- precios de referencia -----

  function rangoPrecio(r) {
    var d = r.desde != null ? Number(r.desde) : null;
    var h = r.hasta != null ? Number(r.hasta) : null;
    if (d != null && h != null && h > d) return pesos(d) + " a " + pesos(h);
    if (d != null) return pesos(d);
    if (h != null) return "hasta " + pesos(h);
    return "A definir";
  }

  function ordenarPrecios(lista) {
    return lista.slice().sort(function (a, b) {
      var c = String(a.categoria).localeCompare(String(b.categoria), "es");
      return c || (a.id - b.id);
    });
  }

  function ultimaActualizacion(lista) {
    var max = 0;
    lista.forEach(function (r) { var t = Date.parse(r.actualizado || 0); if (t > max) max = t; });
    return max ? new Date(max).toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" }) : "";
  }

  function preciosAlumno(c) {
    var caja = cajaCon(c, "Precios de referencia",
      "Lo que cobramos en la red, para que todos manejemos valores parecidos. Son de mano de obra: los repuestos se cobran aparte.");
    var espera = cargando(caja);
    db().from("precios").select("*").then(function (r) {
      espera.remove();
      if (r.error) return caja.appendChild(el("div", "r-aviso error", "No se pudieron cargar los precios: " + traducirError(r.error)));
      var lista = ordenarPrecios(r.data || []);
      if (!lista.length) return caja.appendChild(el("p", "r-vacio", "Todavía no hay precios cargados."));
      var fecha = ultimaActualizacion(lista);
      if (fecha) caja.appendChild(el("p", "r-kit-nota", "Actualizado el " + fecha + "."));
      var buscar = entrada("search", "buscar_precio", "", { placeholder: "Buscar servicio…", "aria-label": "Buscar servicio" });
      var filtros = el("div", "r-filtros");
      filtros.appendChild(buscar);
      caja.appendChild(filtros);
      var t = tabla(["Categoría", "Servicio", "Precio", "Nota"]);
      t.nodo.querySelector("table").classList.add("r-tabla-precios");
      caja.appendChild(t.nodo);
      function dibujar() {
        t.cuerpo.textContent = "";
        var q = buscar.value.trim().toLowerCase();
        var previa = null;
        lista.forEach(function (x) {
          if (q && (x.servicio + " " + x.categoria + " " + (x.nota || "")).toLowerCase().indexOf(q) < 0) return;
          var tr = el("tr");
          celda(tr, x.categoria === previa ? "" : x.categoria);
          previa = x.categoria;
          celda(tr, x.servicio);
          var precio = el("strong", null, rangoPrecio(x));
          celda(tr, precio);
          celda(tr, x.nota || "");
          t.cuerpo.appendChild(tr);
        });
        if (!t.cuerpo.children.length) {
          var tr = el("tr");
          var td = el("td", "r-vacio", "No hay servicios con esa búsqueda.");
          td.colSpan = 4;
          tr.appendChild(td);
          t.cuerpo.appendChild(tr);
        }
      }
      buscar.addEventListener("input", dibujar);
      dibujar();
    });
  }

  function preciosAdmin(c) {
    var caja = cajaCon(c, "Precios de referencia",
      "Los ven solo los técnicos aprobados, en su panel. Cambiá lo que quieras y tocá Guardar en esa fila. Dejá \"hasta\" vacío si es un precio fijo.");
    var msj = aviso(caja);
    var zona = el("div");
    caja.appendChild(zona);

    function cargar() {
      zona.textContent = "";
      var espera = cargando(zona);
      db().from("precios").select("*").then(function (r) {
        espera.remove();
        if (r.error) return msj.mostrar("No se pudieron cargar los precios: " + traducirError(r.error), "error");
        var lista = ordenarPrecios(r.data || []);
        var t = tabla(["Categoría", "Servicio", "Desde $", "Hasta $", "Nota", ""]);
        t.nodo.querySelector("table").classList.add("r-tabla-edicion");
        zona.appendChild(t.nodo);

        function fila(x) {
          var tr = el("tr");
          var cat = entrada("text", "categoria", x ? x.categoria : "", { maxlength: "60", placeholder: "Ej: Hardware" });
          var serv = entrada("text", "servicio", x ? x.servicio : "", { maxlength: "120", placeholder: "Servicio" });
          var desde = entrada("number", "desde", x ? x.desde : "", { min: "0", step: "100" });
          var hasta = entrada("number", "hasta", x ? x.hasta : "", { min: "0", step: "100" });
          var nota = entrada("text", "nota", x ? x.nota : "", { maxlength: "200" });
          [cat, serv, desde, hasta, nota].forEach(function (i) { celda(tr, i); });
          var acciones = el("div", "r-acciones-fila");
          var guardar = boton("boton chico", x ? "Guardar" : "Agregar");
          acciones.appendChild(guardar);
          var borrar = null;
          if (x) {
            borrar = boton("boton hueco chico", "Borrar");
            acciones.appendChild(borrar);
          }
          celda(tr, acciones);

          guardar.addEventListener("click", function () {
            var datos = {
              categoria: limpio(cat.value) || "General",
              servicio: limpio(serv.value),
              desde: desde.value === "" ? null : Number(desde.value),
              hasta: hasta.value === "" ? null : Number(hasta.value),
              nota: limpio(nota.value),
              actualizado: new Date().toISOString()
            };
            if (!datos.servicio) return msj.mostrar("Falta el nombre del servicio.", "error");
            if (datos.desde != null && datos.hasta != null && datos.hasta < datos.desde) return msj.mostrar("El precio \"hasta\" no puede ser menor que el \"desde\".", "error");
            ocupado(guardar, true, "…");
            var q = x ? db().from("precios").update(datos).eq("id", x.id) : db().from("precios").insert(datos);
            q.then(function (res) {
              ocupado(guardar, false);
              if (res.error) return msj.mostrar(traducirError(res.error), "error");
              msj.mostrar(x ? "Guardado: " + datos.servicio + "." : "Agregado: " + datos.servicio + ".", "ok");
              if (!x) cargar();
            });
          });

          if (borrar) {
            var confirmar = false;
            borrar.addEventListener("click", function () {
              if (!confirmar) {
                confirmar = true;
                borrar.textContent = "¿Seguro?";
                setTimeout(function () { confirmar = false; borrar.textContent = "Borrar"; }, 3000);
                return;
              }
              ocupado(borrar, true, "…");
              db().from("precios").delete().eq("id", x.id).then(function (res) {
                ocupado(borrar, false);
                if (res.error) return msj.mostrar(traducirError(res.error), "error");
                msj.mostrar("Borrado: " + x.servicio + ".", "ok");
                tr.remove();
              });
            });
          }
          return tr;
        }

        lista.forEach(function (x) { t.cuerpo.appendChild(fila(x)); });
        var nueva = fila(null);
        nueva.classList.add("r-fila-nueva");
        t.cuerpo.appendChild(nueva);
      });
    }
    cargar();
  }

  function tabla(columnas) {
    var s = el("div", "r-scroll");
    var t = el("table", "r-tabla");
    var th = el("thead");
    var tr = el("tr");
    columnas.forEach(function (n) { tr.appendChild(el("th", null, n)); });
    th.appendChild(tr);
    t.appendChild(th);
    var tb = el("tbody");
    t.appendChild(tb);
    s.appendChild(t);
    return { nodo: s, cuerpo: tb };
  }

  function celda(tr, contenido, sub) {
    var td = el("td");
    if (contenido instanceof Node) td.appendChild(contenido);
    else td.appendChild(document.createTextNode(contenido == null ? "" : contenido));
    if (sub) td.appendChild(el("small", null, sub));
    tr.appendChild(td);
    return td;
  }

  function chipPago(t) {
    if (t.comision == null) return el("span", null, "—");
    return t.comision_pagada ? el("span", "r-estado pagada", "Pagada") : el("span", "r-estado pendiente", "Pendiente");
  }

  function tablaDerivados(c, lista) {
    var caja = cajaCon(c, "Trabajos que derivaste", "TecnoInformática actualiza el estado y el monto. Tu comisión se calcula sola.");
    if (!lista.length) { caja.appendChild(el("p", "r-vacio", "Todavía no derivaste trabajos.")); return; }
    var t = tabla(["Fecha", "Equipo", "Estado", "Monto", "Tu comisión", "Pago"]);
    lista.forEach(function (x) {
      var tr = el("tr");
      celda(tr, fecha(x.creado));
      celda(tr, x.equipo, x.cliente_nombre ? "Cliente: " + x.cliente_nombre : null);
      celda(tr, estadoChip(x.estado));
      celda(tr, pesos(x.monto));
      celda(tr, pesos(x.comision));
      celda(tr, chipPago(x));
      t.cuerpo.appendChild(tr);
    });
    caja.appendChild(t.nodo);
  }

  function tablaRecibidos(c, lista, recargar) {
    var caja = cajaCon(c, "Trabajos que te pasó TecnoInformática",
      "Actualizá el estado y cargá lo que le cobraste al cliente: con eso se calcula la comisión.");
    if (!lista.length) { caja.appendChild(el("p", "r-vacio", "Todavía no te pasaron trabajos.")); return; }
    var msj = aviso(caja);
    var t = tabla(["Fecha", "Equipo y cliente", "Estado", "Le cobraste", "Comisión", "Pago", ""]);
    lista.forEach(function (x) {
      var tr = el("tr");
      celda(tr, fecha(x.creado));
      var info = el("div");
      info.appendChild(el("strong", null, x.equipo));
      if (x.falla) info.appendChild(el("small", null, x.falla));
      if (x.cliente_nombre || x.cliente_telefono) info.appendChild(el("small", null, [x.cliente_nombre, x.cliente_telefono].filter(Boolean).join(" · ")));
      celda(tr, info);
      var est = selector("estado", Object.keys(ESTADOS_TRABAJO).map(function (k) { return [k, ESTADOS_TRABAJO[k]]; }), x.estado);
      celda(tr, est);
      var monto = entrada("number", "monto", x.monto, { min: "0", step: "1", placeholder: "$" });
      celda(tr, monto);
      celda(tr, pesos(x.comision));
      celda(tr, chipPago(x));
      var b = boton("boton chico", "Guardar");
      b.addEventListener("click", function () {
        ocupado(b, true, "…");
        db().from("trabajos").update({ estado: est.value, monto: monto.value === "" ? null : Number(monto.value) }).eq("id", x.id)
          .then(function (r) {
            ocupado(b, false);
            if (r.error) return msj.mostrar(traducirError(r.error), "error");
            recargar();
          });
      });
      celda(tr, b);
      t.cuerpo.appendChild(tr);
    });
    caja.appendChild(t.nodo);
  }

  // ----- admin (Dario) -----

  function panelAdmin(c, recargar) {
    var zona = el("div");
    c.appendChild(zona);
    var espera = cargando(zona);

    Promise.all([
      db().from("tecnicos").select("*").order("creado", { ascending: true }),
      db().from("trabajos").select("*").order("creado", { ascending: false }),
      db().from("config_comisiones").select("*").eq("id", 1).maybeSingle()
    ]).then(function (res) {
      res.forEach(function (r) { if (r.error) throw r.error; });
      espera.remove();
      var tecnicos = res[0].data || [];
      var trabajos = res[1].data || [];
      var conf = res[2].data || {};
      var porId = {};
      tecnicos.forEach(function (t) { porId[t.id] = t; });

      var pendientes = tecnicos.filter(function (t) { return t.estado === "pendiente"; }).length;
      var aPagar = 0, aCobrar = 0;
      trabajos.forEach(function (t) {
        if (t.comision_pagada || t.comision == null) return;
        if (t.sentido === "deriva") aPagar += Number(t.comision); else aCobrar += Number(t.comision);
      });
      var resumen = el("div", "datos");
      resumen.style.marginBottom = "26px";
      resumen.appendChild(dato("Alumnos esperando aprobación", String(pendientes), tecnicos.length + " en total"));
      resumen.appendChild(dato("Comisiones a pagar a alumnos", pesos(aPagar), "Por trabajos que te derivaron"));
      resumen.appendChild(dato("Comisiones a cobrar a alumnos", pesos(aCobrar), "Por trabajos que les pasaste"));
      zona.appendChild(resumen);

      adminAlumnos(zona, tecnicos, recargar);
      adminPasarTrabajo(zona, tecnicos, recargar);
      adminTrabajos(zona, trabajos, porId, recargar);
      preciosAdmin(zona);
      adminComisiones(zona, conf, recargar);
    }).catch(function (err) {
      espera.remove();
      zona.appendChild(el("div", "r-aviso error", "No se pudo cargar el panel: " + traducirError(err)));
    });
  }

  function opcionesTipo(conGeneral) {
    var o = [["porcentaje", "%"], ["fijo", "$ fijo"]];
    return conGeneral ? [["", "General"]].concat(o) : o;
  }

  function adminComisiones(c, conf, recargar) {
    var caja = cajaCon(c, "Comisiones generales",
      "Se aplican a todos los alumnos salvo que le pongas una propia en la tabla de alumnos. Una comisión ya pagada no cambia.");
    var msj = aviso(caja);
    var f = el("form", "r-form dos");
    var dt = selector("deriva_tipo", opcionesTipo(false), conf.deriva_tipo);
    var dv = entrada("number", "deriva_valor", conf.deriva_valor, { min: "0", step: "0.01", required: "" });
    var rt = selector("recibe_tipo", opcionesTipo(false), conf.recibe_tipo);
    var rv = entrada("number", "recibe_valor", conf.recibe_valor, { min: "0", step: "0.01", required: "" });
    f.appendChild(campo("Cuando un alumno te deriva: le pagás", dt));
    f.appendChild(campo("Valor (porcentaje o pesos)", dv));
    f.appendChild(campo("Cuando le pasás un trabajo: te paga", rt));
    f.appendChild(campo("Valor (porcentaje o pesos)", rv));
    var ac = el("div", "acciones ancho");
    var b = boton("boton", "Guardar comisiones", "submit");
    ac.appendChild(b);
    f.appendChild(ac);
    caja.appendChild(f);
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      ocupado(b, true);
      db().from("config_comisiones").update({
        deriva_tipo: dt.value, deriva_valor: Number(dv.value),
        recibe_tipo: rt.value, recibe_valor: Number(rv.value),
        actualizado: new Date().toISOString()
      }).eq("id", 1).then(function (r) {
        ocupado(b, false);
        if (r.error) return msj.mostrar(traducirError(r.error), "error");
        msj.mostrar("Comisiones guardadas. Se aplican a los trabajos nuevos y a los que actualices.", "ok");
      });
    });
  }

  function adminAlumnos(c, tecnicos, recargar) {
    var caja = cajaCon(c, "Alumnos",
      "Aprobá a los que quieras publicar en la red. La comisión propia reemplaza a la general solo para ese alumno.");
    if (!tecnicos.length) {
      caja.appendChild(el("p", "r-vacio", "Todavía no se registró ningún alumno. Pasales el link: " + location.origin + "/acceso"));
      return;
    }
    var msj = aviso(caja);
    var t = tabla(["Alumno", "Estado", "Punto de recepción", "Le pagás (deriva)", "Te paga (recibe)", ""]);
    tecnicos.forEach(function (x) {
      var tr = el("tr");
      var info = el("div");
      if (x.estado === "aprobado") info.appendChild(enlaceExterno(null, x.nombre, "tecnico.html?t=" + encodeURIComponent(x.slug)));
      else info.appendChild(el("strong", null, x.nombre));
      info.appendChild(el("small", null, [x.email, lugar(x), x.whatsapp].filter(Boolean).join(" · ")));
      celda(tr, info);
      var est = selector("estado", Object.keys(ESTADOS_TECNICO).map(function (k) { return [k, ESTADOS_TECNICO[k]]; }), x.estado);
      celda(tr, est);
      var punto = entrada("checkbox", "punto_recepcion");
      punto.checked = !!x.punto_recepcion;
      punto.setAttribute("aria-label", "Punto de recepción");
      var lp = el("label", "r-kit-check");
      lp.appendChild(punto);
      lp.appendChild(document.createTextNode(" Recibe equipos"));
      celda(tr, lp);

      function par(tipo, valor) {
        var d = el("div");
        d.style.display = "grid";
        d.style.gridTemplateColumns = "100px 110px";
        d.style.gap = "6px";
        var s = selector("tipo", opcionesTipo(true), tipo || "");
        var v = entrada("number", "valor", valor, { min: "0", step: "0.01" });
        v.disabled = !s.value;
        s.addEventListener("change", function () { v.disabled = !s.value; if (!s.value) v.value = ""; });
        d.appendChild(s);
        d.appendChild(v);
        return { nodo: d, tipo: s, valor: v };
      }
      var der = par(x.deriva_tipo, x.deriva_valor);
      var rec = par(x.recibe_tipo, x.recibe_valor);
      celda(tr, der.nodo);
      celda(tr, rec.nodo);
      var b = boton("boton chico", "Guardar");
      b.addEventListener("click", function () {
        var cambios = {
          estado: est.value,
          punto_recepcion: punto.checked,
          deriva_tipo: der.tipo.value || null,
          deriva_valor: der.tipo.value && der.valor.value !== "" ? Number(der.valor.value) : null,
          recibe_tipo: rec.tipo.value || null,
          recibe_valor: rec.tipo.value && rec.valor.value !== "" ? Number(rec.valor.value) : null
        };
        if ((cambios.deriva_tipo && cambios.deriva_valor == null) || (cambios.recibe_tipo && cambios.recibe_valor == null)) {
          return msj.mostrar("Si elegís una comisión propia, poné también el valor.", "error");
        }
        ocupado(b, true, "…");
        db().from("tecnicos").update(cambios).eq("id", x.id).then(function (r) {
          ocupado(b, false);
          if (r.error) return msj.mostrar(traducirError(r.error), "error");
          recargar();
        });
      });
      celda(tr, b);
      t.cuerpo.appendChild(tr);
    });
    caja.appendChild(t.nodo);
  }

  function adminPasarTrabajo(c, tecnicos, recargar) {
    var aprobados = tecnicos.filter(function (t) { return t.estado === "aprobado"; });
    var caja = cajaCon(c, "Pasarle un trabajo a un alumno",
      "Para trabajos simples que te llegan y querés derivar. El alumno lo ve en su panel.");
    if (!aprobados.length) { caja.appendChild(el("p", "r-vacio", "Primero aprobá al menos un alumno.")); return; }
    var msj = aviso(caja);
    var f = el("form", "r-form dos");
    var quien = selector("tecnico", aprobados.map(function (t) { return [t.id, t.nombre + (t.zona ? " — " + t.zona : "")]; }), aprobados[0].id);
    var equipo = entrada("text", "equipo", "", { required: "", maxlength: "160" });
    var falla = texto("falla", "", { maxlength: "1000" });
    var cli = entrada("text", "cliente_nombre", "", { maxlength: "120" });
    var tel = entrada("tel", "cliente_telefono", "", { maxlength: "40" });
    f.appendChild(campo("Alumno", quien, null, true));
    f.appendChild(campo("Equipo (marca y modelo)", equipo, null, true));
    f.appendChild(campo("Falla / qué hay que hacer", falla, null, true));
    f.appendChild(campo("Cliente", cli));
    f.appendChild(campo("Teléfono del cliente", tel));
    var ac = el("div", "acciones ancho");
    var b = boton("boton", "Pasar trabajo", "submit");
    ac.appendChild(b);
    f.appendChild(ac);
    caja.appendChild(f);

    f.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!limpio(equipo.value)) return msj.mostrar("Falta el equipo.", "error");
      ocupado(b, true, "Enviando…");
      var t = aprobados.filter(function (x) { return x.id === quien.value; })[0];
      var datos = {
        sentido: "recibe",
        tecnico_id: quien.value,
        equipo: limpio(equipo.value),
        falla: limpio(falla.value),
        cliente_nombre: limpio(cli.value),
        cliente_telefono: limpio(tel.value)
      };
      db().from("trabajos").insert(datos).then(function (r) {
        ocupado(b, false);
        if (r.error) return msj.mostrar(traducirError(r.error), "error");
        if (t && t.whatsapp) {
          var nom = t.nombre.split(" ")[0];
          pasoAviso(caja, f, msj, "Trabajo cargado. Avisale a " + nom + " para que lo vea en su panel.",
            "Avisar a " + nom + " por WhatsApp",
            linkWaTecnico(t.whatsapp, "Hola " + nom + ", te pasé un trabajo en el panel de la Red: " + datos.equipo +
              (datos.falla ? " — " + datos.falla : "") +
              (datos.cliente_nombre ? " (cliente: " + datos.cliente_nombre + (datos.cliente_telefono ? ", " + datos.cliente_telefono : "") + ")" : "") +
              ". Entrá a tecnoinformatica-cdu.com.ar/panel para verlo."),
            recargar);
        } else {
          msj.mostrar("Trabajo cargado. Este alumno no tiene WhatsApp en su perfil: avisale por otro medio.", "ok");
          f.reset();
          setTimeout(recargar, 3000);
        }
      });
    });
  }

  function adminTrabajos(c, trabajos, porId, recargar) {
    var caja = cajaCon(c, "Trabajos de la red",
      "Cargá el monto cobrado al cliente para calcular la comisión y marcala como pagada cuando la saldes.");
    if (!trabajos.length) { caja.appendChild(el("p", "r-vacio", "Todavía no hay trabajos.")); return; }
    var msj = aviso(caja);

    var filtros = el("div", "r-filtros");
    var filtro = selector("filtro", [["todos", "Todos los trabajos"], ["sin_pagar", "Comisión sin pagar"], ["deriva", "Derivados a vos"], ["recibe", "Pasados a alumnos"]], "todos");
    filtro.setAttribute("aria-label", "Filtrar trabajos");
    filtros.appendChild(filtro);
    caja.appendChild(filtros);

    var t = tabla(["Fecha", "Sentido", "Equipo y cliente", "Estado", "Monto", "Comisión", "Pagada", ""]);
    caja.appendChild(t.nodo);

    function dibujar() {
      t.cuerpo.textContent = "";
      var f = filtro.value;
      trabajos.filter(function (x) {
        if (f === "sin_pagar") return x.comision != null && !x.comision_pagada && x.estado !== "cancelado";
        if (f === "deriva" || f === "recibe") return x.sentido === f;
        return true;
      }).forEach(function (x) {
        var alumno = porId[x.tecnico_id];
        var nom = alumno ? alumno.nombre : "Alumno";
        var tr = el("tr");
        celda(tr, fecha(x.creado));
        celda(tr, x.sentido === "deriva" ? "Te derivó" : "Le pasaste", nom);
        var info = el("div");
        info.appendChild(el("strong", null, x.equipo));
        if (x.falla) info.appendChild(el("small", null, x.falla));
        if (x.cliente_nombre || x.cliente_telefono) info.appendChild(el("small", null, [x.cliente_nombre, x.cliente_telefono].filter(Boolean).join(" · ")));
        celda(tr, info);
        var est = selector("estado", Object.keys(ESTADOS_TRABAJO).map(function (k) { return [k, ESTADOS_TRABAJO[k]]; }), x.estado);
        celda(tr, est);
        var monto = entrada("number", "monto", x.monto, { min: "0", step: "1", placeholder: "$" });
        celda(tr, monto);
        celda(tr, pesos(x.comision), x.comision == null ? null : (x.sentido === "deriva" ? "a pagar" : "a cobrar"));
        var pag = entrada("checkbox", "pagada");
        pag.checked = !!x.comision_pagada;
        pag.setAttribute("aria-label", "Comisión pagada");
        celda(tr, pag);
        var b = boton("boton chico", "Guardar");
        b.addEventListener("click", function () {
          ocupado(b, true, "…");
          db().from("trabajos").update({
            estado: est.value,
            monto: monto.value === "" ? null : Number(monto.value),
            comision_pagada: pag.checked
          }).eq("id", x.id).then(function (r) {
            ocupado(b, false);
            if (r.error) return msj.mostrar(traducirError(r.error), "error");
            recargar();
          });
        });
        celda(tr, b);
        t.cuerpo.appendChild(tr);
      });
      if (!t.cuerpo.children.length) {
        var tr = el("tr");
        var td = el("td", "r-vacio", "No hay trabajos con ese filtro.");
        td.colSpan = 8;
        tr.appendChild(td);
        t.cuerpo.appendChild(tr);
      }
    }
    filtro.addEventListener("change", dibujar);
    dibujar();
  }

  // ---------- entrada ----------

  window.RedApp = {
    pintar: function (pagina, kit) {
      K = kit;
      try {
        if (pagina === "red") return pintarDirectorio();
        if (pagina === "tecnico") return pintarPerfil();
        if (pagina === "puntos") return pintarPuntos();
        if (pagina === "acceso") return pintarAcceso();
        if (pagina === "panel") return pintarPanel();
      } catch (err) {
        var c = seccion();
        falla(c, err);
      }
    }
  };
})();
