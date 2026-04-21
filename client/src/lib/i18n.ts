export type LangCode = "en" | "es" | "fr" | "de" | "sk" | "cs";

export const LANGUAGES: { code: LangCode; label: string }[] = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" },
  { code: "sk", label: "Slovenčina" },
  { code: "cs", label: "Čeština" },
];

export type Translations = {
  // Shared / navigation
  backToLogin: string;
  changeLanguage: string;
  logout: string;
  logOut: string;
  cancel: string;
  logoutPrompt: string;

  // Login face
  mobileAuth: string;
  appSubtext: string;
  username: string;
  enterLdapId: string;
  password: string;
  authenticating: string;
  signIn: string;
  forgotPassword: string;
  signUp: string;
  loginSuccess: string;
  redirectingHome: string;
  loginFailed: string;

  // Register face
  register: string;
  firstName: string;
  lastName: string;
  displayName: string;
  visibleInChat: string;
  ldapUid: string;
  email: string;
  emailForNotifications: string;
  confirm: string;
  submitting: string;
  submitRequest: string;
  registrationSuccess: string;
  redirectingLogin: string;

  // Reset password face
  resetPassword: string;
  enterNewPassword: string;
  newPassword: string;
  confirmPassword: string;
  updating: string;
  sendResetLink: string;
  sendResetLinkPrompt: string;
  sending: string;

  // Post-login: Chats face
  chats: string;
  noChatsYet: string;
  addContactsToStart: string;
  couldNotLoadChats: string;

  // Post-login: Contacts face
  contacts: string;
  backToChats: string;
  addPublicUser: string;
  loadingUsers: string;
  noPublicUsers: string;
  requestByName: string;
  enterDisplayName: string;
  sendRequest: string;
  backendNotImplemented: string;
  privateRequestSent: string;
  noContactsYet: string;
  useButtonsAbove: string;
  couldNotLoadContacts: string;
  added: string;
  addedDate: string;
  contactList: string;
  whoseContactAmI: string;
  chatSoon: string;
  requests: string;
  incomingRequests: string;
  outgoingRequests: string;
  approveRequest: string;
  rejectRequest: string;
  cancelRequest: string;
  requestPending: string;
  cannotBeRequested: string;
  noIncomingRequests: string;
  noOutgoingRequests: string;

  // Post-login: Settings face
  userSettings: string;
  settingsSaved: string;
  settingsSavedMsg: string;
  language: string;
  maxChatParticipants: string;
  timezone: string;
  makeProfilePublic: string;
  allowContactRequests: string;
  saving: string;
  saveSettings: string;
  loadingSettings: string;
  couldNotLoadSettings: string;

  // Post-login: Chat face
  chat: string;
  openConversation: string;

  // Dialogs
  ok: string;
  confirmAction: string;

  // Toast / handler error strings
  passwordsMustMatch: string;
  registrationFailed: string;
  resetFailed: string;
  tryAgain: string;
  resetSent: string;
  checkInbox: string;
  tokenMissing: string;
  unableToReset: string;
  passwordUpdated: string;
  signInNewPassword: string;
};

