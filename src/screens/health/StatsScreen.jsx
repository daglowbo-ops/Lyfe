import Screen from '../../components/Screen.jsx';
import { GhostButton, Label, Meter, Mono, Panel } from '../../components/Primitives.jsx';
import { useApp } from '../../store/AppProvider.jsx';
import { parseKey, shortLabel, startOfToday } from '../../lib/date.js';
import { INK, MONO, NUT, TRN, dim } from '../../lib/theme.js';
import { displayWeight, weightUnit } from '../../lib/format.js';
import {
  bestCompletedSets,
  nutritionSummary,
  recentWeightEntries,
  summarizeWeight,
  workoutWeeks,
} from './statsMetrics.js';

const CHART_W = 300;
const CHART_H = 116;
const PLOT_TOP = 12;
const PLOT_BOTTOM = 92;

export default function StatsScreen() {
  const { state, dispatch } = useApp();
  const today = startOfToday();
  const useKg = state.toggles.kg;
  const unit = weightUnit(useKg);

  const weightEntries = recentWeightEntries(state.weights, today);
  const weightTrend = summarizeWeight(weightEntries);
  const weeks = workoutWeeks(state, today);
  const currentWeek = weeks.at(-1).sessions;
  const previousWeek = weeks.at(-2).sessions;
  const totalSessions = weeks.reduce((sum, week) => sum + week.sessions, 0);
  const nutrition = nutritionSummary(state, today);
  const bestSets = bestCompletedSets(state.workoutHistory).slice(0, 4);

  return (
    <Screen>
      <header>
        <h1 style={{ fontSize: 30, fontWeight: 600, letterSpacing: -1, lineHeight: 1.1, margin: 0 }}>
          Progress
        </h1>
        <p style={{ maxWidth: 310, margin: '8px 0 0', color: dim(0.62), fontSize: 14.5, lineHeight: 1.45 }}>
          Trends from the health records you actually logged.
        </p>
      </header>

      <section aria-labelledby="weight-trend-title" style={{ marginTop: 24 }}>
        <Panel style={{ padding: '20px 18px 18px' }}>
          <SectionHeading
            id="weight-trend-title"
            title="Weight trend"
            detail="12 weeks"
          />
          {weightTrend ? (
            <WeightTrend trend={weightTrend} entries={weightEntries} useKg={useKg} unit={unit} />
          ) : (
            <EmptySection
              title="No weight trend yet"
              copy="Log a first weigh-in, then add another on a later day to reveal change and pace."
              action="Log weight in Profile"
              accent={NUT}
              onClick={() => dispatch({ type: 'openProfile' })}
            />
          )}
        </Panel>
      </section>

      <section aria-labelledby="training-rhythm-title" style={{ marginTop: 22 }}>
        <SectionHeading
          id="training-rhythm-title"
          title="Training rhythm"
          detail="Four rolling weeks"
        />
        {totalSessions > 0 ? (
          <div style={{ marginTop: 14 }}>
            <TrainingSummary
              weeks={weeks}
              current={currentWeek}
              previous={previousWeek}
              total={totalSessions}
            />
          </div>
        ) : (
          <EmptySection
            title="No training days recorded yet"
            copy="Finish a workout to start a weekly rhythm. Planned sessions are not counted as training days."
            action="Start a workout"
            accent={TRN}
            onClick={() => dispatch({ type: 'screen', screen: 'train' })}
          />
        )}
      </section>

      <section aria-labelledby="nutrition-title" style={{ marginTop: 26 }}>
        <SectionHeading
          id="nutrition-title"
          title="Nutrition follow-through"
          detail="14 closed days"
        />
        {nutrition.loggedDays > 0 ? (
          <NutritionSummary summary={nutrition} />
        ) : (
          <EmptySection
            title="No nutrition history yet"
            copy="Log food on a day to measure calorie and protein follow-through against that day’s goals."
            action="Log food"
            accent={NUT}
            onClick={() => dispatch({ type: 'screen', screen: 'food' })}
          />
        )}
      </section>

      <section aria-labelledby="best-sets-title" style={{ marginTop: 28 }}>
        <SectionHeading
          id="best-sets-title"
          title="Recorded best sets"
          detail="Completed workouts"
        />
        {bestSets.length > 0 ? (
          <div style={{ marginTop: 8, borderTop: `1px solid ${dim(0.09)}` }}>
            {bestSets.map((set) => (
              <BestSetRow key={set.name} set={set} useKg={useKg} unit={unit} />
            ))}
          </div>
        ) : (
          <EmptySection
            title="No completed set history"
            copy="Best sets appear after a workout is fully completed and saved."
            action="Go to training"
            accent={TRN}
            onClick={() => dispatch({ type: 'screen', screen: 'train' })}
          />
        )}
      </section>
    </Screen>
  );
}

