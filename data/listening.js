// Tarea 3 · Banco de listening B1/B2 real (reemplaza el LISTENING de data/english.js,
// que se acertaba sin escuchar -- ver auditoría en el PR). Reglas duras que cada ítem
// cumple (verificado por scripts/validar-listening.mjs, que rompe el build si no):
//   1. La opción correcta NUNCA comparte 3+ palabras de contenido consecutivas con el
//      transcript -- exige paráfrasis/inferencia, no caza de palabras clave. Los datos
//      numéricos/horas se dan en cifra en las opciones (audio los dice en palabras).
//   2. Los distractores aparecen mencionados en el audio pero no responden a la
//      pregunta (a menudo un dato que se corrige a mitad de frase).
//   3. Nivel A (B1 bajo) y B (B1): 40-70s estimados. Nivel C y D (B2): 90-150s.
//   4. Acentos variados: en-GB, en-US, en-IE, en-AU, en-IN y un hablante escocés (ver
//      js/engine.js ACCENT_LANGS -- el navegador puede no tener voz distinta para cada
//      uno; es el mejor esfuerzo posible con Web Speech).
//   5. B2 (nivel C/D) incluye una corrección/negación a media frase, un phrasal
//      verb/modismo de uso corriente, y un número que hay que retener hasta el final.
//
// `level`: A (B1 bajo) < B (B1) < C (B2) < D (B2 alto) -- selector en Práctica libre.
// `lvl` 1-5 se mantiene en paralelo por compatibilidad con el resto del curso (near()
// en gen-english.js filtra por lvl, no por level).
// `turns`: diálogo/multivoz -- cada turno con su propio accent. Los ítems de una sola
// voz usan `accent` en el nivel superior y no traen `turns`.

const turnsAudio = (turns) => turns.map((t) => t.text).join(" ");

