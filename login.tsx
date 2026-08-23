import { useState, type FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { GROK_PROVIDERS, authClient, authEnabled, signIn } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onEmail(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (mode === "up") {
        const res = await authClient.signUp.email({ email, password, name: name || "Admin" });
        if (res.error) throw new Error(res.error.message || "No se pudo crear la cuenta");
      } else {
        const res = await authClient.signIn.email({ email, password });
        if (res.error) throw new Error(res.error.message || "Email o clave incorrectos");
      }
      window.location.href = "/admin";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al entrar");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-bg p-6 text-fg">
      <div className="w-full max-w-sm space-y-5 rounded-xl border border-border bg-elevated p-6">
        <img src="/logo.png" alt="TecnoInformática" className="h-10 w-auto" />
        <div>
          <h1 className="text-xl font-semibold">Panel de edición</h1>
          <p className="text-sm text-muted">Solo vos podés entrar. Usá tu email y clave, o Google / X.</p>
        </div>
        {authEnabled ? (
          <>
            <form onSubmit={onEmail} className="space-y-3">
              {mode === "up" ? (
                <div>
                  <Label htmlFor="name">Nombre</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
              ) : null}
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="password">Clave</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {error ? <p className="text-sm text-red-400">{error}</p> : null}
              <Button type="submit" className="w-full" disabled={busy}>
                {busy ? "Entrando…" : mode === "up" ? "Crear cuenta" : "Entrar"}
              </Button>
            </form>
            <button
              type="button"
              className="w-full text-sm text-muted underline"
              onClick={() => setMode(mode === "in" ? "up" : "in")}
            >
              {mode === "in" ? "Primera vez: crear cuenta" : "Ya tengo cuenta"}
            </button>
            <div className="space-y-2 border-t border-border pt-4">
              {GROK_PROVIDERS.map((p) => (
                <Button
                  key={p.providerId}
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => signIn(p.providerId, { callbackURL: "/admin" })}
                >
                  Continuar con {p.label}
                </Button>
              ))}
            </div>
          </>
        ) : (
          <p className="text-sm text-muted">El acceso está desactivado.</p>
        )}
        <Link to="/" className="block text-center text-sm text-muted hover:text-fg">
          Volver al sitio
        </Link>
      </div>
    </main>
  );
}
