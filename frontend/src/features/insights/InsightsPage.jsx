import { useState } from 'react';
import {
  Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { BarChart3 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useAnalytics } from '../../api/queries.js';
import { STATUS_META, STATUS_ORDER } from '../../lib/constants.js';
import { Card, CardHeader, EmptyState, Spinner, Tabs } from '../../components/ui/index.js';
import { PageHeader } from '../../components/layout/PageHeader.jsx';
import styles from './Insights.module.css';

const StatTile = ({ label, value, hint }) => (
  <Card className={styles.stat}>
    <div className={styles.statLabel}>{label}</div>
    <div className={styles.statValue}>{value}</div>
    {hint && <div className={styles.statHint}>{hint}</div>}
  </Card>
);

/** Shared tooltip so both charts read the same and follow the theme. */
function ChartTooltip({ active, payload, label, labelFormatter }) {
  if (!active || !payload?.length) return null;
  return (
    <div className={styles.tooltip}>
      <div className={styles.tooltipLabel}>{labelFormatter ? labelFormatter(label) : label}</div>
      {payload.map((entry) => (
        <div key={entry.dataKey} className={styles.tooltipRow}>
          <span className={styles.tooltipDot} style={{ background: entry.color }} />
          {entry.name}: {entry.value}
        </div>
      ))}
    </div>
  );
}

const AXIS = {
  stroke: 'var(--border-strong)',
  tick: { fill: 'var(--text-subtle)', fontSize: 11 },
  tickLine: false,
  axisLine: false,
};

export function InsightsPage() {
  const [weeks, setWeeks] = useState(12);
  const { data, isLoading } = useAnalytics(weeks);

  if (isLoading) return <Spinner center size={26} />;
  if (!data || data.totals.tracked === 0) {
    return (
      <>
        <PageHeader title="Insights" subtitle="Where your search is actually working." />
        <Card>
          <EmptyState
            icon={BarChart3}
            title="Not enough data yet"
            description="Add a few applications and move them through the board — the funnel, response rate and weekly volume fill in from there."
          />
        </Card>
      </>
    );
  }

  const appliedTotal = data.funnel[0]?.count || 0;
  const weekly = data.weekly.map((point) => ({ ...point, label: format(parseISO(point.week), 'd MMM') }));
  const busiest = Math.max(...weekly.map((w) => w.count), 0);

  return (
    <div className={styles.page}>
      <PageHeader
        title="Insights"
        subtitle="Where your search is actually working — and where it stalls."
        actions={
          <Tabs
            value={String(weeks)}
            onChange={(value) => setWeeks(Number(value))}
            items={[
              { value: '8', label: '8w' },
              { value: '12', label: '12w' },
              { value: '26', label: '26w' },
              { value: '52', label: '1y' },
            ]}
          />
        }
      />

      <div className={styles.stats}>
        <StatTile
          label="Response rate"
          value={`${data.rates.response}%`}
          hint={`${appliedTotal} applications sent`}
        />
        <StatTile
          label="Interview rate"
          value={`${data.rates.interview}%`}
          hint={`${data.totals.interviewing} reached the loop`}
        />
        <StatTile
          label="Offer rate"
          value={`${data.rates.offer}%`}
          hint={`${data.totals.offers} ${data.totals.offers === 1 ? 'offer' : 'offers'} so far`}
        />
        <StatTile
          label="Time to first reply"
          value={data.avgResponseDays != null ? `${data.avgResponseDays}d` : '—'}
          hint="average, from applying"
        />
      </div>

      <div className={styles.grid}>
        <Card>
          <CardHeader title="The funnel" subtitle="How far applications get, counting everything they passed through" />
          <div className={styles.funnel}>
            {data.funnel.map((stage, index) => {
              const width = appliedTotal ? (stage.count / appliedTotal) * 100 : 0;
              const previous = index > 0 ? data.funnel[index - 1].count : null;
              const conversion = previous ? Math.round((stage.count / previous) * 100) : null;
              return (
                <div key={stage.key} className={styles.funnelRow}>
                  <span className={styles.funnelLabel}>{stage.label}</span>
                  <span className={styles.funnelTrack}>
                    <span className={styles.funnelBar} style={{ width: `${width}%`, minWidth: stage.count ? 3 : 0 }} />
                  </span>
                  <span className={styles.funnelValue}>
                    {stage.count}
                    {conversion != null && <span className={styles.funnelRate}> · {conversion}%</span>}
                  </span>
                </div>
              );
            })}
          </div>
          <div className={styles.chartNote}>
            Percentages are conversion from the stage above.
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Applications per week"
            subtitle={busiest > 0 ? `Busiest week: ${busiest}` : 'Nothing sent in this window yet'}
          />
          <div className={styles.chart}>
            <ResponsiveContainer width="100%" height={228}>
              <BarChart data={weekly} margin={{ top: 8, right: 8, bottom: 0, left: -22 }} barCategoryGap="26%">
                <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
                <XAxis dataKey="label" {...AXIS} interval="preserveStartEnd" minTickGap={18} />
                <YAxis {...AXIS} allowDecimals={false} width={38} />
                <Tooltip
                  cursor={{ fill: 'var(--surface-hover)' }}
                  content={<ChartTooltip labelFormatter={(value) => `Week of ${value}`} />}
                />
                <Bar dataKey="count" name="Applications" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader title="Where applications come from" subtitle="And which sources actually reply" />
          <div className={styles.legend}>
            <span className={styles.legendItem}>
              <span className={styles.legendSwatch} style={{ background: 'var(--chart-1)' }} /> Applications
            </span>
            <span className={styles.legendItem}>
              <span className={styles.legendSwatch} style={{ background: 'var(--chart-2)' }} /> Replies
            </span>
          </div>
          <div className={styles.chart}>
            <ResponsiveContainer width="100%" height={Math.max(180, data.sources.length * 64)}>
              <BarChart
                data={data.sources}
                layout="vertical"
                margin={{ top: 0, right: 28, bottom: 4, left: 4 }}
                barCategoryGap="22%"
                barGap={2}
                maxBarSize={14}
              >
                <CartesianGrid horizontal={false} stroke="var(--chart-grid)" />
                <XAxis type="number" {...AXIS} allowDecimals={false} />
                <YAxis type="category" dataKey="source" {...AXIS} width={112} />
                <Tooltip cursor={{ fill: 'var(--surface-hover)' }} content={<ChartTooltip />} />
                <Bar dataKey="applications" name="Applications" fill="var(--chart-1)" radius={[0, 4, 4, 0]}>
                  <LabelList dataKey="applications" position="right" fill="var(--text-subtle)" fontSize={11} />
                </Bar>
                <Bar dataKey="responses" name="Replies" fill="var(--chart-2)" radius={[0, 4, 4, 0]}>
                  <LabelList dataKey="responses" position="right" fill="var(--text-subtle)" fontSize={11} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className={styles.chartNote}>
            A source with a high reply rate but few applications is usually worth more of your time.
          </div>
        </Card>

        <Card>
          <CardHeader title="Where everything sits right now" subtitle="Current stage of every application" />
          <div className={styles.table}>
            {STATUS_ORDER.filter((status) => data.byStatus[status] > 0).map((status) => (
              <div key={status} className={styles.tableRow}>
                <span className={styles.tableDot} style={{ background: `var(--status-${status})` }} />
                <span>{STATUS_META[status].label}</span>
                <span className={styles.tableCount}>{data.byStatus[status]}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