export const LISTENING = [
  /* ------------------------------ nivel A (B1 bajo) ------------------------------ */
  {
    id: "la1", origen: "generada", level: "A", lvl: 1, speakers: 1, accent: "en-GB",
    audio: `Good morning, everyone, and welcome to Fresh Fields. Today only, tinned soup is half price, but that offer needs three tins or more in your basket — it doesn't apply if you're only buying one or two. We've also moved the bakery's closing time forward: instead of six o'clock, the counter shuts at five today, so grab your bread early if you need it fresh. Loyalty card members get double points on all bread and pastries today too, though that particular offer doesn't stretch to the fruit and vegetable aisle. Speaking of which, that aisle has strawberries in from this morning, and reusable bags are available at the till for twenty cents if you've forgotten yours. The quietest till right now is number four, at the far end near the exit. Thanks for shopping with us, and enjoy the rest of your visit.`,
    prompt: `What do shoppers need to do to get the discount on soup?`,
    options: ["Buy at least three tins together", "Buy just one or two tins", "Bring a reusable bag", "Shop before 5pm"],
    correctIndex: 0,
    correctText: "Buy at least three tins together",
    questionType: "detail",
    explanation: `El descuento exige 3 latas o más en el mismo pedido («needs three tins or more»). Comprar 1-2 latas, traer bolsa reutilizable o las 17h de panadería son datos reales del audio, pero no responden a esta pregunta.`,
  },
  {
    id: "la2", origen: "generada", level: "A", lvl: 1, speakers: 1, accent: "en-US",
    audio: `Attention, readers. The library will be closing early today for staff training — not at eight as usual, but at half past six. Please make sure any books due back today are returned to the box by the front desk before then. The children's section on the first floor is already closed for the afternoon, but the reference room downstairs stays open until closing time. If you still need a computer, there are two free on the ground floor right now. One more thing: the car park behind the building will be locked from six, so move your car before then if you've parked there, and umbrellas or lost property can still be collected from the front desk right up until we close. Thank you, and see you tomorrow at our usual time.`,
    prompt: `What time does the library close today?`,
    options: ["8:00 pm", "6:30 pm", "6:00 pm", "6:45 pm"],
    correctIndex: 1,
    correctText: "6:30 pm",
    questionType: "number",
    explanation: `«not at eight as usual, but at half past six» → cierra a las 6:30, no a las 8:00 (esa es la hora habitual, mencionada como contraste). El aparcamiento se cierra a las 18:00, una hora distinta, para despistar.`,
  },
  {
    id: "la3", origen: "generada", level: "A", lvl: 1, speakers: 1, accent: "en-IE",
    audio: `Good afternoon. Due to roadworks on Main Street, route number nine will not stop at Market Square today. Instead, the number nine will use the diversion via Church Lane and stop at the temporary stop outside the post office, about two minutes' walk from the usual one. This change affects only route nine — routes twelve and fourteen are running as normal through Market Square, with no changes to either of their timetables. The diversion is expected to stay in place for the rest of this week, with normal service resuming next Monday morning. If you're unsure where the temporary stop is, there's a member of staff on Church Lane this week who can point you in the right direction. We apologise for any inconvenience and thank you for your patience.`,
    prompt: `Which bus route is affected by the diversion?`,
    options: ["Number 9", "Number 12", "Number 14", "All routes through Market Square"],
    correctIndex: 0,
    correctText: "Number 9",
    questionType: "notsaid",
    explanation: `Solo la línea 9 se desvía; el audio dice explícitamente que la 12 y la 14 siguen pasando por Market Square con normalidad.`,
  },

  /* -------------------------------- nivel B (B1) --------------------------------- */
  {
    id: "lb1", origen: "generada", level: "B", lvl: 2, speakers: 2,
    turns: [
      { speaker: "Customer", accent: "en-US", text: "Hi, could we get a table for four, please? We don't have a booking." },
      { speaker: "Waiter", accent: "en-GB", text: "Of course. We've got a table free by the window, but it's only set for two at the moment — give us five minutes and we'll add two more chairs. Would you like to wait at the bar meanwhile?" },
      { speaker: "Customer", accent: "en-US", text: "That's fine, thanks. Oh, one more thing — do you still do the set lunch menu after two o'clock?" },
      { speaker: "Waiter", accent: "en-GB", text: "We do, but only until half past two, and it switches from the full menu to a shorter version after that — just soup, a main, and coffee, no starter or dessert." },
      { speaker: "Customer", accent: "en-US", text: "Got it. And does the set menu still come with a drink included, or is that extra now?" },
      { speaker: "Waiter", accent: "en-GB", text: "It used to include a soft drink, that's true, but that changed last month — it's an extra euro now, everything else about the menu stays the same as before." },
      { speaker: "Customer", accent: "en-US", text: "Understood, that's fine. We'll order quickly then, thanks." },
    ],
    get audio() { return turnsAudio(this.turns); },
    prompt: `What happens to the set lunch menu after 2:30?`,
    options: ["It becomes a shorter version without starter or dessert", "It stops completely at 2:30", "It stays the same full menu all day", "It's only available at the bar"],
    correctIndex: 0,
    correctText: "It becomes a shorter version without starter or dessert",
    questionType: "detail",
    explanation: `Tras las 14:30 el menú pasa a una versión más corta (solo sopa, plato y café, sin entrante ni postre); no se acaba, y lo de esperar en la barra es otro dato del audio que no responde a esto.`,
  },
  {
    id: "lb2", origen: "generada", level: "B", lvl: 2, speakers: 2,
    turns: [
      { speaker: "Staff", accent: "en-AU", text: "Hi there, two tickets for the seven o'clock screening of Ocean Drift?" },
      { speaker: "Customer", accent: "en-GB", text: "Actually, we'd rather see the nine forty-five one if there's still room — is that the one with subtitles?" },
      { speaker: "Staff", accent: "en-AU", text: "Let me check... yes, nine forty-five still has seats, and that's the subtitled showing. The seven o'clock is the dubbed version tonight, just so you know." },
      { speaker: "Customer", accent: "en-GB", text: "Perfect, we'll take the later one then. Are the seats still okay near the back, or is it mostly full already?" },
      { speaker: "Staff", accent: "en-AU", text: "Plenty of room at the back for the nine forty-five, yeah, that one's barely a third full. The seven o'clock's nearly sold out though, only a couple of seats left right at the very front." },
      { speaker: "Customer", accent: "en-GB", text: "Good, back row for us then, please. Two tickets." },
      { speaker: "Staff", accent: "en-AU", text: "No worries. That'll be twenty-two dollars, and popcorn's half price with any ticket until eight." },
    ],
    get audio() { return turnsAudio(this.turns); },
    prompt: `Which screening is subtitled?`,
    options: ["The 9:45 showing", "The 7:00 showing", "Both screenings", "Neither screening"],
    correctIndex: 0,
    correctText: "The 9:45 showing",
    questionType: "detail",
    explanation: `El pase de las 9:45 lleva subtítulos; el de las 7:00 es la versión doblada esa noche (dato mencionado como contraste, no la respuesta).`,
  },
  {
    id: "lb3", origen: "generada", level: "B", lvl: 2, speakers: 1, accent: "en-IN",
    audio: `What a first half we've had here at Riverside Park. City took the lead early through a header, but it was cancelled out just before the break by a well-worked free kick. Now, City had two players booked in the first half, so they'll need to be careful after the restart — one more card for either of them and it's an early shower. The visiting side, meanwhile, go into the second half with a full squad of options on the bench, including their top scorer, who started this one on the sidelines. Both managers will be watching their substitutes closely: City replaced their injured winger just before the break, which certainly wasn't part of the plan, and that change may force a reshuffle in midfield. Expect a more cautious second half, with both sides keen to avoid picking up a third yellow card before this one's decided. We're back after the break with the second half.`,
    prompt: `What is the score situation at half-time?`,
    options: ["Level, one goal each", "City are ahead by one goal", "The visitors are ahead", "Still 0-0"],
    correctIndex: 0,
    correctText: "Level, one goal each",
    questionType: "inference",
    explanation: `«took the lead» y luego «cancelled out» → el gol local se empató, están 1-1. El audio nunca dice el marcador con números: hay que deducirlo.`,
  },

  /* -------------------------------- nivel C (B2) ---------------------------------- */
  {
    id: "lc1", origen: "generada", level: "C", lvl: 3, speakers: 2,
    turns: [
      { speaker: "Foreman", accent: "en-GB", text: "Right, so the kitchen extension — we said we'd start pouring the foundations on the fourteenth, but actually, with the concrete delivery delayed, it'll be the seventeenth now. Three days later than planned." },
      { speaker: "Client", accent: "en-IE", text: "Okay, that's a bit annoying, but not a disaster. Does that push the whole project back by three days as well?" },
      { speaker: "Foreman", accent: "en-GB", text: "Not quite — once we get going, the team can make up some of that time, so we're really only looking at losing one day overall by the end. I know it's frustrating, but let's just get the ball rolling and I'll keep you posted every step of the way." },
      { speaker: "Client", accent: "en-IE", text: "Fair enough. And the budget — still around eight thousand for the extension, or has that shifted too?" },
      { speaker: "Foreman", accent: "en-GB", text: "Budget's holding steady at eight thousand, don't worry about that part." },
      { speaker: "Client", accent: "en-IE", text: "Good. And what about the planning permission — that's all sorted, isn't it? I really don't want the council knocking on the door halfway through." },
      { speaker: "Foreman", accent: "en-GB", text: "All sorted, yeah, came through last month, no issues there at all. One more thing though — we may need to swap the roof material. We'd quoted for the grey slate tiles, but the supplier told us this morning that style's out of stock for another six weeks, so we're looking at a similar tile in a slightly darker charcoal instead, same price, no extra cost to you." },
      { speaker: "Client", accent: "en-IE", text: "That's fine by me, charcoal might actually suit the brickwork better anyway. Anything else I should know before you start?" },
      { speaker: "Foreman", accent: "en-GB", text: "Just that the skip will arrive on the sixteenth, a day before the concrete, so expect some disruption to the driveway from then onward. We'll keep everything as tidy as we possibly can." },
    ],
    get audio() { return turnsAudio(this.turns); },
    prompt: `In the end, by how many days will the overall project be delayed?`,
    options: ["One day", "Three days", "Seventeen days", "It won't be delayed at all"],
    correctIndex: 0,
    correctText: "One day",
    questionType: "number",
    explanation: `El inicio se retrasa 3 días (14→17), pero el capataz aclara que el equipo recupera parte del tiempo y el retraso final del proyecto es de 1 día. «Get the ball rolling» = ponerse en marcha.`,
  },
  {
    id: "lc2", origen: "generada", level: "C", lvl: 3, speakers: 1, accent: "en-AU",
    audio: `Now for the weekend forecast across the region. Saturday starts bright for most of us, with some early sunshine expected inland, but we're expecting temperatures to drop sharply by the afternoon — forecasters had said nine degrees for the high earlier in the week, but the latest models now point to more like four degrees instead, so it'll feel considerably colder than first thought, especially once the wind picks up. Coastal areas will see the worst of it: there's a strong chance of gale-force winds overnight into Sunday, gusting up to seventy kilometres an hour in the most exposed spots, so if you've got anything loose in the garden — bins, trampolines, garden furniture — it's time to batten down the hatches before you turn in tonight. Inland areas should see somewhat lighter winds, more like thirty to forty kilometres an hour, though still enough to feel blustery on higher ground. Sunday itself should be calmer as the front clears through overnight, with highs recovering to around eight degrees by the afternoon and a decent spell of sunshine for most areas, though a few showers can't be ruled out further north, especially later in the day. Looking a little further ahead, next week starts unsettled too, with more rain arriving by Tuesday, but we'll have the full details on that in tomorrow's update. One last thing for anyone with allergies — the pollen count stays high through the weekend despite the wind, so it's not the relief that hay fever sufferers might have been hoping for, and UV levels will stay moderate whenever the sun does break through, so a bit of sun cream wouldn't go amiss if you're out in the garden.`,
    prompt: `What is Saturday's high temperature now expected to be?`,
    options: ["4°C", "9°C", "8°C", "0°C"],
    correctIndex: 0,
    correctText: "4°C",
    questionType: "number",
    explanation: `La previsión inicial (9°) se corrige a 4° a media frase («had said nine degrees, but... now four degrees»). Los 8° son la máxima del domingo, no del sábado. «Batten down the hatches» = asegurarlo todo bien.`,
  },
  {
    id: "lc3", origen: "generada", level: "C", lvl: 3, speakers: 2,
    turns: [
      { speaker: "Nurse", accent: "en-IN", text: "So your appointment was originally booked for half past three, but Doctor Reyes is running behind today — we've had to move you to twenty past four instead. Sorry about that." },
      { speaker: "Patient", accent: "en-GB", text: "That's alright, these things happen. Is that still with Doctor Reyes, or someone else?" },
      { speaker: "Nurse", accent: "en-IN", text: "Still with Doctor Reyes, don't worry. In the meantime, I just need to check — are you still feeling under the weather, or has that cleared up since your last visit?" },
      { speaker: "Patient", accent: "en-GB", text: "Much better now, thanks. Just the occasional headache. While I'm here, actually — I was also meant to get a repeat prescription. Is that something you can sort today, or do I need a separate appointment for it?" },
      { speaker: "Nurse", accent: "en-IN", text: "I can actually sort that for you right now, save you coming back another day. Let me just pull up your file... yes, you're due a refill on the usual dosage, that's all fine, I'll send that through to the pharmacy so it's ready within the hour." },
      { speaker: "Patient", accent: "en-GB", text: "Perfect, that saves me a trip. Is it the same pharmacy as last time, the one on Bridge Street?" },
      { speaker: "Nurse", accent: "en-IN", text: "That's normally the one, yes — actually, hold on, they've had some stock issues this week, so it might be quicker for you to collect it from the pharmacy inside the health centre instead, just two minutes from here. I'd go with that one today if I were you." },
      { speaker: "Patient", accent: "en-GB", text: "Good to know, I'll do that then. Thanks for sorting it all out for me." },
      { speaker: "Nurse", accent: "en-IN", text: "No problem at all. I'll note everything down. Take a seat and we'll call you at twenty past four, and help yourself to water from the machine by the entrance if you'd like some while you wait." },
    ],
    get audio() { return turnsAudio(this.turns); },
    prompt: `What time is the patient now being seen?`,
    options: ["4:20", "3:30", "4:30", "3:20"],
    correctIndex: 0,
    correctText: "4:20",
    questionType: "number",
    explanation: `La cita se corrige de las 3:30 (hora original) a las 4:20 porque el médico va con retraso. «Under the weather» = pachucho/con malestar.`,
  },

  /* -------------------------------- nivel D (B2 alto) ----------------------------- */
  {
    id: "ld1", origen: "generada", level: "D", lvl: 4, speakers: 3,
    turns: [
      { speaker: "Advisor", accent: "en-GB", text: "So, looking at your joint savings account, the interest rate we quoted last month was one point eight percent — but I have to say, that's actually gone up since then, to two point one percent, which works in your favour." },
      { speaker: "Client A", accent: "en-US", text: "Oh, that's good news. So if we left the current balance in for a year at that rate, roughly what would we end up with in interest?" },
      { speaker: "Advisor", accent: "en-GB", text: "Based on today's balance, you'd be looking at around three hundred and forty pounds in interest over the year — not bad at all. Just bear in mind, though, rates like this can change again, so it's not guaranteed to stay at two point one." },
      { speaker: "Client B", accent: "en-IE", text: "Fair enough. And no penalty for withdrawing early if we need to, is there?" },
      { speaker: "Advisor", accent: "en-GB", text: "None at all — that's the whole point of this account, no lock-in. Just try not to cut corners on the minimum balance, though, or the rate drops back down automatically." },
      { speaker: "Client B", accent: "en-IE", text: "One more thing — if interest rates keep climbing generally, is there any advantage in fixing the rate now instead of staying on this variable one?" },
      { speaker: "Advisor", accent: "en-GB", text: "That's genuinely worth thinking about. Fixing now would lock you in at two point one for eighteen months, guaranteed, whereas staying variable means it could climb further still, but it could equally come back down if the market shifts direction. It really comes down to how much certainty you'd both prefer." },
      { speaker: "Client A", accent: "en-US", text: "I think I'd rather have the certainty, if I'm honest with you. Could we get a formal quote for the fixed option before deciding anything either way?" },
      { speaker: "Advisor", accent: "en-GB", text: "Of course, I'll get that over to you both by email this afternoon, no obligation attached at all." },
    ],
    get audio() { return turnsAudio(this.turns); },
    prompt: `What is the current interest rate on the account?`,
    options: ["2.1%", "1.8%", "3.4%", "£340"],
    correctIndex: 0,
    correctText: "2.1%",
    questionType: "number",
    explanation: `El 1,8% era la tasa del mes pasado; ha subido al 2,1%. Los 340 £ son la cantidad de interés estimada, no el tipo. «Cut corners» = hacer las cosas mal/con atajos para ahorrar esfuerzo.`,
  },
  {
    id: "ld2", origen: "generada", level: "D", lvl: 4, speakers: 3,
    turns: [
      { speaker: "Host", accent: "en-AU", text: "Right, let's go straight to our travel reporter for the latest on the ring road. What's happening out there?" },
      { speaker: "Reporter", accent: "en-GB", text: "So earlier we were told the northbound carriageway would reopen by four o'clock, but that's now been pushed back — repair crews found more damage than expected, so it's looking more like six o'clock before it's fully clear. Southbound has been moving freely all morning, that hasn't changed." },
      { speaker: "Host", accent: "en-AU", text: "Right, so northbound drivers, you're looking at a longer wait than we first thought. We've actually got a caller on the line who's stuck there right now — go ahead." },
      { speaker: "Caller", accent: "en-US", text: "Yeah, hi, I've been sitting here for forty minutes already, it's basically back to square one for anyone who left home expecting it to clear by four. My advice, take the old bridge route instead if you possibly can." },
      { speaker: "Reporter", accent: "en-GB", text: "That's a fair shout, and just to add to that — the diversion signs for the bridge route aren't brilliant at the moment, so if you're not familiar with the area, it's probably worth following it on your phone rather than relying purely on the road signs." },
      { speaker: "Host", accent: "en-AU", text: "Good tip, thanks both. We've actually got another update just in as we're talking — apparently that six o'clock estimate might even be a touch optimistic now." },
      { speaker: "Reporter", accent: "en-GB", text: "Yeah, our contact with the repair crew says it could run into the evening rush if they hit any further problems, so I'd treat six as the earliest realistic time rather than a guarantee at this point, to be honest." },
      { speaker: "Host", accent: "en-AU", text: "Right, so to sum up for anyone just joining us — northbound delayed until at least six, southbound running fine, and worth considering that bridge route if you're heading north this morning." },
    ],
    get audio() { return turnsAudio(this.turns); },
    prompt: `By what time is the northbound carriageway now expected to reopen?`,
    options: ["6:00", "4:00", "5:00", "It won't reopen today"],
    correctIndex: 0,
    correctText: "6:00",
    questionType: "number",
    explanation: `El horario se corrige de las 4:00 (previsión inicial) a las 6:00 por daños peores de lo esperado. «Back to square one» = volver a empezar de cero.`,
  },
  {
    id: "ld3", origen: "generada", level: "D", lvl: 4, speakers: 2,
    turns: [
      { speaker: "Agent", accent: "en-GB", text: "Good evening, I can see your connecting flight to Edinburgh — that was originally boarding from gate fourteen, but there's been a late gate change, I'm afraid. It's now gate twenty-two instead." },
      { speaker: "Passenger", accent: "en-GB-SCT", text: "Ach, of course it is. Is that still the same departure time, or has that shifted as well?" },
      { speaker: "Agent", accent: "en-GB", text: "Same time, don't worry, still six forty-five — only the gate's changed, not the schedule. You've got about thirty-five minutes, so if you get a move on now you'll make it comfortably." },
      { speaker: "Passenger", accent: "en-GB-SCT", text: "Right, no bother. Is there a shorter way through, or do I just follow the signs the whole way?" },
      { speaker: "Agent", accent: "en-GB", text: "Follow the signs for gates twenty to twenty-five — it's actually quicker than it sounds, maybe eight minutes on foot if you walk briskly, and there's a moving walkway for most of it. Oh, one more thing — they've just announced your connecting flight is now boarding from the far end near the food court, not the section closer to security like it usually would be." },
      { speaker: "Passenger", accent: "en-GB-SCT", text: "Ach, good to know, cheers for that, I'd have gone the wrong way otherwise. Better hit the road then." },
      { speaker: "Agent", accent: "en-GB", text: "No bother at all, happens to plenty of people this evening actually, with the change so last-minute. Once you're through, there's also a short delay expected on the connecting flight itself — nothing official yet, so don't rely on it, but the crew mentioned it might push back by ten or fifteen minutes once everyone's boarded." },
      { speaker: "Passenger", accent: "en-GB-SCT", text: "Ach, well, that'll do me just fine then, gives me a wee bit more breathing room than I thought I'd have. Thanks again for all your help, safe travels to you too this evening." },
    ],
    get audio() { return turnsAudio(this.turns); },
    prompt: `Which gate does the passenger now need to go to?`,
    options: ["Gate 22", "Gate 14", "Gate 6", "Gate 45"],
    correctIndex: 0,
    correctText: "Gate 22",
    questionType: "number",
    explanation: `La puerta se corrige de la 14 (original) a la 22. Los 45 son los minutos aproximados que le quedan, no un número de puerta. «Hit the road» = ponerse en marcha/salir.`,
  },
];

/**
 * Duración estimada en segundos a partir del recuento de palabras del transcript y una
 * velocidad orientativa por nivel (medio del rango pedido: A/B ≈150 ppm, C/D ≈178 ppm).
 * No es la duración real del audio (eso depende del motor TTS del navegador) -- es la
 * cifra que scripts/validar-listening.mjs usa como proxy para exigir la duración de la
 * Tarea 3 (B1 40-70s, B2 90-150s) en tiempo de autoría/CI.
 */
export function estimateDurationSec(item) {
  const words = (item.audio.match(/[A-Za-z']+/g) ?? []).length;
  const wpm = item.level === "A" || item.level === "B" ? 150 : 178;
  return Math.round((words / wpm) * 60);
}

export const LEVEL_LABEL = { A: "Nivel A · B1 bajo", B: "Nivel B · B1", C: "Nivel C · B2", D: "Nivel D · B2 alto" };
export const LEVELS = ["A", "B", "C", "D"];
