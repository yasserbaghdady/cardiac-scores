export type Status = 'idle' | 'working' | 'done' | 'error'

declare module 'claude-code' {
  interface PluginState {
    'prompt-master': {
      isAuto: boolean
      status: Status
      original: string
      polished: string
    }
  }
}
