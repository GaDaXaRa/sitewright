import assert from 'node:assert/strict'
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  symlinkSync,
  writeFileSync,
  existsSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import test from 'node:test'
import { prepareOutput } from './lib/output.js'

const root = resolve('.')
function scenario(t) {
  const base = mkdtempSync(join(tmpdir(), 'sitewright-output-'))
  t.after(() => rmSync(base, { recursive: true, force: true }))
  return join(base, 'site')
}

test('force never erases an existing site or its git history', (t) => {
  const out = scenario(t)
  mkdirSync(join(out, '.git'), { recursive: true })
  writeFileSync(join(out, 'custom.txt'), 'client work')
  assert.throws(() => prepareOutput(out, root, true), /ya existe/)
  assert.equal(readFileSync(join(out, 'custom.txt'), 'utf8'), 'client work')
})

test('an interrupted generation leaves an empty destination untouched', (t) => {
  const out = scenario(t)
  mkdirSync(out)
  const transaction = prepareOutput(out, root, true)
  writeFileSync(join(transaction.staging, 'partial'), 'incomplete')
  transaction.cleanup()
  assert.deepEqual(readdirSync(out), [])
  assert.equal(existsSync(transaction.staging), false)
})

test('commit makes the completed site available and removes staging', (t) => {
  const out = scenario(t)
  const transaction = prepareOutput(out, root)
  writeFileSync(join(transaction.staging, 'ready'), 'complete')
  assert.equal(existsSync(out), false)
  transaction.commit()
  assert.equal(readFileSync(join(out, 'ready'), 'utf8'), 'complete')
  assert.equal(existsSync(transaction.staging), false)
})

test('files created at the destination during generation are preserved', (t) => {
  const out = scenario(t)
  const transaction = prepareOutput(out, root, true)
  mkdirSync(out)
  writeFileSync(join(out, 'new'), 'keep')
  assert.throws(() => transaction.commit(), /ya existe/)
  transaction.cleanup()
  assert.equal(readFileSync(join(out, 'new'), 'utf8'), 'keep')
})

test('factory paths and symlinks cannot be generation destinations', (t) => {
  assert.throws(() => prepareOutput(root, root, true), /fábrica/)
  assert.throws(() => prepareOutput(join(root, 'template'), root, true), /fábrica/)
  const out = scenario(t)
  symlinkSync(root, out)
  assert.throws(() => prepareOutput(out, root, true), /simbólicos/)
})
