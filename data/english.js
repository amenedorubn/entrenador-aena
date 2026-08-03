// Fase 3 · Inglés. `lvl` 1-5: 1-2 ≈ B1, 3 ≈ B2, 4 ≈ B2+, 5 ≈ C1.
// GRAMMAR: los ítems g001-g013 proceden de entrenador_aena.html (verificados).

export const GRAMMAR = [
  // ---- B1 (lvl 1-2) ----
  { id: "g101", lvl: 1, prompt: `She ___ to the airport every morning.`, options: ["go", "goes", "going", "gone"], correctIndex: 1, explanation: `3ª persona singular en presente simple → <b>goes</b>.` },
  { id: "g102", lvl: 1, prompt: `I ___ working here since 2019.`, options: ["am", "have been", "was", "will be"], correctIndex: 1, explanation: `«since» + presente perfecto continuo → <b>have been</b> working.` },
  { id: "g103", lvl: 1, prompt: `There aren't ___ seats left on this flight.`, options: ["some", "any", "much", "a"], correctIndex: 1, explanation: `Frase negativa con contable plural → <b>any</b>.` },
  { id: "g104", lvl: 1, prompt: `This suitcase is ___ than mine.`, options: ["heavy", "heavier", "heaviest", "more heavy"], correctIndex: 1, explanation: `Comparativo de adjetivo corto → <b>heavier</b>.` },
  { id: "g105", lvl: 2, prompt: `If it rains, the flight ___ delayed.`, options: ["is", "will be", "would be", "was"], correctIndex: 1, explanation: `1ª condicional: if + presente, <b>will</b> + infinitivo.` },
  { id: "g106", lvl: 2, prompt: `He asked me where I ___ from.`, options: ["come", "came", "am coming", "will come"], correctIndex: 1, explanation: `Estilo indirecto: el presente retrocede a pasado → <b>came</b>.` },
  { id: "g107", lvl: 2, prompt: `You ___ smoke inside the terminal. It's forbidden.`, options: ["mustn't", "don't have to", "needn't", "shouldn't have"], correctIndex: 0, explanation: `Prohibición → <b>mustn't</b>. «don't have to» sería «no es necesario».` },
  { id: "g108", lvl: 2, prompt: `The bags ___ every morning at six.`, options: ["collect", "are collected", "have collected", "collecting"], correctIndex: 1, explanation: `Voz pasiva en presente → <b>are collected</b>.` },

  // ---- B2 (lvl 3) — incluye el banco verificado original ----
  { id: "g001", lvl: 3, prompt: `If I ___ known, I would have told you.`, options: ["have", "had", "would have", "has"], correctIndex: 1, explanation: `3ª condicional: <b>If I had known…</b>` },
  { id: "g002", lvl: 3, prompt: `She's used to ___ up early.`, options: ["get", "getting", "got", "gets"], correctIndex: 1, explanation: `«be used to» + gerundio → <b>getting</b> up.` },
  { id: "g003", lvl: 3, prompt: `By next June, they ___ here for a decade.`, options: ["will live", "will have lived", "have lived", "lived"], correctIndex: 1, explanation: `Futuro perfecto → <b>will have lived</b>.` },
  { id: "g004", lvl: 3, prompt: `I'd rather you ___ smoke in here.`, options: ["don't", "didn't", "won't", "not"], correctIndex: 1, explanation: `«I'd rather you» + pasado (subjuntivo) → <b>didn't</b>.` },
  { id: "g005", lvl: 3, prompt: `Neither of the answers ___ correct.`, options: ["is", "are", "were", "be"], correctIndex: 0, explanation: `«Neither of» toma verbo en singular → <b>is</b>.` },
  { id: "g006", lvl: 3, prompt: `He denied ___ the documents.`, options: ["to take", "taking", "take", "taken"], correctIndex: 1, explanation: `«deny» + gerundio → <b>taking</b>.` },
  { id: "g007", lvl: 3, prompt: `It's high time we ___.`, options: ["leave", "left", "leaving", "have left"], correctIndex: 1, explanation: `«It's high time» + pasado → <b>left</b>.` },
  { id: "g008", lvl: 3, prompt: `Not only ___ late, but he also lost the file.`, options: ["he was", "was he", "he is", "did he"], correctIndex: 1, explanation: `Inversión tras «Not only» → <b>was he</b> late.` },
  { id: "g009", lvl: 3, prompt: `You ___ have told me earlier; now it's too late.`, options: ["should", "must", "can", "would"], correctIndex: 0, explanation: `Reproche sobre el pasado → <b>should</b> have told.` },
  { id: "g010", lvl: 3, prompt: `We won't start ___ he arrives.`, options: ["until", "unless", "since", "while"], correctIndex: 0, explanation: `«no… hasta que» → <b>until</b>.` },
  { id: "g011", lvl: 3, prompt: `That's the engineer ___ report we discussed.`, options: ["who", "whom", "whose", "which"], correctIndex: 2, explanation: `Posesivo → <b>whose</b>.` },
  { id: "g012", lvl: 3, prompt: `Hardly ___ the airport when the flight was cancelled.`, options: ["I had reached", "had I reached", "I reached", "did I reach"], correctIndex: 1, explanation: `Inversión tras «Hardly» → <b>had I reached</b>… when…` },
  { id: "g013", lvl: 3, prompt: `The meeting was called ___ because of the storm.`, options: ["off", "up", "on", "out"], correctIndex: 0, explanation: `«call off» = cancelar → <b>off</b>.` },
  { id: "g014", lvl: 3, prompt: `If we ___ earlier, we wouldn't have missed the flight.`, options: ["left", "had left", "would leave", "have left"], correctIndex: 1, explanation: `3ª condicional → <b>had left</b>.` },
  { id: "g015", lvl: 3, prompt: `I regret ___ you that your application has been rejected.`, options: ["to inform", "informing", "inform", "informed"], correctIndex: 0, explanation: `«regret» + infinitivo para malas noticias formales → <b>to inform</b>.` },
  { id: "g016", lvl: 3, prompt: `I remember ___ this email last week.`, options: ["to send", "sending", "send", "sent"], correctIndex: 1, explanation: `«remember» + gerundio = recordar algo ya hecho → <b>sending</b>.` },
  { id: "g017", lvl: 3, prompt: `This is the hotel ___ we stayed last summer.`, options: ["which", "where", "who", "whose"], correctIndex: 1, explanation: `Relativo de lugar → <b>where</b>.` },
  { id: "g018", lvl: 3, prompt: `I can't ___ this noise any longer.`, options: ["put up with", "put down to", "put off", "put through"], correctIndex: 0, explanation: `«put up with» = tolerar.` },
  { id: "g019", lvl: 3, prompt: `The documents ___ by the manager before the flight.`, options: ["signed", "were signed", "have signed", "sign"], correctIndex: 1, explanation: `Voz pasiva en pasado → <b>were signed</b>.` },
  { id: "g020", lvl: 3, prompt: `He's lived in Spain for ten years, so he ___ speak Spanish fluently.`, options: ["might", "must", "can", "should"], correctIndex: 1, explanation: `Deducción con alta certeza → <b>must</b>.` },
  { id: "g021", lvl: 3, prompt: `By the time we arrived at the gate, the plane ___ already left.`, options: ["was", "had", "has", "have"], correctIndex: 1, explanation: `Pasado perfecto → <b>had</b> already left.` },
  { id: "g022", lvl: 3, prompt: `I wish I ___ harder for the exam.`, options: ["study", "studied", "had studied", "would study"], correctIndex: 2, explanation: `«wish» + pasado perfecto = arrepentimiento → <b>had studied</b>.` },
  { id: "g023", lvl: 3, prompt: `The person ___ I spoke to was very helpful.`, options: ["which", "whom", "whose", "when"], correctIndex: 1, explanation: `Relativo de objeto formal → <b>whom</b>.` },
  { id: "g024", lvl: 3, prompt: `Under no circumstances ___ leave the luggage unattended.`, options: ["you should", "should you", "you must", "must you"], correctIndex: 1, explanation: `Inversión tras adverbio negativo → <b>should you</b>.` },

  // ---- B2+ / C1 (lvl 4-5) ----
  { id: "g201", lvl: 4, prompt: `Were it not ___ the weather, we would have landed on time.`, options: ["for", "of", "to", "with"], correctIndex: 0, explanation: `«Were it not <b>for</b> X» = «de no ser por X» (condicional formal invertida).` },
  { id: "g202", lvl: 4, prompt: `No sooner ___ the announcement than passengers started queuing.`, options: ["they heard", "had they heard", "did they hear", "they had heard"], correctIndex: 1, explanation: `«No sooner» exige inversión + pasado perfecto → <b>had they heard</b>… than…` },
  { id: "g203", lvl: 4, prompt: `Such ___ the delay that many passengers missed their connections.`, options: ["was", "were", "has been", "it was"], correctIndex: 0, explanation: `«Such + be + sujeto + that»: el sujeto es «the delay» (singular) → <b>was</b>.` },
  { id: "g204", lvl: 4, prompt: `He objected ___ overtime without notice.`, options: ["to work", "to working", "work", "working"], correctIndex: 1, explanation: `«object to» + gerundio → <b>to working</b>.` },
  { id: "g205", lvl: 4, prompt: `Little ___ that the runway had already been closed.`, options: ["he knew", "did he know", "he did know", "knew he"], correctIndex: 1, explanation: `Inversión tras «Little» al inicio → <b>did he know</b>.` },
  { id: "g206", lvl: 4, prompt: `The report needs ___ before Friday.`, options: ["to revise", "revising", "revised", "be revised"], correctIndex: 1, explanation: `«need» + gerundio tiene sentido pasivo → <b>revising</b> (= needs to be revised).` },
  { id: "g207", lvl: 4, prompt: `They had the security system ___ last month.`, options: ["upgrade", "upgraded", "to upgrade", "upgrading"], correctIndex: 1, explanation: `Causativo «have something <b>done</b>» → <b>upgraded</b>.` },
  { id: "g208", lvl: 4, prompt: `___ having little experience, she handled the incident perfectly.`, options: ["Despite", "Although", "However", "Even"], correctIndex: 0, explanation: `«Despite» + gerundio/sustantivo (con «Although» iría una oración completa).` },
  { id: "g209", lvl: 4, prompt: `It was not until 2020 ___ the new terminal opened.`, options: ["when", "that", "which", "then"], correctIndex: 1, explanation: `Estructura enfática «It was not until X <b>that</b> Y».` },
  { id: "g210", lvl: 4, prompt: `I'd sooner you ___ nothing to the press.`, options: ["say", "said", "have said", "saying"], correctIndex: 1, explanation: `«I'd sooner you» + pasado subjuntivo → <b>said</b>.` },
  { id: "g211", lvl: 5, prompt: `Had it not been for the crew, the incident ___ far worse.`, options: ["would be", "would have been", "will be", "had been"], correctIndex: 1, explanation: `Condicional mixta invertida sobre el pasado → <b>would have been</b>.` },
  { id: "g212", lvl: 5, prompt: `On no account ___ passengers to board without a valid document.`, options: ["are allowed", "allowed are", "are permitted", "must be allowed"], correctIndex: 0, explanation: `Tras «On no account» hay inversión: auxiliar + sujeto → <b>are</b> passengers <b>allowed</b>.` },
  { id: "g213", lvl: 5, prompt: `Scarcely ___ when the alarm went off.`, options: ["we had arrived", "had we arrived", "did we arrive", "we arrived"], correctIndex: 1, explanation: `Inversión tras «Scarcely» → <b>had we arrived</b>… when…` },
  { id: "g214", lvl: 5, prompt: `The proposal is worth ___ in detail.`, options: ["to consider", "considering", "considered", "consider"], correctIndex: 1, explanation: `«be worth» + gerundio → <b>considering</b>.` },
  { id: "g215", lvl: 5, prompt: `He is said ___ in the sector for over thirty years.`, options: ["to work", "to have worked", "working", "that he worked"], correctIndex: 1, explanation: `Pasiva impersonal + infinitivo perfecto → <b>to have worked</b>.` },
  { id: "g216", lvl: 5, prompt: `Only after the audit ___ the extent of the problem.`, options: ["we understood", "did we understand", "we did understand", "understood we"], correctIndex: 1, explanation: `«Only after…» al inicio fuerza inversión → <b>did we understand</b>.` },
  { id: "g217", lvl: 5, prompt: `Whatever the outcome ___, we must inform the passengers.`, options: ["is", "may be", "will be", "would be"], correctIndex: 1, explanation: `Registro formal concesivo → «Whatever the outcome <b>may be</b>».` },
  { id: "g218", lvl: 5, prompt: `Rarely ___ such a well-organised evacuation.`, options: ["I have seen", "have I seen", "did I see", "I saw"], correctIndex: 1, explanation: `Inversión tras «Rarely» → <b>have I seen</b>.` },
];

