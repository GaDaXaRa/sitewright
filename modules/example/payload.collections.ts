// The collections block of a site with every module enabled — the shape the generator
// writes from the blueprint. Labels and routes are the only thing that changes per site.
  // The generator appends each module's collection here, with the labels the blueprint chose.
  collections: [
    Users,
    Media,
    catalogCollection({ labels: { singular: 'Servicio', plural: 'Servicios' }, route: '/servicios' }),
    scheduleCollection({ labels: { singular: 'Fecha', plural: 'Agenda' }, route: '/agenda' }),
    pricingCollection({
      labels: { singular: 'Tarifa', plural: 'Tarifas' },
      route: '/tarifas',
      linkedTo: 'catalog',
    }),
    teamCollection({ labels: { singular: 'Miembro', plural: 'Equipo' }, route: '/equipo' }),
    mediaModuleCollection({ labels: { singular: 'Pieza', plural: 'Medios' }, route: '/medios' }),
    reviewsCollection({ labels: { singular: 'Opinión', plural: 'Opiniones' } }),
    faqCollection({
      labels: { singular: 'Pregunta frecuente', plural: 'Preguntas frecuentes' },
      route: '/preguntas-frecuentes',
    }),
    noticesCollection({ labels: { singular: 'Aviso', plural: 'Avisos' }, buttonUrl: '/agenda' }),
    contactCollection({
      labels: { singular: 'Solicitud', plural: 'Contacto' },
      kinds: { quote: 'Presupuesto', visit: 'Visita', other: 'Otro' },
      interestIn: 'pricing',
    }),
  ],
