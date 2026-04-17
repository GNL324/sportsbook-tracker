'use client'

const books = [
  {
    name: 'DraftKings',
    role: 'Lane A',
    state: 'Ready to confirm',
    readiness: 'Green',
    event: 'Knicks vs Celtics',
    market: 'Moneyline • Knicks +145',
    note: 'Session attached. Event and market verified. Slip prepared.',
    tone: 'green',
  },
  {
    name: 'BetMGM',
    role: 'Lane B',
    state: 'Stake prepped',
    readiness: 'Yellow',
    event: 'Knicks vs Celtics',
    market: 'Moneyline • Celtics -138',
    note: 'Session healthy. Final visual confirmation still pending.',
    tone: 'gold',
  },
]

const timeline = [
  { label: 'Intake', state: 'done' },
  { label: 'Lane Mapping', state: 'done' },
  { label: 'Session Check', state: 'done' },
  { label: 'Event Verify', state: 'done' },
  { label: 'Market Verify', state: 'active' },
  { label: 'Ready to Confirm', state: 'upcoming' },
]

const activity = [
  'Opportunity accepted from OddsBlaze',
  'DK held in Window A without remap',
  'BetMGM attached in Window B',
  'Both books matched to the same event',
  'Human boundary preserved at final Place Bet click',
]

export function SbbMockup() {
  return (
    <div className="grid gap-6 animate-in">
      <section className="sbb-hero rounded-[28px] p-8 md:p-10 border border-white/10 overflow-hidden relative">
        <div className="absolute inset-0 sbb-hero-glow" />
        <div className="relative z-10 grid gap-8 xl:grid-cols-[1.15fr,0.85fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 mb-5">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.65)]" />
              <span className="text-[11px] font-mono uppercase tracking-[0.24em] text-white/70">SBB cockpit mockup</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white leading-[0.95] mb-4">
              Shared Sportsbook Browser
              <span className="block text-emerald-300">Dual-lane execution cockpit</span>
            </h1>
            <p className="max-w-2xl text-[15px] md:text-base leading-relaxed text-white/70 mb-8">
              A shared execution surface designed to move from opportunity intake to ready-to-confirm state while keeping one sportsbook per window and the final irreversible click in Noel's hands.
            </p>

            <div className="grid gap-4 sm:grid-cols-3">
              <Metric label="Pair Status" value="Near ready" tone="green" />
              <Metric label="Window Model" value="Dual-window" tone="blue" />
              <Metric label="Human Boundary" value="Final click only" tone="gold" />
            </div>
          </div>

          <div className="glass-panel rounded-[24px] p-5 md:p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <div className="text-[11px] font-mono uppercase tracking-[0.22em] text-white/45">Execution pair</div>
                <div className="text-white font-bold text-xl mt-1">Knicks vs Celtics</div>
              </div>
              <div className="pill pill-green">PAIR YELLOW</div>
            </div>

            <div className="grid gap-3">
              {timeline.map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <div className={`timeline-dot timeline-${item.state}`} />
                  <div className="flex-1 h-px bg-white/10" />
                  <div className="min-w-[120px] text-right text-[12px] uppercase tracking-[0.16em] text-white/60">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 2xl:grid-cols-[1.1fr,0.9fr]">
        <div className="grid gap-6 xl:grid-cols-2">
          {books.map((book) => (
            <div key={book.name} className="glass-panel rounded-[24px] p-5 md:p-6">
              <div className="flex items-start justify-between gap-4 mb-5">
                <div>
                  <div className="text-[11px] font-mono uppercase tracking-[0.22em] text-white/45">{book.role}</div>
                  <div className="text-white font-bold text-2xl mt-2">{book.name}</div>
                </div>
                <div className={`pill ${book.tone === 'green' ? 'pill-green' : 'pill-gold'}`}>{book.readiness}</div>
              </div>

              <div className="space-y-4">
                <DetailRow label="Lane state" value={book.state} />
                <DetailRow label="Event" value={book.event} />
                <DetailRow label="Target market" value={book.market} />
              </div>

              <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-[14px] leading-relaxed text-white/72">
                {book.note}
              </div>

              <div className="mt-5 flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-white/45">Window assignment</span>
                <span className="text-sm text-white/82">{book.role === 'Lane A' ? 'Window A' : 'Window B'}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="grid gap-6">
          <div className="glass-panel rounded-[24px] p-5 md:p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <div className="text-[11px] font-mono uppercase tracking-[0.22em] text-white/45">Opportunity intake</div>
                <div className="text-white font-bold text-xl mt-1">Manual first-wave input</div>
              </div>
              <div className="pill pill-blue">DK + BetMGM</div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Event" value="Knicks vs Celtics" />
              <Field label="Market" value="Moneyline" />
              <Field label="Lane A" value="DraftKings • Knicks +145" />
              <Field label="Lane B" value="BetMGM • Celtics -138" />
            </div>
          </div>

          <div className="glass-panel rounded-[24px] p-5 md:p-6">
            <div className="text-[11px] font-mono uppercase tracking-[0.22em] text-white/45 mb-4">Operator feed</div>
            <div className="space-y-3">
              {activity.map((item, index) => (
                <div key={item} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <div className="mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-[11px] font-mono text-white/60">{index + 1}</div>
                  <p className="text-[14px] leading-relaxed text-white/72">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel rounded-[24px] p-5 md:p-6">
            <div className="text-[11px] font-mono uppercase tracking-[0.22em] text-white/45 mb-4">Design intent</div>
            <div className="grid gap-3 sm:grid-cols-3">
              <IntentCard title="Session truth" desc="Open tabs are not enough. The UI needs to show whether a book is truly reusable." />
              <IntentCard title="Lane discipline" desc="One sportsbook per visible window during active execution." />
              <IntentCard title="Human boundary" desc="Maximum automation up to the final Place Bet click." />
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

function Metric({ label, value, tone }: { label: string; value: string; tone: 'green' | 'blue' | 'gold' }) {
  return (
    <div className="glass-panel rounded-[20px] px-4 py-4">
      <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-white/45 mb-2">{label}</div>
      <div className={`text-lg font-bold ${tone === 'green' ? 'text-emerald-300' : tone === 'blue' ? 'text-sky-300' : 'text-amber-300'}`}>{value}</div>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
      <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-white/42 mb-1.5">{label}</div>
      <div className="text-[15px] text-white/82">{value}</div>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-white/42 mb-2">{label}</div>
      <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-[14px] text-white/82">{value}</div>
    </div>
  )
}

function IntentCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="text-white font-semibold mb-2">{title}</div>
      <div className="text-[13px] leading-relaxed text-white/68">{desc}</div>
    </div>
  )
}