// Producción escrita ES→EN: el alumno construye la frase con fichas (tipo Duolingo).
// `answer` es la secuencia correcta; `lures` son fichas sobrantes plausibles.
export const TRANSLATE = [
  { id: "t101", lvl: 1, es: "El vuelo se ha retrasado.", answer: ["The", "flight", "has", "been", "delayed"], lures: ["is", "delay", "was"] },
  { id: "t102", lvl: 1, es: "¿Dónde está la puerta de embarque?", answer: ["Where", "is", "the", "boarding", "gate"], lures: ["are", "door", "which"] },
  { id: "t103", lvl: 1, es: "Trabajo en el aeropuerto desde 2019.", answer: ["I", "have", "worked", "at", "the", "airport", "since", "2019"], lures: ["work", "for", "in"] },
  { id: "t104", lvl: 2, es: "No se permite fumar dentro de la terminal.", answer: ["Smoking", "is", "not", "allowed", "inside", "the", "terminal"], lures: ["doesn't", "permit", "smoke"] },
  { id: "t105", lvl: 2, es: "Si llueve, cancelarán el vuelo.", answer: ["If", "it", "rains", "they", "will", "cancel", "the", "flight"], lures: ["would", "rain", "cancelled"] },
  { id: "t106", lvl: 2, es: "Las maletas se recogen cada mañana.", answer: ["The", "bags", "are", "collected", "every", "morning"], lures: ["is", "collect", "collecting"] },
  { id: "t107", lvl: 3, es: "Ojalá hubiera estudiado más para el examen.", answer: ["I", "wish", "I", "had", "studied", "more", "for", "the", "exam"], lures: ["would", "study", "studied"] },
  { id: "t108", lvl: 3, es: "Si hubiéramos salido antes, no habríamos perdido el vuelo.", answer: ["If", "we", "had", "left", "earlier", "we", "wouldn't", "have", "missed", "the", "flight"], lures: ["would", "leave", "miss"] },
  { id: "t109", lvl: 3, es: "Me han dicho que el informe ya está firmado.", answer: ["I", "have", "been", "told", "that", "the", "report", "is", "already", "signed"], lures: ["they", "sign", "was"] },
  { id: "t110", lvl: 3, es: "Llevo diez años trabajando en este sector.", answer: ["I", "have", "been", "working", "in", "this", "sector", "for", "ten", "years"], lures: ["since", "work", "am"] },
  { id: "t111", lvl: 3, es: "El pasajero negó haber facturado esa maleta.", answer: ["The", "passenger", "denied", "checking", "in", "that", "suitcase"], lures: ["to", "check", "checked"] },
  { id: "t112", lvl: 4, es: "De no ser por la tripulación, el incidente habría sido peor.", answer: ["Were", "it", "not", "for", "the", "crew", "the", "incident", "would", "have", "been", "worse"], lures: ["if", "was", "had"] },
  { id: "t113", lvl: 4, es: "En ningún caso deben dejarse las maletas sin vigilancia.", answer: ["Under", "no", "circumstances", "should", "bags", "be", "left", "unattended"], lures: ["you", "must", "leaving"] },
  { id: "t114", lvl: 4, es: "Nada más aterrizar, se cerró la pista.", answer: ["No", "sooner", "had", "we", "landed", "than", "the", "runway", "was", "closed"], lures: ["when", "did", "landing"] },
  { id: "t115", lvl: 4, es: "Hicimos que revisaran el sistema de seguridad.", answer: ["We", "had", "the", "security", "system", "checked"], lures: ["to", "check", "checking"] },
  { id: "t116", lvl: 4, es: "A pesar de tener poca experiencia, gestionó el incidente perfectamente.", answer: ["Despite", "having", "little", "experience", "she", "handled", "the", "incident", "perfectly"], lures: ["although", "have", "few"] },
  { id: "t117", lvl: 5, es: "Se dice que ha trabajado en el sector más de treinta años.", answer: ["He", "is", "said", "to", "have", "worked", "in", "the", "sector", "for", "over", "thirty", "years"], lures: ["that", "has", "since"] },
  { id: "t118", lvl: 5, es: "Solo después de la auditoría comprendimos el alcance del problema.", answer: ["Only", "after", "the", "audit", "did", "we", "understand", "the", "extent", "of", "the", "problem"], lures: ["we", "understood", "that"] },
  { id: "t119", lvl: 5, es: "Rara vez he visto una evacuación tan bien organizada.", answer: ["Rarely", "have", "I", "seen", "such", "a", "well-organised", "evacuation"], lures: ["I", "did", "so"] },
  { id: "t120", lvl: 5, es: "Merece la pena estudiar la propuesta en detalle.", answer: ["The", "proposal", "is", "worth", "studying", "in", "detail"], lures: ["to", "study", "worthy"] },
];

