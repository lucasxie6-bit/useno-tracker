import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

const STATUSES = ['Not started', 'In progress', 'Blocked', 'Done'];

const STATUS_STYLES = {
  'Not started': 'bg-black/[0.04] text-muted',
  'In progress': 'bg-sky-50 text-sky-800',
  'Blocked': 'bg-clay-50 text-clay-800',
  'Done': 'bg-sage-50 text-sage-800',
};

// Cycling accent palette for milestone cards — left border + soft tinted background
const MILESTONE_THEMES = [
  { border: 'border-l-sage-400', bg: 'bg-sage-50/40' },
  { border: 'border-l-sky-400', bg: 'bg-sky-50/40' },
  { border: 'border-l-clay-400', bg: 'bg-clay-50/40' },
  { border: 'border-l-sand-400', bg: 'bg-sand-50/40' },
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

export default function Home() {
  const [items, setItems] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(null);
  const [collapsed, setCollapsed] = useState({});
  const [showMilestoneForm, setShowMilestoneForm] = useState(false);
  const [taskFormFor, setTaskFormFor] = useState(null);
  const [expandedNotes, setExpandedNotes] = useState({});

  const [milestoneForm, setMilestoneForm] = useState({ title: '', due: '', notes: '' });
  const [taskForm, setTaskForm] = useState({ title: '', status: 'Not started', due: '', notes: '' });

  const fetchItems = useCallback(async () => {
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      setError(error.message);
    } else {
      setItems(data);
      setError(null);
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const milestones = useMemo(() => items.filter((i) => i.type === 'Milestone'), [items]);
  const standaloneTasks = useMemo(() => items.filter((i) => i.type === 'Task' && !i.parent), [items]);

  const stats = useMemo(() => {
    const total = items.length;
    const done = items.filter((i) => i.status === 'Done').length;
    const overdue = items.filter(isOverdue).length;
    return { total, done, overdue };
  }, [items]);

  function tasksFor(milestoneId) {
    return items.filter((i) => i.parent === milestoneId);
  }

  function progressFor(milestoneId) {
    const tasks = tasksFor(milestoneId);
    if (tasks.length === 0) return null;
    const done = tasks.filter((t) => t.status === 'Done').length;
    return Math.round((done / tasks.length) * 100);
  }

  async function cycleStatus(id) {
    const item = items.find((i) => i.id === id);
    const idx = STATUSES.indexOf(item.status);
    const newStatus = STATUSES[(idx + 1) % STATUSES.length];

    // optimistic update
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, status: newStatus } : i)));

    const { error } = await supabase.from('items').update({ status: newStatus }).eq('id', id);
    if (error) {
      setError(error.message);
      fetchItems();
    }
  }

  async function deleteItem(id) {
    // optimistic update — also drop any tasks whose parent is this id (cascade handles DB side)
    setItems((prev) => prev.filter((i) => i.id !== id && i.parent !== id));

    const { error } = await supabase.from('items').delete().eq('id', id);
    if (error) {
      setError(error.message);
      fetchItems();
    }
  }

  async function updateNotes(id, notes) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, notes } : i)));
    const { error } = await supabase.from('items').update({ notes }).eq('id', id);
    if (error) setError(error.message);
  }

  function toggleCollapse(id) {
    setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function toggleNotes(id) {
    setExpandedNotes((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  async function saveMilestone() {
    const title = milestoneForm.title.trim();
    if (!title) return;

    const { data, error } = await supabase
      .from('items')
      .insert({
        title, type: 'Milestone', status: 'Not started',
        due: milestoneForm.due || null, parent: null, notes: milestoneForm.notes,
      })
      .select()
      .single();

    if (error) {
      setError(error.message);
    } else {
      setItems((prev) => [...prev, data]);
      setMilestoneForm({ title: '', due: '', notes: '' });
      setShowMilestoneForm(false);
    }
  }

  async function saveTask(parentId) {
    const title = taskForm.title.trim();
    if (!title) return;

    const { data, error } = await supabase
      .from('items')
      .insert({
        title, type: 'Task', status: taskForm.status,
        due: taskForm.due || null, parent: parentId, notes: taskForm.notes,
      })
      .select()
      .single();

    if (error) {
      setError(error.message);
    } else {
      setItems((prev) => [...prev, data]);
      setTaskForm({ title: '', status: 'Not started', due: '', notes: '' });
      setTaskFormFor(null);
    }
  }

  if (!loaded) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <p className="text-sm text-muted">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-3xl mx-auto px-5 py-10 sm:py-14">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-ink font-display">Useno tracker</h1>
          <p className="text-sm text-muted mt-1">Milestones and tasks, all in one place.</p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-xl bg-clay-50 text-clay-800 text-sm">
            Connection error: {error}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <StatCard label="Total items" value={stats.total} />
          <StatCard label="Completed" value={stats.done} accent="sage" />
          <StatCard label="Overdue" value={stats.overdue} accent={stats.overdue > 0 ? 'clay' : null} />
        </div>

        {/* Milestones section */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-ink font-display">Milestones</h2>
            <button className="btn-soft" onClick={() => setShowMilestoneForm((s) => !s)}>
              + Milestone
            </button>
          </div>

          {showMilestoneForm && (
            <div className="card-soft p-4 mb-4 space-y-3">
              <input
                type="text" placeholder="Milestone title" className="input-soft w-full"
                value={milestoneForm.title}
                onChange={(e) => setMilestoneForm({ ...milestoneForm, title: e.target.value })}
              />
              <div className="flex gap-3">
                <input
                  type="date" className="input-soft flex-1"
                  value={milestoneForm.due}
                  onChange={(e) => setMilestoneForm({ ...milestoneForm, due: e.target.value })}
                />
              </div>
              <textarea
                placeholder="Notes (optional)" rows={2} className="input-soft w-full !h-auto py-2 resize-none"
                value={milestoneForm.notes}
                onChange={(e) => setMilestoneForm({ ...milestoneForm, notes: e.target.value })}
              />
              <div className="flex gap-2 justify-end">
                <button className="btn-soft" onClick={() => setShowMilestoneForm(false)}>Cancel</button>
                <button className="btn-primary" onClick={saveMilestone}>Save</button>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {milestones.map((m, idx) => {
              const tasks = tasksFor(m.id);
              const progress = progressFor(m.id);
              const isCollapsed = collapsed[m.id];
              const overdue = isOverdue(m);
              const theme = MILESTONE_THEMES[idx % MILESTONE_THEMES.length];

              return (
                <div key={m.id} className={`card-soft overflow-hidden border-l-4 ${theme.border} ${theme.bg}`}>
                  {/* Milestone header */}
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => toggleCollapse(m.id)}
                        className="mt-0.5 w-5 h-5 flex items-center justify-center text-muted hover:text-ink transition-colors"
                        aria-label="Toggle"
                      >
                        <svg width="12" height="12" viewBox="0 0 12 12" className={`transition-transform ${isCollapsed ? '' : 'rotate-90'}`}>
                          <path d="M3 2 L9 6 L3 10" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-semibold text-ink leading-snug font-display">{m.title}</p>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <button
                              onClick={() => cycleStatus(m.id)}
                              className={`text-xs font-medium px-2.5 py-1 rounded-lg transition-colors ${STATUS_STYLES[m.status]}`}
                            >
                              {m.status}
                            </button>
                            <button onClick={() => deleteItem(m.id)} className="w-7 h-7 flex items-center justify-center text-muted/60 hover:text-clay-600 transition-colors" aria-label="Delete">
                              <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 2L11 11M11 2L2 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 mt-1.5">
                          {m.due && (
                            <span className={`text-xs ${overdue ? 'text-clay-600 font-medium' : 'text-muted'}`}>
                              {formatDate(m.due)}{overdue ? ' · overdue' : ''}
                            </span>
                          )}
                          {progress !== null && (
                            <span className="text-xs text-muted">{tasks.filter(t=>t.status==='Done').length}/{tasks.length} tasks</span>
                          )}
                          {m.notes && (
                            <button onClick={() => toggleNotes(m.id)} className="text-xs text-muted hover:text-ink transition-colors">
                              {expandedNotes[m.id] === false ? 'Show notes' : 'Hide notes'}
                            </button>
                          )}
                          {!m.notes && (
                            <button onClick={() => toggleNotes(m.id)} className="text-xs text-muted hover:text-ink transition-colors">
                              {expandedNotes[m.id] ? 'Hide notes' : 'Add notes'}
                            </button>
                          )}
                        </div>

                        {progress !== null && (
                          <div className="mt-2.5 h-1.5 w-full bg-black/[0.06] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-sage-400 rounded-full transition-all duration-300"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        )}

                        {/* Notes: visible by default if present, or if explicitly toggled open for editing */}
                        {((m.notes && expandedNotes[m.id] !== false) || (!m.notes && expandedNotes[m.id])) && (
                          <textarea
                            className="input-soft w-full !h-auto py-2 mt-3 resize-y text-xs leading-relaxed min-h-[2.5rem]"
                            style={{ height: 'auto' }}
                            rows={Math.max(2, Math.ceil((m.notes || '').length / 70))}
                            placeholder="Add notes..."
                            value={m.notes || ''}
                            onChange={(e) => updateNotes(m.id, e.target.value)}
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Tasks under milestone */}
                  {!isCollapsed && (
                    <div className="border-t border-black/[0.04] bg-black/[0.012]">
                      {tasks.map((t) => (
                        <TaskRow
                          key={t.id}
                          task={t}
                          onCycle={() => cycleStatus(t.id)}
                          onDelete={() => deleteItem(t.id)}
                          onToggleNotes={() => toggleNotes(t.id)}
                          notesExpanded={expandedNotes[t.id]}
                          onUpdateNotes={(v) => updateNotes(t.id, v)}
                        />
                      ))}

                      {taskFormFor === m.id ? (
                        <div className="p-3 pl-12 space-y-2 bg-white">
                          <input
                            type="text" placeholder="Task title" className="input-soft w-full"
                            value={taskForm.title}
                            onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                            autoFocus
                          />
                          <div className="flex gap-2">
                            <select className="input-soft flex-1" value={taskForm.status} onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value })}>
                              {STATUSES.map((s) => <option key={s}>{s}</option>)}
                            </select>
                            <input type="date" className="input-soft flex-1" value={taskForm.due} onChange={(e) => setTaskForm({ ...taskForm, due: e.target.value })} />
                          </div>
                          <div className="flex gap-2 justify-end">
                            <button className="btn-soft" onClick={() => setTaskFormFor(null)}>Cancel</button>
                            <button className="btn-primary" onClick={() => saveTask(m.id)}>Add task</button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setTaskFormFor(m.id); setTaskForm({ title: '', status: 'Not started', due: '', notes: '' }); }}
                          className="w-full text-left pl-12 pr-4 py-2.5 text-xs text-muted hover:text-ink hover:bg-black/[0.02] transition-colors"
                        >
                          + Add task
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Standalone tasks */}
        {standaloneTasks.length > 0 && (
          <div>
            <h2 className="text-base font-bold text-ink mb-4 font-display">Other tasks</h2>
            <div className="card-soft overflow-hidden">
              {standaloneTasks.map((t) => (
                <TaskRow
                  key={t.id}
                  task={t}
                  onCycle={() => cycleStatus(t.id)}
                  onDelete={() => deleteItem(t.id)}
                  onToggleNotes={() => toggleNotes(t.id)}
                  notesExpanded={expandedNotes[t.id]}
                  onUpdateNotes={(v) => updateNotes(t.id, v)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, accent }) {
  const accentColor = accent === 'sage' ? 'text-sage-800' : accent === 'clay' ? 'text-clay-600' : 'text-ink';
  return (
    <div className="card-soft p-4">
      <p className="text-xs text-muted mb-1">{label}</p>
      <p className={`text-2xl font-semibold ${accentColor}`}>{value}</p>
    </div>
  );
}

function TaskRow({ task, onCycle, onDelete, onToggleNotes, notesExpanded, onUpdateNotes }) {
  const overdue = isOverdue(task);
  return (
    <div className="border-b border-black/[0.04] last:border-b-0 bg-white">
      <div className="flex items-start gap-3 px-4 py-3 pl-12">
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm text-ink leading-snug">{task.title}</p>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                onClick={onCycle}
                className={`text-xs font-medium px-2.5 py-1 rounded-lg transition-colors ${STATUS_STYLES[task.status]}`}
              >
                {task.status}
              </button>
              <button onClick={onDelete} className="w-7 h-7 flex items-center justify-center text-muted/60 hover:text-clay-600 transition-colors" aria-label="Delete">
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 2L11 11M11 2L2 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              </button>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-1">
            {task.due && (
              <span className={`text-xs ${overdue ? 'text-clay-600 font-medium' : 'text-muted'}`}>
                {formatDate(task.due)}{overdue ? ' · overdue' : ''}
              </span>
            )}
            <button onClick={onToggleNotes} className="text-xs text-muted hover:text-ink transition-colors">
              {notesExpanded ? 'Hide notes' : 'Notes'}
            </button>
          </div>
          {notesExpanded && (
            <textarea
              className="input-soft w-full !h-auto py-2 mt-2 resize-none text-xs"
              rows={2}
              placeholder="Add notes..."
              value={task.notes || ''}
              onChange={(e) => onUpdateNotes(e.target.value)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
