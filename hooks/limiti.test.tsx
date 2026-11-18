import { expect, test } from 'claude-code/testing'
// EN: Render tests for the band. / IT: Test di disegno della riga.

const BAND = {
  plugin: 'usage-limits-bar',
  component: 'AbovePrompt',
  props: { hasSurvey: false, isCollapsed: false, isTurnRunning: false },
} as const

const inTre = new Date(Date.now() + (2 * 60 + 14) * 60000 + 1000).toISOString()

test('la barra mostra sessione e settimana con i colori giusti', { options: { fuso_orario: 'Europe/Rome' } }, async ($, on) => {
  on('state.get', (_, e) =>
    (e as { key: string }).key === 'lettura'
      ? { value: { value: { finestre: [
          { kind: 'five_hour', percentUsed: 23.5, resetsAt: inTre },
          { kind: 'seven_day', percentUsed: 87, resetsAt: '2026-11-23T08:00:00Z' },
        ], letturaAlle: Date.now() }, version: 1 } }
      : { value: { value: 0, version: 1 } },
  )
  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' } as never)
  const s = await ui.find({ type: 'Text', text: /23\.5%/ })
  const w = await ui.find({ type: 'Text', text: /87%/ })
  const reset = await ui.find({ type: 'Text', text: /2 h 14 min/ })
  const giorno = await ui.find({ type: 'Text', text: /lun 23 nov alle 09:00/ })
  expect(JSON.stringify(s)).toContain('"color":"#3fb950"},"children":["██"]')
  expect(JSON.stringify(w)).toContain('"color":"#f85149"},"children":["█████████"]')
  expect(reset).toBeTruthy()
  expect(giorno).toBeTruthy()
  await ui.unmount()
})

test('senza lettura mostra il link alla pagina Utilizzo', async ($, on) => {
  const ui = await $.ui.mount({ ...BAND, surface: 'desktop' } as never)
  expect((await ui.find({ type: 'Text', text: /in attesa/ }))).toBeTruthy()
  await ui.unmount()
})
