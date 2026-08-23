# Cómo editar tu sitio (TecnoInformática)

Ahora el sitio tiene un **panel de edición** (`admin.html`) donde vos cambiás
textos y subís fotos sin tocar código. Cuando terminás, descargás un ZIP y lo
subís a GitHub. Vercel se encarga solo de actualizar la web.

## Qué cambió respecto de antes

- Los textos del sitio (hero, servicios, nosotros, trabajos, contacto,
  WhatsApp) ahora **no están escritos directamente en el HTML**. Viven en un
  archivo `content.json`, y un script (`content-loader.js`) los vuelca en la
  página cuando alguien la abre.
- `admin.html` es un editor visual de ese `content.json`. Es una página más
  del sitio (nadie la va a encontrar por casualidad porque no está linkeada
  desde ningún lado, pero igual quedará accesible en
  `tecnoinformatica-cdu.com.ar/admin.html`).
- `script.js` ahora toma el número de WhatsApp desde `content.json` en vez de
  tenerlo fijo en el código.

## Paso 1 — Subí estos archivos a GitHub (una sola vez)

Reemplazá en tu repositorio los archivos existentes por estos:

- `index.html`
- `styles.css`
- `script.js`
- `content-loader.js` (nuevo)
- `content.json` (nuevo)
- `admin.html` (nuevo)
- `robots.txt`, `favicon.svg`, `googled6e122652bf8130a.html` (sin cambios)

Con eso subido y Vercel conectado a tu repo, ya te va a andar el sitio igual
que antes, pero ahora editable.

## Paso 2 — Usar el editor

1. Andá a `https://tecnoinformatica-cdu.com.ar/admin.html` (una vez que esté
   desplegado).
2. El editor carga automáticamente el `content.json` actual. Vas a ver un
   cartelito verde arriba a la derecha que dice "Contenido actual cargado ✓".
3. Editá lo que quieras:
   - **Datos de contacto**: WhatsApp, dirección, Instagram, horarios.
   - **Portada**: el título, la bajada y los 3 datos destacados.
   - **Servicios**: podés editar, agregar o borrar tarjetas.
   - **Nosotros**: el texto y la lista de puntos.
   - **Trabajos realizados**: tocá el recuadro de cada trabajo para subir
     una foto desde tu celular o PC, y editá la descripción. También podés
     agregar trabajos nuevos con el botón de abajo.
4. Cuando termines, apretá **"Descargar cambios (ZIP)"**, abajo de todo.
   Se descarga un archivo `cambios-tecnoinformatica.zip`.

## Paso 3 — Subir los cambios a GitHub

1. Descomprimí el ZIP. Vas a encontrar:
   - `content.json` (actualizado)
   - una carpeta `images/` con las fotos nuevas que hayas subido (si subiste
     alguna)
2. Entrá a tu repositorio en GitHub (desde el navegador, no hace falta usar
   la terminal ni Git):
   - Para reemplazar `content.json`: abrí el archivo en GitHub, tocá el
     lápiz (editar), borrá todo, pegá el contenido nuevo (o simplemente
     arrastrá el archivo nuevo sobre la lista de archivos del repo —
     GitHub te va a preguntar si querés reemplazarlo).
   - Para las fotos nuevas: arrastrá los archivos de la carpeta `images/`
     a la carpeta `images/` de tu repo (si no existe, GitHub te deja
     crearla arrastrando los archivos ahí con el nombre `images/miarchivo.jpg`
     en el cuadro de "subir archivos").
3. Confirmá el cambio ("Commit changes").
4. Vercel detecta el push automáticamente y en 1-2 minutos el sitio queda
   actualizado. Listo.

## Cosas para tener en cuenta

- El editor no borra ni sube nada solo: hasta que vos no subís el ZIP a
  GitHub, no cambia nada en la web real. Podés jugar y probar tranquilo.
- Si cerrás `admin.html` sin descargar el ZIP, perdés los cambios que
  hiciste en esa sesión (no se guardan solos). Descargá el ZIP antes de
  cerrar la pestaña.
- Las fotos que subas conviene que no sean gigantes (recomendable menos de
  1-2 MB cada una) para que el sitio cargue rápido. Si tenés fotos muy
  pesadas del celular, cualquier compresor online las achica sin perder
  mucha calidad.
- El menú (Inicio, Servicios, Nosotros, etc.) y el formulario de
  presupuesto siguen funcionando igual que antes, no requieren edición.
- Si algún día querés agregar una sección totalmente nueva (no solo texto o
  fotos dentro de lo que ya existe), ahí sí conviene que me pidas ayuda para
  tocar el HTML directamente.
