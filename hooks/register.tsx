// usage-limits-bar — Claude Code mod
// EN: Always-visible band above the prompt showing the real usage of the Claude
//     subscription limits: the 5-hour session window and the weekly window.
//     Texts follow the user's language: Italian for Italian, English otherwise.
// IT: Riga sempre visibile sopra il prompt con l'uso reale dei limiti
//     dell'abbonamento Claude: la finestra di sessione di 5 ore e quella settimanale.
//     I testi seguono la lingua dell'utente: italiano per l'italiano, inglese altrimenti.

import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, SessionRateLimit } from 'claude-code'

import type { Finestra, Lettura, LinguaScelta } from '../types'
import { daTesto, TESTI } from './testi'
import type { Lingua, Testi } from './testi'

// EN: Last reading of the limit windows, kept in session state so it survives hot reloads.
// IT: Ultima lettura delle finestre di limite, nello stato di sessione così sopravvive ai ricaricamenti.
const lettura = atom({ plugin: 'usage-limits-bar', key: 'lettura' } as const, null)
// EN: Bumped every minute only to redraw the countdown.
// IT: Incrementato ogni minuto solo per ridisegnare il conto alla rovescia.
const tick = atom({ plugin: 'usage-limits-bar', key: 'tick' } as const, 0)
// EN: The language in use and where it was detected from.
// IT: La lingua in uso e da dove è stata rilevata.
const lingua = atom({ plugin: 'usage-limits-bar', key: 'lingua' } as const, null)

const PAGINA_UTILIZZO = 'https://claude.ai/settings/usage'
const LARGHEZZA_BARRA = 10

// EN: Bar colours: green below 50%, yellow from 50%, red from 80%.
// IT: Colori della barra: verde sotto il 50%, giallo dal 50%, rosso dall'80%.
const VERDE = '#3fb950'
const GIALLO = '#d29922'
const ROSSO = '#f85149'
const SPENTO = '#6e7681'

// EN: Time zone used for the weekly reset date; undefined means the computer's own zone.
// IT: Fuso orario usato per la data di azzeramento settimanale; undefined significa quello del computer.
let fuso: string | undefined

// EN: The operating system's locale (e.g. "it-IT"), or undefined when Intl cannot tell.
// IT: La lingua del sistema operativo (es. "it-IT"), o undefined se Intl non la sa dire.
function localeSistema(): string | undefined {
  try {
    return Intl.DateTimeFormat().resolvedOptions().locale
  } catch {
    return undefined
  }
}

// EN: Picks the language: the mod's own option first, then Claude Code's language setting,
//     then the operating system's locale; English when none says Italian.
// IT: Sceglie la lingua: prima l'opzione della mod, poi l'impostazione di lingua di Claude Code,
//     poi la lingua del sistema operativo; inglese se nessuna dice italiano.
async function rileva($: EngineInterface, opzione: string): Promise<LinguaScelta> {
  if (opzione === 'it' || opzione === 'en') return { lingua: opzione, fonte: 'option' }
  try {
    const riga = (await $.config.list()).find(r => r.key === 'language')
    if (riga && typeof riga.value === 'string' && riga.value.trim() !== '') {
      return { lingua: daTesto(riga.value), fonte: 'claude-code-setting' }
    }
  } catch {
    // EN: Settings not readable here: go on to the system locale.
    // IT: Impostazioni non leggibili qui: si passa alla lingua di sistema.
  }
  const loc = localeSistema()
  if (loc) return { lingua: daTesto(loc.split('-')[0] ?? ''), fonte: 'system-locale' }
  return { lingua: 'en', fonte: 'default' }
}

function colore(pct: number): string {
  if (pct >= 80) return ROSSO
  if (pct >= 50) return GIALLO
  return VERDE
}

function barra(pct: number): { piena: string; vuota: string } {
  const n = Math.max(0, Math.min(LARGHEZZA_BARRA, Math.round((pct / 100) * LARGHEZZA_BARRA)))
  return { piena: '█'.repeat(n), vuota: '░'.repeat(LARGHEZZA_BARRA - n) }
}

function percentuale(pct: number): string {
  return `${Number.isInteger(pct) ? pct : pct.toFixed(1)}%`
}

