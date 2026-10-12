import React, { useState, useMemo } from 'react';
import {
  Download,
  RotateCcw,
  Database,
  Upload
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  ComposedChart
} from 'recharts';
import { MasterData } from '../types/athletix';
import {
  Button,
  Card,
  Badge,
  SegmentedControl,
  SelectDropdown,
  ChartContainer,
  EmptyState,
  PageHeader,
} from './ui/DesignSystem';

interface AnalyticsTabProps {
  data: MasterData;
  hasDataset: boolean;
  isAnalyzing: boolean;
  onExportResults: () => void;
  onNavigateToTab: (tab: string) => void;
}

const TOOLTIP_STYLE = {
  backgroundColor: '#0d1320',
  borderColor: '#334155',
  borderRadius: '8px',
  fontSize: '12px',
  color: '#f8fafc',
};

export const AnalyticsTab: React.FC<AnalyticsTabProps> = ({
  data,
  hasDataset,
  isAnalyzing,
  onExportResults,
  onNavigateToTab,
}) => {
  const [squadFilter, setSquadFilter] = useState<'All' | 'Vertex Alpha' | 'Vertex Beta'>('All');
  const [positionFilter, setPositionFilter] = useState<string>('All');

  const { players, matches, playerMatchLogs } = data;

  const filteredPlayers = useMemo(() => {
    return players.filter((p) => {
      const matchesSquad = squadFilter === 'All' || p.academyTeam === squadFilter;
      const matchesPos =
        positionFilter === 'All' ||
        p.position.toLowerCase() === positionFilter.toLowerCase();
      return matchesSquad && matchesPos;
    });
  }, [players, squadFilter, positionFilter]);

  const filteredPlayerIds = useMemo(
    () => new Set(filteredPlayers.map((p) => p.playerId)),
    [filteredPlayers]
  );

  // 1. Performance Trends: Historical player performance across matches
  const matchPerformanceTrends = useMemo(() => {
    const relevantMatches =
      squadFilter === 'All'
        ? matches
        : matches.filter((m) => m.team === squadFilter);

    return relevantMatches.map((m) => {
      let totalRating = 0;
      let count = 0;
      Object.entries(playerMatchLogs).forEach(([pid, logs]) => {
        if (!filteredPlayerIds.has(pid)) return;
        const entry = logs.find((l) => l.matchId === m.matchId);
        if (entry) {
          totalRating += entry.rating;
          count++;
        }
      });
      return {
        matchId: m.matchId,
        date: m.date,
        opponent: m.opponent,
        result: m.result,
        avgRating: count > 0 ? Number((totalRating / count).toFixed(2)) : 0,
        goalsFor: m.goalsFor,
      };
    });
  }, [matches, playerMatchLogs, squadFilter, filteredPlayerIds]);

  // 2. Attack: Goals and assists
  const attackData = useMemo(() => {
    return [...filteredPlayers]
      .filter((p) => p.goals > 0 || p.assists > 0)
      .sort((a, b) => b.goals + b.assists - (a.goals + a.assists))
      .slice(0, 10)
      .map((p) => ({
        name: p.name.split(' ')[0],
        fullName: p.name,
        position: p.position,
        goals: p.goals,
        assists: p.assists,
        shots: p.shots,
      }));
  }, [filteredPlayers]);

  // 3. Passing: Pass accuracy and successful passes
  const passingData = useMemo(() => {
    return [...filteredPlayers]
      .sort((a, b) => b.passesCompleted - a.passesCompleted)
      .slice(0, 10)
      .map((p) => ({
        name: p.name.split(' ')[0],
        fullName: p.name,
        passesCompleted: p.passesCompleted,
        passAccuracy: Number(p.passAccuracy.toFixed(1)),
      }));
  }, [filteredPlayers]);

  // 4. Interaction: Player interaction volume vs AI Score
  const interactionData = useMemo(() => {
    return filteredPlayers.map((p) => ({
      name: p.name,
      interactions: p.totalInteractions,
      score: Number(p.performanceScore.toFixed(2)),
      weightedDegree: Number(p.weightedInvolvement.toFixed(1)),
      position: p.position,
    }));
  }, [filteredPlayers]);

  // 5. AI Score Distribution
  const scoreDistribution = useMemo(() => {
    const buckets = [
      { range: '55–69', count: 0 },
      { range: '70–79', count: 0 },
      { range: '80–84', count: 0 },
      { range: '85–89', count: 0 },
      { range: '90–92', count: 0 },
      { range: '93–100', count: 0 },
    ];

    filteredPlayers.forEach((p) => {
      const s = p.performanceScore;
      if (s < 70) buckets[0].count++;
      else if (s < 80) buckets[1].count++;
      else if (s < 85) buckets[2].count++;
      else if (s < 90) buckets[3].count++;
      else if (s < 93) buckets[4].count++;
      else buckets[5].count++;
    });

    return buckets;
  }, [filteredPlayers]);

  const hasFilters = squadFilter !== 'All' || positionFilter !== 'All';

  if (!hasDataset) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Analytics"
          description="Visual breakdown of historical performance trends, attacking output, passing efficiency, interaction volume, and AI score distributions."
        />
        <EmptyState
          icon={<Database className="w-5 h-5" />}
          title="No dataset available"
          description="Upload a historical match dataset to begin analysis."
          action={
            <Button
              variant="primary"
              leftIcon={<Upload className="w-4 h-4" />}
              onClick={() => onNavigateToTab('data-mgmt')}
            >
              Upload Dataset
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. PAGE TITLE & CONTEXT */}
      <PageHeader
        title="Performance & Statistical Analytics"
        description="Examine historical match performance trends, attacking contributions, passing accuracy, interaction volume, and regression score distributions."
        badge={
          <Badge variant="neutral" mono>
            {filteredPlayers.length} Players • {matchPerformanceTrends.length} Fixtures
          </Badge>
        }
        actions={
          <Button
            variant="secondary"
            size="md"
            leftIcon={<Download className="w-4 h-4" />}
            onClick={onExportResults}
          >
            Export Results
          </Button>
        }
      />

      {/* 2. CONTROLS BAR */}
      <Card className="p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <SegmentedControl
            label="Squad:"
            options={[
              { value: 'All', label: 'All Squads' },
              ...Array.from(
                new Set(players.map((p) => p.academyTeam).filter(Boolean))
              ).map((t) => ({ value: t, label: t })),
            ]}
            value={squadFilter}
            onChange={(val) => setSquadFilter(val as any)}
          />

          <SelectDropdown
            label="Position:"
            value={positionFilter}
            onChange={setPositionFilter}
            options={[
              { value: 'All', label: 'All Positions' },
              { value: 'Forward', label: 'Forward' },
              { value: 'Midfielder', label: 'Midfielder' },
              { value: 'Defender', label: 'Defender' },
              { value: 'Goalkeeper', label: 'Goalkeeper' },
            ]}
            className="w-48"
          />
        </div>

        {hasFilters && (
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
            onClick={() => {
              setSquadFilter('All');
              setPositionFilter('All');
            }}
          >
            Reset Filters
          </Button>
        )}
      </Card>

      {/* 3. MAIN CONTENT: SEPARATE CHART SECTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SECTION 1: Performance Trends */}
        <ChartContainer
          title="Performance Trends"
          subtitle="Historical player performance ratings averaged across analyzed fixtures."
          badge={<Badge variant="brand">Match Progression</Badge>}
          isLoading={isAnalyzing}
          footer={
            <>
              <span>Metric: Average player match rating (0–10 scale)</span>
              <span className="font-mono">{matchPerformanceTrends.length} Matches</span>
            </>
          }
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={matchPerformanceTrends}
              margin={{ top: 10, right: 16, left: -12, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis
                dataKey="matchId"
                stroke="#64748b"
                tick={{ fontSize: 11, fill: '#94a3b8' }}
              />
              <YAxis
                domain={[5.5, 9.0]}
                ticks={[6, 7, 8, 9]}
                stroke="#64748b"
                tick={{ fontSize: 11, fill: '#94a3b8' }}
              />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                formatter={(val: any) => [`${val} / 10.0`, 'Avg Match Rating']}
                labelFormatter={(id) => {
                  const m = matchPerformanceTrends.find((x) => x.matchId === id);
                  return m ? `${id} • vs ${m.opponent} (${m.result})` : id;
                }}
              />
              <Line
                type="monotone"
                dataKey="avgRating"
                name="Avg Match Rating"
                stroke="#10b981"
                strokeWidth={2.5}
                dot={{ r: 3.5, fill: '#10b981' }}
                activeDot={{ r: 5.5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* SECTION 5: AI Score Distribution */}
        <ChartContainer
          title="AI Score Distribution"
          subtitle="Distribution of regression-generated player performance scores across cohorts."
          badge={<Badge variant="info">Scikit-Learn Ridge</Badge>}
          isLoading={isAnalyzing}
          footer={
            <>
              <span>Score buckets from 55 to 100</span>
              <span className="font-mono">{filteredPlayers.length} Athletes</span>
            </>
          }
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={scoreDistribution}
              margin={{ top: 10, right: 16, left: -12, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis
                dataKey="range"
                stroke="#64748b"
                tick={{ fontSize: 11, fill: '#94a3b8' }}
              />
              <YAxis
                allowDecimals={false}
                stroke="#64748b"
                tick={{ fontSize: 11, fill: '#94a3b8' }}
              />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                formatter={(val: any) => [`${val} Players`, 'Cohort Count']}
              />
              <Bar
                dataKey="count"
                name="Players"
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SECTION 2: Attack */}
        <ChartContainer
          title="Attack"
          subtitle="Goals and assists recorded by top offensive and midfield contributors."
          badge={<Badge variant="warning">Goals & Assists</Badge>}
          isLoading={isAnalyzing}
          footer={
            <>
              <span>Top contributors ordered by combined Goals + Assists</span>
              <span className="font-mono">Historical Totals</span>
            </>
          }
        >
          {attackData.length === 0 ? (
            <EmptyState
              title="No attacking records for filter"
              description="Try selecting All Positions to compare goals and assists."
            />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={attackData}
                margin={{ top: 10, right: 16, left: -12, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis
                  dataKey="name"
                  stroke="#64748b"
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                />
                <YAxis
                  allowDecimals={false}
                  stroke="#64748b"
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar
                  dataKey="goals"
                  name="Goals"
                  fill="#f43f5e"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="assists"
                  name="Assists"
                  fill="#f59e0b"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartContainer>

        {/* SECTION 3: Passing */}
        <ChartContainer
          title="Passing"
          subtitle="Comparison of successful passes and pass completion accuracy (%) for top volume passers."
          badge={<Badge variant="success">Volume & Accuracy</Badge>}
          isLoading={isAnalyzing}
          footer={
            <>
              <span>Bars: Successful Passes • Line: Pass Accuracy (%)</span>
              <span className="font-mono">Top 10 Passers</span>
            </>
          }
        >
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={passingData}
              margin={{ top: 10, right: 8, left: -12, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis
                dataKey="name"
                stroke="#64748b"
                tick={{ fontSize: 11, fill: '#94a3b8' }}
              />
              <YAxis
                yAxisId="left"
                stroke="#64748b"
                tick={{ fontSize: 11, fill: '#94a3b8' }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                domain={[70, 100]}
                unit="%"
                stroke="#64748b"
                tick={{ fontSize: 11, fill: '#94a3b8' }}
              />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar
                yAxisId="left"
                dataKey="passesCompleted"
                name="Successful Passes"
                fill="#10b981"
                radius={[4, 4, 0, 0]}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="passAccuracy"
                name="Pass Accuracy (%)"
                stroke="#38bdf8"
                strokeWidth={2}
                dot={{ r: 3.5, fill: '#38bdf8' }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      {/* SECTION 4: Interaction */}
      <ChartContainer
        title="Interaction"
        subtitle="Player interaction volume plotted against regression-generated AI Performance Score."
        badge={<Badge variant="neutral">Graph Volume vs AI Score</Badge>}
        heightClass="h-80"
        isLoading={isAnalyzing}
        footer={
          <>
            <span>X-Axis: Total Pass Interactions • Y-Axis: AI Performance Score</span>
            <span className="font-mono">Java PlayerInteractionGraph</span>
          </>
        }
      >
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 12, right: 20, left: -8, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis
              type="number"
              dataKey="interactions"
              name="Interaction Volume"
              unit=" passes"
              stroke="#64748b"
              tick={{ fontSize: 11, fill: '#94a3b8' }}
            />
            <YAxis
              type="number"
              dataKey="score"
              name="AI Score"
              domain={[50, 100]}
              stroke="#64748b"
              tick={{ fontSize: 11, fill: '#94a3b8' }}
            />
            <Tooltip
              cursor={{ strokeDasharray: '3 3' }}
              contentStyle={TOOLTIP_STYLE}
              formatter={(val: any, name: string) => [
                name === 'AI Score' ? `${val} / 100` : `${val} passes`,
                name,
              ]}
            />
            <Scatter
              name="Players"
              data={interactionData}
              fill="#10b981"
            />
          </ScatterChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
};
