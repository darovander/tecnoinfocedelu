// Todo el texto y las imágenes del sitio salen de acá.
// Se edita a mano o desde admin.html (que devuelve este mismo archivo listo para reemplazar).

window.CONTENIDO = {
  version: 1,

  negocio: {
    nombre: "TecnoInformática",
    lema: "Reparación de PCs y notebooks a nivel placa",
    descripcion: "Diagnóstico y reparación electrónica de computadoras en Concepción del Uruguay, Entre Ríos.",
    direccion: "12 de Octubre 1180",
    ciudad: "Concepción del Uruguay, Entre Ríos",
    horarios: "Consultá por WhatsApp para coordinar turno.",
    whatsapp: "3442 419123",
    whatsappLink: "https://wa.me/543442419123",
    instagram: "@tecnoinformatica_",
    instagramLink: "https://www.instagram.com/tecnoinformatica_/",
    email: "dariodefazy@gmail.com",
    dominio: "tecnoinformatica-cdu.com.ar",
    logo: "img/logo.png",
    isotipo: "img/isotipo.png",
    mapa: "https://www.google.com/maps/search/?api=1&query=12+de+Octubre+1180+Concepci%C3%B3n+del+Uruguay+Entre+R%C3%ADos"
  },

  // Interruptores de secciones enteras. Poné false y desaparecen del menú y del sitio.
  modulos: {
    tienda: false,
    galeria: true,
    seguimiento: false
  },

  seguimiento: {
    endpoint: "",
    titulo: "Seguí tu reparación",
    texto: "Ingresá el número de orden que figura en tu comprobante y mirá en qué estado está el equipo.",
    placeholder: "Número de orden"
  },

  inicio: {
    tituloPestana: "TecnoInformática | Reparación de notebooks y PCs a nivel placa",
    metaDescripcion: "Taller de reparación electrónica de notebooks y PCs en Concepción del Uruguay. Diagnóstico a nivel componente, no encendido, sin video, fallas de carga, soldadura SMD.",
    hero: {
      etiqueta: "Taller de electrónica aplicada",
      titulo: "Cuando el equipo no enciende, el problema está en la placa.",
      texto: "Reparamos la falla en el circuito: no encendido, sin video, no carga, fuentes y componentes SMD. Diagnóstico con multímetro, fuente de banco, esquemático y boardview antes de tocar nada.",
      botonPrimario: "Consultar por WhatsApp",
      botonSecundario: "Ver servicios",
      imagen: "",
      epigrafeImagen: "Banco de trabajo del taller"
    },
    rotulo: {
      linea1: "Reparación a nivel componente",
      linea2: "Desde 2018",
      linea3: "Lenovo · HP · Dell · Asus · Acer"
    },
    diferenciales: [
      {
        etiqueta: "Diagnóstico",
        titulo: "Se busca la falla, no la pieza",
        texto: "El cambio de módulos completos es el último recurso. Primero se mide, se compara contra el esquemático y se localiza el componente que falló."
      },
      {
        etiqueta: "Equipamiento",
        titulo: "Herramienta de electrónica real",
        texto: "Estación de aire caliente, soldadura SMD, fuente de banco con límite de corriente, microscopio y documentación técnica de cada placa."
      },
      {
        etiqueta: "Presupuesto",
        titulo: "Se avisa antes de reparar",
        texto: "Primero el diagnóstico, después el presupuesto. Si la reparación no conviene, te lo decimos y explicamos por qué."
      }
    ],
    proceso: [
      { titulo: "Ingreso", texto: "Se registra el equipo, la falla que contás y el estado en que llega." },
      { titulo: "Diagnóstico", texto: "Inspección, mediciones y comparación contra la documentación de la placa." },
      { titulo: "Presupuesto", texto: "Te pasamos qué tiene, qué se puede hacer y cuánto sale. Vos decidís." },
      { titulo: "Reparación", texto: "Trabajo sobre la placa o sobre el componente puntual que falló." },
      { titulo: "Prueba y entrega", texto: "El equipo queda en prueba antes de avisarte que está listo." }
    ],
    marcas: ["Lenovo", "HP", "Dell", "Asus", "Acer", "Samsung", "Toshiba", "Bangho"],
    cierre: {
      titulo: "Contanos qué le pasa al equipo",
      texto: "Escribinos por WhatsApp con la marca, el modelo y qué hace cuando lo prendés. Con eso ya te podemos orientar.",
      boton: "Escribir por WhatsApp"
    }
  },

  servicios: {
    tituloPestana: "Servicios | TecnoInformática",
    metaDescripcion: "Reparación a nivel placa, cambio de pantallas, mantenimiento preventivo, actualización de hardware, formateo y venta de repuestos en Concepción del Uruguay.",
    titulo: "Servicios",
    intro: "Trabajamos sobre notebooks y PCs de escritorio. Lo que sigue es lo que hacemos todos los días en el taller.",
    items: [
      {
        etiqueta: "Placa",
        titulo: "Reparación a nivel componente",
        texto: "Equipos que no encienden, que encienden y no dan video, que se apagan solos o que no cargan. Se trabaja sobre la placa madre: cortocircuitos, componentes SMD, integrados de carga, secciones de alimentación.",
        detalle: ["No enciende", "Sin video", "No carga o no reconoce el cargador", "Apagados aleatorios", "Cortocircuitos y consumo elevado"]
      },
      {
        etiqueta: "Placa",
        titulo: "Fuentes y alimentación",
        texto: "Reparación de fuentes de PC de escritorio y de las secciones de alimentación de notebooks, incluyendo daños por tormenta eléctrica o por cargador genérico.",
        detalle: ["Fuentes ATX", "Sección de carga de notebook", "Daño por sobretensión"]
      },
      {
        etiqueta: "Pantalla",
        titulo: "Cambio de pantallas",
        texto: "Pantallas rotas, con manchas, con líneas o que quedaron sin imagen. Se verifica primero si el problema es el panel, el cable flex o la placa.",
        detalle: ["Paneles LED y IPS", "Cable flex y bisagras", "Táctiles"]
      },
      {
        etiqueta: "Mantenimiento",
        titulo: "Mantenimiento preventivo",
        texto: "Limpieza interna, cambio de pasta térmica y revisión del sistema de refrigeración. Es lo que evita que un equipo que se calienta termine con una falla en la placa.",
        detalle: ["Limpieza de disipador y ventilador", "Cambio de pasta térmica", "Control de temperaturas"]
      },
      {
        etiqueta: "Hardware",
        titulo: "Actualización de hardware",
        texto: "Ampliación de memoria, pasaje a disco sólido y armado de equipos. Te decimos qué mejora se nota de verdad en tu equipo y cuál no vale la pena.",
        detalle: ["Memoria RAM", "Discos SSD y NVMe", "Armado de PC a medida"]
      },
      {
        etiqueta: "Software",
        titulo: "Formateo e instalación",
        texto: "Instalación de sistema operativo, drivers y programas de trabajo, con respaldo previo de tus archivos.",
        detalle: ["Windows y Linux", "Respaldo de datos", "Drivers y programas de trabajo"]
      },
      {
        etiqueta: "Repuestos",
        titulo: "Venta de repuestos",
        texto: "Cargadores, baterías, teclados, pantallas, discos, memorias y componentes electrónicos. Consultá disponibilidad por WhatsApp.",
        detalle: ["Cargadores y baterías", "Teclados y bisagras", "Discos y memorias"]
      }
    ],
    aviso: {
      titulo: "¿No sabés qué necesita tu equipo?",
      texto: "No hace falta que lo sepas. Contanos el síntoma y nosotros lo diagnosticamos."
    }
  },

  taller: {
    tituloPestana: "El taller | TecnoInformática",
    metaDescripcion: "TecnoInformática es un taller de reparación electrónica a nivel componente en Concepción del Uruguay, con experiencia en notebooks Lenovo, HP, Dell, Asus y Acer.",
    titulo: "El taller",
    intro: "TecnoInformática es un taller de electrónica, no un lugar donde se cambian piezas hasta que algo funciona.",
    bloques: [
      {
        titulo: "Qué significa reparar a nivel placa",
        texto: "La mayoría de los equipos que llegan con un cartel de irreparables tienen una falla puntual en un componente de pocos milímetros. Localizarla requiere medir, entender el circuito y tener la documentación de esa placa. Eso es lo que hacemos: reparamos la placa en lugar de reemplazarla."
      },
      {
        titulo: "Experiencia",
        texto: "Desde 2018 trabajando sobre placas de notebooks y PCs de escritorio. Lenovo, HP, Dell, Asus y Acer son las marcas que más pasan por el banco, con sus fallas típicas ya conocidas."
      },
      {
        titulo: "Docencia",
        texto: "Además del taller, damos formación en reparación de PC. Enseñar obliga a entender cada circuito en detalle, y eso vuelve al banco de trabajo todos los días."
      }
    ],
    galeria: [
      { imagen: "", epigrafe: "Reparación bajo microscopio" },
      { imagen: "", epigrafe: "Medición sobre placa madre" },
      { imagen: "", epigrafe: "Trabajo de soldadura SMD" }
    ]
  },

  tienda: {
    tituloPestana: "Tienda | TecnoInformática",
    metaDescripcion: "Repuestos y accesorios para notebooks y PCs en Concepción del Uruguay.",
    titulo: "Tienda",
    intro: "Repuestos y accesorios disponibles en el taller. La compra se coordina por WhatsApp.",
    moneda: "$",
    productos: [
      {
        nombre: "Ejemplo: cargador universal 90W",
        precio: "",
        texto: "Borrá este producto desde admin.html y cargá los tuyos.",
        imagen: "",
        estado: "Consultar"
      }
    ],
    aviso: "Los precios pueden variar. Confirmá disponibilidad antes de acercarte."
  },

  contacto: {
    tituloPestana: "Contacto | TecnoInformática",
    metaDescripcion: "Contacto de TecnoInformática: 12 de Octubre 1180, Concepción del Uruguay. WhatsApp 3442 419123.",
    titulo: "Contacto",
    intro: "La forma más rápida de resolverlo es por WhatsApp: contanos marca, modelo y qué hace el equipo cuando lo prendés.",
    preguntas: [
      {
        pregunta: "¿El diagnóstico tiene costo?",
        respuesta: "Consultanos por WhatsApp según el tipo de equipo y la falla. Antes de reparar siempre te pasamos el presupuesto."
      },
      {
        pregunta: "¿Cuánto tarda una reparación?",
        respuesta: "Depende de la falla y de la disponibilidad del componente. Cuando te pasamos el presupuesto te damos también un plazo estimado."
      },
      {
        pregunta: "¿Reparan equipos que ya vieron en otro lado?",
        respuesta: "Sí. Contanos qué le hicieron antes, ayuda bastante para el diagnóstico."
      },
      {
        pregunta: "¿Trabajan con equipos de otras ciudades?",
        respuesta: "Sí, recibimos equipos de la zona. Coordinamos el envío o la entrega por WhatsApp."
      }
    ]
  }
};
