'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import { 
  PlusCircle,
  X,
  History,
  Sparkles,
  ChevronDown,
  ChevronUp,
  BrainCircuit,
  Plus,
  Edit3,
  RefreshCcw,
  Target,
  Trophy,
  Settings,
  Cpu,
  Trash2,
  Loader2,
  Code,
  BookOpen,
  FlaskConical,
  Zap,
  Timer,
  Clock,
  CalendarDays,
  Construction,
  RotateCcw,
  Star,
  CheckCircle2,
  Terminal,
  ShieldCheck,
  Flame,
  BarChart3
} from 'lucide-react';

const StatsDashboard = dynamic(() => import('../components/StatsDashboard'), { ssr: false });
const StoryWeaverModal = dynamic(() => import('../components/StoryWeaverModal'), { ssr: false });

interface Resource { name: string; url: string; }
interface SubTask { id: string; title: string; status: 'todo' | 'in_progress' | 'completed'; timeSpentSeconds: number; createdAt: string; }
interface Task {
  id: string; title: string; description?: string; status: 'todo' | 'in_progress' | 'completed'; 
  timeSpentSeconds: number; createdAt: string; storyId?: string; resources: string;
  subtasks?: SubTask[];
}
interface GlobalQuote { id: string; text: string; author?: string; }
interface AISettings { aiApiKey: string; geminiApiKey: string; preferredModel: 'openai' | 'gemini'; agentEnabled: boolean; }
interface Stats { identityStatement: string; dailyFocusLogs: Record<string, number>; }

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [globalQuotes, setGlobalQuotes] = useState<GlobalQuote[]>([]);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskData, setTaskData] = useState({ title: '', description: '' });
  const [manualSubTasks, setManualSubTasks] = useState<SubTask[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [isAIPromptOpen, setIsAIPromptOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [bulkImportText, setBulkImportText] = useState('');
  const [isOffline, setIsOffline] = useState(false);
  const [aiPrompt, setAIPrompt] = useState('');
  const [targetDays, setTargetDays] = useState('10');
  const [hoursPerDay, setHoursPerDay] = useState('7');
  const [aiSettings, setAiSettings] = useState<AISettings>({ aiApiKey: "", geminiApiKey: "", preferredModel: "gemini", agentEnabled: true });
  const [stats, setStats] = useState<Stats>({ identityStatement: "I am a person who focuses daily, no matter what.", dailyFocusLogs: {} });
  const [isIdentityEditing, setIsIdentityEditing] = useState(false);
  const [identityInput, setIdentityInput] = useState('');
  // Phase 5 & 6
  const [activeTab, setActiveTab] = useState<'missions' | 'progress' | 'stories' | 'history'>('missions');
  const [auraPoints, setAuraPoints] = useState(0);
  const [isStoryWeaverOpen, setIsStoryWeaverOpen] = useState(false);
  const [archivedTasks, setArchivedTasks] = useState<Task[]>([]);

  useEffect(() => { 
    fetchTasks(); 
    const pulseTimer = setInterval(fetchTasks, 10000);
    return () => clearInterval(pulseTimer);
  }, []);

  const fetchTasks = async () => {
    try { 
      setIsSyncing(true);
      const res = await fetch(`/api/tasks?v=${Date.now()}`); 
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json(); 
      if (data.tasks) setTasks(data.tasks);
      if (data.archivedTasks) setArchivedTasks(data.archivedTasks);
      if (data.quotes) setGlobalQuotes(data.quotes);
      if (data.settings) setAiSettings(data.settings);
      if (data.auraPoints !== undefined) setAuraPoints(data.auraPoints);
      if (data.stats) { setStats(data.stats); if (!isIdentityEditing) setIdentityInput(data.stats.identityStatement); }
      setIsOffline(false);
    } catch (err) { 
      console.error(err); 
      setIsOffline(true);
    }
    finally { setIsSyncing(false); }
  };

  const [aiPasteResult, setAiPasteResult] = useState('');

  // Handle mission creation from Story Weaver
  const handleMissionFromStory = (title: string, nodes: SubTask[]) => {
    setEditingTask(null);
    setTaskData({ title, description: 'Created from Story Weaver' });
    setManualSubTasks(nodes);
    setIsTaskModalOpen(true);
  };


  // PRIMARY: In-app API call
  const synthesizeAIPack = async () => {
     if (!aiPrompt.trim()) return;
     const isGemini = aiSettings.preferredModel === 'gemini';
     const currentKey = isGemini ? aiSettings.geminiApiKey : aiSettings.aiApiKey;
     
     if (!currentKey) { 
       alert(`No API Key set. Go to Settings (⚙️) and paste your ${isGemini ? 'Gemini' : 'OpenAI'} key.\n\nGet a free Gemini key at: aistudio.google.com/app/apikey`); 
       return; 
     }

     if (isGemini && !currentKey.startsWith('AIzaSy')) {
       alert("Invalid Gemini Key format. It should start with 'AIzaSy'. Check Settings.");
       return;
     }

     setIsGenerating(true);
     const route = isGemini ? '/api/ai/gemini' : '/api/ai/planner';
     try {
        const res = await fetch(route, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: aiPrompt, days: targetDays, hours: hoursPerDay }) });
        const data = await res.json();
        if (data.error) { alert('AI Error: ' + data.error); }
        else { setManualSubTasks(data); setIsAIPromptOpen(false); }
     } catch (e) { alert('Connection failure.'); }
     finally { setIsGenerating(false); }
  };

  const buildMasteryPrompt = () => {
    return `You are the Aura Mastery Architect. Generate a professional learning roadmap.

CONSTRAINTS:
- Days: ${targetDays} days
- Hours Per Day: ${hoursPerDay} hours/day
- Daily Structure: 40% concept learning, 40% hands-on coding, 20% debugging/revision
- Limit: 3-4 topics per day maximum
- INCREMENTAL PROJECT: Do NOT start a new project each day. Instead, build ONE evolving project that grows across days. Each project milestone adds a new feature on top of what was built before.
- Every day must end with: "Outcome: After this day, you should be able to..."
- Move advanced topics (Closures, Decorators, Operator Overloading) to a final Optional Phase

Curriculum to organize:
${aiPrompt}

OUTPUT FORMAT (plain numbered list, one entry per line):
Day 1 [Xh]: Topics | Outcome: ...
Day 2 [Xh]: Topics | Outcome: ...
...
[OPTIONAL PHASE]: Advanced topics`;
  };

  const openInChatGPT = () => {
    const prompt = buildMasteryPrompt();
    const encoded = encodeURIComponent(prompt);
    window.open(`https://chatgpt.com/?q=${encoded}`, '_blank');
  };

  const openInGemini = () => {
    const prompt = buildMasteryPrompt();
    const encoded = encodeURIComponent(prompt);
    window.open(`https://gemini.google.com/app?q=${encoded}`, '_blank');
  };
  const archiveTask = async (id: string, archive: boolean = true) => {
    if (archive && !confirm('Archive this mission? It will be moved to the History tab.')) return;
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, archived: archive, isSyncOnly: true })
      });
      if (res.ok) fetchTasks();
    } catch (e) { console.error(e); }
  };

  const copyPrompt = () => {
    navigator.clipboard.writeText(buildMasteryPrompt());
    alert('✅ Mastery Prompt copied! Paste it into any AI (ChatGPT, Gemini, Claude).');
  };

  const injectAIPastedResult = () => {
    if (!aiPasteResult.trim()) { alert('Paste your AI roadmap first.'); return; }

    // Split into Day blocks
    const dayBlocks = aiPasteResult
      .split(/(?=Day\s+\d+\s*[\[\(:])/i)
      .map(b => b.trim())
      .filter(b => b.length > 5);

    if (dayBlocks.length === 0) {
      // Fallback: line-by-line
      const lines = aiPasteResult.split('\n').map(l => l.trim()).filter(l => l.length > 5);
      setManualSubTasks(lines.map((line, i) => ({
        id: `ai-${i}-${Date.now()}`, title: line,
        status: 'todo' as const, timeSpentSeconds: 0, createdAt: new Date().toISOString()
      })));
      setAiPasteResult(''); setIsAIPromptOpen(false);
      return;
    }

    // Section label patterns to strip (e.g. "Topics:", "Project Progression:", "Time Split:")
    const sectionLabels = /^(topics|project progression|project milestone|time split|mini-project hint|structure|note)[:\s]*/i;

    const nodes = dayBlocks.map((block, i) => {
      const lines = block.split('\n').map(l => l.trim()).filter(l => l.length > 0);

      // Line 0: Day header e.g. "Day 1 [7h]: Foundations of Python Syntax"
      const header = lines[0];

      let topics: string[] = [];
      let projectLine = '';
      let outcomeLine = '';
      let currentSection = '';

      for (let j = 1; j < lines.length; j++) {
        const line = lines[j];

        // Detect section headers — update context, don't add to output
        if (/^topics[:\s]/i.test(line))            { currentSection = 'topics'; continue; }
        if (/^project progression[:\s]/i.test(line) || /^project milestone[:\s]/i.test(line)){ currentSection = 'project'; continue; }
        if (/^time split[:\s]/i.test(line))         { currentSection = 'time'; continue; }
        if (/^structure[:\s]*/i.test(line))         { currentSection = 'time'; continue; } // treat as skip
        if (/^outcome[:\s]/i.test(line)) {
          outcomeLine = line.replace(/^outcome[:\s]*/i, '').trim();
          currentSection = 'outcome'; continue;
        }

        // Skip time-split entries (e.g. "2.8h Concepts")
        if (/^\d+(\.\d+)?h\s/i.test(line)) continue;

        const clean = line.replace(/^[-•*]\s*/, '').replace(sectionLabels, '').trim();
        if (!clean) continue;

        if (currentSection === 'topics') {
          topics.push(clean);
        } else if (currentSection === 'project') {
          // Merge project progression lines with arrow
          projectLine = projectLine ? `${projectLine} → ${clean}` : clean;
        } else if (currentSection === 'outcome') {
          outcomeLine = outcomeLine ? `${outcomeLine} ${clean}` : clean;
        }
      }

      // Build clean structured title
      const parts: string[] = [header];
      if (topics.length) parts.push(`📚 ${topics.join(' · ')}`);
      if (projectLine)   parts.push(`🏗️ ${projectLine}`);
      if (outcomeLine)   parts.push(`✅ ${outcomeLine}`);

      return {
        id: `day-${i + 1}-${Date.now()}`,
        title: parts.join('\n'),
        status: 'todo' as const,
        timeSpentSeconds: 0,
        createdAt: new Date().toISOString()
      };
    });

    setManualSubTasks(nodes);
    setAiPasteResult('');
    setIsAIPromptOpen(false);
    alert(`✨ ${nodes.length} structured Day vaults injected into Chrono-Vault.`);
  };


  const addManualSubTask = () => {
    const n: SubTask = { id: `st-${Date.now()}`, title: '', status: 'todo', timeSpentSeconds: 0, createdAt: new Date().toISOString() };
    setManualSubTasks(prev => [...prev, n]);
  };

  const handleBulkImport = () => {
    if (!bulkImportText.trim()) return;
    const lines = bulkImportText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const newNodes = lines.map((line, i) => ({
      id: `bulk-${i}-${Date.now()}`, title: line,
      status: 'todo' as const, timeSpentSeconds: 0, createdAt: new Date().toISOString()
    }));
    setManualSubTasks(prev => [...prev, ...newNodes]);
    setBulkImportText('');
    setIsBulkImportOpen(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!aiSettings.geminiApiKey) {
      alert("Please enter your Free Gemini API Key in Settings to extract plans from PDF/Images!");
      return;
    }

    if (file.name.endsWith('.docx')) {
      alert("DOCX is not supported natively. Please save as PDF and upload that, or paste the text directly!");
      return;
    }

    setIsProcessingFile(true);
    try {
      const base64Str = await new Promise<string>((resolve, reject) => {
         const reader = new FileReader();
         reader.readAsDataURL(file);
         reader.onload = () => resolve((reader.result as string).split(',')[1]);
         reader.onerror = error => reject(error);
      });

      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${aiSettings.geminiApiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: "Extract the chronological roadmap or study plan from this document. Output ONLY a simple bulleted list. No markdown headers, no asterisks, no intros. Just one single line of instruction per step/day." },
              { inlineData: { mimeType: file.type, data: base64Str } }
            ]
          }]
        })
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      
      const rawText = data.candidates[0].content.parts[0].text;
      const lines = rawText.split('\n').map((l: string) => l.replace(/^[-*•\d.]*\s*/, '').trim()).filter(Boolean);
      
      const newNodes = lines.map((line: string, i: number) => ({
        id: `file-${i}-${Date.now()}`, title: line,
        status: 'todo' as const, timeSpentSeconds: 0, 
        createdAt: new Date().toISOString()
      }));
      
      setManualSubTasks(prev => [...prev, ...newNodes]);
      setIsBulkImportOpen(false);
      alert(`✨ Vision Sub-routine: Extracted ${newNodes.length} nodes from ${file.name}`);
    } catch (err: any) {
      alert("File extraction failed: " + err.message);
    } finally {
      setIsProcessingFile(false);
      if (e.target) e.target.value = '';
    }
  };

  const updateSubTaskTitle = (id: string, title: string) => {
    setManualSubTasks(prev => prev.map(st => st.id === id ? { ...st, title } : st));
  };

  const removeSubTask = (id: string) => {
    setManualSubTasks(prev => prev.filter(st => st.id !== id));
  };

  const deleteTask = async (id: string) => {
    if (!confirm("Mission Termination: Proceed?")) return;
    setIsSyncing(true);
    try {
        const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
        if (res.ok) fetchTasks();
    } catch (e) { alert("Registry Locked."); }
    finally { setIsSyncing(false); }
  };

  const submitTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskData.title.trim()) { alert("Mission Identifier Required."); return; }
    setIsSyncing(true);
    try {
      const payload = { 
        ...taskData, 
        resources: JSON.stringify([]), 
        status: editingTask ? editingTask.status : 'todo',
        subtasks: manualSubTasks 
      };
      const url = editingTask ? `/api/tasks/${editingTask.id}` : '/api/tasks';
      const res = await fetch(url, { method: editingTask ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (res.ok) { setIsTaskModalOpen(false); setEditingTask(null); setManualSubTasks([]); fetchTasks(); }
    } catch (err) { alert("Sync Failure."); }
    finally { setIsSyncing(false); }
  };

  const saveAiSettings = async () => {
    setIsSyncing(true);
    try {
        await fetch('/api/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isSyncOnly: true, settings: aiSettings }) });
        alert("Aura Multi-Hub Secured."); setIsSettingsOpen(false);
    } catch (e) { console.error(e); }
    finally { setIsSyncing(false); }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const hrs = Math.floor(mins / 60);
    return hrs > 0 ? `${hrs}h ${mins % 60}m` : `${mins}m ${seconds % 60}s`;
  };

  const getDayIcon = (title: string) => {
      if (title.includes('PROJECT') || title.includes('Build')) return <Construction size={20} color="var(--accent)" />;
      if (title.includes('REVISION') || title.includes('Clean-up')) return <RotateCcw size={20} color="#3b82f6" />;
      if (title.includes('OUTCOME')) return <CheckCircle2 size={20} color="#10b981" />;
      return <BookOpen size={20} color="rgba(255,255,255,0.4)" />;
  };

  const computeStreak = () => {
    let streak = 0;
    const logs = stats.dailyFocusLogs;
    if (!logs) return 0;
    
    const todayStr = new Date().toISOString().split('T')[0];
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayStr = yesterdayDate.toISOString().split('T')[0];

    let currentDate = new Date();
    if (logs[todayStr] && logs[todayStr] >= 600) {
       // streak continues from today
    } else if (logs[yesterdayStr] && logs[yesterdayStr] >= 600) {
       // streak continues from yesterday
       currentDate = yesterdayDate;
    } else {
       return 0; // Streak broken
    }

    while (true) {
      const dStr = currentDate.toISOString().split('T')[0];
      if (logs[dStr] && logs[dStr] >= 600) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  };

  const saveIdentity = async () => {
    setIsSyncing(true);
    try {
      const updatedStats = { ...stats, identityStatement: identityInput };
      await fetch('/api/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isSyncOnly: true, stats: updatedStats }) });
      setStats(updatedStats);
      setIsIdentityEditing(false);
    } catch (e) { console.error(e); }
    finally { setIsSyncing(false); }
  };

  const streak = computeStreak();

  return (
    <div className="app-container" style={{ padding: '2rem 10%' }}>
      <header className="flex-between" style={{ marginBottom: '4rem' }}>
        <div className="flex-column">
           <div className="flex-row gap-3">
              <h1 className="text-gradient outfit" style={{ fontSize: '3rem', fontWeight: 900 }}>AuraBrain.Pro</h1>
              {isOffline && <div className="badge flex-row gap-2" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}><Zap size={12} /> OFFLINE MODE</div>}
           </div>
           <p style={{ opacity: 0.6, fontSize: '0.65rem' }}>Universal AI Hub v18.0 (Dual Bridge Active)</p>
        </div>
        <div className="flex-row gap-4"><button onClick={() => setIsSettingsOpen(true)} className="btn-glass" style={{ padding: '0.8rem' }}><Settings size={20} /></button><button onClick={fetchTasks} className="btn-glass" style={{ borderColor: isOffline ? '#ef4444' : 'var(--glass-border)' }}><RefreshCcw size={16} className={isSyncing ? "animate-spin" : ""} color={isOffline ? "#ef4444" : "white"} /></button></div>
      </header>

      {/* Identity & Progress Feedback Loop System */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '2rem', marginBottom: '2.5rem' }}>
        <div className="glass-panel" style={{ padding: '2rem 2.5rem', background: 'rgba(124, 58, 237, 0.05)', border: '1px solid rgba(124, 58, 237, 0.2)' }}>
          <p style={{ fontSize: '0.65rem', opacity: 0.6, letterSpacing: '0.1rem', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: 700 }}>IDENTITY (NON-NEGOTIABLE SYSTEM)</p>
          {isIdentityEditing ? (
            <div className="flex-row gap-3">
              <input type="text" value={identityInput} onChange={e => setIdentityInput(e.target.value)} style={{ flex: 1, background: 'rgba(255,255,255,0.05)', padding: '0.8rem 1.2rem', borderRadius: '12px', color: 'white', border: '1px solid rgba(255,255,255,0.1)', fontSize: '1.2rem' }} />
              <button onClick={saveIdentity} className="btn-primary" style={{ padding: '0.8rem 1.5rem', borderRadius: '12px' }}>Save</button>
            </div>
          ) : (
            <div className="flex-row gap-3 align-start">
              <h2 className="outfit" style={{ fontSize: '1.6rem', fontWeight: 800, flex: 1, lineHeight: 1.3 }}>"{stats.identityStatement}"</h2>
              <button onClick={() => { setIsIdentityEditing(true); setIdentityInput(stats.identityStatement); }} className="btn-glass" style={{ padding: '0.5rem' }}><Edit3 size={16} /></button>
            </div>
          )}
        </div>
        
        <div className="glass-panel text-center flex-column justify-center align-center" style={{ padding: '1.5rem 3rem', minWidth: '200px' }}>
          <div style={{ position: 'relative' }}>
            <Flame size={48} color={streak > 0 ? "var(--accent)" : "rgba(255,255,255,0.2)"} />
            <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} style={{ position: 'absolute', top: '-5px', right: '-10px', background: 'var(--accent)', color: 'white', fontWeight: 900, fontSize: '0.7rem', padding: '2px 8px', borderRadius: '20px' }}>
              {streak} Days
            </motion.div>
          </div>
          <p style={{ fontSize: '0.8rem', fontWeight: 800, marginTop: '0.8rem' }}>Focus Streak</p>
          <p style={{ fontSize: '0.65rem', opacity: 0.5, marginTop: '0.2rem' }}>Min 10 mins/day</p>
        </div>
      </div>

      {/* ── PHASE 5 & 6: Tab Navigation Bar ─────────────── */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '1.5rem', background: 'rgba(255,255,255,0.02)', padding: '5px', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.06)' }}>
        {([
          ['missions', <Target size={15} />, 'Mission Control'],
          ['progress', <BarChart3 size={15} />, 'Progress'],
          ['stories', <Sparkles size={15} />, 'Story Weaver'],
          ['history', <History size={15} />, 'History'],
        ] as [string, React.ReactNode, string][]).map(([key, icon, label]) => (
          <button key={key} onClick={() => setActiveTab(key as any)}
            style={{
              flex: 1, padding: '0.8rem 1rem', borderRadius: '13px', border: 'none',
              fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer', transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
              background: activeTab === key ? 'rgba(37,99,235,0.18)' : 'transparent',
              color: activeTab === key ? 'var(--accent)' : 'rgba(255,255,255,0.4)',
              borderBottom: activeTab === key ? '2px solid var(--accent)' : '2px solid transparent',
            }}>
            {icon} {label}
          </button>
        ))}
      </div>

      {/* ── TAB: MISSIONS ─────────────────────────────── */}
      {activeTab === 'missions' && (
        <div className="glass-panel" style={{ minHeight: '700px' }}>
          <div className="flex-between" style={{ marginBottom: '3rem' }}>
            <h3 className="outfit flex-row gap-2" style={{ fontSize: '1.6rem' }}><Target size={26} color="var(--accent)" /> Mission Control Room</h3>
            <div className="flex-row gap-3">
              <button onClick={() => setIsStoryWeaverOpen(true)} className="btn-glass" style={{ color: '#a78bfa', borderColor: 'rgba(167,139,250,0.4)', display: 'flex', alignItems: 'center', gap: '7px' }}>
                <Sparkles size={15} /> Story Weaver
              </button>
              <button onClick={() => { setEditingTask(null); setTaskData({ title: '', description: '' }); setManualSubTasks([]); setIsTaskModalOpen(true); }} className="btn-primary" style={{ padding: '0.9rem 2.2rem' }}>
                <PlusCircle size={20} /> New Mission
              </button>
            </div>
          </div>

          <div className="custom-scroll" style={{ overflowY: 'auto' }}>
            <AnimatePresence>
              {tasks.length === 0 && (
                <div style={{ textAlign: 'center', padding: '4rem', opacity: 0.3 }}>
                  <Target size={48} style={{ marginBottom: '1rem' }} />
                  <p style={{ fontSize: '1rem', fontWeight: 700 }}>No missions yet.</p>
                  <p style={{ fontSize: '0.8rem', marginTop: '0.4rem' }}>Click "New Mission" to start your first mastery plan.</p>
                </div>
              )}
              {tasks.map((task) => {
                const isExpanded = expandedTaskId === task.id;
                return (
                  <motion.div key={task.id} className="glass" style={{ padding: '2rem', borderRadius: '32px', marginBottom: '1.5rem', border: isExpanded ? '2.5px solid var(--accent)' : '1px solid var(--glass-border)' }}>
                    <div className="flex-between">
                      <div className="flex-column gap-3">
                        <p className="outfit" style={{ fontSize: '1.4rem', fontWeight: 700 }}>{task.title}</p>
                        <div className="flex-row gap-4" style={{ fontSize: '0.75rem' }}>
                          <div className="status-badge"><History size={12} /> {formatTime(task.timeSpentSeconds || 0)}</div>
                          <button onClick={() => setExpandedTaskId(isExpanded ? null : task.id)} style={{ cursor: 'pointer', background: 'transparent', border: 'none', color: isExpanded ? 'white' : 'rgba(255,255,255,0.4)', fontWeight: 700 }}>CHRONO-VAULT DATA {isExpanded ? '▼' : '▲'}</button>
                        </div>
                      </div>
                      <div className="flex-row gap-4">
                        <a href={`/deep-work/${task.id}`} target="_blank" className="btn-primary" style={{ textDecoration: 'none' }}>LOG IN</a>
                        <button onClick={() => archiveTask(task.id)} className="btn-glass" style={{ padding: '0.7rem', color: '#a78bfa' }} title="Archive Mission"><History size={18} /></button>
                        <button onClick={() => { setEditingTask(task); setTaskData({ title: task.title, description: task.description || '' }); setManualSubTasks(task.subtasks || []); setIsTaskModalOpen(true); }} className="btn-glass" style={{ padding: '0.7rem' }}><Edit3 size={18} /></button>
                        <button onClick={() => deleteTask(task.id)} className="btn-glass" style={{ padding: '0.7rem', color: '#ef4444' }}><Trash2 size={18} /></button>
                      </div>
                    </div>
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                          <div className="flex-column gap-4" style={{ marginTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '2rem' }}>
                            {(task.subtasks || []).map((st: any) => {
                              const secs = st.title.split('\n').map((s: string) => s.trim()).filter(Boolean);
                              const header = secs[0] || st.title;
                              const topicsRaw  = secs.find((s: string) => s.startsWith('📚')) || '';
                              const projectRaw = secs.find((s: string) => s.startsWith('🏗️')) || '';
                              const outcomeRaw = secs.find((s: string) => s.startsWith('✅')) || '';
                              const topicsClean = topicsRaw.replace(/^📚\s*/, '').split(/\s*[·•]\s*Project Milestone[:\s]*.*/i)[0].split(/\s*[·•]\s*Structure[:\s]*/i)[0].trim();
                              let projectClean = projectRaw.replace(/^🏗️\s*/, '').trim();
                              if (!projectClean) { const m = topicsRaw.match(/Project Milestone[:\s]+([^·✅\n]+)/i); if (m) projectClean = m[1].replace(/^[·•]\s*/, '').trim(); }
                              const outcomeClean = outcomeRaw.replace(/^✅\s*/, '').trim();
                              const isStructured = !!(topicsClean || projectClean || outcomeClean);
                              return (
                                <div key={st.id} style={{ background: st.status === 'completed' ? 'rgba(16,185,129,0.06)' : 'rgba(255,255,255,0.02)', border: `1px solid ${st.status === 'completed' ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.07)'}`, borderRadius: '20px', padding: '1.2rem 1.6rem' }}>
                                  <div className="flex-between" style={{ marginBottom: isStructured ? '0.7rem' : 0 }}>
                                    <div className="flex-row gap-3">{getDayIcon(st.title)}<span className="outfit" style={{ fontSize: '0.95rem', fontWeight: 800 }}>{header}</span></div>
                                    {st.status === 'completed' && <Trophy size={14} color="#10b981" />}
                                  </div>
                                  {topicsClean  && <p style={{ fontSize: '0.76rem', color: '#a78bfa', margin: '0.25rem 0', lineHeight: 1.6 }}>📚 {topicsClean}</p>}
                                  {projectClean && <p style={{ fontSize: '0.76rem', color: 'var(--accent)', margin: '0.25rem 0', lineHeight: 1.6 }}>🏗️ {projectClean}</p>}
                                  {outcomeClean && <p style={{ fontSize: '0.73rem', color: '#10b981', margin: '0.35rem 0 0', lineHeight: 1.5, opacity: 0.9 }}>✅ {outcomeClean}</p>}
                                </div>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* ── TAB: PROGRESS (Phase 5) ───────────────────── */}
      {activeTab === 'progress' && (
        <StatsDashboard stats={stats} tasks={tasks} auraPoints={auraPoints} streak={streak} />
      )}

      {/* ── TAB: STORY WEAVER (Phase 6) ──────────────── */}
      {activeTab === 'stories' && (
        <div className="glass-panel" style={{ minHeight: '500px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', textAlign: 'center' }}>
          <motion.div animate={{ rotate: [0, 5, -5, 0] }} transition={{ repeat: Infinity, duration: 4 }}>
            <Sparkles size={56} color="#a78bfa" />
          </motion.div>
          <div>
            <h2 className="outfit" style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '0.6rem' }}>Story Weaver Engine</h2>
            <p style={{ opacity: 0.5, fontSize: '0.9rem', maxWidth: '500px', lineHeight: 1.7 }}>
              Transform your saved quotes and principles into real-world SAO stories using ChatGPT — then convert the action steps into executable Chrono-Vault missions.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
            <button onClick={() => setIsStoryWeaverOpen(true)} className="btn-primary" style={{ padding: '1rem 2.5rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={16} /> Open Story Weaver
            </button>
            <button
              onClick={() => { setActiveTab('missions'); setTimeout(() => document.getElementById('new-mission-btn')?.click(), 100); }}
              className="btn-glass" style={{ padding: '1rem 2rem', fontSize: '0.85rem' }}>
              View Missions
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginTop: '1.5rem', width: '100%', maxWidth: '600px' }}>
            {[
              { emoji: '📚', title: 'Select Quote', desc: 'Pick from your saved inspiration vault or enter a custom principle' },
              { emoji: '🤖', title: 'Generate Story', desc: 'Auto-open ChatGPT with a pre-built SAO prompt — no API key needed' },
              { emoji: '🚀', title: 'Create Mission', desc: 'Parse action steps and inject them into a Chrono-Vault mission' },
            ].map((step, i) => (
              <div key={i} style={{ background: 'rgba(167,139,250,0.05)', border: '1px solid rgba(167,139,250,0.15)', borderRadius: '18px', padding: '1.2rem', textAlign: 'left' }}>
                <p style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{step.emoji}</p>
                <p style={{ fontWeight: 800, fontSize: '0.82rem', marginBottom: '0.3rem' }}>{step.title}</p>
                <p style={{ fontSize: '0.7rem', opacity: 0.5, lineHeight: 1.5 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* ── TAB: HISTORY (Phase 7) ──────────────────── */}
      {activeTab === 'history' && (
        <div className="glass-panel" style={{ minHeight: '700px' }}>
          <div className="flex-between" style={{ marginBottom: '3rem' }}>
            <h3 className="outfit flex-row gap-2" style={{ fontSize: '1.6rem' }}><History size={26} color="var(--accent)" /> Achievement History</h3>
            <p style={{ opacity: 0.5, fontSize: '0.8rem' }}>{archivedTasks.length} Archived Missions</p>
          </div>

          <div className="custom-scroll" style={{ overflowY: 'auto' }}>
            {archivedTasks.length === 0 && (
              <div style={{ textAlign: 'center', padding: '4rem', opacity: 0.3 }}>
                <History size={48} style={{ marginBottom: '1rem' }} />
                <p style={{ fontSize: '1rem', fontWeight: 700 }}>No history yet.</p>
                <p style={{ fontSize: '0.8rem', marginTop: '0.4rem' }}>Your archived missions will appear here.</p>
              </div>
            )}
            <AnimatePresence>
              {archivedTasks.map((task) => (
                <motion.div key={task.id} className="glass" style={{ padding: '1.5rem 2rem', borderRadius: '24px', marginBottom: '1rem', opacity: 0.7 }}>
                  <div className="flex-between">
                    <div>
                      <p className="outfit" style={{ fontSize: '1.2rem', fontWeight: 700, textDecoration: 'line-through' }}>{task.title}</p>
                      <p style={{ fontSize: '0.7rem', opacity: 0.5 }}>Created on {new Date(task.createdAt || '').toLocaleDateString()}</p>
                    </div>
                    <div className="flex-row gap-3">
                      <button onClick={() => archiveTask(task.id, false)} className="btn-glass" style={{ fontSize: '0.7rem', color: 'var(--accent)' }}>Restore Mission</button>
                      <button onClick={() => deleteTask(task.id)} className="btn-glass" style={{ padding: '0.5rem', color: '#ef4444' }}><Trash2 size={16} /></button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Story Weaver Modal */}
      {isStoryWeaverOpen && (
        <StoryWeaverModal
          quotes={globalQuotes}
          tasks={tasks}
          onClose={() => { setIsStoryWeaverOpen(false); fetchTasks(); }}
          onMissionCreated={handleMissionFromStory}
        />
      )}

      <AnimatePresence>{isSettingsOpen && (
         <div style={{ position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(50px)' }}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="glass-panel" style={{ width: '100%', maxWidth: '500px', padding: '3rem', borderRadius: '40px' }}>
               <div className="flex-between" style={{ marginBottom: '2.5rem' }}><h2 className="outfit flex-row gap-3"><ShieldCheck size={28} /> AI Control Sync</h2><button onClick={() => setIsSettingsOpen(false)} style={{ background: 'transparent', border: 'none', color: 'white' }}><X size={32} /></button></div>
               <div className="flex-column gap-6">
                  <div className="flex-column gap-2">
                     <label style={{ fontSize: '0.7rem', opacity: 0.6 }}>PREFERRED AGENT</label>
                     <select value={aiSettings.preferredModel} onChange={(e) => setAiSettings({...aiSettings, preferredModel: e.target.value as any})} style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '14px', color: 'white' }}>
                         <option value="gemini" style={{ color: 'black' }}>Google Gemini 1.5 Pro (Free Tier Helper)</option>
                         <option value="openai" style={{ color: 'black' }}>OpenAI GPT-4o (Paid/Quota Req)</option>
                     </select>
                  </div>
                  <div className="flex-column gap-2">
                     <label style={{ fontSize: '0.7rem', opacity: 0.6 }}>GEMINI API KEY (RECOMMENDED FREE)</label>
                     <input type="password" value={aiSettings.geminiApiKey} onChange={(e) => setAiSettings({...aiSettings, geminiApiKey: e.target.value})} placeholder="AIzaSy..." style={{ background: 'rgba(255,255,255,0.05)', padding: '1.2rem', borderRadius: '18px', color: 'white' }} />
                  </div>
                  <div className="flex-column gap-2">
                     <label style={{ fontSize: '0.7rem', opacity: 0.6 }}>OPENAI API KEY</label>
                     <input type="password" value={aiSettings.aiApiKey} onChange={(e) => setAiSettings({...aiSettings, aiApiKey: e.target.value})} placeholder="sk-..." style={{ background: 'rgba(255,255,255,0.05)', padding: '1.2rem', borderRadius: '18px', color: 'white' }} />
                  </div>
                  <button onClick={saveAiSettings} className="btn-primary" style={{ padding: '1.4rem' }}>SECURE UNIVERSAL HUB</button>
               </div>
            </motion.div>
         </div>
      )}</AnimatePresence>

      <AnimatePresence>{isTaskModalOpen && (
         <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(40px)' }}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="glass-panel" style={{ width: '100%', maxWidth: '900px', padding: '3.5rem', borderRadius: '40px', maxHeight: '95vh', overflowY: 'auto' }}>
               <div className="flex-between" style={{ marginBottom: '2.5rem' }}><h2 className="outfit">{editingTask ? 'Edit Protocol' : 'New Mastery Mission'}</h2><button onClick={() => setIsTaskModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'white' }}><X size={32} /></button></div>
               <form onSubmit={submitTask} className="flex-column gap-6">
                  <div className="flex-column gap-5">
                     <div className="flex-between"><label style={{ fontSize: '1.1rem', fontWeight: 700, opacity: 0.6 }}>Mission Identifier</label><button type="button" onClick={() => setIsAIPromptOpen(!isAIPromptOpen)} className="btn-glass" style={{ color: 'var(--accent)', animation: 'pulse 2s infinite' }}><Sparkles size={14} /> {aiSettings.preferredModel.toUpperCase()} AGENT ARCHITECT</button></div>
                     <input type="text" value={taskData.title} onChange={(e) => setTaskData({...taskData, title: e.target.value})} placeholder="e.g. Python Mastery" style={{ background: 'rgba(255,255,255,0.05)', padding: '1.4rem', borderRadius: '18px', color: 'white' }} />
                  </div>
                  
                  <AnimatePresence>{isAIPromptOpen && (
                     <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} style={{ overflow: 'hidden' }}>
                        <div className="flex-column gap-4" style={{ padding: '2rem', background: 'rgba(124, 58, 237, 0.05)', borderRadius: '30px', border: '2px solid var(--accent)' }}>
                           <div className="flex-row gap-2" style={{ color: 'var(--accent)', fontSize: '0.85rem', fontWeight: 800 }}><Terminal size={18} /> AI MASTERY ARCHITECT</div>

                           <div className="flex-row gap-4">
                              <div className="flex-column gap-2" style={{ flex: 1 }}>
                                 <label style={{ fontSize: '0.7rem', opacity: 0.6 }}>Target Days</label>
                                 <input type="number" value={targetDays} onChange={(e) => setTargetDays(e.target.value)} style={{ background: 'rgba(255,255,255,0.05)', padding: '0.8rem', borderRadius: '12px', color: 'white' }} />
                              </div>
                              <div className="flex-column gap-2" style={{ flex: 1 }}>
                                 <label style={{ fontSize: '0.7rem', opacity: 0.6 }}>Hours per Day</label>
                                 <input type="number" value={hoursPerDay} onChange={(e) => setHoursPerDay(e.target.value)} style={{ background: 'rgba(255,255,255,0.05)', padding: '0.8rem', borderRadius: '12px', color: 'white' }} />
                              </div>
                           </div>

                           <textarea value={aiPrompt} onChange={(e) => setAIPrompt(e.target.value)} placeholder="Paste your curriculum or learning goals here..." style={{ height: '110px', background: 'rgba(255,255,255,0.04)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', padding: '1rem', outline: 'none', resize: 'none' }} />

                           {/* PRIMARY: In-app AI generation */}
                           <button type="button" onClick={synthesizeAIPack} className="btn-primary" style={{ padding: '1rem', fontWeight: 800 }}>
                              {isGenerating ? <><Loader2 size={16} className="animate-spin" /> Generating Roadmap...</> : '✨ GENERATE ROADMAP'}
                           </button>

                           {/* FALLBACK: No API Key */}
                           <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1rem' }}>
                              <p style={{ fontSize: '0.7rem', opacity: 0.4, marginBottom: '0.8rem' }}>No API key? Use external AI and paste the result back:</p>
                              <div className="flex-row gap-2">
                                 <button type="button" onClick={openInChatGPT} className="btn-glass" style={{ flex: 1, fontSize: '0.75rem', padding: '0.6rem' }}>🤖 ChatGPT</button>
                                 <button type="button" onClick={openInGemini} className="btn-glass" style={{ flex: 1, fontSize: '0.75rem', padding: '0.6rem' }}>✨ Gemini</button>
                                 <button type="button" onClick={copyPrompt} className="btn-glass" style={{ flex: 1, fontSize: '0.75rem', padding: '0.6rem' }}>📋 Copy</button>
                              </div>
                              <textarea value={aiPasteResult} onChange={(e) => setAiPasteResult(e.target.value)} placeholder="Paste AI output here → click Inject" style={{ width: '100%', marginTop: '0.8rem', height: '80px', background: 'rgba(255,255,255,0.03)', color: 'white', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '0.8rem', outline: 'none', resize: 'none', fontSize: '0.8rem', boxSizing: 'border-box' }} />
                              <button type="button" onClick={injectAIPastedResult} className="btn-glass" style={{ width: '100%', marginTop: '0.5rem', padding: '0.7rem', fontSize: '0.8rem' }}>⚡ Inject Pasted Result</button>
                           </div>
                        </div>
                     </motion.div>
                  )}</AnimatePresence>

                  <div className="flex-column gap-4">
                     <div className="flex-between">
                        <div className="flex-column"><label style={{ fontSize: '1.1rem', fontWeight: 700, opacity: 0.6 }}>Chrono-Vault Lifecycle</label><p style={{ fontSize: '0.7rem', opacity: 0.4 }}>Outcome-Driven Mastery Injected</p></div>
                        <div className="flex-row gap-2">
                           <button type="button" onClick={() => { setIsBulkImportOpen(!isBulkImportOpen); setIsAIPromptOpen(false); }} className="btn-glass" style={{ padding: '0.5rem 1rem' }}><BookOpen size={14} /> Bulk Add Plan</button>
                           <button type="button" onClick={addManualSubTask} className="btn-glass" style={{ padding: '0.5rem 1rem' }}><Plus size={14} /> Add Node</button>
                        </div>
                     </div>

                     <AnimatePresence>{isBulkImportOpen && (
                        <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} style={{ overflow: 'hidden' }}>
                           <div className="flex-column gap-3" style={{ padding: '1.5rem', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)' }}>
                              <div className="flex-between">
                                 <label style={{ fontSize: '0.8rem', opacity: 0.6 }}>Paste text or Extract via AI:</label>
                                 <div className="flex-row gap-2">
                                    <button type="button" onClick={() => {
                                      const p = "Please extract the chronological roadmap or curriculum from the document I am about to upload. Format the output as a simple list of days: \nDay 1: ...\nDay 2: ...";
                                      navigator.clipboard.writeText(p);
                                      alert("Extraction Prompt copied! Upload your file to ChatGPT/Gemini and paste the prompt.");
                                      window.open("https://chatgpt.com", "_blank");
                                    }} className="btn-glass" style={{ fontSize: '0.65rem', padding: '0.4rem 0.8rem' }}>AI EXTRACTION HELPER</button>
                                    <label style={{ cursor: 'pointer', background: 'var(--accent)', padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 600 }}>
                                       {isProcessingFile ? 'EXTRACTING...' : 'UPLOAD PDF/JPG (GEMINI)'}
                                       <input type="file" accept="application/pdf,image/*" onChange={handleFileUpload} style={{ display: 'none' }} disabled={isProcessingFile} />
                                    </label>
                                 </div>
                              </div>
                              <textarea value={bulkImportText} onChange={e => setBulkImportText(e.target.value)} placeholder="Day 1: Learn UI Design&#10;Day 2: Build App&#10;Day 3: Deploy" style={{ height: '100px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '12px', padding: '1rem', outline: 'none' }} />
                              <button type="button" onClick={handleBulkImport} className="btn-primary" style={{ padding: '0.8rem', fontWeight: 800 }}>IMPORT TEXT ALONE</button>
                           </div>
                        </motion.div>
                     )}</AnimatePresence>

                     <div className="custom-scroll" style={{ maxHeight: '350px', overflowY: 'auto' }}>
                        <div className="flex-column gap-3">
                           {manualSubTasks.map((st) => (
                              <div key={st.id} className="flex-row gap-3">
                                 <div style={{ display: 'flex', alignItems: 'center' }}>{getDayIcon(st.title)}</div>
                                 <input type="text" value={st.title} onChange={(e) => updateSubTaskTitle(st.id, e.target.value)} placeholder="Node Title" style={{ flex: 1, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', padding: '1rem', borderRadius: '14px', color: 'white' }} />
                                 <button type="button" onClick={() => removeSubTask(st.id)} className="btn-glass" style={{ color: '#ef4444', border: 'none' }}><Trash2 size={18} /></button>
                              </div>
                           ))}
                        </div>
                     </div>
                  </div>
                  
                  <button type="submit" className="btn-primary" style={{ padding: '1.5rem', fontWeight: 800 }}>SECURE REFINED MISSION</button>
               </form>
            </motion.div>
         </div>
      )}</AnimatePresence>
    </div>
  );
}
