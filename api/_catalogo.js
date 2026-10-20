// Lee el catálogo desde una planilla de Google publicada como CSV.
// El link va en la variable de entorno CATALOGO_CSV_URL (Vercel > Settings > Environment Variables).
// Los archivos que empiezan con "_" no se publican como endpoint: esto es solo un módulo.

const CACHE_MS = 60 * 1000;
let cache = { cuando: 0, productos: null };

function parsearCsv(texto) {
  const filas = [];
  let fila = [];
  let campo = "";
  let comillas = false;

  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (comillas) {
      if (c === '"') {
        if (texto[i + 1] === '"') { campo += '"'; i++; }
        else comillas = false;
      } else {
        campo += c;
      }
      continue;
    }
    if (c === '"') comillas = true;
    else if (c === ",") { fila.push(campo); campo = ""; }
    else if (c === "\n") { fila.push(campo); filas.push(fila); fila = []; campo = ""; }
    else if (c !== "\r") campo += c;
  }
  if (campo || fila.length) { fila.push(campo); filas.push(fila); }
  return filas;
}

function sinAcentos(s) {
  return String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function slug(s) {
  return sinAcentos(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
}

// En la planilla los títulos pueden venir con mayúsculas, acentos o espacios.
const COLUMNAS = {
  id: "id", codigo: "id", sku: "id",
  nombre: "nombre", titulo: "nombre", producto: "nombre",
  categoria: "categoria", rubro: "categoria",
  marca: "marca",
  precio: "precio",
  precio_anterior: "precioAnterior", precioanterior: "precioAnterior", antes: "precioAnterior",
  stock: "stock", cantidad: "stock",
  condicion: "condicion", estado: "condicion",
  envio: "envio",
  cuotas: "cuotas",
  destacado: "destacado",
  fotos: "fotos", foto: "fotos", imagenes: "fotos", imagen: "fotos",
  descripcion: "descripcion",
  compatibilidad: "compatibilidad", compatible: "compatibilidad",
  activo: "activo", publicado: "activo"
};

function clave(titulo) {
  const k = sinAcentos(titulo).toLowerCase().trim().replace(/\s+/g, "_");
  return COLUMNAS[k] || COLUMNAS[k.replace(/_/g, "")] || null;
}

// "45.000", "45000", "$ 45.000,50" o "45000.5" -> número
function numero(valor) {
  let s = String(valor || "").replace(/[^\d.,-]/g, "");
  if (!s) return 0;
  if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
  else if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, "");
  const n = parseFloat(s);
  return isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : 0;
}

function siNo(valor, siVacio) {
  const v = sinAcentos(valor).toLowerCase().trim();
  if (!v) return siVacio;
  return ["si", "s", "x", "1", "true", "verdadero"].includes(v);
}

// Un link de compartir de Google Drive no se puede usar como foto directa.
function urlFoto(url) {
  url = String(url || "").trim();
  const m = url.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:export=\w+&)?id=)([\w-]{20,})/);
  return m ? "https://lh3.googleusercontent.com/d/" + m[1] : url;
}

function envio(valor) {
  const v = sinAcentos(valor).toLowerCase();
  if (v.includes("grat")) return "gratis";
  if (v.includes("retir") || v.includes("local")) return "retiro";
  return "coordinar";
}

function condicion(valor) {
  const v = sinAcentos(valor).toLowerCase();
  if (v.startsWith("usad")) return "Usado";
  if (v.startsWith("reac") || v.startsWith("recon")) return "Reacondicionado";
  return "Nuevo";
}

function armarProductos(filas) {
  if (!filas.length) return [];
  const titulos = filas[0].map(clave);
  const vistos = new Set();
  const salida = [];

  for (const fila of filas.slice(1)) {
    const p = {};
    titulos.forEach((t, i) => { if (t && p[t] == null) p[t] = (fila[i] || "").trim(); });
    if (!p.nombre) continue;
    if (!siNo(p.activo, true)) continue;

    let id = slug(p.id || p.nombre);
    if (!id) continue;
    if (vistos.has(id)) { let n = 2; while (vistos.has(id + "-" + n)) n++; id += "-" + n; }
    vistos.add(id);

    const precio = numero(p.precio);
    const antes = numero(p.precioAnterior);
    const stockTxt = String(p.stock || "").trim();

    salida.push({
      id,
      nombre: p.nombre,
      categoria: p.categoria || "Otros",
      marca: p.marca || "",
      precio,
      precioAnterior: antes > precio ? antes : 0,
      // vacío = disponible sin número; 0 = sin stock
      stock: stockTxt === "" ? null : Math.max(0, parseInt(stockTxt, 10) || 0),
      condicion: condicion(p.condicion),
      envio: envio(p.envio),
      cuotas: Math.max(0, parseInt(p.cuotas, 10) || 0),
      destacado: siNo(p.destacado, false),
      fotos: String(p.fotos || "").split(/[|\n]/).map(urlFoto).filter(Boolean),
      descripcion: p.descripcion || "",
      compatibilidad: p.compatibilidad || ""
    });
  }
  return salida;
}

async function leerCatalogo() {
  if (cache.productos && Date.now() - cache.cuando < CACHE_MS) return cache.productos;

  const url = process.env.CATALOGO_CSV_URL;
  if (!url) throw new Error("Falta la variable CATALOGO_CSV_URL");

  const resp = await fetch(url, { redirect: "follow" });
  if (!resp.ok) throw new Error("La planilla respondió " + resp.status);
  const texto = await resp.text();
  if (/^\s*<(!doctype|html)/i.test(texto)) {
    throw new Error("El link no es un CSV publicado (Archivo > Compartir > Publicar en la web > CSV)");
  }

  const productos = armarProductos(parsearCsv(texto.replace(/^﻿/, "")));
  cache = { cuando: Date.now(), productos };
  return productos;
}

module.exports = { leerCatalogo, armarProductos, parsearCsv, numero };
