(function () {
  "use strict";

  var CLAVE = "tecno_borrador";
  var datos = cargarBorrador() || clonar(window.CONTENIDO);

  function clonar(obj) { return JSON.parse(JSON.stringify(obj)); }

  function cargarBorrador() {
    try {
      var crudo = localStorage.getItem(CLAVE);
      return crudo ? JSON.parse(crudo) : null;
    } catch (e) {
      return null;
    }
  }

  function leer(ruta) {
    return ruta.split(".").reduce(function (nodo, k) { return nodo == null ? nodo : nodo[k]; }, datos);
  }

  function escribir(ruta, valor) {
    var partes = ruta.split(".");
    var ultima = partes.pop();
    var nodo = partes.reduce(function (n, k) {
      if (n[k] == null) n[k] = {};
      return n[k];
    }, datos);
    nodo[ultima] = valor;
    guardar();
  }

  var aviso = document.getElementById("aviso");
  var temporizador;
  function guardar() {
    localStorage.setItem(CLAVE, JSON.stringify(datos));
    aviso.classList.add("visible");
    clearTimeout(temporizador);
    temporizador = setTimeout(function () { aviso.classList.remove("visible"); }, 1400);
  }

  var esquema = [
    {
      id: "negocio",
      titulo: "Negocio",
      bloques: [
        {
          legend: "Datos del taller",
          campos: [
            ["negocio.nombre", "Nombre", "texto"],
            ["negocio.lema", "Lema", "texto"],
            ["negocio.direccion", "Dirección", "texto"],
            ["negocio.ciudad", "Ciudad y provincia", "texto"],
            ["negocio.horarios", "Horarios / turnos", "texto"],
            ["negocio.whatsapp", "WhatsApp visible", "texto"],
            ["negocio.whatsappLink", "Link de WhatsApp", "texto"],
            ["negocio.instagram", "Usuario de Instagram", "texto"],
            ["negocio.instagramLink", "Link de Instagram", "texto"],
            ["negocio.email", "Email", "texto"],
            ["negocio.dominio", "Dominio", "texto"],
            ["negocio.mapa", "Link al mapa", "texto"]
          ]
        },
        {
          legend: "Identidad",
          campos: [
            ["negocio.logo", "Logo horizontal (cabecera y pie)", "foto"],
            ["negocio.isotipo", "Isotipo cuadrado (icono y redes)", "foto"]
          ]
        },
        { legend: "Secciones activas", tipo: "modulos" }
      ]
    },
    {
      id: "colores",
      titulo: "Colores",
      bloques: [
        {
          legend: "Paleta del sitio",
          campos: [
            ["colores.--fondo", "Fondo general", "color"],
            ["colores.--panel", "Panel", "color"],
            ["colores.--panel-alto", "Panel (hover / destacado)", "color"],
            ["colores.--texto", "Texto principal", "color"],
            ["colores.--texto-medio", "Texto medio", "color"],
            ["colores.--texto-suave", "Texto suave", "color"],
            ["colores.--azul", "Azul (links, acentos)", "color"],
            ["colores.--azul-hondo", "Azul profundo (fondos)", "color"],
            ["colores.--naranja", "Naranja (botones, foco)", "color"],
            ["colores.--verde-wa", "Verde WhatsApp", "color"],
            ["colores.--linea", "Líneas / bordes", "color"],
            ["colores.--linea-fina", "Líneas finas", "color"]
          ]
        }
      ]
    },
    {
      id: "inicio",
      titulo: "Inicio",
      bloques: [
        {
          legend: "Portada",
          campos: [
            ["inicio.hero.etiqueta", "Etiqueta chica", "texto"],
            ["inicio.hero.titulo", "Título principal", "area"],
            ["inicio.hero.texto", "Texto de portada", "area"],
            ["inicio.hero.botonPrimario", "Botón principal", "texto"],
            ["inicio.hero.botonSecundario", "Botón secundario", "texto"],
            ["inicio.hero.epigrafeImagen", "Epígrafe de la foto", "texto"],
            ["inicio.hero.imagen", "Foto de portada", "foto"]
          ]
        },
        {
          legend: "Recuadro de datos",
          campos: [
            ["inicio.rotulo.linea1", "Especialidad", "texto"],
            ["inicio.rotulo.linea2", "Experiencia", "texto"],
            ["inicio.rotulo.linea3", "Marcas", "texto"]
          ]
        },
        {
          legend: "Diferenciales",
          tipo: "lista",
          ruta: "inicio.diferenciales",
          rotulo: "Diferencial",
          nuevo: { etiqueta: "", titulo: "", texto: "" },
          campos: [["etiqueta", "Etiqueta", "texto"], ["titulo", "Título", "texto"], ["texto", "Texto", "area"]]
        },
        {
          legend: "Pasos del proceso",
          tipo: "lista",
          ruta: "inicio.proceso",
          rotulo: "Paso",
          nuevo: { titulo: "", texto: "" },
          campos: [["titulo", "Título", "texto"], ["texto", "Texto", "area"]]
        },
        {
          legend: "Marcas",
          tipo: "texto-lista",
          ruta: "inicio.marcas",
          etiqueta: "Una marca por línea"
        },
        {
          legend: "Cierre de página",
          campos: [
            ["inicio.cierre.titulo", "Título", "texto"],
            ["inicio.cierre.texto", "Texto", "area"],
            ["inicio.cierre.boton", "Botón", "texto"]
          ]
        },
        {
          legend: "Buscadores",
          campos: [
            ["inicio.tituloPestana", "Título de pestaña", "texto"],
            ["inicio.metaDescripcion", "Descripción para Google", "area"]
          ]
        }
      ]
    },
    {
      id: "servicios",
      titulo: "Servicios",
      bloques: [
        {
          legend: "Encabezado",
          campos: [
            ["servicios.titulo", "Título", "texto"],
            ["servicios.intro", "Introducción", "area"]
          ]
        },
        {
          legend: "Servicios",
          tipo: "lista",
          ruta: "servicios.items",
          rotulo: "Servicio",
          nuevo: { etiqueta: "", titulo: "", texto: "", detalle: [], imagen: "" },
          campos: [
            ["etiqueta", "Categoría", "texto"],
            ["titulo", "Título", "texto"],
            ["texto", "Descripción", "area"],
            ["detalle", "Detalle (uno por línea)", "texto-lista"],
            ["imagen", "Foto del servicio (opcional)", "foto"]
          ]
        },
        {
          legend: "Recuadro final",
          campos: [
            ["servicios.aviso.titulo", "Título", "texto"],
            ["servicios.aviso.texto", "Texto", "area"]
          ]
        },
        {
          legend: "Buscadores",
          campos: [
            ["servicios.tituloPestana", "Título de pestaña", "texto"],
            ["servicios.metaDescripcion", "Descripción para Google", "area"]
          ]
        }
      ]
    },
    {
      id: "taller",
      titulo: "El taller",
      bloques: [
        {
          legend: "Encabezado",
          campos: [
            ["taller.titulo", "Título", "texto"],
            ["taller.intro", "Introducción", "area"]
          ]
        },
        {
          legend: "Bloques de texto",
          tipo: "lista",
          ruta: "taller.bloques",
          rotulo: "Bloque",
          nuevo: { titulo: "", texto: "" },
          campos: [["titulo", "Título", "texto"], ["texto", "Texto", "area"]]
        },
        {
          legend: "Galería de fotos",
          tipo: "lista",
          ruta: "taller.galeria",
          rotulo: "Foto",
          nuevo: { imagen: "", epigrafe: "" },
          campos: [["imagen", "Foto", "foto"], ["epigrafe", "Epígrafe", "texto"]]
        },
        {
          legend: "Buscadores",
          campos: [
            ["taller.tituloPestana", "Título de pestaña", "texto"],
            ["taller.metaDescripcion", "Descripción para Google", "area"]
          ]
        }
      ]
    },
    {
      id: "tienda",
      titulo: "Tienda",
      bloques: [
        {
          legend: "Encabezado",
          campos: [
            ["tienda.titulo", "Título", "texto"],
            ["tienda.intro", "Introducción", "area"],
            ["tienda.moneda", "Símbolo de moneda", "texto"],
            ["tienda.aviso", "Aviso final", "area"]
          ]
        },
        {
          legend: "Productos",
          tipo: "lista",
          ruta: "tienda.productos",
          rotulo: "Producto",
          nuevo: { nombre: "", precio: "", texto: "", imagen: "", estado: "Disponible" },
          campos: [
            ["nombre", "Nombre", "texto"],
            ["precio", "Precio (solo el número)", "texto"],
            ["estado", "Estado", "texto"],
            ["texto", "Descripción", "area"],
            ["imagen", "Foto", "foto"]
          ]
        }
      ]
    },
    {
      id: "contacto",
      titulo: "Contacto",
      bloques: [
        {
          legend: "Encabezado",
          campos: [
            ["contacto.titulo", "Título", "texto"],
            ["contacto.intro", "Introducción", "area"]
          ]
        },
        {
          legend: "Preguntas frecuentes",
          tipo: "lista",
          ruta: "contacto.preguntas",
          rotulo: "Pregunta",
          nuevo: { pregunta: "", respuesta: "" },
          campos: [["pregunta", "Pregunta", "texto"], ["respuesta", "Respuesta", "area"]]
        },
        {
          legend: "Consulta de estado de reparación",
          campos: [
            ["seguimiento.titulo", "Título", "texto"],
            ["seguimiento.texto", "Texto", "area"],
            ["seguimiento.placeholder", "Texto del campo", "texto"],
            ["seguimiento.endpoint", "Endpoint (usá {orden} donde va el número)", "texto"]
          ]
        }
      ]
    }
  ];

  var modulosVisibles = [
    ["tienda", "Tienda", "Muestra la página de repuestos y la agrega al menú."],
    ["galeria", "Galería del taller", "Fotos del banco de trabajo en la página El taller."],
    ["seguimiento", "Consulta de estado", "Buscador de órdenes. Necesita el endpoint de tu sistema."]
  ];

  var form = document.getElementById("editor");
  var pestanas = document.getElementById("pestanas");
  var activa = esquema[0].id;

  function el(tag, clase, texto) {
    var n = document.createElement(tag);
    if (clase) n.className = clase;
    if (texto != null) n.textContent = texto;
    return n;
  }

  function campoTexto(etiqueta, valor, alCambiar, multilinea) {
    var lab = el("label");
    lab.appendChild(el("span", null, etiqueta));
    var entrada = multilinea ? el("textarea") : el("input");
    if (!multilinea) entrada.type = "text";
    entrada.value = valor || "";
    entrada.addEventListener("input", function () { alCambiar(entrada.value); });
    lab.appendChild(entrada);
    return lab;
  }

  function campoLineas(etiqueta, lista, alCambiar) {
    var lab = el("label");
    lab.appendChild(el("span", null, etiqueta));
    var area = el("textarea");
    area.value = (lista || []).join("\n");
    area.addEventListener("input", function () {
      alCambiar(area.value.split("\n").map(function (t) { return t.trim(); }).filter(Boolean));
    });
    lab.appendChild(area);
    return lab;
  }

  function campoFoto(etiqueta, valor, alCambiar) {
    var caja = el("div");
    var titulo = el("span", null, etiqueta);
    titulo.style.cssText = "display:block;font-size:.78rem;color:#77839a;margin-bottom:6px;" +
      "font-family:'IBM Plex Mono',monospace;letter-spacing:.06em;text-transform:uppercase";
    caja.appendChild(titulo);

    var fila = el("div", "foto");
    var vista;

    function refrescar(src) {
      var nuevo;
      if (src) {
        nuevo = el("img");
        nuevo.src = src;
        nuevo.alt = "";
      } else {
        nuevo = el("div", "vacio", "sin foto");
      }
      if (vista) fila.replaceChild(nuevo, vista);
      else fila.appendChild(nuevo);
      vista = nuevo;
    }
    refrescar(valor);

    var controles = el("div", "foto-controles");
    var ruta = el("input");
    ruta.type = "text";
    ruta.placeholder = "img/mi-foto.jpg";
    ruta.value = valor && valor.indexOf("data:") !== 0 ? valor : "";
    ruta.addEventListener("input", function () {
      alCambiar(ruta.value);
      refrescar(ruta.value);
    });
    controles.appendChild(ruta);

    var botones = el("div");
    botones.style.cssText = "display:flex;gap:8px;margin-top:8px;flex-wrap:wrap";

    var subir = el("button", "mini", "Subir foto");
    subir.type = "button";
    var selector = el("input");
    selector.type = "file";
    selector.accept = "image/*";
    selector.hidden = true;
    subir.addEventListener("click", function () { selector.click(); });
    selector.addEventListener("change", function () {
      var archivo = selector.files[0];
      if (!archivo) return;
      achicar(archivo, function (dataUrl, kb) {
        alCambiar(dataUrl);
        refrescar(dataUrl);
        ruta.value = "";
        subir.textContent = "Cargada (" + kb + " KB)";
        setTimeout(function () { subir.textContent = "Subir foto"; }, 2500);
      });
      selector.value = "";
    });

    var quitar = el("button", "mini", "Quitar");
    quitar.type = "button";
    quitar.addEventListener("click", function () {
      alCambiar("");
      ruta.value = "";
      refrescar("");
    });

    botones.appendChild(subir);
    botones.appendChild(quitar);
    botones.appendChild(selector);
    controles.appendChild(botones);

    var nota = el("p", null, "Podés subir la foto acá o dejarla en la carpeta img/ y escribir la ruta.");
    nota.style.cssText = "font-size:.78rem;color:#77839a;margin:8px 0 0";
    controles.appendChild(nota);

    fila.appendChild(controles);
    caja.appendChild(fila);
    caja.style.marginBottom = "16px";
    return caja;
  }

  // Las fotos se guardan dentro del propio contenido.js, así que hay que achicarlas
  // o el archivo se vuelve inmanejable.
  function achicar(archivo, listo) {
    var lector = new FileReader();
    lector.onload = function () {
      var img = new Image();
      img.onload = function () {
        var maxAncho = 1280;
        var escala = Math.min(1, maxAncho / img.width);
        var lienzo = document.createElement("canvas");
        lienzo.width = Math.round(img.width * escala);
        lienzo.height = Math.round(img.height * escala);
        lienzo.getContext("2d").drawImage(img, 0, 0, lienzo.width, lienzo.height);
        var salida = lienzo.toDataURL("image/jpeg", 0.82);
        listo(salida, Math.round(salida.length * 0.75 / 1024));
      };
      img.src = lector.result;
    };
    lector.readAsDataURL(archivo);
  }

  function campoColor(etiqueta, valor, alCambiar) {
    var lab = el("label");
    lab.appendChild(el("span", null, etiqueta));
    var fila = el("div");
    fila.style.cssText = "display:flex;gap:8px;align-items:center";

    var color = el("input");
    color.type = "color";
    color.value = /^#[0-9a-fA-F]{6}$/.test(valor) ? valor : "#000000";
    color.style.cssText = "width:44px;height:38px;padding:2px;border:1px solid var(--linea);background:var(--fondo);cursor:pointer;flex:none";

    var texto = el("input");
    texto.type = "text";
    texto.value = valor || "";
    texto.style.marginBottom = "0";

    color.addEventListener("input", function () {
      texto.value = color.value;
      alCambiar(color.value);
    });
    texto.addEventListener("input", function () {
      if (/^#[0-9a-fA-F]{6}$/.test(texto.value)) color.value = texto.value;
      alCambiar(texto.value);
    });

    fila.appendChild(color);
    fila.appendChild(texto);
    lab.appendChild(fila);
    return lab;
  }

  function bloqueLista(bloque) {
    var fs = el("fieldset");
    fs.appendChild(el("legend", null, bloque.legend));
    var lista = leer(bloque.ruta) || [];
    var contenedor = el("div");

    lista.forEach(function (item, indice) {
      var caja = el("div", "item");
      var cabeza = el("div", "item-cabeza");
      cabeza.appendChild(el("strong", null, bloque.rotulo + " " + (indice + 1)));

      var mandos = el("div");
      mandos.style.cssText = "display:flex;gap:6px";
      if (indice > 0) mandos.appendChild(botonMini("Subir", function () { mover(bloque.ruta, indice, -1); }));
      if (indice < lista.length - 1) mandos.appendChild(botonMini("Bajar", function () { mover(bloque.ruta, indice, 1); }));
      mandos.appendChild(botonMini("Eliminar", function () {
        if (!confirm("¿Eliminar " + bloque.rotulo.toLowerCase() + " " + (indice + 1) + "?")) return;
        lista.splice(indice, 1);
        guardar();
        pintarFormulario();
      }));
      cabeza.appendChild(mandos);
      caja.appendChild(cabeza);

      bloque.campos.forEach(function (campo) {
        var clave = campo[0], etiqueta = campo[1], tipo = campo[2];
        if (tipo === "foto") {
          caja.appendChild(campoFoto(etiqueta, item[clave], function (v) { item[clave] = v; guardar(); }));
        } else if (tipo === "texto-lista") {
          caja.appendChild(campoLineas(etiqueta, item[clave], function (v) { item[clave] = v; guardar(); }));
        } else {
          caja.appendChild(campoTexto(etiqueta, item[clave], function (v) { item[clave] = v; guardar(); }, tipo === "area"));
        }
      });

      contenedor.appendChild(caja);
    });

    fs.appendChild(contenedor);
    var agregar = el("button", null, "Agregar " + bloque.rotulo.toLowerCase());
    agregar.type = "button";
    agregar.addEventListener("click", function () {
      lista.push(clonar(bloque.nuevo));
      escribir(bloque.ruta, lista);
      pintarFormulario();
    });
    fs.appendChild(agregar);
    return fs;
  }

  function botonMini(texto, alClic) {
    var b = el("button", "mini", texto);
    b.type = "button";
    b.addEventListener("click", alClic);
    return b;
  }

  function mover(ruta, indice, salto) {
    var lista = leer(ruta);
    var destino = indice + salto;
    var tmp = lista[destino];
    lista[destino] = lista[indice];
    lista[indice] = tmp;
    guardar();
    pintarFormulario();
  }

  function bloqueModulos() {
    var fs = el("fieldset");
    fs.appendChild(el("legend", null, "Secciones activas"));
    modulosVisibles.forEach(function (m) {
      var fila = el("div", "interruptor");
      var check = el("input");
      check.type = "checkbox";
      check.id = "mod-" + m[0];
      check.checked = !!(datos.modulos && datos.modulos[m[0]]);
      check.addEventListener("change", function () {
        datos.modulos[m[0]] = check.checked;
        guardar();
      });
      var texto = el("div");
      var lab = el("label", null, m[1]);
      lab.htmlFor = check.id;
      lab.style.cssText = "margin:0;font-weight:500";
      texto.appendChild(lab);
      texto.appendChild(el("p", null, m[2]));
      fila.appendChild(check);
      fila.appendChild(texto);
      fs.appendChild(fila);
    });
    return fs;
  }

  function pintarPestanas() {
    pestanas.innerHTML = "";
    esquema.forEach(function (seccion) {
      var b = el("button", seccion.id === activa ? "activa" : "", seccion.titulo);
      b.type = "button";
      b.addEventListener("click", function () {
        activa = seccion.id;
        pintarPestanas();
        pintarFormulario();
        window.scrollTo({ top: 0 });
      });
      pestanas.appendChild(b);
    });
  }

  function pintarFormulario() {
    form.innerHTML = "";
    var seccion = esquema.filter(function (s) { return s.id === activa; })[0];

    if (seccion.id === "tienda" && !(datos.modulos && datos.modulos.tienda)) {
      var nota = el("div", "ayuda", "La tienda está desactivada. Activala en la pestaña Negocio para que aparezca en el sitio. Igual podés cargar los productos desde acá.");
      form.appendChild(nota);
    }

    seccion.bloques.forEach(function (bloque) {
      if (bloque.tipo === "modulos") { form.appendChild(bloqueModulos()); return; }
      if (bloque.tipo === "lista") { form.appendChild(bloqueLista(bloque)); return; }

      var fs = el("fieldset");
      fs.appendChild(el("legend", null, bloque.legend));

      if (bloque.tipo === "texto-lista") {
        fs.appendChild(campoLineas(bloque.etiqueta, leer(bloque.ruta), function (v) { escribir(bloque.ruta, v); }));
        form.appendChild(fs);
        return;
      }

      var grilla = el("div", bloque.campos.length > 4 ? "fila" : "");
      bloque.campos.forEach(function (campo) {
        var ruta = campo[0], etiqueta = campo[1], tipo = campo[2];
        var nodo;
        if (tipo === "foto") {
          nodo = campoFoto(etiqueta, leer(ruta), function (v) { escribir(ruta, v); });
          nodo.style.gridColumn = "1 / -1";
        } else if (tipo === "color") {
          nodo = campoColor(etiqueta, leer(ruta), function (v) { escribir(ruta, v); });
        } else if (tipo === "texto-lista") {
          nodo = campoLineas(etiqueta, leer(ruta), function (v) { escribir(ruta, v); });
        } else {
          nodo = campoTexto(etiqueta, leer(ruta), function (v) { escribir(ruta, v); }, tipo === "area");
          if (tipo === "area") nodo.style.gridColumn = "1 / -1";
        }
        grilla.appendChild(nodo);
      });
      fs.appendChild(grilla);
      form.appendChild(fs);
    });
  }

  document.getElementById("descargar").addEventListener("click", function () {
    datos.version = (datos.version || 1) + 1;
    guardar();
    var cuerpo = "// Generado desde admin.html el " + new Date().toLocaleString("es-AR") + "\n" +
      "// Reemplazá este archivo en js/contenido.js y subilo al repositorio.\n\n" +
      "window.CONTENIDO = " + JSON.stringify(datos, null, 2) + ";\n";
    var blob = new Blob([cuerpo], { type: "text/javascript" });
    var link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "contenido.js";
    link.click();
    setTimeout(function () { URL.revokeObjectURL(link.href); }, 1000);
  });

  var selectorArchivo = document.getElementById("archivo-importado");
  document.getElementById("importar").addEventListener("click", function () { selectorArchivo.click(); });
  selectorArchivo.addEventListener("change", function () {
    var archivo = selectorArchivo.files[0];
    if (!archivo) return;
    var lector = new FileReader();
    lector.onload = function () {
      var texto = String(lector.result);
      var importado;
      try {
        importado = archivo.name.slice(-5) === ".json"
          ? JSON.parse(texto)
          : new Function("var window={};" + texto + "return window.CONTENIDO;")();
      } catch (e) {
        alert("No se pudo leer el archivo. Revisá que sea el contenido.js del sitio.");
        return;
      }
      if (!importado || !importado.negocio) {
        alert("El archivo no tiene el formato esperado.");
        return;
      }
      datos = importado;
      guardar();
      pintarFormulario();
    };
    lector.readAsText(archivo);
    selectorArchivo.value = "";
  });

  pintarPestanas();
  pintarFormulario();
})();
