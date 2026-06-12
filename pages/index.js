import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

const STATUSES = ['Not started', 'In progress', 'Blocked', 'Done'];

const STATUS_STYLES = {
  'Not started': 'bg-slate-100 text-slate-500',
  'In progress': 'bg-violet-100 text-violet-700',
  'Blocked': 'bg-orange-100 text-orange-700',
  'Done': 'bg-emerald-100 text-emerald-700',
};

const MILESTONE_THEMES = [
  {
    gradient: 'from-violet-500 to-purple-600',
    bg: 'bg-violet-50',
    border: 'border-violet-200',
    bar: 'from-violet-400 to-purple-500',
    text: 'text-violet-600',
    badge: 'bg-violet-100 text-violet-700',
    glow: 'shadow-violet-100',
  },
  {
    gradient: 'from-sky-500 to-blue-600',
    bg: 'bg-sky-50',
    border: 'border-sky-200',
    bar: 'from-sky-400 to-blue-500',
    text: 'text-sky-600',
    badge: 'bg-sky-100 text-sky-700',
    glow: 'shadow-sky-100',
  },
  {
    gradient: 'from-emerald-500 to-teal-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    bar: 'from-emerald-400 to-teal-500',
    text: 'text-emerald-600',
    badge: 'bg-emerald-100 text-emerald-700',
    glow: 'shadow-emerald-100',
  },
  {
    gradient: 'from-orange-500 to-amber-500',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    bar: 'from-orange-400 to-amber-500',
    text: 'text-orange-600',
    badge: 'bg-orange-100 text-orange-700',
    glow: 'shadow-orange-100',
  },
  {
    gradient: 'from-pink-500 to-rose-500',
    bg: 'bg-pink-50',
    border: 'border-pink-200',
    bar: 'from-pink-400 to-rose-500',
    text: 'text-pink-600',
    badge: 'bg-pink-100 text-pink-700',
    glow: 'shadow-pink-100',
  },
];

function isOverdue(item) {
  if (!item.due || item.status === 'Done') return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(item.due) < today;
}

function formatDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function IconDashboard() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="1.5" y="1.5" width="5.5" height="5.5" rx="1.5" fill="currentColor" />
      <rect x="9" y="1.5" width="5.5" height="5.5" rx="1.5" fill="currentColor" />
      <rect x="1.5" y="9" width="5.5" height="5.5" rx="1.5" fill="currentColor" />
      <rect x="9" y="9" width="5.5" height="5.5" rx="1.5" fill="currentColor" />
    </svg>
  );
}

function IconMilestone() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8 1.5L9.9 5.4L14.2 6.1L11.1 9.1L11.8 13.4L8 11.4L4.2 13.4L4.9 9.1L1.8 6.1L6.1 5.4L8 1.5Z" fill="currentColor" />
    </svg>
  );
}

