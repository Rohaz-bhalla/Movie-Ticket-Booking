/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  ArrowRight,
  CalendarIcon,
  Car,
  Check,
  Clock,
  Plus,
  Search,
  Trash2,
  Users,
  X,
} from "lucide-react";

import { toast } from "@/components/ui/toast";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

/* Shared class strings ------------------------------------------------------ */
const fieldClass =
  "h-12 w-full rounded-lg bg-m-surface-container px-4 text-base text-m-on-surface outline-none placeholder:text-m-on-surface-variant focus:ring-2 focus:ring-m-primary";
const noSpin =
  "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";
const btnBase =
  "inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-full px-6 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-m-primary disabled:cursor-not-allowed disabled:border-transparent disabled:bg-m-disabled disabled:text-m-on-disabled";
const btnFilled = `${btnBase} bg-m-primary text-m-on-primary hover:bg-m-primary-hover`;
const btnOutlinedError = `${btnBase} border border-m-error bg-transparent text-m-error hover:bg-m-error-container`;
const btnTextError = `${btnBase} px-3 text-m-error hover:bg-m-error-container`;
const errorText = "mt-1 px-1 text-xs text-m-error";

// Define Zod Schema for Ride Creation
const rideSchema = z.object({
  origin: z
    .string()
    .min(2, { message: "Origin must be at least 2 characters." }),
  destination: z
    .string()
    .min(2, { message: "Destination must be at least 2 characters." }),
  price: z.preprocess(
    (val) => (val === "" || val === undefined ? undefined : Number(val)),
    z.number().positive({ message: "Price must be greater than 0." }),
  ),
  availableSeats: z.preprocess(
    (val) => (val === "" || val === undefined ? undefined : Number(val)),
    z.number().int().min(1, { message: "Must offer at least 1 seat." }),
  ),
  departureTime: z.string().min(1, { message: "Departure date is required." }),
});

type RideFormInput = z.input<typeof rideSchema>;
type RideFormOutput = z.output<typeof rideSchema>;

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
}

/* -------------------------------------------------------------------------- */
/*  Presentational pieces (no logic — handlers come in as props)               */
/* -------------------------------------------------------------------------- */

/** Route rail marks for the post form: dot (start), ring (stop), square (end). */
function RailMarks({ position }: { position: "start" | "stop" | "end" }) {
  return (
    <>
      {position !== "start" && (
        <span
          aria-hidden
          className="absolute left-4.25 top-0 h-6 w-px bg-m-primary"
        />
      )}
      {position !== "end" && (
        <span
          aria-hidden
          className="absolute -bottom-2 left-4.25 top-6 w-px bg-m-primary"
        />
      )}
      <span
        aria-hidden
        className={cn(
          "absolute left-3.25 top-4.75 h-2.5 w-2.5",
          position === "start" && "rounded-full bg-m-primary",
          position === "stop" &&
            "rounded-full border-2 border-m-primary bg-m-surface-low",
          position === "end" && "bg-m-primary",
        )}
      />
    </>
  );
}

type RideCardProps = {
  ride: Ride;
  isOwner: boolean;
  formattedDate: string | null;
  onOpen: () => void;
  onBook: () => void;
  onCancel: () => void;
  onDelete: () => void;
};

// Deterministic pseudo-barcode (same on server and client, so no hydration mismatch)
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

