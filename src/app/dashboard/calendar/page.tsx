'use client';

export const dynamic = 'force-dynamic';
import { useState, useEffect, useMemo, useRef } from 'react';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/dashboard/Sidebar';
import MobileNav from '@/components/dashboard/MobileNav';
import Image from 'next/image';
import {
  Menu,
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Clock,
  User,
  Calendar as CalendarIcon,
  Check,
  MapPin,
  Users,
  Maximize2,
  LayoutGrid,
  CalendarDays,
  List as ListIcon,
  Search,
  ChevronDown,
} from 'lucide-react';

interface Event {
  id: string;
  title: string;
  instructorId: number;
  startTime: string;
  endTime: string;
  date: Date;
  type: 'lesson' | 'training' | 'competition' | 'farrier';
  isGroup: boolean;
  location: number;
  horseIds?: number[];
  assignHorseLater: boolean;
  clientName?: string;
}

interface LaidOutEvent extends Event {
  lane: number;
  lanes: number;
}

interface Instructor {
  id: number;
  name: string;
  color: string;
  textColor: string;
  light: string;
}

function toMinutes(time: string) {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + (m || 0);
}

function layoutEvents(dayEvents: Event[]): LaidOutEvent[] {
  const sorted = [...dayEvents].sort((a, b) => toMinutes(a.startTime) - toMinutes(b.startTime));
  const lanes: { end: number }[] = [];
  const placed: { event: Event; lane: number }[] = [];

  sorted.forEach((event) => {
    const start = toMinutes(event.startTime);
    const end = toMinutes(event.endTime);
    let laneIndex = lanes.findIndex((lane) => lane.end <= start);
    if (laneIndex === -1) {
      laneIndex = lanes.length;
      lanes.push({ end });
    } else {
      lanes[laneIndex].end = end;
    }
    placed.push({ event, lane: laneIndex });
  });

  const totalLanes = Math.max(lanes.length, 1);
  return placed.map((p) => ({ ...p.event, lane: p.lane, lanes: totalLanes }));
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function sameDay(a: Date, b: Date) {
  return a.toDateString() === b.toDateString();
}

function toISODate(date: Date) {
  return date.toISOString().split('T')[0];
}

function formatHour(h: number) {
  return `${h}:00`;
}

function typeLabel(type: Event['type']) {
  if (type === 'lesson') return 'Lekcja';
  if (type === 'training') return 'Trening';
  if (type === 'competition') return 'Zawody';
  return 'Kowal';
}

const instructorColors = [
  { color: 'bg-blue-500', textColor: 'text-blue-500', light: 'bg-blue-500/15' },
  { color: 'bg-sky-500', textColor: 'text-sky-500', light: 'bg-sky-500/15' },
  { color: 'bg-emerald-500', textColor: 'text-emerald-500', light: 'bg-emerald-500/15' },
  { color: 'bg-orange-500', textColor: 'text-orange-500', light: 'bg-orange-500/15' },
  { color: 'bg-indigo-500', textColor: 'text-indigo-500', light: 'bg-indigo-500/15' },
  { color: 'bg-rose-500', textColor: 'text-rose-500', light: 'bg-rose-500/15' },
  { color: 'bg-cyan-600', textColor: 'text-cyan-600', light: 'bg-cyan-600/15' },
  { color: 'bg-violet-500', textColor: 'text-violet-500', light: 'bg-violet-500/15' },
  { color: 'bg-teal-600', textColor: 'text-teal-600', light: 'bg-teal-600/15' },
  { color: 'bg-blue-900', textColor: 'text-blue-900', light: 'bg-blue-900/15' },
];

const fallbackInstructors: Instructor[] = [
  { id: 1, name: 'Anna Kowalska', ...instructorColors[0] },
  { id: 2, name: 'Piotr Nowak', ...instructorColors[1] },
  { id: 3, name: 'Maria Wiśniewska', ...instructorColors[2] },
  { id: 4, name: 'Jan Kowalczyk', ...instructorColors[3] },
];

const fallbackHorses = [
  { id: 1, name: 'Błyskawica' },
  { id: 2, name: 'Gwiazda' },
  { id: 3, name: 'Huragan' },
  { id: 4, name: 'Słońce' },
  { id: 5, name: 'Wiatr' },
];

const fallbackLocations = [
  { value: 1, label: 'Ujeżdżalnia', icon: <MapPin className="w-5 h-5" /> },
  { value: 2, label: 'Lonżownik', icon: <Clock className="w-5 h-5" /> },
  { value: 3, label: 'Karuzela', icon: <Users className="w-5 h-5" /> },
  { value: 4, label: 'Pastwisko', icon: <Maximize2 className="w-5 h-5" /> },
];

const fallbackClients: { id: number; name: string; email?: string }[] = [];

const fallbackServices = [
  { id: 1, name: 'Lekcja indywidualna', duration: 60, type: 'lesson' as const },
  { id: 2, name: 'Lekcja grupowa', duration: 90, type: 'lesson' as const },
  { id: 3, name: 'Trening', duration: 120, type: 'training' as const },
  { id: 4, name: 'Zawody', duration: 180, type: 'competition' as const },
  { id: 5, name: 'Konsultacja 15 min', duration: 15, type: 'lesson' as const },
];

const weekDays = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Nd'];
const hours = Array.from({ length: 12 }, (_, i) => i + 8);

function DayAgendaList({
  date,
  events,
  onEventClick,
  onEmptyAdd,
  compact = false,
  instructors,
}: {
  date: Date;
  events: Event[];
  onEventClick: (e: Event) => void;
  onEmptyAdd: () => void;
  compact?: boolean;
  instructors: Instructor[];
}) {
  const sorted = useMemo(() => {
    return [...events].sort((a, b) => toMinutes(a.startTime) - toMinutes(b.startTime));
  }, [events]);

  if (sorted.length === 0) {
    return (
      <div className={`text-center ${compact ? 'py-6' : 'py-10'}`}>
        <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-iceBlue flex items-center justify-center text-marineBlue">
          <CalendarIcon className="w-7 h-7" />
        </div>
        <p className="text-sm text-marineBlue mb-3">Brak wizyt w tym dniu</p>
        {!compact && (
          <button
            onClick={onEmptyAdd}
            className="px-4 py-2 bg-gradient-to-r from-oceanBlue to-marineBlue text-white rounded-xl text-sm font-medium flex items-center gap-2 mx-auto shadow-md hover:shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" />
            Dodaj wizytę
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sorted.map((event) => {
        const instructor = instructors.find((i) => i.id === event.instructorId);
        return (
          <button
            key={event.id}
            onClick={() => onEventClick(event)}
            className="group w-full text-left bg-white rounded-2xl p-4 border border-iceBlue shadow-sm hover:shadow-md hover:border-oceanBlue/40 transition-all flex items-start gap-4"
          >
            <div className={`w-14 shrink-0 rounded-xl ${instructor?.color} text-white flex flex-col items-center justify-center py-2`}>
              <span className="text-[11px] font-medium opacity-90">{event.startTime}</span>
              <div className="w-8 h-px bg-white/30 my-1" />
              <span className="text-[11px] font-medium opacity-90">{event.endTime}</span>
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="font-semibold text-deepNavy text-sm truncate">{event.title}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-marineBlue truncate mb-2">
                <User className="w-3.5 h-3.5" />
                <span className="truncate">{event.clientName || 'Brak klienta'}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-medium text-white ${instructor?.color || 'bg-oceanBlue'}`}>
                  {instructor?.name}
                </span>
                <span className="px-2.5 py-1 rounded-lg text-[10px] font-medium bg-iceBlue text-deepNavy">
                  {typeLabel(event.type)}
                </span>
                {event.isGroup && (
                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-medium bg-oceanBlue/10 text-oceanBlue flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    Grupa
                  </span>
                )}
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-mistBlue group-hover:text-oceanBlue transition-colors shrink-0 mt-3" />
          </button>
        );
      })}
    </div>
  );
}

function AgendaView({
  startDate,
  events,
  onEventClick,
  instructors,
}: {
  startDate: Date;
  events: Event[];
  onEventClick: (e: Event) => void;
  instructors: Instructor[];
}) {
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(startDate, i)), [startDate]);
  const total = useMemo(
    () => days.reduce((sum, day) => sum + events.filter((e) => sameDay(e.date, day)).length, 0),
    [days, events]
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between bg-white rounded-2xl p-4 border border-iceBlue shadow-sm">
        <div>
          <p className="font-serif font-bold text-deepNavy">Wizyty w tym tygodniu</p>
          <p className="text-xs text-marineBlue mt-0.5">{total} wydarzeń w najbliższych 7 dniach</p>
        </div>
        <ListIcon className="w-6 h-6 text-marineBlue" />
      </div>
      {days.map((day) => {
        const dayEvents = events
          .filter((e) => sameDay(e.date, day))
          .sort((a, b) => toMinutes(a.startTime) - toMinutes(b.startTime));
        const isToday = sameDay(day, new Date());
        return (
          <div
            key={toISODate(day)}
            className={`rounded-3xl border p-5 ${isToday ? 'border-oceanBlue bg-oceanBlue/5' : 'border-iceBlue bg-white'}`}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className={`font-serif font-bold ${isToday ? 'text-oceanBlue' : 'text-deepNavy'}`}>
                {isToday
                  ? 'Dziś'
                  : day.toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' })}
              </h3>
              {dayEvents.length > 0 && (
                <span className="text-xs font-medium text-marineBlue bg-iceBlue px-3 py-1 rounded-full">
                  {dayEvents.length} wizyt
                </span>
              )}
            </div>
            <DayAgendaList
              date={day}
              events={dayEvents}
              onEventClick={onEventClick}
              onEmptyAdd={() => {}}
              compact={dayEvents.length === 0}
              instructors={instructors}
            />
          </div>
        );
      })}
    </div>
  );
}

function MobileDayTimeline({
  date,
  events,
  instructors,
  onEventClick,
  onEmptyAdd,
}: {
  date: Date;
  events: Event[];
  instructors: Instructor[];
  onEventClick: (e: Event) => void;
  onEmptyAdd: () => void;
}) {
  const dayEvents = useMemo(
    () =>
      [...events]
        .filter((e) => sameDay(e.date, date))
        .sort((a, b) => toMinutes(a.startTime) - toMinutes(b.startTime)),
    [events, date]
  );

  if (dayEvents.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center py-10">
        <div className="w-14 h-14 rounded-2xl bg-iceBlue flex items-center justify-center text-marineBlue mb-3">
          <CalendarIcon className="w-7 h-7" />
        </div>
        <p className="text-sm text-marineBlue mb-3">Brak wizyt w tym dniu</p>
        <button
          onClick={onEmptyAdd}
          className="px-4 py-2 bg-gradient-to-r from-oceanBlue to-marineBlue text-white rounded-xl text-sm font-medium flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
        >
          <Plus className="w-4 h-4" />
          Dodaj wizytę
        </button>
      </div>
    );
  }

  const laidOut = layoutEvents(dayEvents);
  const startHour = hours[0];
  const containerHeight = hours.length * 64;

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-3 border-b border-iceBlue">
        <h3 className="font-serif font-bold text-deepNavy capitalize">
          {sameDay(date, new Date())
            ? 'Dziś'
            : date.toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' })}
        </h3>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="relative" style={{ height: `${containerHeight}px` }}>
          {hours.map((hour) => (
            <div
              key={hour}
              className="absolute w-full border-b border-iceBlue/40 flex"
              style={{ top: `${(hour - startHour) * 64}px`, height: '64px' }}
            >
              <div className="w-14 shrink-0 text-xs text-marineBlue text-right pr-3 pt-2">{hour}:00</div>
              <div className="flex-1 relative" />
            </div>
          ))}
          <div className="absolute top-0 bottom-0" style={{ left: '56px', width: 'calc(100% - 56px)' }}>
            {laidOut.map((event) => {
              const instructor = instructors.find((i) => i.id === event.instructorId);
              const startOffset = (toMinutes(event.startTime) - startHour * 60) / 60;
              const durationHours = (toMinutes(event.endTime) - toMinutes(event.startTime)) / 60;
              const widthPct = 100 / event.lanes;
              return (
                <button
                  key={event.id}
                  onClick={() => onEventClick(event)}
                  className={`absolute ${instructor?.color || 'bg-oceanBlue'} text-white p-1 rounded-xl shadow-md hover:shadow-lg transition-all text-left flex flex-col justify-center pointer-events-auto overflow-hidden`}
                  style={{
                    top: `${startOffset * 64}px`,
                    height: `${Math.max(durationHours * 64 - 2, 24)}px`,
                    left: `${event.lane * widthPct + 1}%`,
                    width: `${widthPct - 2}%`,
                  }}
                >
                  {durationHours >= 0.5 && (
                    <span className="text-[9px] font-semibold truncate leading-none">
                      {event.startTime} - {event.endTime}
                    </span>
                  )}
                  <span className="text-[10px] font-bold truncate leading-none">{event.title}</span>
                  {durationHours >= 0.75 && instructor && (
                    <span className="text-[9px] opacity-90 truncate leading-none">{instructor.name}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function MobileWeekPager({
  weekDates,
  currentDate,
  events,
  instructors,
  onEventClick,
  onEmptyAddForDate,
}: {
  weekDates: Date[];
  currentDate: Date;
  events: Event[];
  instructors: Instructor[];
  onEventClick: (e: Event) => void;
  onEmptyAddForDate: (d: Date) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const idx = weekDates.findIndex((d) => sameDay(d, currentDate));
    setActiveIndex(idx >= 0 ? idx : 0);
  }, [weekDates, currentDate]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.scrollTo({ left: activeIndex * container.clientWidth, behavior: 'auto' });
  }, [activeIndex]);

  const scrollToIndex = (idx: number) => {
    const container = containerRef.current;
    if (!container) return;
    container.scrollTo({ left: idx * container.clientWidth, behavior: 'smooth' });
    setActiveIndex(idx);
  };

  const handleScroll = () => {
    const container = containerRef.current;
    if (!container) return;
    const idx = Math.round(container.scrollLeft / container.clientWidth);
    if (idx !== activeIndex) setActiveIndex(idx);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide px-4 py-2 shrink-0">
        {weekDates.map((date, idx) => {
          const isActive = idx === activeIndex;
          const isToday = sameDay(date, new Date());
          return (
            <button
              key={toISODate(date)}
              onClick={() => scrollToIndex(idx)}
              className={`shrink-0 flex flex-col items-center min-w-[44px] px-2 py-1.5 rounded-xl text-[10px] font-medium transition-all ${
                isActive ? 'bg-oceanBlue text-white shadow-sm' : 'bg-arcticBlue/40 text-marineBlue hover:bg-arcticBlue'
              }`}
            >
              <span>{weekDays[idx]}</span>
              <span className={`text-xs font-bold ${isActive ? 'text-white' : isToday ? 'text-oceanBlue' : 'text-deepNavy'}`}>
                {date.getDate()}
              </span>
            </button>
          );
        })}
      </div>
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 flex overflow-x-auto snap-x snap-mandatory scrollbar-hide"
      >
        {weekDates.map((date, idx) => (
          <div key={toISODate(date)} className="flex-none w-full h-full snap-start px-4">
            <MobileDayTimeline
              date={date}
              events={events}
              instructors={instructors}
              onEventClick={onEventClick}
              onEmptyAdd={() => onEmptyAddForDate(date)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function MobileDayGrid({
  date,
  events,
  instructors,
  onEventClick,
  onEmptyAdd,
}: {
  date: Date;
  events: Event[];
  instructors: Instructor[];
  onEventClick: (e: Event) => void;
  onEmptyAdd: () => void;
}) {
  if (instructors.length === 0) {
    return (
      <div className="h-[calc(100vh-340px)] min-h-[360px] flex flex-col items-center justify-center py-10">
        <div className="w-14 h-14 rounded-2xl bg-iceBlue flex items-center justify-center text-marineBlue mb-3">
          <CalendarIcon className="w-7 h-7" />
        </div>
        <p className="text-sm text-marineBlue mb-3">Brak instruktorów w tym dniu</p>
        <button
          onClick={onEmptyAdd}
          className="px-4 py-2 bg-gradient-to-r from-oceanBlue to-marineBlue text-white rounded-xl text-sm font-medium flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
        >
          <Plus className="w-4 h-4" />
          Dodaj wizytę
        </button>
      </div>
    );
  }

  const startHour = hours[0];
  const containerHeight = hours.length * 64;

  return (
    <div className="h-[calc(100vh-340px)] min-h-[360px] overflow-y-auto overflow-x-auto scrollbar-hide">
      <div className="inline-flex min-w-max">
        <div className="sticky left-0 z-10 w-14 shrink-0 bg-arcticBlue/40 border-r border-iceBlue flex flex-col">
          <div className="h-10 border-b border-iceBlue/50" />
          {hours.map((hour) => (
            <div key={hour} className="h-16 border-b border-iceBlue/40 text-[10px] text-marineBlue text-right pr-2 pt-1">
              {hour}:00
            </div>
          ))}
        </div>
        {instructors.map((instructor) => {
          const instEvents = events.filter(
            (e) => sameDay(e.date, date) && e.instructorId === instructor.id
          );
          const laidOut = layoutEvents(instEvents);
          return (
            <div key={instructor.id} className="w-36 shrink-0 border-r border-iceBlue/50 flex flex-col">
              <div className="h-10 border-b border-iceBlue/50 flex items-center justify-center px-1 bg-arcticBlue/20">
                <span className="text-[11px] font-bold text-deepNavy text-center truncate leading-tight">{instructor.name}</span>
              </div>
              <div className="relative" style={{ height: containerHeight }}>
                {hours.map((hour) => (
                  <div
                    key={hour}
                    className="absolute w-full border-b border-iceBlue/20"
                    style={{ top: `${(hour - startHour) * 64}px`, height: '64px' }}
                  />
                ))}
                {laidOut.map((event) => {
                  const startOffset = (toMinutes(event.startTime) - startHour * 60) / 60;
                  const durationHours = (toMinutes(event.endTime) - toMinutes(event.startTime)) / 60;
                  const widthPct = 100 / event.lanes;
                  return (
                    <button
                      key={event.id}
                      onClick={() => onEventClick(event)}
                      className={`absolute ${instructor.color} text-white p-1 rounded-lg shadow-sm text-[10px] font-medium text-left overflow-hidden`}
                      style={{
                        top: `${startOffset * 64}px`,
                        height: `${Math.max(durationHours * 64 - 2, 24)}px`,
                        left: `${event.lane * widthPct}%`,
                        width: `${widthPct}%`,
                      }}
                    >
                      <span className="truncate block leading-none">
                        {event.startTime} {event.title}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function CalendarPage() {
  const router = useRouter();
  const { user, isAuthenticated, activeStableId } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'day-list' | 'day' | 'week' | 'month'>('day-list');
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const view = new URLSearchParams(window.location.search).get('view');
    const valid: ('day-list' | 'day' | 'week' | 'month')[] = ['day-list', 'day', 'week', 'month'];
    if (view && valid.includes(view as any)) {
      setViewMode(view as any);
    }
  }, []);

  const [isDesktop, setIsDesktop] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [horsePickerOpen, setHorsePickerOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [addStep, setAddStep] = useState(1);
  const [selectedInstructor, setSelectedInstructor] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [selectedType, setSelectedType] = useState<'lesson' | 'training' | 'competition' | 'farrier'>('lesson');
  const [isGroup, setIsGroup] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<number>(1);
  const [selectedHorses, setSelectedHorses] = useState<number[]>([]);
  const [assignHorseLater, setAssignHorseLater] = useState(false);
  const [filterInstructor, setFilterInstructor] = useState<number | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [clientSearch, setClientSearch] = useState('');
  const [showAddClientForm, setShowAddClientForm] = useState(false);
  const [selectedService, setSelectedService] = useState<string>('');
  const [duration, setDuration] = useState(60);
  const [dayDetailsDate, setDayDetailsDate] = useState<Date | null>(null);

  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [horses, setHorses] = useState<{ id: number; name: string }[]>(fallbackHorses);
  const [locations, setLocations] = useState(fallbackLocations);
  const [clients, setClients] = useState<{ id: number; name: string; email?: string }[]>(fallbackClients);
  const [services, setServices] = useState<{ id: number; name: string; duration: number; type: 'lesson' | 'training' | 'competition' }[]>(fallbackServices);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!activeStableId) {
      setInstructors([]);
      setLoading(false);
      return;
    }

    const loadData = async () => {
      setLoading(true);
      try {
        const startDate = new Date(currentDate);
        startDate.setDate(startDate.getDate() - 7);
        const endDate = new Date(currentDate);
        endDate.setDate(endDate.getDate() + 30);

        const { data } = await api.get(`/calendar?stableId=${activeStableId}&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`);

        setEvents((data || []).map((e: any, idx: number) => ({
          id: e.id,
          title: e.title,
          instructorId: idx + 1,
          startTime: e.startTime || '09:00',
          endTime: e.endTime || '10:00',
          date: new Date(e.date),
          type: e.type || 'lesson',
          isGroup: e.maxParticipants > 1,
          location: 1,
          clientName: e.participants?.[0]?.user ? `${e.participants[0].user.firstName} ${e.participants[0].user.lastName}` : '',
        })));

        // Load stable data for instructors, horses, etc.
        const stableRes = await api.get(`/stables/${activeStableId}`);
        const stable = stableRes.data;

        setServices(
          (stable.services || []).map((s: string, idx: number) => ({
            id: idx + 1,
            name: s,
            duration: 60,
            type: 'lesson' as const,
          }))
        );

        // Load instructors from API
        const employeesRes = await api.get(`/employees?stableId=${activeStableId}`);
        const employees = employeesRes.data || [];
        setInstructors(
          employees.map((emp: any, idx: number) => ({
            id: emp.id,
            name: emp.name,
            color: emp.color || instructorColors[idx % instructorColors.length].color,
            textColor: emp.color || instructorColors[idx % instructorColors.length].textColor,
            light: emp.color ? emp.color.replace('bg-', 'bg-') + '/15' : instructorColors[idx % instructorColors.length].light,
          }))
        );

        // Load clients from API
        const clientsRes = await api.get(`/clients?stableId=${activeStableId}`);
        const clientsData = clientsRes.data || [];
        setClients(
          clientsData.map((c: any) => ({
            id: c.id,
            name: `${c.user.firstName} ${c.user.lastName}`,
            email: c.user.email,
          }))
        );
      } catch (err) {
        console.error('Load calendar data error:', err);
        setInstructors([]);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [activeStableId, currentDate]);

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  if (!isAuthenticated()) {
    router.push('/login');
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-arcticBlue via-white to-iceBlue">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} user={user} />
        <div className="lg:ml-72 min-h-screen flex items-center justify-center">
          <p className="text-marineBlue">Ładowanie kalendarza...</p>
        </div>
      </div>
    );
  }

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentDate(newDate);
  };

  const navigateDay = (direction: 'prev' | 'next') => {
    setCurrentDate(addDays(currentDate, direction === 'next' ? 1 : -1));
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    setCurrentDate(newDate);
  };

  const getWeekDates = () => {
    const dates = [];
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const getMonthDates = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const totalDays = new Date(year, month + 1, 0).getDate();
    const startDay = firstDay.getDay();
    const dates: (Date | null)[] = [];
    const blanks = (startDay + 6) % 7;
    for (let i = 0; i < blanks; i++) dates.push(null);
    for (let i = 1; i <= totalDays; i++) dates.push(new Date(year, month, i));
    return dates;
  };

  const formatDate = (date: Date) => date.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' });
  const formatMonthYear = (date: Date) => date.toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' });
  const formatWeekRange = () => {
    const weekDates = getWeekDates();
    return `${formatDate(weekDates[0])} - ${formatDate(weekDates[6])}`;
  };

  const getFilteredEvents = () => {
    return events.filter((event) => {
      if (filterInstructor && event.instructorId !== filterInstructor) return false;
      if (filterType !== 'all' && event.type !== filterType) return false;
      return true;
    });
  };

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
    setHorsePickerOpen(false);
    setShowEventModal(true);
  };

  const handleAddEvent = () => {
    setEditingEventId(null);
    setAddStep(1);
    setSelectedInstructor(null);
    setSelectedDate(null);
    setSelectedTime('');
    setSelectedType('lesson');
    setIsGroup(false);
    setSelectedLocation(locations[0]?.value || 1);
    setSelectedHorses([]);
    setAssignHorseLater(false);
    setSelectedClients([]);
    setClientSearch('');
    setShowAddClientForm(false);
    setSelectedService('');
    setDuration(60);
    setShowAddModal(true);
  };

  const handleEditEvent = () => {
    if (!selectedEvent) return;
    setEditingEventId(selectedEvent.id);
    setAddStep(1);
    setSelectedClients(selectedEvent.clientName ? selectedEvent.clientName.split(', ') : []);
    setSelectedService(selectedEvent.title);
    setDuration(toMinutes(selectedEvent.endTime) - toMinutes(selectedEvent.startTime));
    setSelectedType(selectedEvent.type);
    setIsGroup(selectedEvent.isGroup);
    setSelectedDate(selectedEvent.date);
    setSelectedTime(selectedEvent.startTime);
    setSelectedInstructor(selectedEvent.instructorId);
    setSelectedLocation(selectedEvent.location);
    setSelectedHorses(selectedEvent.horseIds || []);
    setAssignHorseLater(selectedEvent.assignHorseLater);
    setShowEventModal(false);
    setShowAddModal(true);
  };

  const handleAddEventSubmit = async () => {
    if (selectedInstructor && selectedDate && selectedTime && selectedClients.length > 0) {
      const [h, m] = selectedTime.split(':').map(Number);
      const startMin = h * 60 + (m || 0);
      const endMin = startMin + duration;
      const endHour = Math.floor(endMin / 60);
      const endMinute = endMin % 60;
      const endTime = `${endHour}:${endMinute.toString().padStart(2, '0')}`;

      const eventData = {
        title: selectedService || 'Zajęcia',
        instructorId: selectedInstructor,
        startTime: selectedTime,
        endTime,
        date: selectedDate.toISOString(),
        type: selectedType,
        isGroup: selectedClients.length > 1,
        location: selectedLocation,
        horseIds: assignHorseLater ? [] : selectedHorses,
        assignHorseLater,
        clientName: selectedClients.join(', '),
        stableId: activeStableId,
      };

      try {
        if (editingEventId) {
          const { data } = await api.put(`/calendar/${editingEventId}`, eventData);
          setEvents(events.map((e) => (e.id === editingEventId ? { ...data, date: new Date(data.date) } : e)));
        } else {
          const { data } = await api.post('/calendar', eventData);
          setEvents([...events, { ...data, date: new Date(data.date) }]);
        }
        setEditingEventId(null);
        setShowAddModal(false);
      } catch (error) {
        console.error('Save event error:', error);
        alert('Nie udało się zapisać wydarzenia');
      }
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      await api.delete(`/calendar/${eventId}`);
      setEvents(events.filter((e) => e.id !== eventId));
      setShowEventModal(false);
    } catch (error) {
      console.error('Delete event error:', error);
      alert('Nie udało się usunąć wydarzenia');
    }
  };

  const weekDates = getWeekDates();
  const filteredEvents = getFilteredEvents();
  const activeInstructor = instructors.find((i) => i.id === filterInstructor);

  const handleSetViewMode = (mode: 'day-list' | 'day' | 'week' | 'month') => {
    setViewMode(mode);
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    params.set('view', mode);
    window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
  };

  const viewButtons = [
    { key: 'day-list', label: 'Lista', icon: <ListIcon className="w-4 h-4" /> },
    { key: 'day', label: 'Dzień', icon: <Clock className="w-4 h-4" /> },
    { key: 'week', label: 'Tydzień', icon: <CalendarDays className="w-4 h-4" /> },
    { key: 'month', label: 'Miesiąc', icon: <LayoutGrid className="w-4 h-4" /> },
  ] as const;

  return (
    <div className="min-h-screen bg-gradient-to-br from-arcticBlue via-white to-iceBlue">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} user={user} />

      <div className="lg:ml-72 min-h-screen pb-24 lg:pb-0">
        {/* Mobile top bar */}
        <div className="lg:hidden sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-iceBlue">
          <div className="bg-gradient-to-r from-deepNavy to-oceanBlue text-white px-4 py-3 flex items-center justify-between">
            <Image
              src="/zdj/horsemanagologo3"
              alt="HORSEmanago"
              width={92}
              height={92}
              className="rounded-lg"
            />
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>

        <main className="px-4 lg:px-8 py-6 lg:py-8 space-y-6">
          {/* Masthead */}
          <div className="rounded-3xl bg-gradient-to-r from-deepNavy via-oceanBlue to-marineBlue text-white overflow-hidden shadow-xl">
            <div className="p-6 sm:p-8 lg:p-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div>
                <p className="text-white/60 text-xs uppercase tracking-[0.2em] mb-2">Plan zajęć</p>
                <h1 className="font-serif text-3xl sm:text-4xl font-bold">Kalendarz</h1>
                <p className="text-white/75 text-sm sm:text-base mt-2 max-w-md">
                  Zarządzaj rezerwacjami, instruktorami i harmonogramem w jednym miejscu.
                </p>
              </div>
              <button
                onClick={handleAddEvent}
                className="shrink-0 px-6 py-3.5 bg-white text-deepNavy rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Dodaj wizytę
              </button>
            </div>
          </div>

          {/* Controls card */}
          <div className="bg-white rounded-3xl shadow-lg border border-iceBlue p-4 lg:p-6 space-y-5">
            {/* Filters */}
            <div className="space-y-3">
              {instructors.length > 0 && (
                <div className="hidden lg:flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
                  <span className="text-xs font-semibold uppercase tracking-wide text-marineBlue/70 shrink-0">Instruktorzy</span>
                  {instructors.map((instructor) => (
                    <button
                      key={instructor.id}
                      onClick={() => setFilterInstructor(filterInstructor === instructor.id ? null : instructor.id)}
                      className={`shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-full text-sm font-medium transition-all border ${
                        filterInstructor === instructor.id
                          ? `${instructor.color} text-white border-transparent shadow-md`
                          : 'border-iceBlue text-deepNavy hover:border-oceanBlue/40 bg-arcticBlue/30'
                      }`}
                    >
                      <div className={`w-2 h-2 rounded-full ${filterInstructor === instructor.id ? 'bg-white' : instructor.color}`} />
                      {instructor.name}
                    </button>
                  ))}
                  {filterInstructor && (
                    <button
                      onClick={() => setFilterInstructor(null)}
                      className="shrink-0 p-2 rounded-full border border-iceBlue text-marineBlue hover:bg-iceBlue/40 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}

              <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
                <span className="text-xs font-semibold uppercase tracking-wide text-marineBlue/70 shrink-0">Typ</span>
                {[
                  { key: 'all', label: 'Wszystkie' },
                  { key: 'lesson', label: 'Lekcje' },
                  { key: 'training', label: 'Treningi' },
                  { key: 'competition', label: 'Zawody' },
                  { key: 'farrier', label: 'Kowal' },
                ].map((type) => (
                  <button
                    key={type.key}
                    onClick={() => setFilterType(type.key)}
                    className={`shrink-0 px-3.5 py-2 rounded-full text-sm font-medium transition-all border ${
                      filterType === type.key
                        ? 'bg-gradient-to-r from-oceanBlue to-marineBlue text-white border-transparent shadow-md'
                        : 'border-iceBlue text-deepNavy hover:border-oceanBlue/40 bg-arcticBlue/30'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Legend */}
            {instructors.length > 0 && (
              <div className="pt-2 border-t border-iceBlue space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-marineBlue/70">Legenda</p>
                <div className="flex flex-wrap gap-2">
                  {instructors.map((instructor) => (
                    <div key={instructor.id} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-arcticBlue/30 border border-iceBlue">
                      <div className={`w-3 h-3 rounded-full ${instructor.color}`} />
                      <span className="text-xs font-medium text-deepNavy">{instructor.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* View selector + date nav */}
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 pt-2 border-t border-iceBlue">
              <div className="flex p-1.5 bg-arcticBlue rounded-2xl w-full lg:w-auto">
                {viewButtons.map((mode) => (
                  <button
                    key={mode.key}
                    onClick={() => handleSetViewMode(mode.key as any)}
                    className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      viewMode === mode.key
                        ? 'bg-white text-deepNavy shadow-md'
                        : 'text-marineBlue hover:text-deepNavy'
                    }`}
                  >
                    {mode.icon}
                    <span className="hidden sm:inline">{mode.label}</span>
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between lg:justify-end gap-3">
                <div className="flex items-center bg-arcticBlue rounded-2xl p-1">
                  <button
                    onClick={() =>
                      viewMode === 'month'
                        ? navigateMonth('prev')
                        : viewMode === 'day' || viewMode === 'day-list'
                        ? navigateDay('prev')
                        : navigateWeek('prev')
                    }
                    className="p-2.5 rounded-xl bg-white text-deepNavy shadow-sm hover:shadow transition-all"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  {viewMode === 'day' || viewMode === 'day-list' ? (
                    <input
                      type="date"
                      value={toISODate(currentDate)}
                      onChange={(e) => setCurrentDate(new Date(e.target.value))}
                      className="mx-2 px-3 py-2 rounded-2xl border border-iceBlue text-sm text-deepNavy focus:outline-none focus:border-oceanBlue bg-white min-w-[160px] text-center font-semibold"
                    />
                  ) : (
                    <h2 className="px-4 font-serif text-base sm:text-lg font-bold text-deepNavy min-w-[140px] text-center">
                      {viewMode === 'month' ? formatMonthYear(currentDate) : formatWeekRange()}
                    </h2>
                  )}
                  <button
                    onClick={() =>
                      viewMode === 'month'
                        ? navigateMonth('next')
                        : viewMode === 'day' || viewMode === 'day-list'
                        ? navigateDay('next')
                        : navigateWeek('next')
                    }
                    className="p-2.5 rounded-xl bg-white text-deepNavy shadow-sm hover:shadow transition-all"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Calendar card */}
          <div className="bg-white rounded-3xl shadow-lg border border-iceBlue p-4 lg:p-6 min-h-[500px]">
            {/* Week view */}
            {viewMode === 'week' && (
              <>
                <div className="lg:hidden h-[calc(100vh-280px)] min-h-[420px] bg-white rounded-3xl border border-iceBlue overflow-hidden -mx-4">
                  <MobileWeekPager
                    weekDates={weekDates}
                    currentDate={currentDate}
                    events={filteredEvents}
                    instructors={instructors}
                    onEventClick={handleEventClick}
                    onEmptyAddForDate={(date) => {
                      setSelectedDate(date);
                      setSelectedTime('');
                      setShowAddModal(true);
                    }}
                  />
                </div>

                <div className="hidden lg:block overflow-x-auto">
                  <div className="min-w-[900px] relative" style={{ height: `${hours.length * 64 + 48}px` }}>
                    <div
                      className="grid grid-cols-8 gap-px bg-iceBlue rounded-2xl overflow-hidden absolute inset-0"
                      style={{ gridTemplateRows: `48px repeat(${hours.length}, 64px)` }}
                    >
                      <div className="bg-arcticBlue p-3 h-12 text-sm font-bold text-deepNavy flex items-center justify-end pr-4">Godz</div>
                      {weekDays.map((day, i) => (
                        <div key={i} className="bg-arcticBlue p-3 h-12 text-center flex flex-col items-center justify-center">
                          <div className="text-sm font-bold text-deepNavy leading-none">{day}</div>
                          <div className="text-[10px] text-marineBlue mt-0.5 leading-none">{formatDate(weekDates[i])}</div>
                        </div>
                      ))}
                      {hours.map((hour) => (
                        <div key={hour} className="contents">
                          <div className="bg-white p-3 text-sm text-marineBlue text-right pr-4 h-16 border-b border-iceBlue/50 flex items-center justify-end">{hour}:00</div>
                          {weekDays.map((_, dayIndex) => (
                            <div
                              key={dayIndex}
                              className="bg-white h-16 border-b border-iceBlue/30 hover:bg-arcticBlue/30 transition-colors cursor-pointer"
                              onClick={() => {
                                setSelectedDate(weekDates[dayIndex]);
                                setSelectedTime(`${hour}:00`);
                                setShowAddModal(true);
                              }}
                            />
                          ))}
                        </div>
                      ))}
                    </div>
                    <div
                      className="absolute h-[768px] pointer-events-none"
                      style={{ top: '48px', left: '12.5%', width: '87.5%' }}
                    >
                      {weekDays.map((_, dayIndex) => {
                        const dayEvents = filteredEvents.filter((e) => sameDay(e.date, weekDates[dayIndex]));
                        const laidOut = layoutEvents(dayEvents);
                        return (
                          <div
                            key={dayIndex}
                            className="absolute top-0 bottom-0 border-l border-iceBlue/20"
                            style={{
                              left: `calc(${dayIndex} * 100% / 7)`,
                              width: `calc(100% / 7)`,
                            }}
                          >
                            {laidOut.map((event) => {
                              const instructor = instructors.find((i) => i.id === event.instructorId);
                              const startOffset = (toMinutes(event.startTime) - hours[0] * 60) / 60;
                              const durationHours = (toMinutes(event.endTime) - toMinutes(event.startTime)) / 60;
                              const widthPct = 100 / event.lanes;
                              return (
                                <div
                                  key={event.id}
                                  className={`absolute ${instructor?.color} text-white p-1 text-[10px] font-medium flex flex-col justify-center rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer pointer-events-auto`}
                                  style={{
                                    top: `${startOffset * 64}px`,
                                    height: `${Math.max(durationHours * 64 - 2, 24)}px`,
                                    left: `${event.lane * widthPct + 2}%`,
                                    width: `${widthPct - 4}%`,
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEventClick(event);
                                  }}
                                >
                                  <span className="truncate font-semibold leading-none">{event.title}</span>
                                  {durationHours >= 0.75 && <span className="truncate opacity-90 leading-none">{event.clientName}</span>}
                                  {durationHours >= 0.5 && <span className="opacity-75 leading-none">{event.startTime} - {event.endTime}</span>}
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Month view */}
            {viewMode === 'month' && (
              <>
                <div className="lg:hidden h-[calc(100vh-330px)] min-h-[420px] overflow-y-auto -mx-4 px-4 scrollbar-hide">
                  <div className="grid grid-cols-7 gap-1.5 min-w-[360px]">
                    {weekDays.map((day) => (
                      <div key={day} className="text-center text-[10px] font-bold text-marineBlue uppercase tracking-wide py-2">
                        {day.slice(0, 3)}
                      </div>
                    ))}
                    {getMonthDates().map((date, index) => {
                      if (!date) return <div key={index} className="min-h-[80px] rounded-xl" />;
                      const dayEvents = filteredEvents.filter((e) => sameDay(e.date, date));
                      const isToday = sameDay(date, new Date());
                      return (
                        <button
                          key={index}
                          onClick={() =>
                            dayEvents.length > 0
                              ? setDayDetailsDate(date)
                              : (setSelectedDate(date), setSelectedTime(''), setShowAddModal(true))
                          }
                          className={`min-h-[80px] p-1.5 rounded-xl text-left transition-all flex flex-col justify-start ${
                            isToday
                              ? 'ring-2 ring-oceanBlue bg-oceanBlue/5'
                              : 'bg-white/70 hover:bg-arcticBlue/30'
                          }`}
                        >
                          <div className={`text-xs font-bold mb-1 ${isToday ? 'text-oceanBlue' : 'text-deepNavy'}`}>
                            {date.getDate()}
                          </div>
                          <div className="space-y-1">
                            {dayEvents.slice(0, 2).map((event) => {
                              const instructor = instructors.find((i) => i.id === event.instructorId);
                              return (
                                <div
                                  key={event.id}
                                  className={`text-[9px] px-1 py-0.5 rounded ${instructor?.color} text-white truncate font-medium leading-tight`}
                                >
                                  {event.startTime} {event.title}
                                </div>
                              );
                            })}
                            {dayEvents.length > 2 && (
                              <div className="text-[9px] text-marineBlue font-medium leading-tight">+{dayEvents.length - 2}</div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="hidden lg:grid grid-cols-7 gap-2 sm:gap-3">
                  {weekDays.map((day) => (
                    <div key={day} className="text-center text-xs font-bold text-marineBlue uppercase tracking-wide py-2">
                      {day}
                    </div>
                  ))}
                  {getMonthDates().map((date, index) => {
                    if (!date) return <div key={index} className="min-h-[80px] sm:min-h-[120px]" />;
                    const dayEvents = filteredEvents.filter((e) => sameDay(e.date, date));
                    const isToday = sameDay(date, new Date());
                    return (
                      <button
                        key={index}
                        onClick={() =>
                          dayEvents.length > 0
                            ? setDayDetailsDate(date)
                            : (setSelectedDate(date), setSelectedTime(''), setShowAddModal(true))
                        }
                        className={`min-h-[80px] sm:min-h-[120px] p-2 sm:p-3 rounded-2xl text-left transition-all ${
                          isToday
                            ? 'ring-2 ring-oceanBlue bg-oceanBlue/5'
                            : 'bg-arcticBlue/30 border border-iceBlue hover:border-oceanBlue/40 hover:shadow-md'
                        }`}
                      >
                        <div className={`text-sm font-bold mb-2 ${isToday ? 'text-oceanBlue' : 'text-deepNavy'}`}>{date.getDate()}</div>
                        <div className="space-y-1.5">
                          {dayEvents.slice(0, 2).map((event) => {
                            const instructor = instructors.find((i) => i.id === event.instructorId);
                            return (
                              <div
                                key={event.id}
                                className={`text-[10px] sm:text-xs px-2 py-1 rounded-lg ${instructor?.color} text-white truncate font-medium`}
                              >
                                {event.startTime} {event.title}
                              </div>
                            );
                          })}
                          {dayEvents.length > 2 && (
                            <div className="text-[10px] sm:text-xs text-marineBlue font-medium">+{dayEvents.length - 2} więcej</div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {/* Day view */}
            {viewMode === 'day' && (
              <>
                <div className="lg:hidden">
                  <MobileDayGrid
                    date={currentDate}
                    events={filteredEvents}
                    instructors={instructors}
                    onEventClick={handleEventClick}
                    onEmptyAdd={() => {
                      setSelectedDate(currentDate);
                      setSelectedTime('');
                      setShowAddModal(true);
                    }}
                  />
                </div>

                <div className="hidden lg:block overflow-x-auto">
                  <div className="min-w-[900px] relative" style={{ height: `${hours.length * 64 + 48}px` }}>
                    <div
                      className="grid gap-px bg-iceBlue rounded-2xl overflow-hidden absolute inset-0"
                      style={{ gridTemplateColumns: `80px repeat(${instructors.length}, minmax(140px, 1fr))`, gridTemplateRows: `48px repeat(${hours.length}, 64px)` }}
                    >
                      <div className="bg-arcticBlue p-3 h-12 text-sm font-bold text-deepNavy text-right flex items-center justify-end pr-4">Godz</div>
                      {instructors.map((instructor) => (
                        <div key={instructor.id} className="bg-arcticBlue p-3 h-12 text-center flex items-center justify-center">
                          <div className="text-sm font-bold text-deepNavy truncate">{instructor.name}</div>
                        </div>
                      ))}
                      {hours.map((hour) => (
                        <div key={hour} className="contents">
                          <div className="bg-white p-3 text-sm text-marineBlue text-right pr-4 h-16 border-b border-iceBlue/50 flex items-center justify-end">{hour}:00</div>
                          {instructors.map((instructor) => (
                            <div
                              key={instructor.id}
                              className="bg-white h-16 border-b border-iceBlue/30 hover:bg-arcticBlue/30 transition-colors cursor-pointer"
                              onClick={() => {
                                setSelectedDate(currentDate);
                                setSelectedTime(`${hour}:00`);
                                setSelectedInstructor(instructor.id);
                                setShowAddModal(true);
                              }}
                            />
                          ))}
                        </div>
                      ))}
                    </div>
                    <div
                      className="absolute h-[768px] pointer-events-none"
                      style={{ top: '48px', left: '80px', width: 'calc(100% - 80px)' }}
                    >
                      {instructors.map((instructor, instructorIndex) => {
                        const instructorEvents = filteredEvents.filter(
                          (e) => sameDay(e.date, currentDate) && e.instructorId === instructor.id
                        );
                        const laidOut = layoutEvents(instructorEvents);
                        return (
                          <div
                            key={instructor.id}
                            className="absolute top-0 bottom-0 border-l border-iceBlue/20"
                            style={{
                              left: `calc(${instructorIndex} * 100% / ${instructors.length})`,
                              width: `calc(100% / ${instructors.length})`,
                            }}
                          >
                            {laidOut.map((event) => {
                              const startOffset = (toMinutes(event.startTime) - hours[0] * 60) / 60;
                              const durationHours = (toMinutes(event.endTime) - toMinutes(event.startTime)) / 60;
                              const widthPct = 100 / event.lanes;
                              return (
                                <div
                                  key={event.id}
                                  className={`absolute ${instructor.color} text-white p-1 text-[10px] font-medium flex flex-col justify-center rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer pointer-events-auto`}
                                  style={{
                                    top: `${startOffset * 64}px`,
                                    height: `${Math.max(durationHours * 64 - 2, 24)}px`,
                                    left: `${event.lane * widthPct + 2}%`,
                                    width: `${widthPct - 4}%`,
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEventClick(event);
                                  }}
                                >
                                  <span className="truncate font-semibold leading-none">{event.title}</span>
                                  {durationHours >= 0.75 && <span className="truncate opacity-90 leading-none">{event.clientName}</span>}
                                  {durationHours >= 0.5 && <span className="opacity-75 leading-none">{event.startTime} - {event.endTime}</span>}
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Day list view (main) */}
            {viewMode === 'day-list' && (
              <div className="h-[calc(100vh-340px)] min-h-[420px] overflow-y-auto -mx-4 px-4 py-2 space-y-3">
                <DayAgendaList
                  date={currentDate}
                  events={filteredEvents.filter((e) => sameDay(e.date, currentDate))}
                  onEventClick={handleEventClick}
                  onEmptyAdd={() => {
                    setSelectedDate(currentDate);
                    setSelectedTime('');
                    setShowAddModal(true);
                  }}
                  instructors={instructors}
                />
              </div>
            )}
          </div>

          {/* Mobile instructor legend */}
          {instructors.length > 0 && (
            <div className="lg:hidden bg-white rounded-3xl shadow-lg border border-iceBlue p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-marineBlue/70 mb-2">Instruktorzy</p>
              <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
                {instructors.map((instructor) => (
                  <button
                    key={instructor.id}
                    onClick={() => setFilterInstructor(filterInstructor === instructor.id ? null : instructor.id)}
                    className={`shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-full text-sm font-medium transition-all border ${
                      filterInstructor === instructor.id
                        ? `${instructor.color} text-white border-transparent shadow-md`
                        : 'border-iceBlue text-deepNavy hover:border-oceanBlue/40 bg-arcticBlue/30'
                    }`}
                  >
                    <div className={`w-2 h-2 rounded-full ${filterInstructor === instructor.id ? 'bg-white' : instructor.color}`} />
                    {instructor.name}
                  </button>
                ))}
                {filterInstructor && (
                  <button
                    onClick={() => setFilterInstructor(null)}
                    className="shrink-0 p-2 rounded-full border border-iceBlue text-marineBlue hover:bg-iceBlue/40 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Day Details Sheet */}
      {dayDetailsDate && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50" onClick={() => setDayDetailsDate(null)}>
          <div
            className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[85vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 pt-5 pb-4 border-b border-iceBlue shrink-0">
              <div className="w-10 h-1 rounded-full bg-iceBlue mx-auto mb-3 sm:hidden" />
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-xl font-bold text-deepNavy capitalize">
                  {dayDetailsDate.toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' })}
                </h3>
                <button onClick={() => setDayDetailsDate(null)} className="p-2 hover:bg-iceBlue rounded-xl transition-colors">
                  <X className="w-5 h-5 text-deepNavy" />
                </button>
              </div>
            </div>
            <div className="p-5 overflow-y-auto flex-1">
              <DayAgendaList
                date={dayDetailsDate}
                events={filteredEvents.filter((e) => sameDay(e.date, dayDetailsDate))}
                onEventClick={(event) => {
                  setDayDetailsDate(null);
                  handleEventClick(event);
                }}
                onEmptyAdd={() => {
                  setSelectedDate(dayDetailsDate);
                  setSelectedTime('');
                  setDayDetailsDate(null);
                  setShowAddModal(true);
                }}
                instructors={instructors}
              />
            </div>
            <div className="p-5 border-t border-iceBlue shrink-0">
              <button
                onClick={() => {
                  setSelectedDate(dayDetailsDate);
                  setSelectedTime('');
                  setDayDetailsDate(null);
                  setShowAddModal(true);
                }}
                className="w-full px-4 py-3.5 rounded-2xl bg-gradient-to-r from-oceanBlue to-marineBlue text-white font-semibold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all"
              >
                <Plus className="w-5 h-5" />
                Dodaj wizytę tego dnia
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Event Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-xl h-full sm:h-[min(92vh,800px)] rounded-none sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden">
            <div className="px-4 sm:px-6 pt-4 sm:pt-5 pb-4 border-b border-iceBlue shrink-0">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-serif text-xl font-bold text-deepNavy">{editingEventId ? 'Edytuj wizytę' : 'Nowa wizyta'}</h2>
                  <p className="text-xs text-marineBlue mt-0.5">Krok {addStep} z 6</p>
                </div>
                <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-iceBlue rounded-xl transition-colors">
                  <X className="w-5 h-5 text-deepNavy" />
                </button>
              </div>
              <div className="flex items-center justify-between">
                {[
                  { n: 1, label: 'Klient' },
                  { n: 2, label: 'Usługa' },
                  { n: 3, label: 'Termin' },
                  { n: 4, label: 'Instruktor' },
                  { n: 5, label: 'Miejsce' },
                  { n: 6, label: 'Koń' },
                ].map((s) => (
                  <div key={s.n} className="flex flex-col items-center gap-1.5">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                        addStep >= s.n
                          ? 'bg-gradient-to-r from-oceanBlue to-marineBlue text-white'
                          : 'bg-iceBlue text-marineBlue'
                      }`}
                    >
                      {s.n}
                    </div>
                    <span className="text-[9px] text-marineBlue hidden sm:block">{s.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-hidden relative">
              {addStep === 1 && (
                <div className="absolute inset-0 flex flex-col p-4 sm:p-6">
                  <div className="flex-1 overflow-y-auto space-y-4">
                    <h3 className="font-serif text-base sm:text-lg font-bold text-deepNavy">Wybierz klientów</h3>
                    {selectedClients.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {selectedClients.map((client, index) => (
                          <div key={index} className="flex items-center gap-2 px-3 py-1.5 bg-oceanBlue/10 text-oceanBlue rounded-full text-sm font-medium">
                            <span>{client}</span>
                            <button onClick={() => setSelectedClients(selectedClients.filter((_, i) => i !== index))} className="hover:text-oceanBlue/70">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="relative">
                      <div className="relative">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-marineBlue" />
                        <input
                          type="text"
                          placeholder="Wpisz imię i nazwisko..."
                          value={clientSearch}
                          onChange={(e) => {
                            setClientSearch(e.target.value);
                            setShowAddClientForm(false);
                          }}
                          className="w-full pl-10 pr-4 py-3 rounded-2xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                        />
                      </div>
                      {clientSearch && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-iceBlue rounded-2xl shadow-xl z-10 max-h-52 overflow-y-auto">
                          {clients
                            .filter((c) => c.name.toLowerCase().includes(clientSearch.toLowerCase()) && !selectedClients.includes(c.name))
                            .map((client) => (
                              <button
                                key={client.id}
                                onClick={() => {
                                  setSelectedClients([...selectedClients, client.name]);
                                  setClientSearch('');
                                }}
                                className="w-full px-4 py-3 text-left hover:bg-arcticBlue/50 transition-colors text-sm text-deepNavy border-b border-iceBlue/30 last:border-0"
                              >
                                {client.name}
                              </button>
                            ))}
                          {clients.filter((c) => c.name.toLowerCase().includes(clientSearch.toLowerCase()) && !selectedClients.includes(c.name)).length === 0 && (
                            <button
                              onClick={() => setShowAddClientForm(true)}
                              className="w-full px-4 py-3 text-left hover:bg-arcticBlue/50 transition-colors text-sm text-oceanBlue font-semibold"
                            >
                              + Dodaj nowego klienta
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0 flex gap-3 pt-4">
                    <button
                      onClick={() => selectedClients.length > 0 && setAddStep(2)}
                      disabled={selectedClients.length === 0}
                      className="flex-1 px-4 py-3.5 rounded-2xl bg-gradient-to-r from-oceanBlue to-marineBlue text-white disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-md hover:shadow-lg transition-all"
                    >
                      Dalej ({selectedClients.length})
                    </button>
                  </div>
                </div>
              )}

              {addStep === 2 && (
                <div className="absolute inset-0 flex flex-col p-4 sm:p-6">
                  <div className="flex-1 overflow-y-auto space-y-4">
                    <h3 className="font-serif text-base sm:text-lg font-bold text-deepNavy">Wybierz usługę</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {services.map((service) => (
                        <button
                          key={service.id}
                          onClick={() => {
                            setSelectedService(service.name);
                            setDuration(service.duration);
                            setSelectedType(service.type);
                            setAddStep(3);
                          }}
                          className={`p-4 rounded-2xl border-2 text-left transition-all ${
                            selectedService === service.name
                              ? 'bg-gradient-to-r from-oceanBlue to-marineBlue text-white border-transparent shadow-lg'
                              : 'border-iceBlue hover:border-oceanBlue text-deepNavy bg-white'
                          }`}
                        >
                          <p className="font-semibold">{service.name}</p>
                          <p className={`text-sm mt-1 ${selectedService === service.name ? 'text-white/80' : 'text-marineBlue'}`}>
                            {service.duration} min · {typeLabel(service.type)}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="shrink-0 flex gap-3 pt-4">
                    <button
                      onClick={() => setAddStep(1)}
                      className="flex-1 px-4 py-3.5 rounded-2xl border border-iceBlue text-deepNavy hover:bg-iceBlue/40 font-semibold transition-colors"
                    >
                      Wstecz
                    </button>
                    {selectedService && (
                      <button
                        onClick={() => setAddStep(3)}
                        className="flex-1 px-4 py-3.5 rounded-2xl bg-gradient-to-r from-oceanBlue to-marineBlue text-white font-semibold shadow-md hover:shadow-lg transition-all"
                      >
                        Dalej
                      </button>
                    )}
                  </div>
                </div>
              )}

              {addStep === 3 && (
                <div className="absolute inset-0 flex flex-col p-4 sm:p-6">
                  <div className="flex-1 overflow-y-auto space-y-4">
                    <h3 className="font-serif text-base sm:text-lg font-bold text-deepNavy">Termin zajęć</h3>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wide text-marineBlue mb-2">Data</label>
                      <input
                        type="date"
                        value={selectedDate ? toISODate(selectedDate) : ''}
                        onChange={(e) => setSelectedDate(new Date(e.target.value))}
                        className="w-full px-4 py-3 rounded-2xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wide text-marineBlue mb-2">Godzina rozpoczęcia</label>
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                        {hours.map((hour) => (
                          <button
                            key={hour}
                            onClick={() => setSelectedTime(`${hour}:00`)}
                            className={`p-2.5 rounded-xl border-2 transition-all text-sm font-medium ${
                              selectedTime === `${hour}:00`
                                ? 'bg-gradient-to-r from-oceanBlue to-marineBlue text-white border-transparent shadow-md'
                                : 'border-iceBlue hover:border-oceanBlue text-deepNavy'
                            }`}
                          >
                            {hour}:00
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wide text-marineBlue mb-2">Czas trwania (min)</label>
                      <input
                        type="number"
                        value={duration}
                        onChange={(e) => setDuration(parseInt(e.target.value))}
                        min={30}
                        step={15}
                        className="w-full px-4 py-3 rounded-2xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                      />
                    </div>
                  </div>
                  <div className="shrink-0 flex gap-3 pt-4">
                    <button
                      onClick={() => setAddStep(2)}
                      className="flex-1 px-4 py-3.5 rounded-2xl border border-iceBlue text-deepNavy hover:bg-iceBlue/40 font-semibold transition-colors"
                    >
                      Wstecz
                    </button>
                    <button
                      onClick={() => selectedDate && selectedTime && setAddStep(4)}
                      disabled={!selectedDate || !selectedTime}
                      className="flex-1 px-4 py-3.5 rounded-2xl bg-gradient-to-r from-oceanBlue to-marineBlue text-white disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-md hover:shadow-lg transition-all"
                    >
                      Dalej
                    </button>
                  </div>
                </div>
              )}

              {addStep === 4 && (
                <div className="absolute inset-0 flex flex-col p-4 sm:p-6">
                  <div className="flex-1 overflow-y-auto space-y-4">
                    <h3 className="font-serif text-base sm:text-lg font-bold text-deepNavy">Wybierz instruktora</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {instructors.map((instructor) => (
                        <button
                          key={instructor.id}
                          onClick={() => {
                            setSelectedInstructor(instructor.id);
                            setAddStep(5);
                          }}
                          className={`p-4 rounded-2xl border-2 text-left transition-all ${
                            selectedInstructor === instructor.id
                              ? `${instructor.color} text-white border-transparent shadow-lg`
                              : 'border-iceBlue hover:border-oceanBlue text-deepNavy bg-white'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm ${selectedInstructor === instructor.id ? 'text-white' : 'text-deepNavy'}`}>
                              {instructor.name.charAt(0)}
                            </div>
                            <span className="font-semibold">{instructor.name}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="shrink-0 flex gap-3 pt-4">
                    <button
                      onClick={() => setAddStep(3)}
                      className="flex-1 px-4 py-3.5 rounded-2xl border border-iceBlue text-deepNavy hover:bg-iceBlue/40 font-semibold transition-colors"
                    >
                      Wstecz
                    </button>
                  </div>
                </div>
              )}

              {addStep === 5 && (
                <div className="absolute inset-0 flex flex-col p-4 sm:p-6">
                  <div className="flex-1 overflow-y-auto space-y-4">
                    <h3 className="font-serif text-base sm:text-lg font-bold text-deepNavy">Wybierz lokalizację</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {locations.map((loc) => (
                        <button
                          key={loc.value}
                          onClick={() => setSelectedLocation(loc.value)}
                          className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 text-center ${
                            selectedLocation === loc.value
                              ? 'bg-gradient-to-r from-oceanBlue to-marineBlue text-white border-transparent shadow-lg'
                              : 'border-iceBlue hover:border-oceanBlue text-deepNavy bg-white'
                          }`}
                        >
                          {loc.icon}
                          <span className="text-sm font-medium">{loc.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="shrink-0 flex gap-3 pt-4">
                    <button
                      onClick={() => setAddStep(4)}
                      className="flex-1 px-4 py-3.5 rounded-2xl border border-iceBlue text-deepNavy hover:bg-iceBlue/40 font-semibold transition-colors"
                    >
                      Wstecz
                    </button>
                    <button
                      onClick={() => setAddStep(6)}
                      className="flex-1 px-4 py-3.5 rounded-2xl bg-gradient-to-r from-oceanBlue to-marineBlue text-white font-semibold shadow-md hover:shadow-lg transition-all"
                    >
                      Dalej
                    </button>
                  </div>
                </div>
              )}

              {addStep === 6 && (
                <div className="absolute inset-0 flex flex-col p-4 sm:p-6">
                  <div className="flex-1 overflow-y-auto space-y-4">
                    <h3 className="font-serif text-base sm:text-lg font-bold text-deepNavy">Wybierz konia</h3>
                    <label className="flex items-center gap-3 p-4 rounded-2xl border border-iceBlue bg-white cursor-pointer">
                      <input
                        type="checkbox"
                        checked={assignHorseLater}
                        onChange={(e) => setAssignHorseLater(e.target.checked)}
                        className="w-5 h-5 rounded-lg border-iceBlue text-oceanBlue focus:ring-oceanBlue"
                      />
                      <span className="text-sm font-medium text-deepNavy">Przydziel konia później</span>
                    </label>
                    {!assignHorseLater && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {horses.map((horse) => {
                          const selected = selectedHorses.includes(horse.id);
                          return (
                            <button
                              key={horse.id}
                              onClick={() => {
                                setSelectedHorses((prev) =>
                                  selected ? prev.filter((id) => id !== horse.id) : [...prev, horse.id]
                                );
                              }}
                              className={`p-4 rounded-2xl border-2 transition-all flex items-center gap-3 ${
                                selected
                                  ? 'bg-gradient-to-r from-oceanBlue to-marineBlue text-white border-transparent shadow-lg'
                                  : 'border-iceBlue hover:border-oceanBlue text-deepNavy bg-white'
                              }`}
                            >
                              <Maximize2 className="w-5 h-5" />
                              <span className="text-sm font-medium">{horse.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <div className="shrink-0 flex gap-3 pt-4">
                    <button
                      onClick={() => setAddStep(5)}
                      className="flex-1 px-4 py-3.5 rounded-2xl border border-iceBlue text-deepNavy hover:bg-iceBlue/40 font-semibold transition-colors"
                    >
                      Wstecz
                    </button>
                    <button
                      onClick={handleAddEventSubmit}
                      disabled={assignHorseLater ? false : selectedHorses.length === 0}
                      className="flex-1 px-4 py-3.5 rounded-2xl bg-gradient-to-r from-oceanBlue to-marineBlue text-white disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                    >
                      <Check className="w-5 h-5" />
                      Zapisz
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add client mini modal */}
      {showAddClientForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6">
            <h3 className="font-serif text-xl font-bold text-deepNavy mb-4">Dodaj nowego klienta</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-deepNavy mb-2">Imię i nazwisko</label>
                <input
                  type="text"
                  placeholder="Jan Kowalski"
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-iceBlue focus:outline-none focus:ring-2 focus:ring-oceanBlue/50 text-deepNavy"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-deepNavy mb-2">Numer telefonu</label>
                <input
                  type="tel"
                  placeholder="+48 123 456 789"
                  className="w-full px-4 py-3 rounded-2xl border border-iceBlue focus:outline-none focus:ring-2 focus:ring-oceanBlue/50 text-deepNavy"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-deepNavy mb-2">Email (opcjonalnie)</label>
                <input
                  type="email"
                  placeholder="jan.kowalski@email.com"
                  className="w-full px-4 py-3 rounded-2xl border border-iceBlue focus:outline-none focus:ring-2 focus:ring-oceanBlue/50 text-deepNavy"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowAddClientForm(false)}
                  className="flex-1 px-4 py-3 rounded-2xl border border-iceBlue text-deepNavy hover:bg-iceBlue/20 transition-colors font-semibold"
                >
                  Anuluj
                </button>
                <button
                  onClick={() => {
                    if (clientSearch) {
                      setSelectedClients([...selectedClients, clientSearch]);
                      setClientSearch('');
                      setShowAddClientForm(false);
                    }
                  }}
                  disabled={!clientSearch}
                  className="flex-1 px-4 py-3 rounded-2xl bg-gradient-to-r from-oceanBlue to-marineBlue text-white disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all font-semibold"
                >
                  Dodaj
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Event Details Modal */}
      {showEventModal && selectedEvent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-serif text-2xl font-bold text-deepNavy">Szczegóły zajęć</h2>
                <button onClick={() => setShowEventModal(false)} className="p-2 hover:bg-iceBlue rounded-xl transition-colors">
                  <X className="w-5 h-5 text-deepNavy" />
                </button>
              </div>
              <div className="space-y-5">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-r from-oceanBlue to-marineBlue flex items-center justify-center text-white">
                    <User className="w-7 h-7" />
                  </div>
                  <div>
                    <div className="font-bold text-deepNavy text-lg">{instructors.find((i) => i.id === selectedEvent.instructorId)?.name}</div>
                    <div className="text-sm text-marineBlue">{selectedEvent.title}</div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-arcticBlue/50 rounded-2xl p-4 flex items-center gap-3">
                    <Clock className="w-5 h-5 text-oceanBlue" />
                    <div>
                      <p className="text-xs text-marineBlue">Godzina</p>
                      <p className="font-semibold text-deepNavy text-sm">{selectedEvent.startTime} - {selectedEvent.endTime}</p>
                    </div>
                  </div>
                  <div className="bg-arcticBlue/50 rounded-2xl p-4 flex items-center gap-3">
                    <CalendarIcon className="w-5 h-5 text-oceanBlue" />
                    <div>
                      <p className="text-xs text-marineBlue">Data</p>
                      <p className="font-semibold text-deepNavy text-sm">{selectedEvent.date.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' })}</p>
                    </div>
                  </div>
                  <div className="bg-arcticBlue/50 rounded-2xl p-4 flex items-center gap-3">
                    <Users className="w-5 h-5 text-oceanBlue" />
                    <div>
                      <p className="text-xs text-marineBlue">Rodzaj</p>
                      <p className="font-semibold text-deepNavy text-sm">{selectedEvent.isGroup ? 'Grupowe' : 'Indywidualne'}</p>
                    </div>
                  </div>
                  <div className="bg-arcticBlue/50 rounded-2xl p-4 flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-oceanBlue" />
                    <div>
                      <p className="text-xs text-marineBlue">Miejsce</p>
                      <p className="font-semibold text-deepNavy text-sm">{locations.find((l) => l.value === selectedEvent.location)?.label}</p>
                    </div>
                  </div>
                  {selectedEvent.horseIds && selectedEvent.horseIds.length > 0 && !selectedEvent.assignHorseLater && (
                    <div className="bg-arcticBlue/50 rounded-2xl p-4 flex items-start gap-3">
                      <Maximize2 className="w-5 h-5 text-oceanBlue shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-marineBlue">Konie</p>
                        <p className="font-semibold text-deepNavy text-sm">
                          {selectedEvent.horseIds.map((id) => horses.find((h) => h.id === id)?.name).filter(Boolean).join(', ')}
                        </p>
                      </div>
                    </div>
                  )}
                  {selectedEvent.assignHorseLater && (
                    <div className="bg-arcticBlue/50 rounded-2xl p-4 flex items-center gap-3">
                      <Maximize2 className="w-5 h-5 text-marineBlue" />
                      <div>
                        <p className="text-xs text-marineBlue">Konie</p>
                        <p className="font-semibold text-deepNavy/70 text-sm">Do przydzielenia</p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="pt-2 space-y-3">
                  {!horsePickerOpen && (
                    <button
                      onClick={() => setHorsePickerOpen(true)}
                      className="w-full px-4 py-3.5 rounded-2xl border-2 border-oceanBlue text-oceanBlue font-semibold hover:bg-oceanBlue/5 transition-all"
                    >
                      {selectedEvent.horseIds && selectedEvent.horseIds.length > 0 ? 'Edytuj konia' : 'Dodaj konia'}
                    </button>
                  )}
                  {horsePickerOpen && selectedEvent && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {horses.map((horse) => {
                          const selected = selectedEvent.horseIds?.includes(horse.id) || false;
                          return (
                            <button
                              key={horse.id}
                              onClick={() => {
                                const nextIds = selected
                                  ? (selectedEvent.horseIds || []).filter((id) => id !== horse.id)
                                  : [...(selectedEvent.horseIds || []), horse.id];
                                const updated = { ...selectedEvent, horseIds: nextIds, assignHorseLater: false } as Event;
                                setEvents((prev) => prev.map((e) => (e.id === selectedEvent.id ? updated : e)));
                                setSelectedEvent(updated);
                              }}
                              className={`p-3 rounded-2xl border-2 text-left text-sm font-medium transition-all flex items-center gap-2 ${
                                selected
                                  ? 'bg-gradient-to-r from-oceanBlue to-marineBlue text-white border-transparent shadow-md'
                                  : 'border-iceBlue hover:border-oceanBlue text-deepNavy bg-white'
                              }`}
                            >
                              <Maximize2 className="w-4 h-4" />
                              {horse.name}
                            </button>
                          );
                        })}
                      </div>
                      <button
                        onClick={() => {
                          const updated = { ...selectedEvent, horseIds: [], assignHorseLater: true } as Event;
                          setEvents((prev) => prev.map((e) => (e.id === selectedEvent.id ? updated : e)));
                          setSelectedEvent(updated);
                        }}
                        className={`w-full p-3 rounded-2xl border-2 text-sm font-medium transition-all ${
                          selectedEvent.assignHorseLater
                            ? 'bg-oceanBlue text-white border-transparent'
                            : 'border-iceBlue hover:border-oceanBlue text-deepNavy bg-white'
                        }`}
                      >
                        Przydziel konie później
                      </button>
                      <button onClick={() => setHorsePickerOpen(false)} className="w-full px-4 py-3 rounded-2xl bg-iceBlue text-deepNavy font-semibold">
                        Gotowe
                      </button>
                    </div>
                  )}
                  <button
                    onClick={handleEditEvent}
                    className="w-full px-4 py-3.5 rounded-2xl bg-gradient-to-r from-oceanBlue to-marineBlue text-white font-semibold shadow-md hover:shadow-lg transition-all"
                  >
                    Edytuj zajęcia
                  </button>
                  <button
                    onClick={() => handleDeleteEvent(selectedEvent.id)}
                    className="w-full px-4 py-3.5 rounded-2xl bg-red-500 text-white font-semibold shadow-md hover:shadow-lg transition-all"
                  >
                    Usuń zajęcia
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <MobileNav user={user} />
    </div>
  );
}
