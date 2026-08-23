import { useState, type FormEvent, type ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Cpu,
  HardDrive,
  Laptop,
  Monitor,
  Package,
  ScanLine,
  Sparkles,
  Wrench,
  X,
} from "lucide-react";
import { getPublicSite } from "@/lib/site";
import type { GalleryItem, SiteContent } from "@/lib/site-types";
import { waDisplay, waLink } from "@/lib/site-defaults";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { WaFloat } from "@/components/wa-float";
import { AdminGear } from "@/components/admin-gear";

export const Route = createFileRoute("/")({
  loader: () => getPublicSite(),
  component: Home,
});

const serviceIcons = [Laptop, Monitor, ScanLine, Monitor, HardDrive, Cpu, Package, Sparkles];

function Home() {
  const site = Route.useLoaderData();
  return (
    <div className="min-h-screen bg-bg text-fg">
      <SiteHeader site={site} />
      <main>
        <Hero site={site} />
        <Services site={site} />
        <About site={site} />
        <Gallery site={site} />
        <Budget site={site} />
        <Contact site={site} />
      </main>
      <SiteFooter site={site} />
      <WaFloat phone={site.whatsapp} />
      <AdminGear />
    </div>
  );
}

function Hero({ site }: { site: SiteContent }) {
  return (
    <section id="inicio" className="flex min-h-[100svh] items-center bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(59,158,255,0.14),transparent)] pb-16 pt-28">
      <div className="mx-auto w-[min(1120px,92%)] max-w-3xl">
        <div className="mb-5 inline-block rounded-full bg-accent/15 px-3 py-1 text-xs font-medium text-accent">
          {site.heroBadge}
        </div>
        <h1 className="mb-5 text-4xl font-bold tracking-tight md:text-5xl">
          {site.heroTitle} <span className="text-accent">{site.heroAccent}</span>
        </h1>
        <p className="mb-8 max-w-xl text-lg text-muted">{site.heroSub}</p>
        <div className="mb-12 flex flex-wrap gap-3">
          <a href={waLink(site.whatsapp)} target="_blank" rel="noopener noreferrer">
            <Button type="button">{site.ctaWhatsapp}</Button>
          </a>
          <a href="#presupuesto">
            <Button type="button" variant="outline">
              {site.ctaBudget}
            </Button>
          </a>
        </div>
        <div className="flex flex-wrap gap-8 border-t border-border pt-8">
          <Stat k="Nivel placa" v="Diagnóstico real" />
          <Stat k="Marcas" v="Lenovo · HP · Dell · Asus · Acer" />
          <Stat k="Local" v={site.address} />
        </div>
      </div>
    </section>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <strong className="block text-sm">{k}</strong>
      <span className="text-sm text-muted">{v}</span>
    </div>
  );
}

