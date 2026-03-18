// src/pages/CalendarPage.tsx
import React, { useState, useEffect } from 'react';
import { pushNotification } from '../context/ChatContext';

type EventColor = 'blue' | 'green' | 'orange' | 'red' | 'purple' | 'pink';

interface CalendarEvent {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  title: string;
  note: string;
  color: EventColor;
}

const COLOR_MAP: Record<EventColor, { bg: string; border: string; text: string; label: string }> = {
  blue:   { bg: 'rgba(52,152,219,0.12)',  border: '#3498db', text: '#3498db',  label: 'Синий'   },
  green:  { bg: 'rgba(46,204,113,0.12)',  border: '#2ecc71', text: '#2ecc71',  label: 'Зелёный' },
  orange: { bg: 'rgba(243,156,18,0.12)',  border: '#f39c12', text: '#f39c12',  label: 'Жёлтый'  },
  red:    { bg: 'rgba(231,76,60,0.12)',   border: '#e74c3c', text: '#e74c3c',  label: 'Красный' },
  purple: { bg: 'rgba(102,126,234,0.12)', border: '#667eea', text: '#667eea',  label: 'Фиолет.' },
  pink:   { bg: 'rgba(236,72,153,0.12)',  border: '#ec4899', text: '#ec4899',  label: 'Розовый' },
};

const MONTHS_RU = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
const DAYS_RU   = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];

