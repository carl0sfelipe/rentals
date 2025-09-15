import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

// Componentes de ícones SVG inline para substituir lucide-react
const Star = ({ size = 16, className = "" }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
  </svg>
);

const MapPin = ({ size = 16, className = "" }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
);

const Wifi = ({ size = 18, className = "" }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M5 12.55a11 11 0 0 1 14.08 0"/>
    <path d="M1.42 9a16 16 0 0 1 21.16 0"/>
    <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/>
    <line x1="12" y1="20" x2="12.01" y2="20"/>
  </svg>
);

const Car = ({ size = 18, className = "" }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H7.2c-.7 0-1.3.3-1.8.7C4.6 8.6 3.3 10 3.3 10s-2.7.6-3.2 1.1C-.7 11.3 0 12.1 0 13v3c0 .6.4 1 1 1h2"/>
    <circle cx="7.5" cy="17.5" r="2.5"/>
    <circle cx="16.5" cy="17.5" r="2.5"/>
  </svg>
);

const Waves = ({ size = 18, className = "" }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 2.6 0 3 .4 3 1.5-.6.5-1.2 1-2.5 1C17 9 17 7 14.5 7c-2.6 0-2.4 2-5 2-2.5 0-2.5-2-5-2C3.4 7 2.6 7.6 2 8.5"/>
  </svg>
);

const Users = ({ size = 18, className = "" }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const Clock = ({ size = 16, className = "" }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12,6 12,12 16,14"/>
  </svg>
);

const TrendingUp = ({ size = 16, className = "" }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
    <polyline points="17 6 23 6 23 12"/>
  </svg>
);

const CalendarIcon = ({ size = 16, className = "" }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

const ChevronLeft = ({ size = 16, className = "" }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="15,18 9,12 15,6"/>
  </svg>
);

const ChevronRight = ({ size = 16, className = "" }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="9,18 15,12 9,6"/>
  </svg>
);

const ShieldCheck = ({ size = 16, className = "" }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    <path d="M9 12l2 2 4-4"/>
  </svg>
);

const BadgeCheck = ({ size = 16, className = "" }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"/>
    <path d="m9 12 2 2 4-4"/>
  </svg>
);

const ArrowRight = ({ size = 18, className = "" }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M5 12h14"/>
    <path d="m12 5 7 7-7 7"/>
  </svg>
);

const Zap = ({ size = 16, className = "" }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="13,2 3,14 12,14 11,22 21,10 12,10 13,2"/>
  </svg>
);

// Utils de Data
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const toStartOfDay = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};
const TODAY = toStartOfDay(new Date());

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return toStartOfDay(d);
}
function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
function startOfMonth(d) {
  const x = new Date(d.getFullYear(), d.getMonth(), 1);
  return toStartOfDay(x);
}
function endOfMonth(d) {
  const x = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return toStartOfDay(x);
}
function addMonths(d, m) {
  const x = new Date(d);
  x.setMonth(x.getMonth() + m);
  return x;
}
function diffNights(checkIn, checkOut) {
  return Math.max(0, Math.round((+toStartOfDay(checkOut) - +toStartOfDay(checkIn)) / MS_PER_DAY));
}

const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

// Date Picker Vertical Infinito Melhorado
const MONTH_HEIGHT = 320;
const MONTHS_CHUNK = 12;

