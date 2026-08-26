# Cómo subir esto a GitHub

## Archivos nuevos o modificados

| Archivo | Qué hacer |
|---|---|
| `content.json` | **Nuevo** — subir a la raíz del repo |
| `content-loader.js` | **Nuevo** — subir a la raíz del repo |
| `admin.html` | **Nuevo** — subir a la raíz del repo (así queda en `tudominio.com.ar/admin.html`) |
| `index.html` | **Reemplazar** el archivo actual completo por este |
| `script.js` | **Reemplazar** el archivo actual completo por este (solo cambió `const WA` por `var WA`) |
| `agregar-al-final-de-styles.css` | **NO reemplazar** `styles.css`. Abrí tu `styles.css` en GitHub, andá al final del archivo y pegá el contenido de este bloque ahí abajo. |

## Primera vez que usás el panel de admin

1. Entrá a `tudominio.com.ar/admin.html` (después de subir los archivos y que Vercel termine el deploy).
2. Ya vas a ver todos los textos actuales cargados de fábrica (colores, servicios, "nosotros", trabajos, contacto, footer).
3. Editá lo que quieras. Para las imágenes de cada servicio o trabajo, hacé clic en "Imagen" y elegí el archivo — vas a ver la vista previa al toque.
4. Tocá **"Descargar ZIP"**. Se descarga `tecnoinformatica-contenido.zip`.
5. Descomprimilo. Vas a tener:
   - `content.json` → subilo a GitHub reemplazando el que ya está en la raíz.
   - carpetas `servicios/` y `trabajos/` (solo si agregaste imágenes nuevas) → subilas también a la raíz del repo, tal cual.
6. Esperá que Vercel termine de desplegar y hacé `Ctrl+Shift+R` en el sitio para ver los cambios.

## Próximas veces

Antes de editar, en `admin.html` usá el botón **"Cargar content.json existente"** y seleccioná el `content.json` que ya está en tu repo (lo bajás de GitHub primero). Así seguís editando desde el último estado, no desde cero.

## Nota sobre colores

Los colores se aplican en vivo con JavaScript apenas carga la página, así que no hace falta tocar `styles.css` para cambiarlos — todo pasa por `content.json`.
