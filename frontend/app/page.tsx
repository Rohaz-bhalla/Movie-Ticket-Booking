import Link from "next/link";
import {
  ArrowRight,
  CalendarCheck,
  Car,
  Check,
  Leaf,
  Search,
  Wallet,
} from "lucide-react";

/* All colours, radii and the font come from the @theme tokens in globals.css. */

const btnBase =
  "inline-flex h-12 cursor-pointer items-center justify-center gap-2 rounded-full px-7 text-base font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-m-on-primary";

const steps = [
  {
    icon: Search,
    title: "Find or post a ride",
    text: "Search by city, or publish your own route with price and seats.",
  },
  {
    icon: CalendarCheck,
    title: "Book your seat",
    text: "Your booking turns into a boarding pass you can cancel any time.",
  },
  {
    icon: Car,
    title: "Travel together",
    text: "Meet at the departure point and split the cost of the trip.",
  },
];

const benefits = [
  {
    icon: Wallet,
    title: "Split the cost",
    text: "Seat prices are set by whoever created the ride, so you know what you pay before booking.",
  },
  {
    icon: Leaf,
    title: "Fewer cars on the road",
    text: "Every filled seat is one less vehicle on the same route.",
  },
  {
    icon: Check,
    title: "Clear and simple",
    text: "Seats left, departure date and price are visible on every ride.",
  },
];

// Fixed bar widths for the sample pass (static, so nothing can mismatch on hydration)
const sampleBars = [
  2, 1, 3, 1, 2, 2, 1, 3, 2, 1, 1, 3, 2, 1, 2, 3, 1, 2, 1, 3, 2, 1, 2, 2, 3, 1,
  2, 1,
];

function SamplePass() {
  return (
    <article
      aria-label="Sample boarding pass"
      className="relative w-full max-w-md text-m-on-surface"
    >
      <div className="overflow-hidden rounded-t-m-card bg-m-surface-low">
        <div className="flex items-center justify-between bg-m-surface-container px-5 py-2.5">
          <span className="flex items-center gap-2 text-sm font-medium text-m-primary">
            <Car className="h-4 w-4" />
            Boarding pass
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-m-accent px-2.5 py-0.5 text-xs font-medium text-white">
            <Check className="h-3 w-3" />
            Booked by you
          </span>
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-5 pt-5">
          <div className="min-w-0">
            <p className="text-xs text-m-on-surface-variant">From</p>
            <p className="truncate text-2xl font-semibold">Amritsar</p>
          </div>
          <div className="flex items-center gap-2 text-m-primary">
            <span className="w-4 border-t-2 border-dashed border-current" />
            <Car className="h-5 w-5" />
            <span className="w-4 border-t-2 border-dashed border-current" />
          </div>
          <div className="min-w-0 text-right">
            <p className="text-xs text-m-on-surface-variant">To</p>
            <p className="truncate text-2xl font-semibold">Chandigarh</p>
          </div>
        </div>

        <dl className="grid grid-cols-3 gap-3 px-5 pb-5 pt-5">
          <div>
            <dt className="text-xs text-m-on-surface-variant">Departure</dt>
            <dd className="text-sm font-medium">Sample date</dd>
          </div>
          <div>
            <dt className="text-xs text-m-on-surface-variant">Created by</dt>
            <dd className="text-sm font-medium">Your colleague</dd>
          </div>
          <div>
            <dt className="text-xs text-m-on-surface-variant">Seats left</dt>
            <dd className="text-sm font-medium">2</dd>
          </div>
        </dl>
      </div>

      {/* perforation */}
      <div className="relative h-0">
        <span className="absolute -left-3 -top-3 h-6 w-6 rounded-full bg-m-primary" />
        <span className="absolute -right-3 -top-3 h-6 w-6 rounded-full bg-m-primary" />
        <span className="absolute inset-x-4 top-0 border-t-2 border-dashed border-m-outline-variant" />
      </div>

      <div className="flex items-center justify-between gap-4 rounded-b-m-card bg-m-surface-low p-5">
        <div>
          <p className="text-xs text-m-on-surface-variant">Price per seat</p>
          <p className="text-3xl font-semibold text-m-primary">$12</p>
        </div>
        <div aria-hidden className="flex h-9 items-stretch gap-0.5">
          {sampleBars.map((w, i) => (
            <span key={i} className="bg-m-on-surface" style={{ width: w }} />
          ))}
        </div>
      </div>
    </article>
  );
}

export default function LandingPage() {
  return (
    <div className="font-m min-h-[calc(100svh-4rem)] bg-m-surface text-m-on-surface">
      {/* Hero */}
      <header className="rounded-b-m-sheet bg-m-primary text-m-on-primary">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 pb-20 pt-10 lg:grid-cols-2 lg:pb-28 lg:pt-16">
          <div className="space-y-6">
            <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
              Share the ride to work.
            </h1>
            <p className="max-w-md text-lg opacity-85">
              Offer a seat on your route or book one on someone else&apos;s.
              Pick a ride, get your boarding pass, and split the cost.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/rides"
                className={`${btnBase} bg-m-on-primary text-m-primary hover:bg-m-primary-container`}
              >
                Find a ride
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/rides#post-ride"
                className={`${btnBase} border border-m-on-primary/60 text-m-on-primary hover:bg-m-on-primary/10`}
              >
                Post a ride
              </Link>
            </div>
          </div>

          <div className="flex justify-center lg:justify-end">
            <SamplePass />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-24 px-6 py-20">
        {/* How it works */}
        <section>
          <h2 className="mb-10 text-3xl font-semibold tracking-tight">
            How it works
          </h2>
          <ol className="grid gap-10 md:grid-cols-3 md:gap-0 md:divide-x md:divide-m-outline-variant">
            {steps.map((step, i) => (
              <li
                key={step.title}
                className="space-y-3 md:px-8 md:first:pl-0 md:last:pr-0"
              >
                <span className="grid h-12 w-12 place-items-center rounded-full bg-m-primary-container text-m-on-primary-container">
                  <step.icon className="h-5 w-5" />
                </span>
                <h3 className="text-xl font-medium">
                  {i + 1}. {step.title}
                </h3>
                <p className="text-m-on-surface-variant">{step.text}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Benefits */}
        <section className="rounded-m-sheet bg-m-surface-low px-6 py-10 sm:px-10">
          <h2 className="mb-8 text-3xl font-semibold tracking-tight">
            Why carpool
          </h2>
          <ul className="grid gap-8 md:grid-cols-3">
            {benefits.map((b) => (
              <li key={b.title} className="flex gap-4">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-m-surface-container text-m-primary">
                  <b.icon className="h-5 w-5" />
                </span>
                <div className="space-y-1">
                  <h3 className="text-lg font-medium">{b.title}</h3>
                  <p className="text-m-on-surface-variant">{b.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Closing call to action */}
        <section className="flex flex-col items-start justify-between gap-6 rounded-m-sheet bg-m-primary-container px-6 py-10 text-m-on-primary-container sm:flex-row sm:items-center sm:px-10">
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold">Heading out soon?</h2>
            <p>Check which rides have seats left today.</p>
          </div>
          <Link
            href="/rides"
            className={`${btnBase} bg-m-primary text-m-on-primary hover:bg-m-primary-hover focus-visible:outline-m-primary`}
          >
            See available rides
            <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      </main>

      <footer className="px-6 pb-10 text-center text-sm text-m-on-surface-variant">
        Carpool
      </footer>
    </div>
  );
}
