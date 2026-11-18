// EN: Interface texts. Italian for Italian users, English for everyone else.
//     To add a language later: add a key to Lingua and a block to TESTI.
// IT: Testi dell'interfaccia. Italiano per chi usa l'italiano, inglese per tutti gli altri.
//     Per aggiungere una lingua in futuro: una chiave in Lingua e un blocco in TESTI.

export type Lingua = 'it' | 'en'

export type Testi = {
  locale: string
  sessione: string
  settimana: string
  nd: string
  attesa: string
  apriUtilizzo: string
  azzeramentoIgnoto: string
  inAzzeramento: string
  traOreMin: (h: number, m: number) => string
  traMin: (m: number) => string
  ilGiornoAlle: (giorno: string, ora: string) => string
  ilUtc: (quando: string) => string
  nessunaLettura: string
  arrivaCon: string
  paginaUtilizzo: string
  rigaSessione: (pct: string, dopo: string) => string
  rigaSettimana: (pct: string, dopo: string) => string
  rigaAltra: (kind: string, pct: string) => string
  letturaDelle: (ora: string) => string
  comando: string
  descrizioneComando: string
  erroreLettura: string
}

export const TESTI: Record<Lingua, Testi> = {
  it: {
    locale: 'it-IT',
    sessione: 'Sessione',
    settimana: 'Settimana',
    nd: 'n/d',
    attesa: 'Limiti: in attesa della prima risposta · ',
    apriUtilizzo: 'Apri Utilizzo',
    azzeramentoIgnoto: 'azzeramento ignoto',
    inAzzeramento: 'in azzeramento',
    traOreMin: (h, m) => `si azzera tra ${h} h ${m} min`,
    traMin: m => `si azzera tra ${m} min`,
    ilGiornoAlle: (g, o) => `si azzera ${g} alle ${o}`,
    ilUtc: q => `si azzera il ${q} UTC`,
    nessunaLettura: 'Nessuna lettura dei limiti disponibile.',
    arrivaCon: 'Arriva con la prima risposta del modello, e solo con un abbonamento Claude (non con una chiave API).',
    paginaUtilizzo: 'Pagina Utilizzo',
    rigaSessione: (p, d) => `Sessione (5 ore): ${p} usato, ${d}`,
    rigaSettimana: (p, d) => `Settimana: ${p} usato, ${d}`,
    rigaAltra: (k, p) => `${k}: ${p} usato`,
    letturaDelle: o => `Lettura delle ${o}.`,
    comando: 'utilizzo',
    descrizioneComando: 'Mostra i limiti di utilizzo (5 ore e settimanale) e il link alla pagina Utilizzo',
    erroreLettura: 'Lettura dei limiti non riuscita.',
  },
  en: {
    locale: 'en-GB',
    sessione: 'Session',
    settimana: 'Week',
    nd: 'n/a',
    attesa: 'Limits: waiting for the first response · ',
    apriUtilizzo: 'Open Usage',
    azzeramentoIgnoto: 'reset unknown',
    inAzzeramento: 'resetting',
    traOreMin: (h, m) => `resets in ${h} h ${m} min`,
    traMin: m => `resets in ${m} min`,
    ilGiornoAlle: (g, o) => `resets ${g} at ${o}`,
    ilUtc: q => `resets ${q} UTC`,
    nessunaLettura: 'No usage-limit reading available yet.',
    arrivaCon: "It arrives with the model's first response, and only on a Claude subscription (not with an API key).",
    paginaUtilizzo: 'Usage page',
    rigaSessione: (p, d) => `Session (5 hours): ${p} used, ${d}`,
    rigaSettimana: (p, d) => `Week: ${p} used, ${d}`,
    rigaAltra: (k, p) => `${k}: ${p} used`,
    letturaDelle: o => `Read at ${o}.`,
    comando: 'usage-limits',
    descrizioneComando: 'Shows the usage limits (5-hour and weekly) and a link to the Usage page',
    erroreLettura: 'Could not read the limits.',
  },
}

// EN: Maps any language name or locale tag to a supported language: Italian stays Italian, anything else is English.
// IT: Converte un nome di lingua o un tag di locale in una lingua supportata: l'italiano resta italiano, tutto il resto è inglese.
export function daTesto(v: string): Lingua {
  const s = v.trim().toLowerCase()
  return /^(it([-_].*)?|ita|italian|italiano)$/.test(s) ? 'it' : 'en'
}