// EN: Countdown to the reset, e.g. "resets in 2 h 14 min".
// IT: Conto alla rovescia all'azzeramento, es. "si azzera tra 2 h 14 min".
function mancano(t: Testi, resetsAt: string | undefined, ora: number): string {
  if (!resetsAt) return t.azzeramentoIgnoto
  const ms = Date.parse(resetsAt) - ora
  if (!Number.isFinite(ms)) return t.azzeramentoIgnoto
  if (ms <= 0) return t.inAzzeramento
  const min = Math.floor(ms / 60000)
  const h = Math.floor(min / 60)
  const m = min % 60
  return h > 0 ? t.traOreMin(h, m) : t.traMin(m)
}

// EN: Day and time of the reset, e.g. "resets Thu 19 Nov at 09:00".
// IT: Giorno e ora dell'azzeramento, es. "si azzera gio 19 nov alle 09:00".
function quando(t: Testi, resetsAt: string | undefined): string {
  if (!resetsAt) return t.azzeramentoIgnoto
  const d = new Date(resetsAt)
  if (Number.isNaN(d.getTime())) return t.azzeramentoIgnoto
  try {
    const giorno = d.toLocaleDateString(t.locale, { weekday: 'short', day: 'numeric', month: 'short', timeZone: fuso })
    const ora = d.toLocaleTimeString(t.locale, { hour: '2-digit', minute: '2-digit', timeZone: fuso })
    return t.ilGiornoAlle(giorno, ora)
  } catch {
    // EN: Unknown time zone name or no Intl support: fall back to UTC.
    // IT: Nome di fuso sconosciuto o Intl assente: si ripiega su UTC.
    return t.ilUtc(resetsAt.slice(0, 16).replace('T', ' '))
  }
}

function trova(finestre: Finestra[], kind: string): Finestra | undefined {
  return finestre.find(f => f.kind === kind)
}

function copia(rateLimits: SessionRateLimit[]): Lettura {
  return {
    finestre: rateLimits.map(r => ({ kind: r.kind, percentUsed: r.percentUsed, resetsAt: r.resetsAt })),
    letturaAlle: Date.now(),
  }
}

// EN: Plain-text summary used by the slash command and by the leggi_limiti tool.
// IT: Riepilogo in testo semplice usato dal comando e dallo strumento leggi_limiti.
function riepilogo(t: Testi, l: Lettura | null, ora: number): string {
  if (!l || l.finestre.length === 0) {
    return [t.nessunaLettura, t.arrivaCon, `${t.paginaUtilizzo}: ${PAGINA_UTILIZZO}`].join('\n')
  }
  const righe: string[] = []
  const s = trova(l.finestre, 'five_hour')
  const w = trova(l.finestre, 'seven_day')
  if (s) righe.push(t.rigaSessione(percentuale(s.percentUsed), mancano(t, s.resetsAt, ora)))
  if (w) righe.push(t.rigaSettimana(percentuale(w.percentUsed), quando(t, w.resetsAt)))
  for (const f of l.finestre) {
    if (f !== s && f !== w) righe.push(t.rigaAltra(f.kind, percentuale(f.percentUsed)))
  }
  let alle: string
  try {
    alle = new Date(l.letturaAlle).toLocaleTimeString(t.locale, { timeZone: fuso })
  } catch {
    alle = new Date(l.letturaAlle).toISOString().slice(11, 19) + ' UTC'
  }
  righe.push(t.letturaDelle(alle))
  righe.push(`${t.paginaUtilizzo}: ${PAGINA_UTILIZZO}`)
  return righe.join('\n')
}

// EN: The language for this session: the stored choice, or the system locale before detection has run.
// IT: La lingua di questa sessione: la scelta salvata, o la lingua di sistema prima che la rilevazione sia fatta.
async function testi($: EngineInterface): Promise<{ t: Testi; scelta: LinguaScelta | null }> {
  const scelta = await read($, lingua)
  const l: Lingua = scelta?.lingua ?? daTesto((localeSistema() ?? 'en').split('-')[0] ?? 'en')
  return { t: TESTI[l], scelta }
}

