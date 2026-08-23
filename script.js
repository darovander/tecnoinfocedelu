const WA = "543442419123";
const menuBtn = document.getElementById("menuToggle");
const nav = document.getElementById("nav");
if (menuBtn && nav) {
  menuBtn.addEventListener("click", () => nav.classList.toggle("open"));
  nav.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => nav.classList.remove("open")));
}

function openWA(text) {
  window.open(`https://wa.me/${WA}?text=${encodeURIComponent(text)}`, "_blank", "noopener");
}

const budget = document.getElementById("budgetForm");
if (budget) {
  budget.addEventListener("submit", (e) => {
    e.preventDefault();
    const d = new FormData(budget);
    let msg = `Hola, quiero consultar sobre una reparación.\n\n*Nombre:* ${d.get("nombre")}\n*Teléfono:* ${d.get("telefono")}\n*Tipo de equipo:* ${d.get("tipo")}\n`;
    if (d.get("marca")) msg += `*Marca/modelo:* ${d.get("marca")}\n`;
    msg += `*Problema:* ${d.get("problema")}`;
    openWA(msg);
  });
}

const contact = document.getElementById("contactForm");
if (contact) {
  contact.addEventListener("submit", (e) => {
    e.preventDefault();
    const d = new FormData(contact);
    openWA(`Hola, mensaje desde la web.\n\n*Nombre:* ${d.get("nombre")}\n*Teléfono:* ${d.get("telefono")}\n*Mensaje:* ${d.get("mensaje")}`);
  });
}
