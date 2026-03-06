/* ── Dashboard View — Full simulation results with charts ─────────────── */
import { useState } from "react";
import { useCareerStore } from "@/lib/career-store";
import {
  BarChart3,
  TrendingUp,
  Shield,
  DollarSign,
  Clock,
  Target,
  AlertTriangle,
  CheckCircle2,
  Lightbulb,
  ChevronRight,
  Layers,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
  Legend,
} from "recharts";

/* ── Colour tokens ────────────────────────────────────────────────────── */

const CYAN = "#06b6d4";
const VIOLET = "#8b5cf6";
const EMERALD = "#10b981";
const AMBER = "#f59e0b";
const ROSE = "#f43f5e";
const SKY = "#38bdf8";
const PIE_COLORS = [CYAN, VIOLET, EMERALD, AMBER, ROSE, SKY];

/* ── Tab definitions ──────────────────────────────────────────────────── */

const TABS = [
  { key: "overview", label: "Overview", icon: BarChart3 },
  { key: "timeline", label: "Timeline", icon: Clock },
  { key: "financial", label: "Financial", icon: DollarSign },
  { key: "risk", label: "Risk", icon: Shield },
  { key: "skills", label: "Skills & Gaps", icon: Target },
] as const;

type TabKey = (typeof TABS)[number]["key"];

/* ── Type helpers ─────────────────────────────────────────────────────── */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Rec = Record<string, any>;

function asArr(v: unknown): Rec[] {
  return Array.isArray(v) ? v : [];
}

function num(v: unknown, fallback = 0): number {
  const n = Number(v);
  return isNaN(n) ? fallback : n;
}

function str(v: unknown, fallback = "—"): string {
  if (v == null || v === "") return fallback;
  return String(v);
}

function fmt$(v: unknown): string {
  const n = Number(v);
  if (isNaN(n)) return str(v);
  return `$${n.toLocaleString()}`;
}

/** Map severity string → numeric 0-100 */
function severityToNum(v: unknown): number {
  if (typeof v === "number") return v;
  const s = String(v ?? "").toLowerCase();
  const map: Record<string, number> = {
    critical: 90,
    high: 75,
    medium: 50,
    moderate: 50,
    low: 25,
    minimal: 10,
    none: 0,
  };
  return map[s] ?? num(v, 50);
}

/* ── Main component ───────────────────────────────────────────────────── */