function IconTasks() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M2.5 4.5H13.5M2.5 8H10M2.5 11.5H12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function IconChevron({ collapsed }) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" className={`transition-transform duration-200 ${collapsed ? '' : 'rotate-90'}`}>
      <path d="M3 2L9 6L3 10" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconClose() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <path d="M2 2L11 11M11 2L2 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export default function Home() {
  const [items, setItems] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(null);
  const [collapsed, setCollapsed] = useState({});
  const [showMilestoneForm, setShowMilestoneForm] = useState(false);
  const [taskFormFor, setTaskFormFor] = useState(null);
  const [expandedNotes, setExpandedNotes] = useState({});
  const [activeSection, setActiveSection] = useState('dashboard');
  const [statusFilter, setStatusFilter] = useState('All');

  const [milestoneForm, setMilestoneForm] = useState({ title: '', due: '', notes: '' });
  const [taskForm, setTaskForm] = useState({ title: '', status: 'Not started', due: '', notes: '' });

  const fetchItems = useCallback(async () => {
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .order('id', { ascending: true });
    if (error) { setError(error.message); }
    else { setItems(data); setError(null); }
    setLoaded(true);
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const milestones = useMemo(() => items.filter((i) => i.type === 'Milestone'), [items]);
  const allTasks = useMemo(() => items.filter((i) => i.type === 'Task'), [items]);

  const stats = useMemo(() => {
    const total = items.length;
    const done = items.filter((i) => i.status === 'Done').length;
    const inProgress = items.filter((i) => i.status === 'In progress').length;
    const blocked = items.filter((i) => i.status === 'Blocked').length;
    const overdue = items.filter(isOverdue).length;
    const overallPct = total === 0 ? 0 : Math.round((done / total) * 100);
    return { total, done, inProgress, blocked, overdue, overallPct };
  }, [items]);

  const tasksFor = useCallback(
    (milestoneId) => items.filter((i) => i.parent === milestoneId),
    [items],
  );

  const progressFor = useCallback(
    (milestoneId) => {
      const tasks = tasksFor(milestoneId);
      if (tasks.length === 0) return null;
      const done = tasks.filter((t) => t.status === 'Done').length;
      return { pct: Math.round((done / tasks.length) * 100), done, total: tasks.length };
    },
    [tasksFor],
  );

  async function cycleStatus(id) {
    const item = items.find((i) => i.id === id);
    const idx = STATUSES.indexOf(item.status);
    const newStatus = STATUSES[(idx + 1) % STATUSES.length];
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, status: newStatus } : i)));
    const { error } = await supabase.from('items').update({ status: newStatus }).eq('id', id);
    if (error) { setError(error.message); fetchItems(); }
  }

  async function deleteItem(id) {
    setItems((prev) => prev.filter((i) => i.id !== id && i.parent !== id));
    const { error } = await supabase.from('items').delete().eq('id', id);
    if (error) { setError(error.message); fetchItems(); }
  }

  async function updateNotes(id, notes) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, notes } : i)));
    const { error } = await supabase.from('items').update({ notes }).eq('id', id);
    if (error) setError(error.message);
  }

  async function saveMilestone() {
    const title = milestoneForm.title.trim();
    if (!title) return;
    const { data, error } = await supabase
      .from('items')
      .insert({ title, type: 'Milestone', status: 'Not started', due: milestoneForm.due || null, parent: null, notes: milestoneForm.notes })
      .select()
      .single();
    if (error) { setError(error.message); }
    else { setItems((prev) => [...prev, data]); setMilestoneForm({ title: '', due: '', notes: '' }); setShowMilestoneForm(false); }
  }

  async function saveTask(parentId) {
    const title = taskForm.title.trim();
    if (!title) return;
    const { data, error } = await supabase
      .from('items')
      .insert({ title, type: 'Task', status: taskForm.status, due: taskForm.due || null, parent: parentId || null, notes: taskForm.notes })
      .select()
      .single();
    if (error) { setError(error.message); }
    else { setItems((prev) => [...prev, data]); setTaskForm({ title: '', status: 'Not started', due: '', notes: '' }); setTaskFormFor(null); }
  }

  const toggleCollapse = (id) => setCollapsed((p) => ({ ...p, [id]: !p[id] }));
  const toggleNotes = (id) => setExpandedNotes((p) => ({ ...p, [id]: !p[id] }));

  if (!loaded) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-400 to-purple-600 mx-auto mb-4 animate-pulse" />
          <p className="text-sm text-slate-400">Loading…</p>
        </div>
      </div>
    );
  }

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <IconDashboard /> },
    { id: 'milestones', label: 'Milestones', icon: <IconMilestone />, count: milestones.length },
    { id: 'tasks', label: 'Tasks', icon: <IconTasks />, count: allTasks.length },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* ── Sidebar ── */}
      <aside className="fixed inset-y-0 left-0 w-56 bg-gradient-to-b from-slate-900 to-slate-800 flex flex-col z-20 shadow-2xl">
        {/* Logo */}
        <div className="px-4 pt-6 pb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-400 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-900/40 flex-shrink-0">
              <span className="text-white font-bold font-display text-sm">U</span>
            </div>
            <div>
              <p className="text-white font-bold text-sm font-display leading-none">Useno</p>
              <p className="text-slate-500 text-[10px] mt-0.5">Tracker</p>
            </div>
          </div>
        </div>

        <div className="mx-4 h-px bg-white/[0.06] mb-3" />

        {/* Nav */}
        <nav className="flex-1 px-2.5 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150 ${
                activeSection === item.id
                  ? 'bg-white/10 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
              }`}
            >
              <span className={activeSection === item.id ? 'opacity-100' : 'opacity-50'}>{item.icon}</span>
              <span className="flex-1 text-left">{item.label}</span>
              {item.count !== undefined && (
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${
                  activeSection === item.id ? 'bg-white/20 text-white' : 'bg-white/[0.07] text-slate-500'
                }`}>
                  {item.count}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Overall progress widget */}
        <div className="mx-3 mb-4 p-3.5 rounded-xl bg-white/[0.05] border border-white/[0.07]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] text-slate-400 font-medium">Overall</span>
            <span className="text-[11px] text-white font-bold">{stats.overallPct}%</span>
          </div>
          <div className="h-1.5 bg-white/[0.08] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-violet-400 to-purple-500 rounded-full transition-all duration-700"
              style={{ width: `${stats.overallPct}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-[10px] text-slate-500">{stats.done}/{stats.total} done</span>
            {stats.overdue > 0 && (
              <span className="text-[10px] text-orange-400 font-semibold">{stats.overdue} overdue</span>
            )}
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="ml-56 flex-1 min-h-screen">
        {error && (
          <div className="m-6 p-3 rounded-xl bg-orange-50 border border-orange-200 text-orange-700 text-sm">
            Connection error: {error}
          </div>
        )}

        {activeSection === 'dashboard' && (
          <DashboardView
            stats={stats}
            milestones={milestones}
            progressFor={progressFor}
            setActiveSection={setActiveSection}
          />
        )}
        {activeSection === 'milestones' && (
          <MilestonesView
            milestones={milestones}
            collapsed={collapsed}
            expandedNotes={expandedNotes}
            showMilestoneForm={showMilestoneForm}
            setShowMilestoneForm={setShowMilestoneForm}
            milestoneForm={milestoneForm}
            setMilestoneForm={setMilestoneForm}
            taskForm={taskForm}
            setTaskForm={setTaskForm}
            taskFormFor={taskFormFor}
            setTaskFormFor={setTaskFormFor}
            tasksFor={tasksFor}
            progressFor={progressFor}
            cycleStatus={cycleStatus}
            deleteItem={deleteItem}
            updateNotes={updateNotes}
            toggleCollapse={toggleCollapse}
            toggleNotes={toggleNotes}
            saveMilestone={saveMilestone}
            saveTask={saveTask}
            expandedNotes={expandedNotes}
          />
        )}
        {activeSection === 'tasks' && (
          <TasksView
            allTasks={allTasks}
            milestones={milestones}
            taskForm={taskForm}
            setTaskForm={setTaskForm}
            taskFormFor={taskFormFor}
            setTaskFormFor={setTaskFormFor}
            cycleStatus={cycleStatus}
            deleteItem={deleteItem}
            updateNotes={updateNotes}
            toggleNotes={toggleNotes}
            expandedNotes={expandedNotes}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            saveTask={saveTask}
          />
        )}
      </main>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Dashboard view
───────────────────────────────────────────── */
function DashboardView({ stats, milestones, progressFor, setActiveSection }) {
  return (
    <div className="p-6 lg:p-10 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 font-display">Dashboard</h1>
        <p className="text-slate-400 text-sm mt-1">Your project at a glance.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <BigStatCard label="Total items" value={stats.total} gradient="from-slate-700 to-slate-900" sub={`${stats.total} tracked`} />
        <BigStatCard label="Completed" value={stats.done} gradient="from-emerald-500 to-teal-600" sub="items done" />
        <BigStatCard label="In progress" value={stats.inProgress} gradient="from-violet-500 to-purple-600" sub="in flight" />
        <BigStatCard
          label="Overdue"
          value={stats.overdue}
          gradient={stats.overdue > 0 ? 'from-orange-500 to-red-500' : 'from-slate-400 to-slate-500'}
          sub={stats.overdue > 0 ? 'need attention' : 'all on track'}
        />
      </div>

      {/* Overall progress */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-8">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="font-bold text-slate-900 font-display text-lg">Overall progress</h2>
            <p className="text-sm text-slate-400 mt-0.5">{stats.done} of {stats.total} items completed</p>
          </div>
          <span className="text-4xl font-bold text-slate-900">{stats.overallPct}%</span>
        </div>
        <div className="h-4 bg-slate-100 rounded-full overflow-hidden mb-4">
          <div
            className="h-full bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 rounded-full transition-all duration-700 shadow-sm"
            style={{ width: `${stats.overallPct}%` }}
          />
        </div>
        <div className="flex items-center gap-5 flex-wrap">
          <LegendDot color="bg-emerald-500" label={`Done: ${stats.done}`} />
          <LegendDot color="bg-violet-500" label={`In progress: ${stats.inProgress}`} />
          {stats.blocked > 0 && <LegendDot color="bg-orange-500" label={`Blocked: ${stats.blocked}`} className="text-orange-600 font-medium" />}
          {stats.overdue > 0 && <LegendDot color="bg-red-500" label={`Overdue: ${stats.overdue}`} className="text-red-600 font-medium" />}
        </div>
      </div>

      {/* Milestones overview */}
      {milestones.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-slate-900 font-display text-lg">Milestones</h2>
            <button
              onClick={() => setActiveSection('milestones')}
              className="text-sm text-violet-600 hover:text-violet-700 font-semibold transition-colors"
            >
              View all →
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {milestones.map((m, idx) => {
              const theme = MILESTONE_THEMES[idx % MILESTONE_THEMES.length];
              const progress = progressFor(m.id);
              const overdue = isOverdue(m);
              return (
                <div key={m.id} className={`rounded-2xl border p-5 ${theme.bg} ${theme.border} shadow-sm`}>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <p className="font-semibold text-slate-800 text-sm font-display leading-snug">{m.title}</p>
                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg flex-shrink-0 ${STATUS_STYLES[m.status]}`}>
                      {m.status}
                    </span>
                  </div>

                  {progress !== null ? (
                    <>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className={`text-xs font-bold ${theme.text}`}>{progress.pct}%</span>
                        <span className="text-xs text-slate-400">{progress.done}/{progress.total} tasks</span>
                      </div>
                      <div className="h-2.5 bg-white/70 rounded-full overflow-hidden shadow-inner">
                        <div
                          className={`h-full bg-gradient-to-r ${theme.bar} rounded-full transition-all duration-500`}
                          style={{ width: `${progress.pct}%` }}
                        />
                      </div>
                    </>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No tasks yet</p>
                  )}

                  {m.due && (
                    <p className={`text-xs mt-2.5 font-medium ${overdue ? 'text-orange-600' : 'text-slate-400'}`}>
                      Due {formatDate(m.due)}{overdue ? ' · overdue' : ''}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {milestones.length === 0 && (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center mx-auto mb-4 text-violet-400">
            <IconMilestone />
          </div>
          <p className="text-slate-500 font-medium font-display mb-1">No milestones yet</p>
          <p className="text-slate-400 text-sm mb-5">Start by creating your first milestone</p>
          <button
            onClick={() => setActiveSection('milestones')}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white text-sm font-semibold shadow-lg shadow-violet-200 hover:shadow-violet-300 transition-all"
          >
            Go to Milestones →
          </button>
        </div>
      )}
    </div>
  );
}

function BigStatCard({ label, value, gradient, sub }) {
  return (
    <div className={`rounded-2xl p-5 bg-gradient-to-br ${gradient} text-white shadow-lg`}>
      <p className="text-white/60 text-xs font-medium mb-1">{label}</p>
      <p className="text-4xl font-bold mb-1">{value}</p>
      <p className="text-white/50 text-xs">{sub}</p>
    </div>
  );
}

function LegendDot({ color, label, className }) {
  return (
    <span className={`flex items-center gap-1.5 text-xs text-slate-500 ${className || ''}`}>
      <span className={`w-2.5 h-2.5 rounded-full ${color} flex-shrink-0`} />
      {label}
    </span>
  );
}

/* ─────────────────────────────────────────────
   Milestones view
───────────────────────────────────────────── */
function MilestonesView({
  milestones, collapsed, expandedNotes,
  showMilestoneForm, setShowMilestoneForm,
  milestoneForm, setMilestoneForm,
  taskForm, setTaskForm, taskFormFor, setTaskFormFor,
  tasksFor, progressFor, cycleStatus, deleteItem, updateNotes,
  toggleCollapse, toggleNotes, saveMilestone, saveTask,
}) {
  return (
    <div className="p-6 lg:p-10 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-display">Milestones</h1>
          <p className="text-slate-400 text-sm mt-1">
            {milestones.length} milestone{milestones.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setShowMilestoneForm((s) => !s)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white text-sm font-semibold shadow-md shadow-violet-200 hover:shadow-violet-300 hover:scale-[1.02] active:scale-[0.98] transition-all duration-150"
        >
          <span className="text-lg leading-none">+</span>
          New milestone
        </button>
      </div>

      {/* Create milestone form */}
      {showMilestoneForm && (
        <div className="bg-white rounded-2xl border border-violet-100 shadow-sm shadow-violet-50 p-5 mb-6">
          <h3 className="font-bold text-slate-800 mb-4 font-display">New milestone</h3>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Milestone title"
              className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all bg-slate-50 focus:bg-white"
              value={milestoneForm.title}
              onChange={(e) => setMilestoneForm({ ...milestoneForm, title: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && saveMilestone()}
              autoFocus
            />
            <input
              type="date"
              className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all bg-slate-50 focus:bg-white"
              value={milestoneForm.due}
              onChange={(e) => setMilestoneForm({ ...milestoneForm, due: e.target.value })}
            />
            <textarea
              placeholder="Notes (optional)"
              rows={2}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all resize-none bg-slate-50 focus:bg-white"
              value={milestoneForm.notes}
              onChange={(e) => setMilestoneForm({ ...milestoneForm, notes: e.target.value })}
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowMilestoneForm(false)}
                className="h-9 px-4 rounded-xl border border-slate-200 text-sm font-medium text-slate-500 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveMilestone}
                className="h-9 px-4 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white text-sm font-semibold shadow-sm hover:shadow-md transition-all"
              >
                Save milestone
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Milestone cards */}
      <div className="space-y-5">
        {milestones.map((m, idx) => {
          const theme = MILESTONE_THEMES[idx % MILESTONE_THEMES.length];
          const tasks = tasksFor(m.id);
          const progress = progressFor(m.id);
          const isCollapsed = collapsed[m.id];
          const overdue = isOverdue(m);
          const notesOpen = (m.notes && expandedNotes[m.id] !== false) || (!m.notes && expandedNotes[m.id]);

          return (
            <div key={m.id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${theme.border}`}>
              {/* Colorful top stripe */}
              <div className={`h-1.5 bg-gradient-to-r ${theme.bar}`} />

              <div className="p-5">
                <div className="flex items-start gap-3">
                  {/* Collapse toggle */}
                  <button
                    onClick={() => toggleCollapse(m.id)}
                    className="mt-0.5 w-6 h-6 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors flex-shrink-0"
                  >
                    <IconChevron collapsed={isCollapsed} />
                  </button>

                  <div className="flex-1 min-w-0">
                    {/* Title row */}
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-bold text-slate-900 text-sm font-display leading-snug">{m.title}</p>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          onClick={() => cycleStatus(m.id)}
                          className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${STATUS_STYLES[m.status]}`}
                        >
                          {m.status}
                        </button>
                        <button
                          onClick={() => deleteItem(m.id)}
                          className="w-7 h-7 flex items-center justify-center text-slate-300 hover:text-red-400 transition-colors"
                        >
                          <IconClose />
                        </button>
                      </div>
                    </div>

                    {/* Meta */}
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      {m.due && (
                        <span className={`text-xs font-medium ${overdue ? 'text-orange-600' : 'text-slate-400'}`}>
                          {formatDate(m.due)}{overdue ? ' · overdue' : ''}
                        </span>
                      )}
                      {progress !== null && (
                        <span className="text-xs text-slate-400">
                          {progress.done}/{progress.total} tasks
                        </span>
                      )}
                    </div>

                    {/* Progress bar */}
                    {progress !== null && (
                      <div className="mt-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-sm font-bold ${theme.text}`}>{progress.pct}%</span>
                          <span className="text-xs text-slate-400">{progress.done} of {progress.total} tasks completed</span>
                        </div>
                        <div className="h-3 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                          <div
                            className={`h-full bg-gradient-to-r ${theme.bar} rounded-full transition-all duration-500 shadow-sm`}
                            style={{ width: `${progress.pct}%` }}
                          />
                        </div>
                        {/* Mini task status breakdown */}
                        <div className="flex gap-3 mt-2">
                          {['Done', 'In progress', 'Blocked', 'Not started'].map((s) => {
                            const count = tasks.filter((t) => t.status === s).length;
                            if (count === 0) return null;
                            return (
                              <span key={s} className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${STATUS_STYLES[s]}`}>
                                {s}: {count}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Notes */}
                    {notesOpen && (
                      <textarea
                        className="w-full mt-3 px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-600 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 resize-y transition-all min-h-[2.5rem] bg-slate-50 focus:bg-white"
                        rows={Math.max(2, Math.ceil((m.notes || '').length / 70))}
                        placeholder="Add notes…"
                        value={m.notes || ''}
                        onChange={(e) => updateNotes(m.id, e.target.value)}
                      />
                    )}
                    <button
                      onClick={() => toggleNotes(m.id)}
                      className="mt-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {notesOpen ? 'Hide notes' : m.notes ? 'Show notes' : 'Add notes'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Task list */}
              {!isCollapsed && (
                <div className="border-t border-slate-50">
                  {tasks.map((t) => (
                    <TaskRow
                      key={t.id}
                      task={t}
                      onCycle={() => cycleStatus(t.id)}
                      onDelete={() => deleteItem(t.id)}
                      onToggleNotes={() => toggleNotes(t.id)}
                      notesExpanded={expandedNotes[t.id]}
                      onUpdateNotes={(v) => updateNotes(t.id, v)}
                      indented
                    />
                  ))}

                  {taskFormFor === m.id ? (
                    <div className="p-4 pl-14 border-t border-slate-50 bg-slate-50/60 space-y-2">
                      <input
                        type="text"
                        placeholder="Task title"
                        className="w-full h-9 px-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 bg-white"
                        value={taskForm.title}
                        onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                        onKeyDown={(e) => e.key === 'Enter' && saveTask(m.id)}
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <select
                          className="h-9 px-3 rounded-xl border border-slate-200 text-sm flex-1 outline-none focus:border-violet-400 bg-white"
                          value={taskForm.status}
                          onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value })}
                        >
                          {STATUSES.map((s) => <option key={s}>{s}</option>)}
                        </select>
                        <input
                          type="date"
                          className="h-9 px-3 rounded-xl border border-slate-200 text-sm flex-1 outline-none focus:border-violet-400 bg-white"
                          value={taskForm.due}
                          onChange={(e) => setTaskForm({ ...taskForm, due: e.target.value })}
                        />
                      </div>
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => setTaskFormFor(null)}
                          className="h-8 px-3 rounded-lg text-xs text-slate-500 hover:bg-slate-100 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => saveTask(m.id)}
                          className="h-8 px-3 rounded-lg bg-gradient-to-r from-violet-500 to-purple-600 text-white text-xs font-semibold shadow-sm"
                        >
                          Add task
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setTaskFormFor(m.id);
                        setTaskForm({ title: '', status: 'Not started', due: '', notes: '' });
                      }}
                      className="w-full text-left pl-14 pr-5 py-3 text-xs text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                      + Add task
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {milestones.length === 0 && !showMilestoneForm && (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-50 to-purple-100 flex items-center justify-center mx-auto mb-4 text-violet-400">
              <IconMilestone />
            </div>
            <p className="text-slate-600 font-semibold font-display mb-1">No milestones yet</p>
            <p className="text-slate-400 text-sm mb-5">Create your first milestone to start tracking progress</p>
            <button
              onClick={() => setShowMilestoneForm(true)}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white text-sm font-semibold shadow-lg shadow-violet-200"
            >
              + New milestone
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Tasks view
───────────────────────────────────────────── */
function TasksView({
  allTasks, milestones, taskForm, setTaskForm, taskFormFor, setTaskFormFor,
  cycleStatus, deleteItem, updateNotes, toggleNotes, expandedNotes,
  statusFilter, setStatusFilter, saveTask,
}) {
  const STANDALONE_ID = '__standalone__';
  const filtered = statusFilter === 'All' ? allTasks : allTasks.filter((t) => t.status === statusFilter);

  const getMilestoneName = (parentId) => {
    if (!parentId) return null;
    return milestones.find((m) => m.id === parentId)?.title || null;
  };

  return (
    <div className="p-6 lg:p-10 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-display">Tasks</h1>
          <p className="text-slate-400 text-sm mt-1">{allTasks.length} task{allTasks.length !== 1 ? 's' : ''} total</p>
        </div>
        <button
          onClick={() => {
            setTaskFormFor(STANDALONE_ID);
            setTaskForm({ title: '', status: 'Not started', due: '', notes: '' });
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-slate-700 to-slate-900 text-white text-sm font-semibold shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-150"
        >
          <span className="text-lg leading-none">+</span>
          New task
        </button>
      </div>

      {/* Standalone task form */}
      {taskFormFor === STANDALONE_ID && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 mb-6">
          <h3 className="font-bold text-slate-800 mb-4 font-display">New standalone task</h3>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Task title"
              className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all bg-slate-50 focus:bg-white"
              value={taskForm.title}
              onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && saveTask(null)}
              autoFocus
            />
            <div className="flex gap-2">
              <select
                className="h-10 px-3 rounded-xl border border-slate-200 text-sm flex-1 outline-none focus:border-violet-400 bg-slate-50"
                value={taskForm.status}
                onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value })}
              >
                {STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
              <input
                type="date"
                className="h-10 px-3 rounded-xl border border-slate-200 text-sm flex-1 outline-none focus:border-violet-400 bg-slate-50"
                value={taskForm.due}
                onChange={(e) => setTaskForm({ ...taskForm, due: e.target.value })}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setTaskFormFor(null)}
                className="h-9 px-4 rounded-xl border border-slate-200 text-sm font-medium text-slate-500 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => saveTask(null)}
                className="h-9 px-4 rounded-xl bg-gradient-to-r from-slate-700 to-slate-900 text-white text-sm font-semibold shadow-sm"
              >
                Add task
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status filter pills */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {['All', ...STATUSES].map((s) => {
          const count = s === 'All' ? allTasks.length : allTasks.filter((t) => t.status === s).length;
          const active = statusFilter === s;
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                active
                  ? s === 'All'
                    ? 'bg-slate-900 text-white shadow-md'
                    : s === 'Not started'
                      ? 'bg-slate-200 text-slate-700 shadow-md'
                      : s === 'In progress'
                        ? 'bg-violet-200 text-violet-800 shadow-md shadow-violet-100'
                        : s === 'Blocked'
                          ? 'bg-orange-200 text-orange-800 shadow-md shadow-orange-100'
                          : 'bg-emerald-200 text-emerald-800 shadow-md shadow-emerald-100'
                  : 'bg-white border border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700'
              }`}
            >
              {s}
              <span className="ml-1.5 opacity-60">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Task list */}
      {filtered.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {filtered.map((t) => {
            const milestoneName = getMilestoneName(t.parent);
            const overdue = isOverdue(t);
            return (
              <div key={t.id} className="border-b border-slate-50 last:border-b-0 hover:bg-slate-50/50 transition-colors">
                <div className="flex items-start gap-3 px-5 py-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-800 font-medium leading-snug">{t.title}</p>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          {milestoneName && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-violet-100 text-violet-600">
                              {milestoneName}
                            </span>
                          )}
                          {!t.parent && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-400">
                              Standalone
                            </span>
                          )}
                          {t.due && (
                            <span className={`text-xs font-medium ${overdue ? 'text-orange-600' : 'text-slate-400'}`}>
                              {formatDate(t.due)}{overdue ? ' · overdue' : ''}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          onClick={() => cycleStatus(t.id)}
                          className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${STATUS_STYLES[t.status]}`}
                        >
                          {t.status}
                        </button>
                        <button
                          onClick={() => deleteItem(t.id)}
                          className="w-7 h-7 flex items-center justify-center text-slate-300 hover:text-red-400 transition-colors"
                        >
                          <IconClose />
                        </button>
                      </div>
                    </div>
                    {expandedNotes[t.id] && (
                      <textarea
                        className="w-full mt-2 px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-600 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 resize-none bg-slate-50 focus:bg-white"
                        rows={2}
                        placeholder="Add notes…"
                        value={t.notes || ''}
                        onChange={(e) => updateNotes(t.id, e.target.value)}
                      />
                    )}
                    <button
                      onClick={() => toggleNotes(t.id)}
                      className="mt-1 text-xs text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {expandedNotes[t.id] ? 'Hide notes' : 'Notes'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-slate-400 text-sm">No tasks matching "{statusFilter}"</p>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Shared TaskRow (used in MilestonesView)
───────────────────────────────────────────── */
function TaskRow({ task, onCycle, onDelete, onToggleNotes, notesExpanded, onUpdateNotes, indented }) {
  const overdue = isOverdue(task);
  return (
    <div className="border-b border-slate-50 last:border-b-0 hover:bg-slate-50/50 transition-colors">
      <div className={`flex items-start gap-3 px-5 py-3.5 ${indented ? 'pl-14' : ''}`}>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm text-slate-700 leading-snug">{task.title}</p>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                onClick={onCycle}
                className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${STATUS_STYLES[task.status]}`}
              >
                {task.status}
              </button>
              <button
                onClick={onDelete}
                className="w-7 h-7 flex items-center justify-center text-slate-300 hover:text-red-400 transition-colors"
              >
                <IconClose />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-1">
            {task.due && (
              <span className={`text-xs font-medium ${overdue ? 'text-orange-600' : 'text-slate-400'}`}>
                {formatDate(task.due)}{overdue ? ' · overdue' : ''}
              </span>
            )}
            <button onClick={onToggleNotes} className="text-xs text-slate-400 hover:text-slate-600 transition-colors">
              {notesExpanded ? 'Hide notes' : 'Notes'}
            </button>
          </div>
          {notesExpanded && (
            <textarea
              className="w-full mt-2 px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 resize-none bg-white"
              rows={2}
              placeholder="Add notes…"
              value={task.notes || ''}
              onChange={(e) => onUpdateNotes(e.target.value)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