export const register: Register = (on, options) => {
  const sceltoFuso = typeof options.fuso_orario === 'string' ? options.fuso_orario.trim() : ''
  fuso = sceltoFuso === '' ? undefined : sceltoFuso
  const opzioneLingua = typeof options.lingua === 'string' ? options.lingua.trim().toLowerCase() : 'auto'

  // EN: Detects the language, takes a first reading, registers the slash command and the tool, starts the 1-minute redraw.
  // IT: Rileva la lingua, fa una prima lettura, registra il comando e lo strumento, avvia il ridisegno ogni minuto.
  on('session.start', async ($, e, next) => {
    const out = await next(e)
    const scelta = await rileva($, opzioneLingua)
    await update($, lingua, () => scelta)
    const t = TESTI[scelta.lingua]

    const { rateLimits } = await $.session.usage()
    if (rateLimits.length > 0) await update($, lettura, () => copia(rateLimits))

    $.clock.every(60_000, () => void update($, tick, n => n + 1))

    await $.command.register({ name: t.comando, description: t.descrizioneComando })
    await $.tool.register({
      name: 'leggi_limiti',
      description:
        "Reads the real usage limits of the Claude account (5-hour and weekly windows): percent used and reset time, as reported by the last API response. / Legge i limiti di utilizzo reali dell'account Claude (finestra di 5 ore e settimanale): percentuale usata e azzeramento.",
      isDeferred: true,
    })
    return out
  })

  // EN: The engine pushes new figures here when a window moves by a whole point.
  // IT: Il motore invia qui i nuovi valori quando una finestra si sposta di un punto intero.
  on('session.measure', async ($, e, next) => {
    if (e.changed.includes('rateLimits')) {
      await update($, lettura, () => copia(e.rateLimits))
    }
    return next(e)
  })

  // EN: One answer for both command names; only the one matching the language is registered.
  // IT: Una sola risposta per entrambi i nomi del comando; viene registrato solo quello della lingua in uso.
  for (const nome of [TESTI.it.comando, TESTI.en.comando]) {
    on('command.run', { command: nome }, async $ => {
      const { rateLimits } = await $.session.usage()
      if (rateLimits.length > 0) await update($, lettura, () => copia(rateLimits))
      const { t } = await testi($)
      return { text: riepilogo(t, await read($, lettura), Date.now()) }
    })
  }

  on('tool.run', { tool: 'mcp__usage-limits-bar__leggi_limiti' }, async $ => {
    const { rateLimits } = await $.session.usage()
    if (rateLimits.length > 0) await update($, lettura, () => copia(rateLimits))
    const { t, scelta } = await testi($)
    return {
      result: JSON.stringify(
        { rateLimits, language: scelta, summary: riepilogo(t, await read($, lettura), Date.now()) },
        null,
        2,
      ),
    }
  }).catch(() => ({ result: 'Could not read the limits. / Lettura dei limiti non riuscita.' }))

  // EN: The band itself: two coloured bars, session and week.
  // IT: La riga vera e propria: due barre colorate, sessione e settimana.
  on('ui.render', { component: 'AbovePrompt' }, async ($, e) => {
    const l = await read($, lettura)
    await read($, tick)
    const { t } = await testi($)
    const { Box, Text, Link } = $.ui.resolve(e)
    const ora = Date.now()

    if (!l || l.finestre.length === 0) {
      return (
        <Box flexDirection="row">
          <Text color={SPENTO}>{t.attesa}</Text>
          <Link href={PAGINA_UTILIZZO}>{t.apriUtilizzo}</Link>
        </Box>
      )
    }

    const voce = (etichetta: string, f: Finestra | undefined, dopo: string) => {
      if (!f) return <Text color={SPENTO}>{etichetta} {t.nd}</Text>
      const { piena, vuota } = barra(f.percentUsed)
      const c = colore(f.percentUsed)
      return (
        <Text>
          <Text bold>{etichetta} </Text>
          <Text color={c}>{piena}</Text>
          <Text color={SPENTO}>{vuota}</Text>
          <Text bold color={c}> {percentuale(f.percentUsed)}</Text>
          <Text color={SPENTO}> · {dopo}</Text>
        </Text>
      )
    }

    const s = trova(l.finestre, 'five_hour')
    const w = trova(l.finestre, 'seven_day')

    return (
      <Box flexDirection="row" flexWrap="wrap">
        {voce(t.sessione, s, s ? mancano(t, s.resetsAt, ora) : '')}
        <Text color={SPENTO}>   </Text>
        {voce(t.settimana, w, w ? quando(t, w.resetsAt) : '')}
      </Box>
    )
  })
}
