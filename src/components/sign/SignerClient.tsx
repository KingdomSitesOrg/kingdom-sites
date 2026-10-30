'use client'

import { useEffect, useMemo, useState } from 'react'
import PdfScrollViewer from './PdfScrollViewer'
import SignatureLineBox from './SignatureLineBox'
import SignSteps from './SignSteps'

type Party = {
  id: string
  name: string
  email: string
  role?: string
  status: string
  signedAt?: string
  signedDateText?: string
}

type View = {
  envelopeId: string
  title: string
  status: string
  pageCount: number
  signer: {
    id: string
    name: string
    email: string
    role?: string
    status: string
    signedAt?: string
    signedDateText?: string
  }
  parties: Party[]
  fields: {
    id: string
    type: 'signature' | 'date'
    signerId: string
    page: number
    x: number
    y: number
    width: number
    height: number
  }[]
  allSigned: boolean
  /** The stamped PDF exists and can be downloaded with this link. */
  signedPdfReady?: boolean
  /** Copies of the signed PDF go out by email. */
  emailsCopies?: boolean
}

function renderCursivePng(name: string): string {
  const canvas = document.createElement('canvas')
  canvas.width = 900
  canvas.height = 220
  const ctx = canvas.getContext('2d')
  if (!ctx) return ''
  // Transparent background so stamped ink sits cleanly on the signature line
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = '#15181d'
  ctx.font = 'italic 96px "Segoe Script", "Brush Script MT", "Apple Chancery", cursive'
  ctx.textBaseline = 'middle'
  ctx.fillText(name.trim(), 36, canvas.height / 2)
  return canvas.toDataURL('image/png')
}

