import React from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import RequestForm from './Form'

const interests = [{ id: 42, name: 'Clase semanal' }]
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  window.history.replaceState({}, '', '/')
})

describe('contact journey', () => {
  it('shows the selected price and sends its relationship with the request', async () => {
    window.history.replaceState({}, '', '/?tarifa=42#contacto')
    const send = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal('fetch', send)
    render(
      React.createElement(RequestForm, {
        interests,
        interestParam: 'tarifa',
        askDate: false,
        askCity: false,
        privacyHref: '/datos',
      }),
    )
    expect((screen.getByLabelText('Me interesa') as HTMLSelectElement).value).toBe('42')
    expect(screen.queryByLabelText('Ciudad')).toBeNull()
    expect(screen.queryByLabelText('Fecha')).toBeNull()
    expect(screen.getByRole('link').getAttribute('href')).toBe('/datos')
    fireEvent.change(screen.getByLabelText('Nombre*'), { target: { value: 'María' } })
    fireEvent.change(screen.getByLabelText('Email*'), { target: { value: 'maria@example.test' } })
    fireEvent.click(screen.getByRole('checkbox'))
    fireEvent.submit(screen.getByRole('button').closest('form')!)
    await screen.findByRole('status')
    expect(JSON.parse(send.mock.calls[0]![1].body)).toMatchObject({
      interest: 42,
      name: 'María',
      consent: true,
    })
  })

  it('ignores unknown URL selections and lets the visitor change their choice', () => {
    window.history.replaceState({}, '', '/?tarifa=999#contacto')
    render(React.createElement(RequestForm, { interests, interestParam: 'tarifa' }))
    const select = screen.getByLabelText('Me interesa') as HTMLSelectElement
    expect(select.value).toBe('')
    fireEvent.change(select, { target: { value: '42' } })
    expect(select.value).toBe('42')
  })

  it('announces recoverable errors without clearing the visitor’s message', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue({
          ok: false,
          status: 429,
          json: async () => ({ errors: [{ message: 'Espera unos minutos.' }] }),
        }),
    )
    render(React.createElement(RequestForm))
    fireEvent.change(screen.getByLabelText('Cuéntanos'), {
      target: { value: 'Quiero información' },
    })
    fireEvent.submit(screen.getByRole('button').closest('form')!)
    await waitFor(() =>
      expect(screen.getByRole('alert').textContent).toContain('Espera unos minutos.'),
    )
    expect((screen.getByLabelText('Cuéntanos') as HTMLTextAreaElement).value).toBe(
      'Quiero información',
    )
  })
})