// Corrección de errores: elegir la frase CORRECTA entre variantes casi idénticas.
export const ERROR_CORRECTION = [
  { id: "e101", lvl: 2, prompt: `¿Cuál es la frase <b>correcta</b>?`, options: ["He didn't went to the meeting.", "He didn't go to the meeting.", "He not went to the meeting.", "He doesn't went to the meeting."], correctIndex: 1, explanation: `Tras el auxiliar «didn't» el verbo va en <b>infinitivo</b>: didn't <b>go</b>.` },
  { id: "e102", lvl: 2, prompt: `¿Cuál es la frase <b>correcta</b>?`, options: ["There is many passengers waiting.", "There are many passengers waiting.", "There are much passengers waiting.", "There is much passengers waiting."], correctIndex: 1, explanation: `Contable plural → <b>there are</b> + <b>many</b>.` },
  { id: "e103", lvl: 3, prompt: `¿Cuál es la frase <b>correcta</b>?`, options: ["I look forward to hear from you.", "I look forward to hearing from you.", "I look forward hear from you.", "I look forward for hearing from you."], correctIndex: 1, explanation: `«look forward <b>to</b>» lleva gerundio: to <b>hearing</b>.` },
  { id: "e104", lvl: 3, prompt: `¿Cuál es la frase <b>correcta</b>?`, options: ["The staff is very professionals.", "The staff are very professional.", "The staffs are very professional.", "The staff are very professionals."], correctIndex: 1, explanation: `«staff» es colectivo (verbo plural en BrE) y los adjetivos ingleses <b>no llevan plural</b>.` },
  { id: "e105", lvl: 3, prompt: `¿Cuál es la frase <b>correcta</b>?`, options: ["I have seen him yesterday.", "I saw him yesterday.", "I have saw him yesterday.", "I did saw him yesterday."], correctIndex: 1, explanation: `Con un tiempo pasado terminado («yesterday») se usa <b>past simple</b>, no present perfect.` },
  { id: "e106", lvl: 4, prompt: `¿Cuál es la frase <b>correcta</b>?`, options: ["Despite of the delay, we arrived on time.", "Despite the delay, we arrived on time.", "Despite that the delay, we arrived on time.", "Despite of that delay, we arrived on time."], correctIndex: 1, explanation: `<b>Despite</b> nunca lleva «of» (eso sería «in spite of»).` },
  { id: "e107", lvl: 4, prompt: `¿Cuál es la frase <b>correcta</b>?`, options: ["If I would have known, I would have called.", "If I had known, I would have called.", "If I have known, I would have called.", "If I knew, I would have called."], correctIndex: 1, explanation: `En la oración con «if» de la 3ª condicional <b>nunca</b> va «would»: if I <b>had</b> known.` },
  { id: "e108", lvl: 4, prompt: `¿Cuál es la frase <b>correcta</b>?`, options: ["She suggested me to call the manager.", "She suggested that I call the manager.", "She suggested me calling the manager.", "She suggested to me to call the manager."], correctIndex: 1, explanation: `«suggest» no admite objeto + infinitivo: <b>suggest that + sujeto + verbo</b>.` },
  { id: "e109", lvl: 5, prompt: `¿Cuál es la frase <b>correcta</b>?`, options: ["Hardly I had arrived when it started.", "Hardly had I arrived when it started.", "Hardly did I arrive when it started.", "Hardly I arrived when it started."], correctIndex: 1, explanation: `«Hardly» al inicio exige <b>inversión</b> con pasado perfecto: <b>had I arrived</b>.` },
  { id: "e110", lvl: 5, prompt: `¿Cuál es la frase <b>correcta</b>?`, options: ["The information are confidential.", "The information is confidential.", "The informations are confidential.", "An information is confidential."], correctIndex: 1, explanation: `«information» es <b>incontable</b>: verbo en singular y sin plural ni artículo «an».` },
];

