// EN: One limit window as the mod stores it. / IT: Una finestra di limite come la salva la mod.
export type Finestra = { kind: string; percentUsed: number; resetsAt?: string }
// EN: The windows plus when they were read. / IT: Le finestre più il momento della lettura.
export type Lettura = { finestre: Finestra[]; letturaAlle: number }
// EN: The language in use and where it came from. / IT: La lingua in uso e da dove arriva.
export type LinguaScelta = {
  lingua: 'it' | 'en'
  fonte: 'option' | 'claude-code-setting' | 'system-locale' | 'default'
}

declare module 'claude-code' {
  interface PluginState {
    'usage-limits-bar': { lettura: Lettura | null; tick: number; lingua: LinguaScelta | null }
  }
}