/** Booked ride → boarding pass */
function RideTicket({
  ride,
  isOwner,
  formattedDate,
  onOpen,
  onCancel,
  onDelete,
}: RideCardProps) {
  return (
    <article
      role="link"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" && e.target === e.currentTarget) onOpen();
      }}
      className="relative flex cursor-pointer flex-col focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-m-primary sm:flex-row"
    >
      {/* Main section */}
      <div className="flex-1 overflow-hidden rounded-t-m-card border border-b-0 border-m-outline-variant bg-m-surface-low sm:rounded-l-m-card sm:rounded-tr-none sm:border-b sm:border-r-0">
        <div className="flex items-center justify-between bg-m-primary px-5 py-2.5 text-m-on-primary">
          <span className="flex items-center gap-2 text-sm font-medium">
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
            <p
              className="truncate text-2xl font-semibold text-m-on-surface sm:text-3xl"
              title={ride.origin}
            >
              {ride.origin}
            </p>
          </div>
          <div className="flex items-center gap-2 text-m-primary">
            <span className="w-4 border-t-2 border-dashed border-current sm:w-10" />
            <Car className="h-5 w-5" />
            <span className="w-4 border-t-2 border-dashed border-current sm:w-10" />
          </div>
          <div className="min-w-0 text-right">
            <p className="text-xs text-m-on-surface-variant">To</p>
            <p
              className="truncate text-2xl font-semibold text-m-on-surface sm:text-3xl"
              title={ride.destination}
            >
              {ride.destination}
            </p>
          </div>
        </div>

        {ride.stops && ride.stops.length > 0 && (
          <p className="truncate px-5 pt-3 text-sm text-m-on-surface-variant">
            via {ride.stops.join(", ")}
          </p>
        )}

        <dl className="mt-5 grid grid-cols-3 gap-3 border-t-2 border-dashed border-m-outline-variant px-5 py-4">
          <div className="min-w-0">
            <dt className="text-xs text-m-on-surface-variant">Departure</dt>
            <dd className="text-sm font-medium text-m-on-surface">
              {formattedDate ?? "Not scheduled"}
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="text-xs text-m-on-surface-variant">Created by</dt>
            <dd className="truncate text-sm font-medium text-m-on-surface">
              {ride.driverName}
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="text-xs text-m-on-surface-variant">Seats left</dt>
            <dd className="text-sm font-medium text-m-on-surface">
              {ride.availableSeats}
            </dd>
          </div>
        </dl>
      </div>

      {/* Stub */}
      <div className="relative flex flex-col gap-4 rounded-b-m-card border border-t-0 border-m-outline-variant bg-m-surface-low p-5 sm:w-56 sm:rounded-b-none sm:rounded-r-m-card sm:border-l-0 sm:border-t">
        {/* perforation + notches */}
        <span className="pointer-events-none absolute inset-x-4 top-0 border-t-2 border-dashed border-m-outline-variant sm:inset-x-auto sm:inset-y-4 sm:left-0 sm:border-l-2 sm:border-t-0" />
        <span className="absolute -left-3 -top-3 h-6 w-6 rounded-full bg-m-surface" />
        <span className="absolute -right-3 -top-3 h-6 w-6 rounded-full bg-m-surface sm:-bottom-3 sm:-left-3 sm:right-auto sm:top-auto" />

        <div className="flex items-end justify-between sm:block">
          <div>
            <p className="text-xs text-m-on-surface-variant">Price per seat</p>
            <p className="text-3xl font-semibold text-m-primary">
              ${ride.price}
            </p>
          </div>
          <div className="space-y-1 sm:mt-4">
            <Barcode seed={ride.id} />
            <p className="text-xs text-m-on-surface-variant">Ride #{ride.id}</p>
          </div>
        </div>

        <div
          className="mt-auto flex flex-col gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          <button type="button" onClick={onOpen} className={btnFilled}>
            View details
          </button>
          <button type="button" onClick={onCancel} className={btnOutlinedError}>
            Cancel booking
          </button>
          {isOwner && (
            <button type="button" onClick={onDelete} className={btnTextError}>
              <Trash2 className="h-4 w-4" />
              Delete ride
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

/** Not-yet-booked ride → compact M3 card */
function RideRow({
  ride,
  isOwner,
  formattedDate,
  onOpen,
  onBook,
  onDelete,
}: RideCardProps) {
  const soldOut = ride.availableSeats <= 0;

  return (
    <article
      role="link"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" && e.target === e.currentTarget) onOpen();
      }}
      className="flex cursor-pointer flex-col gap-4 rounded-m-card border border-m-outline-variant bg-m-surface-low p-5 transition-colors hover:bg-m-surface-container focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-m-primary sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="min-w-0 space-y-3">
        <p className="flex items-center gap-2 text-lg font-semibold text-m-on-surface">
          <span className="truncate">{ride.origin}</span>
          <ArrowRight className="h-4 w-4 shrink-0 text-m-primary" />
          <span className="truncate">{ride.destination}</span>
        </p>
        {ride.stops && ride.stops.length > 0 && (
          <p className="truncate text-sm text-m-on-surface-variant">
            via {ride.stops.join(", ")}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2 text-sm text-m-on-surface-variant">
          <span className="flex items-center gap-2 pr-1">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-m-primary-container text-xs font-medium text-m-on-primary-container">
              {ride.driverName?.charAt(0).toUpperCase() || "?"}
            </span>
            Created by {ride.driverName}
          </span>
          {formattedDate && (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-m-surface-container px-2.5 py-1 text-xs font-medium text-m-on-surface">
              <CalendarIcon className="h-3.5 w-3.5" />
              {formattedDate}
            </span>
          )}
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium",
              soldOut
                ? "bg-m-error-container text-m-on-error-container"
                : "bg-m-primary-container text-m-on-primary-container",
            )}
          >
            <Users className="h-3.5 w-3.5" />
            {soldOut
              ? "Sold out"
              : `${ride.availableSeats} ${ride.availableSeats === 1 ? "seat" : "seats"} left`}
          </span>
        </div>
      </div>

      <div
        className="flex items-center justify-between gap-4 sm:flex-col sm:items-end sm:justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-2xl font-semibold text-m-primary">${ride.price}</p>
        <div className="flex items-center gap-1">
          {isOwner && (
            <button type="button" onClick={onDelete} className={btnTextError}>
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          )}
          <button
            type="button"
            onClick={onBook}
            disabled={soldOut}
            className={btnFilled}
          >
            {soldOut ? "Sold out" : "Book seat"}
          </button>
        </div>
      </div>
    </article>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page (logic unchanged)                                                     */
/* -------------------------------------------------------------------------- */

const tabs = [
  { id: "all", label: "All rides" },
  { id: "mine", label: "Posted by me" },
  { id: "bookings", label: "My bookings" },
] as const;

export default function RidesPage() {
  const router = useRouter();
  const { isSignedIn, user } = useUser();
  const driverName = user?.fullName || user?.username || "Anonymous Driver";
  const clerkUserId = user?.id || "";

  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [cityFilter, setCityFilter] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "mine" | "bookings">(
    "all",
  );

  const [stops, setStops] = useState<string[]>([]);
  const [timeOfDay, setTimeOfDay] = useState("09:00");

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RideFormInput, any, RideFormOutput>({
    resolver: zodResolver(rideSchema),
    defaultValues: {
      origin: "",
      destination: "",
      price: "" as unknown as number,
      availableSeats: "" as unknown as number,
      departureTime: "",
    },
  });

  const fetchRides = useCallback(async () => {
    try {
      const url = cityFilter
        ? `${API_URL}/api/rides?city=${encodeURIComponent(cityFilter)}`
        : `${API_URL}/api/rides`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setRides(data);
    } catch (err) {
      console.error("Failed to fetch rides:", err);
    } finally {
      setLoading(false);
    }
  }, [API_URL, cityFilter]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchRides();
  }, [fetchRides]);

  const onSubmit = async (data: RideFormOutput) => {
    if (!isSignedIn) {
      toast.add({
        type: "error",
        description: "You must be signed in to post a ride!",
      });
      return;
    }

    setSubmitting(true);
    const newRide = {
      ...data,
      driverName,
      passengerClerkIds: [],
      stops: stops.map((s) => s.trim()).filter(Boolean),
    };

    try {
      const res = await fetch(`${API_URL}/api/rides`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRide),
      });

      if (res.ok) {
        reset();
        setStops([]);
        fetchRides();
        toast.add({
          type: "success",
          description: "Ride published successfully! 🚗",
        });
      } else {
        toast.add({
          type: "error",
          description: "Failed to publish ride.",
        });
      }
    } catch (err) {
      console.error("Failed to create ride:", err);
      toast.add({
        type: "error",
        description: "Could not connect to the server.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleBookSeat = async (rideId: number) => {
    if (!isSignedIn) {
      toast.add({
        type: "error",
        description: "Please sign in to book a seat!",
      });
      return;
    }

    try {
      const res = await fetch(
        `${API_URL}/api/rides/${rideId}/book?clerkUserId=${clerkUserId}&passengerName=${encodeURIComponent(driverName)}`,
        { method: "PUT" },
      );

      if (res.ok) {
        fetchRides();
        toast.add({
          type: "success",
          description: "You have successfully booked a seat. 🎉",
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

  const handleCancelBooking = async (rideId: number) => {
    try {
      const res = await fetch(
        `${API_URL}/api/rides/${rideId}/cancel?clerkUserId=${clerkUserId}`,
        { method: "PUT" },
      );

      if (res.ok) {
        fetchRides();
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

  const handleDeleteRide = async (rideId: number) => {
    try {
      const res = await fetch(`${API_URL}/api/rides/${rideId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchRides();
        toast.add({
          type: "info",
          description: "Your ride listing has been removed.",
        });
      } else {
        toast.add({
          type: "error",
          description: "Failed to delete ride.",
        });
      }
    } catch (err) {
      console.error("Failed to delete ride:", err);
      toast.add({
        type: "error",
        description: "Error deleting ride.",
      });
    }
  };

  const filteredRides = rides.filter((ride) => {
    if (activeTab === "mine") {
      return ride.driverName === driverName;
    }
    if (activeTab === "bookings") {
      return ride.passengerClerkIds?.includes(clerkUserId);
    }
    return true;
  });

  return (
    <div className="font-m min-h-[calc(100svh-4rem)] bg-m-surface pb-16 text-m-on-surface">
      {/* Top band */}
      <header className="rounded-b-m-sheet bg-m-primary px-6 pb-20 pt-10 text-m-on-primary">
        <div className="mx-auto flex max-w-4xl items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-m-on-primary text-m-primary">
            <Car className="h-6 w-6" />
          </span>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Carpool</h1>
            <p className="text-sm opacity-80">
              Offer a seat or find a ride for your commute.
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto -mt-12 max-w-4xl space-y-8 px-4">
        {/* Post a ride — Uber-style minimal form */}
        <section
          id="post-ride"
          className="scroll-mt-6 rounded-m-sheet border border-m-outline-variant bg-m-surface-low p-6 shadow-sm sm:p-8"
        >
          <h2 className="mb-5 text-2xl font-semibold">Post a ride</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            {/* Origin, optional stops, destination — with route rail */}
            <div>
              <div className="space-y-2">
                <div className="relative">
                  <RailMarks position="start" />
                  <input
                    type="text"
                    placeholder="Origin (e.g. Amritsar)"
                    className={cn(fieldClass, "pl-10")}
                    {...register("origin")}
                  />
                </div>

                {stops.map((stop, i) => (
                  <div key={i} className="relative">
                    <RailMarks position="stop" />
                    <input
                      type="text"
                      value={stop}
                      placeholder={`Stop ${i + 1} (e.g. Ludhiana)`}
                      aria-label={`Stop ${i + 1}`}
                      onChange={(e) =>
                        setStops((prev) =>
                          prev.map((s, j) => (j === i ? e.target.value : s)),
                        )
                      }
                      className={cn(fieldClass, "pl-10 pr-12")}
                    />
                    <button
                      type="button"
                      aria-label={`Remove stop ${i + 1}`}
                      onClick={() =>
                        setStops((prev) => prev.filter((_, j) => j !== i))
                      }
                      className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 cursor-pointer place-items-center rounded-full text-m-on-surface-variant transition-colors hover:bg-m-surface-low focus-visible:outline-2 focus-visible:outline-m-primary"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}

                <div className="relative">
                  <RailMarks position="end" />
                  <input
                    type="text"
                    placeholder="Destination (e.g. Chandigarh)"
                    className={cn(fieldClass, "pl-10")}
                    {...register("destination")}
                  />
                </div>
              </div>

              {errors.origin && (
                <p className={errorText}>{errors.origin.message}</p>
              )}
              {errors.destination && (
                <p className={errorText}>{errors.destination.message}</p>
              )}

              {stops.length < 5 && (
                <button
                  type="button"
                  onClick={() => setStops((prev) => [...prev, ""])}
                  className="mt-2 inline-flex h-10 cursor-pointer items-center gap-2 rounded-full px-4 text-sm font-medium text-m-primary transition-colors hover:bg-m-primary-container focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-m-primary"
                >
                  <Plus className="h-4 w-4" />
                  Add stop
                </button>
              )}
            </div>

            {/* Price + seats */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-base text-m-on-surface-variant">
                    $
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Price per seat"
                    className={cn(fieldClass, noSpin, "pl-9")}
                    {...register("price", { valueAsNumber: true })}
                  />
                </div>
                {errors.price && (
                  <p className={errorText}>{errors.price.message}</p>
                )}
              </div>

              <div>
                <div className="relative">
                  <Users className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-m-on-surface-variant" />
                  <input
                    type="number"
                    placeholder="Available seats"
                    className={cn(fieldClass, noSpin, "pl-11")}
                    {...register("availableSeats", { valueAsNumber: true })}
                  />
                </div>
                {errors.availableSeats && (
                  <p className={errorText}>{errors.availableSeats.message}</p>
                )}
              </div>
            </div>

            {/* Departure date + time slot. PopoverTrigger already renders a <button>,
                so it is styled directly (no nested <button> = no hydration error). */}
            <div>
              <Controller
                control={control}
                name="departureTime"
                render={({ field }) => {
                  // Applies the chosen HH:MM to a date and returns it
                  const withTime = (base: Date, hhmm: string) => {
                    const [h, m] = hhmm.split(":").map(Number);
                    const d = new Date(base);
                    d.setHours(h || 0, m || 0, 0, 0);
                    return d;
                  };

                  return (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
                      <Popover>
                        <PopoverTrigger
                          className={cn(
                            fieldClass,
                            "flex cursor-pointer items-center gap-3 text-left",
                            !field.value && "text-m-on-surface-variant",
                          )}
                        >
                          <CalendarIcon className="h-4 w-4 shrink-0" />
                          <span>
                            {field.value
                              ? format(new Date(field.value), "PPP")
                              : "Pick a departure date"}
                          </span>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={
                              field.value ? new Date(field.value) : undefined
                            }
                            onSelect={(date) => {
                              if (date) {
                                field.onChange(
                                  withTime(date, timeOfDay).toISOString(),
                                );
                              }
                            }}
                          />
                        </PopoverContent>
                      </Popover>

                      <div className="relative sm:w-44">
                        <Clock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-m-on-surface-variant" />
                        <input
                          type="time"
                          aria-label="Departure time"
                          value={timeOfDay}
                          onChange={(e) => {
                            const v = e.target.value;
                            setTimeOfDay(v);
                            if (field.value && v) {
                              field.onChange(
                                withTime(
                                  new Date(field.value),
                                  v,
                                ).toISOString(),
                              );
                            }
                          }}
                          className={cn(fieldClass, "pl-11")}
                        />
                      </div>
                    </div>
                  );
                }}
              />
              {errors.departureTime && (
                <p className={errorText}>{errors.departureTime.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className={cn(btnFilled, "h-12! w-full text-base")}
            >
              {submitting ? "Publishing..." : "Publish ride"}
            </button>
          </form>
        </section>

        {/* Rides list */}
        <section className="space-y-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            {/* M3 segmented button */}
            <div className="max-w-full overflow-x-auto">
              <div
                role="tablist"
                className="inline-flex overflow-hidden rounded-full border border-m-outline"
              >
                {tabs.map((tab, i) => {
                  const active = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        "flex h-10 cursor-pointer items-center gap-1.5 whitespace-nowrap px-4 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-m-primary",
                        i > 0 && "border-l border-m-outline",
                        active
                          ? "bg-m-primary-container text-m-on-primary-container"
                          : "text-m-on-surface hover:bg-m-surface-container",
                      )}
                    >
                      {active && <Check className="h-4 w-4" />}
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* M3 search bar */}
            <div className="relative md:w-72">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-m-on-surface-variant" />
              <input
                type="text"
                placeholder="Filter by your city"
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                className="h-12 w-full rounded-full bg-m-surface-container pl-11 pr-4 text-sm text-m-on-surface outline-none placeholder:text-m-on-surface-variant focus:ring-2 focus:ring-m-primary"
              />
            </div>
          </div>

          {loading ? (
            <div className="grid gap-4">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-28 animate-pulse rounded-m-card bg-m-surface-container"
                />
              ))}
            </div>
          ) : filteredRides.length === 0 ? (
            <div className="rounded-m-card border border-dashed border-m-outline-variant px-6 py-12 text-center text-m-on-surface-variant">
              {activeTab === "mine"
                ? "You haven't posted any rides yet."
                : activeTab === "bookings"
                  ? "You haven't booked any seats yet."
                  : "No matching rides found in this city."}
            </div>
          ) : (
            <div className="grid gap-5">
              {filteredRides.map((ride) => {
                const isAlreadyBooked =
                  ride.passengerClerkIds?.includes(clerkUserId);
                const formattedDate = ride.departureTime
                  ? format(new Date(ride.departureTime), "PPP, p")
                  : null;

                const cardProps: RideCardProps = {
                  ride,
                  isOwner: !!isSignedIn && ride.driverName === driverName,
                  formattedDate,
                  onOpen: () => router.push(`/rides/${ride.id}`),
                  onBook: () => handleBookSeat(ride.id),
                  onCancel: () => handleCancelBooking(ride.id),
                  onDelete: () => handleDeleteRide(ride.id),
                };

                return isAlreadyBooked ? (
                  <RideTicket key={ride.id} {...cardProps} />
                ) : (
                  <RideRow key={ride.id} {...cardProps} />
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
