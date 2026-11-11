import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Status } from '../types'

const isAuto = atom({ plugin: 'prompt-master', key: 'isAuto' } as const, false)
const status = atom({ plugin: 'prompt-master', key: 'status' } as const, 'idle' as Status)
const original = atom({ plugin: 'prompt-master', key: 'original' } as const, '')
const polished = atom({ plugin: 'prompt-master', key: 'polished' } as const, '')

const SYSTEM = `You are Prompt Master, an expert prompt engineer. The user gives you a rough prompt they are about to send to an AI assistant (Claude Code). Rewrite it into a clear, specific, well-structured prompt that will get the best result.

Rules:
- Keep the user's intent, facts, names, file paths, numbers and constraints exactly. Never invent requirements, data or context they did not give.
- State the goal first, then relevant context, then concrete requirements or steps, then the expected output/format and any constraints.
- Use short bullet points or numbered steps when the request has several parts; keep simple requests short. Do not pad.
- Fix spelling and grammar. Keep the user's language (e.g. Arabic stays Arabic).
- If something important is ambiguous, add a final line asking the assistant to state its assumptions or ask before guessing.
- Write it in the user's voice, as the prompt itself. Output ONLY the rewritten prompt: no preamble, no quotes, no explanation.`

async function polish($: EngineInterface, rough: string): Promise<string | undefined> {
  await update($, status, () => 'working' as Status)
  const r = await $.model.complete({
    model: 'sonnet',
    system: SYSTEM,
    prompt: `Rough prompt:\n<<<\n${rough}\n>>>`,
    maxTokens: 2048,
    timeoutMs: 60000,
  })
  if (!r.isAnswered || !r.text.trim()) {
    await update($, status, () => 'error' as Status)
    $.ui.toast(`Prompt Master: could not rewrite (${r.isAnswered ? 'empty reply' : r.reason})`)
    return undefined
  }
  const text = r.text.trim()
  await update($, original, () => rough)
  await update($, polished, () => text)
  await update($, status, () => 'done' as Status)
  await $.prompt.fill({ text, mode: 'replace' })
  return text
}

async function polishDraft($: EngineInterface): Promise<void> {
  const { text } = await $.prompt.read()
  if (!text.trim()) {
    $.ui.toast('Prompt Master: type a rough prompt first')
    return
  }
  await polish($, text)
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'pm',
      description: 'Prompt Master: rewrite a rough prompt (/pm <text>) into a better one in the prompt box',
    })
    await $.command.register({
      name: 'pm-auto',
      description: 'Prompt Master: toggle auto mode (every prompt is polished before it is sent)',
    })
    return next(e)
  })

  on('command.run', { command: 'pm' }, async ($, e) => {
    const rough = e.args.trim()
    if (!rough) return { text: 'Usage: /pm <your rough prompt> — or type it and click ✨ Prompt Master.' }
    const out = await polish($, rough)
    return { text: out ? 'Prompt Master rewrote your prompt — review it in the box and press Enter to send.' : 'Prompt Master could not rewrite that prompt.' }
  })

  on('command.run', { command: 'pm-auto' }, async $ => {
    const now = await update($, isAuto, v => !v)
    return { text: `Prompt Master auto mode is ${now ? 'ON: Enter polishes first, Enter again sends' : 'OFF'}.` }
  })

  // Auto mode: the first Enter rewrites the draft for review; Enter on the rewrite sends it.
  on('prompt.submit', async ($, e, next) => {
    if (e.command || e.isMeta || e.origin?.kind !== 'composer' || !(await read($, isAuto))) return next(e)
    const text = e.text.trim()
    if (!text || text === (await read($, polished)).trim()) return next(e)
    void polish($, e.text)
    return { drop: 'Prompt Master is polishing your prompt — review it, then press Enter to send.' }
  })

  on('turn.start', async ($, e, next) => {
    await update($, status, () => 'idle' as Status)
    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey) return next(e)
    const { Box, Button, Text } = $.ui.resolve(e)
    const auto = await read($, isAuto)
    const st = await read($, status)
    const orig = await read($, original)

    return (
      <Box flexDirection="row" gap={1}>
        <Button
          key="pm"
          label={st === 'working' ? '⏳ Polishing…' : '✨ Prompt Master'}
          onPress={() => (st === 'working' ? undefined : polishDraft($))}
        />
        <Button
          key="auto"
          label={`Auto: ${auto ? 'on' : 'off'}`}
          onPress={() => update($, isAuto, v => !v)}
        />
        {st === 'done' && orig !== '' && (
          <Button
            key="undo"
            label="↩ Original"
            onPress={async () => {
              await $.prompt.fill({ text: orig, mode: 'replace' })
              await update($, status, () => 'idle' as Status)
            }}
          />
        )}
        {st === 'done' && <Text dimColor>Rewritten — review, then Enter to send</Text>}
        {st === 'error' && <Text color="red">Rewrite failed — try again</Text>}
      </Box>
    )
  })
}
