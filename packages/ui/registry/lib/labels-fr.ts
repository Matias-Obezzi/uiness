import type { LabelsPack } from '@/lib/labels'

/*
 * Every component in French, for `<LabelsProvider labels={fr} locale="fr">`. Standard French,
 * so it reads well from Paris to Montréal; copy it and change any word you like. Components
 * you have not installed are simply never read. A no-break space goes before « : ? ! % » and
 * inside « », as French typography asks, so a line never starts with one of them.
 */

/** French counts 0 and 1 as singular: « 0 fichier », « 1 fichier », « 2 fichiers ». */
const plural = (n: number, one: string, many: string) => `${n} ${n < 2 ? one : many}`

/** « de » before a word, « d’ » before a vowel, as French elides it. */
const of = (word: string) => (/^[aeiouàâäéèêëîïôöùûü]/i.test(word) ? `d’${word}` : `de ${word}`)

/** What the drag and drop components tell screen readers, the shape of `AnnouncementContext`. */
interface DragContext {
  id: string
  from: { containerId: string; index: number }
  to: { containerId: string; index: number }
  count: number
  delta: { x: number; y: number }
}

const place = ({ to, from, count, delta }: DragContext) => {
  if (count <= 0) return `${Math.round(delta.x)}, ${Math.round(delta.y)} pixels du point de départ`
  const at = `la position ${to.index + 1} sur ${count}`
  return to.containerId && to.containerId !== from.containerId ? `${at} dans ${to.containerId}` : at
}

const drag = {
  start: (context: DragContext) =>
    context.count > 0
      ? `${context.id} saisi, à ${place(context)}. Utilisez les flèches pour le déplacer, Espace ou Entrée pour le déposer et Échap pour annuler.`
      : `${context.id} saisi. Utilisez les flèches pour le déplacer, Espace ou Entrée pour le déposer et Échap pour annuler.`,
  move: (context: DragContext) => `${context.id} déplacé à ${place(context)}.`,
  drop: (context: DragContext) => `${context.id} déposé à ${place(context)}.`,
  cancel: (context: DragContext) =>
    `Déplacement de ${context.id} annulé, retour à ${place(context)}.`,
}

