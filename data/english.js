// Fase 3 · Inglés. `lvl` 1-5: 1-2 ≈ B1, 3 ≈ B2, 4 ≈ B2+, 5 ≈ C1.
// GRAMMAR: los ítems g001-g013 proceden de entrenador_aena.html (verificados).

export const GRAMMAR = [
  // ---- B1 (lvl 1-2) ----
  { id: "g101", origen: "generada", lvl: 1, prompt: `She ___ to the market every Saturday.`, options: ["go", "goes", "going", "gone"], correctIndex: 1, correctText: "goes", explanation: `3ª persona singular en presente simple → <b>goes</b>.` },
  { id: "g102", origen: "generada", lvl: 1, prompt: `I ___ working here since 2019.`, options: ["am", "have been", "was", "will be"], correctIndex: 1, correctText: "have been", explanation: `«since» + presente perfecto continuo → <b>have been</b> working.` },
  { id: "g103", origen: "generada", lvl: 1, prompt: `There aren't ___ seats left in the cinema.`, options: ["some", "any", "much", "a"], correctIndex: 1, correctText: "any", explanation: `Frase negativa con contable plural → <b>any</b>.` },
  { id: "g104", origen: "generada", lvl: 1, prompt: `This textbook is ___ than mine.`, options: ["heavy", "heavier", "heaviest", "more heavy"], correctIndex: 1, correctText: "heavier", explanation: `Comparativo de adjetivo corto → <b>heavier</b>.` },
  { id: "g105", origen: "generada", lvl: 2, prompt: `If it rains, the match ___ postponed.`, options: ["is", "will be", "would be", "was"], correctIndex: 1, correctText: "will be", explanation: `1ª condicional: if + presente, <b>will</b> + infinitivo.` },
  { id: "g106", origen: "generada", lvl: 2, prompt: `He asked me where I ___ from.`, options: ["come", "came", "am coming", "will come"], correctIndex: 1, correctText: "came", explanation: `Estilo indirecto: el presente retrocede a pasado → <b>came</b>.` },
  { id: "g107", origen: "generada", lvl: 2, prompt: `You ___ talk loudly inside the library. It's forbidden.`, options: ["mustn't", "don't have to", "needn't", "shouldn't have"], correctIndex: 0, correctText: "mustn't", explanation: `Prohibición → <b>mustn't</b>. «don't have to» sería «no es necesario».` },
  { id: "g108", origen: "generada", lvl: 2, prompt: `The eggs ___ every morning at six.`, options: ["collect", "are collected", "have collected", "collecting"], correctIndex: 1, correctText: "are collected", explanation: `Voz pasiva en presente → <b>are collected</b>.` },

  // ---- B2 (lvl 3) — incluye el banco verificado original ----
  { id: "g001", origen: "generada", lvl: 3, prompt: `If I ___ known, I would have told you.`, options: ["have", "had", "would have", "has"], correctIndex: 1, correctText: "had", explanation: `3ª condicional: <b>If I had known…</b>` },
  { id: "g002", origen: "generada", lvl: 3, prompt: `She's used to ___ up early.`, options: ["get", "getting", "got", "gets"], correctIndex: 1, correctText: "getting", explanation: `«be used to» + gerundio → <b>getting</b> up.` },
  { id: "g003", origen: "generada", lvl: 3, prompt: `By next June, they ___ here for a decade.`, options: ["will live", "will have lived", "have lived", "lived"], correctIndex: 1, correctText: "will have lived", explanation: `Futuro perfecto → <b>will have lived</b>.` },
  { id: "g004", origen: "generada", lvl: 3, prompt: `I'd rather you ___ smoke in here.`, options: ["don't", "didn't", "won't", "not"], correctIndex: 1, correctText: "didn't", explanation: `«I'd rather you» + pasado (subjuntivo) → <b>didn't</b>.` },
  { id: "g005", origen: "generada", lvl: 3, prompt: `Neither of the answers ___ correct.`, options: ["is", "are", "were", "be"], correctIndex: 0, correctText: "is", explanation: `«Neither of» toma verbo en singular → <b>is</b>.` },
  { id: "g006", origen: "generada", lvl: 3, prompt: `He denied ___ the documents.`, options: ["to take", "taking", "take", "taken"], correctIndex: 1, correctText: "taking", explanation: `«deny» + gerundio → <b>taking</b>.` },
  { id: "g007", origen: "generada", lvl: 3, prompt: `It's high time we ___.`, options: ["leave", "left", "leaving", "have left"], correctIndex: 1, correctText: "left", explanation: `«It's high time» + pasado → <b>left</b>.` },
  { id: "g008", origen: "generada", lvl: 3, prompt: `Not only ___ late, but he also lost the file.`, options: ["he was", "was he", "he is", "did he"], correctIndex: 1, correctText: "was he", explanation: `Inversión tras «Not only» → <b>was he</b> late.` },
  { id: "g009", origen: "generada", lvl: 3, prompt: `You ___ have told me earlier; now it's too late.`, options: ["should", "must", "can", "would"], correctIndex: 0, correctText: "should", explanation: `Reproche sobre el pasado → <b>should</b> have told.` },
  { id: "g010", origen: "generada", lvl: 3, prompt: `We won't start ___ he arrives.`, options: ["until", "unless", "since", "while"], correctIndex: 0, correctText: "until", explanation: `«no… hasta que» → <b>until</b>.` },
  { id: "g011", origen: "generada", lvl: 3, prompt: `That's the engineer ___ report we discussed.`, options: ["who", "whom", "whose", "which"], correctIndex: 2, correctText: "whose", explanation: `Posesivo → <b>whose</b>.` },
  { id: "g012", origen: "generada", lvl: 3, prompt: `Hardly ___ the stadium when the match was cancelled.`, options: ["I had reached", "had I reached", "I reached", "did I reach"], correctIndex: 1, correctText: "had I reached", explanation: `Inversión tras «Hardly» → <b>had I reached</b>… when…` },
  { id: "g013", origen: "generada", lvl: 3, prompt: `The meeting was called ___ because of the storm.`, options: ["off", "up", "on", "out"], correctIndex: 0, correctText: "off", explanation: `«call off» = cancelar → <b>off</b>.` },
  { id: "g014", origen: "generada", lvl: 3, prompt: `If we ___ earlier, we wouldn't have missed the bus.`, options: ["left", "had left", "would leave", "have left"], correctIndex: 1, correctText: "had left", explanation: `3ª condicional → <b>had left</b>.` },
  { id: "g015", origen: "generada", lvl: 3, prompt: `I regret ___ you that your application has been rejected.`, options: ["to inform", "informing", "inform", "informed"], correctIndex: 0, correctText: "to inform", explanation: `«regret» + infinitivo para malas noticias formales → <b>to inform</b>.` },
  { id: "g016", origen: "generada", lvl: 3, prompt: `I remember ___ this email last week.`, options: ["to send", "sending", "send", "sent"], correctIndex: 1, correctText: "sending", explanation: `«remember» + gerundio = recordar algo ya hecho → <b>sending</b>.` },
  { id: "g017", origen: "generada", lvl: 3, prompt: `This is the hotel ___ we stayed last summer.`, options: ["which", "where", "who", "whose"], correctIndex: 1, correctText: "where", explanation: `Relativo de lugar → <b>where</b>.` },
  { id: "g018", origen: "generada", lvl: 3, prompt: `I can't ___ this noise any longer.`, options: ["put up with", "put down to", "put off", "put through"], correctIndex: 0, correctText: "put up with", explanation: `«put up with» = tolerar.` },
  { id: "g019", origen: "generada", lvl: 3, prompt: `The documents ___ by the manager before the transfer.`, options: ["signed", "were signed", "have signed", "sign"], correctIndex: 1, correctText: "were signed", explanation: `Voz pasiva en pasado → <b>were signed</b>.` },
  { id: "g020", origen: "generada", lvl: 3, prompt: `He's lived in Spain for ten years, so he ___ speak Spanish fluently.`, options: ["might", "must", "can", "should"], correctIndex: 1, correctText: "must", explanation: `Deducción con alta certeza → <b>must</b>.` },
  { id: "g021", origen: "generada", lvl: 3, prompt: `By the time we arrived at the cinema, the film ___ already started.`, options: ["was", "had", "has", "have"], correctIndex: 1, correctText: "had", explanation: `Pasado perfecto → <b>had</b> already started.` },
  { id: "g022", origen: "generada", lvl: 3, prompt: `I wish I ___ harder for the exam.`, options: ["study", "studied", "had studied", "would study"], correctIndex: 2, correctText: "had studied", explanation: `«wish» + pasado perfecto = arrepentimiento → <b>had studied</b>.` },
  { id: "g023", origen: "generada", lvl: 3, prompt: `The person ___ I spoke to was very helpful.`, options: ["which", "whom", "whose", "when"], correctIndex: 1, correctText: "whom", explanation: `Relativo de objeto formal → <b>whom</b>.` },
  { id: "g024", origen: "generada", lvl: 3, prompt: `Under no circumstances ___ leave a patient unattended.`, options: ["you should", "should you", "you must", "must you"], correctIndex: 1, correctText: "should you", explanation: `Inversión tras adverbio negativo → <b>should you</b>.` },

  // ---- B2+ / C1 (lvl 4-5) ----
  { id: "g201", origen: "generada", lvl: 4, prompt: `Were it not ___ the weather, we would have landed on time.`, options: ["for", "of", "to", "with"], correctIndex: 0, correctText: "for", explanation: `«Were it not <b>for</b> X» = «de no ser por X» (condicional formal invertida).` },
  { id: "g202", origen: "generada", lvl: 4, prompt: `No sooner ___ the results than the students started celebrating.`, options: ["they heard", "had they heard", "did they hear", "they had heard"], correctIndex: 1, correctText: "had they heard", explanation: `«No sooner» exige inversión + pasado perfecto → <b>had they heard</b>… than…` },
  { id: "g203", origen: "generada", lvl: 4, prompt: `Such ___ the queue that many customers missed their lunch break.`, options: ["was", "were", "has been", "it was"], correctIndex: 0, correctText: "was", explanation: `«Such + be + sujeto + that»: el sujeto es «the queue» (singular) → <b>was</b>.` },
  { id: "g204", origen: "generada", lvl: 4, prompt: `He objected ___ overtime without notice.`, options: ["to work", "to working", "work", "working"], correctIndex: 1, correctText: "to working", explanation: `«object to» + gerundio → <b>to working</b>.` },
  { id: "g205", origen: "generada", lvl: 4, prompt: `Little ___ that the pitch had already been closed.`, options: ["he knew", "did he know", "he did know", "knew he"], correctIndex: 1, correctText: "did he know", explanation: `Inversión tras «Little» al inicio → <b>did he know</b>.` },
  { id: "g206", origen: "generada", lvl: 4, prompt: `The report needs ___ before Friday.`, options: ["to revise", "revising", "revised", "be revised"], correctIndex: 1, correctText: "revising", explanation: `«need» + gerundio tiene sentido pasivo → <b>revising</b> (= needs to be revised).` },
  { id: "g207", origen: "generada", lvl: 4, prompt: `They had the security system ___ last month.`, options: ["upgrade", "upgraded", "to upgrade", "upgrading"], correctIndex: 1, correctText: "upgraded", explanation: `Causativo «have something <b>done</b>» → <b>upgraded</b>.` },
  { id: "g208", origen: "generada", lvl: 4, prompt: `___ having little experience, she handled the incident perfectly.`, options: ["Despite", "Although", "However", "Even"], correctIndex: 0, correctText: "Despite", explanation: `«Despite» + gerundio/sustantivo (con «Although» iría una oración completa).` },
  { id: "g209", origen: "generada", lvl: 4, prompt: `It was not until 2020 ___ the new library opened.`, options: ["when", "that", "which", "then"], correctIndex: 1, correctText: "that", explanation: `Estructura enfática «It was not until X <b>that</b> Y».` },
  { id: "g210", origen: "generada", lvl: 4, prompt: `I'd sooner you ___ nothing to the press.`, options: ["say", "said", "have said", "saying"], correctIndex: 1, correctText: "said", explanation: `«I'd sooner you» + pasado subjuntivo → <b>said</b>.` },
  { id: "g211", origen: "generada", lvl: 5, prompt: `Had it not been for the crew, the incident ___ far worse.`, options: ["would be", "would have been", "will be", "had been"], correctIndex: 1, correctText: "would have been", explanation: `Condicional mixta invertida sobre el pasado → <b>would have been</b>.` },
  { id: "g212", origen: "generada", lvl: 5, prompt: `On no account ___ customers to enter without a valid ticket.`, options: ["are allowed", "allowed are", "are permitted", "must be allowed"], correctIndex: 0, correctText: "are allowed", explanation: `Tras «On no account» hay inversión: auxiliar + sujeto → <b>are</b> customers <b>allowed</b>.` },
  { id: "g213", origen: "generada", lvl: 5, prompt: `Scarcely ___ when the alarm went off.`, options: ["we had arrived", "had we arrived", "did we arrive", "we arrived"], correctIndex: 1, correctText: "had we arrived", explanation: `Inversión tras «Scarcely» → <b>had we arrived</b>… when…` },
  { id: "g214", origen: "generada", lvl: 5, prompt: `The proposal is worth ___ in detail.`, options: ["to consider", "considering", "considered", "consider"], correctIndex: 1, correctText: "considering", explanation: `«be worth» + gerundio → <b>considering</b>.` },
  { id: "g215", origen: "generada", lvl: 5, prompt: `He is said ___ in the sector for over thirty years.`, options: ["to work", "to have worked", "working", "that he worked"], correctIndex: 1, correctText: "to have worked", explanation: `Pasiva impersonal + infinitivo perfecto → <b>to have worked</b>.` },
  { id: "g216", origen: "generada", lvl: 5, prompt: `Only after the audit ___ the extent of the problem.`, options: ["we understood", "did we understand", "we did understand", "understood we"], correctIndex: 1, correctText: "did we understand", explanation: `«Only after…» al inicio fuerza inversión → <b>did we understand</b>.` },
  { id: "g217", origen: "generada", lvl: 5, prompt: `Whatever the outcome ___, we must inform the guests.`, options: ["is", "may be", "will be", "would be"], correctIndex: 1, correctText: "may be", explanation: `Registro formal concesivo → «Whatever the outcome <b>may be</b>».` },
  { id: "g218", origen: "generada", lvl: 5, prompt: `Rarely ___ such a well-organised evacuation.`, options: ["I have seen", "have I seen", "did I see", "I saw"], correctIndex: 1, correctText: "have I seen", explanation: `Inversión tras «Rarely» → <b>have I seen</b>.` },
];

