import type { LabelsPack } from '@/lib/labels'

/*
 * Every component in Spanish, for `<LabelsProvider labels={es} locale="es">`. Neutral Spanish,
 * so it reads well from Buenos Aires to Madrid; copy it and change any word you like. Components
 * you have not installed are simply never read.
 */

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

/** What the drag and drop components tell screen readers, the shape of `AnnouncementContext`. */
interface DragContext {
  id: string
  from: { containerId: string; index: number }
  to: { containerId: string; index: number }
  count: number
  delta: { x: number; y: number }
}

const place = ({ to, from, count, delta }: DragContext) => {
  if (count <= 0) return `${Math.round(delta.x)}, ${Math.round(delta.y)} píxeles del inicio`
  const at = `la posición ${to.index + 1} de ${count}`
  return to.containerId && to.containerId !== from.containerId ? `${at} en ${to.containerId}` : at
}

const drag = {
  start: (context: DragContext) =>
    context.count > 0
      ? `Se tomó ${context.id}, en ${place(context)}. Usa las flechas para moverlo, Espacio o Intro para soltarlo y Escape para cancelar.`
      : `Se tomó ${context.id}. Usa las flechas para moverlo, Espacio o Intro para soltarlo y Escape para cancelar.`,
  move: (context: DragContext) => `${context.id} pasó a ${place(context)}.`,
  drop: (context: DragContext) => `${context.id} se soltó en ${place(context)}.`,
  cancel: (context: DragContext) =>
    `Se canceló el arrastre de ${context.id}, de vuelta en ${place(context)}.`,
}

