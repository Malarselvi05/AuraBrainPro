'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Sparkles, BookOpen, Zap, PlusCircle,
  ExternalLink, Copy, Check, MessageSquare
} from 'lucide-react';

interface Quote { id: string; text: string; originalText?: string; author?: string; }
interface Task { id: string; title: string; }
interface SubTask { id: string; title: string; status: 'todo' | 'in_progress' | 'completed'; timeSpentSeconds: number; createdAt: string; }

interface Props {
  quotes: Quote[];
  tasks: Task[];
  onClose: () => void;
  onMissionCreated: (title: string, nodes: SubTask[]) => void;
}

type Tab = 'quotes' | 'weave' | 'addquote';

const SAO_PROMPT = (quote: string) =>
  `You are a storytelling coach. Turn this quote/principle into an inspiring real-world SAO story.

QUOTE: "${quote}"

OUTPUT FORMAT (use exactly these labels, no markdown):
Situation: [A realistic scenario where someone struggles with something related to this quote — 2-3 sentences]
Action:
- [Specific step 1]
- [Specific step 2]
- [Specific step 3]
- [Specific step 4]
Outcome: [The transformation or lesson learned — 2-3 sentences]

Keep it actionable, grounded, and relevant to skill mastery or personal growth.`;

export default function StoryWeaverModal({ quotes, tasks, onClose, onMissionCreated }: Props) {
  const [tab, setTab] = useState<Tab>('quotes');
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [customQuoteText, setCustomQuoteText] = useState('');
  const [pastedStory, setPastedStory] = useState('');
  const [parsedStory, setParsedStory] = useState<{ situation: string; action: string; outcome: string } | null>(null);
  const [linkTaskId, setLinkTaskId] = useState('');
  const [savedOk, setSavedOk] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  // Add Quote tab
  const [newText, setNewText] = useState('');
  const [newAuthor, setNewAuthor] = useState('');
  const [quoteSaved, setQuoteSaved] = useState(false);

  const activeQuoteText = selectedQuote
    ? (selectedQuote.originalText || selectedQuote.text)
    : customQuoteText;

  const openInChatGPT = () => {
    if (!activeQuoteText.trim()) { alert('Select or type a quote first.'); return; }
    window.open(`https://chatgpt.com/?q=${encodeURIComponent(SAO_PROMPT(activeQuoteText))}`, '_blank');
  };

  const copyPrompt = () => {
    if (!activeQuoteText.trim()) { alert('Select or type a quote first.'); return; }
    navigator.clipboard.writeText(SAO_PROMPT(activeQuoteText));
    alert('✅ Prompt copied! Paste into any AI (ChatGPT, Gemini, Claude).');
  };

  const parseStory = () => {
    if (!pastedStory.trim()) { alert('Paste the AI story first.'); return; }

    let situation = '', action = '', outcome = '';
    let current = '';

    for (const raw of pastedStory.split('\n')) {
      const line = raw.trim();
      if (!line) continue;
      if (/^situation[:\s]/i.test(line)) { current = 'sit'; situation = line.replace(/^situation[:\s]*/i, '').trim(); }
      else if (/^action[:\s]*/i.test(line)) { current = 'act'; const rest = line.replace(/^action[:\s]*/i, '').trim(); if (rest) action += (action ? '\n' : '') + rest; }
      else if (/^outcome[:\s]/i.test(line)) { current = 'out'; outcome = line.replace(/^outcome[:\s]*/i, '').trim(); }
      else {
        if (current === 'sit') situation += ' ' + line;
        else if (current === 'act') action += (action ? '\n' : '') + line;
        else if (current === 'out') outcome += ' ' + line;
      }
    }

    if (!situation && !action && !outcome) {
      setParsedStory({ situation: pastedStory.trim(), action: '', outcome: '' });
    } else {
      setParsedStory({ situation: situation.trim(), action: action.trim(), outcome: outcome.trim() });
    }
  };

  const saveStory = async () => {
    if (!parsedStory) return;
    setIsSaving(true);
    const content = [
      parsedStory.situation && `🌍 Situation:\n${parsedStory.situation}`,
      parsedStory.action && `⚡ Action Steps:\n${parsedStory.action}`,
      parsedStory.outcome && `✨ Outcome:\n${parsedStory.outcome}`,
    ].filter(Boolean).join('\n\n');

    try {
      await fetch('/api/stories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          story: content,
          taskId: linkTaskId || null,
          taskTitle: tasks.find(t => t.id === linkTaskId)?.title || null,
        }),
      });
      setSavedOk(true);
      setTimeout(() => setSavedOk(false), 2500);
    } catch { alert('Save failed.'); }
    finally { setIsSaving(false); }
  };

  const createMission = () => {
    if (!parsedStory?.action) { alert('No Action steps found. Parse the story first.'); return; }
    const title = activeQuoteText
      ? `Story Mission: "${activeQuoteText.slice(0, 45)}..."`
      : 'Story Mission';
    const lines = parsedStory.action
      .split('\n')
      .map(l => l.replace(/^[-•*\d.]\s*/, '').trim())
      .filter(l => l.length > 4);
    if (!lines.length) { alert('No parseable action steps.'); return; }
    const nodes: SubTask[] = lines.map((l, i) => ({
      id: `story-node-${i}-${Date.now()}`,
      title: l,
      status: 'todo',
      timeSpentSeconds: 0,
      createdAt: new Date().toISOString(),
    }));
    onMissionCreated(title, nodes);
    onClose();
  };

  const saveNewQuote = async () => {
    if (!newText.trim()) return;
    await fetch('/api/quotes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: newText.trim(), author: newAuthor.trim() || 'Guardian' }),
    });
    setNewText(''); setNewAuthor('');
    setQuoteSaved(true);
    setTimeout(() => setQuoteSaved(false), 2000);
  };

  const INPUT_STYLE: React.CSSProperties = {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.09)',
    color: 'white', borderRadius: '14px',
    padding: '0.9rem 1.2rem', fontSize: '0.88rem',
    outline: 'none', width: '100%', boxSizing: 'border-box',
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 10001, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(50px)' }}>
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        style={{
          width: '100%', maxWidth: '760px', padding: '3rem',
          background: 'rgba(16,18,30,0.95)',
          border: '1.5px solid rgba(167,139,250,0.3)',
          borderRadius: '40px', maxHeight: '90vh', overflowY: 'auto',
          backdropFilter: 'blur(40px)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#a78bfa', fontWeight: 800, fontSize: '0.65rem', letterSpacing: '0.12rem', marginBottom: '0.5rem' }}>
              <Sparkles size={14} /> STORY WEAVER ENGINE v1.0
            </div>
            <h2 className="outfit" style={{ fontSize: '1.9rem', fontWeight: 900 }}>Quote → Story → Mission</h2>
            <p style={{ fontSize: '0.72rem', opacity: 0.4, marginTop: '0.3rem' }}>Transform inspiration into executable action plans</p>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', padding: '4px' }}>
            <X size={26} />
          </button>
        </div>

        {/* Tab Bar */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '2rem', background: 'rgba(255,255,255,0.03)', padding: '4px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)' }}>
          {([
            ['quotes', '📚  My Quotes'],
            ['weave', '✨  Weave Story'],
            ['addquote', '➕  Add Quote'],
          ] as [Tab, string][]).map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)} style={{
              flex: 1, padding: '0.75rem', borderRadius: '12px', border: 'none',
              fontWeight: 700, fontSize: '0.73rem', cursor: 'pointer', transition: 'all 0.2s',
              background: tab === key ? 'rgba(167,139,250,0.18)' : 'transparent',
              color: tab === key ? '#a78bfa' : 'rgba(255,255,255,0.4)',
              borderBottom: tab === key ? '2px solid #a78bfa' : '2px solid transparent',
            }}>
              {label}
            </button>
          ))}
        </div>

        {/* ── TAB: QUOTES ───────────────────────────── */}
        {tab === 'quotes' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            {quotes.length === 0 && (
              <div style={{ textAlign: 'center', padding: '3rem', opacity: 0.4 }}>
                <BookOpen size={32} style={{ marginBottom: '0.8rem' }} />
                <p style={{ fontSize: '0.9rem' }}>No quotes saved yet.</p>
                <p style={{ fontSize: '0.75rem', marginTop: '0.3rem' }}>Go to "Add Quote" tab to save your first inspiration.</p>
              </div>
            )}
            {quotes.map(q => (
              <div key={q.id}
                onClick={() => { setSelectedQuote(q); setTab('weave'); }}
                style={{
                  background: selectedQuote?.id === q.id ? 'rgba(167,139,250,0.1)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${selectedQuote?.id === q.id ? 'rgba(167,139,250,0.45)' : 'rgba(255,255,255,0.07)'}`,
                  borderRadius: '16px', padding: '1.2rem 1.5rem', cursor: 'pointer', transition: 'all 0.15s',
                }}>
                <p style={{ fontStyle: 'italic', fontSize: '0.9rem', lineHeight: 1.65 }}>"{q.originalText || q.text}"</p>
                <p style={{ fontSize: '0.68rem', opacity: 0.4, marginTop: '0.5rem' }}>— {q.author || 'Unknown'}</p>
              </div>
            ))}
            {/* Custom input */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1rem' }}>
              <p style={{ fontSize: '0.68rem', opacity: 0.45, marginBottom: '0.6rem' }}>Or enter a custom quote:</p>
              <textarea value={customQuoteText} onChange={e => setCustomQuoteText(e.target.value)}
                placeholder="Type any quote, principle, or thought..."
                style={{ ...INPUT_STYLE, height: '80px', resize: 'none' }} />
              {customQuoteText.trim() && (
                <button onClick={() => { setSelectedQuote(null); setTab('weave'); }}
                  className="btn-glass" style={{ width: '100%', marginTop: '0.5rem', padding: '0.75rem', fontSize: '0.75rem' }}>
                  Use Custom Text →
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── TAB: WEAVE STORY ──────────────────────── */}
        {tab === 'weave' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.4rem' }}>

            {/* Active Quote */}
            {activeQuoteText ? (
              <div style={{ background: 'rgba(167,139,250,0.07)', border: '1px solid rgba(167,139,250,0.25)', borderRadius: '16px', padding: '1.2rem 1.6rem' }}>
                <p style={{ fontSize: '0.6rem', color: '#a78bfa', fontWeight: 800, letterSpacing: '0.1rem', marginBottom: '0.4rem' }}>ACTIVE QUOTE</p>
                <p style={{ fontStyle: 'italic', fontSize: '0.9rem', lineHeight: 1.6 }}>"{activeQuoteText}"</p>
              </div>
            ) : (
              <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '14px', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <MessageSquare size={16} color="#ef4444" />
                <p style={{ fontSize: '0.85rem', color: '#ef4444' }}>Select a quote from the Quotes tab first</p>
              </div>
            )}

            {/* Step 1: Generate */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '18px', padding: '1.5rem' }}>
              <p style={{ fontSize: '0.68rem', fontWeight: 800, opacity: 0.6, letterSpacing: '0.08rem', marginBottom: '0.9rem' }}>STEP 1 — GENERATE STORY (FREE — No API Key)</p>
              <p style={{ fontSize: '0.78rem', opacity: 0.5, marginBottom: '1rem', lineHeight: 1.6 }}>
                Click to open ChatGPT with a pre-built SAO story prompt. Copy the output and paste in Step 2.
              </p>
              <div style={{ display: 'flex', gap: '0.7rem' }}>
                <button onClick={openInChatGPT} className="btn-primary"
                  style={{ flex: 2, padding: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <ExternalLink size={15} /> Open in ChatGPT
                </button>
                <button onClick={copyPrompt} className="btn-glass"
                  style={{ flex: 1, padding: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  <Copy size={14} /> Copy Prompt
                </button>
              </div>
            </div>

            {/* Step 2: Parse */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '18px', padding: '1.5rem' }}>
              <p style={{ fontSize: '0.68rem', fontWeight: 800, opacity: 0.6, letterSpacing: '0.08rem', marginBottom: '0.9rem' }}>STEP 2 — PASTE & PARSE AI OUTPUT</p>
              <textarea value={pastedStory} onChange={e => setPastedStory(e.target.value)}
                placeholder="Paste the ChatGPT story here (Situation / Action / Outcome format)..."
                style={{ ...INPUT_STYLE, height: '130px', resize: 'none', lineHeight: 1.65 }} />
              <button onClick={parseStory} className="btn-glass"
                style={{ width: '100%', marginTop: '0.7rem', padding: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <Zap size={15} /> Parse Story Structure
              </button>
            </div>

            {/* Parsed Result */}
            <AnimatePresence>
              {parsedStory && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  style={{ background: 'rgba(16,185,129,0.04)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '18px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <p style={{ fontSize: '0.62rem', fontWeight: 800, color: '#10b981', letterSpacing: '0.1rem' }}>✅ STORY PARSED SUCCESSFULLY</p>

                  {parsedStory.situation && (
                    <div>
                      <p style={{ fontSize: '0.6rem', opacity: 0.45, fontWeight: 700, marginBottom: '0.3rem', textTransform: 'uppercase' }}>🌍 Situation</p>
                      <p style={{ fontSize: '0.85rem', lineHeight: 1.65 }}>{parsedStory.situation}</p>
                    </div>
                  )}
                  {parsedStory.action && (
                    <div>
                      <p style={{ fontSize: '0.6rem', opacity: 0.45, fontWeight: 700, marginBottom: '0.3rem', textTransform: 'uppercase' }}>⚡ Action Steps</p>
                      <pre style={{ fontSize: '0.85rem', lineHeight: 1.7, whiteSpace: 'pre-wrap', fontFamily: 'inherit', opacity: 0.85 }}>{parsedStory.action}</pre>
                    </div>
                  )}
                  {parsedStory.outcome && (
                    <div>
                      <p style={{ fontSize: '0.6rem', opacity: 0.45, fontWeight: 700, marginBottom: '0.3rem', textTransform: 'uppercase' }}>✨ Outcome</p>
                      <p style={{ fontSize: '0.85rem', lineHeight: 1.65 }}>{parsedStory.outcome}</p>
                    </div>
                  )}

                  {/* Link to Mission */}
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '1rem' }}>
                    <p style={{ fontSize: '0.62rem', opacity: 0.45, fontWeight: 700, marginBottom: '0.5rem' }}>LINK TO MISSION (optional)</p>
                    <select value={linkTaskId} onChange={e => setLinkTaskId(e.target.value)}
                      style={{ ...INPUT_STYLE, padding: '0.75rem 1rem' }}>
                      <option value="" style={{ color: 'black', background: '#111' }}>None — standalone story</option>
                      {tasks.map(t => <option key={t.id} value={t.id} style={{ color: 'black', background: '#111' }}>{t.title}</option>)}
                    </select>
                  </div>

                  <div style={{ display: 'flex', gap: '0.7rem' }}>
                    <button onClick={saveStory} className="btn-primary"
                      style={{ flex: 1, padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      {savedOk ? <><Check size={15} /> Saved!</> : isSaving ? 'Saving...' : <><BookOpen size={15} /> Save Story</>}
                    </button>
                    {parsedStory.action && (
                      <button onClick={createMission} className="btn-glass"
                        style={{ flex: 1, padding: '1rem', color: '#a78bfa', borderColor: 'rgba(167,139,250,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <PlusCircle size={15} /> Create Mission
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* ── TAB: ADD QUOTE ──────────────────────────── */}
        {tab === 'addquote' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p style={{ fontSize: '0.8rem', opacity: 0.5, lineHeight: 1.6 }}>
              Save quotes, principles, or mantras to your Inspiration Vault. You can then use the Weave engine to turn them into action plans.
            </p>
            <textarea value={newText} onChange={e => setNewText(e.target.value)}
              placeholder="e.g. 'Success is the sum of small efforts, repeated day in and day out.'"
              style={{ ...INPUT_STYLE, height: '110px', resize: 'none', lineHeight: 1.65 }} />
            <input value={newAuthor} onChange={e => setNewAuthor(e.target.value)}
              placeholder="Author or source (optional)"
              style={INPUT_STYLE} />
            <button onClick={saveNewQuote} className="btn-primary" style={{ padding: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              {quoteSaved ? <><Check size={15} /> Saved to Vault!</> : '💾  Save to Inspiration Vault'}
            </button>
            {quoteSaved && (
              <p style={{ textAlign: 'center', fontSize: '0.75rem', color: '#10b981', opacity: 0.8 }}>
                Go to "My Quotes" tab and refresh to see it.
              </p>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
