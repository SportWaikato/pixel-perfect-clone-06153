import { Link } from "@tanstack/react-router";
import { m } from "framer-motion";
import { Footprints, NotebookPen, Trophy, Swords, Apple, Play, Zap } from "lucide-react";
import RoughText from "@/modules/application/components/Brand/RoughText";

const GREEN = "#1B5E4B";
const DEEP = "#0C4036";
const MAGENTA = "#E019C3";

const steps = [
  {
    icon: Footprints,
    n: "01",
    word: "MOVE",
    copy: "How you choose. Walk, ride, swim, dance, train — it all counts.",
  },
  {
    icon: NotebookPen,
    n: "02",
    word: "LOG",
    copy: "Your activity in seconds — or scan a watch screenshot to auto-fill it.",
  },
  {
    icon: Trophy,
    n: "03",
    word: "EARN",
    copy: "Points for your House and badges as you build your streak.",
  },
  {
    icon: Swords,
    n: "04",
    word: "COMPETE",
    copy: "With other schools across Aotearoa — no travel required.",
  },
];

const MARQUEE_WORDS = [
  "KAPA HAKA",
  "BMX",
  "SWIMMING",
  "DANCE",
  "RUGBY",
  "TRAMPING",
  "NETBALL",
  "SKATING",
  "WAKA AMA",
  "CRICKET",
  "YOGA",
  "TOUCH",
];

