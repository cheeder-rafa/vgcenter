import { useState } from 'react'

import { useTeamsStore } from '../../../store/useTeamsStore'
import { LeadOrderPicker, type LeadOrder } from '../components/LeadOrderPicker'

export function GameplanPage() {
  const mine = useTeamsStore((s) => s.mine)
  const opponent = useTeamsStore((s) => s.opponent)

  const [myOrder, setMyOrder] = useState<LeadOrder>({
    lead1: null,
    lead2: null,
    back1: null,
    back2: null,
  })
  const [oppOrder, setOppOrder] = useState<LeadOrder>({
    lead1: null,
    lead2: null,
    back1: null,
    back2: null,
  })

  return (
    <div className="flex flex-col gap-8 p-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Gameplan Lab
        </h1>
        <p className="mt-1 text-sm text-white/55">
          Configure your bring-4 lineup and lead order, then score against
          opponent lead pairs.
        </p>
      </header>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-white/80">My Team</h2>
        <p className="text-xs text-white/40">
          {mine.filter(Boolean).length} / 6 Pokémon loaded from the calculator.
        </p>
        <LeadOrderPicker roster={mine} order={myOrder} onChange={setMyOrder} />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-white/80">Opponent Team</h2>
        <p className="text-xs text-white/40">
          {opponent.filter(Boolean).length} / 6 Pokémon loaded from the
          calculator.
        </p>
        <LeadOrderPicker
          roster={opponent}
          order={oppOrder}
          onChange={setOppOrder}
        />
      </section>

      <section className="rounded border border-white/10 p-6 text-center text-sm text-white/30">
        Matchup matrix — coming in Phase C.
      </section>
    </div>
  )
}
