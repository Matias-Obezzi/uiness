import type { LabelsPack } from '@/lib/labels'

/*
 * Every component in Italian, for `<LabelsProvider labels={it} locale="it">`. Standard Italian,
 * so it reads well from Milan to Palermo; copy it and change any word you like. Components you
 * have not installed are simply never read.
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
  if (count <= 0) return `a ${Math.round(delta.x)}, ${Math.round(delta.y)} pixel dall'inizio`
  const at = `in posizione ${to.index + 1} di ${count}`
  return to.containerId && to.containerId !== from.containerId ? `${at} in ${to.containerId}` : at
}

const drag = {
  start: (context: DragContext) =>
    context.count > 0
      ? `Hai preso ${context.id}, ${place(context)}. Usa le frecce per spostarlo, Spazio o Invio per rilasciarlo ed Esc per annullare.`
      : `Hai preso ${context.id}. Usa le frecce per spostarlo, Spazio o Invio per rilasciarlo ed Esc per annullare.`,
  move: (context: DragContext) => `${context.id} ora è ${place(context)}.`,
  drop: (context: DragContext) => `Hai rilasciato ${context.id} ${place(context)}.`,
  cancel: (context: DragContext) =>
    `Trascinamento di ${context.id} annullato, di nuovo ${place(context)}.`,
}

export const it = {
  'activity-heatmap': {
    grid: (from: string, to: string) => `Attività dal ${from} al ${to}`,
    day: (value: string, date: string) => `${date}: ${value}`,
    none: 'nessuna',
    less: 'Meno',
    more: 'Più',
  },
  'alert-dialog': {
    confirm: 'Continua',
    cancel: 'Annulla',
  },
  'announcement-bar': {
    region: 'Annunci',
    previous: 'Messaggio precedente',
    next: 'Messaggio successivo',
    play: 'Riprendi i messaggi',
    pause: 'Metti in pausa i messaggi',
    dismiss: 'Chiudi',
    position: (current: number, count: number) => `${current} di ${count}:`,
    endsIn: (days: number, hours: number, minutes: number) =>
      `Termina tra ${[days > 0 && plural(days, 'giorno', 'giorni'), hours > 0 && plural(hours, 'ora', 'ore'), plural(minutes, 'minuto', 'minuti')].filter(Boolean).join(' ')}`,
    days: (days: number) => `${days} g`,
  },
  'avatar-group': {
    group: (names: string[], more: number) =>
      more > 0
        ? `${names.join(', ')} e altri ${more}`
        : names.length > 1
          ? `${names.slice(0, -1).join(', ')} e ${names[names.length - 1]}`
          : (names[0] ?? 'Nessuno'),
    showMore: (count: number) => `Mostra altri ${count}`,
    overflow: 'Altre persone',
    andMore: (count: number) => `e altri ${count}`,
  },
  'billing-toggle': {
    group: 'Periodo di fatturazione',
    monthly: 'Mensile',
    yearly: 'Annuale',
    save: (percent: string) => `Risparmi il ${percent}`,
  },
  breadcrumb: {
    nav: 'Percorso di navigazione',
    more: 'Altro',
    showMore: (count: number) => `Mostra altri ${count}`,
  },
  calendar: {
    previousMonth: 'Mese precedente',
    nextMonth: 'Mese successivo',
  },
  'card-stack': {
    region: 'Schede',
    carousel: 'carosello',
    slide: 'diapositiva',
    position: (index: number, count: number) => `${index} di ${count}`,
  },
  carousel: {
    carousel: 'carosello',
    items: (label?: string) => (label ? `Elementi di ${label}` : 'Elementi del carosello'),
    previous: 'Precedente',
    next: 'Successivo',
    goTo: (index: number, count: number) => `Vai all'elemento ${index} di ${count}`,
    position: (index: number, count: number) => `Elemento ${index} di ${count}`,
    play: 'Avvia lo scorrimento automatico',
    pause: 'Metti in pausa lo scorrimento automatico',
  },
  chart: {
    empty: 'Nessun dato',
    summary: (series: string[], points: number, from?: string, to?: string) =>
      `${series.join(', ')}, ${plural(points, 'punto', 'punti')}${points ? `, da ${from} a ${to}` : ''}`,
    barChart: (summary: string) => `Grafico a barre di ${summary}`,
    lineChart: (summary: string) => `Grafico a linee di ${summary}`,
  },
  'chat-thread': {
    messages: 'Messaggi',
    jumpToLatest: "Vai all'ultimo",
    newMessages: 'Nuovi messaggi',
    you: 'Tu',
    reactions: 'Reazioni',
    addReaction: 'Aggiungi una reazione',
    reactWith: (emoji: string) => `Reagisci con ${emoji}`,
    seenBy: (names: string) => `Visto da ${names}`,
    typing: (names: string, count: number) =>
      count > 2
        ? `${count} persone stanno scrivendo`
        : `${names} ${count === 1 ? 'sta' : 'stanno'} scrivendo`,
    message: 'Messaggio',
    attach: 'Allega file',
    attachments: 'Allegati',
    remove: (name: string) => `Rimuovi ${name}`,
    send: 'Invia',
    sending: 'Invio in corso…',
    notSent: 'Non inviato',
  },
  'code-block': {
    wrap: 'A capo automatico',
    copy: 'Copia il codice',
    copied: 'Copiato',
    code: (language?: string) => (language ? `Codice ${language}` : 'Codice'),
    showLess: 'Mostra meno',
    showAll: (lines: number) => `Mostra tutte le ${lines} righe`,
  },
  'color-picker': {
    area: 'Saturazione e luminosità',
    areaRole: 'cursore 2D',
    areaValue: (saturation: number, brightness: number) =>
      `Saturazione ${saturation}%, luminosità ${brightness}%`,
    hue: 'Tonalità',
    alpha: 'Opacità',
    format: 'Formato colore',
    input: 'Valore del colore',
    eyeDropper: 'Preleva un colore dallo schermo',
    swatches: 'Colori salvati',
    addSwatch: 'Salva questo colore',
    contrast: 'Contrasto',
    passes: 'Superato',
    fails: 'Non superato',
  },
  combobox: {
    placeholder: 'Seleziona…',
    search: 'Cerca…',
    empty: 'Nessun risultato.',
  },
  command: {
    title: 'Menu dei comandi',
    description: 'Cerca un comando o una pagina',
  },
  'comment-thread': {
    title: 'Commenti',
    placeholder: 'Aggiungi un commento',
    comment: 'Commenta',
    cancel: 'Annulla',
    addReaction: 'Aggiungi una reazione',
    reactWith: (emoji: string) => `Reagisci con ${emoji}`,
    you: 'Tu',
    commentBy: (name?: string) => `Commento di ${name ?? 'utente sconosciuto'}`,
    unknown: 'Sconosciuto',
    edited: '(modificato)',
    moreActions: 'Altre azioni',
    edit: 'Modifica',
    delete: 'Elimina',
    editPlaceholder: 'Modifica il commento',
    save: 'Salva',
    reply: 'Rispondi',
    replyPlaceholder: 'Scrivi una risposta',
    showReplies: (count: number) => `Mostra ${plural(count, 'risposta', 'risposte')}`,
    hideReplies: (count: number) => `Nascondi ${count === 1 ? 'la risposta' : 'le risposte'}`,
    repliesTo: (name?: string) => `Risposte a ${name ?? 'un commento'}`,
    resolved: 'Risolto',
    resolve: 'Risolvi',
    reopen: 'Riapri',
    empty: 'Ancora nessun commento.',
    resolvedNotice: 'Questa discussione è risolta.',
    reopenToReply: 'Riaprila per rispondere.',
    deleteTitle: 'Eliminare questo commento?',
    deleteDescription: "L'operazione non può essere annullata.",
    deleteWithReplies:
      "Verranno eliminate anche le risposte. L'operazione non può essere annullata.",
  },
  compare: {
    slider: 'Confronta',
  },
  'confirm-morph': {
    question: 'Confermi?',
    confirm: 'Conferma',
    cancel: 'Annulla',
    pending: 'Elaborazione…',
    success: 'Fatto',
    error: 'Qualcosa è andato storto',
    undo: 'Annulla',
  },
  'copy-button': {
    copy: 'Copia',
    copied: 'Copiato',
    failed: 'Impossibile copiare',
  },
  'data-table': {
    search: 'Cerca…',
    reset: 'Reimposta',
    resetFilters: 'Reimposta i filtri',
    empty: 'Nessun risultato.',
    selectAll: 'Seleziona tutte le righe',
    selectRow: (name?: string) => `Seleziona ${name || 'la riga'}`,
    sortHint: 'Fai clic per ordinare, Maiusc+clic per ordinare per più colonne',
    results: (count: number, total?: number) =>
      `${plural(count, 'risultato', 'risultati')}${total === undefined ? '' : ` di ${total}`}`,
    selected: (count: number, total: number) =>
      `${count} di ${total} ${count === 1 ? 'selezionata' : 'selezionate'}`,
    pages: 'Pagine',
    pageOf: (page: number, count: number) => `Pagina ${page} di ${count}`,
    previousPage: 'Pagina precedente',
    nextPage: 'Pagina successiva',
    filterSelected: (count: number) => `${count} selezionati`,
    clearFilter: 'Rimuovi il filtro',
  },
  'date-picker': {
    placeholder: 'Scegli una data',
    rangePlaceholder: 'Scegli un intervallo',
  },
  'date-range-picker': {
    placeholder: 'Scegli un intervallo',
    apply: 'Applica',
    cancel: 'Annulla',
    presets: 'Intervalli rapidi',
    today: 'Oggi',
    yesterday: 'Ieri',
    last7Days: 'Ultimi 7 giorni',
    last30Days: 'Ultimi 30 giorni',
    thisMonth: 'Questo mese',
    lastMonth: 'Mese scorso',
    thisYear: "Quest'anno",
  },
  dialog: {
    close: 'Chiudi',
  },
  draggable: {
    draggable: 'trascinabile',
    panel: 'pannello',
    handle: 'Sposta il pannello',
    ...drag,
  },
  drawer: {
    close: 'Chiudi',
    resize: 'Ridimensiona il pannello',
    dragToClose: 'Trascina per chiudere',
  },
  dropzone: {
    prompt: (multiple: boolean) =>
      multiple
        ? 'Trascina qui i file o premi per sceglierli'
        : 'Trascina qui un file o premi per sceglierlo',
    maxSize: (size: string) => `fino a ${size} ciascuno`,
    maxFiles: (count: number) => `al massimo ${count} file`,
    anyFile: 'Qualsiasi file',
    notAccepted: (name: string) => `${name} non è di un tipo accettato.`,
    tooLarge: (name: string, size: string) => `${name} supera ${size}.`,
    tooMany: (name: string, limit: number) =>
      limit === 1
        ? `${name} non è stato aggiunto: un solo file alla volta.`
        : `${name} non è stato aggiunto: al massimo ${limit} file alla volta.`,
    added: (count: number) => `${plural(count, 'file aggiunto', 'file aggiunti')}.`,
    rejected: (count: number) => `${plural(count, 'file rifiutato', 'file rifiutati')}:`,
    noFiles: 'Nessun file.',
  },
  'donut-chart': {
    total: 'Totale',
    summary: (slices: string[], caption: string, total: string) =>
      `Grafico ad anello, ${slices.join(', ')}. ${caption} ${total}.`,
  },
  'expandable-card': {
    close: 'Chiudi',
  },
  gallery: {
    open: (index: number, alt?: string) => (alt ? `Apri ${alt}` : `Apri l'immagine ${index}`),
    image: (index: number, count: number) => `Immagine ${index} di ${count}`,
    help: "Usa le frecce per passare da un'immagine all'altra ed Esc per chiudere.",
    close: 'Chiudi',
    previous: 'Immagine precedente',
    next: 'Immagine successiva',
    show: (index: number) => `Mostra l'immagine ${index}`,
  },
  'hold-to-confirm': {
    hint: 'Tieni premuto per confermare.',
    confirmed: 'Confermato',
  },
  'inline-edit': {
    placeholder: 'Vuoto',
    saveError: 'Impossibile salvare. Riprova.',
    saving: 'Salvataggio…',
    saved: 'Salvato',
  },
  'json-viewer': {
    search: 'Cerca chiavi e valori',
    match: (current: number, total: number) => `${current} di ${total}`,
    noMatches: 'Nessuna corrispondenza',
    expandAll: 'Espandi tutto',
    collapseAll: 'Comprimi tutto',
    tree: 'JSON',
    size: (count: number, type: 'array' | 'object') =>
      type === 'array' ? plural(count, 'elemento', 'elementi') : plural(count, 'chiave', 'chiavi'),
    array: 'array',
    object: 'oggetto',
    showMore: (count: number) => `Mostra altri ${count}`,
    left: (count: number) => (count === 1 ? 'ne resta 1' : `ne restano ${count}`),
    copyValue: (path: string) => `Copia il valore di ${path}`,
    copyPath: (path: string) => `Copia il percorso ${path}`,
    copyValueHint: 'Copia il valore (c)',
    copyPathHint: 'Copia il percorso (p)',
    valueCopied: 'Valore copiato',
    pathCopied: 'Percorso copiato',
  },
  kanban: {
    card: 'elemento ordinabile',
    ...drag,
  },
  kbd: {
    command: 'Comando',
    control: 'Ctrl',
    windows: 'Windows',
    option: 'Opzione',
    alt: 'Alt',
    shift: 'Maiuscole',
    return: 'A capo',
    enter: 'Invio',
    delete: 'Elimina',
    forwardDelete: 'Canc',
    backspace: 'Backspace',
    escape: 'Esc',
    tab: 'Tab',
    space: 'Spazio',
    capsLock: 'Bloc Maiusc',
    upArrow: 'Freccia su',
    downArrow: 'Freccia giù',
    leftArrow: 'Freccia sinistra',
    rightArrow: 'Freccia destra',
    pageUp: 'Pagina su',
    pageDown: 'Pagina giù',
    home: 'Inizio',
    end: 'Fine',
    plus: 'Più',
  },
  'mention-input': {
    empty: 'Nessuna corrispondenza',
    suggestions: 'Suggerimenti',
    count: (count: number, label?: string) => `${count} ${label ?? 'suggerimenti'}`,
  },
  'metric-card': {
    loading: 'Caricamento',
    up: 'In aumento',
    down: 'In calo',
    noChange: 'Invariato',
  },
  'multi-select': {
    placeholder: 'Seleziona…',
    search: 'Cerca…',
    empty: 'Nessun risultato.',
    selectAll: 'Seleziona tutto',
    clear: 'Cancella la selezione',
    remove: (label: string) => `Rimuovi ${label}`,
    noneSelected: 'Nessuna selezione',
    selected: (count: number, labels: string) =>
      `${count} ${count === 1 ? 'selezionato' : 'selezionati'}: ${labels}`,
  },
  navbar: {
    menu: 'Menu',
    openMenu: 'Apri il menu',
    siteNavigation: 'Navigazione del sito',
    primary: 'Principale',
    more: 'Altro',
    morePages: 'Altre pagine',
  },
  'notification-center': {
    title: 'Notifiche',
    unread: (label: string, count: number) =>
      `${label}, ${count} ${count === 1 ? 'non letta' : 'non lette'}`,
    markAsRead: 'Segna come letta',
    unreadDot: 'Non letta',
    allTab: 'Tutte',
    unreadTab: 'Non lette',
    markAllAsRead: 'Segna tutte come lette',
    caughtUp: 'Sei in pari',
    caughtUpHint: "Nessuna novità dall'ultima volta.",
    empty: 'Nessuna notifica',
    emptyHint: 'Le nuove attività appariranno qui.',
  },
  'number-field': {
    decrement: 'Diminuisci',
    increment: 'Aumenta',
  },
  pagination: {
    nav: 'Paginazione',
    previous: 'Precedente',
    next: 'Successiva',
    previousPage: 'Vai alla pagina precedente',
    nextPage: 'Vai alla pagina successiva',
    page: (page: number) => `Pagina ${page}`,
    morePages: 'Altre pagine',
    pageOf: (page: number, count: number) => `Pagina ${page} di ${count}`,
  },
  'password-field': {
    reveal: 'Mostra la password',
    strength: 'Sicurezza della password',
    empty: 'Vuota',
    weak: 'Debole',
    fair: 'Discreta',
    good: 'Buona',
    strong: 'Forte',
    avoidCommon: 'Evita password e parole comuni.',
    useLength: 'Usa almeno 12 caratteri.',
    avoidSequences: 'Evita sequenze come abcd o 1234.',
    avoidRepeats: 'Evita di ripetere lo stesso carattere.',
    mixCharacters: 'Combina maiuscole, numeri o simboli.',
    addLength: 'Con qualche carattere in più sarebbe forte.',
    ruleLength: 'Almeno 12 caratteri',
    ruleCase: 'Una minuscola e una maiuscola',
    ruleNumber: 'Un numero',
    ruleSymbol: 'Un simbolo',
  },
  'phone-input': {
    country: 'Paese',
    search: 'Cerca un paese…',
    empty: 'Nessun paese trovato.',
  },
  'reorderable-grid': {
    tile: 'elemento della griglia',
    ...drag,
  },
  'resizable-panels': {
    handle: 'Ridimensiona i pannelli',
  },
  'rich-text-editor': {
    placeholder: "Scrivi qualcosa o premi '/' per i blocchi…",
    editor: 'Editor',
    formatting: 'Formattazione',
    blocks: 'Blocchi',
    linkPlaceholder: 'Incolla o digita un link',
    linkAddress: 'Indirizzo del link',
    applyLink: 'Applica il link',
    removeLink: 'Rimuovi il link',
    bold: 'Grassetto',
    italic: 'Corsivo',
    underline: 'Sottolineato',
    strikethrough: 'Barrato',
    code: 'Codice',
    link: 'Link',
    heading: 'Titolo',
    bulletedList: 'Elenco puntato',
    numberedList: 'Elenco numerato',
    quote: 'Citazione',
    text: 'Testo',
    heading1: 'Titolo 1',
    heading2: 'Titolo 2',
    heading3: 'Titolo 3',
    divider: 'Separatore',
  },
  'search-field': {
    placeholder: 'Cerca…',
    clear: 'Cancella la ricerca',
  },
  sidebar: {
    menu: 'Menu',
    navigation: 'Navigazione',
    toggle: 'Mostra o nascondi la barra laterale',
  },
  'signature-pad': {
    pad: 'Firma',
    strokes: (count: number) => plural(count, 'tratto', 'tratti'),
    empty: 'vuota',
    undo: 'Annulla',
    clear: 'Cancella',
    replay: 'Riproduci',
    placeholder: 'Firma qui',
  },
  sortable: {
    item: 'elemento ordinabile',
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
      `Andamento di ${plural(count, 'valore', 'valori')}${first !== undefined && last !== undefined ? `, da ${first} a ${last}` : ''}, minimo ${low}, massimo ${high}`,
    empty: 'Nessun dato',
  },
  spinner: {
    loading: 'Caricamento',
  },
  'split-button': {
    more: 'Altre opzioni',
  },
  stepper: {
    complete: 'completato',
    current: 'passaggio corrente',
    upcoming: 'non iniziato',
    error: 'contiene un errore',
    stepOf: (step: number, count: number) => `Passaggio ${step} di ${count}`,
  },
  'swipe-actions': {
    moreActions: (label: string) => `Altre azioni per ${label}`,
  },
  'tag-input': {
    remove: (tag: string) => `Rimuovi ${tag}`,
    max: (max: number) => `Fino a ${plural(max, 'etichetta', 'etichette')}.`,
    duplicate: (tag: string) => `${tag} è già presente.`,
    added: (tags: string) => `Aggiunte: ${tags}.`,
    removed: (tag: string) => `Rimossa: ${tag}.`,
  },
  terminal: {
    replay: 'Riproduci di nuovo',
  },
  'theme-switch': {
    darkMode: 'Modalità scura',
  },
  'time-picker': {
    hour: 'Ore',
    minute: 'Minuti',
    second: 'Secondi',
    period: 'AM/PM',
    list: 'Scegli un orario',
    empty: 'Vuoto',
  },
  toast: {
    region: 'Notifiche',
    close: 'Chiudi',
  },
  tour: {
    next: 'Avanti',
    back: 'Indietro',
    done: 'Fine',
    skip: 'Salta il tour',
    exit: 'Esci',
    progress: (current: number, total: number) => `${current} di ${total}`,
  },
  'tree-view': {
    loadFailed: 'impossibile caricare, aprilo per riprovare',
  },
  'usage-meter': {
    warning: 'Quasi pieno',
    over: (overage: string) => `Superato di ${overage}`,
    amount: (used: string, limit: string) => `${used} di ${limit}`,
    valueText: (used: string, limit: string) => `${used} di ${limit} utilizzati`,
    almostFull: 'quasi pieno',
    overLimit: (overage: string) => `oltre il limite di ${overage}`,
    free: 'Libero',
  },
} satisfies LabelsPack