// Producción escrita ES→EN: el alumno construye la frase con fichas (tipo Duolingo).
// `answer` es la secuencia correcta; `lures` son fichas sobrantes plausibles.
export const TRANSLATE = [
  { id: "t101", origen: "generada", lvl: 1, es: "El partido se ha aplazado.", answer: ["The", "match", "has", "been", "postponed"], lures: ["is", "delay", "was"] },
  { id: "t102", origen: "generada", lvl: 1, es: "¿Dónde está la sección de frutería?", answer: ["Where", "is", "the", "fruit", "section"], lures: ["are", "door", "which"] },
  { id: "t103", origen: "generada", lvl: 1, es: "Trabajo en la biblioteca desde 2019.", answer: ["I", "have", "worked", "at", "the", "library", "since", "2019"], lures: ["work", "for", "in"] },
  { id: "t104", origen: "generada", lvl: 2, es: "No se permite correr dentro de la piscina.", answer: ["Running", "is", "not", "allowed", "inside", "the", "pool"], lures: ["doesn't", "permit", "run"] },
  { id: "t105", origen: "generada", lvl: 2, es: "Si nieva, cancelarán las clases.", answer: ["If", "it", "snows", "they", "will", "cancel", "the", "classes"], lures: ["would", "snow", "cancelled"] },
  { id: "t106", origen: "generada", lvl: 2, es: "La leche se recoge cada mañana.", answer: ["The", "milk", "is", "collected", "every", "morning"], lures: ["are", "collect", "collecting"] },
  { id: "t107", origen: "generada", lvl: 3, es: "Ojalá hubiera estudiado más para el examen.", answer: ["I", "wish", "I", "had", "studied", "more", "for", "the", "exam"], lures: ["would", "study", "studied"] },
  { id: "t108", origen: "generada", lvl: 3, es: "Si hubiéramos ahorrado antes, no habríamos pedido el préstamo.", answer: ["If", "we", "had", "saved", "earlier", "we", "wouldn't", "have", "asked", "for", "the", "loan"], lures: ["would", "save", "ask"] },
  { id: "t109", origen: "generada", lvl: 3, es: "Me han dicho que el informe ya está firmado.", answer: ["I", "have", "been", "told", "that", "the", "report", "is", "already", "signed"], lures: ["they", "sign", "was"] },
  { id: "t110", origen: "generada", lvl: 3, es: "Llevo diez años trabajando en este sector.", answer: ["I", "have", "been", "working", "in", "this", "sector", "for", "ten", "years"], lures: ["since", "work", "am"] },
  { id: "t111", origen: "generada", lvl: 3, es: "El cliente negó haber roto el jarrón.", answer: ["The", "customer", "denied", "breaking", "the", "vase"], lures: ["to", "break", "broke"] },
  { id: "t112", origen: "generada", lvl: 4, es: "De no ser por la tripulación, el incidente habría sido peor.", answer: ["Were", "it", "not", "for", "the", "crew", "the", "incident", "would", "have", "been", "worse"], lures: ["if", "was", "had"] },
  { id: "t113", origen: "generada", lvl: 4, es: "En ningún caso deben dejarse las herramientas sin recoger.", answer: ["Under", "no", "circumstances", "should", "tools", "be", "left", "unattended"], lures: ["you", "must", "leaving"] },
  { id: "t114", origen: "generada", lvl: 4, es: "Nada más empezar a llover, se suspendió el partido.", answer: ["No", "sooner", "had", "it", "started", "raining", "than", "the", "match", "was", "suspended"], lures: ["when", "did", "raining"] },
  { id: "t115", origen: "generada", lvl: 4, es: "Hicimos que revisaran el sistema de seguridad.", answer: ["We", "had", "the", "security", "system", "checked"], lures: ["to", "check", "checking"] },
  { id: "t116", origen: "generada", lvl: 4, es: "A pesar de tener poca experiencia, gestionó el incidente perfectamente.", answer: ["Despite", "having", "little", "experience", "she", "handled", "the", "incident", "perfectly"], lures: ["although", "have", "few"] },
  { id: "t117", origen: "generada", lvl: 5, es: "Se dice que ha trabajado en el sector más de treinta años.", answer: ["He", "is", "said", "to", "have", "worked", "in", "the", "sector", "for", "over", "thirty", "years"], lures: ["that", "has", "since"] },
  { id: "t118", origen: "generada", lvl: 5, es: "Solo después de la auditoría comprendimos el alcance del problema.", answer: ["Only", "after", "the", "audit", "did", "we", "understand", "the", "extent", "of", "the", "problem"], lures: ["we", "understood", "that"] },
  { id: "t119", origen: "generada", lvl: 5, es: "Rara vez he visto una evacuación tan bien organizada.", answer: ["Rarely", "have", "I", "seen", "such", "a", "well-organised", "evacuation"], lures: ["I", "did", "so"] },
  { id: "t120", origen: "generada", lvl: 5, es: "Merece la pena estudiar la propuesta en detalle.", answer: ["The", "proposal", "is", "worth", "studying", "in", "detail"], lures: ["to", "study", "worthy"] },
];