function Services({ site }: { site: SiteContent }) {
  return (
    <section id="servicios" className="py-20">
      <div className="mx-auto w-[min(1120px,92%)]">
        <header className="mx-auto mb-12 max-w-xl text-center">
          <h2 className="mb-3 text-3xl font-bold tracking-tight">{site.servicesTitle}</h2>
          <p className="text-muted">{site.servicesSub}</p>
        </header>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {site.services.map((s, i) => {
            const Icon = serviceIcons[i % serviceIcons.length];
            return (
              <article key={s.id} className="rounded-lg border border-border bg-elevated p-6 transition-colors hover:border-accent/40">
                <Icon className="mb-3 size-6 text-accent" />
                <h3 className="mb-2 font-semibold">{s.title}</h3>
                <p className="text-sm text-muted">{s.body}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function About({ site }: { site: SiteContent }) {
  return (
    <section id="nosotros" className="bg-surface py-20">
      <div className="mx-auto grid w-[min(1120px,92%)] gap-12 md:grid-cols-[1.4fr_1fr]">
        <div>
          <h2 className="mb-4 text-3xl font-bold tracking-tight">{site.aboutTitle}</h2>
          <p className="mb-4 text-lg">{site.aboutLead}</p>
          <p className="mb-4 text-muted">{site.aboutBody}</p>
          <p className="mb-6 text-muted">{site.aboutBody2}</p>
          <ul className="space-y-2 text-muted">
            {site.aboutPoints.map((p) => (
              <li key={p} className="flex gap-2">
                <span className="text-accent">✓</span>
                {p}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-border bg-elevated p-8">
          <h3 className="mb-3 text-xl font-semibold">{site.aboutCardTitle}</h3>
          <p className="mb-6 text-muted">{site.aboutCardBody}</p>
          <a href="#presupuesto">
            <Button type="button">{site.ctaBudget}</Button>
          </a>
        </div>
      </div>
    </section>
  );
}

function Gallery({ site }: { site: SiteContent }) {
  const [open, setOpen] = useState<GalleryItem | null>(null);
  return (
    <section id="trabajos" className="py-20">
      <div className="mx-auto w-[min(1120px,92%)]">
        <header className="mx-auto mb-12 max-w-xl text-center">
          <h2 className="mb-3 text-3xl font-bold tracking-tight">{site.galleryTitle}</h2>
          <p className="text-muted">{site.gallerySub}</p>
        </header>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {site.gallery.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setOpen(item)}
              className="overflow-hidden rounded-lg border border-border bg-elevated text-left transition-transform hover:-translate-y-0.5"
            >
              {item.image ? (
                <img src={item.image} alt={item.title} className="aspect-[4/3] w-full object-cover" />
              ) : (
                <div className="flex aspect-[4/3] items-center justify-center bg-surface">
                  <Wrench className="size-10 text-subtle" />
                </div>
              )}
              <div className="border-t border-border px-4 py-3 text-sm font-medium">{item.caption}</div>
            </button>
          ))}
        </div>
      </div>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-6" onClick={() => setOpen(null)}>
          <button type="button" className="absolute right-5 top-5 text-3xl text-fg" aria-label="Cerrar">
            <X />
          </button>
          <div className="max-w-lg text-center" onClick={(e) => e.stopPropagation()}>
            {open.image ? (
              <img src={open.image} alt={open.title} className="mb-4 w-full rounded-lg object-cover" />
            ) : (
              <div className="mb-4 flex aspect-[4/3] items-center justify-center rounded-lg bg-elevated">
                <Wrench className="size-12 text-subtle" />
              </div>
            )}
            <h3 className="mb-2 text-lg font-semibold">{open.title}</h3>
            <p className="text-sm text-muted">{open.desc}</p>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function Budget({ site }: { site: SiteContent }) {
  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const nombre = String(fd.get("nombre") || "").trim();
    const telefono = String(fd.get("telefono") || "").trim();
    const tipo = String(fd.get("tipo") || "");
    const marca = String(fd.get("marca") || "").trim();
    const problema = String(fd.get("problema") || "").trim();
    let msg = `Hola, quiero consultar sobre una reparación.\n\n*Nombre:* ${nombre}\n*Teléfono:* ${telefono}\n*Tipo de equipo:* ${tipo}\n`;
    if (marca) msg += `*Marca/modelo:* ${marca}\n`;
    msg += `*Problema:* ${problema}`;
    window.open(waLink(site.whatsapp, msg), "_blank", "noopener");
  }

  return (
    <section id="presupuesto" className="bg-surface py-20">
      <div className="mx-auto w-[min(1120px,92%)]">
        <header className="mx-auto mb-10 max-w-xl text-center">
          <h2 className="mb-3 text-3xl font-bold tracking-tight">{site.budgetTitle}</h2>
          <p className="text-muted">{site.budgetSub}</p>
        </header>
        <form onSubmit={onSubmit} className="mx-auto max-w-xl space-y-4 rounded-lg border border-border bg-elevated p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="nombre">Nombre *</Label>
              <Input id="nombre" name="nombre" required />
            </div>
            <div>
              <Label htmlFor="telefono">Teléfono / WhatsApp *</Label>
              <Input id="telefono" name="telefono" required />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="tipo">Tipo de equipo *</Label>
              <select
                id="tipo"
                name="tipo"
                required
                className="flex h-11 w-full rounded-sm border border-border bg-bg px-3 text-sm outline-none focus:border-accent"
              >
                <option value="">Seleccioná</option>
                <option>Notebook</option>
                <option>PC de escritorio</option>
                <option>Otro</option>
              </select>
            </div>
            <div>
              <Label htmlFor="marca">Marca y modelo</Label>
              <Input id="marca" name="marca" placeholder="Ej: Lenovo IdeaPad 3" />
            </div>
          </div>
          <div>
            <Label htmlFor="problema">Descripción del problema *</Label>
            <Textarea id="problema" name="problema" required placeholder="Contanos qué le pasa el equipo" />
          </div>
          <Button type="submit" className="w-full">
            Enviar por WhatsApp
          </Button>
        </form>
      </div>
    </section>
  );
}

function Contact({ site }: { site: SiteContent }) {
  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const msg = `Hola, mensaje desde la web.\n\n*Nombre:* ${String(fd.get("nombre") || "")}\n*Teléfono:* ${String(fd.get("telefono") || "")}\n*Mensaje:* ${String(fd.get("mensaje") || "")}`;
    window.open(waLink(site.whatsapp, msg), "_blank", "noopener");
  }
  const maps = `https://www.google.com/maps?q=${encodeURIComponent(`${site.address}, ${site.city}`)}&output=embed`;

  return (
    <section id="contacto" className="py-20">
      <div className="mx-auto w-[min(1120px,92%)]">
        <header className="mx-auto mb-10 max-w-xl text-center">
          <h2 className="mb-3 text-3xl font-bold tracking-tight">{site.contactTitle}</h2>
          <p className="text-muted">{site.contactSub}</p>
        </header>
        <div className="grid gap-10 md:grid-cols-2">
          <div>
            <Info k={site.addressLabel} v={`${site.address}\n${site.city}`} />
            <Info k="WhatsApp">
              <a className="text-accent" href={waLink(site.whatsapp)} target="_blank" rel="noopener noreferrer">
                {waDisplay(site.whatsapp)}
              </a>
            </Info>
            <Info k="Instagram">
              <a className="text-accent" href={`https://www.instagram.com/${site.instagram}/`} target="_blank" rel="noopener noreferrer">
                @{site.instagram}
              </a>
            </Info>
            <Info k="Horarios" v={site.hours} />
            <div className="mt-6 overflow-hidden rounded-lg border border-border">
              <iframe title="Ubicación" src={maps} width="100%" height="260" style={{ border: 0 }} loading="lazy" />
            </div>
          </div>
          <form onSubmit={onSubmit} className="space-y-4 rounded-lg border border-border bg-elevated p-6">
            <h3 className="font-semibold">Mensaje general</h3>
            <div>
              <Label htmlFor="c-nombre">Nombre *</Label>
              <Input id="c-nombre" name="nombre" required />
            </div>
            <div>
              <Label htmlFor="c-telefono">Teléfono *</Label>
              <Input id="c-telefono" name="telefono" required />
            </div>
            <div>
              <Label htmlFor="c-mensaje">Mensaje *</Label>
              <Textarea id="c-mensaje" name="mensaje" required />
            </div>
            <Button type="submit" className="w-full">
              Enviar por WhatsApp
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
}

function Info({ k, v, children }: { k: string; v?: string; children?: ReactNode }) {
  return (
    <div className="mb-5">
      <strong className="mb-1 block text-xs uppercase tracking-wide text-muted">{k}</strong>
      {children ?? <p className="whitespace-pre-line">{v}</p>}
    </div>
  );
}
