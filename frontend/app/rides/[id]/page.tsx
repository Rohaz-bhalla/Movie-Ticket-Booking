"use client";

import { useState, useEffect, use, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { ArrowLeft, Car, Check } from "lucide-react";
import { toast } from "@/components/ui/toast";

const btnBase =
  "inline-flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-full px-6 text-base font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-m-primary disabled:cursor-not-allowed disabled:border-transparent disabled:bg-m-disabled disabled:text-m-on-disabled";
const btnFilled = `${btnBase} bg-m-primary text-m-on-primary hover:bg-m-primary-hover`;
const btnOutlinedError = `${btnBase} border border-m-error bg-transparent text-m-error hover:bg-m-error-container`;

interface Ride {
  id: number;
  origin: string;
  destination: string;
  price: number;
  availableSeats: number;
  driverName: string;
  departureTime?: string;
  stops?: string[];
  passengerClerkIds: string[];
  // Optional: if your backend returns passenger names, they are shown here
  passengers?: { clerkId?: string; name?: string }[];
}

// Deterministic pseudo-barcode (same on server and client)
function Barcode({ seed }: { seed: number }) {
  // Pure per-bar hash (no variable reassignment, same result on server and client)
  const bars = Array.from({ length: 30 }, (_, i) => {
    let h = Math.imul(seed + 1, 73856093) ^ Math.imul(i + 1, 19349663);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return 1 + ((h >>> 0) % 3);
  });
  return (
    <div aria-hidden className="flex h-9 items-stretch gap-0.5">
      {bars.map((w, i) => (
        <span key={i} className="bg-m-on-surface" style={{ width: w }} />
      ))}
    </div>
  );
}

function RideDetailsContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { isSignedIn, user } = useUser();
  const clerkUserId = user?.id || "";

  const [ride, setRide] = useState<Ride | null>(null);
  const [loading, setLoading] = useState(true);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

  useEffect(() => {
    fetch(`${API_URL}/api/rides/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Ride not found");
        return res.json();
      })
      .then((data) => setRide(data))
      .catch((err) => {
        console.error("Failed to fetch ride details:", err);
        toast.add({
          type: "error",
          description: "Could not load ride details.",
        });
      })
      .finally(() => setLoading(false));
  }, [id, API_URL]);

  const handleBookSeat = async () => {
    if (!isSignedIn) {
      toast.add({
        type: "error",
        description: "Please sign in to book a seat!",
      });
      return;
    }

    try {
      const res = await fetch(
        `${API_URL}/api/rides/${id}/book?clerkUserId=${clerkUserId}&passengerName=${encodeURIComponent(user?.fullName || user?.username || "")}`,
        {
          method: "PUT",
        },
      );

      if (res.ok) {
        const updatedRes = await fetch(`${API_URL}/api/rides/${id}`);
        const updatedData = await updatedRes.json();
        setRide(updatedData);

        toast.add({
          type: "success",
          description: "You have successfully booked a seat! 🎉",
        });
      } else {
        const errorText = await res.text();
        toast.add({
          type: "error",
          description: errorText || "Failed to book seat.",
        });
      }
    } catch (err) {
      console.error("Failed to book seat:", err);
      toast.add({
        type: "error",
        description: "Failed to book seat.",
      });
    }
  };

  const handleCancelBooking = async () => {
    try {
      const res = await fetch(
        `${API_URL}/api/rides/${id}/cancel?clerkUserId=${clerkUserId}`,
        {
          method: "PUT",
        },
      );

      if (res.ok) {
        const updatedRes = await fetch(`${API_URL}/api/rides/${id}`);
        const updatedData = await updatedRes.json();
        setRide(updatedData);

        toast.add({
          type: "info",
          description: "Booking cancelled successfully. Seat freed up.",
        });
      } else {
        const errorText = await res.text();
        toast.add({
          type: "error",
          description: errorText || "Failed to cancel booking.",
        });
      }
    } catch (err) {
      console.error("Failed to cancel booking:", err);
      toast.add({
        type: "error",
        description: "Could not connect to the server.",
      });
    }
  };

  if (loading) {
    return (
      <div className="font-m min-h-[calc(100svh-4rem)] bg-m-surface px-4 py-8">
        <div className="mx-auto max-w-2xl space-y-4">
          <div className="h-10 w-40 animate-pulse rounded-full bg-m-surface-container" />
          <div className="h-72 animate-pulse rounded-m-card bg-m-surface-container" />
        </div>
      </div>
    );
  }

  if (!ride) {
    return (
      <div className="font-m min-h-[calc(100svh-4rem)] bg-m-surface px-4 py-8">
        <div className="mx-auto max-w-2xl space-y-4 rounded-m-sheet border border-m-outline-variant bg-m-surface-low p-8">
          <p className="text-lg font-semibold text-m-error">Ride not found.</p>
          <p className="text-sm text-m-on-surface-variant">
            It may have been removed by the driver.
          </p>
          <button
            type="button"
            onClick={() => router.push("/rides")}
            className="inline-flex h-10 cursor-pointer items-center justify-center rounded-full border border-m-outline px-6 text-sm font-medium text-m-primary hover:bg-m-surface-container focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-m-primary"
          >
            Back to all rides
          </button>
        </div>
      </div>
    );
  }

  const isAlreadyBooked = ride.passengerClerkIds?.includes(clerkUserId);
  const formattedDate = ride.departureTime
    ? new Date(ride.departureTime).toLocaleString([], {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "Not scheduled";

  // Everyone who booked this ride. Names come from `ride.passengers` when the
  // backend provides them; otherwise we fall back to "Passenger n".
  const passengerList = (ride.passengerClerkIds ?? []).map((cid, i) => {
    const isYou = cid === clerkUserId;
    const named =
      ride.passengers?.find((p) => p.clerkId === cid)?.name ??
      ride.passengers?.[i]?.name;
    const name = isYou
      ? user?.fullName || user?.username || "You"
      : named || `Passenger ${i + 1}`;
    return { id: cid, name, isYou };
  });

  return (
    <div className="font-m min-h-[calc(100svh-4rem)] bg-m-surface pb-16 text-m-on-surface">
      {/* Top app bar */}
      <header className="bg-m-primary px-4 pb-16 pt-6 text-m-on-primary">
        <div className="mx-auto max-w-2xl">
          <button
            type="button"
            onClick={() => router.push("/rides")}
            className="-ml-3 inline-flex h-10 cursor-pointer items-center gap-2 rounded-full px-3 text-sm font-medium hover:bg-m-on-primary/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-m-on-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            All rides
          </button>
        </div>
      </header>

      <main className="mx-auto -mt-10 max-w-2xl px-4">
        <article className="relative flex flex-col sm:flex-row">
          {/* Main section */}
          <div className="flex-1 overflow-hidden rounded-t-m-card border border-b-0 border-m-outline-variant bg-m-surface-low sm:rounded-l-m-card sm:rounded-tr-none sm:border-b sm:border-r-0">
            <div className="flex items-center justify-between bg-m-primary px-5 py-2.5 text-m-on-primary">
              <span className="flex items-center gap-2 text-sm font-medium">
                <Car className="h-4 w-4" />
                {isAlreadyBooked ? "Boarding pass" : "Ride details"}
              </span>
              {isAlreadyBooked && (
                <span className="inline-flex items-center gap-1 rounded-full bg-m-accent px-2.5 py-0.5 text-xs font-medium text-white">
                  <Check className="h-3 w-3" />
                  Booked by you
                </span>
              )}
            </div>

            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-5 pt-6">
              <div className="min-w-0">
                <p className="text-xs text-m-on-surface-variant">From</p>
                <p
                  className="truncate text-2xl font-semibold sm:text-3xl"
                  title={ride.origin}
                >
                  {ride.origin}
                </p>
              </div>
              <div className="flex items-center gap-2 text-m-primary">
                <span className="w-4 border-t-2 border-dashed border-current sm:w-8" />
                <Car className="h-5 w-5" />
                <span className="w-4 border-t-2 border-dashed border-current sm:w-8" />
              </div>
              <div className="min-w-0 text-right">
                <p className="text-xs text-m-on-surface-variant">To</p>
                <p
                  className="truncate text-2xl font-semibold sm:text-3xl"
                  title={ride.destination}
                >
                  {ride.destination}
                </p>
              </div>
            </div>

            <dl className="mt-6 grid grid-cols-2 gap-x-4 gap-y-5 border-t-2 border-dashed border-m-outline-variant px-5 py-5">
              <div className="min-w-0">
                <dt className="text-xs text-m-on-surface-variant">
                  Created by
                </dt>
                <dd className="flex items-center gap-2 text-base font-medium">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-m-primary-container text-xs font-medium text-m-on-primary-container">
                    {ride.driverName?.charAt(0).toUpperCase() || "?"}
                  </span>
                  <span className="truncate">{ride.driverName}</span>
                </dd>
              </div>
              <div className="min-w-0">
                <dt className="text-xs text-m-on-surface-variant">Departure</dt>
                <dd className="text-base font-medium text-m-primary">
                  {formattedDate}
                </dd>
              </div>
              <div className="min-w-0">
                <dt className="text-xs text-m-on-surface-variant">
                  Available seats
                </dt>
                <dd className="text-base font-medium">{ride.availableSeats}</dd>
              </div>
              <div className="min-w-0">
                <dt className="text-xs text-m-on-surface-variant">Ride</dt>
                <dd className="text-base font-medium">#{ride.id}</dd>
              </div>
              {ride.stops && ride.stops.length > 0 && (
                <div className="col-span-2 min-w-0">
                  <dt className="text-xs text-m-on-surface-variant">Stops</dt>
                  <dd className="mt-1 flex flex-wrap gap-2">
                    {ride.stops.map((stop, i) => (
                      <span
                        key={i}
                        className="rounded-lg bg-m-surface-container px-2.5 py-1 text-sm font-medium"
                      >
                        {stop}
                      </span>
                    ))}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* Stub */}
          <div className="relative flex flex-col gap-5 rounded-b-m-card border border-t-0 border-m-outline-variant bg-m-surface-low p-5 sm:w-60 sm:rounded-b-none sm:rounded-r-m-card sm:border-l-0 sm:border-t">
            {/* perforation + notches */}
            <span className="pointer-events-none absolute inset-x-4 top-0 border-t-2 border-dashed border-m-outline-variant sm:inset-x-auto sm:inset-y-4 sm:left-0 sm:border-l-2 sm:border-t-0" />
            <span className="absolute -left-3 -top-3 h-6 w-6 rounded-full bg-m-surface" />
            <span className="absolute -right-3 -top-3 h-6 w-6 rounded-full bg-m-surface sm:-bottom-3 sm:-left-3 sm:right-auto sm:top-auto" />

            <div>
              <p className="text-xs text-m-on-surface-variant">
                Price per seat
              </p>
              <p className="text-4xl font-semibold text-m-primary">
                ${ride.price}
              </p>
            </div>

            {isAlreadyBooked && (
              <div className="space-y-1">
                <Barcode seed={ride.id} />
                <p className="text-xs text-m-on-surface-variant">
                  Show this pass to your driver
                </p>
              </div>
            )}

            <div className="mt-auto">
              {isAlreadyBooked ? (
                <button
                  type="button"
                  className={btnOutlinedError}
                  onClick={handleCancelBooking}
                >
                  Cancel booking
                </button>
              ) : (
                <button
                  type="button"
                  className={btnFilled}
                  onClick={handleBookSeat}
                  disabled={ride.availableSeats <= 0}
                >
                  {ride.availableSeats > 0
                    ? "Book seat on this ride"
                    : "Sold out"}
                </button>
              )}
            </div>
          </div>
        </article>

        {/* Passengers */}
        <section className="mt-6 rounded-m-sheet border border-m-outline-variant bg-m-surface-low p-6">
          <h2 className="mb-4 text-lg font-semibold">
            Passengers ({passengerList.length})
          </h2>
          {passengerList.length === 0 ? (
            <p className="text-m-on-surface-variant">
              No one has booked a seat on this ride yet.
            </p>
          ) : (
            <ul className="divide-y divide-m-outline-variant">
              {passengerList.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-m-primary-container text-sm font-medium text-m-on-primary-container">
                    {p.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1 truncate font-medium">
                    {p.name}
                  </span>
                  {p.isYou && (
                    <span className="rounded-full bg-m-primary-container px-2.5 py-0.5 text-xs font-medium text-m-on-primary-container">
                      You
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}

export default function RideDetailsPage(props: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="font-m min-h-[calc(100svh-4rem)] bg-m-surface px-4 py-8">
          <div className="mx-auto max-w-2xl space-y-4">
            <div className="h-10 w-40 animate-pulse rounded-full bg-m-surface-container" />
            <div className="h-72 animate-pulse rounded-m-card bg-m-surface-container" />
          </div>
        </div>
      }
    >
      <RideDetailsContent {...props} />
    </Suspense>
  );
}