// Corrección de errores: elegir la frase CORRECTA entre variantes casi idénticas.
export const ERROR_CORRECTION = [
  { id: "e101", origen: "generada", lvl: 2, prompt: `¿Cuál es la frase <b>correcta</b>?`, options: ["He didn't went to the meeting.", "He didn't go to the meeting.", "He not went to the meeting.", "He doesn't went to the meeting."], correctIndex: 1, correctText: "He didn't go to the meeting.", explanation: `Tras el auxiliar «didn't» el verbo va en <b>infinitivo</b>: didn't <b>go</b>.` },
  { id: "e102", origen: "generada", lvl: 2, prompt: `¿Cuál es la frase <b>correcta</b>?`, options: ["There is many passengers waiting.", "There are many passengers waiting.", "There are much passengers waiting.", "There is much passengers waiting."], correctIndex: 1, correctText: "There are many passengers waiting.", explanation: `Contable plural → <b>there are</b> + <b>many</b>.` },
  { id: "e103", origen: "generada", lvl: 3, prompt: `¿Cuál es la frase <b>correcta</b>?`, options: ["I look forward to hear from you.", "I look forward to hearing from you.", "I look forward hear from you.", "I look forward for hearing from you."], correctIndex: 1, correctText: "I look forward to hearing from you.", explanation: `«look forward <b>to</b>» lleva gerundio: to <b>hearing</b>.` },
  { id: "e104", origen: "generada", lvl: 3, prompt: `¿Cuál es la frase <b>correcta</b>?`, options: ["The staff is very professionals.", "The staff are very professional.", "The staffs are very professional.", "The staff are very professionals."], correctIndex: 1, correctText: "The staff are very professional.", explanation: `«staff» es colectivo (verbo plural en BrE) y los adjetivos ingleses <b>no llevan plural</b>.` },
  { id: "e105", origen: "generada", lvl: 3, prompt: `¿Cuál es la frase <b>correcta</b>?`, options: ["I have seen him yesterday.", "I saw him yesterday.", "I have saw him yesterday.", "I did saw him yesterday."], correctIndex: 1, correctText: "I saw him yesterday.", explanation: `Con un tiempo pasado terminado («yesterday») se usa <b>past simple</b>, no present perfect.` },
  { id: "e106", origen: "generada", lvl: 4, prompt: `¿Cuál es la frase <b>correcta</b>?`, options: ["Despite of the delay, we arrived on time.", "Despite the delay, we arrived on time.", "Despite that the delay, we arrived on time.", "Despite of that delay, we arrived on time."], correctIndex: 1, correctText: "Despite the delay, we arrived on time.", explanation: `<b>Despite</b> nunca lleva «of» (eso sería «in spite of»).` },
  { id: "e107", origen: "generada", lvl: 4, prompt: `¿Cuál es la frase <b>correcta</b>?`, options: ["If I would have known, I would have called.", "If I had known, I would have called.", "If I have known, I would have called.", "If I knew, I would have called."], correctIndex: 1, correctText: "If I had known, I would have called.", explanation: `En la oración con «if» de la 3ª condicional <b>nunca</b> va «would»: if I <b>had</b> known.` },
  { id: "e108", origen: "generada", lvl: 4, prompt: `¿Cuál es la frase <b>correcta</b>?`, options: ["She suggested me to call the manager.", "She suggested that I call the manager.", "She suggested me calling the manager.", "She suggested to me to call the manager."], correctIndex: 1, correctText: "She suggested that I call the manager.", explanation: `«suggest» no admite objeto + infinitivo: <b>suggest that + sujeto + verbo</b>.` },
  { id: "e109", origen: "generada", lvl: 5, prompt: `¿Cuál es la frase <b>correcta</b>?`, options: ["Hardly I had arrived when it started.", "Hardly had I arrived when it started.", "Hardly did I arrive when it started.", "Hardly I arrived when it started."], correctIndex: 1, correctText: "Hardly had I arrived when it started.", explanation: `«Hardly» al inicio exige <b>inversión</b> con pasado perfecto: <b>had I arrived</b>.` },
  { id: "e110", origen: "generada", lvl: 5, prompt: `¿Cuál es la frase <b>correcta</b>?`, options: ["The information are confidential.", "The information is confidential.", "The informations are confidential.", "An information is confidential."], correctIndex: 1, correctText: "The information is confidential.", explanation: `«information» es <b>incontable</b>: verbo en singular y sin plural ni artículo «an».` },
];

// El banco de listening vive en data/listening.js (Tarea 3): se acertaba sin escuchar
// (solape literal audio/respuesta), era 100 % aeropuerto y demasiado corto/lento para
// pasar por B1-B2 real -- ver cabecera de ese fichero para las reglas duras nuevas.

export const SPEAKING_PROMPTS = [
  "Describe your current job and your main responsibilities.",
  "Talk about a difficult problem you solved at work. What did you do?",
  "Should airports focus more on growth or on sustainability? Give your opinion and reasons.",
  "Describe your home city and what you would recommend to a first-time visitor.",
  "A flight is delayed and passengers are getting angry. What would you do and say?",
  "Talk about a skill you would like to improve and how you plan to do it.",
  "Describe a time you had to work as part of a team under pressure.",
  "What do you think makes good customer service in an airport?",
  "Talk about a recent change in your workplace and how you adapted to it.",
  "Why do you want to work for Aena? What would you bring to the role?",
  "How do you think airports will change in the next twenty years?",
  "Describe a situation where you had to explain something technical to a non-expert.",
  "What are the advantages and disadvantages of working shifts?",
  "Talk about a decision you regret and what you learned from it.",
  "How would you handle a colleague who repeatedly ignores safety procedures?",
];