function partySignedDate(party: Party | undefined, fallbackDone = false): string | undefined {
  if (!party) return undefined
  if (party.status === 'signed' || fallbackDone) {
    if (party.signedDateText) return party.signedDateText
    if (party.signedAt) {
      return new Date(party.signedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    }
  }
  return undefined
}

export default function SignerClient({ token }: { token: string }) {
  const [view, setView] = useState<View | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [typedName, setTypedName] = useState('')
  const [editing, setEditing] = useState(false)
  const [busy, setBusy] = useState(false)
  // Lines this signer has signed on the page so far; all of them before Finish.
  const [signedIds, setSignedIds] = useState<string[]>([])
  const [done, setDone] = useState(false)
  const [focusPage, setFocusPage] = useState(1)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(`/api/sign/s/${token}`)
        const data = await res.json().catch(() => null)
        if (!res.ok || !data?.ok) {
          if (!cancelled) setError(data?.error || 'This signing link is not valid.')
          return
        }
        if (!cancelled) {
          const next = data.view as View
          setView(next)
          setTypedName(next.signer.name || '')
          if (next.signer.status === 'signed') setDone(true)
          const myFirst = (next.fields || []).find(
            (f) => f.type === 'signature' && f.signerId === next.signer.id,
          )
          setFocusPage(myFirst?.page || 1)
        }
      } catch {
        if (!cancelled) setError('Could not load this document.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [token])

  const pdfUrl = useMemo(() => {
    if (!view) return ''
    return `/api/sign/envelopes/${view.envelopeId}/pdf?token=${encodeURIComponent(token)}&which=original`
  }, [view, token])

  const pdfDownloadUrl = useMemo(() => {
    if (!view) return ''
    const which = view.signedPdfReady ? 'completed' : 'original'
    return `/api/sign/envelopes/${view.envelopeId}/pdf?token=${encodeURIComponent(token)}&which=${which}&download=1`
  }, [view, token])

  function submit() {
    return submitWith(signedIds)
  }

  async function submitWith(ids: string[]) {
    if (!view) return
    const name = typedName.trim()
    if (!name) {
      setError('Type your full name to sign.')
      return
    }
    // No optimistic "Signed": it flashed Signed and then snapped back when the
    // request failed. The button shows Signing… until the signature is saved.
    setBusy(true)
    setError('')
    try {
      const signaturePng = renderCursivePng(name)
      const res = await fetch(`/api/sign/s/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ typedName: name, signaturePng, signedFieldIds: ids }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.ok) {
        setError(data?.error || 'Could not save your signature. Try again.')
        return
      }
      setView(data.view)
      setDone(true)
      setEditing(false)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch {
      setError('No connection. Check your internet and try again.')
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return <p className="text-sm text-body">Loading document…</p>
  }
  if (error && !view) {
    return (
      <div className="tile mx-auto max-w-md p-6">
        <h1 className="text-xl font-semibold text-ink">This link does not work</h1>
        <p className="mt-2 text-sm text-body">
          It may be missing a few characters, or the document was withdrawn. Ask the person who sent
          it for a new link.
        </p>
      </div>
    )
  }
  if (!view) return null

  const parties = view.parties?.length
    ? view.parties
    : [
        {
          id: view.signer.id,
          name: view.signer.name,
          email: view.signer.email,
          role: view.signer.role,
          status: view.signer.status,
          signedAt: view.signer.signedAt,
        },
      ]
  const partyById = new Map(parties.map((p) => [p.id, p]))
  const sigFields = view.fields.filter((f) => f.type === 'signature')
  // In reading order, so "next line" walks down the document.
  const myFields = sigFields
    .filter((f) => f.signerId === view.signer.id)
    .sort((a, b) => a.page - b.page || a.y - b.y || a.x - b.x)
  const remaining = myFields.filter((f) => !signedIds.includes(f.id))
  const nextLine = remaining[0]
  const role = (view.signer.role || 'Signer').trim() || 'Signer'
  const others = parties.filter((p) => p.id !== view.signer.id && p.status !== 'signed')

  function showLine(id: string, page: number) {
    setFocusPage(page)
    window.setTimeout(() => {
      document
        .querySelector(`[data-field-id="${id}"]`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 50)
  }

  function startSigning() {
    setError('')
    setEditing(true)
    if (nextLine) showLine(nextLine.id, nextLine.page)
  }

  /** Put the typed signature on one line, then bring the next one into view. */
  function signLine(id: string) {
    if (!typedName.trim()) {
      setEditing(true)
      setError('Type your full name first.')
      return
    }
    setError('')
    const next = signedIds.includes(id) ? signedIds : [...signedIds, id]
    setSignedIds(next)
    const after = myFields.find((f) => !next.includes(f.id))
    if (after) showLine(after.id, after.page)
  }

  const allMineSigned = remaining.length === 0

  return (
    <div className="space-y-6 pb-56 lg:pb-0">
      <div className="space-y-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            {done ? 'Signed' : 'Please sign'}
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">{view.title}</h1>
          <p className="mt-1 text-sm text-body">
            For {view.signer.name} · {role}
          </p>
        </div>
        <SignSteps
          steps={['Read', 'Sign', 'Done']}
          current={done ? 2 : editing ? 1 : 0}
          allDone={done}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="tile p-3 lg:max-h-[75vh] lg:overflow-auto">
          <PdfScrollViewer
            key={pdfUrl}
            url={pdfUrl}
            pageCount={view.pageCount}
            focusPage={focusPage}
            onFocusPageChange={setFocusPage}
            renderPageOverlay={(page) =>
              sigFields
                .filter((f) => f.page === page)
                .map((f) => {
                  const party = partyById.get(f.signerId)
                  const isMine = f.signerId === view.signer.id
                  const partyRole = (party?.role || 'Signer').trim() || 'Signer'
                  const partyName = party?.name || ''
                  const partySigned = party?.status === 'signed' || (isMine && done)
                  const dateText = partySignedDate(party, isMine && done)
                  const box = {
                    left: `${f.x * 100}%`,
                    top: `${f.y * 100}%`,
                    width: `${f.width * 100}%`,
                    height: `${f.height * 100}%`,
                  }
                  if (isMine) {
                    return (
                      <button
                        key={f.id}
                        type="button"
                        data-field-id={f.id}
                        aria-label={done ? 'Your signature' : 'Sign here'}
                        disabled={done}
                        onClick={() => (editing ? signLine(f.id) : startSigning())}
                        className={`absolute z-[5] overflow-hidden rounded-md border-2 text-left ${
                          done || signedIds.includes(f.id)
                            ? 'border-emerald-600'
                            : editing
                              ? 'border-accent ring-4 ring-accent/30'
                              : 'border-accent ring-2 ring-accent/25 hover:ring-accent/40'
                        }`}
                        style={box}
                      >
                        <SignatureLineBox
                          role={partyRole}
                          name={done ? partyName || view.signer.name : typedName.trim() || view.signer.name}
                          signed={done || signedIds.includes(f.id)}
                          signedDate={dateText}
                          hint={editing && typedName.trim() ? 'Tap to sign here' : 'Sign here'}
                        />
                      </button>
                    )
                  }
                  return (
                    <div
                      key={f.id}
                      data-field-id={f.id}
                      className={`absolute z-[5] overflow-hidden rounded-md border-2 ${
                        partySigned ? 'border-emerald-600' : 'border-line'
                      }`}
                      style={box}
                    >
                      <SignatureLineBox
                        role={partyRole}
                        name={partyName}
                        signed={partySigned}
                        signedDate={dateText}
                        hint={`Waiting for ${partyName || partyRole}`}
                      />
                    </div>
                  )
                })
            }
          />
        </div>

        {/* On a phone this is a bar fixed to the bottom of the screen, so the next
            step is always one tap away; on a computer it sits beside the document. */}
        <div className="fixed inset-x-0 bottom-0 z-40 space-y-3 border-t border-line bg-surface p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgba(0,0,0,0.08)] lg:sticky lg:inset-auto lg:top-4 lg:z-auto lg:h-fit lg:rounded-[1.25rem] lg:border lg:shadow-none">
          {done ? (
            <>
              <h2 className="text-lg font-semibold text-emerald-800">
                {view.allSigned ? 'Everyone has signed' : 'You have signed'}
              </h2>
              <p className="text-sm text-body">
                {view.signedPdfReady
                  ? view.emailsCopies
                    ? 'Download the signed PDF. A copy is also on its way to your email.'
                    : 'Download the signed PDF and keep it for your records.'
                  : view.allSigned
                    ? 'The signed PDF is being prepared. Refresh this page in a minute to download it.'
                    : `Thank you. Waiting for ${others.map((p) => p.name).join(' and ') || 'the others'}. ${
                        view.emailsCopies
                          ? 'You will get the signed PDF by email once everyone has signed.'
                          : 'Open this link again once everyone has signed to download the signed PDF.'
                      }`}
              </p>
              {view.signedPdfReady ? (
                <a href={pdfDownloadUrl} download className="btn-primary w-full">
                  Download signed PDF
                </a>
              ) : null}
            </>
          ) : editing ? (
            <>
              <label className="block">
                <span className="text-sm font-semibold text-ink">Type your full name</span>
                <input
                  autoFocus
                  value={typedName}
                  onChange={(e) => setTypedName(e.target.value)}
                  autoComplete="name"
                  className="mt-2 w-full rounded-xl border border-line px-3 py-2 text-2xl italic outline-none focus:border-accent"
                  style={{
                    fontFamily: '"Segoe Script", "Brush Script MT", "Apple Chancery", cursive',
                  }}
                />
              </label>
              {error ? (
                <p role="alert" className="text-sm text-warm">
                  {error}
                </p>
              ) : null}
              <button
                type="button"
                disabled={busy || !typedName.trim()}
                onClick={() => {
                  if (myFields.length > 1 && nextLine) signLine(nextLine.id)
                  else if (myFields.length <= 1 && nextLine) {
                    // One line: the button signs it and finishes in one go.
                    setSignedIds([nextLine.id])
                    void submitWith([nextLine.id])
                  } else void submit()
                }}
                className="btn-primary w-full"
              >
                {busy
                  ? 'Signing…'
                  : myFields.length > 1 && !allMineSigned
                    ? `Sign on page ${nextLine!.page} (${signedIds.length + 1} of ${myFields.length})`
                    : myFields.length > 1
                      ? 'Finish signing'
                      : 'Sign document'}
              </button>
              {myFields.length > 1 ? (
                <p className="text-xs text-muted">
                  You sign in {myFields.length} places: page{' '}
                  {myFields.map((f) => f.page).join(', page ')}. {signedIds.length} of{' '}
                  {myFields.length} signed.
                </p>
              ) : null}
              <p className="text-xs text-muted">
                By signing you agree your typed name is your signature on this document, as{' '}
                {role}.
              </p>
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  setEditing(false)
                  setError('')
                }}
                className="btn-ghost-sm w-full"
              >
                Not yet
              </button>
            </>
          ) : (
            <>
              <h2 className="text-base font-semibold text-ink">Read it, then sign</h2>
              <p className="text-sm text-body">
                {myFields.length
                  ? myFields.length > 1
                    ? `You sign in ${myFields.length} places: page ${myFields.map((f) => f.page).join(', page ')}. It takes about a minute.`
                    : `Your line is on page ${myFields[0]!.page}. It takes about a minute.`
                  : 'It takes about a minute.'}
              </p>
              <button type="button" onClick={startSigning} className="btn-primary w-full">
                Sign
              </button>
            </>
          )}
          {!editing ? (
            <a
              href={view.signedPdfReady ? pdfUrl : pdfDownloadUrl}
              download={view.signedPdfReady ? undefined : true}
              target={view.signedPdfReady ? '_blank' : undefined}
              rel="noreferrer"
              className="block text-center text-xs text-muted underline-offset-2 hover:text-ink hover:underline"
            >
              {view.signedPdfReady ? 'View the unsigned original' : 'Download a copy to read later (PDF)'}
            </a>
          ) : null}
        </div>
      </div>
    </div>
  )
}