const translations: Record<LangCode, Translations> = {
  en: {
    backToLogin: "Back to login",
    changeLanguage: "Change language",
    logout: "Logout",
    logOut: "Log out",
    cancel: "Cancel",
    logoutPrompt: "Click below to end your session and return to the login page.",
    mobileAuth: "Mobile Auth",
    appSubtext: "instructions will come here later - in development.",
    username: "Username",
    enterLdapId: "Enter LDAP ID",
    password: "Password",
    authenticating: "Authenticating",
    signIn: "Sign In",
    forgotPassword: "Forgot your password?",
    signUp: "Sign up!",
    loginSuccess: "✓ Login successful!",
    redirectingHome: "Redirecting to home...",
    loginFailed: "✗ Login failed",
    register: "Register",
    firstName: "First name",
    lastName: "Last name",
    displayName: "Display name",
    visibleInChat: "Visible in chat",
    ldapUid: "LDAP UID",
    email: "Email",
    emailForNotifications: "Email for notifications",
    confirm: "Confirm",
    submitting: "Submitting",
    submitRequest: "Submit request",
    registrationSuccess: "✓ Registration successful!",
    redirectingLogin: "Redirecting to login...",
    resetPassword: "Reset password",
    enterNewPassword: "Enter a new password for your account.",
    newPassword: "New password",
    confirmPassword: "Confirm password",
    updating: "Updating",
    sendResetLink: "Send reset link",
    sendResetLinkPrompt: "Send a reset link to your email.",
    sending: "Sending",
    chats: "Chats",
    noChatsYet: "No chats yet",
    addContactsToStart: "Add contacts to start chatting.",
    couldNotLoadChats: "Could not load chats",
    contacts: "Contacts",
    backToChats: "Back to Chats",
    addPublicUser: "+/− Public User",
    loadingUsers: "Loading users...",
    noPublicUsers: "No public users available",
    requestByName: "+/− Private User",
    enterDisplayName: "Enter display name",
    sendRequest: "Send Request",
    backendNotImplemented: "For non-public users only. Backend coming soon.",
    privateRequestSent: "If the user exists, they will be notified.",
    noContactsYet: "No contacts yet",
    useButtonsAbove: "Use the buttons above to add contacts.",
    couldNotLoadContacts: "Could not load contacts",
    added: "Added",
    addedDate: "Added:",
    contactList: "Contact List",
    whoseContactAmI: "Whose contact am I?",
    chatSoon: "Chat (coming soon)",
    requests: "Requests",
    incomingRequests: "Incoming",
    outgoingRequests: "Outgoing",
    approveRequest: "Approve",
    rejectRequest: "Reject",
    cancelRequest: "Cancel",
    requestPending: "Request pending",
    cannotBeRequested: "Not accepting requests",
    noIncomingRequests: "No incoming requests",
    noOutgoingRequests: "No outgoing requests",
    userSettings: "User Settings",
    settingsSaved: "Success!",
    settingsSavedMsg: "Settings saved successfully.",
    language: "Language",
    maxChatParticipants: "Max Chat Participants",
    timezone: "Timezone",
    makeProfilePublic: "Make profile public",
    allowContactRequests: "Allow contact requests",
    saving: "Saving...",
    saveSettings: "Save Settings",
    loadingSettings: "Loading settings...",
    couldNotLoadSettings: "Could not load settings",
    chat: "Chat",
    openConversation: "Open a conversation from the Chats face.",
    ok: "OK",
    confirmAction: "Confirm",
    passwordsMustMatch: "Passwords must match",
    registrationFailed: "Registration failed",
    resetFailed: "Reset failed",
    tryAgain: "Try again",
    resetSent: "Reset sent",
    checkInbox: "Check your inbox",
    tokenMissing: "Token is missing",
    unableToReset: "Unable to reset password",
    passwordUpdated: "Password updated",
    signInNewPassword: "Sign in with your new password",
  },
  es: {
    backToLogin: "Volver al inicio",
    changeLanguage: "Cambiar idioma",
    logout: "Cerrar sesión",
    logOut: "Cerrar sesión",
    cancel: "Cancelar",
    logoutPrompt: "Haz clic abajo para cerrar tu sesión y volver a la página de inicio.",
    mobileAuth: "Auth Móvil",
    appSubtext: "las instrucciones estarán aquí pronto - en desarrollo.",
    username: "Usuario",
    enterLdapId: "Introduce el ID LDAP",
    password: "Contraseña",
    authenticating: "Autenticando",
    signIn: "Iniciar sesión",
    forgotPassword: "¿Olvidaste tu contraseña?",
    signUp: "¡Regístrate!",
    loginSuccess: "✓ ¡Inicio de sesión exitoso!",
    redirectingHome: "Redirigiendo al inicio...",
    loginFailed: "✗ Error al iniciar sesión",
    register: "Registrarse",
    firstName: "Nombre",
    lastName: "Apellido",
    displayName: "Nombre visible",
    visibleInChat: "Visible en el chat",
    ldapUid: "UID LDAP",
    email: "Correo electrónico",
    emailForNotifications: "Correo para notificaciones",
    confirm: "Confirmar",
    submitting: "Enviando",
    submitRequest: "Enviar solicitud",
    registrationSuccess: "✓ ¡Registro exitoso!",
    redirectingLogin: "Redirigiendo al inicio...",
    resetPassword: "Restablecer contraseña",
    enterNewPassword: "Introduce una nueva contraseña para tu cuenta.",
    newPassword: "Nueva contraseña",
    confirmPassword: "Confirmar contraseña",
    updating: "Actualizando",
    sendResetLink: "Enviar enlace de restablecimiento",
    sendResetLinkPrompt: "Envía un enlace de restablecimiento a tu correo.",
    sending: "Enviando",
    chats: "Chats",
    noChatsYet: "Aún no hay chats",
    addContactsToStart: "Añade contactos para empezar a chatear.",
    couldNotLoadChats: "No se pudieron cargar los chats",
    contacts: "Contactos",
    backToChats: "Volver a Chats",
    addPublicUser: "+/− Usuario Público",
    loadingUsers: "Cargando usuarios...",
    noPublicUsers: "No hay usuarios públicos disponibles",
    requestByName: "+/− Usuario Privado",
    enterDisplayName: "Introduce el nombre visible",
    sendRequest: "Enviar solicitud",
    backendNotImplemented: "Solo usuarios no públicos. Backend próximamente.",
    privateRequestSent: "Si el usuario existe, será notificado.",
    noContactsYet: "Aún no hay contactos",
    useButtonsAbove: "Usa los botones de arriba para añadir contactos.",
    couldNotLoadContacts: "No se pudieron cargar los contactos",
    added: "Añadido",
    addedDate: "Añadido:",
    contactList: "Lista de contactos",
    whoseContactAmI: "¿De quién soy contacto?",
    chatSoon: "Chat (próximamente)",
    requests: "Solicitudes",
    incomingRequests: "Entrantes",
    outgoingRequests: "Salientes",
    approveRequest: "Aprobar",
    rejectRequest: "Rechazar",
    cancelRequest: "Cancelar",
    requestPending: "Solicitud en espera",
    cannotBeRequested: "No acepta solicitudes",
    noIncomingRequests: "Sin solicitudes entrantes",
    noOutgoingRequests: "Sin solicitudes salientes",
    userSettings: "Configuración",
    settingsSaved: "¡Éxito!",
    settingsSavedMsg: "Configuración guardada correctamente.",
    language: "Idioma",
    maxChatParticipants: "Máx. participantes en chat",
    timezone: "Zona horaria",
    makeProfilePublic: "Hacer perfil público",
    allowContactRequests: "Permitir solicitudes de contacto",
    saving: "Guardando...",
    saveSettings: "Guardar configuración",
    loadingSettings: "Cargando configuración...",
    couldNotLoadSettings: "No se pudo cargar la configuración",
    chat: "Chat",
    openConversation: "Abre una conversación desde la cara de Chats.",
    ok: "Aceptar",
    confirmAction: "Confirmar",
    passwordsMustMatch: "Las contraseñas no coinciden",
    registrationFailed: "Error en el registro",
    resetFailed: "Error al restablecer",
    tryAgain: "Inténtalo de nuevo",
    resetSent: "Enlace enviado",
    checkInbox: "Revisa tu bandeja de entrada",
    tokenMissing: "El token no está disponible",
    unableToReset: "No se pudo restablecer la contraseña",
    passwordUpdated: "Contraseña actualizada",
    signInNewPassword: "Inicia sesión con tu nueva contraseña",
  },
  fr: {
    backToLogin: "Retour à la connexion",
    changeLanguage: "Changer de langue",
    logout: "Déconnexion",
    logOut: "Se déconnecter",
    cancel: "Annuler",
    logoutPrompt: "Cliquez ci-dessous pour terminer votre session et revenir à la page de connexion.",
    mobileAuth: "Auth Mobile",
    appSubtext: "les instructions seront disponibles bientôt - en développement.",
    username: "Nom d'utilisateur",
    enterLdapId: "Entrez l'ID LDAP",
    password: "Mot de passe",
    authenticating: "Authentification",
    signIn: "Se connecter",
    forgotPassword: "Mot de passe oublié ?",
    signUp: "S'inscrire !",
    loginSuccess: "✓ Connexion réussie !",
    redirectingHome: "Redirection vers l'accueil...",
    loginFailed: "✗ Échec de la connexion",
    register: "S'inscrire",
    firstName: "Prénom",
    lastName: "Nom de famille",
    displayName: "Nom affiché",
    visibleInChat: "Visible dans le chat",
    ldapUid: "UID LDAP",
    email: "E-mail",
    emailForNotifications: "E-mail pour les notifications",
    confirm: "Confirmer",
    submitting: "Envoi en cours",
    submitRequest: "Envoyer la demande",
    registrationSuccess: "✓ Inscription réussie !",
    redirectingLogin: "Redirection vers la connexion...",
    resetPassword: "Réinitialiser le mot de passe",
    enterNewPassword: "Entrez un nouveau mot de passe pour votre compte.",
    newPassword: "Nouveau mot de passe",
    confirmPassword: "Confirmer le mot de passe",
    updating: "Mise à jour",
    sendResetLink: "Envoyer le lien de réinitialisation",
    sendResetLinkPrompt: "Envoyez un lien de réinitialisation à votre e-mail.",
    sending: "Envoi en cours",
    chats: "Discussions",
    noChatsYet: "Aucune discussion pour l'instant",
    addContactsToStart: "Ajoutez des contacts pour commencer à discuter.",
    couldNotLoadChats: "Impossible de charger les discussions",
    contacts: "Contacts",
    backToChats: "Retour aux discussions",
    addPublicUser: "+/− Utilisateur Public",
    loadingUsers: "Chargement des utilisateurs...",
    noPublicUsers: "Aucun utilisateur public disponible",
    requestByName: "+/− Utilisateur Privé",
    enterDisplayName: "Entrez le nom affiché",
    sendRequest: "Envoyer la demande",
    backendNotImplemented: "Utilisateurs non publics uniquement. Backend bientôt disponible.",
    privateRequestSent: "Si l'utilisateur existe, il sera notifié.",
    noContactsYet: "Aucun contact pour l'instant",
    useButtonsAbove: "Utilisez les boutons ci-dessus pour ajouter des contacts.",
    couldNotLoadContacts: "Impossible de charger les contacts",
    added: "Ajouté",
    addedDate: "Ajouté :",
    contactList: "Liste de contacts",
    whoseContactAmI: "Dont je suis le contact ?",
    chatSoon: "Chat (bientôt disponible)",    requests: "Demandes",
    incomingRequests: "Reçues",
    outgoingRequests: "Envoyées",
    approveRequest: "Approuver",
    rejectRequest: "Refuser",
    cancelRequest: "Annuler",
    requestPending: "Demande en attente",
    cannotBeRequested: "N'accepte pas les demandes",
    noIncomingRequests: "Aucune demande reçue",
    noOutgoingRequests: "Aucune demande envoyée",    userSettings: "Paramètres utilisateur",
    settingsSaved: "Succès !",
    settingsSavedMsg: "Paramètres enregistrés avec succès.",
    language: "Langue",
    maxChatParticipants: "Participants max. par chat",
    timezone: "Fuseau horaire",
    makeProfilePublic: "Rendre le profil public",
    allowContactRequests: "Autoriser les demandes de contact",
    saving: "Enregistrement...",
    saveSettings: "Enregistrer les paramètres",
    loadingSettings: "Chargement des paramètres...",
    couldNotLoadSettings: "Impossible de charger les paramètres",
    chat: "Chat",
    openConversation: "Ouvrez une conversation depuis la face Discussions.",
    ok: "OK",
    confirmAction: "Confirmer",
    passwordsMustMatch: "Les mots de passe ne correspondent pas",
    registrationFailed: "Échec de l'inscription",
    resetFailed: "Échec de la réinitialisation",
    tryAgain: "Réessayer",
    resetSent: "Lien envoyé",
    checkInbox: "Vérifiez votre boîte de réception",
    tokenMissing: "Le jeton est manquant",
    unableToReset: "Impossible de réinitialiser le mot de passe",
    passwordUpdated: "Mot de passe mis à jour",
    signInNewPassword: "Connectez-vous avec votre nouveau mot de passe",
  },
  de: {
    backToLogin: "Zurück zur Anmeldung",
    changeLanguage: "Sprache ändern",
    logout: "Abmelden",
    logOut: "Abmelden",
    cancel: "Abbrechen",
    logoutPrompt: "Klicken Sie unten, um Ihre Sitzung zu beenden und zur Anmeldeseite zurückzukehren.",
    mobileAuth: "Mobile Auth",
    appSubtext: "Anweisungen folgen in Kürze – in Entwicklung.",
    username: "Benutzername",
    enterLdapId: "LDAP-ID eingeben",
    password: "Passwort",
    authenticating: "Authentifizierung",
    signIn: "Anmelden",
    forgotPassword: "Passwort vergessen?",
    signUp: "Registrieren!",
    loginSuccess: "✓ Anmeldung erfolgreich!",
    redirectingHome: "Weiterleitung zur Startseite...",
    loginFailed: "✗ Anmeldung fehlgeschlagen",
    register: "Registrieren",
    firstName: "Vorname",
    lastName: "Nachname",
    displayName: "Anzeigename",
    visibleInChat: "Im Chat sichtbar",
    ldapUid: "LDAP-UID",
    email: "E-Mail",
    emailForNotifications: "E-Mail für Benachrichtigungen",
    confirm: "Bestätigen",
    submitting: "Wird gesendet",
    submitRequest: "Anfrage senden",
    registrationSuccess: "✓ Registrierung erfolgreich!",
    redirectingLogin: "Weiterleitung zur Anmeldung...",
    resetPassword: "Passwort zurücksetzen",
    enterNewPassword: "Geben Sie ein neues Passwort für Ihr Konto ein.",
    newPassword: "Neues Passwort",
    confirmPassword: "Passwort bestätigen",
    updating: "Wird aktualisiert",
    sendResetLink: "Link zum Zurücksetzen senden",
    sendResetLinkPrompt: "Senden Sie einen Link zum Zurücksetzen an Ihre E-Mail.",
    sending: "Wird gesendet",
    chats: "Chats",
    noChatsYet: "Noch keine Chats",
    addContactsToStart: "Fügen Sie Kontakte hinzu, um zu chatten.",
    couldNotLoadChats: "Chats konnten nicht geladen werden",
    contacts: "Kontakte",
    backToChats: "Zurück zu Chats",
    addPublicUser: "+/− Öffentlicher Nutzer",
    loadingUsers: "Nutzer werden geladen...",
    noPublicUsers: "Keine öffentlichen Nutzer verfügbar",
    requestByName: "+/− Privater Nutzer",
    enterDisplayName: "Anzeigenamen eingeben",
    sendRequest: "Anfrage senden",
    backendNotImplemented: "Nur nicht-öffentliche Nutzer. Backend folgt bald.",
    privateRequestSent: "Wenn der Nutzer existiert, wird er benachrichtigt.",
    noContactsYet: "Noch keine Kontakte",
    useButtonsAbove: "Nutzen Sie die Schaltflächen oben, um Kontakte hinzuzufügen.",
    couldNotLoadContacts: "Kontakte konnten nicht geladen werden",
    added: "Hinzugefügt",
    addedDate: "Hinzugefügt:",
    contactList: "Kontaktliste",
    whoseContactAmI: "Wessen Kontakt bin ich?",
    chatSoon: "Chat (demnächst)",
    requests: "Anfragen",
    incomingRequests: "Eingehend",
    outgoingRequests: "Ausgehend",
    approveRequest: "Annehmen",
    rejectRequest: "Ablehnen",
    cancelRequest: "Abbrechen",
    requestPending: "Anfrage ausstehend",
    cannotBeRequested: "Akzeptiert keine Anfragen",
    noIncomingRequests: "Keine eingehenden Anfragen",
    noOutgoingRequests: "Keine ausgehenden Anfragen",
    userSettings: "Benutzereinstellungen",
    settingsSaved: "Erfolg!",
    settingsSavedMsg: "Einstellungen erfolgreich gespeichert.",
    language: "Sprache",
    maxChatParticipants: "Max. Chat-Teilnehmer",
    timezone: "Zeitzone",
    makeProfilePublic: "Profil öffentlich machen",
    allowContactRequests: "Kontaktanfragen erlauben",
    saving: "Speichern...",
    saveSettings: "Einstellungen speichern",
    loadingSettings: "Einstellungen werden geladen...",
    couldNotLoadSettings: "Einstellungen konnten nicht geladen werden",
    chat: "Chat",
    openConversation: "Öffnen Sie ein Gespräch von der Chats-Seite.",
    ok: "OK",
    confirmAction: "Bestätigen",
    passwordsMustMatch: "Passwörter stimmen nicht überein",
    registrationFailed: "Registrierung fehlgeschlagen",
    resetFailed: "Zurücksetzen fehlgeschlagen",
    tryAgain: "Erneut versuchen",
    resetSent: "Link gesendet",
    checkInbox: "Überprüfen Sie Ihren Posteingang",
    tokenMissing: "Token fehlt",
    unableToReset: "Passwort konnte nicht zurückgesetzt werden",
    passwordUpdated: "Passwort aktualisiert",
    signInNewPassword: "Melden Sie sich mit Ihrem neuen Passwort an",
  },
  sk: {
    backToLogin: "Späť na prihlásenie",
    changeLanguage: "Zmeniť jazyk",
    logout: "Odhlásiť sa",
    logOut: "Odhlásiť sa",
    cancel: "Zrušiť",
    logoutPrompt: "Kliknite nižšie a ukončite reláciu. Vrátite sa na prihlasovaciu stránku.",
    mobileAuth: "Mobilná autentifikácia",
    appSubtext: "pokyny budú k dispozícii čoskoro – vo vývoji.",
    username: "Používateľské meno",
    enterLdapId: "Zadajte LDAP ID",
    password: "Heslo",
    authenticating: "Overovanie",
    signIn: "Prihlásiť sa",
    forgotPassword: "Zabudli ste heslo?",
    signUp: "Zaregistrovať sa!",
    loginSuccess: "✓ Prihlásenie úspešné!",
    redirectingHome: "Presmerovanie na domovskú stránku...",
    loginFailed: "✗ Prihlásenie zlyhalo",
    register: "Registrácia",
    firstName: "Meno",
    lastName: "Priezvisko",
    displayName: "Zobrazované meno",
    visibleInChat: "Viditeľné v chate",
    ldapUid: "LDAP UID",
    email: "E-mail",
    emailForNotifications: "E-mail pre oznámenia",
    confirm: "Potvrdiť",
    submitting: "Odosielanie",
    submitRequest: "Odoslať žiadosť",
    registrationSuccess: "✓ Registrácia úspešná!",
    redirectingLogin: "Presmerovanie na prihlásenie...",
    resetPassword: "Obnoviť heslo",
    enterNewPassword: "Zadajte nové heslo pre váš účet.",
    newPassword: "Nové heslo",
    confirmPassword: "Potvrdiť heslo",
    updating: "Aktualizácia",
    sendResetLink: "Odoslať odkaz na obnovenie",
    sendResetLinkPrompt: "Odošleme vám odkaz na obnovenie hesla.",
    sending: "Odosielanie",
    chats: "Chaty",
    noChatsYet: "Zatiaľ žiadne chaty",
    addContactsToStart: "Pridajte kontakty a začnite chatovať.",
    couldNotLoadChats: "Chaty sa nepodarilo načítať",
    contacts: "Kontakty",
    backToChats: "Späť na chaty",
    addPublicUser: "+/− Verejný používateľ",
    loadingUsers: "Načítanie používateľov...",
    noPublicUsers: "Žiadni verejní používatelia nie sú k dispozícii",
    requestByName: "+/− Súkromný používateľ",
    enterDisplayName: "Zadajte zobrazované meno",
    sendRequest: "Odoslať žiadosť",
    backendNotImplemented: "Len neverejní používatelia. Backend čoskoro.",
    privateRequestSent: "Ak používateľ existuje, bude upovedomený.",
    noContactsYet: "Zatiaľ žiadne kontakty",
    useButtonsAbove: "Na pridanie kontaktov použite tlačidlá vyššie.",
    couldNotLoadContacts: "Kontakty sa nepodarilo načítať",
    added: "Pridané",
    addedDate: "Pridané:",
    contactList: "Zoznam kontaktov",
    whoseContactAmI: "Čí kontakt som?",
    chatSoon: "Chat (čoskoro)",
    requests: "Žiadosti",
    incomingRequests: "Prichádzajúce",
    outgoingRequests: "Odchádzajúce",
    approveRequest: "Schváliť",
    rejectRequest: "Odmietnuť",
    cancelRequest: "Zrušiť",
    requestPending: "Žiadosť čaká",
    cannotBeRequested: "Neprijíma žiadosti",
    noIncomingRequests: "Žiadne prichádzajúce žiadosti",
    noOutgoingRequests: "Žiadne odchádzajúce žiadosti",
    userSettings: "Nastavenia používateľa",
    settingsSaved: "Úspech!",
    settingsSavedMsg: "Nastavenia boli úspešne uložené.",
    language: "Jazyk",
    maxChatParticipants: "Max. účastníkov chatu",
    timezone: "Časové pásmo",
    makeProfilePublic: "Zverejniť profil",
    allowContactRequests: "Povoliť žiadosti o kontakt",
    saving: "Ukladanie...",
    saveSettings: "Uložiť nastavenia",
    loadingSettings: "Načítanie nastavení...",
    couldNotLoadSettings: "Nastavenia sa nepodarilo načítať",
    chat: "Chat",
    openConversation: "Otvorte konverzáciu zo strany Chaty.",
    ok: "OK",
    confirmAction: "Potvrdiť",
    passwordsMustMatch: "Heslá sa nezhodujú",
    registrationFailed: "Registrácia zlyhala",
    resetFailed: "Obnovenie zlyhalo",
    tryAgain: "Skúste znova",
    resetSent: "Odkaz odoslaný",
    checkInbox: "Skontrolujte svoju doručenú poštu",
    tokenMissing: "Token chýba",
    unableToReset: "Heslo sa nepodarilo obnoviť",
    passwordUpdated: "Heslo aktualizované",
    signInNewPassword: "Prihláste sa svojím novým heslom",
  },
  cs: {
    backToLogin: "Zpět na přihlášení",
    changeLanguage: "Změnit jazyk",
    logout: "Odhlásit se",
    logOut: "Odhlásit se",
    cancel: "Zrušit",
    logoutPrompt: "Klikněte níže a ukončete relaci. Vrátíte se na přihlašovací stránku.",
    mobileAuth: "Mobilní autentizace",
    appSubtext: "pokyny budou k dispozici brzy – ve vývoji.",
    username: "Uživatelské jméno",
    enterLdapId: "Zadejte LDAP ID",
    password: "Heslo",
    authenticating: "Ověřování",
    signIn: "Přihlásit se",
    forgotPassword: "Zapomněli jste heslo?",
    signUp: "Zaregistrovat se!",
    loginSuccess: "✓ Přihlášení úspěšné!",
    redirectingHome: "Přesměrování na hlavní stránku...",
    loginFailed: "✗ Přihlášení selhalo",
    register: "Registrace",
    firstName: "Jméno",
    lastName: "Příjmení",
    displayName: "Zobrazované jméno",
    visibleInChat: "Viditelné v chatu",
    ldapUid: "LDAP UID",
    email: "E-mail",
    emailForNotifications: "E-mail pro oznámení",
    confirm: "Potvrdit",
    submitting: "Odesílání",
    submitRequest: "Odeslat žádost",
    registrationSuccess: "✓ Registrace úspěšná!",
    redirectingLogin: "Přesměrování na přihlášení...",
    resetPassword: "Obnovit heslo",
    enterNewPassword: "Zadejte nové heslo pro váš účet.",
    newPassword: "Nové heslo",
    confirmPassword: "Potvrdit heslo",
    updating: "Aktualizace",
    sendResetLink: "Odeslat odkaz pro obnovení",
    sendResetLinkPrompt: "Odešleme vám odkaz pro obnovení hesla.",
    sending: "Odesílání",
    chats: "Chaty",
    noChatsYet: "Zatím žádné chaty",
    addContactsToStart: "Přidejte kontakty a začněte chatovat.",
    couldNotLoadChats: "Chaty se nepodařilo načíst",
    contacts: "Kontakty",
    backToChats: "Zpět na chaty",
    addPublicUser: "+/− Veřejný uživatel",
    loadingUsers: "Načítání uživatelů...",
    noPublicUsers: "Žádní veřejní uživatelé nejsou k dispozici",
    requestByName: "+/− Soukromý uživatel",
    enterDisplayName: "Zadejte zobrazované jméno",
    sendRequest: "Odeslat žádost",
    backendNotImplemented: "Pouze neveřejní uživatelé. Backend brzy.",
    privateRequestSent: "Pokud uživatel existuje, bude upozorněn.",
    noContactsYet: "Zatím žádné kontakty",
    useButtonsAbove: "K přidání kontaktů použijte tlačítka výše.",
    couldNotLoadContacts: "Kontakty se nepodařilo načíst",
    added: "Přidáno",
    addedDate: "Přidáno:",
    contactList: "Seznam kontaktů",
    whoseContactAmI: "Čí kontakt jsem?",
    chatSoon: "Chat (brzy)",
    requests: "Žádosti",
    incomingRequests: "Příchozí",
    outgoingRequests: "Odchozí",
    approveRequest: "Schválit",
    rejectRequest: "Odmítnout",
    cancelRequest: "Zrušit",
    requestPending: "Žádost čeká",
    cannotBeRequested: "Nepřijímá žádosti",
    noIncomingRequests: "Žádné příchozí žádosti",
    noOutgoingRequests: "Žádné odchozí žádosti",
    userSettings: "Nastavení uživatele",
    settingsSaved: "Úspěch!",
    settingsSavedMsg: "Nastavení bylo úspěšně uloženo.",
    language: "Jazyk",
    maxChatParticipants: "Max. účastníků chatu",
    timezone: "Časové pásmo",
    makeProfilePublic: "Zveřejnit profil",
    allowContactRequests: "Povolit žádosti o kontakt",
    saving: "Ukládání...",
    saveSettings: "Uložit nastavení",
    loadingSettings: "Načítání nastavení...",
    couldNotLoadSettings: "Nastavení se nepodařilo načíst",
    chat: "Chat",
    openConversation: "Otevřete konverzaci ze strany Chaty.",
    ok: "OK",
    confirmAction: "Potvrdit",
    passwordsMustMatch: "Hesla se neshodují",
    registrationFailed: "Registrace selhala",
    resetFailed: "Obnovení selhalo",
    tryAgain: "Zkuste znovu",
    resetSent: "Odkaz odeslán",
    checkInbox: "Zkontrolujte svou doručenou poštu",
    tokenMissing: "Token chybí",
    unableToReset: "Heslo se nepodařilo obnovit",
    passwordUpdated: "Heslo aktualizováno",
    signInNewPassword: "Přihlaste se novým heslem",
  },
};

export const DEFAULT_LANG: LangCode = "en";

export const getLang = (): LangCode => {
  if (typeof window === "undefined") return DEFAULT_LANG;
  const cookieMatch = document.cookie.match(/(?:^|;\s*)cubcha_lang=([^;]+)/);
  const cookieVal = cookieMatch?.[1] as LangCode | undefined;
  if (cookieVal && translations[cookieVal]) return cookieVal;
  try {
    const stored = localStorage.getItem("cubcha_lang") as LangCode | null;
    if (stored && translations[stored]) return stored;
  } catch {}
  return DEFAULT_LANG;
};

export const setLang = (code: LangCode): void => {
  if (typeof window !== "undefined") {
    const maxAge = 60 * 60 * 24 * 365;
    document.cookie = `cubcha_lang=${code};path=/;max-age=${maxAge};SameSite=Lax`;
    try { localStorage.setItem("cubcha_lang", code); } catch {}
  }
};

export const t = (lang: LangCode): Translations => translations[lang];
