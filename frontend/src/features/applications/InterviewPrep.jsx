import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import { useStories } from '../../api/queries.js';
import { detectSkills } from '../../lib/skills.js';
import { prepFor } from '../../lib/interviewQuestions.js';
import styles from './InterviewPrep.module.css';

/** The story from your bank that best answers a question, by shared tags. */
const bestStory = (stories, tags) => {
  let best = null;
  let score = 0;
  for (const story of stories) {
    const s = story.tags.filter((t) => tags.includes(t)).length;
    if (s > score) { best = story; score = s; }
  }
  return best;
};

export function InterviewPrep({ application }) {
  const { data: stories = [] } = useStories();
  const [showAll, setShowAll] = useState(false);
  const skills = useMemo(
    () => detectSkills(`${application.role}\n${application.jobDescription ?? ''}\n${application.summary ?? ''}`),
    [application],
  );
  const prep = useMemo(() => prepFor(skills), [skills]);
  const behavioral = showAll ? prep.behavioral : prep.behavioral.slice(0, 5);
  const technical = showAll ? prep.technical : prep.technical.slice(0, 6);

  return (
    <div className={styles.wrap}>
      {skills.length > 0 && (
        <div className={styles.chips}>
          {skills.map((s) => <span key={s.key} className={styles.chip}>{s.label}</span>)}
        </div>
      )}

      <section>
        <div className={styles.label}>They'll probably ask</div>
        <ol className={styles.list}>
          {behavioral.map((item) => {
            const story = bestStory(stories, item.tags);
            return (
              <li key={item.q}>
                <span>{item.q}</span>
                {story ? (
                  <Link to={`/prep?story=${story.id}`} className={styles.story}>
                    <BookOpen size={12} /> Use: {story.title}
                  </Link>
                ) : item.tip ? <span className={styles.tip}>{item.tip}</span> : item.tags.length > 0 && (
                  <Link to="/prep?new=1" className={styles.storyMissing}>No story yet. Write one</Link>
                )}
              </li>
            );
          })}
        </ol>
      </section>

      {technical.length > 0 && (
        <section>
          <div className={styles.label}>Technical, based on the posting</div>
          <ol className={styles.list}>
            {technical.map((item) => (
              <li key={item.q}><span>{item.q}</span><span className={styles.skill}>{item.skill}</span></li>
            ))}
          </ol>
        </section>
      )}

      {showAll && (
        <section>
          <div className={styles.label}>Questions to ask them</div>
          <ul className={styles.list}>{prep.askThem.map((q) => <li key={q}><span>{q}</span></li>)}</ul>
        </section>
      )}

      <div className={styles.footer}>
        <button type="button" className={styles.more} onClick={() => setShowAll((v) => !v)}>
          {showAll ? 'Show less' : 'Show all, plus questions to ask them'}
        </button>
        <Link to="/prep" className={styles.more}>Practice now →</Link>
      </div>
    </div>
  );
}