export const es = {
  'activity-heatmap': {
    grid: (from: string, to: string) => `Actividad del ${from} al ${to}`,
    day: (value: string, date: string) => `${date}: ${value}`,
    none: 'nada',
    less: 'Menos',
    more: 'Más',
  },
  'alert-dialog': {
    confirm: 'Continuar',
    cancel: 'Cancelar',
  },
  'announcement-bar': {
    region: 'Anuncios',
    previous: 'Mensaje anterior',
    next: 'Mensaje siguiente',
    play: 'Reanudar los mensajes',
    pause: 'Pausar los mensajes',
    dismiss: 'Cerrar',
    position: (current: number, count: number) => `${current} de ${count}:`,
    endsIn: (days: number, hours: number, minutes: number) =>
      `Termina en ${[days > 0 && plural(days, 'día', 'días'), hours > 0 && plural(hours, 'hora', 'horas'), plural(minutes, 'minuto', 'minutos')].filter(Boolean).join(' ')}`,
    days: (days: number) => `${days} d`,
  },
  'avatar-group': {
    group: (names: string[], more: number) =>
      more > 0
        ? `${names.join(', ')} y ${more} más`
        : names.length > 1
          ? `${names.slice(0, -1).join(', ')} y ${names[names.length - 1]}`
          : (names[0] ?? 'Nadie'),
    showMore: (count: number) => `Mostrar ${count} más`,
    overflow: 'Más personas',
    andMore: (count: number) => `y ${count} más`,
  },
  'billing-toggle': {
    group: 'Período de facturación',
    monthly: 'Mensual',
    yearly: 'Anual',
    save: (percent: string) => `Ahorro ${percent}`,
  },
  breadcrumb: {
    nav: 'Ruta de navegación',
    more: 'Más',
    showMore: (count: number) => `Mostrar ${count} más`,
  },
  calendar: {
    previousMonth: 'Mes anterior',
    nextMonth: 'Mes siguiente',
  },
  'card-stack': {
    region: 'Tarjetas',
    carousel: 'carrusel',
    slide: 'diapositiva',
    position: (index: number, count: number) => `${index} de ${count}`,
  },
  carousel: {
    carousel: 'carrusel',
    items: (label?: string) => (label ? `Elementos de ${label}` : 'Elementos del carrusel'),
    previous: 'Anterior',
    next: 'Siguiente',
    goTo: (index: number, count: number) => `Ir al elemento ${index} de ${count}`,
    position: (index: number, count: number) => `Elemento ${index} de ${count}`,
    play: 'Iniciar el desplazamiento automático',
    pause: 'Pausar el desplazamiento automático',
  },
  chart: {
    empty: 'Sin datos',
    summary: (series: string[], points: number, from?: string, to?: string) =>
      `${series.join(', ')}, ${plural(points, 'punto', 'puntos')}${points ? `, de ${from} a ${to}` : ''}`,
    barChart: (summary: string) => `Gráfico de barras de ${summary}`,
    lineChart: (summary: string) => `Gráfico de líneas de ${summary}`,
  },
  'chat-thread': {
    messages: 'Mensajes',
    jumpToLatest: 'Ir al último',
    newMessages: 'Mensajes nuevos',
    you: 'Tú',
    reactions: 'Reacciones',
    addReaction: 'Agregar una reacción',
    reactWith: (emoji: string) => `Reaccionar con ${emoji}`,
    seenBy: (names: string) => `Visto por ${names}`,
    typing: (names: string, count: number) =>
      count > 2
        ? `${count} personas están escribiendo`
        : `${names} ${count === 1 ? 'está' : 'están'} escribiendo`,
    message: 'Mensaje',
    attach: 'Adjuntar archivos',
    attachments: 'Adjuntos',
    remove: (name: string) => `Quitar ${name}`,
    send: 'Enviar',
    sending: 'Enviando…',
    notSent: 'No se envió',
  },
  'code-block': {
    wrap: 'Ajustar las líneas',
    copy: 'Copiar el código',
    copied: 'Copiado',
    code: (language?: string) => (language ? `Código ${language}` : 'Código'),
    showLess: 'Mostrar menos',
    showAll: (lines: number) => `Mostrar las ${lines} líneas`,
  },
  'code-comparison': {
    before: 'Antes',
    after: 'Después',
    copy: 'Copiar código',
    copied: 'Copiado',
    diff: 'Cambios',
  },
  'color-picker': {
    area: 'Saturación y brillo',
    areaRole: 'control deslizante 2D',
    areaValue: (saturation: number, brightness: number) =>
      `Saturación ${saturation} %, brillo ${brightness} %`,
    hue: 'Tono',
    alpha: 'Opacidad',
    format: 'Formato de color',
    input: 'Valor del color',
    eyeDropper: 'Tomar un color de la pantalla',
    swatches: 'Colores guardados',
    addSwatch: 'Guardar este color',
    contrast: 'Contraste',
    passes: 'Cumple',
    fails: 'No cumple',
  },
  combobox: {
    placeholder: 'Seleccionar…',
    search: 'Buscar…',
    empty: 'Sin resultados.',
  },
  command: {
    title: 'Menú de comandos',
    description: 'Buscar un comando o una página',
  },
  'comment-thread': {
    title: 'Comentarios',
    placeholder: 'Agregar un comentario',
    comment: 'Comentar',
    cancel: 'Cancelar',
    addReaction: 'Agregar una reacción',
    reactWith: (emoji: string) => `Reaccionar con ${emoji}`,
    you: 'Tú',
    commentBy: (name?: string) => `Comentario de ${name ?? 'alguien desconocido'}`,
    unknown: 'Desconocido',
    edited: '(editado)',
    moreActions: 'Más acciones',
    edit: 'Editar',
    delete: 'Eliminar',
    editPlaceholder: 'Editar el comentario',
    save: 'Guardar',
    reply: 'Responder',
    replyPlaceholder: 'Escribir una respuesta',
    showReplies: (count: number) => `Mostrar ${plural(count, 'respuesta', 'respuestas')}`,
    hideReplies: (count: number) => `Ocultar ${count === 1 ? 'la respuesta' : 'las respuestas'}`,
    repliesTo: (name?: string) => `Respuestas a ${name ?? 'un comentario'}`,
    resolved: 'Resuelto',
    resolve: 'Resolver',
    reopen: 'Reabrir',
    empty: 'Todavía no hay comentarios.',
    resolvedNotice: 'Este hilo está resuelto.',
    reopenToReply: 'Reábrelo para responder.',
    deleteTitle: '¿Eliminar este comentario?',
    deleteDescription: 'No se puede deshacer.',
    deleteWithReplies: 'Sus respuestas también se eliminan. No se puede deshacer.',
  },
  compare: {
    slider: 'Comparar',
  },
  'confirm-morph': {
    question: '¿Seguro?',
    confirm: 'Confirmar',
    cancel: 'Cancelar',
    pending: 'Procesando…',
    success: 'Listo',
    error: 'Algo salió mal',
    undo: 'Deshacer',
  },
  'copy-button': {
    copy: 'Copiar',
    copied: 'Copiado',
    failed: 'No se pudo copiar',
  },
  'credit-card': {
    summary: (brand: string, last4: string) =>
      last4 ? `Tarjeta ${brand} terminada en ${last4}` : `Tarjeta ${brand}`,
    holder: 'Titular',
    expires: 'Vence',
    namePlaceholder: 'Nombre completo',
    number: 'Número de tarjeta',
    name: 'Nombre en la tarjeta',
    expiry: 'Vencimiento',
    cvc: 'Código de seguridad',
    cvcHint: (digits: number, onFront: boolean) =>
      onFront ? `${digits} dígitos al frente, sobre el número` : `${digits} dígitos al dorso`,
    invalidNumber: 'Revisá el número de la tarjeta',
    missingName: 'Escribí el nombre que figura en la tarjeta',
    invalidExpiry: 'Usá el MM/AA de la tarjeta',
    expired: 'Esta tarjeta está vencida',
    invalidCvc: (digits: number) => `Ingresá el código de ${digits} dígitos`,
  },
  'data-table': {
    search: 'Buscar…',
    reset: 'Restablecer',
    resetFilters: 'Restablecer los filtros',
    empty: 'Sin resultados.',
    selectAll: 'Seleccionar todas las filas',
    selectRow: (name?: string) => `Seleccionar ${name || 'la fila'}`,
    sortHint: 'Clic para ordenar, Mayús y clic para ordenar por varias columnas',
    results: (count: number, total?: number) =>
      `${plural(count, 'resultado', 'resultados')}${total === undefined ? '' : ` de ${total}`}`,
    selected: (count: number, total: number) =>
      `${count} de ${total} ${count === 1 ? 'seleccionada' : 'seleccionadas'}`,
    pages: 'Páginas',
    pageOf: (page: number, count: number) => `Página ${page} de ${count}`,
    previousPage: 'Página anterior',
    nextPage: 'Página siguiente',
    filterSelected: (count: number) => `${count} seleccionados`,
    clearFilter: 'Quitar el filtro',
  },
  'date-picker': {
    placeholder: 'Elegir una fecha',
    rangePlaceholder: 'Elegir un rango',
  },
  'date-range-picker': {
    placeholder: 'Elegir un rango',
    apply: 'Aplicar',
    cancel: 'Cancelar',
    presets: 'Rangos rápidos',
    today: 'Hoy',
    yesterday: 'Ayer',
    last7Days: 'Últimos 7 días',
    last30Days: 'Últimos 30 días',
    thisMonth: 'Este mes',
    lastMonth: 'Mes pasado',
    thisYear: 'Este año',
  },
  dialog: {
    close: 'Cerrar',
  },
  draggable: {
    draggable: 'arrastrable',
    panel: 'panel',
    handle: 'Mover el panel',
    ...drag,
  },
  drawer: {
    close: 'Cerrar',
    resize: 'Cambiar el tamaño del panel',
    dragToClose: 'Arrastrar para cerrar',
  },
  dropzone: {
    prompt: (multiple: boolean) =>
      multiple
        ? 'Suelta archivos aquí o presiona para elegirlos'
        : 'Suelta un archivo aquí o presiona para elegirlo',
    maxSize: (size: string) => `hasta ${size} cada uno`,
    maxFiles: (count: number) => `como máximo ${count} archivos`,
    anyFile: 'Cualquier archivo',
    notAccepted: (name: string) => `${name} no es de un tipo aceptado.`,
    tooLarge: (name: string, size: string) => `${name} pesa más de ${size}.`,
    tooMany: (name: string, limit: number) =>
      limit === 1
        ? `${name} no se tomó: solo un archivo a la vez.`
        : `${name} no se tomó: como máximo ${limit} archivos a la vez.`,
    added: (count: number) => `${plural(count, 'archivo agregado', 'archivos agregados')}.`,
    rejected: (count: number) => `${plural(count, 'archivo rechazado', 'archivos rechazados')}:`,
    noFiles: 'Ningún archivo.',
  },
  'donut-chart': {
    total: 'Total',
    summary: (slices: string[], caption: string, total: string) =>
      `Gráfico de anillo, ${slices.join(', ')}. ${caption} ${total}.`,
  },
  'dotted-map': {
    map: 'Mapa mundial',
  },
  'expandable-card': {
    close: 'Cerrar',
  },
  gallery: {
    open: (index: number, alt?: string) => (alt ? `Abrir ${alt}` : `Abrir la imagen ${index}`),
    image: (index: number, count: number) => `Imagen ${index} de ${count}`,
    help: 'Usa las flechas para pasar de una imagen a otra y Escape para cerrar.',
    close: 'Cerrar',
    previous: 'Imagen anterior',
    next: 'Imagen siguiente',
    show: (index: number) => `Mostrar la imagen ${index}`,
  },
  globe: {
    globe: 'Globo terráqueo interactivo',
  },
  'hold-to-confirm': {
    hint: 'Mantén presionado para confirmar.',
    confirmed: 'Confirmado',
  },
  'inline-edit': {
    placeholder: 'Vacío',
    saveError: 'No se pudo guardar. Inténtalo de nuevo.',
    saving: 'Guardando…',
    saved: 'Guardado',
  },
  'json-viewer': {
    search: 'Buscar claves y valores',
    match: (current: number, total: number) => `${current} de ${total}`,
    noMatches: 'Sin coincidencias',
    expandAll: 'Expandir todo',
    collapseAll: 'Contraer todo',
    tree: 'JSON',
    size: (count: number, type: 'array' | 'object') =>
      type === 'array' ? plural(count, 'elemento', 'elementos') : plural(count, 'clave', 'claves'),
    array: 'arreglo',
    object: 'objeto',
    showMore: (count: number) => `Mostrar ${count} más`,
    left: (count: number) => (count === 1 ? 'queda 1' : `quedan ${count}`),
    copyValue: (path: string) => `Copiar el valor de ${path}`,
    copyPath: (path: string) => `Copiar la ruta ${path}`,
    copyValueHint: 'Copiar el valor (c)',
    copyPathHint: 'Copiar la ruta (p)',
    valueCopied: 'Valor copiado',
    pathCopied: 'Ruta copiada',
  },
  kanban: {
    card: 'elemento ordenable',
    ...drag,
  },
  kbd: {
    command: 'Comando',
    control: 'Control',
    windows: 'Windows',
    option: 'Opción',
    alt: 'Alt',
    shift: 'Mayúsculas',
    return: 'Retorno',
    enter: 'Intro',
    delete: 'Borrar',
    forwardDelete: 'Suprimir',
    backspace: 'Retroceso',
    escape: 'Escape',
    tab: 'Tabulador',
    space: 'Espacio',
    capsLock: 'Bloq Mayús',
    upArrow: 'Flecha arriba',
    downArrow: 'Flecha abajo',
    leftArrow: 'Flecha izquierda',
    rightArrow: 'Flecha derecha',
    pageUp: 'Retroceder página',
    pageDown: 'Avanzar página',
    home: 'Inicio',
    end: 'Fin',
    plus: 'Más',
  },
  map: {
    map: 'Mapa',
    zoomIn: 'Acercar',
    zoomOut: 'Alejar',
    close: 'Cerrar',
  },
  'mention-input': {
    empty: 'Sin coincidencias',
    suggestions: 'Sugerencias',
    count: (count: number, label?: string) => `${count} ${label ?? 'sugerencias'}`,
  },
  'metric-card': {
    loading: 'Cargando',
    up: 'Sube',
    down: 'Baja',
    noChange: 'Sin cambios',
  },
  'multi-select': {
    placeholder: 'Seleccionar…',
    search: 'Buscar…',
    empty: 'Sin resultados.',
    selectAll: 'Seleccionar todo',
    clear: 'Borrar la selección',
    remove: (label: string) => `Quitar ${label}`,
    noneSelected: 'Nada seleccionado',
    selected: (count: number, labels: string) =>
      `${count} ${count === 1 ? 'seleccionado' : 'seleccionados'}: ${labels}`,
  },
  navbar: {
    menu: 'Menú',
    openMenu: 'Abrir el menú',
    siteNavigation: 'Navegación del sitio',
    primary: 'Principal',
    more: 'Más',
    morePages: 'Más páginas',
  },
  'notification-center': {
    title: 'Notificaciones',
    unread: (label: string, count: number) => `${label}, ${count} sin leer`,
    markAsRead: 'Marcar como leída',
    unreadDot: 'Sin leer',
    allTab: 'Todas',
    unreadTab: 'Sin leer',
    markAllAsRead: 'Marcar todas como leídas',
    caughtUp: 'Estás al día',
    caughtUpHint: 'No hay nada nuevo desde la última vez.',
    empty: 'No hay notificaciones',
    emptyHint: 'La actividad nueva va a aparecer aquí.',
  },
  'number-field': {
    decrement: 'Disminuir',
    increment: 'Aumentar',
  },
  'og-preview': {
    preview: (title: string) => `Vista previa de ${title}`,
  },
  pagination: {
    nav: 'Paginación',
    previous: 'Anterior',
    next: 'Siguiente',
    previousPage: 'Ir a la página anterior',
    nextPage: 'Ir a la página siguiente',
    page: (page: number) => `Página ${page}`,
    morePages: 'Más páginas',
    pageOf: (page: number, count: number) => `Página ${page} de ${count}`,
  },
  'password-field': {
    reveal: 'Mostrar la contraseña',
    strength: 'Seguridad de la contraseña',
    empty: 'Vacía',
    weak: 'Débil',
    fair: 'Aceptable',
    good: 'Buena',
    strong: 'Fuerte',
    avoidCommon: 'Evita las contraseñas y palabras comunes.',
    useLength: 'Usa al menos 12 caracteres.',
    avoidSequences: 'Evita secuencias como abcd o 1234.',
    avoidRepeats: 'Evita repetir el mismo carácter.',
    mixCharacters: 'Combina mayúsculas, números o símbolos.',
    addLength: 'Con unos caracteres más sería fuerte.',
    ruleLength: 'Al menos 12 caracteres',
    ruleCase: 'Una minúscula y una mayúscula',
    ruleNumber: 'Un número',
    ruleSymbol: 'Un símbolo',
  },
  'phone-input': {
    country: 'País',
    search: 'Buscar países…',
    empty: 'No se encontró ningún país.',
  },
  'reorderable-grid': {
    tile: 'elemento de la cuadrícula',
    ...drag,
  },
  'resizable-panels': {
    handle: 'Cambiar el tamaño de los paneles',
  },
  'rich-text-editor': {
    placeholder: "Escribe algo, o presiona '/' para ver los bloques…",
    editor: 'Editor',
    formatting: 'Formato',
    blocks: 'Bloques',
    linkPlaceholder: 'Pega o escribe un enlace',
    linkAddress: 'Dirección del enlace',
    applyLink: 'Aplicar el enlace',
    removeLink: 'Quitar el enlace',
    bold: 'Negrita',
    italic: 'Cursiva',
    underline: 'Subrayado',
    strikethrough: 'Tachado',
    code: 'Código',
    link: 'Enlace',
    heading: 'Título',
    bulletedList: 'Lista con viñetas',
    numberedList: 'Lista numerada',
    quote: 'Cita',
    text: 'Texto',
    heading1: 'Título 1',
    heading2: 'Título 2',
    heading3: 'Título 3',
    divider: 'Separador',
  },
  safari: {
    search: 'Buscar o ingresar dirección web',
  },
  'scratch-reveal': {
    hint: 'Raspá para descubrir',
    reveal: 'Mostrar el contenido oculto',
  },
  'scroll-progress': {
    backToTop: 'Volver arriba',
  },
  'search-field': {
    placeholder: 'Buscar…',
    clear: 'Borrar la búsqueda',
  },
  sidebar: {
    menu: 'Menú',
    navigation: 'Navegación',
    toggle: 'Mostrar u ocultar la barra lateral',
  },
  'signature-pad': {
    pad: 'Firma',
    strokes: (count: number) => plural(count, 'trazo', 'trazos'),
    empty: 'vacía',
    undo: 'Deshacer',
    clear: 'Borrar',
    replay: 'Reproducir',
    placeholder: 'Firma aquí',
  },
  sortable: {
    item: 'elemento ordenable',
    ...drag,
  },
  sparkline: {
    summary: ({
      count,
      first,
      last,
      low,
      high,
    }: {
      count: number
      first?: string
      last?: string
      low: string
      high: string
    }) =>
      `Tendencia de ${count} valores${first !== undefined && last !== undefined ? `, de ${first} a ${last}` : ''}, mínimo ${low}, máximo ${high}`,
    empty: 'Sin datos',
  },
  spinner: {
    loading: 'Cargando',
  },
  'split-button': {
    more: 'Más opciones',
  },
  stepper: {
    complete: 'completado',
    current: 'paso actual',
    upcoming: 'sin empezar',
    error: 'tiene un error',
    stepOf: (step: number, count: number) => `Paso ${step} de ${count}`,
  },
  'swipe-actions': {
    moreActions: (label: string) => `Más acciones para ${label}`,
  },
  stories: {
    tray: 'Historias',
    group: (name: string, unseen: boolean) => (unseen ? `${name}, historias nuevas` : name),
    story: (name: string, index: number, total: number) => `${name}, historia ${index} de ${total}`,
    previous: 'Historia anterior',
    next: 'Historia siguiente',
    pause: 'Pausar',
    play: 'Reproducir',
    mute: 'Silenciar',
    unmute: 'Activar sonido',
    close: 'Cerrar historias',
  },
  'swipe-deck': {
    deck: 'Tarjetas',
    like: 'Me gusta',
    nope: 'No',
    superLike: 'Súper like',
    undo: 'Deshacer',
    result: (direction: 'left' | 'right' | 'up') =>
      direction === 'right' ? 'Te gusta' : direction === 'left' ? 'Descartada' : 'Súper like',
  },
  'vertical-feed': {
    feed: 'Feed',
    captions: 'Subtítulos. Muévelos con las flechas; Inicio los devuelve a su lugar.',
  },
  'model-selector': {
    models: 'Modelo',
    effort: 'Esfuerzo',
    trigger: (model: string, effort?: string) =>
      effort ? `Modelo: ${model}, esfuerzo ${effort}` : `Modelo: ${model}`,
  },
  'prompt-input': {
    placeholder: 'Pregunta lo que quieras…',
    attach: 'Adjuntar archivos',
    remove: (name: string) => `Quitar ${name}`,
    send: 'Enviar',
    stop: 'Detener',
    tools: 'Herramientas',
    commands: 'Comandos',
  },
  'voice-input': {
    record: 'Grabar un mensaje de voz',
    stop: 'Detener la grabación',
    play: 'Reproducir',
    pause: 'Pausar',
    discard: 'Descartar',
    send: 'Enviar',
    recording: (time: string) => `Grabando, ${time}`,
    denied: 'El micrófono no está disponible.',
  },
  'agent-steps': {
    steps: 'Pasos',
    working: (elapsed: string) => `Trabajando… ${elapsed}`,
    finished: (elapsed: string) => `Listo en ${elapsed}`,
    status: { pending: 'Pendiente', running: 'En curso', done: 'Hecho', error: 'Falló' },
    log: 'Registro',
  },
  'tool-approval': {
    calls: 'Llamadas a herramientas',
    ask: (name: string) => `¿Permitir ${name}?`,
    approve: 'Aprobar',
    deny: 'Rechazar',
    destructive: 'No se puede deshacer. Mantén presionado para aprobar.',
    status: {
      pending: 'Esperando',
      running: 'En curso',
      done: 'Hecho',
      denied: 'Rechazada',
      error: 'Falló',
    },
  },
  'context-meter': {
    trigger: (percent: number) => `Ventana de contexto al ${percent}%`,
    title: 'Ventana de contexto',
    usage: (used: string, limit: string) => `${used} de ${limit} tokens`,
    compact: 'Compactar',
    nearlyFull: 'Casi llena. Compactar resume los turnos más viejos para hacer lugar.',
  },
  citations: {
    chip: (index: number, title: string) => `Fuente ${index}: ${title}`,
    reading: (count: number) => `Leyendo ${count} ${count === 1 ? 'fuente' : 'fuentes'}`,
  },
  'diff-review': {
    files: 'Archivos cambiados',
    accept: 'Aceptar',
    reject: 'Rechazar',
    undo: 'Deshacer',
    acceptAll: 'Aceptar todo',
    changes: (added: number, removed: number) => `${added} agregadas, ${removed} quitadas`,
    writing: 'Escribiendo…',
    decision: { accepted: 'Aceptado', rejected: 'Rechazado' },
  },
  'autocomplete-input': {
    hint: (suggestion: string) =>
      `Sugerencia: ${suggestion}. Tab la acepta, la flecha derecha una palabra.`,
  },
  'token-alternatives': {
    token: (text: string, percent: number) =>
      `${text.trim()}, ${percent}% probable. Ver alternativas`,
    options: 'Otras palabras que consideró',
  },
  'chat-branches': {
    conversation: 'Conversación',
    tree: 'Versiones',
    node: (depth: number, version: number, of: number) =>
      `Mensaje ${depth}, versión ${version} de ${of}`,
    version: (index: number, total: number) => `Versión ${index} de ${total}`,
    previous: 'Versión anterior',
    next: 'Versión siguiente',
    edit: 'Editar',
    save: 'Guardar y enviar',
    cancel: 'Cancelar',
  },
  'agent-lanes': {
    scrub: 'Tiempo de la ejecución',
    runningAt: (time: string) => `En curso a los ${time}`,
    idle: 'Nada en curso',
    live: 'En vivo',
  },
  'rewrite-selection': {
    text: 'Texto. Selecciona palabras para reescribirlas.',
    instruction: 'Cómo reescribir la selección',
    placeholder: 'Reescribir la selección…',
    rewrite: 'Reescribir',
    accept: 'Aceptar',
    discard: 'Descartar',
    retry: 'Reintentar',
    writing: 'Reescribiendo…',
    review: 'Revisa la reescritura',
    added: 'agregado',
    removed: 'quitado',
  },
  'message-queue': {
    queue: (count: number) => (count === 1 ? '1 mensaje en cola' : `${count} mensajes en cola`),
    placeholder: 'Envía un mensaje…',
    send: 'Enviar',
    queueIt: 'Encolar',
    sendNow: 'Enviar ahora',
    edit: 'Editar',
    save: 'Guardar',
    remove: 'Quitar',
    moveUp: 'Subir',
    moveDown: 'Bajar',
  },
  'redact-prompt': {
    placeholder: 'Escribe un prompt…',
    preview: 'Lo que ve el modelo',
    show: 'Ver lo que ve el modelo',
    hide: 'Ocultar lo que ve el modelo',
    masked: (count: number) => (count === 1 ? '1 dato oculto' : `${count} datos ocultos`),
    kinds: {
      email: 'Email',
      phone: 'Teléfono',
      card: 'Número de tarjeta',
      key: 'Clave de API',
      term: 'Nombre',
    },
  },
  'memory-list': {
    title: 'Memoria',
    count: (count: number) => (count === 1 ? '1 cosa que recuerda' : `${count} cosas que recuerda`),
    empty: 'Todavía no guardó nada. Lo que aprenda de ti aparece acá.',
    edit: 'Editar',
    save: 'Guardar',
    cancel: 'Cancelar',
    forget: 'Olvidar',
    updated: 'Actualizado',
  },
  'amount-pad': {
    amount: 'Monto',
    keypad: 'Teclado',
    delete: 'Borrar',
    decimal: 'Coma decimal',
  },
  'slide-to-confirm': {
    hint: 'Desliza hasta el final, o usa la flecha derecha hasta el final, para confirmar.',
    confirmed: 'Confirmado',
  },
  'save-button': {
    save: 'Guardar',
    saved: (collection: string) => `Guardado en ${collection}`,
    choose: 'Elegir una colección',
    savedTo: 'Guardado en',
    newCollection: 'Nueva colección',
    create: 'Crear',
    remove: 'Quitar de guardados',
  },
  'cart-button': {
    add: 'Agregar',
    quantity: (item: string) => `Cantidad de ${item}`,
    increase: 'Agregar uno',
    decrease: 'Quitar uno',
    remove: 'Quitar del carrito',
    inCart: (count: number) => `${count} en el carrito`,
  },
  'undo-button': {
    undo: (seconds: number) => `Deshacer, quedan ${seconds} s`,
    done: 'Listo',
  },
  'tip-selector': {
    tip: 'Propina',
    percent: (percent: number) => `${percent}%`,
    tipAmount: 'Propina',
    total: 'Total',
    roundUp: 'Redondear el total',
  },
  'seat-map': {
    map: 'Asientos',
    screen: 'Pantalla',
    seat: (row: string, number: number, state: 'available' | 'taken' | 'selected') =>
      `Fila ${row}, asiento ${number}, ${state === 'available' ? 'libre' : state === 'taken' ? 'ocupado' : 'elegido'}`,
    stranded: (seats: string[]) =>
      seats.length === 1
        ? `El asiento ${seats[0]} quedaría solo.`
        : `Los asientos ${seats.join(', ')} quedarían solos.`,
    legend: { available: 'Libre', selected: 'Tuyos', taken: 'Ocupado' },
  },
  'slot-picker': {
    day: 'Día',
    meeting: (from: string, to: string) => `Reunión de ${from} a ${to}`,
    resize: 'Duración de la reunión',
    hostTime: (from: string, to: string, zone: string) =>
      `${from} – ${to} para quien invita (${zone})`,
    busy: 'Ocupado',
  },
  'timezone-planner': {
    dial: 'Hora de la reunión',
    meeting: (time: string) => `Reunión a las ${time}`,
    parts: { work: 'Trabajando', awake: 'Fuera de horario', asleep: 'Durmiendo' },
    allWorking: 'Todos están en horario laboral.',
    outside: (count: number) =>
      count === 1
        ? '1 persona está fuera de horario.'
        : `${count} personas están fuera de horario.`,
  },
  'boarding-pass': {
    passenger: 'Pasajero',
    flight: 'Vuelo',
    gate: 'Puerta',
    boards: 'Embarque',
    departs: 'Salida',
    seat: 'Asiento',
    changed: (field: string, from: string, to: string) => `${field} cambió de ${from} a ${to}`,
  },
  'currency-transfer': {
    rate: (from: string, rate: string, to: string) => `1 ${from} = ${rate} ${to}`,
    reference: 'Referencia',
    stepState: (state: 'done' | 'current' | 'next') =>
      state === 'done' ? 'hecho' : state === 'current' ? 'en curso' : 'pendiente',
  },
  'team-selector': {
    seats: 'Puestos',
    more: 'Agregar un puesto',
    fewer: 'Quitar un puesto',
    per: 'por mes',
    hint: 'Arrastra de lado o usa las flechas para cambiarlo.',
  },
  'location-picker': {
    map: 'Punto de partida',
    finding: 'Buscando la dirección…',
    pickup: (address: string) => `Te buscan en ${address}`,
    hint: 'Mueve el mapa para ubicar el pin. Las flechas también lo mueven.',
  },
  'receipt-printer': {
    receipt: 'Recibo',
    total: 'Total',
    tear: 'Cortar',
    printing: 'Imprimiendo…',
    hint: 'Tira del recibo hacia abajo para cortarlo, o usa el botón Cortar.',
  },
  'bell-button': {
    subscribe: 'Suscribirme',
    subscribed: 'Suscrito',
  },
  'particle-button': {
    working: 'Procesando…',
    done: 'Listo',
    failed: 'Algo salió mal',
  },
  'tear-button': {
    hint: 'Arrastra el talón para arrancarlo, o mantén Espacio o Enter.',
    confirmed: 'Confirmado',
  },
  'pull-cord': {
    light: 'Luz',
  },
  'marking-menu': {
    hint: 'Mantén presionado, muévete hacia una opción y suelta. O presiona Enter y usa las flechas.',
  },
  toolbar: {
    toolbar: 'Herramientas',
    move: 'Mover la barra: arrástrala, o presiona Shift y una flecha, hacia otro borde.',
    more: (tool: string) => `Más herramientas de ${tool}`,
  },
  'profile-dropdown': {
    account: (name: string) => `Cuenta: ${name}`,
    switchAccount: 'Cambiar de cuenta',
    status: 'Estado',
    statuses: { online: 'En línea', away: 'Ausente', busy: 'No molestar' },
    theme: 'Tema',
    themes: { light: 'Claro', dark: 'Oscuro', system: 'Sistema' },
    signOut: 'Mantén para cerrar sesión',
  },
  'morph-popover': {
    close: 'Cerrar',
    submit: 'Enviar',
    sending: 'Enviando…',
    done: 'Enviado',
  },
  'stack-panel': {
    back: (to: string) => `Volver a ${to}`,
  },
  'morphic-navbar': {
    nav: 'Principal',
  },
  'scroll-index': {
    index: 'En esta página',
  },
  'spoiler-text': {
    reveal: 'Spoiler, presiona para verlo',
  },
  'liquid-gauge': {
    valueText: (value: string, max: string) => `${value} de ${max}`,
  },
  'uptime-card': {
    up: 'Operativo',
    degraded: 'Degradado',
    down: 'Caída',
    uptime: (share: string) => `${share} de disponibilidad`,
    day: (date: string, status: string, incidents: number) =>
      `${date}, ${status}${incidents ? `, ${incidents} incidente${incidents === 1 ? '' : 's'}` : ''}`,
    noIncidents: 'Sin incidentes este día.',
    ago: (days: number) => `Hace ${days} días`,
    today: 'Hoy',
  },
  'focal-point-picker': {
    focalPoint: 'Punto focal',
    position: (x: number, y: number) => `${x}% en horizontal, ${y}% en vertical`,
    crops: 'Recortes',
  },
  'photo-straighten': {
    straighten: 'Enderezar',
    degrees: (angle: string) => `${angle} grados`,
    reset: 'Restablecer',
  },
  'clip-trimmer': {
    start: 'Inicio del recorte',
    end: 'Fin del recorte',
    play: 'Reproducir',
    pause: 'Pausar',
    kept: (length: string) => `${length} conservados`,
  },
  'synced-transcript': {
    transcript: 'Transcripción',
    jump: (time: string) => `Reproducir desde ${time}`,
    follow: 'Volver a la palabra actual',
  },
  'avatar-picker': {
    name: 'Nombre',
    flip: 'Dar vuelta al otro avatar',
    shuffle: 'Mezclar',
  },
  'page-flip': {
    book: 'Libro',
    previous: 'Página anterior',
    next: 'Página siguiente',
    pages: (from: number, to: number, total: number) =>
      from === to ? `Página ${from} de ${total}` : `Páginas ${from}–${to} de ${total}`,
  },
  'contact-sheet': {
    frame: (n: number, alt: string, mark: 'pick' | 'strike' | null) =>
      `Fotograma ${n}, ${alt}${mark === 'pick' ? ', marcado' : mark === 'strike' ? ', tachado' : ''}`,
    picked: (n: number) => `${n} ${n === 1 ? 'marcado' : 'marcados'}`,
  },
  'vinyl-card': {
    play: 'Reproducir',
    pause: 'Pausar',
    seek: 'Posición',
  },
  'tag-input': {
    remove: (tag: string) => `Quitar ${tag}`,
    max: (max: number) => `Hasta ${plural(max, 'etiqueta', 'etiquetas')}.`,
    duplicate: (tag: string) => `${tag} ya está agregada.`,
    added: (tags: string) => `Agregadas: ${tags}.`,
    removed: (tag: string) => `Se quitó ${tag}.`,
  },
  terminal: {
    replay: 'Volver a reproducir',
  },
  'theme-switch': {
    darkMode: 'Modo oscuro',
  },
  'three-viewer': {
    reset: 'Restablecer vista',
    zoomIn: 'Acercar',
    zoomOut: 'Alejar',
    autoRotate: 'Rotación automática',
    views: 'Vistas de cámara',
    viewFront: 'Vista frontal',
    viewBack: 'Vista trasera',
    viewLeft: 'Vista izquierda',
    viewRight: 'Vista derecha',
    viewTop: 'Vista superior',
    viewIso: 'Vista isométrica',
    wireframe: 'Alternar malla',
    background: 'Cambiar fondo',
    screenshot: 'Capturar pantalla',
    fullscreen: 'Pantalla completa',
  },
  'time-picker': {
    hour: 'Horas',
    minute: 'Minutos',
    second: 'Segundos',
    period: 'a. m./p. m.',
    list: 'Elegir una hora',
    empty: 'Vacío',
  },
  toast: {
    region: 'Notificaciones',
    close: 'Cerrar',
  },
  tour: {
    next: 'Siguiente',
    back: 'Atrás',
    done: 'Listo',
    skip: 'Saltar el recorrido',
    exit: 'Salir',
    progress: (current: number, total: number) => `${current} de ${total}`,
  },
  'tree-view': {
    loadFailed: 'no se pudo cargar, ábrelo para reintentar',
  },
  'tweet-card': {
    reply: 'Responder',
    repost: 'Republicar',
    like: 'Me gusta',
    views: 'Visualizaciones',
    verified: 'Cuenta verificada',
    quoted: 'Publicación citada',
  },
  'usage-meter': {
    warning: 'Casi lleno',
    over: (overage: string) => `Excedido por ${overage}`,
    amount: (used: string, limit: string) => `${used} de ${limit}`,
    valueText: (used: string, limit: string) => `${used} de ${limit} usados`,
    almostFull: 'casi lleno',
    overLimit: (overage: string) => `excede el límite por ${overage}`,
    free: 'Libre',
  },
  'video-player': {
    player: 'Reproductor de video',
    play: 'Reproducir',
    pause: 'Pausar',
    replay: 'Volver a reproducir',
    mute: 'Silenciar',
    unmute: 'Activar sonido',
    volume: 'Volumen',
    seek: 'Posición',
    fullscreen: 'Pantalla completa',
    exitFullscreen: 'Salir de pantalla completa',
    pictureInPicture: 'Imagen en imagen',
    captions: 'Subtítulos',
    speed: (rate: number) => `Velocidad ${rate}×`,
    progress: (current: string, total: string) => `${current} de ${total}`,
  },
} satisfies LabelsPack
