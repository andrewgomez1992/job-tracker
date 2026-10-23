import styles from './JobSummary.module.css';

// Renders the plain-text job summary with a tiny, safe subset of markdown:
// "## Heading" lines, "- bullet" lines and **bold**. Everything else is text.
const renderInline = (line) =>
  line.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**') && part.length > 4
      ? <strong key={i}>{part.slice(2, -2)}</strong>
      : part,
  );

export function JobSummary({ text }) {
  const blocks = [];
  let bullets = [];

  const flush = () => {
    if (bullets.length) {
      blocks.push(
        <ul key={`ul-${blocks.length}`} className={styles.list}>
          {bullets.map((b, i) => <li key={i}>{renderInline(b)}</li>)}
        </ul>,
      );
      bullets = [];
    }
  };

  text.split('\n').forEach((raw) => {
    const line = raw.trim();
    if (!line) { flush(); return; }
    if (line.startsWith('## ')) {
      flush();
      blocks.push(<h4 key={`h-${blocks.length}`} className={styles.heading}>{line.slice(3)}</h4>);
    } else if (/^[-*•] /.test(line)) {
      bullets.push(line.slice(2));
    } else {
      flush();
      blocks.push(<p key={`p-${blocks.length}`} className={styles.text}>{renderInline(line)}</p>);
    }
  });
  flush();

  return <div className={styles.summary}>{blocks}</div>;
}
