import { Link } from "@tanstack/react-router";
import { m } from "framer-motion";
import { Footprints, NotebookPen, Trophy, Swords, Apple, Play } from "lucide-react";
import RoughText from "@/modules/application/components/Brand/RoughText";

const GREEN = "#1B5E4B";
const DEEP = "#0C4036";
const MAGENTA = "#E019C3";

const steps = [
  {
    icon: Footprints,
    word: "MOVE",
    copy: "How you choose. Walk, ride, swim, dance, train — it all counts.",
  },
  {
    icon: NotebookPen,
    word: "LOG",
    copy: "Your activity in seconds. Snap a photo or upload a screenshot.",
  },
  {
    icon: Trophy,
    word: "EARN",
    copy: "Points for your House and badges as you build your streak.",
  },
  {
    icon: Swords,
    word: "COMPETE",
    copy: "With other schools across Aotearoa — no travel required.",
  },
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
        {/* comet streak accent */}
        <div className="absolute -right-16 top-10 h-40 w-[70%] rotate-6 rounded-full bg-white/5 blur-2xl" />
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
              className="w-full rounded-full bg-white px-8 py-3 text-center font-bold text-brand-green shadow-lg transition-transform active:scale-95 hover:opacity-90 sm:w-auto"
            >
              Get started
            </Link>
            <Link
              to="/register-school"
              className="w-full rounded-full border-2 border-white/40 px-8 py-3 text-center font-bold text-white transition-transform active:scale-95 hover:bg-white/10 sm:w-auto"
            >
              Bring it to your school
            </Link>
          </m.div>
        </div>

        {/* every move counts band */}
        <div className="relative" style={{ backgroundColor: MAGENTA }}>
          <div className="mx-auto max-w-6xl px-4 py-3 text-center">
            <RoughText size={26} color="#ffffff" className="mx-auto">
              Every move counts.
            </RoughText>
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
                className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm"
                {...fadeUp}
                transition={{ duration: 0.45, delay: i * 0.08 }}
              >
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-2xl text-white"
                  style={{ backgroundColor: MAGENTA }}
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
                className="rounded-3xl bg-white/5 p-6 text-left ring-1 ring-white/10"
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
          are on the way.
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
