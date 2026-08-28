import type { Finding } from './types.js'

const MARKS = { ok: '✓', fail: '✗', warn: '!', skip: '·' } as const

/**
 * The report, written to be read at a glance and acted on without opening anything else.
 *
 * Failures come with what was found, because "falla el contraste" sends someone hunting
 * while "3.67:1, por debajo de 4,5:1" is already the fix.
 */
export function renderReport(findings: Finding[]): string {
  const gates = [...new Set(findings.map((f) => f.gate))]
  const lines: string[] = ['', 'Auditoría del sitio', '═══════════════════', '']

  for (const gate of gates) {
    const own = findings.filter((f) => f.gate === gate)
    const failed = own.filter((f) => f.status === 'fail').length
    lines.push(`${gate.toUpperCase()}${failed ? `  — ${failed} sin pasar` : ''}`)
    for (const finding of own) {
      lines.push(`  ${MARKS[finding.status]} ${finding.what}`)
      if (finding.detail && finding.status !== 'ok') lines.push(`      ${finding.detail}`)
    }
    lines.push('')
  }

  const counts = {
    ok: findings.filter((f) => f.status === 'ok').length,
    fail: findings.filter((f) => f.status === 'fail').length,
    warn: findings.filter((f) => f.status === 'warn').length,
    skip: findings.filter((f) => f.status === 'skip').length,
  }

  lines.push('───────────────────')
  lines.push(
    `${counts.ok} pasan · ${counts.fail} fallan · ${counts.warn} avisos · ${counts.skip} sin comprobar`,
  )
  lines.push(
    counts.fail === 0
      ? 'La web pasa la auditoría.'
      : 'La web NO pasa la auditoría: arregla lo marcado con ✗ antes de desplegar.',
  )
  lines.push('')

  return lines.join('\n')
}

/** Non-zero when something failed: that is what makes this a gate and not a report. */
export function exitCode(findings: Finding[]): number {
  return findings.some((f) => f.status === 'fail') ? 1 : 0
}
