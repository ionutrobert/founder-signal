const pillars = [
  {
    title: 'Signal-first intelligence',
    description:
      'Combine human intuition with real-time agent telemetry so every founder story is rooted in verifiable momentum.'
  },
  {
    title: 'Aurora-grade clarity',
    description:
      'Soft gradients, weightless typography, and a calm layout keep complex metrics readable without fatigue.'
  },
  {
    title: 'Action sets ready',
    description:
      'Shareable next steps, shimmering callouts, and bundled resources let your team move faster after every insight.'
  }
]

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col justify-center gap-12 px-6 py-12 sm:px-10 lg:px-16">
      <section className="relative overflow-hidden rounded-3xl border border-white/40 bg-gradient-to-br from-amber-50/80 via-slate-50 to-white p-10 shadow-2xl shadow-indigo-100/40">
        <div className="absolute inset-0 opacity-60" aria-hidden>
          <div className="pointer-events-none absolute -left-24 top-0 h-[480px] w-[480px] rounded-full bg-[radial-gradient(circle,_rgba(59,130,246,0.35),_transparent_60%)] blur-3xl" />
          <div className="pointer-events-none absolute right-0 top-16 h-[360px] w-[360px] rounded-full bg-[radial-gradient(circle,_rgba(255,194,160,0.45),_transparent_60%)] blur-3xl" />
        </div>
        <div className="relative space-y-6">
          <p className="text-sm uppercase tracking-[0.5em] text-slate-500">Founder Signal</p>
          <h1 className="text-4xl font-semibold leading-tight text-slate-900 sm:text-5xl">
            Aurora-grade insights, ready for your next sprint.
          </h1>
          <p className="max-w-3xl text-lg text-slate-700">
            Track progress signals, highlight breakthroughs, and move your roadmap forward with visual poetry inspired by luminous north
            lights.
          </p>
          <div className="flex flex-wrap gap-4">
            <button
              type="button"
              className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-slate-700"
            >
              Start a signal
            </button>
            <button
              type="button"
              className="rounded-full border border-slate-900/60 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-slate-900 transition hover:border-slate-900"
            >
              View demo
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-6 sm:grid-cols-2">
        {pillars.map((pillar) => (
          <article key={pillar.title} className="grid-fade rounded-2xl border border-white/70 bg-white/60 p-6 shadow-lg shadow-slate-200/70">
            <h2 className="text-xl font-semibold text-slate-900">{pillar.title}</h2>
            <p className="mt-3 text-slate-600">{pillar.description}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-8 rounded-3xl border border-white/70 bg-white/70 p-8 shadow-2xl shadow-indigo-100/60 lg:grid-cols-[2fr_1fr]">
        <div>
          <p className="text-sm uppercase tracking-[0.6em] text-slate-500">Aurora updates</p>
          <h2 className="mt-2 text-3xl font-semibold text-slate-900">Signal-ready artifacts for every readout</h2>
          <p className="mt-3 text-slate-600">
            Build reports with shimmering gradients, annotated metric cards, and exportable rows that feel calm yet confident.
          </p>
        </div>
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-900 to-indigo-700 p-4 text-white">
            <p className="text-xs uppercase tracking-[0.4em] text-white/80">Current burn signal</p>
            <p className="mt-2 text-2xl font-semibold">11.4% decrease</p>
            <p className="text-sm text-white/70">vs last cycle</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-amber-200 via-lime-200 to-slate-50 p-4">
            <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Team momentum</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">+7 highlights</p>
            <p className="text-sm text-slate-500">Shared with board notes</p>
          </div>
        </div>
      </section>
    </main>
  )
}
