// limiti-utilizzo — Claude Code mod
// EN: Always-visible band above the prompt showing the real usage of the Claude
//     subscription limits: the 5-hour session window and the weekly window.
// IT: Riga sempre visibile sopra il prompt con l'uso reale dei limiti
//     dell'abbonamento Claude: la finestra di sessione di 5 ore e quella settimanale.

import { atom, read, update } from 'claude-code'
import type { Register, SessionRateLimit } from 'claude-code'

import type { Finestra, Lettura } from '../types'

// EN: Last reading of the limit windows, kept in session state so it survives hot reloads.
// IT: Ultima lettura delle finestre di limite, nello stato di sessione così sopravvive ai ricaricamenti.
const lettura = atom({ plugin: 'limiti-utilizzo', key: 'lettura' } as const, null)
// EN: Bumped every minute only to redraw the countdown.
// IT: Incrementato ogni minuto solo per ridisegnare il conto alla rovescia.
const tick = atom({ plugin: 'limiti-utilizzo', key: 'tick' } as const, 0)

const PAGINA_UTILIZZO = 'https://claude.ai/settings/usage'
const LARGHEZZA_BARRA = 10

// EN: Bar colours: green below 50%, yellow from 50%, red from 80%.
// IT: Colori della barra: verde sotto il 50%, giallo dal 50%, rosso dall'80%.
const VERDE = '#3fb950'
const GIALLO = '#d29922'
const ROSSO = '#f85149'
const SPENTO = '#6e7681'

// EN: Time zone used for the weekly reset date; empty means the computer's own zone.
// IT: Fuso orario usato per la data di azzeramento settimanale; vuoto significa quello del computer.
let fuso: string | undefined

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

// EN: Countdown to the reset, e.g. "si azzera tra 2 h 14 min".
// IT: Conto alla rovescia all'azzeramento, es. "si azzera tra 2 h 14 min".
function mancano(resetsAt: string | undefined, ora: number): string {
  if (!resetsAt) return 'azzeramento ignoto'
  const ms = Date.parse(resetsAt) - ora
  if (!Number.isFinite(ms)) return 'azzeramento ignoto'
  if (ms <= 0) return 'in azzeramento'
  const min = Math.floor(ms / 60000)
  const h = Math.floor(min / 60)
  const m = min % 60
  return h > 0 ? `si azzera tra ${h} h ${m} min` : `si azzera tra ${m} min`
}

// EN: Day and time of the reset, e.g. "si azzera gio 19 nov alle 09:00".
// IT: Giorno e ora dell'azzeramento, es. "si azzera gio 19 nov alle 09:00".
function quando(resetsAt: string | undefined): string {
  if (!resetsAt) return 'azzeramento ignoto'
  const d = new Date(resetsAt)
  if (Number.isNaN(d.getTime())) return 'azzeramento ignoto'
  try {
    const giorno = d.toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short', timeZone: fuso })
    const ora = d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', timeZone: fuso })
    return `si azzera ${giorno} alle ${ora}`
  } catch {
    // EN: Unknown time zone name or no Intl support: fall back to UTC.
    // IT: Nome di fuso sconosciuto o Intl assente: si ripiega su UTC.
    return `si azzera il ${resetsAt.slice(0, 16).replace('T', ' ')} UTC`
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

// EN: Plain-text summary used by /utilizzo and by the leggi_limiti tool.
// IT: Riepilogo in testo semplice usato da /utilizzo e dallo strumento leggi_limiti.
function riepilogo(l: Lettura | null, ora: number): string {
  if (!l || l.finestre.length === 0) {
    return [
      'Nessuna lettura dei limiti disponibile.',
      'Arriva con la prima risposta del modello, e solo con un abbonamento Claude (non con una chiave API).',
      `Pagina Utilizzo: ${PAGINA_UTILIZZO}`,
    ].join('\n')
  }
  const righe: string[] = []
  const s = trova(l.finestre, 'five_hour')
  const w = trova(l.finestre, 'seven_day')
  if (s) righe.push(`Sessione (5 ore): ${percentuale(s.percentUsed)} usato, ${mancano(s.resetsAt, ora)}`)
  if (w) righe.push(`Settimana: ${percentuale(w.percentUsed)} usato, ${quando(w.resetsAt)}`)
  for (const f of l.finestre) {
    if (f !== s && f !== w) righe.push(`${f.kind}: ${percentuale(f.percentUsed)} usato`)
  }
  let alle: string
  try {
    alle = new Date(l.letturaAlle).toLocaleTimeString('it-IT', { timeZone: fuso })
  } catch {
    alle = new Date(l.letturaAlle).toISOString().slice(11, 19) + ' UTC'
  }
  righe.push(`Lettura delle ${alle}.`)
  righe.push(`Pagina Utilizzo: ${PAGINA_UTILIZZO}`)
  return righe.join('\n')
}

export const register: Register = (on, options) => {
  const scelto = typeof options.fuso_orario === 'string' ? options.fuso_orario.trim() : ''
  fuso = scelto === '' ? undefined : scelto

  // EN: First reading at start-up, the /utilizzo command, the leggi_limiti tool and a 1-minute redraw timer.
  // IT: Prima lettura all'avvio, comando /utilizzo, strumento leggi_limiti e timer di ridisegno ogni minuto.
  on('session.start', async ($, e, next) => {
    const out = await next(e)
    const { rateLimits } = await $.session.usage()
    if (rateLimits.length > 0) await update($, lettura, () => copia(rateLimits))

    $.clock.every(60_000, () => void update($, tick, n => n + 1))

    await $.command.register({
      name: 'utilizzo',
      description: 'Mostra i limiti di utilizzo (5 ore e settimanale) e il link alla pagina Utilizzo',
    })
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

  on('command.run', { command: 'utilizzo' }, async ($) => {
    const { rateLimits } = await $.session.usage()
    if (rateLimits.length > 0) await update($, lettura, () => copia(rateLimits))
    return { text: riepilogo(await read($, lettura), Date.now()) }
  })

  on('tool.run', { tool: 'mcp__limiti-utilizzo__leggi_limiti' }, async ($) => {
    const { rateLimits } = await $.session.usage()
    if (rateLimits.length > 0) await update($, lettura, () => copia(rateLimits))
    return {
      result: JSON.stringify({ rateLimits, riepilogo: riepilogo(await read($, lettura), Date.now()) }, null, 2),
    }
  }).catch(() => ({ result: 'Lettura dei limiti non riuscita. / Could not read the limits.' }))

  // EN: The band itself: two coloured bars, session and week.
  // IT: La riga vera e propria: due barre colorate, sessione e settimana.
  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const l = await read($, lettura)
    await read($, tick)
    const { Box, Text, Link } = $.ui.resolve(e)
    const ora = Date.now()

    if (!l || l.finestre.length === 0) {
      return (
        <Box flexDirection="row">
          <Text color={SPENTO}>Limiti: in attesa della prima risposta · </Text>
          <Link href={PAGINA_UTILIZZO}>Apri Utilizzo</Link>
        </Box>
      )
    }

    const voce = (etichetta: string, f: Finestra | undefined, dopo: string) => {
      if (!f) return <Text color={SPENTO}>{etichetta} n/d</Text>
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
        {voce('Sessione', s, s ? mancano(s.resetsAt, ora) : '')}
        <Text color={SPENTO}>   </Text>
        {voce('Settimana', w, w ? quando(w.resetsAt) : '')}
      </Box>
    )
  })
}