function VerticalInfiniteDateRangePicker({
  value,
  onChange,
  label = "Selecionar datas",
  locale = "pt-BR",
  initialOpen = false,
}) {
  const [checkIn, setCheckIn] = useState(value?.start ?? null);
  const [checkOut, setCheckOut] = useState(value?.end ?? null);
  const [open, setOpen] = useState(initialOpen);
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = today.getDate() - dayOfWeek;
    return new Date(today.setDate(diff));
  });

  const wrapperRef = useRef(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    const onClick = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  const [hoverDate, setHoverDate] = useState(null);
  const scrollerRef = useRef(null);

  useEffect(() => {
    if (value) {
      setCheckIn(value.start ?? null);
      setCheckOut(value.end ?? null);
    }
  }, [value?.start?.getTime(), value?.end?.getTime()]);

  const formattedSummary = useMemo(() => {
    const fmt = (dt) =>
      dt
        ? dt.toLocaleDateString(locale, {
            weekday: "short",
            day: "2-digit",
            month: "short",
          })
        : "—";
    return `${fmt(checkIn)} → ${fmt(checkOut)}`;
  }, [checkIn, checkOut, locale]);

  const rangeEdges = useMemo(() => {
    const start = checkIn ? toStartOfDay(checkIn) : null;
    const tentative = checkOut
      ? toStartOfDay(checkOut)
      : checkIn && hoverDate
      ? toStartOfDay(hoverDate)
      : null;

    if (!start || !tentative) return null;
    const a = start <= tentative ? start : tentative;
    const b = start <= tentative ? tentative : start;
    return { start: a, end: b };
  }, [checkIn, checkOut, hoverDate]);

  const isInRange = (d) => !!rangeEdges && d >= rangeEdges.start && d <= rangeEdges.end;

  const onPick = (d) => {
    if (d < TODAY) return;
    if (!checkIn || (checkIn && checkOut)) {
      setCheckIn(d);
      setCheckOut(null);
      setHoverDate(null);
      onChange?.(d, null);
      return;
    }
    if (checkIn && !checkOut) {
      if (isSameDay(d, checkIn) || d > checkIn) {
        setCheckOut(d);
        onChange?.(checkIn, d);
      } else {
        setCheckOut(checkIn);
        setCheckIn(d);
        onChange?.(d, checkIn);
      }
      setHoverDate(null);
    }
  };

  const onClear = () => {
    setCheckIn(null);
    setCheckOut(null);
    setHoverDate(null);
    onChange?.(null, null);
  };

  const handleScroll = () => {
    const el = scrollerRef.current;
    if (!el) return;
    const nearTop = el.scrollTop < 100;
    const nearBottom = el.scrollTop + el.clientHeight > el.scrollHeight - 100;
    if (nearTop) {
      setCurrentWeekStart((prev) => addDays(prev, -7));
    }
    if (nearBottom) {
      setCurrentWeekStart((prev) => addDays(prev, 7));
    }
  };

  const renderWeekView = () => {
    const weeks = [];
    const totalWeeks = 12; // 3 meses de semanas

    for (let weekIndex = 0; weekIndex < totalWeeks; weekIndex++) {
      const weekStart = addDays(currentWeekStart, weekIndex * 7);
      const weekDays = [];

      for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
        const date = addDays(weekStart, dayIndex);
        const selected = (!!checkIn && isSameDay(date, checkIn)) || (!!checkOut && isSameDay(date, checkOut));
        const disabled = date < TODAY;

        weekDays.push(
          <button
            key={dayIndex}
            onClick={() => !disabled && onPick(date)}
            onMouseEnter={() => !disabled && setHoverDate(date)}
            onMouseLeave={() => setHoverDate(null)}
            className={`h-16 w-16 rounded-xl border text-sm font-medium transition-all duration-200 ${
              disabled
                ? "bg-gray-50 text-gray-300 border-gray-200 cursor-not-allowed"
                : selected
                ? "bg-blue-600 text-white border-blue-600 shadow-md scale-105"
                : isInRange(date)
                ? "bg-blue-100 text-blue-900 border-blue-300 hover:bg-blue-200"
                : "bg-white text-gray-800 border-gray-200 hover:bg-gray-50 hover:border-gray-300 hover:scale-105"
            }`}
            title={date.toLocaleDateString(locale)}
            aria-pressed={selected}
            aria-disabled={disabled}
          >
            <div className="text-center">
              <div className="text-xs text-gray-500 mb-1">
                {date.toLocaleDateString(locale, { weekday: "short" })}
              </div>
              <div className="text-lg font-bold">{date.getDate()}</div>
              <div className="text-xs text-gray-500">
                {date.toLocaleDateString(locale, { month: "short" })}
              </div>
            </div>
          </button>
        );
      }

      weeks.push(
        <div key={weekIndex} className="mb-4">
          <div className="grid grid-cols-7 gap-2">
            {weekDays}
          </div>
        </div>
      );
    }

    return (
      <div className="p-4">
        {weeks}
      </div>
    );
  };

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center justify-between rounded-xl border px-4 py-3 text-sm font-medium transition hover:border-gray-400 ${
          open ? "border-blue-500 shadow" : "border-gray-300"
        }`}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <span className="text-gray-600 flex items-center gap-2">
          <CalendarIcon size={16} />
          {label}
        </span>
        <span className="text-gray-900">{formattedSummary}</span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Selecionar período"
          className="absolute left-1/2 top-16 z-50 w-[95vw] max-w-5xl -translate-x-1/2 rounded-2xl border border-gray-200 bg-white shadow-2xl"
        >
          <style>{`
            @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            .animate-fade-in { animation: fade-in .3s ease-out; }
          `}</style>
          <div className="animate-fade-in">
            <div className="flex flex-col gap-4 p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  <span className="font-semibold text-gray-900">Check-in</span>: {checkIn ? checkIn.toLocaleDateString(locale, { weekday: "short", day: "2-digit", month: "short" }) : "—"}
                  <span className="mx-2 text-gray-400">→</span>
                  <span className="font-semibold text-gray-900">Check-out</span>: {checkOut ? checkOut.toLocaleDateString(locale, { weekday: "short", day: "2-digit", month: "short" }) : "—"}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2">
                {(checkIn || checkOut) && (
                  <button
                    className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={onClear}
                  >
                    Limpar
                  </button>
                )}
                <button
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
                  onClick={() => setOpen(false)}
                >
                  OK
                </button>
              </div>
            </div>

            <div
              ref={scrollerRef}
              onScroll={handleScroll}
              className="relative max-h-[500px] overflow-y-auto rounded-b-2xl"
              onMouseLeave={() => setHoverDate(null)}
              style={{ scrollbarWidth: "thin", scrollbarColor: "#cbd5e1 #f1f5f9" }}
            >
              {renderWeekView()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================= Página =============================

export default function VacationRentalLanding({ property, onClose }) {
  const [dateRange, setDateRange] = useState({ start: null, end: null });
  const [guests, setGuests] = useState(2);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [viewCount, setViewCount] = useState(127);

  // Usar dados da propriedade dinâmica
  const basePrice = property?.pricePerNight || 420;
  const promoPrice = Math.round(basePrice * 0.85); // 15% de desconto
  const savings = basePrice - promoPrice;

  // Usar imagem da propriedade ou fallback
  const propertyImages = property?.imageUrl ? [property.imageUrl] : [
    "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1200&h=900&fit=crop",
    "https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=1200&h=900&fit=crop",
    "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=1200&h=900&fit=crop",
    "https://images.unsplash.com/photo-1520637836862-4d197d17c55a?w=1200&h=900&fit=crop",
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setViewCount((prev) => Math.max(80, prev + (Math.random() > 0.6 ? 2 : 1)));
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((p) => (p + 1) % propertyImages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [propertyImages.length]);

  const [remaining, setRemaining] = useState(18 * 60 * 60);
  useEffect(() => {
    const t = setInterval(() => setRemaining((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, []);

  const hh = String(Math.floor(remaining / 3600)).padStart(2, "0");
  const mm = String(Math.floor((remaining % 3600) / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");

  const nights = dateRange.start && dateRange.end ? diffNights(dateRange.start, dateRange.end) : 0;
  const subtotal = nights * promoPrice;

  return (
    <div className="min-h-screen bg-white">
      <style>{`
        @keyframes pulse-glow { 0%, 100% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.25); } 50% { box-shadow: 0 0 30px rgba(59, 130, 246, 0.45); } }
        .animate-pulse-glow { animation: pulse-glow 2.2s infinite; }
      `}</style>

      {/* Header */}
      <nav className="sticky top-0 w-full bg-white/90 backdrop-blur-sm border-b border-gray-100 z-40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="font-bold text-xl text-gray-900">{property?.title || 'OceanView Apt'}</div>
          <div className="flex items-center gap-3 text-sm text-gray-700">
            <Clock size={16} />
            <span className="animate-pulse">{viewCount} pessoas vendo agora</span>
          </div>
        </div>
      </nav>

      {/* Promo strip */}
      <div className="bg-blue-50 border-b border-blue-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-center gap-3 text-sm">
          <Zap size={16} className="text-blue-600" />
          <span className="text-blue-700">
            Promoção termina em <b>{hh}:{mm}:{ss}</b>. Garanta o preço de hoje.
          </span>
        </div>
      </div>

      {/* Hero */}
      <section className="pt-8 pb-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-8 items-start">
          <div className="relative">
            <div className="relative overflow-hidden rounded-2xl aspect-[4/3] group ring-1 ring-gray-100">
              <img
                src={propertyImages[currentImageIndex]}
                alt={property?.title || "Apartamento vista mar"}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                  ✨ Disponível agora
                </span>
                <span className="bg-white/90 backdrop-blur px-3 py-1 rounded-full text-sm font-medium border border-gray-200 text-gray-800">
                  4,9★ / 127+ avaliações
                </span>
              </div>
              <div className="absolute bottom-4 right-4 flex gap-2">
                {propertyImages.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`h-2 w-2 rounded-full transition ${idx === currentImageIndex ? "bg-white" : "bg-white/60"}`}
                    aria-label={`Imagem ${idx + 1}`}
                  />
                ))}
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-red-200 bg-gradient-to-r from-red-50 to-orange-50 p-4">
              <div className="flex items-center gap-2 text-red-700">
                <TrendingUp size={16} />
                <span className="font-semibold">Alta demanda nesta região</span>
              </div>
              <p className="text-sm text-red-700/90 mt-1">
                Apenas <b>3 datas</b> disponíveis este mês e mais de {Math.max(80, Math.floor(viewCount * 0.6))} pessoas interessadas hoje.
              </p>
            </div>

            <div className="mt-3 flex flex-wrap gap-3">
              <div className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm">
                <ShieldCheck size={16} className="text-green-600" />
                Cancelamento grátis até 48h
              </div>
              <div className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm">
                <BadgeCheck size={16} className="text-blue-600" />
                Pagamento seguro
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{property?.title || 'Apartamento Vista Mar em Ipanema'}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-4 text-gray-700">
                <span className="inline-flex items-center gap-1">
                  <MapPin size={16} />
                  {property?.address || 'Ipanema, Rio de Janeiro'}
                </span>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <Star size={16} className={`text-pink-500 fill-current`} />
                    <span className="font-medium">4.9</span>
                    <span className="text-sm text-gray-500">(127)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star size={16} className={`text-blue-600 fill-current`} />
                    <span className="font-medium">9.2</span>
                    <span className="text-sm text-gray-500">(89)</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-lg animate-pulse-glow">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-gray-900">R$ {promoPrice}</span>
                    <span className="text-gray-600">/ noite</span>
                  </div>
                  <div className="text-sm text-green-700">Você economiza R$ {savings} por noite</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500">Preço original</div>
                  <div className="text-sm text-red-500 line-through">R$ {basePrice}</div>
                </div>
              </div>

              <div className="space-y-4">
                <VerticalInfiniteDateRangePicker
                  value={dateRange}
                  onChange={(start, end) => setDateRange({ start, end })}
                  label="Check-in → Check-out"
                />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Hóspedes</label>
                    <select
                      value={guests}
                      onChange={(e) => setGuests(Number(e.target.value))}
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                      aria-label="Selecionar número de hóspedes"
                    >
                      {[1, 2, 3, 4].map((n) => (
                        <option key={n} value={n}>
                          {n} {n === 1 ? "hóspede" : "hóspedes"}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col justify-end">
                    <button
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-medium text-white transition hover:scale-[1.02] hover:bg-blue-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={nights === 0}
                    >
                      Reservar agora <ArrowRight size={18} />
                    </button>
                    <p className="mt-2 text-xs text-gray-500">Sem cobrança imediata — confirme agora e pague depois.</p>
                  </div>
                </div>

                <div className="mt-2 rounded-lg bg-gray-50 p-3 text-sm">
                  <div className="flex justify-between">
                    <span>Noites selecionadas</span>
                    <span>{nights || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total (sem taxas)</span>
                    <span className="font-semibold">{nights ? `R$ ${subtotal}` : "—"}</span>
                  </div>
                  <div className="mt-1 text-xs text-gray-500">Taxa de serviço: <b>Grátis</b>. Cancelamento grátis até 48h.</div>
                </div>
              </div>
            </div>

            {/* Amenidades / atividades (opcional: remova se não usar) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"><Wifi size={18}/> Wi‑Fi grátis</div>
              <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"><Car size={18}/> Estacionamento</div>
              <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"><Waves size={18}/> Vista mar</div>
              <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"><Users size={18}/> Até {property?.bedrooms || 4} pessoas</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer simples */}
      <footer className="border-t border-gray-100 py-8 text-center text-sm text-gray-500">
        <div className="flex justify-center gap-4 mb-4">
          <button
            onClick={onClose}
            className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
          >
            Fechar Anúncio
          </button>
        </div>
        © {new Date().getFullYear()} {property?.title || 'OceanView Apt'} — Todos os direitos reservados
      </footer>
    </div>
  );
}