function SectionHeading({ id, title, detail }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 14 }}>
      <h2 id={id} style={{ margin: 0, fontSize: 19, lineHeight: 1.2, fontWeight: 600, letterSpacing: -0.45 }}>
        {title}
      </h2>
      <Label style={{ maxWidth: '50%', letterSpacing: 0.8, textAlign: 'right', overflowWrap: 'anywhere' }}>{detail}</Label>
    </div>
  );
}

function WeightTrend({ trend, entries, useKg, unit }) {
  const displayEntries = entries.map((entry) => ({
    ...entry,
    displayValue: displayWeight(entry.value, useKg),
  }));
  const latest = displayWeight(trend.latest.value, useKg);
  const change = displayWeight(Math.abs(trend.change), useKg);
  const signedChange = trend.change === 0 ? `0.0 ${unit}` : `${trend.change > 0 ? '+' : '−'}${change.toFixed(1)} ${unit}`;
  const paceValue = trend.weeklyPace === null
    ? null
    : displayWeight(Math.abs(trend.weeklyPace), useKg);
  const signedPace = trend.weeklyPace === null
    ? 'Need 2 dates'
    : `${trend.weeklyPace > 0 ? '+' : trend.weeklyPace < 0 ? '−' : ''}${paceValue.toFixed(1)} ${unit}/wk`;

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 16, marginTop: 18 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{ fontSize: 42, fontWeight: 600, letterSpacing: -1.65, lineHeight: 0.95 }}>
            {latest.toFixed(1)}
          </span>
          <Mono size={13}>{unit}</Mono>
        </div>
        <Mono size={13} color={INK}>{signedPace}</Mono>
      </div>
      <WeightChart entries={displayEntries} unit={unit} />
      <MetricStrip
        items={[
          { value: signedChange, label: 'Change' },
          { value: `${trend.spanDays} days`, label: 'Measured span' },
          { value: String(entries.length), label: entries.length === 1 ? 'Weigh-in' : 'Weigh-ins' },
        ]}
      />
    </>
  );
}