function toKey(y: number, m: number, d: number) {
  return `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
}
function todayKey() {
  const n = new Date();
  return toKey(n.getFullYear(), n.getMonth(), n.getDate());
}
function loadEvents(): CalendarEvent[] {
  try { return JSON.parse(localStorage.getItem('corp_calendar') || '[]'); } catch { return []; }
}
function saveEvents(evs: CalendarEvent[]) {
  try { localStorage.setItem('corp_calendar', JSON.stringify(evs)); } catch {}
}

const CalendarPage: React.FC = () => {
  const now = new Date();
  const [year,  setYear]  = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [events, setEvents] = useState<CalendarEvent[]>(() => loadEvents());
  const [selectedDate, setSelectedDate] = useState<string>(todayKey());
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

  useEffect(() => { saveEvents(events); }, [events]);

  // строим сетку дней
  const firstDay = new Date(year, month, 1).getDay(); // 0=вс
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const offset = (firstDay + 6) % 7; // пн=0
  const cells: (number | null)[] = [
    ...Array(offset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1)
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const prevMonth = () => { if (month === 0) { setYear(y => y-1); setMonth(11); } else setMonth(m => m-1); };
  const nextMonth = () => { if (month === 11) { setYear(y => y+1); setMonth(0); } else setMonth(m => m+1); };

  const eventsForDate = (key: string) => events.filter(e => e.date === key).sort((a,b) => a.time.localeCompare(b.time));
  const selectedEvents = eventsForDate(selectedDate);

  const deleteEvent = (id: string) => setEvents(prev => prev.filter(e => e.id !== id));

  const openAdd = () => { setEditingEvent(null); setShowModal(true); };
  const openEdit = (ev: CalendarEvent) => { setEditingEvent(ev); setShowModal(true); };

  const selectedDateLabel = (() => {
    const [y,m,d] = selectedDate.split('-').map(Number);
    return `${d} ${MONTHS_RU[m-1]} ${y}`;
  })();

  return (
    <div style={{ minHeight: 'calc(100vh - 70px)', background: 'var(--bg-secondary)', padding: '28px 0' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px', display: 'grid', gridTemplateColumns: '1fr 360px', gap: '24px', alignItems: 'start' }}>

        {/* ── ЛЕВАЯ КОЛОНКА: КАЛЕНДАРЬ ── */}
        <div style={{ background: 'var(--bg-primary)', borderRadius: '20px', border: '1px solid var(--border-color)', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>

          {/* Шапка */}
          <div style={{ padding: '20px 24px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <button onClick={prevMonth} style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(255,255,255,0.2)', border: 'none', cursor: 'pointer', color: 'white', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
            >‹</button>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: '800', color: 'white', letterSpacing: '-0.3px' }}>{MONTHS_RU[month]}</div>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)', marginTop: '2px' }}>{year}</div>
            </div>
            <button onClick={nextMonth} style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(255,255,255,0.2)', border: 'none', cursor: 'pointer', color: 'white', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
            >›</button>
          </div>

          {/* Дни недели */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', padding: '12px 16px 4px' }}>
            {DAYS_RU.map(d => (
              <div key={d} style={{ textAlign: 'center', fontSize: '12px', fontWeight: '700', color: d === 'Сб' || d === 'Вс' ? '#ec4899' : 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px', padding: '4px 0' }}>{d}</div>
            ))}
          </div>

          {/* Ячейки дней */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', padding: '4px 16px 20px' }}>
            {cells.map((day, i) => {
              if (!day) return <div key={i} />;
              const key = toKey(year, month, day);
              const isToday = key === todayKey();
              const isSelected = key === selectedDate;
              const dayEvents = eventsForDate(key);
              const isWeekend = (i % 7) >= 5;
              return (
                <div key={i} onClick={() => setSelectedDate(key)}
                  style={{
                    borderRadius: '12px', padding: '8px 4px', cursor: 'pointer', textAlign: 'center', minHeight: '60px',
                    background: isSelected ? 'linear-gradient(135deg, #667eea, #764ba2)' : isToday ? 'rgba(102,126,234,0.1)' : 'transparent',
                    border: isToday && !isSelected ? '2px solid #667eea' : '2px solid transparent',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'var(--bg-secondary)'; }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = isToday ? 'rgba(102,126,234,0.1)' : 'transparent'; }}
                >
                  <div style={{ fontSize: '14px', fontWeight: isToday || isSelected ? '800' : '500', color: isSelected ? 'white' : isWeekend ? '#ec4899' : 'var(--text-primary)', marginBottom: '4px' }}>{day}</div>
                  {/* Точки событий */}
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '3px', flexWrap: 'wrap' }}>
                    {dayEvents.slice(0, 3).map(ev => (
                      <div key={ev.id} style={{ width: '6px', height: '6px', borderRadius: '50%', background: isSelected ? 'rgba(255,255,255,0.8)' : COLOR_MAP[ev.color].border }} />
                    ))}
                    {dayEvents.length > 3 && <div style={{ fontSize: '9px', color: isSelected ? 'rgba(255,255,255,0.7)' : 'var(--text-tertiary)', lineHeight: '6px' }}>+{dayEvents.length-3}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── ПРАВАЯ КОЛОНКА: СОБЫТИЯ ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Заголовок дня */}
          <div style={{ background: 'var(--bg-primary)', borderRadius: '16px', border: '1px solid var(--border-color)', padding: '18px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)' }}>{selectedDateLabel}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  {selectedEvents.length > 0 ? `${selectedEvents.length} ${selectedEvents.length === 1 ? 'событие' : selectedEvents.length < 5 ? 'события' : 'событий'}` : 'Нет событий'}
                </div>
              </div>
              <button onClick={openAdd} style={{ padding: '9px 18px', background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 3px 10px rgba(102,126,234,0.35)', transition: 'all 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
              >+ Добавить</button>
            </div>
          </div>

          {/* Список событий */}
          {selectedEvents.length === 0 ? (
            <div style={{ background: 'var(--bg-primary)', borderRadius: '16px', border: '1px solid var(--border-color)', padding: '40px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>📅</div>
              <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>Нет событий</div>
              <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Нажмите «+ Добавить» чтобы создать</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {selectedEvents.map(ev => {
                const c = COLOR_MAP[ev.color];
                return (
                  <div key={ev.id} style={{ background: 'var(--bg-primary)', borderRadius: '14px', border: '1px solid var(--border-color)', borderLeft: `4px solid ${c.border}`, padding: '14px 16px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', transition: 'all 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.09)'}
                    onMouseLeave={e => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)'}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span style={{ fontSize: '13px', fontWeight: '800', color: c.text }}>{ev.time}</span>
                          <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>{ev.title}</span>
                        </div>
                        {ev.note && <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5', paddingLeft: '2px' }}>{ev.note}</div>}
                      </div>
                      <div style={{ display: 'flex', gap: '4px', marginLeft: '8px', flexShrink: 0 }}>
                        <button onClick={() => openEdit(ev)} style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'var(--bg-secondary)', border: 'none', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.15s' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(102,126,234,0.12)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
                          title="Редактировать"
                        >✏️</button>
                        <button onClick={() => deleteEvent(ev.id)} style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'var(--bg-secondary)', border: 'none', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.15s' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(231,76,60,0.12)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
                          title="Удалить"
                        >🗑</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Ближайшие события (следующие 7 дней) */}
          <UpcomingEvents events={events} />
        </div>
      </div>

      {showModal && (
        <EventModal
          date={selectedDate}
          event={editingEvent}
          onClose={() => setShowModal(false)}
          onSave={(ev) => {
            if (editingEvent) {
              setEvents(prev => prev.map(e => e.id === ev.id ? ev : e));
            } else {
              setEvents(prev => [...prev, ev]);
              const [y,m,d] = ev.date.split('-').map(Number);
              pushNotification(
                `📅 Новое событие: «${ev.title}»`,
                `${d} ${MONTHS_RU[m-1]} в ${ev.time}`,
                'calendar'
              );
            }
            setShowModal(false);
          }}
        />
      )}
    </div>
  );
};

// ── Ближайшие события ──────────────────────────────────────────
const UpcomingEvents: React.FC<{ events: CalendarEvent[] }> = ({ events }) => {
  const upcoming = events
    .filter(e => e.date >= todayKey())
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
    .slice(0, 5);

  if (upcoming.length === 0) return null;

  return (
    <div style={{ background: 'var(--bg-primary)', borderRadius: '16px', border: '1px solid var(--border-color)', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
      <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '12px' }}>
        Ближайшие события
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {upcoming.map(ev => {
          const c = COLOR_MAP[ev.color];
          const [y,m,d] = ev.date.split('-').map(Number);
          const label = ev.date === todayKey() ? 'Сегодня' : `${d} ${MONTHS_RU[m-1]}`;
          return (
            <div key={ev.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', borderRadius: '10px', background: 'var(--bg-secondary)' }}>
              <div style={{ width: '3px', height: '36px', borderRadius: '2px', background: c.border, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.title}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{label} · {ev.time}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ── Модал добавления/редактирования ───────────────────────────
const EventModal: React.FC<{
  date: string;
  event: CalendarEvent | null;
  onClose: () => void;
  onSave: (ev: CalendarEvent) => void;
}> = ({ date, event, onClose, onSave }) => {
  const [title, setTitle] = useState(event?.title || '');
  const [time,  setTime]  = useState(event?.time  || '09:00');
  const [note,  setNote]  = useState(event?.note  || '');
  const [color, setColor] = useState<EventColor>(event?.color || 'blue');
  const [err, setErr] = useState('');

  const handleSave = () => {
    if (!title.trim()) { setErr('Введите название'); return; }
    onSave({
      id: event?.id || Date.now().toString(),
      date: event?.date || date,
      title: title.trim(),
      time, note: note.trim(), color,
    });
  };

  const fieldStyle: React.CSSProperties = {
    width: '100%', padding: '10px 13px', border: '1.5px solid var(--border-color)', borderRadius: '10px',
    fontSize: '14px', background: 'var(--bg-secondary)', color: 'var(--text-primary)',
    outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', transition: 'border-color 0.2s'
  };

  const [y,m,d] = (event?.date || date).split('-').map(Number);
  const dateLabel = `${d} ${MONTHS_RU[m-1]} ${y}`;

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, backdropFilter: 'blur(6px)' }} />
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: 'var(--bg-primary)', borderRadius: '20px', zIndex: 1001, width: '92%', maxWidth: '460px', boxShadow: '0 24px 64px rgba(0,0,0,0.25)', border: '1px solid var(--border-color)' }}>
        {/* Шапка */}
        <div style={{ padding: '18px 22px', background: 'linear-gradient(135deg, #667eea, #764ba2)', borderRadius: '20px 20px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '16px', fontWeight: '800', color: 'white' }}>{event ? '✏️ Редактировать' : '📅 Новое событие'}</div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.75)', marginTop: '2px' }}>{dateLabel}</div>
          </div>
          <button onClick={onClose} style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'rgba(255,255,255,0.2)', border: 'none', cursor: 'pointer', color: 'white', fontSize: '14px' }}>✕</button>
        </div>

        <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Название */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '6px' }}>Название *</div>
            <input value={title} onChange={e => { setTitle(e.target.value); setErr(''); }} placeholder="Название события..."
              style={{ ...fieldStyle, borderColor: err ? '#ef4444' : 'var(--border-color)' }}
              onFocus={e => e.currentTarget.style.borderColor = '#667eea'}
              onBlur={e => e.currentTarget.style.borderColor = err ? '#ef4444' : 'var(--border-color)'}
            />
            {err && <div style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px' }}>⚠ {err}</div>}
          </div>

          {/* Время */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '6px' }}>Время</div>
            <input type="time" value={time} onChange={e => setTime(e.target.value)} style={fieldStyle}
              onFocus={e => e.currentTarget.style.borderColor = '#667eea'}
              onBlur={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
            />
          </div>

          {/* Заметка */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '6px' }}>Заметка</div>
            <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Дополнительные заметки..."
              style={{ ...fieldStyle, minHeight: '80px', resize: 'vertical' }}
              onFocus={e => e.currentTarget.style.borderColor = '#667eea'}
              onBlur={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
            />
          </div>

          {/* Цвет */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '8px' }}>Цвет метки</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {(Object.entries(COLOR_MAP) as [EventColor, typeof COLOR_MAP[EventColor]][]).map(([key, c]) => (
                <button key={key} onClick={() => setColor(key)} title={c.label} style={{ width: '32px', height: '32px', borderRadius: '50%', background: c.border, border: color === key ? '3px solid var(--text-primary)' : '3px solid transparent', cursor: 'pointer', transition: 'all 0.15s', boxShadow: color === key ? '0 0 0 2px var(--bg-primary), 0 0 0 4px ' + c.border : 'none' }} />
              ))}
            </div>
          </div>

          {/* Кнопки */}
          <div style={{ display: 'flex', gap: '10px', paddingTop: '4px' }}>
            <button onClick={onClose} style={{ flex: 1, padding: '11px', border: '1.5px solid var(--border-color)', borderRadius: '10px', background: 'transparent', color: 'var(--text-secondary)', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>Отмена</button>
            <button onClick={handleSave} style={{ flex: 2, padding: '11px', border: 'none', borderRadius: '10px', background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', fontSize: '14px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 12px rgba(102,126,234,0.35)' }}>
              {event ? '💾 Сохранить' : '✅ Создать событие'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default CalendarPage;