// Avisos curados (los generados van en gen-english.js).
export const LISTENING = [
  { id: "l001", lvl: 2, audio: "Attention passengers. The ten forty-five service to Barcelona is delayed by forty minutes. Boarding will now begin at gate twenty-two.", prompt: `How long is the flight delayed?`, options: ["Fourteen minutes", "Forty minutes", "Four minutes", "Fifty minutes"], correctIndex: 1, explanation: `«delayed by forty minutes» → 40 min.` },
  { id: "l002", lvl: 2, audio: "Due to strong winds, arriving aircraft are being held. We expect normal operations to resume within the hour.", prompt: `Why are arriving aircraft being held?`, options: ["Because of fog", "Because of strong winds", "Because of a strike", "Because of a technical fault"], correctIndex: 1, explanation: `«Due to strong winds» → viento fuerte.` },
  { id: "l003", lvl: 2, audio: "Passengers travelling with hand luggage only may go straight to security. Checked bags must be dropped at desk fourteen before nine a m.", prompt: `Where must checked bags be dropped?`, options: ["At the gate", "At desk fourteen", "At security", "At desk forty"], correctIndex: 1, explanation: `«dropped at desk fourteen» → mostrador 14.` },
  { id: "l004", lvl: 2, audio: "The shuttle bus to terminal two leaves every fifteen minutes from stop C, just outside arrivals.", prompt: `How often does the shuttle leave?`, options: ["Every five minutes", "Every fifteen minutes", "Every fifty minutes", "Every hour"], correctIndex: 1, explanation: `«every fifteen minutes» → cada 15 min.` },
  { id: "l005", lvl: 2, audio: "For your safety, please keep your seatbelt fastened while seated, as we may experience sudden turbulence.", prompt: `Why should passengers keep their seatbelt on?`, options: ["To leave quickly", "Because of possible turbulence", "It is the law only at take-off", "To save time"], correctIndex: 1, explanation: `«sudden turbulence» → posibles turbulencias.` },
  { id: "l006", lvl: 3, audio: "This is a security announcement. Unattended baggage will be removed and may be destroyed without further notice.", prompt: `What happens to unattended baggage?`, options: ["It is kept for 24 hours", "It may be removed and destroyed", "It is sent to lost property", "It is returned to the owner"], correctIndex: 1, explanation: `«removed and may be destroyed» → retirado y posiblemente destruido.` },
  { id: "l007", lvl: 3, audio: "Passengers are reminded that liquids in hand luggage must be in containers of one hundred millilitres or less.", prompt: `What is the maximum size for liquid containers?`, options: ["50 millilitres", "100 millilitres", "150 millilitres", "200 millilitres"], correctIndex: 1, explanation: `«one hundred millilitres or less» → 100 ml.` },
  { id: "l008", lvl: 3, audio: "Passengers connecting to domestic flights do not need to collect their checked baggage at this airport.", prompt: `What should connecting passengers do with their checked baggage?`, options: ["Collect it and recheck it", "Leave it; they don't need to collect it", "Take it to customs", "Store it in a locker"], correctIndex: 1, explanation: `«do not need to collect» → no hace falta recogerlo.` },
  { id: "l009", lvl: 4, audio: "Owing to an unexpected technical inspection, departures from stands twelve to eighteen are being reassigned. Please disregard the gate shown on your boarding pass and check the screens.", prompt: `What should passengers do?`, options: ["Follow the gate on their boarding pass", "Ignore the printed gate and check the screens", "Go to stand twelve", "Wait outside the terminal"], correctIndex: 1, explanation: `«disregard the gate shown on your boarding pass and check the screens» → ignorar la puerta impresa y mirar las pantallas.` },
  { id: "l010", lvl: 4, audio: "Following the earlier disruption, we are prioritising passengers with onward connections. If your connecting flight departs within ninety minutes, please make yourself known to a member of staff.", prompt: `Who should speak to a member of staff?`, options: ["Everyone affected by the disruption", "Passengers whose connection leaves within ninety minutes", "Passengers with hand luggage only", "Passengers travelling to domestic destinations"], correctIndex: 1, explanation: `«If your connecting flight departs within ninety minutes» → solo quienes conectan en menos de 90 min.` },
  { id: "l011", lvl: 5, audio: "We regret to inform you that, as a result of an air traffic control restriction across the region, all departures are subject to a rolling delay of up to two hours. Refreshment vouchers are available at the service desk for those whose wait exceeds ninety minutes.", prompt: `Who is entitled to a refreshment voucher?`, options: ["All delayed passengers", "Those waiting more than ninety minutes", "Only passengers with connections", "Those waiting more than two hours"], correctIndex: 1, explanation: `«for those whose wait exceeds ninety minutes» → más de 90 minutos de espera.` },
  { id: "l012", lvl: 5, audio: "Please be advised that the moving walkway in pier B is temporarily out of service for scheduled maintenance. Passengers requiring assistance should allow an additional fifteen minutes to reach their gate.", prompt: `What are passengers requiring assistance advised to do?`, options: ["Use pier C instead", "Allow fifteen extra minutes", "Wait for the walkway to reopen", "Ask staff for a wheelchair"], correctIndex: 1, explanation: `«allow an additional fifteen minutes» → dejar 15 minutos extra.` },
];

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