function WeightChart({ entries, unit }) {
  const values = entries.map((entry) => entry.displayValue);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const firstDate = entries[0].date;
  const lastDate = entries.at(-1).date;
  const firstTime = parseKey(firstDate).getTime();
  const dateSpan = Math.max(1, parseKey(lastDate).getTime() - firstTime);
  const points = entries.map((entry) => {
    const x = entries.length === 1
      ? CHART_W / 2
      : ((parseKey(entry.date).getTime() - firstTime) / dateSpan) * CHART_W;
    const y = min === max
      ? (PLOT_TOP + PLOT_BOTTOM) / 2
      : PLOT_BOTTOM - ((entry.displayValue - min) / (max - min)) * (PLOT_BOTTOM - PLOT_TOP);
    return { ...entry, x, y };
  });
  const polyline = points.map((point) => `${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(' ');
  const area = points.length > 1 ? `0,${PLOT_BOTTOM} ${polyline} ${CHART_W},${PLOT_BOTTOM}` : '';
  const accessibleLabel = points.length === 1
    ? `One weigh-in of ${values[0].toFixed(1)} ${unit} on ${firstDate}`
    : `Weight changed from ${values[0].toFixed(1)} to ${values.at(-1).toFixed(1)} ${unit} between ${firstDate} and ${lastDate}`;

  return (
    <>
      <svg
        viewBox={`0 0 ${CHART_W} ${CHART_H}`}
        preserveAspectRatio="none"
        role="img"
        aria-label={accessibleLabel}
        style={{ display: 'block', width: '100%', height: CHART_H, marginTop: 16, overflow: 'visible' }}
      >
        {[PLOT_TOP, (PLOT_TOP + PLOT_BOTTOM) / 2, PLOT_BOTTOM].map((y) => (
          <line
            key={y}
            x1="0"
            x2={CHART_W}
            y1={y}
            y2={y}
            stroke={dim(0.09)}
            strokeWidth="1"
            strokeDasharray="3 6"
            vectorEffect="non-scaling-stroke"
          />
        ))}
        {points.length > 1 ? (
          <>
            <polygon points={area} fill={NUT} opacity="0.055" />
            <polyline
              points={polyline}
              fill="none"
              stroke={NUT}
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          </>
        ) : null}
        {points.map((point, index) => (
          <circle
            key={`${point.date}-${point.displayValue}`}
            cx={point.x}
            cy={point.y}
            r={index === points.length - 1 ? 3.8 : 2.2}
            fill={index === points.length - 1 ? NUT : '#111110'}
            stroke={NUT}
            strokeWidth="1.5"
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: MONO, fontSize: 12, color: dim(0.58), marginTop: 2 }}>
        <span>{shortLabel(parseKey(firstDate))}</span>
        <span>{shortLabel(parseKey(lastDate))}</span>
      </div>
    </>
  );
}

function TrainingSummary({ weeks, current, previous, total }) {
  const highest = Math.max(...weeks.map((week) => week.sessions), 1);
  const comparison = current === previous
    ? 'Same as the previous 7 days'
    : `${Math.abs(current - previous)} ${current > previous ? 'more' : 'fewer'} than the previous 7 days`;

  return (
    <Panel style={{ padding: '18px 18px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <span style={{ fontSize: 31, fontWeight: 600, lineHeight: 1, letterSpacing: -1.1 }}>{current}</span>
          <span style={{ marginLeft: 8, color: dim(0.66), fontSize: 14.5 }}>
            {current === 1 ? 'training day' : 'training days'} in 7 days
          </span>
        </div>
        <Mono color={TRN}>{(total / weeks.length).toFixed(1)} / week</Mono>
      </div>
      <div
        role="img"
        aria-label={`Recorded training days by rolling week, oldest to newest: ${weeks.map((week) => week.sessions).join(', ')}`}
        style={{ display: 'grid', gridTemplateColumns: `repeat(${weeks.length}, minmax(0, 1fr))`, gap: 10, height: 88, marginTop: 22, alignItems: 'end' }}
      >
        {weeks.map((week, index) => (
          <div key={week.start} style={{ display: 'grid', gridTemplateRows: '1fr auto', gap: 8, height: '100%', alignItems: 'end' }}>
            <div style={{ height: '100%', display: 'flex', alignItems: 'flex-end', borderBottom: `1px solid ${dim(0.12)}` }}>
              <div
                className="grow-in"
                style={{
                  width: '100%',
                  minHeight: week.sessions ? 8 : 2,
                  height: `${week.sessions ? Math.max(10, (week.sessions / highest) * 100) : 2}%`,
                  borderRadius: 12,
                  background: index === weeks.length - 1 ? TRN : dim(0.22),
                }}
              />
            </div>
            <Mono size={12} color={index === weeks.length - 1 ? TRN : dim(0.58)} style={{ textAlign: 'center' }}>
              {week.sessions}
            </Mono>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 15, paddingTop: 13, borderTop: `1px solid ${dim(0.08)}`, color: dim(0.66), fontSize: 13.5 }}>
        {comparison}. Each training date is counted once, even when both archive formats contain it.
      </div>
    </Panel>
  );
}

function NutritionSummary({ summary }) {
  const calorieRate = (summary.calorieHits / summary.loggedDays) * 100;
  const proteinRate = (summary.proteinHits / summary.loggedDays) * 100;
  return (
    <div style={{ marginTop: 14, borderTop: `1px solid ${dim(0.1)}` }}>
      <AdherenceRow
        label="Within calorie target"
        count={`${summary.calorieHits} of ${summary.loggedDays}`}
        percent={calorieRate}
      />
      <AdherenceRow
        label="Protein goal reached"
        count={`${summary.proteinHits} of ${summary.loggedDays}`}
        percent={proteinRate}
      />
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 16, paddingTop: 14 }}>
        <div style={{ fontSize: 13.5, color: dim(0.62), lineHeight: 1.45 }}>
          {summary.loggedDays === summary.days
            ? 'Every closed day has nutrition data.'
            : 'Unlogged days are missing coverage, not failed targets.'}
        </div>
        <Mono color={NUT} style={{ flexShrink: 0 }}>
          {summary.loggedDays}/{summary.days} logged
        </Mono>
      </div>
    </div>
  );
}

function AdherenceRow({ label, count, percent }) {
  return (
    <div style={{ padding: '16px 0', borderBottom: `1px solid ${dim(0.08)}` }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 16, marginBottom: 10 }}>
        <span style={{ fontSize: 14.5, fontWeight: 500 }}>{label}</span>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 9 }}>
          <Mono color={NUT}>{count}</Mono>
          <Mono size={12}>{Math.round(percent)}%</Mono>
        </div>
      </div>
      <Meter value={`${percent}%`} color={NUT} height={4} track={dim(0.09)} label={`${label}: ${Math.round(percent)} percent of logged days`} />
    </div>
  );
}

function MetricStrip({ items }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))`, marginTop: 16, borderTop: `1px solid ${dim(0.09)}` }}>
      {items.map((item, index) => (
        <div
          key={item.label}
          style={{
            minWidth: 0,
            padding: '14px 10px 0',
            paddingLeft: index === 0 ? 0 : 10,
            borderLeft: index === 0 ? 'none' : `1px solid ${dim(0.08)}`,
          }}
        >
          <Mono size={13} color={INK} style={{ display: 'block' }}>{item.value}</Mono>
          <Label style={{ marginTop: 5, letterSpacing: 0.7, lineHeight: 1.25 }}>{item.label}</Label>
        </div>
      ))}
    </div>
  );
}

