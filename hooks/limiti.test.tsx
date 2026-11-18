import { expect, test } from 'claude-code/testing'
// EN: Render tests for the band, in Italian and in English. / IT: Test di disegno della riga, in italiano e in inglese.

const BAND = {
  plugin: 'usage-limits-bar',
  component: 'AbovePrompt',
  props: { hasSurvey: false, isCollapsed: false, isTurnRunning: false },
} as const

const traDueOre = () => new Date(Date.now() + (2 * 60 + 14) * 60000 + 1000).toISOString()

// EN: Seeds the session state the band reads: the reading and the language.
// IT: Prepara lo stato di sessione che la riga legge: la lettura e la lingua.
function stato(lingua: 'it' | 'en' | null, conLettura: boolean) {
  return (_: unknown, e: unknown) => {
    const key = (e as { key: string }).key
    if (key === 'lettura') {
      return {
        value: {
          value: conLettura
            ? {
                finestre: [
                  { kind: 'five_hour', percentUsed: 23.5, resetsAt: traDueOre() },
                  { kind: 'seven_day', percentUsed: 87, resetsAt: '2026-11-23T08:00:00Z' },
                ],
                letturaAlle: Date.now(),
              }
            : null,
          version: 1,
        },
      }
    }
    if (key === 'lingua') {
      return { value: { value: lingua ? { lingua, fonte: 'option' } : null, version: 1 } }
    }
    return { value: { value: 0, version: 1 } }
  }
}

test('italiano: barre, colori, conto alla rovescia e data', { options: { fuso_orario: 'Europe/Rome' } }, async ($, on) => {
  on('state.get', stato('it', true))
  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' } as never)
  const s = await ui.find({ type: 'Text', text: /^Sessione .*23\.5%/ })
  const w = await ui.find({ type: 'Text', text: /^Settimana .*87%/ })
  expect(JSON.stringify(s)).toContain('"color":"#3fb950"},"children":["██"]')
  expect(JSON.stringify(w)).toContain('"color":"#f85149"},"children":["█████████"]')
  expect(await ui.find({ type: 'Text', text: /si azzera tra 2 h 14 min/ })).toBeTruthy()
  expect(await ui.find({ type: 'Text', text: /si azzera lun 23 nov alle 09:00/ })).toBeTruthy()
  await ui.unmount()
})

test('English: labels, countdown and date', { options: { fuso_orario: 'Europe/Rome' } }, async ($, on) => {
  on('state.get', stato('en', true))
  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await $.ui.mount({ ...BAND, surface } as never)
    expect(await ui.find({ type: 'Text', text: /^Session .*23\.5%/ })).toBeTruthy()
    expect(await ui.find({ type: 'Text', text: /^Week .*87%/ })).toBeTruthy()
    expect(await ui.find({ type: 'Text', text: /resets in 2 h 14 min/ })).toBeTruthy()
    expect(await ui.find({ type: 'Text', text: /resets Mon 23 Nov at 09:00/ })).toBeTruthy()
    expect(await ui.find({ type: 'Text', text: /Sessione|Settimana|azzera/ })).toBeFalsy()
    await ui.unmount()
  }
})

test('senza lettura / without a reading', async ($, on) => {
  on('state.get', stato('it', false))
  let ui = await $.ui.mount({ ...BAND, surface: 'desktop' } as never)
  expect(await ui.find({ type: 'Text', text: /in attesa/ })).toBeTruthy()
  await ui.unmount()
})

test('without a reading, in English', async ($, on) => {
  on('state.get', stato('en', false))
  const ui = await $.ui.mount({ ...BAND, surface: 'desktop' } as never)
  expect(await ui.find({ type: 'Text', text: /waiting for the first response/ })).toBeTruthy()
  await ui.unmount()
})