// Decorative "house race" demo — house colours only, no real data.
const DEMO_HOUSES = [
  { name: "Kea", color: "#00ACEF", pct: 92 },
  { name: "Tūī", color: "#E019C3", pct: 78 },
  { name: "Ruru", color: "#19AA4B", pct: 64 },
  { name: "Weka", color: "#F5C518", pct: 51 },
];

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.5 },
};

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-brand-grey text-brand-dark">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-black/5 bg-brand-grey/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <img src="/KarawhiuaWordmark.png" alt="Karawhiua" className="h-8 w-auto" />
          <div className="flex items-center gap-2">
            <Link
              to="/auth"
              className="rounded-full px-4 py-2 text-sm font-semibold text-brand-green transition-transform active:scale-95"
            >
              Sign in
            </Link>
            <Link
              to="/register-school"
              className="rounded-full bg-brand-green px-4 py-2 text-sm font-semibold text-white shadow-sm transition-transform active:scale-95 hover:opacity-90"
            >
              Register school
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section
        className="relative overflow-hidden"
        style={{ background: `linear-gradient(160deg, ${GREEN} 0%, ${DEEP} 100%)` }}
      >
        {/* mesh glow accents */}
        <div
          className="pointer-events-none absolute -left-24 top-1/3 h-72 w-72 rounded-full opacity-25 blur-3xl"
          style={{ backgroundColor: MAGENTA }}
        />
        <div className="pointer-events-none absolute -right-16 top-10 h-40 w-[70%] rotate-6 rounded-full bg-white/5 blur-2xl" />
        <div
          className="pointer-events-none absolute -bottom-20 right-1/4 h-64 w-64 rounded-full opacity-20 blur-3xl"
          style={{ backgroundColor: "#118061" }}
        />

        {/* floating activity chips */}
        {[
          { label: "🏀 27 min", x: "8%", y: "18%", delay: 0 },
          { label: "🏊 45 min", x: "84%", y: "24%", delay: 1.2 },
          { label: "🛹 15 min", x: "12%", y: "68%", delay: 0.6 },
          { label: "💃 30 min", x: "82%", y: "66%", delay: 1.8 },
        ].map((chip) => (
          <m.div
            key={chip.label}
            className="pointer-events-none absolute hidden select-none rounded-full bg-white/10 px-3 py-1.5 text-sm font-semibold text-white/80 ring-1 ring-white/15 backdrop-blur-sm lg:block"
            style={{ left: chip.x, top: chip.y }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: [0, 1, 1, 0.6, 1], y: [8, 0, -6, 0, -4] }}
            transition={{ duration: 9, delay: chip.delay, repeat: Infinity, ease: "easeInOut" }}
          >
            {chip.label}
            <span className="ml-1.5 font-bold" style={{ color: "#7EF2C2" }}>
              +pts
            </span>
          </m.div>
        ))}

        <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-14 text-center">
          <m.img
            src="/KarawhiuaWordmark-white.png"
            alt="Karawhiua"
            className="mx-auto h-16 w-auto sm:h-20"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          />
          <m.div
            className="mt-4 flex justify-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 16 }}
          >
            <RoughText size={64} color={MAGENTA} className="max-w-[86%]">
              Go For It!
            </RoughText>
          </m.div>
          <m.p
            className="mx-auto mt-3 max-w-xl font-display text-2xl font-bold uppercase tracking-wide text-white sm:text-3xl"
            {...fadeUp}
          >
            The new way to sports day
          </m.p>
          <m.p
            className="mx-auto mt-4 max-w-lg text-body-lg text-white/80"
            {...fadeUp}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            A school movement challenge where{" "}
            <strong className="text-white">all movement matters</strong> — log any activity, earn
            points for your House, and go head-to-head with schools nationwide.
          </m.p>
          <m.div
            className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
            {...fadeUp}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Link
              to="/auth"
              className="w-full rounded-full bg-white px-8 py-3 text-center font-bold text-brand-green shadow-lg transition-all active:scale-95 hover:-translate-y-0.5 hover:shadow-xl sm:w-auto"
            >
              Get started
            </Link>
            <Link
              to="/register-school"
              className="w-full rounded-full border-2 border-white/40 px-8 py-3 text-center font-bold text-white transition-all active:scale-95 hover:-translate-y-0.5 hover:bg-white/10 sm:w-auto"
            >
              Bring it to your school
            </Link>
          </m.div>
        </div>

        {/* activity marquee band */}
        <div className="relative overflow-hidden py-3" style={{ backgroundColor: MAGENTA }}>
          <div className="animate-landing-marquee flex w-max items-center gap-6 whitespace-nowrap">
            {[...MARQUEE_WORDS, ...MARQUEE_WORDS].map((word, i) => (
              <span
                key={`${word}-${i}`}
                className="flex items-center gap-6 font-display text-lg font-bold uppercase tracking-widest text-white"
              >
                {word}
                <Zap size={14} className="text-white/60" />
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-4 py-14">
        <m.h2 className="text-center font-display text-h2 uppercase text-brand-green" {...fadeUp}>
          How it works
        </m.h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => {
            const Icon = s.icon;
            return (
              <m.div
                key={s.word}
                className="group relative overflow-hidden rounded-3xl border border-black/5 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
                {...fadeUp}
                transition={{ duration: 0.45, delay: i * 0.08 }}
              >
                <span className="absolute right-4 top-3 font-display text-5xl font-black text-brand-green/5 transition-colors group-hover:text-brand-magenta/10">
                  {s.n}
                </span>
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-md transition-transform group-hover:scale-110"
                  style={{ background: `linear-gradient(135deg, ${MAGENTA}, #a30f9e)` }}
                >
                  <Icon size={24} />
                </div>
                <p className="mt-4 font-display text-2xl font-bold uppercase text-brand-green">
                  {s.word}
                </p>
                <p className="mt-1 text-body-sm text-brand-dark/70">{s.copy}</p>
              </m.div>
            );
          })}
        </div>
      </section>

      {/* Live house race tease */}
      <section className="mx-auto max-w-6xl px-4 pb-14">
        <div
          className="relative overflow-hidden rounded-3xl p-8 text-white sm:p-12"
          style={{ background: `linear-gradient(135deg, ${DEEP} 0%, ${GREEN} 100%)` }}
        >
          <div
            className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full opacity-20 blur-3xl"
            style={{ backgroundColor: MAGENTA }}
          />
          <div className="relative grid items-center gap-8 lg:grid-cols-2">
            <div>
              <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-brand-magenta-bright">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-magenta-bright opacity-60" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-brand-magenta-bright" />
                </span>
                The house race
              </p>
              <h2 className="mt-3 font-display text-h2 uppercase leading-tight">
                Every minute moves your house up the board
              </h2>
              <p className="mt-4 max-w-md text-body-lg text-white/75">
                Live leaderboards all term, weekly shout-outs at assembly, and a spot prize draw to
                finish. Then the board resets and every house starts the new term with a shot at the
                title.
              </p>
            </div>
            <div className="space-y-3">
              {DEMO_HOUSES.map((house, i) => (
                <div key={house.name} className="flex items-center gap-3">
                  <span className="w-14 shrink-0 text-right font-display text-sm font-bold uppercase text-white/80">
                    {house.name}
                  </span>
                  <div className="h-4 flex-1 overflow-hidden rounded-full bg-white/10">
                    <m.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: house.color }}
                      initial={{ width: 0 }}
                      whileInView={{ width: `${house.pct}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, delay: 0.2 + i * 0.15, ease: "easeOut" }}
                    />
                  </div>
                </div>
              ))}
              <p className="pt-1 text-right text-xs text-white/40">
                Demo data — your school's race starts day one
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* The why */}
      <section style={{ backgroundColor: DEEP }} className="text-white">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center">
          <m.h2 className="font-display text-h1 uppercase" {...fadeUp}>
            A sports day that leaves no one on the bench
          </m.h2>
          <m.p
            className="mx-auto mt-5 max-w-2xl text-body-lg text-white/80"
            {...fadeUp}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Traditional inter-school sport asks kids to travel, pay, and already be good at a game.
            Karawhiua tears down those barriers. It's a virtual sports day: schools compete without
            buses, entry fees, or tournaments — and every student contributes, not just the first
            fifteen.
          </m.p>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {[
              ["No travel", "Compete from your own school, town, or backyard."],
              ["No cost barrier", "No entry fees, no gear you have to buy."],
              ["Everyone counts", "Walking to school counts as much as first XV training."],
            ].map(([h, c], i) => (
              <m.div
                key={h}
                className="rounded-3xl bg-white/5 p-6 text-left ring-1 ring-white/10 transition-all hover:bg-white/10 hover:ring-white/25"
                {...fadeUp}
                transition={{ duration: 0.45, delay: i * 0.08 }}
              >
                <p className="font-display text-h3 uppercase text-brand-magenta-bright">{h}</p>
                <p className="mt-1 text-body-sm text-white/70">{c}</p>
              </m.div>
            ))}
          </div>
        </div>
      </section>

      {/* Download */}
      <section className="mx-auto max-w-4xl px-4 py-16 text-center">
        <m.h2 className="font-display text-h2 uppercase text-brand-green" {...fadeUp}>
          Get the app
        </m.h2>
        <m.p
          className="mx-auto mt-3 max-w-md text-brand-dark/70"
          {...fadeUp}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          Karawhiua works right here in your browser — add it to your home screen today. Native apps
          with Apple Health &amp; Health Connect watch sync are on the way.
        </m.p>
        <m.div
          className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row"
          {...fadeUp}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          {[
            { Icon: Apple, top: "Coming soon on the", bottom: "App Store" },
            { Icon: Play, top: "Coming soon on", bottom: "Google Play" },
          ].map(({ Icon, top, bottom }) => (
            <button
              key={bottom}
              type="button"
              disabled
              aria-disabled="true"
              className="flex w-full items-center justify-center gap-3 rounded-2xl bg-brand-green px-6 py-3 text-left text-white opacity-70 sm:w-auto"
            >
              <Icon size={26} />
              <span className="leading-tight">
                <span className="block text-[10px] uppercase tracking-wide text-white/70">
                  {top}
                </span>
                <span className="block font-display text-lg font-bold uppercase">{bottom}</span>
              </span>
            </button>
          ))}
        </m.div>
        <div className="mt-8">
          <Link to="/auth" className="font-semibold text-brand-green underline underline-offset-4">
            Or jump straight in →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-black/5 bg-brand-grey">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 px-4 py-8 text-center text-caption text-brand-dark/60">
          <img src="/KarawhiuaWordmark.png" alt="Karawhiua" className="h-6 w-auto opacity-80" />
          <p>A Sport Waikato programme. Karawhiua — Go For It!</p>
          <p>Movement data is used only to run the programme and is never sold.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
