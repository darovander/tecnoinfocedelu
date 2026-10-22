// Seguimiento de reparación: el cliente pone su número de orden y su teléfono y ve el estado.
// El teléfono no viaja: se manda una huella SHA-256 de IDENTIFICADOR|NÚMERO|TELÉFONO.
// La base (función consultar_estado) solo responde si número y huella coinciden.
var SEGUIMIENTO_URL = "https://kofqyguccmpjkktlziou.supabase.co";
var SEGUIMIENTO_CLAVE = "sb_publishable_WTMCRpDE19XgV0TMhZ7MSA_MFO6__cM";
var SEGUIMIENTO_IDENTIFICADOR = "tecnoinformatica-cdu";

(function () {
  "use strict";

  var ESTADOS = {
    recibido: { texto: "Recibido", detalle: "Tu equipo ya está en el taller, en la fila para revisarlo." },
    diagnostico: { texto: "En diagnóstico", detalle: "Estamos buscando la falla." },
    presupuesto: { texto: "Presupuesto enviado", detalle: "Te pasamos el presupuesto. Esperamos tu confirmación para seguir." },
    esperando_repuesto: { texto: "Esperando repuesto", detalle: "Encargamos el repuesto que hace falta." },
    en_reparacion: { texto: "En reparación", detalle: "Estamos trabajando en tu equipo." },
    listo: { texto: "Listo para retirar", detalle: "Tu equipo está reparado y probado. Ya podés pasar a buscarlo." },
    entregado: { texto: "Entregado", detalle: "El equipo ya fue retirado. ¡Gracias por confiar en nosotros!" },
    sin_reparacion: { texto: "Sin reparación", detalle: "No fue posible reparar el equipo o no se aprobó el presupuesto. Podés pasar a retirarlo." }
  };
  var PASOS = ["recibido", "diagnostico", "en_reparacion", "listo", "entregado"];
  // estados intermedios que se muestran sobre un paso de la línea
  var EQUIVALE = { presupuesto: "diagnostico", esperando_repuesto: "en_reparacion", sin_reparacion: "listo" };

  function normalizarNumero(v) {
    return String(v || "").toUpperCase().replace(/\s+/g, "");
  }

  // Lo que escribe el cliente en el campo: "323", "ot 323", "OT-323" u "ot-323"
  // pasan a OT-000323. Cualquier otro formato (por ejemplo una orden vieja
  // con otro prefijo) queda como estaba, solo normalizado.
  function normalizarOrden(v) {
    var limpio = normalizarNumero(v);
    var m = /^(?:OT)?-?(\d{1,6})$/.exec(limpio);
    return m ? "OT-" + ("000000" + m[1]).slice(-6) : limpio;
  }

  // Últimos 6 dígitos: dan lo mismo con o sin +54, 9, 0, código de área o 15
  // (3442 15 419123, 03442-419123 y +54 9 3442 419123 terminan todos en 419123).
  function normalizarTelefono(v) {
    var d = String(v || "").replace(/\D/g, "");
    return d.length > 6 ? d.slice(-6) : d;
  }

  function huella(numero, telefono) {
    var texto = SEGUIMIENTO_IDENTIFICADOR + "|" + normalizarNumero(numero) + "|" + normalizarTelefono(telefono);
    return crypto.subtle.digest("SHA-256", new TextEncoder().encode(texto)).then(function (buf) {
      return Array.prototype.map.call(new Uint8Array(buf), function (b) { return ("0" + b.toString(16)).slice(-2); }).join("");
    });
  }

  function consultar(numero, telefono) {
    return huella(numero, telefono).then(function (h) {
      return fetch(SEGUIMIENTO_URL + "/rest/v1/rpc/consultar_estado", {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: SEGUIMIENTO_CLAVE },
        body: JSON.stringify({ p_numero: normalizarNumero(numero), p_huella: h })
      });
    }).then(function (r) {
      if (!r.ok) throw new Error("respuesta " + r.status);
      return r.json();
    }).then(function (filas) {
      return Array.isArray(filas) && filas.length ? filas[0] : null;
    });
  }

  function pintar(K) {
    var el = K.el;
    K.pintarMeta({
      tituloPestana: "Seguí tu reparación | TecnoInformática",
      metaDescripcion: "Consultá en qué estado está la reparación de tu equipo en TecnoInformática con tu número de orden."
    });

    var seccion = el("section", "seccion");
    var cont = el("div", "contenedor");
    var cab = el("div", "seccion-cabeza");
    cab.appendChild(el("div", "etiqueta", "Seguimiento"));
    cab.appendChild(el("h1", null, "Seguí tu reparación"));
    cab.appendChild(el("p", null, "Ingresá el número de orden que figura en tu comprobante y el teléfono que dejaste en el taller."));
    cont.appendChild(cab);

    var caja = el("div", "r-caja");
    caja.style.maxWidth = "640px";
    var f = el("form", "r-form dos");
    var lN = el("label");
    lN.appendChild(el("span", null, "Número de orden"));
    var num = el("input");
    num.type = "text";
    num.name = "numero";
    num.required = true;
    num.maxLength = 30;
    num.placeholder = "Ej: OT-000123";
    num.autocomplete = "off";
    num.setAttribute("autocapitalize", "characters");
    lN.appendChild(num);
    f.appendChild(lN);
    var lT = el("label");
    lT.appendChild(el("span", null, "Teléfono"));
    var tel = el("input");
    tel.type = "tel";
    tel.name = "telefono";
    tel.required = true;
    tel.maxLength = 20;
    tel.placeholder = "Ej: 3442 419123";
    tel.setAttribute("inputmode", "tel");
    lT.appendChild(tel);
    lT.appendChild(el("small", null, "El mismo que dejaste al traer el equipo."));
    f.appendChild(lT);
    var ac = el("div", "acciones ancho");
    var b = el("button", "boton", "Consultar estado");
    b.type = "submit";
    ac.appendChild(b);
    f.appendChild(ac);
    caja.appendChild(f);

    var salida = el("div", "s-resultado");
    salida.setAttribute("aria-live", "polite");
    caja.appendChild(salida);
    cont.appendChild(caja);
    seccion.appendChild(cont);
    K.raiz.appendChild(seccion);

    var params = new URLSearchParams(location.search);
    var n = params.get("n");
    var t = params.get("t");
    var autoconsulta = false;
    if (n) { num.value = normalizarOrden(n).slice(0, 30); tel.focus(); }
    if (t) {
      tel.value = String(t).slice(0, 20);
      autoconsulta = !!(n && normalizarTelefono(t).length >= 6);
      // el teléfono no tiene que quedar en la barra ni en el historial
      try { history.replaceState(null, "", location.pathname); } catch (err) { }
    }

    function aviso(texto, tipo) {
      salida.textContent = "";
      salida.appendChild(el("div", "r-aviso " + (tipo || ""), texto));
    }

    f.addEventListener("submit", function (e) {
      e.preventDefault();
      var numero = normalizarOrden(num.value);
      num.value = numero;
      if (!numero || normalizarTelefono(tel.value).length < 6) {
        return aviso("Completá el número de orden y el teléfono con código de área.", "error");
      }
      if (!window.crypto || !crypto.subtle) {
        return aviso("Tu navegador no permite hacer la consulta. Probá desde otro o escribinos por WhatsApp.", "error");
      }
      b.disabled = true;
      b.textContent = "Consultando…";
      consultar(numero, tel.value).then(function (orden) {
        if (!orden) {
          var no = el("div", "r-aviso error");
          no.appendChild(document.createTextNode("No encontramos una orden con esos datos. Revisá el número y el teléfono. "));
          var wa = el("a", null, "Consultanos por WhatsApp");
          wa.href = K.linkWa("Hola, quiero consultar el estado de la orden " + numero + ".");
          wa.target = "_blank";
          wa.rel = "noopener";
          no.appendChild(wa);
          salida.textContent = "";
          salida.appendChild(no);
          return;
        }
        mostrar(orden);
      }).catch(function () {
        aviso("No pudimos hacer la consulta ahora. Probá en un rato o escribinos por WhatsApp.", "error");
      }).then(function () {
        b.disabled = false;
        b.textContent = "Consultar estado";
      });
    });

    if (autoconsulta) f.dispatchEvent(new Event("submit", { cancelable: true }));

    // Muestra solo lo que devolvió la consulta: número, equipo, estado, nota y fecha.
    function mostrar(o) {
      salida.textContent = "";
      var info = ESTADOS[o.estado] || { texto: o.estado, detalle: "" };
      var r = el("div", "s-orden " + (o.estado === "listo" ? "listo" : o.estado === "sin_reparacion" ? "sin" : ""));
      r.appendChild(el("div", "etiqueta", "Orden " + o.numero));
      if (o.equipo) r.appendChild(el("p", "s-equipo", o.equipo));
      r.appendChild(el("h2", null, info.texto));
      if (info.detalle) r.appendChild(el("p", null, info.detalle));

      var actual = PASOS.indexOf(EQUIVALE[o.estado] || o.estado);
      var linea = el("ol", "s-pasos");
      PASOS.forEach(function (p, i) {
        var li = el("li", i < actual ? "hecho" : i === actual ? "actual" : "", ESTADOS[p].texto);
        linea.appendChild(li);
      });
      r.appendChild(linea);

      if (o.nota) {
        var nota = el("div", "s-nota");
        nota.appendChild(el("span", null, "Nota del taller"));
        nota.appendChild(el("p", null, o.nota));
        r.appendChild(nota);
      }
      if (o.actualizado) {
        var f = new Date(o.actualizado);
        r.appendChild(el("p", "s-fecha", "Actualizado el " + f.toLocaleDateString("es-AR", { day: "numeric", month: "long" }) +
          " a las " + f.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", hour12: false }) + " h"));
      }
      var wa = el("a", "boton wa", "Consultar por WhatsApp");
      wa.href = K.linkWa("Hola, consulto por la orden " + o.numero + ".");
      wa.target = "_blank";
      wa.rel = "noopener";
      r.appendChild(wa);
      salida.appendChild(r);
    }
  }

  window.Seguimiento = {
    pintar: pintar,
    huella: huella,
    normalizarNumero: normalizarNumero,
    normalizarOrden: normalizarOrden,
    normalizarTelefono: normalizarTelefono,
    ESTADOS: ESTADOS
  };
})();