export const fr = {
  'activity-heatmap': {
    grid: (from: string, to: string) => `Activité du ${from} au ${to}`,
    day: (value: string, date: string) => `${date} : ${value}`,
    none: 'aucune activité',
    less: 'Moins',
    more: 'Plus',
  },
  'alert-dialog': {
    confirm: 'Continuer',
    cancel: 'Annuler',
  },
  'announcement-bar': {
    region: 'Annonces',
    previous: 'Message précédent',
    next: 'Message suivant',
    play: 'Reprendre les messages',
    pause: 'Mettre en pause les messages',
    dismiss: 'Fermer',
    position: (current: number, count: number) => `${current} sur ${count} :`,
    endsIn: (days: number, hours: number, minutes: number) =>
      `Se termine dans ${[days > 0 && plural(days, 'jour', 'jours'), hours > 0 && plural(hours, 'heure', 'heures'), plural(minutes, 'minute', 'minutes')].filter(Boolean).join(' ')}`,
    days: (days: number) => `${days} j`,
  },
  'avatar-group': {
    group: (names: string[], more: number) =>
      more > 0
        ? `${names.join(', ')} et ${plural(more, 'autre', 'autres')}`
        : names.length > 1
          ? `${names.slice(0, -1).join(', ')} et ${names[names.length - 1]}`
          : (names[0] ?? 'Personne'),
    showMore: (count: number) => `Afficher ${count} de plus`,
    overflow: 'Autres personnes',
    andMore: (count: number) => `et ${plural(count, 'autre', 'autres')}`,
  },
  'billing-toggle': {
    group: 'Période de facturation',
    monthly: 'Mensuel',
    yearly: 'Annuel',
    save: (percent: string) => `Économisez ${percent}`,
  },
  breadcrumb: {
    nav: 'Fil d’Ariane',
    more: 'Plus',
    showMore: (count: number) => `Afficher ${count} de plus`,
  },
  calendar: {
    previousMonth: 'Mois précédent',
    nextMonth: 'Mois suivant',
  },
  'card-stack': {
    region: 'Cartes',
    carousel: 'carrousel',
    slide: 'diapositive',
    position: (index: number, count: number) => `${index} sur ${count}`,
  },
  carousel: {
    carousel: 'carrousel',
    items: (label?: string) => (label ? `Éléments ${of(label)}` : 'Éléments du carrousel'),
    previous: 'Précédent',
    next: 'Suivant',
    goTo: (index: number, count: number) => `Aller à l’élément ${index} sur ${count}`,
    position: (index: number, count: number) => `Élément ${index} sur ${count}`,
    play: 'Lancer le défilement automatique',
    pause: 'Mettre en pause le défilement automatique',
  },
  chart: {
    empty: 'Aucune donnée',
    summary: (series: string[], points: number, from?: string, to?: string) =>
      `${series.join(', ')}, ${plural(points, 'point', 'points')}${points ? `, de ${from} à ${to}` : ''}`,
    barChart: (summary: string) => `Graphique en barres ${of(summary)}`,
    lineChart: (summary: string) => `Graphique en courbes ${of(summary)}`,
  },
  'chat-thread': {
    messages: 'Messages',
    jumpToLatest: 'Aller au plus récent',
    newMessages: 'Nouveaux messages',
    you: 'Vous',
    reactions: 'Réactions',
    addReaction: 'Ajouter une réaction',
    reactWith: (emoji: string) => `Réagir avec ${emoji}`,
    seenBy: (names: string) => `Vu par ${names}`,
    typing: (names: string, count: number) =>
      count > 2
        ? `${count} personnes sont en train d’écrire`
        : `${names} ${count < 2 ? 'est' : 'sont'} en train d’écrire`,
    message: 'Message',
    attach: 'Joindre des fichiers',
    attachments: 'Pièces jointes',
    remove: (name: string) => `Retirer ${name}`,
    send: 'Envoyer',
    sending: 'Envoi…',
    notSent: 'Non envoyé',
  },
  'code-block': {
    wrap: 'Retour à la ligne automatique',
    copy: 'Copier le code',
    copied: 'Copié',
    code: (language?: string) => (language ? `Code ${language}` : 'Code'),
    showLess: 'Afficher moins',
    showAll: (lines: number) => `Afficher les ${lines} lignes`,
  },
  'code-comparison': {
    before: 'Avant',
    after: 'Après',
    copy: 'Copier le code',
    copied: 'Copié',
    diff: 'Modifications',
  },
  'color-picker': {
    area: 'Saturation et luminosité',
    areaRole: 'curseur 2D',
    areaValue: (saturation: number, brightness: number) =>
      `Saturation ${saturation} %, luminosité ${brightness} %`,
    hue: 'Teinte',
    alpha: 'Opacité',
    format: 'Format de couleur',
    input: 'Valeur de la couleur',
    eyeDropper: 'Prélever une couleur à l’écran',
    swatches: 'Couleurs enregistrées',
    addSwatch: 'Enregistrer cette couleur',
    contrast: 'Contraste',
    passes: 'Conforme',
    fails: 'Non conforme',
  },
  combobox: {
    placeholder: 'Sélectionner…',
    search: 'Rechercher…',
    empty: 'Aucun résultat.',
  },
  command: {
    title: 'Menu des commandes',
    description: 'Rechercher une commande ou une page',
  },
  'comment-thread': {
    title: 'Commentaires',
    placeholder: 'Ajouter un commentaire',
    comment: 'Commenter',
    cancel: 'Annuler',
    addReaction: 'Ajouter une réaction',
    reactWith: (emoji: string) => `Réagir avec ${emoji}`,
    you: 'Vous',
    commentBy: (name?: string) => (name ? `Commentaire ${of(name)}` : 'Commentaire anonyme'),
    unknown: 'Inconnu',
    edited: '(modifié)',
    moreActions: 'Plus d’actions',
    edit: 'Modifier',
    delete: 'Supprimer',
    editPlaceholder: 'Modifier le commentaire',
    save: 'Enregistrer',
    reply: 'Répondre',
    replyPlaceholder: 'Écrire une réponse',
    showReplies: (count: number) => `Afficher ${plural(count, 'réponse', 'réponses')}`,
    hideReplies: (count: number) => `Masquer ${count < 2 ? 'la réponse' : 'les réponses'}`,
    repliesTo: (name?: string) => `Réponses à ${name ?? 'un commentaire'}`,
    resolved: 'Résolu',
    resolve: 'Résoudre',
    reopen: 'Rouvrir',
    empty: 'Aucun commentaire pour l’instant.',
    resolvedNotice: 'Ce fil est résolu.',
    reopenToReply: 'Rouvrez-le pour répondre.',
    deleteTitle: 'Supprimer ce commentaire ?',
    deleteDescription: 'Cette action est irréversible.',
    deleteWithReplies: 'Ses réponses seront aussi supprimées. Cette action est irréversible.',
  },
  compare: {
    slider: 'Comparer',
  },
  'confirm-morph': {
    question: 'Êtes-vous sûr ?',
    confirm: 'Confirmer',
    cancel: 'Annuler',
    pending: 'En cours…',
    success: 'Terminé',
    error: 'Une erreur est survenue',
    undo: 'Annuler',
  },
  'copy-button': {
    copy: 'Copier',
    copied: 'Copié',
    failed: 'Échec de la copie',
  },
  'credit-card': {
    summary: (brand: string, last4: string) =>
      last4 ? `Carte ${brand} se terminant par ${last4}` : `Carte ${brand}`,
    holder: 'Titulaire',
    expires: 'Expire',
    namePlaceholder: 'Nom complet',
    number: 'Numéro de carte',
    name: 'Nom sur la carte',
    expiry: "Date d'expiration",
    cvc: 'Code de sécurité',
    cvcHint: (digits: number, onFront: boolean) =>
      onFront ? `${digits} chiffres au recto, au-dessus du numéro` : `${digits} chiffres au verso`,
    invalidNumber: 'Vérifiez le numéro de carte',
    missingName: 'Saisissez le nom inscrit sur la carte',
    invalidExpiry: 'Utilisez le MM/AA de la carte',
    expired: 'Cette carte a expiré',
    invalidCvc: (digits: number) => `Saisissez le code à ${digits} chiffres`,
  },
  'data-table': {
    search: 'Rechercher…',
    reset: 'Réinitialiser',
    resetFilters: 'Réinitialiser les filtres',
    empty: 'Aucun résultat.',
    selectAll: 'Sélectionner toutes les lignes',
    selectRow: (name?: string) => `Sélectionner ${name || 'la ligne'}`,
    sortHint: 'Cliquez pour trier, Maj + clic pour trier sur plusieurs colonnes',
    results: (count: number, total?: number) =>
      `${plural(count, 'résultat', 'résultats')}${total === undefined ? '' : ` sur ${total}`}`,
    selected: (count: number, total: number) =>
      `${count} sur ${total} ${count < 2 ? 'sélectionnée' : 'sélectionnées'}`,
    pages: 'Pages',
    pageOf: (page: number, count: number) => `Page ${page} sur ${count}`,
    previousPage: 'Page précédente',
    nextPage: 'Page suivante',
    filterSelected: (count: number) => `${count} ${count < 2 ? 'sélectionné' : 'sélectionnés'}`,
    clearFilter: 'Effacer le filtre',
  },
  'date-picker': {
    placeholder: 'Choisir une date',
    rangePlaceholder: 'Choisir une période',
  },
  'date-range-picker': {
    placeholder: 'Choisir une période',
    apply: 'Appliquer',
    cancel: 'Annuler',
    presets: 'Périodes prédéfinies',
    today: 'Aujourd’hui',
    yesterday: 'Hier',
    last7Days: '7 derniers jours',
    last30Days: '30 derniers jours',
    thisMonth: 'Ce mois-ci',
    lastMonth: 'Le mois dernier',
    thisYear: 'Cette année',
  },
  dialog: {
    close: 'Fermer',
  },
  draggable: {
    draggable: 'déplaçable',
    panel: 'panneau',
    handle: 'Déplacer le panneau',
    ...drag,
  },
  drawer: {
    close: 'Fermer',
    resize: 'Redimensionner le panneau',
    dragToClose: 'Faire glisser pour fermer',
  },
  dropzone: {
    prompt: (multiple: boolean) =>
      multiple
        ? 'Déposez des fichiers ici ou appuyez pour les choisir'
        : 'Déposez un fichier ici ou appuyez pour le choisir',
    maxSize: (size: string) => `jusqu’à ${size} chacun`,
    maxFiles: (count: number) => `${plural(count, 'fichier', 'fichiers')} maximum`,
    anyFile: 'Tous types de fichiers',
    notAccepted: (name: string) => `Le type de ${name} n’est pas accepté.`,
    tooLarge: (name: string, size: string) => `${name} dépasse ${size}.`,
    tooMany: (name: string, limit: number) =>
      limit === 1
        ? `${name} n’a pas été ajouté : un seul fichier à la fois.`
        : `${name} n’a pas été ajouté : ${limit} fichiers maximum à la fois.`,
    added: (count: number) => `${plural(count, 'fichier ajouté', 'fichiers ajoutés')}.`,
    rejected: (count: number) => `${plural(count, 'fichier refusé', 'fichiers refusés')} :`,
    noFiles: 'Aucun fichier.',
  },
  'donut-chart': {
    total: 'Total',
    summary: (slices: string[], caption: string, total: string) =>
      `Graphique en anneau, ${slices.join(', ')}. ${caption} ${total}.`,
  },
  'dotted-map': {
    map: 'Carte du monde',
  },
  'expandable-card': {
    close: 'Fermer',
  },
  gallery: {
    open: (index: number, alt?: string) => (alt ? `Ouvrir ${alt}` : `Ouvrir l’image ${index}`),
    image: (index: number, count: number) => `Image ${index} sur ${count}`,
    help: 'Utilisez les flèches pour passer d’une image à l’autre et Échap pour fermer.',
    close: 'Fermer',
    previous: 'Image précédente',
    next: 'Image suivante',
    show: (index: number) => `Afficher l’image ${index}`,
  },
  globe: {
    globe: 'Globe 3D interactif',
  },
  'hold-to-confirm': {
    hint: 'Maintenez appuyé pour confirmer.',
    confirmed: 'Confirmé',
  },
  'inline-edit': {
    placeholder: 'Vide',
    saveError: 'Échec de l’enregistrement. Réessayez.',
    saving: 'Enregistrement…',
    saved: 'Enregistré',
  },
  'json-viewer': {
    search: 'Rechercher des clés et des valeurs',
    match: (current: number, total: number) => `${current} sur ${total}`,
    noMatches: 'Aucune correspondance',
    expandAll: 'Tout développer',
    collapseAll: 'Tout réduire',
    tree: 'JSON',
    size: (count: number, type: 'array' | 'object') =>
      type === 'array' ? plural(count, 'élément', 'éléments') : plural(count, 'clé', 'clés'),
    array: 'tableau',
    object: 'objet',
    showMore: (count: number) => `Afficher ${count} de plus`,
    left: (count: number) => plural(count, 'restant', 'restants'),
    copyValue: (path: string) => `Copier la valeur de ${path}`,
    copyPath: (path: string) => `Copier le chemin ${path}`,
    copyValueHint: 'Copier la valeur (c)',
    copyPathHint: 'Copier le chemin (p)',
    valueCopied: 'Valeur copiée',
    pathCopied: 'Chemin copié',
  },
  kanban: {
    card: 'élément triable',
    ...drag,
  },
  kbd: {
    command: 'Commande',
    control: 'Contrôle',
    windows: 'Windows',
    option: 'Option',
    alt: 'Alt',
    shift: 'Maj',
    return: 'Retour',
    enter: 'Entrée',
    delete: 'Supprimer',
    forwardDelete: 'Supprimer vers l’avant',
    backspace: 'Retour arrière',
    escape: 'Échap',
    tab: 'Tabulation',
    space: 'Espace',
    capsLock: 'Verr. Maj',
    upArrow: 'Flèche haut',
    downArrow: 'Flèche bas',
    leftArrow: 'Flèche gauche',
    rightArrow: 'Flèche droite',
    pageUp: 'Page précédente',
    pageDown: 'Page suivante',
    home: 'Début',
    end: 'Fin',
    plus: 'Plus',
  },
  map: {
    map: 'Carte',
    zoomIn: 'Zoom avant',
    zoomOut: 'Zoom arrière',
    close: 'Fermer',
  },
  'mention-input': {
    empty: 'Aucune correspondance',
    suggestions: 'Suggestions',
    count: (count: number, label?: string) =>
      `${count} ${label ?? (count < 2 ? 'suggestion' : 'suggestions')}`,
  },
  'metric-card': {
    loading: 'Chargement',
    up: 'En hausse',
    down: 'En baisse',
    noChange: 'Inchangé',
  },
  'multi-select': {
    placeholder: 'Sélectionner…',
    search: 'Rechercher…',
    empty: 'Aucun résultat.',
    selectAll: 'Tout sélectionner',
    clear: 'Effacer la sélection',
    remove: (label: string) => `Retirer ${label}`,
    noneSelected: 'Aucune sélection',
    selected: (count: number, labels: string) =>
      `${count} ${count < 2 ? 'sélectionné' : 'sélectionnés'} : ${labels}`,
  },
  navbar: {
    menu: 'Menu',
    openMenu: 'Ouvrir le menu',
    siteNavigation: 'Navigation du site',
    primary: 'Principale',
    more: 'Plus',
    morePages: 'Plus de pages',
  },
  'notification-center': {
    title: 'Notifications',
    unread: (label: string, count: number) =>
      `${label}, ${count} non ${count < 2 ? 'lue' : 'lues'}`,
    markAsRead: 'Marquer comme lue',
    unreadDot: 'Non lue',
    allTab: 'Toutes',
    unreadTab: 'Non lues',
    markAllAsRead: 'Tout marquer comme lu',
    caughtUp: 'Vous êtes à jour',
    caughtUpHint: 'Rien de nouveau depuis votre dernière visite.',
    empty: 'Aucune notification',
    emptyHint: 'Les nouvelles activités apparaîtront ici.',
  },
  'number-field': {
    decrement: 'Diminuer',
    increment: 'Augmenter',
  },
  'og-preview': {
    preview: (title: string) => `Aperçu de ${title}`,
  },
  pagination: {
    nav: 'Pagination',
    previous: 'Précédent',
    next: 'Suivant',
    previousPage: 'Aller à la page précédente',
    nextPage: 'Aller à la page suivante',
    page: (page: number) => `Page ${page}`,
    morePages: 'Plus de pages',
    pageOf: (page: number, count: number) => `Page ${page} sur ${count}`,
  },
  'password-field': {
    reveal: 'Afficher le mot de passe',
    strength: 'Robustesse du mot de passe',
    empty: 'Vide',
    weak: 'Faible',
    fair: 'Moyen',
    good: 'Bon',
    strong: 'Fort',
    avoidCommon: 'Évitez les mots de passe et les mots courants.',
    useLength: 'Utilisez au moins 12 caractères.',
    avoidSequences: 'Évitez les suites comme abcd ou 1234.',
    avoidRepeats: 'Évitez de répéter le même caractère.',
    mixCharacters: 'Mélangez majuscules, chiffres ou symboles.',
    addLength: 'Quelques caractères de plus le rendraient fort.',
    ruleLength: 'Au moins 12 caractères',
    ruleCase: 'Une minuscule et une majuscule',
    ruleNumber: 'Un chiffre',
    ruleSymbol: 'Un symbole',
  },
  'phone-input': {
    country: 'Pays',
    search: 'Rechercher un pays…',
    empty: 'Aucun pays trouvé.',
  },
  'reorderable-grid': {
    tile: 'élément de la grille',
    ...drag,
  },
  'resizable-panels': {
    handle: 'Redimensionner les panneaux',
  },
  'rich-text-editor': {
    placeholder: 'Écrivez quelque chose ou tapez « / » pour insérer un bloc…',
    editor: 'Éditeur',
    formatting: 'Mise en forme',
    blocks: 'Blocs',
    linkPlaceholder: 'Collez ou saisissez un lien',
    linkAddress: 'Adresse du lien',
    applyLink: 'Appliquer le lien',
    removeLink: 'Supprimer le lien',
    bold: 'Gras',
    italic: 'Italique',
    underline: 'Souligné',
    strikethrough: 'Barré',
    code: 'Code',
    link: 'Lien',
    heading: 'Titre',
    bulletedList: 'Liste à puces',
    numberedList: 'Liste numérotée',
    quote: 'Citation',
    text: 'Texte',
    heading1: 'Titre 1',
    heading2: 'Titre 2',
    heading3: 'Titre 3',
    divider: 'Séparateur',
  },
  safari: {
    search: 'Rechercher ou entrer le nom du site',
  },
  'scratch-reveal': {
    hint: 'Grattez pour découvrir',
    reveal: 'Afficher le contenu masqué',
  },
  'scroll-progress': {
    backToTop: 'Retour en haut',
  },
  'search-field': {
    placeholder: 'Rechercher…',
    clear: 'Effacer la recherche',
  },
  sidebar: {
    menu: 'Menu',
    navigation: 'Navigation',
    toggle: 'Afficher ou masquer la barre latérale',
  },
  'signature-pad': {
    pad: 'Signature',
    strokes: (count: number) => plural(count, 'trait', 'traits'),
    empty: 'vide',
    undo: 'Annuler',
    clear: 'Effacer',
    replay: 'Rejouer',
    placeholder: 'Signez ici',
  },
  sortable: {
    item: 'élément triable',
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
      `Tendance sur ${plural(count, 'valeur', 'valeurs')}${first !== undefined && last !== undefined ? `, de ${first} à ${last}` : ''}, minimum ${low}, maximum ${high}`,
    empty: 'Aucune donnée',
  },
  spinner: {
    loading: 'Chargement',
  },
  'split-button': {
    more: 'Plus d’options',
  },
  stepper: {
    complete: 'terminée',
    current: 'étape en cours',
    upcoming: 'non commencée',
    error: 'contient une erreur',
    stepOf: (step: number, count: number) => `Étape ${step} sur ${count}`,
  },
  'swipe-actions': {
    moreActions: (label: string) => `Plus d’actions pour ${label}`,
  },
  stories: {
    tray: 'Stories',
    group: (name: string, unseen: boolean) => (unseen ? `${name}, nouvelles stories` : name),
    story: (name: string, index: number, total: number) => `${name}, story ${index} sur ${total}`,
    previous: 'Story précédente',
    next: 'Story suivante',
    pause: 'Pause',
    play: 'Lecture',
    mute: 'Couper le son',
    unmute: 'Activer le son',
    close: 'Fermer les stories',
  },
  'swipe-deck': {
    deck: 'Cartes',
    like: 'J’aime',
    nope: 'Non',
    superLike: 'Super like',
    undo: 'Annuler',
    result: (direction: 'left' | 'right' | 'up') =>
      direction === 'right' ? 'Aimée' : direction === 'left' ? 'Passée' : 'Super like',
  },
  'vertical-feed': {
    feed: 'Fil',
    captions: 'Sous-titres. Déplacez-les avec les flèches ; Début les remet en place.',
  },
  'model-selector': {
    models: 'Modèle',
    effort: 'Effort',
    trigger: (model: string, effort?: string) =>
      effort ? `Modèle : ${model}, effort ${effort}` : `Modèle : ${model}`,
  },
  'prompt-input': {
    placeholder: 'Demandez ce que vous voulez…',
    attach: 'Joindre des fichiers',
    remove: (name: string) => `Retirer ${name}`,
    send: 'Envoyer',
    stop: 'Arrêter',
    tools: 'Outils',
    commands: 'Commandes',
  },
  'voice-input': {
    record: 'Enregistrer un message vocal',
    stop: 'Arrêter l’enregistrement',
    play: 'Lire',
    pause: 'Pause',
    discard: 'Supprimer',
    send: 'Envoyer',
    recording: (time: string) => `Enregistrement, ${time}`,
    denied: 'Le micro n’est pas disponible.',
  },
  'agent-steps': {
    steps: 'Étapes',
    working: (elapsed: string) => `En cours… ${elapsed}`,
    finished: (elapsed: string) => `Terminé en ${elapsed}`,
    status: { pending: 'À faire', running: 'En cours', done: 'Fait', error: 'Échec' },
    log: 'Journal',
  },
  'tool-approval': {
    calls: 'Appels d’outils',
    ask: (name: string) => `Autoriser ${name} ?`,
    approve: 'Approuver',
    deny: 'Refuser',
    destructive: 'Action irréversible. Maintenez pour approuver.',
    status: {
      pending: 'En attente',
      running: 'En cours',
      done: 'Fait',
      denied: 'Refusé',
      error: 'Échec',
    },
  },
  'context-meter': {
    trigger: (percent: number) => `Fenêtre de contexte remplie à ${percent} %`,
    title: 'Fenêtre de contexte',
    usage: (used: string, limit: string) => `${used} sur ${limit} jetons`,
    compact: 'Compacter',
    nearlyFull: 'Presque pleine. Compacter résume les anciens échanges pour faire de la place.',
  },
  citations: {
    chip: (index: number, title: string) => `Source ${index} : ${title}`,
    reading: (count: number) => `Lecture de ${count} ${count === 1 ? 'source' : 'sources'}`,
  },
  'diff-review': {
    files: 'Fichiers modifiés',
    accept: 'Accepter',
    reject: 'Rejeter',
    undo: 'Annuler',
    acceptAll: 'Tout accepter',
    changes: (added: number, removed: number) => `${added} ajoutées, ${removed} supprimées`,
    writing: 'Écriture…',
    decision: { accepted: 'Accepté', rejected: 'Rejeté' },
  },
  'autocomplete-input': {
    hint: (suggestion: string) =>
      `Suggestion : ${suggestion}. Tab l’accepte, la flèche droite un mot.`,
  },
  'token-alternatives': {
    token: (text: string, percent: number) =>
      `${text.trim()}, probable à ${percent} %. Voir les alternatives`,
    options: 'Autres mots envisagés',
  },
  'chat-branches': {
    conversation: 'Conversation',
    tree: 'Versions',
    node: (depth: number, version: number, of: number) =>
      `Message ${depth}, version ${version} sur ${of}`,
    version: (index: number, total: number) => `Version ${index} sur ${total}`,
    previous: 'Version précédente',
    next: 'Version suivante',
    edit: 'Modifier',
    save: 'Enregistrer et envoyer',
    cancel: 'Annuler',
  },
  'agent-lanes': {
    scrub: 'Durée de l’exécution',
    runningAt: (time: string) => `En cours à ${time}`,
    idle: 'Rien en cours',
    live: 'En direct',
  },
  'rewrite-selection': {
    text: 'Texte. Sélectionnez des mots pour les réécrire.',
    instruction: 'Comment réécrire la sélection',
    placeholder: 'Réécrire la sélection…',
    rewrite: 'Réécrire',
    accept: 'Accepter',
    discard: 'Abandonner',
    retry: 'Réessayer',
    writing: 'Réécriture…',
    review: 'Relisez la réécriture',
    added: 'ajouté',
    removed: 'supprimé',
  },
  'message-queue': {
    queue: (count: number) =>
      count === 1 ? '1 message en attente' : `${count} messages en attente`,
    placeholder: 'Envoyer un message…',
    send: 'Envoyer',
    queueIt: 'Mettre en attente',
    sendNow: 'Envoyer maintenant',
    edit: 'Modifier',
    save: 'Enregistrer',
    remove: 'Retirer',
    moveUp: 'Monter',
    moveDown: 'Descendre',
  },
  'redact-prompt': {
    placeholder: 'Écrivez un prompt…',
    preview: 'Ce que voit le modèle',
    show: 'Voir ce que voit le modèle',
    hide: 'Masquer ce que voit le modèle',
    masked: (count: number) => (count === 1 ? '1 valeur masquée' : `${count} valeurs masquées`),
    kinds: {
      email: 'E-mail',
      phone: 'Téléphone',
      card: 'Numéro de carte',
      key: 'Clé d’API',
      term: 'Nom',
    },
  },
  'memory-list': {
    title: 'Mémoire',
    count: (count: number) => (count === 1 ? '1 chose retenue' : `${count} choses retenues`),
    empty: 'Rien d’enregistré pour l’instant. Ce qu’il apprend sur vous apparaît ici.',
    edit: 'Modifier',
    save: 'Enregistrer',
    cancel: 'Annuler',
    forget: 'Oublier',
    updated: 'Mis à jour',
  },
  'amount-pad': {
    amount: 'Montant',
    keypad: 'Pavé numérique',
    delete: 'Effacer',
    decimal: 'Virgule',
  },
  'slide-to-confirm': {
    hint: 'Faites glisser jusqu’au bout, ou utilisez la flèche droite jusqu’au bout, pour confirmer.',
    confirmed: 'Confirmé',
  },
  'save-button': {
    save: 'Enregistrer',
    saved: (collection: string) => `Enregistré dans ${collection}`,
    choose: 'Choisir une collection',
    savedTo: 'Enregistré dans',
    newCollection: 'Nouvelle collection',
    create: 'Créer',
    remove: 'Retirer des enregistrements',
  },
  'cart-button': {
    add: 'Ajouter',
    quantity: (item: string) => `Quantité de ${item}`,
    increase: 'En ajouter un',
    decrease: 'En retirer un',
    remove: 'Retirer du panier',
    inCart: (count: number) => `${count} dans le panier`,
  },
  'undo-button': {
    undo: (seconds: number) => `Annuler, encore ${seconds} s`,
    done: 'Terminé',
  },
  'tip-selector': {
    tip: 'Pourboire',
    percent: (percent: number) => `${percent} %`,
    tipAmount: 'Pourboire',
    total: 'Total',
    roundUp: 'Arrondir le total',
  },
  'seat-map': {
    map: 'Places',
    screen: 'Écran',
    seat: (row: string, number: number, state: 'available' | 'taken' | 'selected') =>
      `Rang ${row}, place ${number}, ${state === 'available' ? 'libre' : state === 'taken' ? 'occupée' : 'choisie'}`,
    stranded: (seats: string[]) =>
      seats.length === 1
        ? `La place ${seats[0]} resterait isolée.`
        : `Les places ${seats.join(', ')} resteraient isolées.`,
    legend: { available: 'Libre', selected: 'Les vôtres', taken: 'Occupée' },
  },
  'slot-picker': {
    day: 'Jour',
    meeting: (from: string, to: string) => `Réunion de ${from} à ${to}`,
    resize: 'Durée de la réunion',
    hostTime: (from: string, to: string, zone: string) => `${from} – ${to} pour l’hôte (${zone})`,
    busy: 'Occupé',
  },
  'timezone-planner': {
    dial: 'Heure de la réunion',
    meeting: (time: string) => `Réunion à ${time}`,
    parts: { work: 'Au travail', awake: 'Hors travail', asleep: 'Endormi' },
    allWorking: 'Tout le monde est en heures de travail.',
    outside: (count: number) =>
      count === 1
        ? '1 personne est hors des heures de travail.'
        : `${count} personnes sont hors des heures de travail.`,
  },
  'boarding-pass': {
    passenger: 'Passager',
    flight: 'Vol',
    gate: 'Porte',
    boards: 'Embarquement',
    departs: 'Départ',
    seat: 'Siège',
    changed: (field: string, from: string, to: string) => `${field} : ${from} devient ${to}`,
  },
  'currency-transfer': {
    rate: (from: string, rate: string, to: string) => `1 ${from} = ${rate} ${to}`,
    reference: 'Référence',
    stepState: (state: 'done' | 'current' | 'next') =>
      state === 'done' ? 'fait' : state === 'current' ? 'en cours' : 'à venir',
  },
  'team-selector': {
    seats: 'Sièges',
    more: 'Ajouter un siège',
    fewer: 'Retirer un siège',
    per: 'par mois',
    hint: 'Faites glisser sur le côté ou utilisez les flèches pour le changer.',
  },
  'location-picker': {
    map: 'Point de prise en charge',
    finding: 'Recherche de l’adresse…',
    pickup: (address: string) => `Prise en charge au ${address}`,
    hint: 'Déplacez la carte pour placer le repère. Les flèches la déplacent aussi.',
  },
  'receipt-printer': {
    receipt: 'Reçu',
    total: 'Total',
    tear: 'Détacher',
    printing: 'Impression…',
    hint: 'Tirez le reçu vers le bas pour le détacher, ou utilisez le bouton Détacher.',
  },
  'bell-button': {
    subscribe: 'S’abonner',
    subscribed: 'Abonné',
  },
  'particle-button': {
    working: 'En cours…',
    done: 'Terminé',
    failed: 'Un problème est survenu',
  },
  'tear-button': {
    hint: 'Tirez le talon pour le détacher, ou maintenez Espace ou Entrée.',
    confirmed: 'Confirmé',
  },
  'pull-cord': {
    light: 'Lumière',
  },
  'marking-menu': {
    hint: 'Maintenez appuyé, allez vers une option et relâchez. Ou appuyez sur Entrée et utilisez les flèches.',
  },
  toolbar: {
    toolbar: 'Outils',
    move: 'Déplacer la barre : faites-la glisser, ou appuyez sur Maj et une flèche, vers un autre bord.',
    more: (tool: string) => `Autres outils ${tool}`,
  },
  'profile-dropdown': {
    account: (name: string) => `Compte : ${name}`,
    switchAccount: 'Changer de compte',
    status: 'Statut',
    statuses: { online: 'En ligne', away: 'Absent', busy: 'Ne pas déranger' },
    theme: 'Thème',
    themes: { light: 'Clair', dark: 'Sombre', system: 'Système' },
    signOut: 'Maintenez pour vous déconnecter',
  },
  'morph-popover': {
    close: 'Fermer',
    submit: 'Envoyer',
    sending: 'Envoi…',
    done: 'Envoyé',
  },
  'stack-panel': {
    back: (to: string) => `Retour à ${to}`,
  },
  'morphic-navbar': {
    nav: 'Principale',
  },
  'scroll-index': {
    index: 'Sur cette page',
  },
  'spoiler-text': {
    reveal: 'Spoiler, appuyez pour le voir',
  },
  'tag-input': {
    remove: (tag: string) => `Retirer ${tag}`,
    max: (max: number) => `Jusqu’à ${plural(max, 'étiquette', 'étiquettes')}.`,
    duplicate: (tag: string) => `${tag} est déjà dans la liste.`,
    added: (tags: string) => `Ajouté : ${tags}.`,
    removed: (tag: string) => `Retiré : ${tag}.`,
  },
  terminal: {
    replay: 'Rejouer',
  },
  'theme-switch': {
    darkMode: 'Mode sombre',
  },
  'three-viewer': {
    reset: 'Réinitialiser la vue',
    zoomIn: 'Zoom avant',
    zoomOut: 'Zoom arrière',
    autoRotate: 'Rotation automatique',
    views: 'Vues de la caméra',
    viewFront: 'Vue de face',
    viewBack: 'Vue arrière',
    viewLeft: 'Vue gauche',
    viewRight: 'Vue droite',
    viewTop: 'Vue de dessus',
    viewIso: 'Vue isométrique',
    wireframe: 'Basculer le fil de fer',
    background: 'Changer le fond',
    screenshot: 'Capture d’écran',
    fullscreen: 'Plein écran',
  },
  'time-picker': {
    hour: 'Heures',
    minute: 'Minutes',
    second: 'Secondes',
    period: 'AM/PM',
    list: 'Choisir une heure',
    empty: 'Vide',
  },
  toast: {
    region: 'Notifications',
    close: 'Fermer',
  },
  tour: {
    next: 'Suivant',
    back: 'Retour',
    done: 'Terminé',
    skip: 'Passer la visite',
    exit: 'Quitter',
    progress: (current: number, total: number) => `${current} sur ${total}`,
  },
  'tree-view': {
    loadFailed: 'échec du chargement, ouvrez pour réessayer',
  },
  'tweet-card': {
    reply: 'Répondre',
    repost: 'Reposter',
    like: "J'aime",
    views: 'Vues',
    verified: 'Compte vérifié',
    quoted: 'Publication citée',
  },
  'usage-meter': {
    warning: 'Presque plein',
    over: (overage: string) => `Dépassement de ${overage}`,
    amount: (used: string, limit: string) => `${used} sur ${limit}`,
    valueText: (used: string, limit: string) => `${used} utilisés sur ${limit}`,
    almostFull: 'presque plein',
    overLimit: (overage: string) => `limite dépassée de ${overage}`,
    free: 'Disponible',
  },
  'video-player': {
    player: 'Lecteur vidéo',
    play: 'Lire',
    pause: 'Pause',
    replay: 'Relire',
    mute: 'Couper le son',
    unmute: 'Activer le son',
    volume: 'Volume',
    seek: 'Position',
    fullscreen: 'Plein écran',
    exitFullscreen: 'Quitter le plein écran',
    pictureInPicture: 'Image dans l’image',
    captions: 'Sous-titres',
    speed: (rate: number) => `Vitesse ${rate}×`,
    progress: (current: string, total: string) => `${current} sur ${total}`,
  },
} satisfies LabelsPack
