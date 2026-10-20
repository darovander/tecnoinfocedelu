// POST /api/mp-preferencia
// Recibe { items: [{ id, cantidad }], comprador: { nombre, telefono }, entrega }
// y devuelve { url, pedido } con el link de pago de Mercado Pago.
// Los precios NUNCA vienen del navegador: se recalculan desde la planilla.
const { leerCatalogo } = require("./_catalogo");

const MAX_ITEMS = 40;
const MAX_CANTIDAD = 99;

function texto(v, largo) {
  return String(v || "").replace(/[\u0000-\u001f]/g, " ").trim().slice(0, largo);
}

function codigoPedido() {
  const d = new Date();
  const fecha = d.toISOString().slice(2, 10).replace(/-/g, "");
  return "TI-" + fecha + "-" + Math.random().toString(36).slice(2, 6).toUpperCase();
}

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Método no permitido" });
  }

  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) return res.status(503).json({ error: "Mercado Pago no está configurado" });

  let cuerpo = req.body;
  if (typeof cuerpo === "string") {
    try { cuerpo = JSON.parse(cuerpo); } catch (e) { cuerpo = null; }
  }
  const pedidos = cuerpo && Array.isArray(cuerpo.items) ? cuerpo.items.slice(0, MAX_ITEMS) : [];
  if (!pedidos.length) return res.status(400).json({ error: "El carrito está vacío" });

  let catalogo;
  try {
    catalogo = await leerCatalogo();
  } catch (err) {
    return res.status(503).json({ error: "No pudimos leer el catálogo. Probá en un rato." });
  }
  const porId = new Map(catalogo.map((p) => [p.id, p]));

  const items = [];
  const problemas = [];
  for (const linea of pedidos) {
    const p = porId.get(String(linea.id || ""));
    const cantidad = Math.min(MAX_CANTIDAD, Math.max(1, parseInt(linea.cantidad, 10) || 1));
    if (!p) { problemas.push("Un producto del carrito ya no está publicado"); continue; }
    if (!p.precio) { problemas.push(p.nombre + ": precio a consultar"); continue; }
    if (p.stock === 0) { problemas.push(p.nombre + ": sin stock"); continue; }
    if (p.stock != null && cantidad > p.stock) { problemas.push(p.nombre + ": quedan " + p.stock); continue; }

    const item = {
      id: p.id,
      title: p.nombre.slice(0, 250),
      quantity: cantidad,
      unit_price: p.precio,
      currency_id: "ARS",
      category_id: "computing"
    };
    if (p.fotos[0] && /^https:\/\//.test(p.fotos[0])) item.picture_url = p.fotos[0];
    items.push(item);
  }

  if (problemas.length) return res.status(409).json({ error: problemas.join(". ") });

  const host = req.headers["x-forwarded-host"] || req.headers.host;
  const base = "https://" + host;
  const pedido = codigoPedido();
  const comprador = (cuerpo && cuerpo.comprador) || {};
  const entrega = cuerpo && cuerpo.entrega === "envio" ? "Envío a coordinar" : "Retiro en el local";

  const preferencia = {
    items,
    external_reference: pedido,
    statement_descriptor: "TECNOINFORMATICA",
    back_urls: {
      success: base + "/carrito.html?pago=aprobado",
      pending: base + "/carrito.html?pago=pendiente",
      failure: base + "/carrito.html?pago=rechazado"
    },
    auto_return: "approved",
    metadata: {
      pedido,
      entrega,
      nombre: texto(comprador.nombre, 80),
      telefono: texto(comprador.telefono, 30)
    }
  };
  const nombre = texto(comprador.nombre, 80);
  if (nombre) preferencia.payer = { name: nombre };

  try {
    const resp = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + token,
        "Content-Type": "application/json",
        "X-Idempotency-Key": pedido
      },
      body: JSON.stringify(preferencia)
    });
    const datos = await resp.json().catch(() => ({}));
    if (!resp.ok || !datos.init_point) {
      console.error("Mercado Pago rechazó la preferencia", resp.status, JSON.stringify(datos).slice(0, 500));
      return res.status(502).json({ error: "Mercado Pago no respondió bien. Probá de nuevo o pedí por WhatsApp." });
    }
    return res.status(200).json({ url: datos.init_point, pedido });
  } catch (err) {
    console.error("Error llamando a Mercado Pago", err);
    return res.status(502).json({ error: "No pudimos conectar con Mercado Pago." });
  }
};
