import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BookOpen, Pause, Pencil, Play, Plus, RotateCcw, Shuffle, Trash2 } from 'lucide-react';
import clsx from 'clsx';
import { useDeleteStory, useSaveStory, useStories } from '../../api/queries.js';
import { useLocalStorage } from '../../hooks/useLocalStorage.js';
import { ALL_QUESTIONS } from '../../lib/interviewQuestions.js';
import {
  Button, Card, CardBody, CardHeader, EmptyState, Input, Modal, Textarea, useToast,
} from '../../components/ui/index.js';
import { PageHeader } from '../../components/layout/PageHeader.jsx';
import { useHype } from '../hype/HypeProvider.jsx';
import styles from './Prep.module.css';

const SESSION = 30 * 60;
const todayKey = () => new Date().toLocaleDateString('en-CA');
const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

/** 30-minute timer. Minutes practiced per day live in localStorage. */
function PrepTimer() {
  const [log, setLog] = useLocalStorage('trail.prep.log', {});
  const [left, setLeft] = useState(SESSION);
  const [running, setRunning] = useState(false);
  const tick = useRef(0);
  const { fire } = useHype();

  useEffect(() => {
    if (!running) return undefined;
    const id = setInterval(() => {
      setLeft((s) => {
        if (s <= 1) { setRunning(false); fire('goal'); return 0; }
        return s - 1;
      });
      tick.current += 1;
      if (tick.current % 60 === 0) setLog((l) => ({ ...l, [todayKey()]: (l[todayKey()] ?? 0) + 1 }));
    }, 1000);
    return () => clearInterval(id);
  }, [running, setLog, fire]);

  const today = log[todayKey()] ?? 0;
  const streak = useMemo(() => {
    let n = 0;
    for (let i = 0; i < 365; i += 1) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const m = log[d.toLocaleDateString('en-CA')] ?? 0;
      if (m >= 1) n += 1; else if (i === 0) continue; else break;
    }
    return n;
  }, [log]);
  const pct = ((SESSION - left) / SESSION) * 100;

  return (
    <Card>
      <CardHeader title="Daily prep" subtitle="30 minutes, every day" />
      <CardBody>
        <div className={styles.timer}>
          <div className={styles.ring} style={{ '--p': `${pct}%` }}>
            <span className={styles.time}>{fmt(left)}</span>
          </div>
          <div className={styles.timerSide}>
            <div className={styles.stat}><b>{Math.min(today, 30)}</b> / 30 min today</div>
            <div className={styles.stat}><b>{streak}</b> day prep streak</div>
            <div className={styles.timerBtns}>
              <Button variant="primary" icon={running ? Pause : Play} onClick={() => setRunning((r) => !r)}>
                {running ? 'Pause' : left === SESSION ? 'Start' : 'Resume'}
              </Button>
              <Button icon={RotateCcw} onClick={() => { setRunning(false); setLeft(SESSION); }}>Reset</Button>
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

function Drill({ stories }) {
  const [kind, setKind] = useState('All');
  const pool = useMemo(() => ALL_QUESTIONS.filter((q) => kind === 'All' || q.kind === kind), [kind]);
  const [index, setIndex] = useState(() => Math.floor(Math.random() * ALL_QUESTIONS.length));
  const question = pool[index % pool.length];
  const matches = stories.filter((s) => question.tags?.some((t) => s.tags.includes(t)));
  const next = () => setIndex((i) => {
    let n = Math.floor(Math.random() * pool.length);
    if (n === i % pool.length) n = (n + 1) % pool.length;
    return n;
  });

  return (
    <Card>
      <CardHeader
        title="Practice question"
        subtitle="Answer out loud, in under 2 minutes"
        actions={
          <div className={styles.kinds}>
            {['All', 'Behavioral', 'Technical'].map((k) => (
              <button key={k} type="button" className={clsx(styles.kind, k === kind && styles.kindOn)} onClick={() => setKind(k)}>{k}</button>
            ))}
          </div>
        }
      />
      <CardBody>
        <div className={styles.question}>{question.q}</div>
        <div className={styles.qMeta}>{question.kind}{question.skill ? ` · ${question.skill}` : ''}</div>
        {question.tip && <p className={styles.qTip}>{question.tip}</p>}
        {matches.length > 0 && (
          <div className={styles.qStories}>
            {matches.slice(0, 2).map((s) => <span key={s.id}><BookOpen size={12} /> {s.title}</span>)}
          </div>
        )}
        {question.kind === 'Behavioral' && matches.length === 0 && question.tags?.length > 0 && (
          <p className={styles.qTip}>Answer with Situation, Task, Action, Result. No story for this yet: write one below.</p>
        )}
        <div style={{ marginTop: 'var(--space-4)' }}>
          <Button icon={Shuffle} onClick={next}>Next question</Button>
        </div>
      </CardBody>
    </Card>
  );
}

const emptyStory = { title: '', situation: '', task: '', action: '', result: '', tags: '' };

function StoryModal({ open, onClose, story }) {
  const save = useSaveStory();
  const toast = useToast();
  const [form, setForm] = useState(emptyStory);
  useEffect(() => {
    if (open) setForm(story ? { ...story, tags: story.tags.join(', ') } : emptyStory);
  }, [open, story]);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const submit = async (e) => {
    e?.preventDefault();
    if (!form.title.trim()) return;
    try {
      await save.mutateAsync({
        id: story?.id,
        title: form.title, situation: form.situation, task: form.task, action: form.action, result: form.result,
        tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      });
      toast.success(story ? 'Story updated' : 'Story saved');
      onClose();
    } catch (error) { toast.error('Could not save', error.message); }
  };
  return (
    <Modal
      open={open} onClose={onClose} title={story ? 'Edit story' : 'New story'}
      description="Situation, Task, Action, Result. Keep each part to a sentence or two."
      footer={<><Button onClick={onClose}>Cancel</Button><Button variant="primary" loading={save.isPending} onClick={submit}>Save</Button></>}
    >
      <form onSubmit={submit} className={styles.form}>
        <Input label="Title" value={form.title} onChange={set('title')} placeholder="Built the free-trial program end to end" autoFocus />
        <Textarea label="Situation" rows={2} value={form.situation} onChange={set('situation')} />
        <Textarea label="Task" rows={2} value={form.task} onChange={set('task')} />
        <Textarea label="Action" rows={3} value={form.action} onChange={set('action')} />
        <Textarea label="Result" rows={2} value={form.result} onChange={set('result')} hint="Numbers make results stick." />
        <Input label="Tags" value={form.tags} onChange={set('tags')}
          hint="Comma separated. Used to match questions: ownership, impact, conflict, debugging, pressure, learning, growth, communication, teamwork" />
      </form>
    </Modal>
  );
}

export function PrepPage() {
  const { data: stories = [] } = useStories();
  const remove = useDeleteStory();
  const [params, setParams] = useSearchParams();
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);
  const highlight = Number(params.get('story')) || null;

  useEffect(() => {
    if (params.get('new')) { setEditing(null); setOpen(true); setParams({}, { replace: true }); }
  }, [params, setParams]);
  useEffect(() => {
    if (highlight) document.getElementById(`story-${highlight}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [highlight, stories.length]);

  return (
    <div className={styles.page}>
      <PageHeader title="Interview prep" subtitle="Your 30 minutes a day, and the stories you'll tell." />
      <div className={styles.top}>
        <PrepTimer />
        <Drill stories={stories} />
      </div>

      <Card>
        <CardHeader
          title="Story bank"
          subtitle="Write each story once, then reuse it in every interview"
          actions={<Button size="sm" variant="primary" icon={Plus} onClick={() => { setEditing(null); setOpen(true); }}>New story</Button>}
        />
        <CardBody>
          {stories.length === 0 ? (
            <EmptyState compact icon={BookOpen} title="No stories yet"
              description="Start with the project you're proudest of, a production bug, and a disagreement you handled well." />
          ) : (
            <div className={styles.stories}>
              {stories.map((s) => (
                <article key={s.id} id={`story-${s.id}`} className={clsx(styles.storyCard, highlight === s.id && styles.storyOn)}>
                  <header className={styles.storyHead}>
                    <h3>{s.title}</h3>
                    <span className={styles.storyBtns}>
                      <button type="button" aria-label="Edit" onClick={() => { setEditing(s); setOpen(true); }}><Pencil size={13} /></button>
                      <button type="button" aria-label="Delete" onClick={() => remove.mutate(s.id)}><Trash2 size={13} /></button>
                    </span>
                  </header>
                  {[['S', s.situation], ['T', s.task], ['A', s.action], ['R', s.result]].filter(([, v]) => v).map(([k, v]) => (
                    <p key={k} className={styles.star}><b>{k}</b>{v}</p>
                  ))}
                  {s.tags.length > 0 && <div className={styles.tags}>{s.tags.map((t) => <span key={t}>{t}</span>)}</div>}
                </article>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      <StoryModal open={open} onClose={() => setOpen(false)} story={editing} />
    </div>
  );
}
