# tecnoinformatica-cdu.com.ar

Sitio estático de TecnoInformática. HTML, CSS y JavaScript puro, sin build ni dependencias.

## Estructura

```
index.html        portada
servicios.html    catálogo de servicios
taller.html       quiénes somos y galería
tienda.html       repuestos (se puede desactivar)
contacto.html     datos, preguntas frecuentes
admin.html        editor de contenido, no se indexa
js/contenido.js   todo el texto y las fotos del sitio
js/sitio.js       arma las páginas a partir del contenido
js/admin.js       el editor
css/estilos.css
img/logo.png      logo horizontal, va en la cabecera y el pie
img/isotipo.png   logo cuadrado, se usa como icono y en redes
img/              el resto de las fotos
```

## Paleta

Negro #05080D de fondo, azul #29A9FF y naranja #FE9536, los dos del logo. El naranja
manda en los botones y en lo que hay que tocar; el azul en etiquetas, títulos chicos y
datos. Si algún día cambiás el logo, los tres colores están arriba de todo en
`css/estilos.css`, en el bloque `:root`.

## Cómo se edita

Abrí `admin.html` (doble clic en la carpeta, o `https://tecnoinformatica-cdu.com.ar/admin.html`).
Cambiás lo que quieras, mirás cómo queda con **Ver vista previa**, y al final tocás
**Descargar contenido.js**. Ese archivo reemplaza a `js/contenido.js` en el repositorio.
Al subirlo a GitHub, Vercel publica los cambios en menos de un minuto.

Lo que escribís en el editor queda guardado en el navegador hasta que lo descargues,
así que podés cerrar y seguir después. El botón **Importar archivo** sirve para retomar
la edición desde un `contenido.js` que ya está publicado.

## Secciones que se prenden y apagan

En la pestaña Negocio del editor:

- **Tienda**: publica `tienda.html` y la agrega al menú. Viene apagada.
- **Galería del taller**: fotos en la página El taller.
- **Consulta de estado**: buscador de órdenes. Necesita el endpoint.

## Fotos

Dos caminos. Subirlas desde el editor (quedan adentro de `contenido.js`, cómodo pero
engorda el archivo) o copiarlas en `img/` y escribir la ruta, por ejemplo `img/banco.jpg`.
Para muchas fotos, el segundo.

## Consulta de estado de reparación

En Contacto → Consulta de estado, cargá la URL de tu endpoint usando `{orden}` donde va
el número, por ejemplo `https://api.tecnoinformatica-cdu.com.ar/orden/{orden}`.
El sitio espera un JSON con un campo `estado`. El endpoint tiene que responder con CORS
habilitado para el dominio.

## Publicar

1. Repositorio en GitHub con estos archivos en la raíz.
2. En Vercel, importar el repositorio. No hay build: framework `Other`, output directory la raíz.
3. En Vercel, agregar el dominio `tecnoinformatica-cdu.com.ar` y `www`.
4. En Cloudflare, apuntar el registro al destino que indica Vercel. Si Cloudflare tiene el
   proxy naranja activado, el SSL tiene que estar en modo **Full (strict)**; si no, se
   arma un rulo de redirecciones.
5. El dominio de NIC.ar tiene que tener los nameservers de Cloudflare.

Después de cada `git push`, Vercel despliega solo.

## Pendiente

El editor no tiene contraseña: cualquiera que entre a `/admin.html` puede cambiar el
contenido en su navegador, aunque no puede publicar nada porque para eso hace falta
subir el archivo al repositorio. Si más adelante querés cerrarlo, lo más simple es
proteger la ruta desde Cloudflare Access.
