import { useEffect, useRef, useState } from 'react'

import { useCheckout } from '@/hooks/useCheckout'
import { useExchangeRates } from '@/hooks/useExchangeRates'
import {
  DEFAULT_MATCHA_PACK,
  MATCHA_PACKS,
  MATCHA_RATES,
  PRICE_BREAKDOWN,
} from '@/lib/constants'
import { currencyForClient, formatMoney } from '@/lib/currency'
import { useAuth } from '@/providers/AuthProvider'

import { Group, Row, Rule, Table } from './builder/Table'
import { Icon } from './Icon'
import { MatchaSlider } from './builder/MatchaSlider'

import './MatchaPanel.css'

/**
 * Buying matcha: what a generation costs, what a pack costs, and where the
 * money goes.
 *
 * A native `<dialog>` opened with `showModal()`, so focus trapping and the
 * page behind it staying put come from the platform. Closing is the bar at
 * the top right and nothing else — not the paper around it, not Escape.
 *
 * Laid out with the table builder: eight rows, and a rule wherever the design
 * draws a line between them.
 */
export function MatchaPanel({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)
  const [pack, setPack] = useState<number>(DEFAULT_MATCHA_PACK)
  const [isPricingOpen, setIsPricingOpen] = useState(true)
  const [isBreakdownOpen, setIsBreakdownOpen] = useState(false)

  const { session } = useAuth()
  const { data: rates } = useExchangeRates()
  const checkout = useCheckout()

  useEffect(() => {
    ref.current?.showModal()
  }, [])

  // Prices are held in pounds. A British viewer needs no rate at all; everyone
  // else waits on one, and until it lands the pound price stands — unconverted
  // but never wrong, which a price built from a missing rate would be.
  const currency = currencyForClient()
  const rate = currency === 'GBP' ? 1 : rates?.[currency]

  const stops = MATCHA_PACKS.map((pack) => ({
    matchas: pack.matchas,
    at: pack.at,
    price: formatMoney(Math.round(pack.gbp * (rate ?? 1)), rate ? currency : 'GBP'),
  }))

  // The API redirects the whole tab to Stripe rather than returning a token
  // to embed — there is nothing left for the panel to render once this
  // succeeds, so there is no local "purchased" state to hold.
  const buy = () => {
    if (!session) return
    checkout.mutate(
      { token: session.access_token, matchas: pack, currency },
      { onSuccess: ({ url }) => window.location.assign(url) },
    )
  }

  return (
    <dialog
      className="mina-matcha"
      ref={ref}
      // Escape would close it, and the bar is meant to be the only way out.
      onCancel={(event) => event.preventDefault()}
    >
      <Table className="mina-matcha__table">
        <Row className="mina-matcha__lead" valign="bottom">
          <h2 className="mina-matcha__title">Airpot of Matcha Lattes</h2>
          <button className="mina-matcha__close" type="button" aria-label="Close" onClick={onClose}>
            <span className="mina-matcha__close-bar" aria-hidden="true" />
          </button>
        </Row>

        <Row>
          <p className="mina-matcha__blurb">
            Mina uses matcha to create and animate your images (1-month expiry)
          </p>
          <button
            className="mina-matcha__action mina-matcha__action--plain"
            type="button"
            aria-expanded={isPricingOpen}
            onClick={() => setIsPricingOpen((wasOpen) => !wasOpen)}
          >
            {isPricingOpen ? 'Close Pricing' : 'Pricing'}
          </button>
        </Row>

        {isPricingOpen &&
          MATCHA_RATES.map((rate) => (
            <div className="mina-matcha__rate" key={rate.matchas}>
              <Rule />
              <Row>
                <Group>
                  {rate.kinds.map((kind) => (
                    <span className="mina-matcha__kind" key={kind}>
                      {kind}
                    </span>
                  ))}
                </Group>
                <Group className="mina-matcha__cups">
                  {/* One cup per matcha the generation costs. */}
                  {Array.from({ length: rate.matchas }, (_, index) => (
                    <Icon name="matcha" size={12} key={index} />
                  ))}
                  <span className="mina-matcha__cost">{rate.matchas} Matcha</span>
                </Group>
              </Row>
            </div>
          ))}

        {isPricingOpen && (
          <>
            <Rule />

            <Row>
              <button
                className="mina-matcha__transparency"
                type="button"
                aria-expanded={isBreakdownOpen}
                onClick={() => setIsBreakdownOpen((wasOpen) => !wasOpen)}
              >
                Price Transparency
              </button>
              {isBreakdownOpen && <span className="mina-matcha__breakdown">{PRICE_BREAKDOWN}</span>}
            </Row>
          </>
        )}

        <Row className="mina-matcha__slider-row">
          <MatchaSlider stops={stops} value={pack} onChange={setPack} />
        </Row>

        <Row className="mina-matcha__foot">
          <button className="mina-matcha__action" type="button">
            Auto-Matcha OFF
          </button>
          <Group className="mina-matcha__buy">
            {checkout.isError && (
              <span className="mina-matcha__breakdown">Could not start checkout — try again.</span>
            )}
            <button
              className="mina-matcha__purchase"
              type="button"
              disabled={checkout.isPending}
              onClick={buy}
            >
              {checkout.isPending ? 'Redirecting…' : 'Purchase'}
            </button>
          </Group>
        </Row>
      </Table>
    </dialog>
  )
}
