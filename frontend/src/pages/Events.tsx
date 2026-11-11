import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, MapPin, User, Clock, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import api from '../api';
import { useSite } from '../content/SiteContext';

interface EventItem {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  category: 'online' | 'onsite';
  isoDate?: string;
  description?: string;
  imageUrl?: string;
  price?: string;
  badge?: string;
  trainer?: string;
  ctaText?: string;
  ctaLink?: string;
  featured?: boolean;
  sortOrder?: number;
}

const MONTHS = ['იანვარი', 'თებერვალი', 'მარტი', 'აპრილი', 'მაისი', 'ივნისი', 'ივლისი', 'აგვისტო', 'სექტემბერი', 'ოქტომბერი', 'ნოემბერი', 'დეკემბერი'];
const WEEKDAYS = ['ორშ', 'სამ', 'ოთხ', 'ხუთ', 'პარ', 'შაბ', 'კვი'];

const parseIso = (iso?: string) => {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const [y, m, d] = iso.split('-').map(Number);
  return { y, m: m - 1, d };
};

export const Events: React.FC = () => {
  const { t, lines, go } = useSite();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  useEffect(() => {
    api.get('/events')
      .then(res => { if (Array.isArray(res.data)) setEvents(res.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Calendar starts at the month of the next upcoming dated event (or the current month)
  const firstDated = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const dated = events.filter(e => parseIso(e.isoDate)).sort((a, b) => a.isoDate!.localeCompare(b.isoDate!));
    return dated.find(e => e.isoDate! >= today) || dated[dated.length - 1];
  }, [events]);
  const [monthOffset, setMonthOffset] = useState(0);
  const base = parseIso(firstDated?.isoDate) || { y: new Date().getFullYear(), m: new Date().getMonth(), d: 1 };
  const viewDate = new Date(base.y, base.m + monthOffset, 1);
  const viewYear = viewDate.getFullYear();
  const viewMonth = viewDate.getMonth();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const leadingBlanks = (viewDate.getDay() + 6) % 7; // Monday-first grid

  const eventsByDay = useMemo(() => {
    const map: Record<number, EventItem[]> = {};
    events.forEach(e => {
      const p = parseIso(e.isoDate);
      if (p && p.y === viewYear && p.m === viewMonth) (map[p.d] ||= []).push(e);
    });
    return map;
  }, [events, viewYear, viewMonth]);

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleCta = (e: EventItem) => {
    if (e.ctaLink) go(e.ctaLink);
    else triggerToast(t('eventsRegisterToast'));
  };

  const featured = events.find(e => e.featured) || events[0];
  const rest = events.filter(e => e !== featured);
  const selectedEvents = selectedDay ? eventsByDay[selectedDay] || [] : [];
  const gallery = lines('eventsGallery');

  return (
    <div className="space-y-16 text-text-main">
      {/* Hero Section */}
      <section
        className="relative h-[480px] rounded-3xl flex items-center overflow-hidden bg-primary-container shadow-2xl border border-outline-variant/20 -mt-8 bg-cover bg-center"
        style={t('eventsHeroImage') ? { backgroundImage: `linear-gradient(rgba(15,59,46,.85), rgba(15,59,46,.85)), url(${t('eventsHeroImage')})` } : undefined}
      >
        <div className="absolute inset-0 bg-[radial-gradient(#c7a85b_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none"></div>
        <div className="relative z-10 px-8 md:px-16 max-w-container-max mx-auto w-full text-white">
          <div className="max-w-2xl space-y-6">
            {t('eventsLabel') && (
              <span className="bg-tertiary-container/20 text-tertiary-fixed-dim border border-tertiary-container/30 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
                {t('eventsLabel')}
              </span>
            )}
            <h1 className="font-display-lg text-3xl md:text-5xl mb-4 leading-tight font-bold text-tertiary-fixed-dim">{t('eventsTitle')}</h1>
            <p className="font-body-lg text-sm md:text-base text-primary-fixed-dim opacity-90 max-w-xl leading-relaxed">{t('eventsSubtitle')}</p>
          </div>
        </div>
      </section>

      {/* Upcoming Events */}
      <section className="max-w-container-max mx-auto space-y-8">
        <div>
          <span className="text-tertiary font-label-md text-xs tracking-widest uppercase block mb-1">{t('eventsUpcomingLabel')}</span>
          <h2 className="font-headline-lg text-2xl md:text-3xl text-primary font-bold">{t('eventsUpcomingTitle')}</h2>
        </div>

        {loading ? (
          <div className="py-16 text-center text-text-muted text-sm">იტვირთება...</div>
        ) : events.length === 0 ? (
          <div className="py-16 text-center text-text-muted text-sm">{t('eventsEmptyText')}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {featured && (
              <div className="md:col-span-8 group relative overflow-hidden rounded-2xl bg-surface-container-low shadow-lg border border-outline-variant/20 hover:shadow-2xl transition-all duration-500">
                <div className="flex flex-col md:flex-row h-full">
                  {featured.imageUrl && (
                    <div className="md:w-1/2 h-64 md:h-auto overflow-hidden relative">
                      <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={featured.title} src={featured.imageUrl} />
                    </div>
                  )}
                  <div className={`${featured.imageUrl ? 'md:w-1/2' : 'w-full'} p-8 flex flex-col justify-between space-y-6`}>
                    <div className="space-y-4">
                      <div className="flex justify-between items-start gap-3">
                        {featured.badge && (
                          <span className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">{featured.badge}</span>
                        )}
                        {featured.price && <span className="text-tertiary font-headline-md text-xl font-bold">{featured.price}</span>}
                      </div>
                      <h3 className="font-headline-lg text-xl font-bold text-primary leading-snug group-hover:text-tertiary transition-colors">{featured.title}</h3>
                      {featured.description && <p className="text-text-muted text-xs leading-relaxed">{featured.description}</p>}
                      <div className="space-y-2.5 text-text-muted text-xs">
                        {featured.date && <div className="flex items-center gap-2"><Calendar size={14} className="text-tertiary" /><span>{featured.date}{featured.time ? ` · ${featured.time}` : ''}</span></div>}
                        {featured.trainer && <div className="flex items-center gap-2"><User size={14} className="text-tertiary" /><span>{t('eventsTrainerLabel')}: {featured.trainer}</span></div>}
                        {featured.location && <div className="flex items-center gap-2"><MapPin size={14} className="text-tertiary" /><span>{featured.location}</span></div>}
                      </div>
                    </div>
                    <button
                      onClick={() => handleCta(featured)}
                      className="bg-primary text-on-primary w-full py-3.5 rounded-xl font-label-md text-xs font-bold hover:shadow-lg transition-all cursor-pointer"
                    >
                      {featured.ctaText || t('eventsDefaultCta')}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {rest.map(ev => ev.imageUrl ? (
              <div key={ev.id} className="md:col-span-4 bg-surface-card p-6 rounded-2xl shadow-sm border border-outline-variant/20 hover:border-tertiary transition-colors group space-y-4 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="h-44 rounded-xl overflow-hidden">
                    <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={ev.title} src={ev.imageUrl} />
                  </div>
                  <div>
                    {ev.badge && <span className="text-[10px] font-bold text-tertiary uppercase tracking-widest">{ev.badge}</span>}
                    <h4 className="font-headline-md text-base font-bold text-primary mt-1">{ev.title}</h4>
                    {ev.description && <p className="text-text-muted text-xs leading-relaxed mt-2">{ev.description}</p>}
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs pt-2 border-t border-outline-variant/10">
                    <span className="text-primary font-bold">{ev.price}</span>
                    <span className="text-text-muted italic">{ev.date}</span>
                  </div>
                  {ev.ctaText && (
                    <button onClick={() => handleCta(ev)} className="w-full border border-primary/50 text-primary py-2 rounded-xl text-xs font-bold hover:bg-primary hover:text-on-primary transition-all cursor-pointer">
                      {ev.ctaText}
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div key={ev.id} className="md:col-span-4 bg-surface-muted p-8 rounded-2xl flex flex-col justify-between border border-outline-variant/30 space-y-6 shadow-md">
                <div className="space-y-4">
                  {ev.badge && <div className="text-tertiary font-headline-md text-xs font-bold uppercase tracking-widest">{ev.badge}</div>}
                  <h4 className="font-headline-md text-lg font-bold text-primary">{ev.title}</h4>
                  {ev.description && <p className="text-text-muted text-xs leading-relaxed">{ev.description}</p>}
                  <div className="space-y-2 pt-2 text-xs">
                    {ev.date && <div className="flex justify-between border-b border-outline-variant/20 pb-1.5"><span className="text-text-muted">თარიღი:</span><span className="text-primary font-bold">{ev.date}{ev.time ? ` · ${ev.time}` : ''}</span></div>}
                    {ev.location && <div className="flex justify-between border-b border-outline-variant/20 pb-1.5"><span className="text-text-muted">ადგილი:</span><span className="text-primary font-bold text-right">{ev.location}</span></div>}
                    {ev.price && <div className="flex justify-between"><span className="text-text-muted">ფასი:</span><span className="text-tertiary font-bold">{ev.price}</span></div>}
                  </div>
                </div>
                <button
                  onClick={() => handleCta(ev)}
                  className="border-2 border-primary text-primary w-full py-3 rounded-xl font-label-md text-xs font-bold hover:bg-primary hover:text-on-primary transition-all cursor-pointer"
                >
                  {ev.ctaText || t('eventsDefaultCta')}
                </button>
              </div>
            ))}

            {t('eventsStatValue') && (
              <div className="md:col-span-4 bg-primary text-on-primary p-8 rounded-2xl flex flex-col justify-center items-center text-center space-y-4 shadow-lg">
                <User size={36} className="text-tertiary-fixed mb-2" />
                <div className="text-4xl font-headline-lg font-bold text-tertiary-fixed">{t('eventsStatValue')}</div>
                <p className="font-body-md text-xs opacity-80 max-w-xs">{t('eventsStatLabel')}</p>
                <div className="h-px w-16 bg-tertiary-fixed/40"></div>
                {t('eventsStatLinkText') && (
                  <button onClick={() => go(t('eventsStatLink'))} className="text-tertiary-fixed font-label-md text-xs hover:underline cursor-pointer font-bold pt-2">
                    {t('eventsStatLinkText')}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Calendar */}
      <section className="bg-surface-container-low py-16 rounded-3xl border border-outline-variant/20 p-8 md:p-12">
        <div className="max-w-container-max mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-4 space-y-6">
            <h2 className="font-headline-lg text-2xl md:text-3xl text-primary font-bold">{t('eventsCalendarTitle')}</h2>
            <p className="text-text-muted text-sm leading-relaxed">{t('eventsCalendarText')}</p>

            <div className="space-y-3 pt-2">
              {(selectedDay ? selectedEvents : Object.values(eventsByDay).flat()).map(ev => {
                const p = parseIso(ev.isoDate)!;
                return (
                  <div key={ev.id} className="flex items-start gap-4 p-4 rounded-xl bg-surface-card border-l-4 border-tertiary shadow-sm">
                    <div className="bg-primary text-[#00241a] p-3 rounded-lg text-center min-w-[60px]">
                      <div className="text-[10px] uppercase font-bold tracking-wider">{MONTHS[p.m].slice(0, 3)}</div>
                      <div className="text-xl font-bold leading-none">{String(p.d).padStart(2, '0')}</div>
                    </div>
                    <div>
                      <h5 className="font-bold text-primary text-sm">{ev.title}</h5>
                      <p className="text-xs text-text-muted mt-1 flex items-center gap-1">
                        {ev.time && <><Clock size={11} /> {ev.time} · </>}{ev.location}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-8 bg-surface-card rounded-2xl shadow-xl p-6 md:p-8 border border-outline-variant/20">
            <div className="flex justify-between items-center mb-6">
              <button onClick={() => { setMonthOffset(o => o - 1); setSelectedDay(null); }} className="p-2.5 rounded-full border border-outline-variant/40 hover:bg-surface-container transition-colors cursor-pointer"><ChevronLeft size={18} /></button>
              <h3 className="font-bold text-primary">{MONTHS[viewMonth]} {viewYear}</h3>
              <button onClick={() => { setMonthOffset(o => o + 1); setSelectedDay(null); }} className="p-2.5 rounded-full border border-outline-variant/40 hover:bg-surface-container transition-colors cursor-pointer"><ChevronRight size={18} /></button>
            </div>
            <div className="grid grid-cols-7 gap-2 text-center mb-4 text-xs font-bold text-text-muted">
              {WEEKDAYS.map((d, i) => <div key={d} className={i >= 5 ? 'text-tertiary' : ''}>{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: leadingBlanks }, (_, i) => <div key={`b${i}`} />)}
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                const dayEvents = eventsByDay[day] || [];
                const isSelected = selectedDay === day;
                return (
                  <div
                    key={day}
                    onClick={() => setSelectedDay(isSelected ? null : day)}
                    className={`h-16 md:h-20 border rounded-xl p-2 flex flex-col justify-between transition-all cursor-pointer text-xs font-semibold ${
                      isSelected
                        ? 'border-tertiary bg-tertiary-container/20 ring-2 ring-tertiary/40'
                        : dayEvents.length
                          ? 'bg-primary/10 border-primary/40'
                          : 'border-outline-variant/20 hover:bg-surface-container-high'
                    }`}
                  >
                    <span className="text-on-surface">{day}</span>
                    {dayEvents.map(ev => <div key={ev.id} className="w-full h-1.5 bg-tertiary rounded-full" title={ev.title} />)}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Past Events Gallery */}
      {gallery.length > 0 && (
        <section className="max-w-container-max mx-auto space-y-8">
          <div className="text-center space-y-3">
            <h2 className="font-headline-lg text-2xl md:text-3xl text-primary font-bold">{t('eventsPastTitle')}</h2>
            <div className="h-1 w-20 bg-tertiary mx-auto rounded-full"></div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {gallery.map((imgUrl, idx) => (
              <a key={idx} href={imgUrl} target="_blank" rel="noopener noreferrer" className="relative group h-64 overflow-hidden rounded-2xl shadow-md cursor-pointer block">
                <img className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="" src={imgUrl} />
                <div className="absolute inset-0 bg-primary/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <span className="text-white font-label-md text-xs border border-white/50 px-4 py-2 rounded-full font-bold">ნახვა</span>
                </div>
              </a>
            ))}
          </div>
        </section>
      )}

      {toastMsg && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-primary text-[#00241a] px-6 py-3 rounded-full shadow-2xl flex items-center gap-2 text-xs font-bold z-50">
          <CheckCircle2 size={16} />
          <span>{toastMsg}</span>
        </div>
      )}
    </div>
  );
};
