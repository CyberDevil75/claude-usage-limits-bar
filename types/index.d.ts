// EN: One limit window as the mod stores it. / IT: Una finestra di limite come la salva la mod.
export type Finestra = { kind: string; percentUsed: number; resetsAt?: string }
// EN: The windows plus when they were read. / IT: Le finestre più il momento della lettura.
export type Lettura = { finestre: Finestra[]; letturaAlle: number }

declare module 'claude-code' {
  interface PluginState {
    'limiti-utilizzo': { lettura: Lettura | null; tick: number }
  }
}
