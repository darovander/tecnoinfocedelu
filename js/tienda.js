// Tienda: listado con filtros, ficha de producto y carrito.
// sitio.js llama a TiendaApp.pintar() en tienda.html, producto.html y carrito.html.
(function () {
  "use strict";

  var CLAVE_CARRITO = "tecno_carrito";
  var CLAVE_CACHE = "tecno_catalogo";
  var CACHE_MS = 2 * 60 * 1000;
  var POR_PAGINA = 24;

  var K;
  var catalogo = null;

  function el(tag, clase, texto) { return K.el(tag, clase, texto); }

  function enlace(clase, texto, href) {
    var a = el("a", clase, texto);
    a.href = href;
    return a;
  }

  function enlaceWa(clase, texto, mensaje) {
    var a = enlace(clase, texto, K.linkWa(mensaje));
    a.target = "_blank";
    a.rel = "noopener";
    return a;
  }

  function normalizar(s) {
    return String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  }

  function slug(s) {
    return normalizar(s).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
  }

  function numero(valor) {
    var s = String(valor || "").replace(/[^\d.,-]/g, "");
    if (!s) return 0;
    if (s.indexOf(",") > -1) s = s.replace(/\./g, "").replace(",", ".");
    else if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, "");
    var n = parseFloat(s);
    return isFinite(n) && n > 0 ? n : 0;
  }

  var formatoPesos = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 2 });
  function pesos(n) {
    return ((K.C.tienda && K.C.tienda.moneda) || "$") + " " + formatoPesos.format(n);
  }

  function descuento(p) {
    return p.precioAnterior > p.precio && p.precio ? Math.round((1 - p.precio / p.precioAnterior) * 100) : 0;
  }

  function hayStock(p) { return p.stock !== 0; }


  function desdeContenido() {
    // respaldo: los productos cargados a mano en admin.html
    var lista = (K.C.tienda && K.C.tienda.productos) || [];
    return lista.filter(function (p) { return p.nombre; }).map(function (p) {
      return {
        id: slug(p.nombre),
        nombre: p.nombre,
        categoria: "Repuestos",
        marca: "",
        precio: numero(p.precio),
        precioAnterior: 0,
        stock: null,
        condicion: "Nuevo",
        envio: "retiro",
        cuotas: 0,
        destacado: false,
        fotos: p.imagen ? [p.imagen] : [],
        descripcion: p.texto || "",
        compatibilidad: ""
      };
    });
  }

  function cargarCatalogo() {
    if (catalogo) return catalogo;

    try {
      var guardado = JSON.parse(sessionStorage.getItem(CLAVE_CACHE));
      if (guardado && Date.now() - guardado.cuando < CACHE_MS) {
        catalogo = Promise.resolve(guardado.datos);
        return catalogo;
      }
    } catch (e) { /* sin sessionStorage */ }

    catalogo = fetch("/api/catalogo")
      .then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); })
      .then(function (d) {
        var datos = { productos: d.productos || [], mercadoPago: !!d.mercadoPago };
        try { sessionStorage.setItem(CLAVE_CACHE, JSON.stringify({ cuando: Date.now(), datos: datos })); } catch (e) { }
        return datos;
      })
      .catch(function () {
        return { productos: desdeContenido(), mercadoPago: false };
      });
    return catalogo;
  }


  function leerCarrito() {
    try {
      var c = JSON.parse(localStorage.getItem(CLAVE_CARRITO));
      return Array.isArray(c) ? c : [];
    } catch (e) { return []; }
  }

  function guardarCarrito(lineas) {
    try { localStorage.setItem(CLAVE_CARRITO, JSON.stringify(lineas)); } catch (e) { }
    var total = lineas.reduce(function (t, l) { return t + l.cantidad; }, 0);
    var cuenta = document.getElementById("carrito-cuenta");
    if (cuenta) {
      cuenta.textContent = total;
      cuenta.hidden = !total;
      cuenta.classList.remove("salta");
      void cuenta.offsetWidth;
      cuenta.classList.add("salta");
    }
  }

  function agregarAlCarrito(p, cantidad) {
    var lineas = leerCarrito();
    var linea = lineas.find(function (l) { return l.id === p.id; });
    var tope = p.stock == null ? 99 : p.stock;
    if (linea) linea.cantidad = Math.min(tope, linea.cantidad + cantidad);
    else lineas.push({ id: p.id, cantidad: Math.min(tope, cantidad) });
    guardarCarrito(lineas);
  }

  function aviso(texto, conLink) {
    var viejo = document.querySelector(".t-aviso");
    if (viejo) viejo.remove();
    var caja = el("div", "t-aviso");
    caja.setAttribute("role", "status");
    caja.appendChild(el("span", null, texto));
    if (conLink) caja.appendChild(enlace(null, "Ver carrito", "carrito.html"));
    document.body.appendChild(caja);
    setTimeout(function () { caja.classList.add("fuera"); }, 3200);
    setTimeout(function () { caja.remove(); }, 3700);
  }


  function foto(p, clase) {
    var caja = el("div", clase || "t-foto");
    if (p.fotos && p.fotos[0]) {
      var img = el("img");
      img.src = p.fotos[0];
      img.alt = p.nombre;
      img.loading = "lazy";
      img.onerror = function () { caja.replaceChildren(el("span", null, "Sin foto")); };
      caja.appendChild(img);
    } else {
      caja.appendChild(el("span", null, "Sin foto"));
    }
    return caja;
  }

  function bloquePrecio(p, grande) {
    var caja = el("div", grande ? "t-precio grande" : "t-precio");
    if (!p.precio) {
      caja.appendChild(el("div", "t-monto consultar", "Precio a consultar"));
      return caja;
    }
    if (p.precioAnterior) caja.appendChild(el("s", "t-antes", pesos(p.precioAnterior)));
    var fila = el("div", "t-fila-precio");
    fila.appendChild(el("span", "t-monto", pesos(p.precio)));
    var off = descuento(p);
    if (off) fila.appendChild(el("span", "t-off", off + "% OFF"));
    caja.appendChild(fila);
    if (p.cuotas > 1) {
      caja.appendChild(el("div", "t-cuotas", "Mismo precio en " + p.cuotas + " cuotas de " + pesos(Math.round(p.precio / p.cuotas))));
    }
    return caja;
  }

  function lineaEnvio(p) {
    if (p.envio === "gratis") return el("div", "t-envio gratis", "Envío gratis");
    if (p.envio === "retiro") return el("div", "t-envio", "Retiro en el local");
    return el("div", "t-envio", "Envío a coordinar");
  }

  function tarjeta(p, i) {
    var a = enlace("t-tarjeta aparece" + (hayStock(p) ? "" : " agotado"), null, "producto.html?id=" + encodeURIComponent(p.id));
    a.style.setProperty("--i", i % 8);
    a.appendChild(foto(p));
    if (!hayStock(p)) a.appendChild(el("span", "t-marca-agotado", "Sin stock"));
    else if (p.destacado) a.appendChild(el("span", "t-marca-destacado", "Destacado"));
    var cuerpo = el("div", "t-cuerpo");
    cuerpo.appendChild(bloquePrecio(p));
    cuerpo.appendChild(lineaEnvio(p));
    cuerpo.appendChild(el("h3", null, p.nombre));
    var meta = [p.condicion !== "Nuevo" ? p.condicion : "", p.marca].filter(Boolean).join(" · ");
    if (meta) cuerpo.appendChild(el("div", "t-meta", meta));
    a.appendChild(cuerpo);
    return a;
  }

  function cargando(raiz) {
    var s = el("section", "seccion");
    var c = el("div", "contenedor");
    var g = el("div", "t-grilla");
    for (var i = 0; i < 8; i++) g.appendChild(el("div", "t-esqueleto"));
    c.appendChild(g);
    s.appendChild(c);
    raiz.appendChild(s);
    return s;
  }

  function buscador(valor) {
    var form = el("form", "t-buscador");
    form.action = "tienda.html";
    form.setAttribute("role", "search");
    var input = el("input");
    input.type = "search";
    input.name = "q";
    input.value = valor || "";
    input.placeholder = "Buscar cargador, batería, pantalla, modelo...";
    input.setAttribute("aria-label", "Buscar productos");
    input.autocomplete = "off";
    var boton = el("button", null, "Buscar");
    boton.type = "submit";
    form.appendChild(input);
    form.appendChild(boton);
    return form;
  }


  var FILTROS = ["q", "cat", "marca", "cond", "gratis", "oferta", "stock", "min", "max", "orden", "p"];

  function leerFiltros() {
    var u = new URLSearchParams(location.search);
    var f = {};
    FILTROS.forEach(function (k) { f[k] = u.get(k) || ""; });
    return f;
  }

  function escribirFiltros(f, nuevaEntrada) {
    var u = new URLSearchParams();
    FILTROS.forEach(function (k) { if (f[k]) u.set(k, f[k]); });
    var q = u.toString();
    var url = location.pathname + (q ? "?" + q : "");
    if (nuevaEntrada) history.pushState(null, "", url);
    else history.replaceState(null, "", url);
  }

  function puntaje(p, palabras) {
    if (!palabras.length) return 1;
    var nombre = normalizar(p.nombre);
    var resto = normalizar([p.marca, p.categoria, p.compatibilidad, p.descripcion, p.id].join(" "));
    var total = 0;
    for (var i = 0; i < palabras.length; i++) {
      var w = palabras[i];
      if (nombre.indexOf(w) === 0) total += 4;
      else if (nombre.indexOf(" " + w) > -1) total += 3;
      else if (nombre.indexOf(w) > -1) total += 2;
      else if (resto.indexOf(w) > -1) total += 1;
      else return 0;
    }
    return total;
  }

  function filtrar(productos, f, ignorar) {
    var palabras = normalizar(f.q).split(/\s+/).filter(Boolean);
    var min = numero(f.min), max = numero(f.max);
    var salida = [];
    productos.forEach(function (p) {
      if (ignorar !== "cat" && f.cat && p.categoria !== f.cat) return;
      if (ignorar !== "marca" && f.marca && p.marca !== f.marca) return;
      if (ignorar !== "cond" && f.cond && p.condicion !== f.cond) return;
      if (f.gratis && p.envio !== "gratis") return;
      if (f.oferta && !descuento(p)) return;
      if (f.stock && !hayStock(p)) return;
      if (min && (!p.precio || p.precio < min)) return;
      if (max && (!p.precio || p.precio > max)) return;
      var pts = puntaje(p, palabras);
      if (pts) salida.push({ p: p, pts: pts });
    });
    return salida;
  }

  function ordenar(lista, orden) {
    var porNombre = function (a, b) { return a.p.nombre.localeCompare(b.p.nombre, "es"); };
    // los "a consultar" van al final cuando se ordena por precio
    var precio = function (x, sentido) { return x.p.precio ? x.p.precio * sentido : Infinity; };
    var reglas = {
      menor: function (a, b) { return precio(a, 1) - precio(b, 1) || porNombre(a, b); },
      mayor: function (a, b) { return precio(a, -1) - precio(b, -1) || porNombre(a, b); },
      descuento: function (a, b) { return descuento(b.p) - descuento(a.p) || porNombre(a, b); },
      az: porNombre
    };
    lista.sort(reglas[orden] || function (a, b) {
      return (hayStock(b.p) - hayStock(a.p)) || (b.pts - a.pts) || (b.p.destacado - a.p.destacado) || porNombre(a, b);
    });
    return lista;
  }

  function contar(lista, campo) {
    var cuentas = {};
    lista.forEach(function (x) {
      var v = x.p[campo];
      if (v) cuentas[v] = (cuentas[v] || 0) + 1;
    });
    return Object.keys(cuentas).sort(function (a, b) { return a.localeCompare(b, "es"); })
      .map(function (k) { return [k, cuentas[k]]; });
  }

  function grupoOpciones(titulo, opciones, actual, alElegir) {
    if (opciones.length < 1) return null;
    var g = el("div", "t-grupo");
    g.appendChild(el("h3", null, titulo));
    var ul = el("ul");
    opciones.forEach(function (op) {
      var li = el("li");
      var b = el("button", op[0] === actual ? "elegido" : "", op[0]);
      b.type = "button";
      b.appendChild(el("span", null, op[1]));
      b.addEventListener("click", function () { alElegir(op[0] === actual ? "" : op[0]); });
      li.appendChild(b);
      ul.appendChild(li);
    });
    g.appendChild(ul);
    return g;
  }

  function casilla(texto, marcado, alCambiar) {
    var label = el("label", "t-casilla");
    var input = el("input");
    input.type = "checkbox";
    input.checked = !!marcado;
    input.addEventListener("change", function () { alCambiar(input.checked); });
    label.appendChild(input);
    label.appendChild(document.createTextNode(" " + texto));
    return label;
  }

  function pintarListado(datos, raiz) {
    var d = K.C.tienda || {};
    var f = leerFiltros();
    var productos = datos.productos;

    var seccion = el("section", "seccion t-seccion");
    var cont = el("div", "contenedor");

    var cab = el("div", "t-cabeza");
    var titulos = el("div");
    titulos.appendChild(el("div", "etiqueta", "Repuestos y accesorios"));
    titulos.appendChild(el("h1", null, d.titulo || "Tienda"));
    if (d.intro) titulos.appendChild(el("p", null, d.intro));
    cab.appendChild(titulos);
    var form = buscador(f.q);
    cab.appendChild(form);
    cont.appendChild(cab);

    var cuerpo = el("div", "t-listado");
    var lateral = el("aside", "t-filtros");
    lateral.id = "t-filtros";
    var resultados = el("div", "t-resultados");
    cuerpo.appendChild(lateral);
    cuerpo.appendChild(resultados);
    cont.appendChild(cuerpo);

    if (d.aviso) {
      var av = el("div", "aviso");
      av.style.marginTop = "40px";
      av.appendChild(el("p", null, d.aviso));
      cont.appendChild(av);
    }
    seccion.appendChild(cont);
    raiz.appendChild(seccion);

    function cambiar(clave, valor, nuevaEntrada) {
      f[clave] = valor;
      if (clave !== "p") f.p = "";
      escribirFiltros(f, nuevaEntrada);
      redibujar();
      if (clave === "p") cont.scrollIntoView({ behavior: "smooth" });
    }

    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      cambiar("q", form.q.value.trim(), true);
      form.q.blur();
    });

    window.addEventListener("popstate", function () {
      f = leerFiltros();
      form.q.value = f.q;
      redibujar();
    });

    function redibujar() {
      var encontrados = ordenar(filtrar(productos, f), f.orden);

      lateral.replaceChildren();
      var cerrar = el("button", "t-cerrar-filtros", "Ver " + encontrados.length + " resultados");
      cerrar.type = "button";
      cerrar.addEventListener("click", function () { lateral.classList.remove("abierto"); });

      [
        grupoOpciones("Categorías", contar(filtrar(productos, f, "cat"), "categoria"), f.cat, function (v) { cambiar("cat", v, true); }),
        grupoOpciones("Marca", contar(filtrar(productos, f, "marca"), "marca"), f.marca, function (v) { cambiar("marca", v, true); }),
        grupoOpciones("Condición", contar(filtrar(productos, f, "cond"), "condicion"), f.cond, function (v) { cambiar("cond", v, true); })
      ].forEach(function (g) { if (g) lateral.appendChild(g); });

      var extra = el("div", "t-grupo");
      extra.appendChild(el("h3", null, "Mostrar"));
      extra.appendChild(casilla("Envío gratis", f.gratis, function (v) { cambiar("gratis", v ? "1" : ""); }));
      extra.appendChild(casilla("En oferta", f.oferta, function (v) { cambiar("oferta", v ? "1" : ""); }));
      extra.appendChild(casilla("Solo con stock", f.stock, function (v) { cambiar("stock", v ? "1" : ""); }));
      lateral.appendChild(extra);

      var gp = el("form", "t-grupo t-rango");
      gp.appendChild(el("h3", null, "Precio"));
      var fila = el("div");
      var iMin = el("input"); iMin.name = "min"; iMin.inputMode = "numeric"; iMin.placeholder = "Mínimo"; iMin.value = f.min;
      var iMax = el("input"); iMax.name = "max"; iMax.inputMode = "numeric"; iMax.placeholder = "Máximo"; iMax.value = f.max;
      iMin.setAttribute("aria-label", "Precio mínimo");
      iMax.setAttribute("aria-label", "Precio máximo");
      var ir = el("button", null, "›"); ir.type = "submit"; ir.setAttribute("aria-label", "Aplicar precio");
      fila.appendChild(iMin); fila.appendChild(iMax); fila.appendChild(ir);
      gp.appendChild(fila);
      gp.addEventListener("submit", function (ev) {
        ev.preventDefault();
        f.min = iMin.value.replace(/\D/g, "");
        f.max = iMax.value.replace(/\D/g, "");
        cambiar("p", "", true);
      });
      lateral.appendChild(gp);
      lateral.appendChild(cerrar);

      resultados.replaceChildren();
      var barra = el("div", "t-barra");
      var cantidad = el("div", "t-cantidad");
      cantidad.appendChild(el("strong", null, f.q ? "“" + f.q + "”" : (f.cat || "Todos los productos")));
      cantidad.appendChild(el("span", null, encontrados.length + (encontrados.length === 1 ? " resultado" : " resultados")));
      barra.appendChild(cantidad);

      var abrir = el("button", "t-abrir-filtros", "Filtrar");
      abrir.type = "button";
      abrir.setAttribute("aria-controls", "t-filtros");
      abrir.addEventListener("click", function () { lateral.classList.add("abierto"); });
      barra.appendChild(abrir);

      var sel = el("select", "t-orden");
      sel.setAttribute("aria-label", "Ordenar por");
      [["", "Más relevantes"], ["menor", "Menor precio"], ["mayor", "Mayor precio"], ["descuento", "Mayor descuento"], ["az", "Nombre A-Z"]].forEach(function (o) {
        var op = el("option", null, o[1]);
        op.value = o[0];
        if (f.orden === o[0]) op.selected = true;
        sel.appendChild(op);
      });
      sel.addEventListener("change", function () { cambiar("orden", sel.value); });
      barra.appendChild(sel);
      resultados.appendChild(barra);

      var activos = el("div", "t-activos");
      [["q", "Búsqueda"], ["cat", ""], ["marca", ""], ["cond", ""], ["gratis", "Envío gratis"], ["oferta", "En oferta"], ["stock", "Con stock"],
        ["min", "Desde $"], ["max", "Hasta $"]].forEach(function (par) {
        if (!f[par[0]]) return;
        var t = par[0] === "gratis" || par[0] === "oferta" || par[0] === "stock" ? par[1]
          : (par[1] ? par[1] + (par[0] === "q" ? ": " : "") : "") + f[par[0]];
        var b = el("button", "t-chip", t);
        b.type = "button";
        b.setAttribute("aria-label", "Quitar filtro " + t);
        b.addEventListener("click", function () {
          if (par[0] === "q") form.q.value = "";
          cambiar(par[0], "", true);
        });
        activos.appendChild(b);
      });
      if (activos.childNodes.length > 1) {
        var limpiar = el("button", "t-limpiar", "Limpiar todo");
        limpiar.type = "button";
        limpiar.addEventListener("click", function () {
          FILTROS.forEach(function (k) { if (k !== "orden") f[k] = ""; });
          form.q.value = "";
          escribirFiltros(f, true);
          redibujar();
        });
        activos.appendChild(limpiar);
      }
      if (activos.childNodes.length) resultados.appendChild(activos);

      if (!encontrados.length) {
        var vacio = el("div", "t-vacio");
        vacio.appendChild(el("h2", null, productos.length ? "No encontramos productos con esos filtros" : "Todavía no hay productos publicados"));
        vacio.appendChild(el("p", null, "Puede que lo tengamos en el taller y no esté cargado. Preguntanos y te confirmamos."));
        vacio.appendChild(enlaceWa("boton wa", "Preguntar por WhatsApp", f.q ? "Hola, ¿tienen " + f.q + "?" : "Hola, busco un repuesto."));
        resultados.appendChild(vacio);
        K.revelar();
        return;
      }

      var paginas = Math.ceil(encontrados.length / POR_PAGINA);
      var actual = Math.min(paginas, Math.max(1, parseInt(f.p, 10) || 1));
      var grilla = el("div", "t-grilla");
      encontrados.slice((actual - 1) * POR_PAGINA, actual * POR_PAGINA).forEach(function (x, i) {
        grilla.appendChild(tarjeta(x.p, i));
      });
      resultados.appendChild(grilla);

      if (paginas > 1) {
        var nav = el("nav", "t-paginas");
        nav.setAttribute("aria-label", "Páginas");
        function botonPagina(n, texto) {
          var b = el("button", n === actual ? "actual" : "", texto || String(n));
          b.type = "button";
          b.disabled = n < 1 || n > paginas || n === actual;
          if (n === actual) b.setAttribute("aria-current", "page");
          b.addEventListener("click", function () { cambiar("p", n > 1 ? String(n) : "", true); });
          return b;
        }
        nav.appendChild(botonPagina(actual - 1, "‹ Anterior"));
        for (var n = 1; n <= paginas; n++) {
          if (n === 1 || n === paginas || Math.abs(n - actual) <= 1) nav.appendChild(botonPagina(n));
          else if (Math.abs(n - actual) === 2) nav.appendChild(el("span", null, "…"));
        }
        nav.appendChild(botonPagina(actual + 1, "Siguiente ›"));
        resultados.appendChild(nav);
      }
      K.revelar();
    }

    redibujar();
  }


  function pintarProducto(datos, raiz) {
    var id = new URLSearchParams(location.search).get("id") || "";
    var p = datos.productos.find(function (x) { return x.id === id; });

    var seccion = el("section", "seccion t-seccion");
    var cont = el("div", "contenedor");
    cont.appendChild(buscador(""));
    seccion.appendChild(cont);
    raiz.appendChild(seccion);

    if (!p) {
      var vacio = el("div", "t-vacio");
      vacio.appendChild(el("h1", null, "Este producto ya no está publicado"));
      vacio.appendChild(el("p", null, "Puede que se haya vendido o que el link esté mal escrito."));
      vacio.appendChild(enlace("boton", "Ver la tienda", "tienda.html"));
      cont.appendChild(vacio);
      return;
    }

    K.pintarMeta({
      tituloPestana: p.nombre + " | TecnoInformática",
      metaDescripcion: (p.descripcion || p.nombre).slice(0, 155)
    });
    var canon = document.querySelector('link[rel="canonical"]');
    if (canon) canon.href = "https://" + (K.C.negocio.dominio || location.host) + "/producto.html?id=" + encodeURIComponent(p.id);
    datosEstructurados(p);

    var migas = el("nav", "t-migas");
    migas.setAttribute("aria-label", "Ubicación");
    migas.appendChild(enlace(null, "Tienda", "tienda.html"));
    migas.appendChild(el("span", null, "›"));
    migas.appendChild(enlace(null, p.categoria, "tienda.html?cat=" + encodeURIComponent(p.categoria)));
    cont.appendChild(migas);

    var ficha = el("div", "t-ficha");
    ficha.appendChild(galeria(p));

    var compra = el("div", "t-compra");
    var arriba = [p.condicion, p.marca].filter(Boolean).join(" · ");
    compra.appendChild(el("div", "t-meta", arriba));
    compra.appendChild(el("h1", null, p.nombre));
    compra.appendChild(bloquePrecio(p, true));

    var datosEnvio = el("div", "t-datos");
    if (p.envio !== "retiro") datosEnvio.appendChild(lineaEnvio(p));
    datosEnvio.appendChild(el("div", null, "Retiro sin cargo en " + K.C.negocio.direccion + ", " + (K.C.negocio.ciudad || "")));
    compra.appendChild(datosEnvio);

    var conPrecio = !!p.precio;
    if (!hayStock(p)) {
      compra.appendChild(el("div", "t-stock sin", "Sin stock por ahora"));
    } else {
      compra.appendChild(el("div", "t-stock", p.stock == null ? "Stock disponible" : "Stock disponible · " + p.stock + (p.stock === 1 ? " unidad" : " unidades")));
    }

    if (hayStock(p) && conPrecio) {
      var tope = p.stock == null ? 10 : Math.min(p.stock, 10);
      var cant = el("label", "t-cant");
      cant.appendChild(document.createTextNode("Cantidad "));
      var sel = el("select");
      for (var i = 1; i <= tope; i++) {
        var op = el("option", null, String(i));
        op.value = i;
        sel.appendChild(op);
      }
      cant.appendChild(sel);
      compra.appendChild(cant);

      var ya = el("button", "boton t-ancho", "Comprar ahora");
      ya.type = "button";
      ya.addEventListener("click", function () {
        agregarAlCarrito(p, parseInt(sel.value, 10));
        location.href = "carrito.html";
      });
      var sumar = el("button", "boton hueco t-ancho", "Agregar al carrito");
      sumar.type = "button";
      sumar.addEventListener("click", function () {
        agregarAlCarrito(p, parseInt(sel.value, 10));
        aviso("Agregaste " + p.nombre, true);
      });
      compra.appendChild(ya);
      compra.appendChild(sumar);
    }

    var pregunta = conPrecio && hayStock(p)
      ? "Hola, tengo una consulta sobre: " + p.nombre
      : "Hola, ¿tienen disponible " + p.nombre + "? ¿Qué precio tiene?";
    compra.appendChild(enlaceWa("boton wa t-ancho", conPrecio && hayStock(p) ? "Consultar por WhatsApp" : "Consultar disponibilidad", pregunta));

    var pagos = el("div", "t-pagos");
    pagos.appendChild(el("h3", null, "Medios de pago"));
    var lista = el("ul");
    if (datos.mercadoPago) lista.appendChild(el("li", null, "Mercado Pago: tarjetas, dinero en cuenta y efectivo"));
    lista.appendChild(el("li", null, "Transferencia o efectivo al retirar"));
    pagos.appendChild(lista);
    compra.appendChild(pagos);
    ficha.appendChild(compra);
    cont.appendChild(ficha);

    if (p.descripcion || p.compatibilidad) {
      var info = el("div", "t-info");
      if (p.descripcion) {
        info.appendChild(el("h2", null, "Descripción"));
        info.appendChild(el("p", "t-texto", p.descripcion));
      }
      if (p.compatibilidad) {
        info.appendChild(el("h2", null, "Compatibilidad"));
        info.appendChild(el("p", "t-texto", p.compatibilidad));
      }
      cont.appendChild(info);
    }

    var parecidos = datos.productos.filter(function (x) {
      return x.id !== p.id && x.categoria === p.categoria && hayStock(x);
    }).slice(0, 8);
    if (parecidos.length) {
      var rel = el("div", "t-relacionados");
      rel.appendChild(el("h2", null, "Más en " + p.categoria));
      var g = el("div", "t-grilla t-fila");
      parecidos.forEach(function (x, n) { g.appendChild(tarjeta(x, n)); });
      rel.appendChild(g);
      cont.appendChild(rel);
    }
    K.revelar();
  }

  function galeria(p) {
    var caja = el("div", "t-galeria");
    var principal = foto(p, "t-foto t-principal");
    if (p.fotos.length > 1) {
      var miniaturas = el("div", "t-miniaturas");
      p.fotos.slice(0, 8).forEach(function (src, i) {
        var b = el("button", i === 0 ? "elegida" : "");
        b.type = "button";
        b.setAttribute("aria-label", "Foto " + (i + 1));
        var img = el("img");
        img.src = src;
        img.alt = "";
        img.loading = "lazy";
        b.appendChild(img);
        var mostrar = function () {
          var grande = principal.querySelector("img");
          if (grande) grande.src = src;
          miniaturas.querySelectorAll("button").forEach(function (x) { x.classList.toggle("elegida", x === b); });
        };
        b.addEventListener("click", mostrar);
        b.addEventListener("mouseenter", mostrar);
        miniaturas.appendChild(b);
      });
      caja.appendChild(miniaturas);
    }
    caja.appendChild(principal);
    return caja;
  }

  function datosEstructurados(p) {
    var ld = {
      "@context": "https://schema.org",
      "@type": "Product",
      name: p.nombre,
      sku: p.id,
      category: p.categoria,
      description: p.descripcion || p.nombre,
      itemCondition: "https://schema.org/" + (p.condicion === "Usado" ? "UsedCondition" : p.condicion === "Reacondicionado" ? "RefurbishedCondition" : "NewCondition")
    };
    if (p.marca) ld.brand = { "@type": "Brand", name: p.marca };
    if (p.fotos.length) ld.image = p.fotos.map(function (f) { return new URL(f, location.href).href; });
    if (p.precio) {
      ld.offers = {
        "@type": "Offer",
        price: p.precio,
        priceCurrency: "ARS",
        availability: "https://schema.org/" + (hayStock(p) ? "InStock" : "OutOfStock"),
        url: location.href
      };
    }
    var s = el("script");
    s.type = "application/ld+json";
    s.textContent = JSON.stringify(ld);
    document.head.appendChild(s);
  }


  function codigoPedido() {
    var d = new Date();
    var fecha = String(d.getFullYear()).slice(2) + String(d.getMonth() + 1).padStart(2, "0") + String(d.getDate()).padStart(2, "0");
    return "TI-" + fecha + "-" + Math.random().toString(36).slice(2, 6).toUpperCase();
  }

  function resultadoPago(cont) {
    var u = new URLSearchParams(location.search);
    var estado = u.get("pago");
    if (!estado) return;

    var pedido = u.get("external_reference") || "";
    var operacion = u.get("payment_id") || u.get("collection_id") || "";
    var caja = el("div", "t-resultado " + estado);
    var detalle = [pedido && "Pedido " + pedido, operacion && operacion !== "null" && "Operación " + operacion].filter(Boolean).join(" · ");

    if (estado === "aprobado") {
      guardarCarrito([]);
      caja.appendChild(el("h2", null, "¡Pago aprobado! Gracias por tu compra"));
      caja.appendChild(el("p", null, "Escribinos para coordinar el retiro o el envío. Mercado Pago también te mandó el comprobante por mail."));
      caja.appendChild(enlaceWa("boton wa", "Coordinar entrega por WhatsApp",
        "Hola, acabo de pagar por Mercado Pago. " + detalle + ". ¿Coordinamos la entrega?"));
    } else if (estado === "pendiente") {
      caja.appendChild(el("h2", null, "Tu pago está pendiente"));
      caja.appendChild(el("p", null, "Si elegiste pagar en efectivo (Rapipago, Pago Fácil), se acredita cuando lo abonás. Te avisamos cuando lo veamos."));
      caja.appendChild(enlaceWa("boton wa", "Avisar por WhatsApp", "Hola, hice un pedido con pago pendiente. " + detalle));
    } else {
      caja.appendChild(el("h2", null, "El pago no se pudo completar"));
      caja.appendChild(el("p", null, "No se cobró nada. Tu carrito sigue guardado: podés probar con otro medio o hacer el pedido por WhatsApp."));
    }
    if (detalle) caja.appendChild(el("div", "t-meta", detalle));
    cont.appendChild(caja);
    history.replaceState(null, "", location.pathname);
  }

  function pintarCarrito(datos, raiz) {
    K.pintarMeta({ tituloPestana: "Carrito | TecnoInformática" });

    var seccion = el("section", "seccion t-seccion");
    var cont = el("div", "contenedor");
    seccion.appendChild(cont);
    raiz.appendChild(seccion);

    resultadoPago(cont);

    var cab = el("div", "t-cabeza");
    var tit = el("div");
    tit.appendChild(el("div", "etiqueta", "Tu pedido"));
    tit.appendChild(el("h1", null, "Carrito"));
    cab.appendChild(tit);
    cont.appendChild(cab);

    var zona = el("div");
    cont.appendChild(zona);

    var porId = {};
    datos.productos.forEach(function (p) { porId[p.id] = p; });

    var entrega = "retiro";
    var comprador = { nombre: "", telefono: "" };

    function dibujar() {
      zona.replaceChildren();
      var lineas = leerCarrito();
      var faltantes = lineas.filter(function (l) { return !porId[l.id]; });
      if (faltantes.length) {
        lineas = lineas.filter(function (l) { return porId[l.id]; });
        guardarCarrito(lineas);
        aviso(faltantes.length === 1 ? "Sacamos un producto que ya no está publicado" : "Sacamos productos que ya no están publicados");
      }

      if (!lineas.length) {
        var vacio = el("div", "t-vacio");
        vacio.appendChild(el("h2", null, "Tu carrito está vacío"));
        vacio.appendChild(el("p", null, "Buscá repuestos y accesorios en la tienda."));
        vacio.appendChild(enlace("boton", "Ir a la tienda", "tienda.html"));
        zona.appendChild(vacio);
        return;
      }

      var grilla = el("div", "t-carrito");
      var lista = el("div", "t-lineas");
      var total = 0;
      var todoGratis = true;
      var problemas = [];

      lineas.forEach(function (l) {
        var p = porId[l.id];
        var fila = el("div", "t-linea");
        var link = enlace("t-linea-foto", null, "producto.html?id=" + encodeURIComponent(p.id));
        link.appendChild(foto(p, "t-foto"));
        fila.appendChild(link);

        var info = el("div", "t-linea-info");
        info.appendChild(enlace("t-linea-nombre", p.nombre, "producto.html?id=" + encodeURIComponent(p.id)));
        info.appendChild(lineaEnvio(p));
        if (!hayStock(p)) problemas.push(p.nombre + " se quedó sin stock");
        else if (!p.precio) problemas.push(p.nombre + " tiene precio a consultar");

        var acciones = el("div", "t-linea-acciones");
        var tope = p.stock == null ? 99 : p.stock;
        if (l.cantidad > tope && tope > 0) { l.cantidad = tope; guardarCarrito(lineas); }

        var paso = el("div", "t-paso");
        var menos = el("button", null, "−"); menos.type = "button"; menos.setAttribute("aria-label", "Restar uno");
        var mas = el("button", null, "+"); mas.type = "button"; mas.setAttribute("aria-label", "Sumar uno");
        menos.disabled = l.cantidad <= 1;
        mas.disabled = l.cantidad >= tope;
        menos.addEventListener("click", function () { l.cantidad--; guardarCarrito(lineas); dibujar(); });
        mas.addEventListener("click", function () { l.cantidad++; guardarCarrito(lineas); dibujar(); });
        paso.appendChild(menos);
        paso.appendChild(el("span", null, String(l.cantidad)));
        paso.appendChild(mas);
        acciones.appendChild(paso);

        var quitar = el("button", "t-quitar", "Eliminar");
        quitar.type = "button";
        quitar.addEventListener("click", function () {
          guardarCarrito(leerCarrito().filter(function (x) { return x.id !== l.id; }));
          dibujar();
        });
        acciones.appendChild(quitar);
        if (p.stock != null && p.stock > 0) acciones.appendChild(el("span", "t-meta", p.stock + " disponibles"));
        info.appendChild(acciones);
        fila.appendChild(info);

        var sub = p.precio * l.cantidad;
        total += sub;
        if (p.envio !== "gratis") todoGratis = false;
        fila.appendChild(el("div", "t-linea-precio", p.precio ? pesos(sub) : "A consultar"));
        lista.appendChild(fila);
      });
      grilla.appendChild(lista);

      var resumen = el("aside", "t-resumen");
      resumen.appendChild(el("h2", null, "Resumen"));

      var entregas = el("fieldset", "t-entrega");
      entregas.appendChild(el("legend", null, "Entrega"));
      [["retiro", "Retiro en el local", "Sin cargo · " + K.C.negocio.direccion],
        ["envio", "Envío a domicilio", todoGratis ? "Envío gratis" : "El costo se coordina por WhatsApp"]].forEach(function (o) {
        var lab = el("label", "t-opcion");
        var r = el("input");
        r.type = "radio";
        r.name = "entrega";
        r.value = o[0];
        r.checked = entrega === o[0];
        r.addEventListener("change", function () { entrega = o[0]; dibujar(); });
        lab.appendChild(r);
        var txt = el("span");
        txt.appendChild(el("strong", null, o[1]));
        txt.appendChild(el("small", null, o[2]));
        lab.appendChild(txt);
        entregas.appendChild(lab);
      });
      resumen.appendChild(entregas);

      var cuentas = el("dl", "t-cuentas");
      cuentas.appendChild(el("dt", null, "Productos"));
      cuentas.appendChild(el("dd", null, pesos(total)));
      cuentas.appendChild(el("dt", null, "Envío"));
      cuentas.appendChild(el("dd", null, entrega === "retiro" || todoGratis ? "Gratis" : "A coordinar"));
      cuentas.appendChild(el("dt", "t-total", "Total"));
      cuentas.appendChild(el("dd", "t-total", pesos(total)));
      resumen.appendChild(cuentas);

      var form = el("form", "t-datos-comprador");
      [["nombre", "Tu nombre", "text", true], ["telefono", "Teléfono (opcional)", "tel", false]].forEach(function (c) {
        var lab = el("label");
        lab.appendChild(el("span", null, c[1]));
        var inp = el("input");
        inp.name = c[0];
        inp.type = c[2];
        inp.required = c[3];
        inp.value = comprador[c[0]];
        inp.autocomplete = c[0] === "nombre" ? "name" : "tel";
        inp.addEventListener("input", function () { comprador[c[0]] = inp.value; });
        lab.appendChild(inp);
        form.appendChild(lab);
      });
      resumen.appendChild(form);

      if (problemas.length) {
        var alerta = el("div", "t-alerta");
        alerta.appendChild(el("p", null, problemas.join(". ") + ". Sacalo del carrito o consultanos por WhatsApp."));
        resumen.appendChild(alerta);
      }

      var error = el("div", "t-error");
      error.setAttribute("role", "alert");

      function validar() {
        if (problemas.length) return false;
        if (!comprador.nombre.trim()) {
          form.nombre.focus();
          form.reportValidity();
          return false;
        }
        return true;
      }

      var wa = el("button", "boton wa t-ancho", "Enviar pedido por WhatsApp");
      wa.type = "button";
      wa.disabled = !!problemas.length;
      wa.addEventListener("click", function () {
        if (!validar()) return;
        var pedido = codigoPedido();
        var texto = ["Hola, quiero hacer este pedido (" + pedido + "):", ""];
        lineas.forEach(function (l) {
          var p = porId[l.id];
          texto.push("• " + l.cantidad + " x " + p.nombre + " — " + pesos(p.precio * l.cantidad));
        });
        texto.push("", "Total: " + pesos(total));
        texto.push("Entrega: " + (entrega === "retiro" ? "Retiro en el local" : "Envío a domicilio"));
        texto.push("Nombre: " + comprador.nombre.trim());
        if (comprador.telefono.trim()) texto.push("Teléfono: " + comprador.telefono.trim());
        window.open(K.linkWa(texto.join("\n")), "_blank", "noopener");
      });
      resumen.appendChild(wa);

      if (datos.mercadoPago) {
        var mp = el("button", "boton t-ancho t-mp", "Pagar con Mercado Pago");
        mp.type = "button";
        mp.disabled = !!problemas.length;
        mp.addEventListener("click", function () {
          if (!validar()) return;
          error.textContent = "";
          mp.disabled = true;
          mp.textContent = "Conectando con Mercado Pago…";
          fetch("/api/mp-preferencia", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              items: lineas.map(function (l) { return { id: l.id, cantidad: l.cantidad }; }),
              comprador: comprador,
              entrega: entrega
            })
          })
            .then(function (r) {
              return r.json().catch(function () { return {}; }).then(function (j) {
                if (!r.ok || !j.url) throw new Error(j.error || "No pudimos iniciar el pago.");
                return j;
              });
            })
            .then(function (j) { location.href = j.url; })
            .catch(function (err) {
              error.textContent = err.message + " También podés enviar el pedido por WhatsApp.";
              mp.disabled = false;
              mp.textContent = "Pagar con Mercado Pago";
              try { sessionStorage.removeItem(CLAVE_CACHE); } catch (e) { }
            });
        });
        resumen.appendChild(mp);
        if (entrega === "envio" && !todoGratis) {
          resumen.appendChild(el("p", "t-nota", "Con Mercado Pago pagás los productos; el envío se abona aparte cuando lo coordinamos."));
        }
      }
      resumen.appendChild(error);
      resumen.appendChild(el("p", "t-nota", "Por WhatsApp te confirmamos stock y te pasamos los datos para transferencia o efectivo."));

      grilla.appendChild(resumen);
      zona.appendChild(grilla);
    }

    dibujar();
  }

  window.TiendaApp = {
    pintar: function (pagina, kit) {
      K = kit;
      var espera = cargando(K.raiz);
      cargarCatalogo().then(function (datos) {
        espera.remove();
        if (pagina === "producto") pintarProducto(datos, K.raiz);
        else if (pagina === "carrito") pintarCarrito(datos, K.raiz);
        else pintarListado(datos, K.raiz);
      });
    }
  };
})();
