import { useState, type FormEvent, type ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { RedirectToSignIn, UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { getPublicSite, saveSite } from "@/lib/site";
import type { GalleryItem, ServiceItem, SiteContent } from "@/lib/site-types";
import { compressImage } from "@/lib/compress-image";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/admin")({
  loader: () => getPublicSite(),
  component: AdminPage,
});

function AdminPage() {
  const { user, isPending } = useCurrentUserState();
  if (isPending) {
    return <div className="grid min-h-screen place-items-center bg-bg text-muted">Cargando…</div>;
  }
  if (!user) return <RedirectToSignIn />;
  return <AdminEditor />;
}

function AdminEditor() {
  const initial = Route.useLoaderData();
  const [site, setSite] = useState<SiteContent>(initial);
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);

  function set<K extends keyof SiteContent>(key: K, value: SiteContent[K]) {
    setSite((s) => ({ ...s, [key]: value }));
  }

  async function onSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setStatus("");
    try {
      await saveSite({ data: site });
      setStatus("Cambios guardados. Ya se ven en el sitio.");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-bg text-fg">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-surface px-4 py-3">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="" className="h-8 w-auto" />
          <strong>Editar sitio</strong>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/" className="text-sm text-muted hover:text-fg">
            Ver web
          </Link>
          <UserButton />
        </div>
      </header>
      <form onSubmit={onSave} className="mx-auto w-[min(860px,94%)] space-y-10 py-10">
        <p className="text-sm text-muted">
          Todo lo que cambies acá se publica en la web. La primera cuenta que guarde queda como dueña del panel.
        </p>

        <Section title="Inicio">
          <Field label="Franja superior" value={site.heroBadge} onChange={(v) => set("heroBadge", v)} />
          <Field label="Título" value={site.heroTitle} onChange={(v) => set("heroTitle", v)} />
          <Field label="Palabra destacada" value={site.heroAccent} onChange={(v) => set("heroAccent", v)} />
          <Field label="Texto debajo del título" value={site.heroSub} onChange={(v) => set("heroSub", v)} area />
          <Field label="Botón WhatsApp" value={site.ctaWhatsapp} onChange={(v) => set("ctaWhatsapp", v)} />
          <Field label="Botón presupuesto" value={site.ctaBudget} onChange={(v) => set("ctaBudget", v)} />
        </Section>

        <Section title="Servicios">
          <Field label="Título" value={site.servicesTitle} onChange={(v) => set("servicesTitle", v)} />
          <Field label="Subtítulo" value={site.servicesSub} onChange={(v) => set("servicesSub", v)} />
          {site.services.map((svc, i) => (
            <div key={svc.id} className="rounded-md border border-border p-4">
              <div className="mb-2 flex justify-between">
                <span className="text-sm text-muted">Servicio {i + 1}</span>
                <button
                  type="button"
                  className="text-muted hover:text-fg"
                  onClick={() => set("services", site.services.filter((s) => s.id !== svc.id))}
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
              <Field label="Nombre" value={svc.title} onChange={(v) => patchService(site, set, svc.id, { title: v })} />
              <Field label="Descripción" value={svc.body} onChange={(v) => patchService(site, set, svc.id, { body: v })} area />
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              set("services", [
                ...site.services,
                { id: crypto.randomUUID(), title: "Nuevo servicio", body: "Descripción" },
              ])
            }
          >
            <Plus className="size-4" /> Agregar servicio
          </Button>
        </Section>

        <Section title="Nosotros">
          <Field label="Título" value={site.aboutTitle} onChange={(v) => set("aboutTitle", v)} />
          <Field label="Párrafo destacado" value={site.aboutLead} onChange={(v) => set("aboutLead", v)} area />
          <Field label="Párrafo 2" value={site.aboutBody} onChange={(v) => set("aboutBody", v)} area />
          <Field label="Párrafo 3" value={site.aboutBody2} onChange={(v) => set("aboutBody2", v)} area />
          <Field
            label="Lista (un ítem por línea)"
            value={site.aboutPoints.join("\n")}
            onChange={(v) => set("aboutPoints", v.split("\n").filter(Boolean))}
            area
          />
          <Field label="Tarjeta título" value={site.aboutCardTitle} onChange={(v) => set("aboutCardTitle", v)} />
          <Field label="Tarjeta texto" value={site.aboutCardBody} onChange={(v) => set("aboutCardBody", v)} area />
        </Section>

        <Section title="Trabajos / fotos">
          <Field label="Título" value={site.galleryTitle} onChange={(v) => set("galleryTitle", v)} />
          <Field label="Subtítulo" value={site.gallerySub} onChange={(v) => set("gallerySub", v)} />
          {site.gallery.map((item) => (
            <GalleryEditor
              key={item.id}
              item={item}
              onChange={(patch) =>
                set(
                  "gallery",
                  site.gallery.map((g) => (g.id === item.id ? { ...g, ...patch } : g)),
                )
              }
              onRemove={() => set("gallery", site.gallery.filter((g) => g.id !== item.id))}
            />
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              set("gallery", [
                ...site.gallery,
                { id: crypto.randomUUID(), title: "Nuevo trabajo", caption: "Título corto", desc: "", image: "" },
              ])
            }
          >
            <Plus className="size-4" /> Agregar trabajo
          </Button>
        </Section>

        <Section title="Contacto">
          <Field label="Título presupuesto" value={site.budgetTitle} onChange={(v) => set("budgetTitle", v)} />
          <Field label="Texto presupuesto" value={site.budgetSub} onChange={(v) => set("budgetSub", v)} />
          <Field label="Título contacto" value={site.contactTitle} onChange={(v) => set("contactTitle", v)} />
          <Field label="Texto contacto" value={site.contactSub} onChange={(v) => set("contactSub", v)} />
          <Field label="Dirección" value={site.address} onChange={(v) => set("address", v)} />
          <Field label="Ciudad" value={site.city} onChange={(v) => set("city", v)} />
          <Field label="WhatsApp (solo números, con 54)" value={site.whatsapp} onChange={(v) => set("whatsapp", v)} />
          <Field label="Instagram (sin @)" value={site.instagram} onChange={(v) => set("instagram", v)} />
          <Field label="Horarios" value={site.hours} onChange={(v) => set("hours", v)} area />
          <Field label="Texto pie de página" value={site.footerTag} onChange={(v) => set("footerTag", v)} />
        </Section>

        <div className="sticky bottom-4 flex items-center gap-4 rounded-lg border border-border bg-surface/95 p-4 backdrop-blur">
          <Button type="submit" disabled={saving}>
            {saving ? "Guardando…" : "Guardar cambios"}
          </Button>
          {status ? <p className="text-sm text-muted">{status}</p> : null}
        </div>
      </form>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-4 rounded-xl border border-border bg-elevated p-5">
      <h2 className="text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  area,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  area?: boolean;
}) {
  return (
    <div>
      <Label>{label}</Label>
      {area ? (
        <Textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3} />
      ) : (
        <Input value={value} onChange={(e) => onChange(e.target.value)} />
      )}
    </div>
  );
}

function patchService(
  site: SiteContent,
  set: <K extends keyof SiteContent>(key: K, value: SiteContent[K]) => void,
  id: string,
  patch: Partial<ServiceItem>,
) {
  set(
    "services",
    site.services.map((s) => (s.id === id ? { ...s, ...patch } : s)),
  );
}

function GalleryEditor({
  item,
  onChange,
  onRemove,
}: {
  item: GalleryItem;
  onChange: (patch: Partial<GalleryItem>) => void;
  onRemove: () => void;
}) {
  const [err, setErr] = useState("");
  async function onFile(file?: File) {
    if (!file) return;
    setErr("");
    try {
      const image = await compressImage(file);
      onChange({ image });
    } catch {
      setErr("No se pudo leer la foto. Probá con JPG o PNG.");
    }
  }
  return (
    <div className="rounded-md border border-border p-4">
      <div className="mb-3 flex justify-between">
        <span className="text-sm text-muted">Trabajo</span>
        <button type="button" onClick={onRemove} className="text-muted hover:text-fg">
          <Trash2 className="size-4" />
        </button>
      </div>
      {item.image ? <img src={item.image} alt="" className="mb-3 h-32 w-full rounded-sm object-cover" /> : null}
      <Label>Foto</Label>
      <Input type="file" accept="image/*" onChange={(e) => onFile(e.target.files?.[0])} />
      {err ? <p className="mt-1 text-xs text-red-400">{err}</p> : null}
      <div className="mt-3 space-y-3">
        <Field label="Título" value={item.title} onChange={(v) => onChange({ title: v })} />
        <Field label="Leyenda" value={item.caption} onChange={(v) => onChange({ caption: v })} />
        <Field label="Descripción" value={item.desc} onChange={(v) => onChange({ desc: v })} area />
      </div>
    </div>
  );
}
