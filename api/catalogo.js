// GET /api/catalogo -> { mercadoPago: bool, productos: [...] }
const { leerCatalogo } = require("./_catalogo");

module.exports = async (req, res) => {
  try {
    const productos = await leerCatalogo();
    // la CDN de Vercel lo guarda 1 minuto; un cambio en la planilla tarda eso en verse
    res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
    res.status(200).json({
      mercadoPago: Boolean(process.env.MP_ACCESS_TOKEN),
      productos
    });
  } catch (err) {
    res.setHeader("Cache-Control", "no-store");
    res.status(503).json({ error: err.message });
  }
};
