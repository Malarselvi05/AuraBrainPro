'use client';

import { useState, useEffect, useRef, use } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, X, Clock, Play, Pause, RotateCcw, ArrowLeft,
  History, Timer, CheckCircle2, Loader2, Check,
  Target, Trophy, Coffee, Coins, Flame, BookOpen,
  Construction, RotateCw, ChevronRight, Sparkles
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface SubTask { id: string; title: string; status: 'todo' | 'in_progress' | 'completed'; timeSpentSeconds: number; createdAt: string; }
interface Task { id: string; title: string; description?: string; status: 'todo' | 'in_progress' | 'completed'; timeSpentSeconds: number; createdAt: string; storyId?: string | null; story?: any; subtasks?: SubTask[]; auraPoints?: number; }
interface GlobalQuote { id: string; text: string; author?: string; }

const SPARKS = [
  "Your future self is being built right now. Stay.",
  "Distraction is the enemy of mastery. Lock in.",
  "Every minute here compounds into expertise.",
  "The best time to start was yesterday. The second best is now.",
  "Done is better than perfect. Keep moving."
];

export default function DeepWorkPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  
  const [task, setTask]     = useState<Task | null>(null);
  const [auraPoints, setAuraPoints] = useState(0);
  const [mode, setMode]     = useState<'timer' | 'stopwatch'>('timer');
  const [timeLeft, setTimeLeft]     = useState(25 * 60);
  const [stopwatchTime, setStopwatchTime] = useState(0);
  const [isActive, setIsActive]     = useState(false);
  const [inputMinutes, setInputMinutes]   = useState('25');
  const [sessionType, setSessionType]     = useState<'focus' | 'break'>('focus');
  const [breakTimeLeft, setBreakTimeLeft] = useState(5 * 60);
  const [totalSecondsWorked, setTotalSecondsWorked]   = useState(0);
  const [lastAutoSaveSeconds, setLastAutoSaveSeconds] = useState(0);
  const [isSyncing, setIsSyncing]   = useState(false);
  const [justSynced, setJustSynced] = useState(false);
  const [showReward, setShowReward] = useState(false);
  const [selectedSubTaskId, setSelectedSubTaskId] = useState<string | null>(null);
  const [currentSpark, setCurrentSpark] = useState(SPARKS[0]);

  const timerRef  = useRef<NodeJS.Timeout | null>(null);
  const taskRef   = useRef<Task | null>(null);

  useEffect(() => { fetchData(); }, [id]);

  const fetchData = async () => {
    try {
      const res  = await fetch(`/api/tasks?v=${Date.now()}`);
      const data = await res.json();
      setAuraPoints(data.auraPoints || 0);
      const target = (data.tasks || []).find((t: Task) => t.id === id);
      if (target) {
        if (!target.subtasks) target.subtasks = [];
        setTask(target);
        taskRef.current = target;
        setCurrentSpark(target.story?.content || data.quotes?.[0]?.text || SPARKS[Math.floor(Math.random() * SPARKS.length)]);
      }
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => {
        if (sessionType === 'focus') {
          if (mode === 'timer') {
            if (timeLeft <= 1) { handleSessionComplete(); }
            else { setTimeLeft(p => p - 1); }
          } else { setStopwatchTime(p => p + 1); }
          setTotalSecondsWorked(p => p + 1);
        } else {
          if (breakTimeLeft <= 1) { setSessionType('focus'); setIsActive(false); setBreakTimeLeft(5 * 60); }
          else { setBreakTimeLeft(p => p - 1); }
        }
      }, 1000);
    } else { if (timerRef.current) clearInterval(timerRef.current); }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isActive, sessionType, mode, timeLeft, breakTimeLeft]);

  const handleSessionComplete = () => {
    setIsActive(false); setSessionType('break');
    setAuraPoints(p => p + 10); setShowReward(true);
    setTimeout(() => setShowReward(false), 3000);
    performSave(); setTimeout(() => setIsActive(true), 1000);
  };

  const performSave = async (isExit = false) => {
    if (!taskRef.current) return;
    setIsSyncing(true);
    try {
      const unsaved   = totalSecondsWorked - lastAutoSaveSeconds;
      const newTotal  = (taskRef.current.timeSpentSeconds || 0) + unsaved;
      let updatedSubs = [...(taskRef.current.subtasks || [])];
      if (selectedSubTaskId) {
        updatedSubs = updatedSubs.map(st => st.id === selectedSubTaskId ? { ...st, timeSpentSeconds: st.timeSpentSeconds + unsaved } : st);
      }
      await fetch('/api/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: taskRef.current.id, timeSpentSeconds: newTotal, auraPoints, subtasks: updatedSubs, isSyncOnly: true }) });
      setLastAutoSaveSeconds(totalSecondsWorked);
      taskRef.current = { ...taskRef.current, timeSpentSeconds: newTotal, subtasks: updatedSubs };
      setTask(taskRef.current);
      setJustSynced(true); setTimeout(() => setJustSynced(false), 2000);
    } catch (e) {} finally { setIsSyncing(false); }
  };

  const toggleSubTaskDone = async (stId: string) => {
    if (!taskRef.current) return;
    const current = (taskRef.current.subtasks || []).find(st => st.id === stId);
    if (!current) return;
    const newStatus = current.status === 'completed' ? 'todo' : 'completed';
    const updated = (taskRef.current.subtasks || []).map(st =>
      st.id === stId ? { ...st, status: newStatus as 'todo' | 'completed' } : st
    );
    taskRef.current = { ...taskRef.current, subtasks: updated };
    setTask({ ...taskRef.current });
    // +20 pts on complete, -20 on undo
    setAuraPoints(p => newStatus === 'completed' ? p + 20 : Math.max(0, p - 20));
    await fetch('/api/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: taskRef.current.id, subtasks: updated, isSyncOnly: true }) });
  };

  const fmt = (s: number) => {
    const m = Math.floor(s / 60), sec = s % 60;
    return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
  };

  const fmtTotal = (s: number) => {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const completedCount = (task?.subtasks || []).filter(s => s.status === 'completed').length;
  const totalCount     = (task?.subtasks || []).length;
  const progressPct    = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const isBreak        = sessionType === 'break';
  const displayTime    = isBreak ? fmt(breakTimeLeft) : (mode === 'timer' ? fmt(timeLeft) : fmt(stopwatchTime));

  const getDayIcon = (title: string) => {
    if (title.includes('🏗️') || title.includes('PROJECT')) return <Construction size={14} color="var(--accent)" />;
    if (title.includes('✅') || title.includes('REVISION')) return <RotateCw size={14} color="#3b82f6" />;
    return <BookOpen size={14} color="rgba(255,255,255,0.4)" />;
  };

  const parseVaultTitle = (title: string) => {
    const secs    = title.split('\n').map(s => s.trim()).filter(Boolean);
    const header  = secs[0] || title;
    const topics  = secs.find(s => s.startsWith('📚'))?.replace(/^📚\s*/, '') || '';
    const project = secs.find(s => s.startsWith('🏗️'))?.replace(/^🏗️\s*/, '') || '';
    const outcome = secs.find(s => s.startsWith('✅'))?.replace(/^✅\s*/, '') || '';
    // Also handle inline format
    let proj = project;
    if (!proj) { const m = title.match(/Project Milestone[:\s]+([^·✅\n]+)/i); if (m) proj = m[1].trim(); }
    return { header, topics: topics.split(/[·•]/).map(t => t.trim()).filter(Boolean), project: proj, outcome };
  };

  if (!task) return <div className="app-container flex-center" style={{ height: '100vh' }}><Loader2 className="animate-spin" size={40} color="var(--accent)" /></div>;

  return (
    <div className="app-container" style={{ minHeight: '100vh', padding: '2rem 4%' }}>
      <div className="bg-glow glow-1" style={{ opacity: isBreak ? 0.15 : 0.8 }} />

      {/* Reward Toast */}
      <AnimatePresence>
        {showReward && (
          <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
            style={{ position: 'fixed', bottom: '2rem', left: '50%', transform: 'translateX(-50%)', zIndex: 10000, background: 'var(--accent)', padding: '1rem 2.5rem', borderRadius: '100px', display: 'flex', alignItems: 'center', gap: '12px', whiteSpace: 'nowrap' }}>
            <Coins size={22} /> <span style={{ fontWeight: 800 }}>+10 Aura Points Earned</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── TOP BAR ─────────────────────────────────────── */}
      <div className="flex-between" style={{ marginBottom: '2rem' }}>
        <button onClick={() => performSave(true).then(() => router.push('/'))} className="btn-glass flex-row gap-2" style={{ fontSize: '0.8rem' }}>
          <ArrowLeft size={16} /> Save & Exit
        </button>
        <div className="flex-row gap-3">
          <div className="badge flex-row gap-2" style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.4)' }}>
            <Coins size={14} color="var(--accent)" /><span style={{ fontWeight: 800, fontSize: '0.8rem' }}>{auraPoints} pts</span>
          </div>
          <div className="badge flex-row gap-2" style={{ fontSize: '0.8rem' }}>
            <History size={14} /><span style={{ fontWeight: 700 }}>{fmtTotal(task.timeSpentSeconds)}</span>
          </div>
          {justSynced && <div className="badge flex-row gap-2" style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', fontSize: '0.75rem' }}><Check size={12} color="#10b981" />Saved</div>}
        </div>
      </div>

      {/* ── MISSION TITLE + META ────────────────────────── */}
      <div style={{ marginBottom: '2rem' }}>
        <div className="flex-row gap-2" style={{ color: isBreak ? '#10b981' : 'var(--accent)', fontWeight: 800, fontSize: '0.65rem', marginBottom: '0.4rem', letterSpacing: '0.1rem' }}>
          {isBreak ? <Coffee size={12} /> : <Flame size={12} />}
          {isBreak ? 'RECOVERY BREAK ACTIVE' : 'DEEP FOCUS ACTIVE'}
        </div>
        <h1 className="outfit" style={{ fontSize: '2.2rem', fontWeight: 900, lineHeight: 1.1 }}>{task.title}</h1>
        {totalCount > 0 && (
          <div className="flex-row gap-3" style={{ marginTop: '0.8rem', alignItems: 'center' }}>
            <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '10px', overflow: 'hidden', maxWidth: '300px' }}>
              <motion.div animate={{ width: `${progressPct}%` }} style={{ height: '100%', background: 'linear-gradient(90deg, var(--accent), #10b981)', borderRadius: '10px' }} />
            </div>
            <span style={{ fontSize: '0.75rem', opacity: 0.5, fontWeight: 700 }}>{completedCount}/{totalCount} days done · {progressPct}%</span>
          </div>
        )}
      </div>

      {/* ── MAIN GRID ───────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '2rem', alignItems: 'start' }}>

        {/* LEFT: Day Vault List */}
        <div className="glass-panel" style={{ padding: '1.5rem', maxHeight: 'calc(100vh - 260px)', overflowY: 'auto' }}>
          <div className="flex-between" style={{ marginBottom: '1.2rem' }}>
            <h3 className="outfit" style={{ fontSize: '1rem', fontWeight: 800, opacity: 0.9 }}>
              <Target size={16} color="var(--accent)" style={{ display: 'inline', marginRight: '8px' }} />
              Chrono-Vault
            </h3>
            <span style={{ fontSize: '0.7rem', opacity: 0.4 }}>Click to focus · ✓ to complete</span>
          </div>

          <div className="flex-column gap-2">
            {(task.subtasks || []).length === 0 && (
              <p style={{ opacity: 0.3, fontSize: '0.85rem', textAlign: 'center', padding: '2rem' }}>No day vaults found. Add nodes from the dashboard.</p>
            )}
            {(task.subtasks || []).map((st, i) => {
              const { header, topics, project, outcome } = parseVaultTitle(st.title);
              const isSelected   = selectedSubTaskId === st.id;
              const isCompleted  = st.status === 'completed';

              return (
                <motion.div key={st.id} layout
                  onClick={() => !isCompleted && setSelectedSubTaskId(isSelected ? null : st.id)}
                  style={{
                    background: isCompleted ? 'rgba(16,185,129,0.06)' : isSelected ? 'rgba(124,58,237,0.1)' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${isCompleted ? 'rgba(16,185,129,0.25)' : isSelected ? 'rgba(124,58,237,0.5)' : 'rgba(255,255,255,0.07)'}`,
                    borderRadius: '16px', padding: '1rem 1.2rem', cursor: isCompleted ? 'default' : 'pointer',
                    transition: 'all 0.2s ease'
                  }}>
                  {/* Header row */}
                  <div className="flex-between" style={{ marginBottom: (topics.length > 0 || project || outcome) ? '0.6rem' : 0 }}>
                    <div className="flex-row gap-2" style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 900, color: isCompleted ? '#10b981' : isSelected ? 'var(--accent)' : 'rgba(255,255,255,0.4)', minWidth: '24px' }}>
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span className="outfit" style={{ fontSize: '0.88rem', fontWeight: 800, color: isCompleted ? 'rgba(255,255,255,0.5)' : 'white', textDecoration: isCompleted ? 'line-through' : 'none', flex: 1 }}>
                        {header}
                      </span>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); toggleSubTaskDone(st.id); }}
                      style={{ background: isCompleted ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.05)', border: `1px solid ${isCompleted ? '#10b981' : 'rgba(255,255,255,0.15)'}`, borderRadius: '8px', padding: '4px 8px', cursor: 'pointer', color: isCompleted ? '#10b981' : 'rgba(255,255,255,0.4)', flexShrink: 0 }}>
                      <Check size={13} />
                    </button>
                  </div>

                  {/* Structured sections — only when expanded (selected) */}
                  <AnimatePresence>
                    {isSelected && !isCompleted && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
                        {topics.length > 0 && (
                          <div style={{ marginBottom: '0.4rem' }}>
                            <span style={{ fontSize: '0.65rem', opacity: 0.4, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05rem' }}>Topics</span>
                            <div className="flex-row" style={{ flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                              {topics.map((t, ti) => (
                                <span key={ti} style={{ fontSize: '0.72rem', background: 'rgba(167,139,250,0.12)', color: '#a78bfa', padding: '2px 8px', borderRadius: '6px', border: '1px solid rgba(167,139,250,0.2)' }}>{t}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        {project && (
                          <p style={{ fontSize: '0.74rem', color: 'var(--accent)', margin: '0.3rem 0', lineHeight: 1.5 }}>
                            🏗️ {project}
                          </p>
                        )}
                        {outcome && (
                          <p style={{ fontSize: '0.71rem', color: '#10b981', margin: '0.3rem 0 0', lineHeight: 1.5, opacity: 0.85 }}>
                            ✅ {outcome}
                          </p>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* RIGHT: Timer Panel */}
        <div className="flex-column gap-3">
          {/* Timer Display */}
          <div className="glass-panel text-center" style={{ padding: '2rem 1.5rem' }}>
            <p style={{ fontSize: '0.65rem', opacity: 0.4, letterSpacing: '0.15rem', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
              {isBreak ? 'Recovery' : mode === 'timer' ? 'Focus Timer' : 'Stopwatch'}
            </p>
            <motion.h2 key={displayTime} className="outfit" style={{ fontSize: '5rem', fontWeight: 900, color: isBreak ? '#10b981' : 'white', lineHeight: 1 }}>
              {displayTime}
            </motion.h2>

            {/* Controls */}
            <div className="flex-row flex-center gap-4" style={{ marginTop: '1.8rem' }}>
              <button onClick={() => { if (mode === 'timer') setTimeLeft(parseInt(inputMinutes||'0')*60); else setStopwatchTime(0); }} className="btn-glass" style={{ padding: '0.8rem', borderRadius: '50%' }}>
                <RotateCcw size={20} />
              </button>
              <button onClick={() => setIsActive(!isActive)} className="btn-primary" style={{ padding: '1rem 2.5rem', fontSize: '1rem', fontWeight: 800 }}>
                {isActive ? <><Pause size={20} /> Pause</> : <><Play size={20} /> {isBreak ? 'Resume Break' : 'Start Focus'}</>}
              </button>
              {isBreak && (
                <button onClick={() => { setSessionType('focus'); setIsActive(false); setBreakTimeLeft(5*60); }} className="btn-glass" style={{ padding: '0.8rem', borderRadius: '50%' }}>
                  <ChevronRight size={20} />
                </button>
              )}
            </div>

            {/* Duration input */}
            {!isBreak && (
              <div className="flex-row flex-center gap-2" style={{ marginTop: '1.2rem', opacity: isActive ? 0.3 : 0.7 }}>
                <Timer size={14} />
                <input disabled={isActive} type="number" value={inputMinutes}
                  onChange={e => { setInputMinutes(e.target.value); setTimeLeft(parseInt(e.target.value||'0')*60); }}
                  style={{ background: 'transparent', border: 'none', color: 'white', width: '45px', textAlign: 'center', fontSize: '1.1rem', fontWeight: 900 }} />
                <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>min</span>
              </div>
            )}

            {/* Mode toggle */}
            {!isBreak && (
              <div className="flex-row flex-center gap-2" style={{ marginTop: '1rem' }}>
                {(['timer', 'stopwatch'] as const).map(m => (
                  <button key={m} onClick={() => setMode(m)} style={{ fontSize: '0.7rem', fontWeight: 800, padding: '4px 14px', borderRadius: '20px', border: '1px solid', borderColor: mode === m ? 'var(--accent)' : 'rgba(255,255,255,0.1)', background: mode === m ? 'rgba(124,58,237,0.2)' : 'transparent', color: mode === m ? 'var(--accent)' : 'rgba(255,255,255,0.4)', cursor: 'pointer' }}>
                    {m.toUpperCase()}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Active Day Card */}
          {selectedSubTaskId && (() => {
            const st = (task.subtasks || []).find(s => s.id === selectedSubTaskId);
            if (!st) return null;
            const { header } = parseVaultTitle(st.title);
            return (
              <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="glass-panel" style={{ padding: '1rem 1.2rem', border: '1px solid rgba(124,58,237,0.4)', background: 'rgba(124,58,237,0.06)' }}>
                <p style={{ fontSize: '0.62rem', opacity: 0.5, fontWeight: 700, letterSpacing: '0.1rem', marginBottom: '0.4rem' }}>NOW FOCUSING ON</p>
                <p className="outfit" style={{ fontSize: '0.88rem', fontWeight: 800 }}>{header}</p>
                <p style={{ fontSize: '0.7rem', opacity: 0.4, marginTop: '0.3rem' }}>{fmtTotal(st.timeSpentSeconds || 0)} logged on this day</p>
              </motion.div>
            );
          })()}

          {/* Save button */}
          <button onClick={() => performSave()} className="btn-glass flex-row gap-2" style={{ justifyContent: 'center', padding: '0.9rem', fontSize: '0.8rem' }}>
            {isSyncing ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            {isSyncing ? 'Saving...' : 'Save Progress'}
          </button>

          {/* Motivation */}
          <div className="glass-panel" style={{ padding: '1.2rem' }}>
            <p style={{ fontSize: '0.75rem', fontStyle: 'italic', opacity: 0.7, lineHeight: 1.6 }}>"{currentSpark}"</p>
          </div>

          {/* Break Extension */}
          {isBreak && (
            <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="glass-panel flex-between" style={{ border: '1px solid #10b981', background: 'rgba(16,185,129,0.05)', padding: '1rem 1.2rem' }}>
              <div>
                <p style={{ fontSize: '0.8rem', fontWeight: 800, color: '#10b981' }}>Extend Break</p>
                <p style={{ fontSize: '0.7rem', opacity: 0.5 }}>5 pts → +5 min rest</p>
              </div>
              <button onClick={() => auraPoints >= 5 ? (setAuraPoints(p => p-5), setBreakTimeLeft(p => p+300)) : alert('Not enough Aura Points')} className="btn-glass" style={{ border: '1px solid #10b981', color: '#10b981', padding: '0.5rem 1rem', fontSize: '0.75rem' }}>
                Buy
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