export default function DashboardView() {
  const [tab, setTab] = useState<TabKey>("overview");
  const sim = useCareerStore((s) => s.simulationData);

  if (!sim) return null;

  const db: Rec = sim.dashboard_data ?? {};
  const summary: Rec = sim.summary ?? {};
  const timeline: Rec | null = sim.timeline ?? null;
  const financial: Rec | null = sim.financial_analysis ?? null;
  const risk: Rec | null = sim.risk_assessment ?? null;
  const gap: Rec | null = sim.gap_analysis ?? null;

  return (
    <div>
      {/* Hero stats */}
      <StatsRow summary={summary} />

      {/* Tabs */}
      <div className="mb-6 flex gap-2 overflow-x-auto rounded-xl border border-white/10 bg-white/5 p-1.5">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
                tab === t.key
                  ? "bg-cyan-500/20 text-cyan-400"
                  : "text-white/50 hover:bg-white/5 hover:text-white/70"
              }`}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {tab === "overview" && <OverviewTab db={db} summary={summary} />}
      {tab === "timeline" && <TimelineTab timeline={timeline} db={db} />}
      {tab === "financial" && <FinancialTab financial={financial} db={db} />}
      {tab === "risk" && <RiskTab risk={risk} db={db} />}
      {tab === "skills" && <SkillsTab gap={gap} db={db} />}

      {/* Insights */}
      <InsightsSection db={db} />

      {/* Processing info */}
      <div className="mt-6 flex items-center gap-2 text-xs text-white/30">
        <Clock className="h-3 w-3" />
        Simulation completed in {(sim.processing_time_ms / 1000).toFixed(1)}s
        {sim.warnings.length > 0 && (
          <span className="ml-4 flex items-center gap-1 text-amber-400/60">
            <AlertTriangle className="h-3 w-3" /> {sim.warnings.length} warning(s)
          </span>
        )}
      </div>
    </div>
  );
}

/* ── Stats row ────────────────────────────────────────────────────────── */

function StatsRow({ summary }: { summary: Rec }) {
  const cards = [
    {
      label: "Success Probability",
      value:
        summary.success_probability != null
          ? `${num(summary.success_probability).toFixed(0)}%`
          : "—",
      icon: TrendingUp,
      color: "text-emerald-400",
    },
    {
      label: "Gap Score",
      value:
        summary.gap_score != null
          ? `${num(summary.gap_score).toFixed(0)}/100`
          : "—",
      icon: Target,
      color: "text-cyan-400",
    },
    {
      label: "Total Investment",
      value:
        summary.total_investment != null ? fmt$(summary.total_investment) : "—",
      icon: DollarSign,
      color: "text-amber-400",
    },
    {
      label: "5-Year ROI",
      value:
        summary.roi_5_year != null
          ? `${num(summary.roi_5_year).toFixed(0)}%`
          : "—",
      icon: BarChart3,
      color: "text-violet-400",
    },
    {
      label: "Timeline",
      value:
        summary.timeline_years != null ? `${summary.timeline_years} yrs` : "—",
      icon: Clock,
      color: "text-sky-400",
    },
    {
      label: "Recommended Path",
      value: str(summary.recommended_path),
      icon: Layers,
      color: "text-rose-400",
    },
  ];

  return (
    <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <div
            key={c.label}
            className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl"
          >
            <Icon className={`mb-2 h-5 w-5 ${c.color}`} />
            <p className="text-lg font-bold text-white">{c.value}</p>
            <p className="text-[11px] text-white/40">{c.label}</p>
          </div>
        );
      })}
    </div>
  );
}

/* ── Overview tab ─────────────────────────────────────────────────────── */

function OverviewTab({ db, summary }: { db: Rec; summary: Rec }) {
  const salaryData = asArr(db.salary_progression);
  const pathData = asArr(db.path_comparison);
  const selected: Rec | null = summary.selected_career ?? null;

  return (
    <div className="space-y-6">
      {/* Selected career card */}
      {selected && (
        <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-6">
          <h3 className="text-lg font-bold text-white">
            {str(selected.title, "Selected Career")}
          </h3>
          <p className="text-sm text-white/50">
            {str(selected.field, "")} · Fit Score:{" "}
            {num(selected.fit_score).toFixed(0)}%
          </p>
          {selected.tagline && (
            <p className="mt-1 text-sm italic text-cyan-400">
              &ldquo;{str(selected.tagline)}&rdquo;
            </p>
          )}
          <div className="mt-3 flex flex-wrap gap-3 text-xs text-white/50">
            {selected.difficulty_level && (
              <span>Difficulty: {str(selected.difficulty_level)}</span>
            )}
            {selected.time_to_entry && (
              <span>· Time to Entry: {str(selected.time_to_entry)}</span>
            )}
            {selected.typical_salary_range && (
              <span>· Salary: {str(selected.typical_salary_range)}</span>
            )}
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Salary progression */}
        {salaryData.length > 0 && (
          <ChartCard title="Salary Progression" icon={TrendingUp}>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={salaryData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.05)"
                />
                <XAxis
                  dataKey="year"
                  stroke="rgba(255,255,255,0.3)"
                  tick={{ fontSize: 11 }}
                />
                <YAxis
                  stroke="rgba(255,255,255,0.3)"
                  tick={{ fontSize: 11 }}
                />
                <Tooltip
                  contentStyle={{
                    background: "#111",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                  labelStyle={{ color: "#fff" }}
                />
                <Area
                  type="monotone"
                  dataKey="conservative"
                  stroke={EMERALD}
                  fill={EMERALD}
                  fillOpacity={0.08}
                />
                <Area
                  type="monotone"
                  dataKey="realistic"
                  stroke={CYAN}
                  fill={CYAN}
                  fillOpacity={0.15}
                />
                <Area
                  type="monotone"
                  dataKey="ambitious"
                  stroke={VIOLET}
                  fill={VIOLET}
                  fillOpacity={0.08}
                />
                <Legend />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {/* Path comparison */}
        {pathData.length > 0 && (
          <ChartCard title="Path Comparison" icon={Layers}>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={pathData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.05)"
                />
                <XAxis
                  dataKey="metric"
                  stroke="rgba(255,255,255,0.3)"
                  tick={{ fontSize: 10 }}
                />
                <YAxis
                  stroke="rgba(255,255,255,0.3)"
                  tick={{ fontSize: 11 }}
                />
                <Tooltip
                  contentStyle={{
                    background: "#111",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                  labelStyle={{ color: "#fff" }}
                />
                <Bar
                  dataKey="conservative"
                  fill={EMERALD}
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="realistic"
                  fill={CYAN}
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="ambitious"
                  fill={VIOLET}
                  radius={[4, 4, 0, 0]}
                />
                <Legend />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}
      </div>
    </div>
  );
}

/* ── Timeline tab ─────────────────────────────────────────────────────── */

function TimelineTab({ timeline, db }: { timeline: Rec | null; db: Rec }) {
  if (!timeline) return <Empty msg="Timeline data not available." />;

  const progressData = asArr(db.timeline_progress);
  const paths = [
    "conservative_path",
    "realistic_path",
    "ambitious_path",
  ] as const;

  return (
    <div className="space-y-6">
      {/* Recommendation */}
      <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-5">
        <h3 className="mb-1 text-sm font-semibold text-cyan-400">
          Recommended: {str(timeline.recommended_path)}
        </h3>
        <p className="text-sm text-white/60">
          {str(timeline.recommendation_reason, "")}
        </p>
      </div>

      {/* Progress chart */}
      {progressData.length > 0 && (
        <ChartCard title="Timeline Progress" icon={Clock}>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={progressData}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.05)"
              />
              <XAxis
                dataKey="task"
                stroke="rgba(255,255,255,0.3)"
                tick={{ fontSize: 9 }}
                angle={-15}
              />
              <YAxis
                stroke="rgba(255,255,255,0.3)"
                tick={{ fontSize: 11 }}
              />
              <Tooltip
                contentStyle={{
                  background: "#111",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
                labelStyle={{ color: "#fff" }}
              />
              <Line
                type="monotone"
                dataKey="duration"
                stroke={CYAN}
                strokeWidth={2}
                dot={{ r: 3 }}
                name="Hours"
              />
              <Line
                type="monotone"
                dataKey="cost"
                stroke={AMBER}
                strokeWidth={2}
                dot={{ r: 3 }}
                name="Cost"
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {/* Path details */}
      <div className="grid gap-4 lg:grid-cols-3">
        {paths.map((pKey) => {
          const path: Rec | null = timeline[pKey] ?? null;
          if (!path) return null;
          const color =
            pKey === "conservative_path"
              ? EMERALD
              : pKey === "realistic_path"
                ? CYAN
                : VIOLET;
          const label = pKey
            .replace("_path", "")
            .replace(/^./, (c) => c.toUpperCase());
          const yearlyPlans = asArr(path.yearly_plans);
          return (
            <div
              key={pKey}
              className="rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl"
            >
              <h4 className="mb-3 text-sm font-bold" style={{ color }}>
                {label} Path
              </h4>
              <p className="mb-2 text-xs text-white/50">
                {num(path.total_years, 0)} years →{" "}
                {str(path.final_target_role)}
              </p>
              <p className="mb-2 text-xs text-white/50">
                Success: {num(path.success_probability, 0).toFixed(0)}% · Salary:{" "}
                {fmt$(path.final_expected_salary)}
              </p>
              {/* Year milestones */}
              <div className="space-y-2">
                {yearlyPlans.slice(0, 4).map((y: Rec, i: number) => (
                  <div
                    key={i}
                    className="rounded-lg bg-white/5 px-3 py-2 text-xs"
                  >
                    <span className="font-bold text-white">
                      Year {num(y.year_number, i + 1)}
                    </span>
                    <span className="ml-2 text-white/40">
                      {str(y.primary_focus || y.focus_area, "")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Financial tab ────────────────────────────────────────────────────── */

function FinancialTab({ financial, db }: { financial: Rec | null; db: Rec }) {
  if (!financial) return <Empty msg="Financial data not available." />;

  const costIncomeData = asArr(db.cost_vs_income);
  const investmentData = asArr(db.investment_breakdown);
  const yearlyList = asArr(financial.yearly_financials);

  return (
    <div className="space-y-6">
      {/* Key numbers */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          {
            label: "Total Investment",
            value: fmt$(financial.total_investment_required),
          },
          {
            label: "Break-even Year",
            value: financial.break_even_year
              ? `Year ${financial.break_even_year}`
              : "—",
          },
          {
            label: "5-Year ROI",
            value: `${num(financial.five_year_roi).toFixed(0)}%`,
          },
          {
            label: "Affordability",
            value: str(financial.affordability_rating, "—")
              .replace(/^./, (c: string) => c.toUpperCase()),
          },
        ].map((c) => (
          <div
            key={c.label}
            className="rounded-xl border border-white/10 bg-white/5 p-4"
          >
            <p className="text-lg font-bold text-white">{c.value}</p>
            <p className="text-[11px] text-white/40">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {costIncomeData.length > 0 && (
          <ChartCard title="Investment vs Income" icon={DollarSign}>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={costIncomeData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.05)"
                />
                <XAxis
                  dataKey="year"
                  stroke="rgba(255,255,255,0.3)"
                  tick={{ fontSize: 11 }}
                />
                <YAxis
                  stroke="rgba(255,255,255,0.3)"
                  tick={{ fontSize: 11 }}
                />
                <Tooltip
                  contentStyle={{
                    background: "#111",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                  labelStyle={{ color: "#fff" }}
                />
                <Bar
                  dataKey="investment"
                  fill={ROSE}
                  radius={[4, 4, 0, 0]}
                  name="Investment"
                />
                <Bar
                  dataKey="income"
                  fill={EMERALD}
                  radius={[4, 4, 0, 0]}
                  name="Income"
                />
                <Legend />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {investmentData.length > 0 && (
          <ChartCard title="Investment Breakdown" icon={Layers}>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={investmentData}
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  dataKey="value"
                  nameKey="name"
                  label={({
                    name,
                    percent,
                  }: {
                    name?: string;
                    percent?: number;
                  }) =>
                    `${name ?? ""} ${((percent ?? 0) * 100).toFixed(0)}%`
                  }
                  labelLine={false}
                >
                  {investmentData.map((_: Rec, i: number) => (
                    <Cell
                      key={i}
                      fill={PIE_COLORS[i % PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "#111",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        )}
      </div>

      {/* Yearly breakdown table */}
      {yearlyList.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/5 p-4">
          <h4 className="mb-3 text-sm font-semibold text-white">
            Yearly Financial Breakdown
          </h4>
          <table className="w-full text-xs text-white/70">
            <thead>
              <tr className="border-b border-white/10 text-left text-white/40">
                <th className="pb-2 pr-4">Year</th>
                <th className="pb-2 pr-4">Investment</th>
                <th className="pb-2 pr-4">Income</th>
                <th className="pb-2 pr-4">Net Cash Flow</th>
                <th className="pb-2">Cumulative</th>
              </tr>
            </thead>
            <tbody>
              {yearlyList.map((r: Rec, i: number) => (
                <tr key={i} className="border-b border-white/5">
                  <td className="py-2 pr-4 font-medium text-white">
                    Year {num(r.year_number, i + 1)}
                  </td>
                  <td className="py-2 pr-4 text-rose-400">
                    {fmt$(r.total_investment)}
                  </td>
                  <td className="py-2 pr-4 text-emerald-400">
                    {fmt$(r.expected_income)}
                  </td>
                  <td className="py-2 pr-4">
                    <span
                      className={
                        num(r.net_cash_flow) >= 0
                          ? "text-emerald-400"
                          : "text-rose-400"
                      }
                    >
                      {fmt$(r.net_cash_flow)}
                    </span>
                  </td>
                  <td className="py-2 text-white/50">
                    {fmt$(r.cumulative_investment)} / {fmt$(r.cumulative_income)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Cost saving tips */}
      {asArr(financial.cost_saving_opportunities).length > 0 && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
          <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
            <Lightbulb className="h-4 w-4 text-emerald-400" /> Cost Saving
            Opportunities
          </h4>
          <ul className="space-y-1">
            {asArr(financial.cost_saving_opportunities).map(
              (tip: unknown, i: number) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-xs text-white/60"
                >
                  <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-emerald-400" />
                  {String(tip)}
                </li>
              )
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ── Risk tab ─────────────────────────────────────────────────────────── */

function RiskTab({ risk, db }: { risk: Rec | null; db: Rec }) {
  if (!risk) return <Empty msg="Risk data not available." />;

  const riskBreakdownData = asArr(db.risk_breakdown);
  const riskFactors = asArr(risk.risk_factors);

  return (
    <div className="space-y-6">
      {/* Score cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          {
            label: "Success Probability",
            value: `${num(risk.success_probability_score).toFixed(0)}%`,
          },
          {
            label: "Confidence",
            value: str(risk.confidence_interval),
          },
          {
            label: "Market Risk",
            value: `${num(risk.market_risk_score).toFixed(0)}/100`,
          },
          {
            label: "Financial Risk",
            value: `${num(risk.financial_risk_score).toFixed(0)}/100`,
          },
        ].map((c) => (
          <div
            key={c.label}
            className="rounded-xl border border-white/10 bg-white/5 p-4"
          >
            <p className="text-lg font-bold text-white">{c.value}</p>
            <p className="text-[11px] text-white/40">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Risk breakdown radar */}
      {riskBreakdownData.length > 0 && (
        <ChartCard title="Risk Breakdown" icon={Shield}>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={riskBreakdownData}>
              <PolarGrid stroke="rgba(255,255,255,0.1)" />
              <PolarAngleAxis
                dataKey="name"
                stroke="rgba(255,255,255,0.4)"
                tick={{ fontSize: 10 }}
              />
              <PolarRadiusAxis
                angle={30}
                domain={[0, 100]}
                stroke="rgba(255,255,255,0.1)"
              />
              <Radar
                name="Risk"
                dataKey="value"
                stroke={ROSE}
                fill={ROSE}
                fillOpacity={0.2}
              />
            </RadarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {/* Risk factors table */}
      {riskFactors.length > 0 && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <h4 className="mb-3 text-sm font-semibold text-white">
            Risk Factors
          </h4>
          <div className="space-y-3">
            {riskFactors.map((r: Rec, i: number) => {
              const sev = severityToNum(r.severity);
              const barColor =
                sev > 70
                  ? "bg-rose-500"
                  : sev > 40
                    ? "bg-amber-500"
                    : "bg-emerald-500";
              const mitigations = asArr(r.mitigation_strategies);
              return (
                <div key={i}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-white">
                      {str(r.factor_name, "Risk")}
                    </span>
                    <span className="text-white/50">
                      {str(r.severity, "medium")
                        .charAt(0)
                        .toUpperCase() +
                        str(r.severity, "medium").slice(1)}{" "}
                      ({sev}/100)
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-white/10">
                    <div
                      className={`h-1.5 rounded-full ${barColor}`}
                      style={{ width: `${sev}%` }}
                    />
                  </div>
                  {r.impact_description && (
                    <p className="mt-1 text-[11px] text-white/50">
                      {str(r.impact_description)}
                    </p>
                  )}
                  {mitigations.length > 0 && (
                    <p className="mt-0.5 text-[11px] text-white/40">
                      Mitigation: {String(mitigations[0])}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Scenarios */}
      {(risk.best_case_scenario ||
        risk.most_likely_scenario ||
        risk.worst_case_scenario) && (
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            {
              label: "Best Case",
              text: risk.best_case_scenario,
              cls: "border-emerald-500/30 bg-emerald-500/5",
            },
            {
              label: "Most Likely",
              text: risk.most_likely_scenario,
              cls: "border-cyan-500/30 bg-cyan-500/5",
            },
            {
              label: "Worst Case",
              text: risk.worst_case_scenario,
              cls: "border-rose-500/30 bg-rose-500/5",
            },
          ]
            .filter((s) => s.text)
            .map((s, i) => (
              <div key={i} className={`rounded-xl border p-4 ${s.cls}`}>
                <h5 className="mb-1 text-sm font-bold text-white">
                  {s.label}
                </h5>
                <p className="text-xs text-white/50">{str(s.text)}</p>
              </div>
            ))}
        </div>
      )}

      {/* Positive / Negative factors */}
      <div className="grid gap-4 sm:grid-cols-2">
        {asArr(risk.positive_factors).length > 0 && (
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
            <h4 className="mb-2 text-sm font-semibold text-emerald-400">
              Positive Factors
            </h4>
            <ul className="space-y-1">
              {asArr(risk.positive_factors).map(
                (f: unknown, i: number) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-xs text-white/60"
                  >
                    <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-emerald-400" />
                    {String(f)}
                  </li>
                )
              )}
            </ul>
          </div>
        )}
        {asArr(risk.negative_factors).length > 0 && (
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4">
            <h4 className="mb-2 text-sm font-semibold text-rose-400">
              Risk Concerns
            </h4>
            <ul className="space-y-1">
              {asArr(risk.negative_factors).map(
                (f: unknown, i: number) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-xs text-white/60"
                  >
                    <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-rose-400" />
                    {String(f)}
                  </li>
                )
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Skills & Gaps tab ────────────────────────────────────────────────── */

function SkillsTab({ gap, db }: { gap: Rec | null; db: Rec }) {
  const skillRadarData = asArr(db.skill_radar);
  const gapChartData = asArr(db.gap_analysis_chart);

  return (
    <div className="space-y-6">
      {/* Gap overview */}
      {gap && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-lg font-bold text-white">
              {num(gap.overall_gap_score).toFixed(0)}/100
            </p>
            <p className="text-[11px] text-white/40">Overall Gap</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-lg font-bold text-white">
              {str(gap.gap_category)}
            </p>
            <p className="text-[11px] text-white/40">Gap Category</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-lg font-bold text-white">
              {str(gap.education_gap, "None")}
            </p>
            <p className="text-[11px] text-white/40">Education Gap</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-lg font-bold text-white">
              {asArr(gap.critical_bottlenecks).length}
            </p>
            <p className="text-[11px] text-white/40">Bottlenecks</p>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Skill radar */}
        {skillRadarData.length > 0 && (
          <ChartCard title="Skill Radar" icon={Target}>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={skillRadarData}>
                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                <PolarAngleAxis
                  dataKey="skill"
                  stroke="rgba(255,255,255,0.4)"
                  tick={{ fontSize: 10 }}
                />
                <PolarRadiusAxis
                  angle={30}
                  domain={[0, 100]}
                  stroke="rgba(255,255,255,0.1)"
                />
                <Radar
                  name="Current"
                  dataKey="current"
                  stroke={CYAN}
                  fill={CYAN}
                  fillOpacity={0.15}
                />
                <Radar
                  name="Required"
                  dataKey="required"
                  stroke={VIOLET}
                  fill={VIOLET}
                  fillOpacity={0.1}
                />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {/* Gap analysis chart */}
        {gapChartData.length > 0 && (
          <ChartCard title="Gap Analysis" icon={BarChart3}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={gapChartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.05)"
                />
                <XAxis
                  dataKey="skill"
                  stroke="rgba(255,255,255,0.3)"
                  tick={{ fontSize: 10 }}
                  angle={-20}
                />
                <YAxis
                  stroke="rgba(255,255,255,0.3)"
                  tick={{ fontSize: 11 }}
                />
                <Tooltip
                  contentStyle={{
                    background: "#111",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                  labelStyle={{ color: "#fff" }}
                />
                <Bar dataKey="gap" fill={AMBER} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}
      </div>

      {/* Skill gaps list */}
      {gap && asArr(gap.technical_skill_gaps).length > 0 && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <h4 className="mb-3 text-sm font-semibold text-white">
            Technical Skill Gaps
          </h4>
          <div className="space-y-3">
            {asArr(gap.technical_skill_gaps).map((g: Rec, i: number) => {
              const sev = num(g.gap_severity, 50);
              return (
                <div key={i}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-white">
                      {str(g.skill_name, "Skill")}
                    </span>
                    <span className="text-white/50">
                      {str(g.current_level, "?")} →{" "}
                      {str(g.required_level, "?")}
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-white/10">
                    <div
                      className="h-1.5 rounded-full bg-amber-500"
                      style={{ width: `${Math.min(sev, 100)}%` }}
                    />
                  </div>
                  {g.estimated_time_to_close && (
                    <p className="mt-1 text-[11px] text-white/40">
                      Est. time: {str(g.estimated_time_to_close)}
                    </p>
                  )}
                  {asArr(g.recommended_resources).length > 0 && (
                    <p className="mt-0.5 text-[11px] text-white/30">
                      Resources:{" "}
                      {asArr(g.recommended_resources).slice(0, 2).join(", ")}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Existing strengths */}
      {gap && asArr(gap.existing_strengths).length > 0 && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
          <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Your Existing
            Strengths
          </h4>
          <div className="flex flex-wrap gap-2">
            {asArr(gap.existing_strengths).map(
              (s: unknown, i: number) => (
                <span
                  key={i}
                  className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs text-emerald-300"
                >
                  {String(s)}
                </span>
              )
            )}
          </div>
        </div>
      )}

      {/* Top priorities */}
      {gap && asArr(gap.top_priorities).length > 0 && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
            <Lightbulb className="h-4 w-4 text-amber-400" /> Top Priorities
          </h4>
          <div className="space-y-2">
            {asArr(gap.top_priorities).map(
              (item: unknown, i: number) => (
                <div
                  key={i}
                  className="flex gap-3 rounded-lg bg-white/5 p-3 text-xs text-white/70"
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-[10px] font-bold text-cyan-400">
                    {i + 1}
                  </span>
                  {String(item)}
                </div>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Insights section ─────────────────────────────────────────────────── */

function InsightsSection({ db }: { db: Rec }) {
  const insights = asArr(db.key_insights);
  const actions = asArr(db.immediate_actions);
  const recommendations = asArr(db.top_recommendations);

  if (!insights.length && !actions.length && !recommendations.length)
    return null;

  return (
    <div className="mt-8 space-y-6">
      {/* Key insights */}
      {insights.length > 0 && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-white">
            <Lightbulb className="h-4 w-4 text-amber-400" /> Key Insights
          </h3>
          <div className="space-y-3">
            {insights.map((item: Rec, i: number) => (
              <div key={i} className="rounded-lg bg-white/5 p-3">
                <div className="flex items-center gap-2">
                  {item.priority === "positive" && (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  )}
                  {item.priority === "high" && (
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                  )}
                  <p className="text-sm font-medium text-white">
                    {item.title ? `${str(item.title)}: ` : ""}
                    {str(item.insight, String(item))}
                  </p>
                </div>
                {item.reasoning && (
                  <p className="mt-1 text-xs text-white/40">
                    {str(item.reasoning)}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Immediate actions — items are {action, priority, timeframe, impact} */}
      {actions.length > 0 && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-white">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Immediate
            Actions
          </h3>
          <div className="space-y-3">
            {actions.map((a: Rec, i: number) => (
              <div
                key={i}
                className="flex items-start gap-3 rounded-lg bg-white/5 p-3"
              >
                <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">
                    {str(a.action, String(a))}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-3 text-[11px] text-white/40">
                    {a.priority && (
                      <span
                        className={`rounded-full px-2 py-0.5 ${
                          a.priority === "high"
                            ? "bg-rose-500/15 text-rose-300"
                            : "bg-cyan-500/15 text-cyan-300"
                        }`}
                      >
                        {str(a.priority)}
                      </span>
                    )}
                    {a.timeframe && <span>⏱ {str(a.timeframe)}</span>}
                    {a.impact && <span>💡 {str(a.impact)}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations — items are plain strings */}
      {recommendations.length > 0 && (
        <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-5">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-white">
            <Target className="h-4 w-4 text-violet-400" /> Recommendations
          </h3>
          <ul className="space-y-2">
            {recommendations.map((r: unknown, i: number) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sm text-white/70"
              >
                <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-violet-400" />
                {String(r)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ── Shared primitives ────────────────────────────────────────────────── */

function ChartCard({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
      <h4 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
        <Icon className="h-4 w-4 text-cyan-400" /> {title}
      </h4>
      {children}
    </div>
  );
}

function Empty({ msg }: { msg: string }) {
  return (
    <div className="flex flex-col items-center py-20 text-center text-white/40">
      <AlertTriangle className="mb-3 h-8 w-8" />
      <p>{msg}</p>
    </div>
  );
}