function BestSetRow({ set, useKg, unit }) {
  const weight = displayWeight(set.weight, useKg, useKg ? 1 : 0);
  const context = [set.workoutName, set.date].filter(Boolean).join(' · ');
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: 14, alignItems: 'center', padding: '15px 0', borderBottom: `1px solid ${dim(0.08)}` }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 500, letterSpacing: -0.2, overflowWrap: 'anywhere' }}>{set.name}</div>
        <div style={{ marginTop: 3, color: dim(0.6), fontSize: 12.5, lineHeight: 1.35, overflowWrap: 'anywhere' }}>
          {context}
        </div>
      </div>
      <Mono size={14} color={TRN} style={{ whiteSpace: 'nowrap' }}>
        {weight} {unit} × {set.reps}
      </Mono>
    </div>
  );
}

function EmptySection({ title, copy, action, accent, onClick }) {
  return (
    <div style={{ marginTop: 15, paddingTop: 15, borderTop: `1px solid ${dim(0.09)}` }}>
      <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: -0.2 }}>{title}</div>
      <p style={{ margin: '5px 0 14px', color: dim(0.62), fontSize: 13.5, lineHeight: 1.45 }}>{copy}</p>
      <GhostButton
        className={accent === TRN ? 'outline-trn' : 'outline-nut'}
        style={{ width: '100%', borderColor: accent, color: accent }}
        onClick={onClick}
      >
        {action}
      </GhostButton>
    </div>
  );
}
