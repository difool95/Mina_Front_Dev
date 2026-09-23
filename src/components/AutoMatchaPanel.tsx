import { useEffect, useRef, useState } from 'react'

import { useExchangeRates } from '@/hooks/useExchangeRates'
import { useUpdateAutoRefill } from '@/hooks/useUpdateAutoRefill'
import { DEFAULT_MATCHA_PACK, MATCHA_PACKS } from '@/lib/constants'
import { currencyForClient, formatMoney } from '@/lib/currency'
import { useAuth } from '@/providers/AuthProvider'
import type { MmaPreferences } from '@/types/customer.types'

import { Row, Rule, Table } from './builder/Table'

import './AutoMatchaPanel.css'

const THRESHOLD_MIN = 1
const THRESHOLD_MAX = 1000

// The three sizes offered here skip the middle 1500 pack — the same packs,
// just fewer choices for a refill nobody is watching happen.
const REFILL_PACKS = MATCHA_PACKS.filter((pack) => pack.matchas !== 1500)

/**
 * Auto Matcha Refill: the threshold to refill at, which pack to buy, and an
 * optional monthly cap — reached from `MatchaPanel`'s "Auto-Matcha" button
 * and returned to the same way through "Back".
 *
 * Same `<dialog>` chrome as `MatchaPanel`: no Escape, no backdrop click,
 * built with the same table builder.
 */
export function AutoMatchaPanel({
  onBack,
  onSaved,
  initialAutoRefill,
}: {
  onBack: () => void
  onSaved: () => void
  /** The customer's saved settings, if any — reopening the panel starts from these. */
  initialAutoRefill?: MmaPreferences['autoRefill'] | null
}) {
  const isOn = initialAutoRefill?.enabled ?? false
  const ref = useRef<HTMLDialogElement>(null)
  const [threshold, setThreshold] = useState(initialAutoRefill?.threshold ?? 10)
  const [refillPack, setRefillPack] = useState<number>(
    initialAutoRefill ? initialAutoRefill.qty * 50 : DEFAULT_MATCHA_PACK,
  )
  const [monthlyLimit, setMonthlyLimit] = useState<number | null>(
    initialAutoRefill?.monthlyLimitAmount ?? null,
  )

  const { session } = useAuth()
  const { data: rates } = useExchangeRates()
  const updateAutoRefill = useUpdateAutoRefill()

  useEffect(() => {
    ref.current?.showModal()
  }, [])

  const currency = currencyForClient()
  const rate = currency === 'GBP' ? 1 : rates?.[currency]

  // Turning it on always starts a fresh monthly window — a month from now,
  // and a count of zero refills used in it.
  const turnOn = () => {
    if (!session) return

    const pack = REFILL_PACKS.find((candidate) => candidate.matchas === refillPack)!
    const packPrice = Math.round(pack.gbp * (rate ?? 1))
    const monthlyResetAt = new Date()
    monthlyResetAt.setUTCMonth(monthlyResetAt.getUTCMonth() + 1)

    const preferences: MmaPreferences = {
      autoRefill: {
        // 100/500/5000 matcha packs, in units of 50 matcha.
        qty: refillPack / 50,
        enabled: true,
        currency: currency.toLowerCase(),
        threshold,
        monthlyCount: 0,
        // Rounded down: a part-way-there refill is one this cap wouldn't cover.
        monthlyLimit: monthlyLimit === null ? null : Math.floor(monthlyLimit / packPrice),
        monthlyResetAt: monthlyResetAt.toISOString(),
        monthlyLimitAmount: monthlyLimit,
      },
    }

    updateAutoRefill.mutate({ userId: session.user.id, preferences }, { onSuccess: onSaved })
  }

  // Keeps every other saved setting as-is — only the flag flips.
  const turnOff = () => {
    if (!session || !initialAutoRefill) return

    const preferences: MmaPreferences = { autoRefill: { ...initialAutoRefill, enabled: false } }
    updateAutoRefill.mutate({ userId: session.user.id, preferences }, { onSuccess: onSaved })
  }

  return (
    <dialog
      className="mina-auto"
      ref={ref}
      onCancel={(event) => event.preventDefault()}
    >
      <Table className="mina-auto__table">
        <Row className="mina-auto__lead">
          <h2 className="mina-auto__title">Auto Matcha Refill</h2>
          <button className="mina-auto__back" type="button" onClick={onBack}>
            Back
          </button>
        </Row>

        <Row>
          <p className="mina-auto__blurb">
            Keep enjoying Mina without interruption. Your balance will refill automatically
            whenever it runs low.
          </p>
        </Row>

        <Rule />

        <Row>
          <span className="mina-auto__label">When my matcha is below</span>
          <input
            className="mina-auto__input mina-auto__input--threshold"
            type="text"
            inputMode="numeric"
            value={threshold}
            onChange={(event) => {
              // Parsed as a number and re-rendered from that number, so a
              // leading zero never survives to be displayed.
              const digits = event.target.value.replace(/[^0-9]/g, '')
              setThreshold(
                digits === '' ? THRESHOLD_MIN : Math.min(THRESHOLD_MAX, Math.max(THRESHOLD_MIN, Number(digits))),
              )
            }}
          />
        </Row>

        <Rule />

        <Row anchor="left" className="mina-auto__packs-row">
          <span className="mina-auto__label">Refill my account with</span>
          {REFILL_PACKS.map((pack) => (
            <button
              key={pack.matchas}
              className="mina-auto__pack"
              type="button"
              aria-pressed={refillPack === pack.matchas}
              onClick={() => setRefillPack(pack.matchas)}
            >
              {pack.matchas} ({formatMoney(Math.round(pack.gbp * (rate ?? 1)), rate ? currency : 'GBP')})
            </button>
          ))}
        </Row>

        <Rule />

        <Row>
          <span className="mina-auto__label">Monthly Refill Limit</span>
          <input
            className="mina-auto__input mina-auto__input--limit"
            type="text"
            inputMode="numeric"
            placeholder="Leave blank for unlimited re-fills each month"
            value={monthlyLimit === null ? '' : formatMoney(monthlyLimit, currency)}
            onChange={(event) => {
              const digits = event.target.value.replace(/[^0-9]/g, '')
              setMonthlyLimit(digits === '' ? null : Number(digits))
            }}
          />
        </Row>

        <Rule />

        <Row className="mina-auto__foot" anchor="right">
          {updateAutoRefill.isError && (
            <span className="mina-auto__error">Could not save — try again.</span>
          )}
          <button
            className="mina-auto__turn-on"
            type="button"
            disabled={updateAutoRefill.isPending}
            onClick={isOn ? turnOff : turnOn}
          >
            {updateAutoRefill.isPending
              ? isOn
                ? 'Turning off…'
                : 'Turning on…'
              : isOn
                ? 'Turn off'
                : 'Turn on'}
          </button>
        </Row>
      </Table>
    </dialog>
  )
}
