# limiti-utilizzo

🇬🇧 **English** · 🇮🇹 [Italiano](#-italiano)

---

## 🇬🇧 English

A mod for **Claude Code** that keeps your **Claude subscription usage limits** always in view, in a compact band right above the prompt — similar to the usage indicator in other AI chat apps.

```
Sessione ██░░░░░░░░ 23.5% · si azzera tra 2 h 14 min   Settimana █████████░ 87% · si azzera lun 23 nov alle 09:00
```

![limiti-utilizzo in a Claude Code terminal session: the band above the prompt shows Sessione 13% and Settimana 10%](docs/screenshot.png)

*The band in a real Claude Code terminal session, right above the prompt; `[-]` collapses it.*

> The interface text is in Italian ("Sessione" = session, "Settimana" = week, "si azzera tra" = resets in, "si azzera … alle" = resets on … at).

### What it shows

| Part | Meaning |
| --- | --- |
| **Sessione** | The **5-hour session limit** (`five_hour` window): percent used and how long until it resets (`2 h 14 min`). |
| **Settimana** | The **weekly limit** (`seven_day` window): percent used and the day and time it resets. |
| **Bar** | 10 blocks, filled in proportion to the percentage. |
| **Colour** | 🟢 green below 50% · 🟡 yellow from 50% to 79% · 🔴 red from 80%. |

Any other window the API reports (for example a gateway's `spend_limit`) is listed by `/utilizzo`.

### Where the numbers come from

These are **real figures, not estimates**. Every response from the Claude API carries the account's rate-limit windows, and Claude Code exposes them to mods through `$.session.usage()` and the `session.measure` event. They are the same numbers shown on **claude.ai → Settings → Usage**.

- The band updates when a window moves by a whole percentage point; the countdown is redrawn every minute.
- **Before the first model response** of a session there is no reading yet: the band says *"Limiti: in attesa della prima risposta"* (waiting for the first response) with a link to the Usage page.
- **Subscription only.** With an API key (pay-as-you-go) the API reports no such windows, so the band only shows the link.

### Extra features

- **`/utilizzo`** slash command: prints a detailed summary (both windows, any other window, time of the reading) and the link `https://claude.ai/settings/usage`.
- **`leggi_limiti` tool**: Claude itself can read your limits when you ask *"how much have I used?"*. It is read-only and only reads the figures above.

### Privacy

The mod sends nothing anywhere: no network calls, no files written, no telemetry. It only reads the figures Claude Code already has and draws them on screen.

### Install

At the prompt of a terminal session:

```
/plugin install limiti-utilizzo --marketplace CyberDevil75/claude-limiti-utilizzo
```

Answer `y` to add the marketplace, then pick a scope (the **user** scope makes it load in every session).

From a shell:

```bash
claude plugin install limiti-utilizzo --marketplace CyberDevil75/claude-limiti-utilizzo
```

In the desktop app, where `/plugin` does not run: click **+** next to the prompt box, then **Plugins**, **Add marketplace** with `CyberDevil75/claude-limiti-utilizzo`, then **Add plugin**.

### Options

| Option | Default | Meaning |
| --- | --- | --- |
| `fuso_orario` (time zone) | empty | IANA time zone used for the weekly reset date, e.g. `Europe/Rome`. Empty uses the computer's own time zone. |

Change it from the plugin's config menu, or in settings under `pluginConfigs`.

### Files

| File | Purpose |
| --- | --- |
| `.claude-plugin/plugin.json` | Manifest: name, version, options. |
| `.claude-plugin/marketplace.json` | Makes this repository an installable marketplace. |
| `hooks/hooks.json` | Points Claude Code at the hooks module. |
| `hooks/register.tsx` | The mod: reads the limits, draws the band, `/utilizzo`, `leggi_limiti`. |
| `hooks/limiti.test.tsx` | Render tests (`claude plugin test .`). |
| `types/index.d.ts` | Type contract of the values the mod keeps in session state. |

License: **public domain** ([The Unlicense](https://unlicense.org)). Free for everyone, for any use, no attribution required.

---

## 🇮🇹 Italiano

Una mod per **Claude Code** che tiene **sempre in vista i limiti di utilizzo del tuo abbonamento Claude**, in una riga compatta subito sopra il prompt, un po' come l'indicatore di utilizzo di altre app di chat AI.

```
Sessione ██░░░░░░░░ 23.5% · si azzera tra 2 h 14 min   Settimana █████████░ 87% · si azzera lun 23 nov alle 09:00
```

![limiti-utilizzo in una sessione di Claude Code nel terminale: la riga sopra il prompt mostra Sessione 13% e Settimana 10%](docs/screenshot.png)

*La riga in una vera sessione di Claude Code nel terminale, subito sopra il prompt; `[-]` la chiude.*

### Cosa mostra

| Parte | Significato |
| --- | --- |
| **Sessione** | Il **limite di sessione di 5 ore** (finestra `five_hour`): percentuale usata e quanto manca all'azzeramento (`2 h 14 min`). |
| **Settimana** | Il **limite settimanale** (finestra `seven_day`): percentuale usata, giorno e ora dell'azzeramento. |
| **Barra** | 10 blocchi, riempiti in proporzione alla percentuale. |
| **Colore** | 🟢 verde sotto il 50% · 🟡 giallo dal 50 al 79% · 🔴 rosso dall'80%. |

Qualsiasi altra finestra riportata dall'API (per esempio lo `spend_limit` di un gateway) compare in `/utilizzo`.

### Da dove arrivano i numeri

Sono **dati reali, non stime**. Ogni risposta dell'API di Claude porta con sé le finestre di limite dell'account, e Claude Code le rende disponibili alle mod tramite `$.session.usage()` e l'evento `session.measure`. Sono gli stessi numeri della pagina **claude.ai → Impostazioni → Utilizzo**.

- La riga si aggiorna quando una finestra si sposta di un punto percentuale intero; il conto alla rovescia viene ridisegnato ogni minuto.
- **Prima della prima risposta del modello** in una sessione non c'è ancora una lettura: la riga dice *"Limiti: in attesa della prima risposta"* con un link alla pagina Utilizzo.
- **Solo con abbonamento.** Con una chiave API (a consumo) l'API non riporta queste finestre, quindi la riga mostra solo il link.

### Funzioni in più

- Comando **`/utilizzo`**: stampa un riepilogo dettagliato (entrambe le finestre, eventuali altre, ora della lettura) e il link `https://claude.ai/settings/usage`.
- Strumento **`leggi_limiti`**: Claude stesso può leggere i tuoi limiti quando gli chiedi *"quanto ho consumato?"*. È in sola lettura e legge solo i valori sopra.

### Privacy

La mod non invia nulla da nessuna parte: nessuna chiamata di rete, nessun file scritto, nessuna telemetria. Legge solo i valori che Claude Code ha già e li disegna a schermo.

### Installazione

Al prompt di una sessione nel terminale:

```
/plugin install limiti-utilizzo --marketplace CyberDevil75/claude-limiti-utilizzo
```

Rispondi `y` per aggiungere il marketplace, poi scegli l'ambito (l'ambito **user** la fa caricare in ogni sessione).

Da una shell:

```bash
claude plugin install limiti-utilizzo --marketplace CyberDevil75/claude-limiti-utilizzo
```

Nell'app desktop, dove `/plugin` non funziona: clicca **+** accanto alla casella del prompt, poi **Plugins**, **Add marketplace** con `CyberDevil75/claude-limiti-utilizzo`, poi **Add plugin**.

### Opzioni

| Opzione | Predefinito | Significato |
| --- | --- | --- |
| `fuso_orario` | vuoto | Fuso orario IANA usato per la data di azzeramento settimanale, es. `Europe/Rome`. Vuoto usa il fuso del computer. |

Si cambia dal menu di configurazione del plugin, o nelle impostazioni sotto `pluginConfigs`.

### File

| File | Scopo |
| --- | --- |
| `.claude-plugin/plugin.json` | Manifesto: nome, versione, opzioni. |
| `.claude-plugin/marketplace.json` | Rende questo repository un marketplace installabile. |
| `hooks/hooks.json` | Indica a Claude Code il modulo degli hook. |
| `hooks/register.tsx` | La mod: legge i limiti, disegna la riga, `/utilizzo`, `leggi_limiti`. |
| `hooks/limiti.test.tsx` | Test di disegno (`claude plugin test .`). |
| `types/index.d.ts` | Contratto dei tipi dei valori che la mod tiene nello stato di sessione. |

Licenza: **pubblico dominio** ([The Unlicense](https://unlicense.org)). Libera e gratuita per tutti, per qualsiasi uso, senza obbligo di citare l'autore.
