import React, { useState, useMemo } from 'react';
import {
  Users,
  Calendar,
  TrendingUp,
  Award,
  Play,
  Trophy,
  Download,
  RotateCcw,
  Share2,
  Target,
  Activity,
  Database,
  Upload
} from 'lucide-react';
import { MasterData, PlayerRanking, PlayerProfile } from '../types/athletix';
import {
  Button,
  KpiCard,
  Card,
  Badge,
  PositionBadge,
  RankBadge,
  SegmentedControl,
  SearchInput,
  SelectDropdown,
  EmptyState,
  SkeletonCard,
  SkeletonTable,
  PageHeader,
} from './ui/DesignSystem';

interface DashboardTabProps {
  data: MasterData;
  hasDataset: boolean;
  hasAnalysisResults: boolean;
  isAnalyzing: boolean;
  onRunAnalysis: () => void;
  onExportResults: () => void;
  onSelectPlayer: (player: PlayerProfile) => void;
  onNavigateToTab: (tab: string) => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  data,
  hasDataset,
  hasAnalysisResults,
  isAnalyzing,
  onRunAnalysis,
  onExportResults,
  onSelectPlayer,
  onNavigateToTab,
}) => {
  const [topKFilter, setTopKFilter] = useState<'3' | '5' | '10'>('5');
  const [searchQuery, setSearchQuery] = useState('');
  const [positionFilter, setPositionFilter] = useState('All');

  const { summary, top3, top5, top10, players } = data;

  const baseTopK: PlayerRanking[] =
    topKFilter === '3' ? top3 : topKFilter === '5' ? top5 : top10;

  const filteredTopK = useMemo(() => {
    return baseTopK.filter((r) => {
      const matchesPosition =
        positionFilter === 'All' ||
        r.position.toLowerCase() === positionFilter.toLowerCase();
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        r.name.toLowerCase().includes(q) ||
        r.playerId.toLowerCase().includes(q) ||
        r.team.toLowerCase().includes(q) ||
        r.position.toLowerCase().includes(q);
      return matchesPosition && matchesSearch;
    });
  }, [baseTopK, positionFilter, searchQuery]);

  const hasActiveFilters = searchQuery.trim() !== '' || positionFilter !== 'All';

  const resetFilters = () => {
    setSearchQuery('');
    setPositionFilter('All');
  };

  // Automatically generated insights strictly derived from dataset
  const insights = useMemo(() => {
    if (!players || players.length === 0) return null;
    const highestPerforming = [...players].sort(
      (a, b) => b.performanceScore - a.performanceScore
    )[0];
    const highestInteraction = [...players].sort(
      (a, b) => b.totalInteractions - a.totalInteractions
    )[0];
    const highestPassAccuracy = [...players].sort(
      (a, b) => b.passAccuracy - a.passAccuracy
    )[0];
    const strongRecentForm = [...players].sort(
      (a, b) => b.recentForm - a.recentForm
    )[0];

    return {
      highestPerforming,
      highestInteraction,
      highestPassAccuracy,
      strongRecentForm,
    };
  }, [players]);

  const uniqueSquadCount = useMemo(() => {
    return new Set(players.map((p) => p.academyTeam)).size;
  }, [players]);

  if (!hasDataset) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Player Performance Overview"
          description="Analyze historical match data and identify top-performing players using regression-based scoring and Java Top-K ranking."
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
      {/* 1. PAGE HEADER */}
      <PageHeader
        title="Player Performance Overview"
        description="Analyze historical match data and identify top-performing players using regression-based scoring and Java Top-K ranking."
        badge={
          <Badge variant="brand" mono>
            Batch Pipeline
          </Badge>
        }
        actions={
          <>
            <Button
              variant="secondary"
              size="md"
              leftIcon={<Download className="w-4 h-4" />}
              onClick={onExportResults}
            >
              Export Results
            </Button>
            <Button
              variant="secondary"
              size="md"
              leftIcon={<Trophy className="w-4 h-4" />}
              onClick={() => onNavigateToTab('rankings')}
            >
              View Rankings
            </Button>
            <Button
              variant="primary"
              size="md"
              isLoading={isAnalyzing}
              loadingText="Running Analysis..."
              leftIcon={<Play className="w-4 h-4" />}
              onClick={onRunAnalysis}
            >
              Run Analysis
            </Button>
          </>
        }
      />

      {/* 2. KPI SECTION */}
      <section aria-label="Key Performance Indicators">
        {isAnalyzing ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              label="Total Players"
              value={summary.totalPlayers}
              subValue="Athletes"
              accentColor="emerald"
              icon={<Users className="w-4 h-4" />}
              contextText={
                <>
                  <span>Evaluated across {uniqueSquadCount} squads</span>
                  <span className="font-mono text-emerald-400">100%</span>
                </>
              }
            />

            <KpiCard
              label="Matches Analyzed"
              value={summary.matchesAnalyzed}
              subValue="Fixtures"
              accentColor="blue"
              icon={<Calendar className="w-4 h-4" />}
              contextText={
                <>
                  <span>Total pass interactions</span>
                  <span className="font-mono text-slate-200 tabular-nums">
                    {summary.totalInteractions.toLocaleString()}
                  </span>
                </>
              }
            />

            <KpiCard
              label="Average Score"
              value={summary.avgPerformanceScore.toFixed(2)}
              subValue="/ 100"
              accentColor="slate"
              icon={<TrendingUp className="w-4 h-4" />}
              contextText={
                <>
                  <span>Scikit-Learn regression</span>
                  <span className="font-mono text-slate-300">Ridge Model</span>
                </>
              }
            />

            <KpiCard
              label="Top Player"
              value={summary.topPlayer?.name || '—'}
              accentColor="amber"
              icon={<Award className="w-4 h-4" />}
              onClick={() => {
                const topProfile = players.find(
                  (p) => p.playerId === summary.topPlayer?.playerId
                );
                if (topProfile) onSelectPlayer(topProfile);
              }}
              contextText={
                summary.topPlayer ? (
                  <>
                    <span>
                      {summary.topPlayer.position} • {summary.topPlayer.team}
                    </span>
                    <span className="font-mono font-semibold text-amber-300 tabular-nums">
                      {summary.topPlayer.performanceScore.toFixed(2)}
                    </span>
                  </>
                ) : null
              }
            />
          </div>
        )}
      </section>

      {/* 3. TOP-K RANKING SECTION */}
      <section aria-label="Top-K Player Rankings">
        <Card noPadding className="overflow-hidden">
          {/* Section Header & Controls */}
          <div className="p-5 border-b border-slate-800/90 space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-base font-bold text-slate-100">
                    Top-K Player Rankings
                  </h2>
                  <Badge variant="neutral" mono>
                    Java PriorityQueue Heap
                  </Badge>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Deterministic Top-{topKFilter} extraction ordered by AI Score, Recent Form, and Player ID.
                </p>
              </div>

              {/* Top-K Segmented Selector */}
              <SegmentedControl
                options={[
                  { value: '3', label: 'Top 3' },
                  { value: '5', label: 'Top 5' },
                  { value: '10', label: 'Top 10' },
                ]}
                value={topKFilter}
                onChange={setTopKFilter}
              />
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
              <SearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search Top-K by player name, ID, or squad..."
                className="flex-1"
              />

              <div className="flex items-center gap-2.5">
                <SelectDropdown
                  value={positionFilter}
                  onChange={setPositionFilter}
                  ariaLabel="Filter by position"
                  options={[
                    { value: 'All', label: 'All Positions' },
                    { value: 'Forward', label: 'Forward' },
                    { value: 'Midfielder', label: 'Midfielder' },
                    { value: 'Defender', label: 'Defender' },
                    { value: 'Goalkeeper', label: 'Goalkeeper' },
                  ]}
                  className="w-full sm:w-44"
                />

                {hasActiveFilters && (
                  <Button
                    variant="secondary"
                    size="md"
                    leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                    onClick={resetFilters}
                  >
                    Reset Filters
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Table Content */}
          {isAnalyzing ? (
            <div className="p-5">
              <SkeletonTable rows={Number(topKFilter)} />
            </div>
          ) : !hasAnalysisResults ? (
            <div className="p-6">
              <EmptyState
                title="No analysis results"
                description="Run the Java and Python analysis pipeline to generate rankings."
                action={
                  <Button
                    variant="primary"
                    leftIcon={<Play className="w-4 h-4" />}
                    onClick={onRunAnalysis}
                  >
                    Run Analysis
                  </Button>
                }
              />
            </div>
          ) : filteredTopK.length === 0 ? (
            <div className="p-6">
              <EmptyState
                title="No players found"
                description="Try changing your search or filters."
                action={
                  <Button
                    variant="secondary"
                    leftIcon={<RotateCcw className="w-4 h-4" />}
                    onClick={resetFilters}
                  >
                    Reset Filters
                  </Button>
                }
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800/90 bg-[#0d1320] text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    <th className="py-3 px-5">Rank</th>
                    <th className="py-3 px-4">Player</th>
                    <th className="py-3 px-4">Position</th>
                    <th className="py-3 px-4 text-right">AI Score</th>
                    <th className="py-3 px-4 text-right">Recent Form</th>
                    <th className="py-3 px-4 text-right">Interactions</th>
                    <th className="py-3 px-5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70 text-sm">
                  {filteredTopK.map((r) => {
                    const profile = players.find((p) => p.playerId === r.playerId);
                    return (
                      <tr
                        key={r.playerId}
                        onClick={() => profile && onSelectPlayer(profile)}
                        className="player-row-hover transition-colors cursor-pointer group"
                      >
                        <td className="py-3.5 px-5">
                          <RankBadge rank={r.rank} />
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <span className="player-name font-semibold text-slate-100 transition-colors">
                              {r.name}
                            </span>
                            <span className="player-meta text-xs font-mono text-slate-500">
                              #{r.squadNumber}
                            </span>
                          </div>
                          <div className="player-meta text-xs text-slate-400 mt-0.5">
                            {r.team} • <span className="font-mono text-[11px]">{r.playerId}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <PositionBadge position={r.position} />
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <span className="player-score-badge inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-mono font-semibold tabular-nums bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                            {r.performanceScore.toFixed(2)}
                          </span>
                        </td>
                        <td className="player-stat-value py-3.5 px-4 text-right font-mono text-slate-200 tabular-nums">
                          {r.recentForm.toFixed(1)}
                        </td>
                        <td className="player-stat-value py-3.5 px-4 text-right font-mono text-slate-300 tabular-nums">
                          {r.totalInteractions.toLocaleString()}
                        </td>
                        <td
                          className="py-3.5 px-5 text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            variant="primary"
                            size="xs"
                            className="player-action-btn transition-colors"
                            onClick={() => profile && onSelectPlayer(profile)}
                            aria-label={`View player ${r.name}`}
                          >
                            View Player
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Table Supporting Footer */}
          <div className="px-5 py-3.5 bg-[#0d1320] border-t border-slate-800/90 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-400">
            <span>
              Tie-breaking order: 1. AI Score → 2. Recent Form → 3. Lower Player ID
            </span>
            <Button
              variant="ghost"
              size="xs"
              onClick={() => onNavigateToTab('rankings')}
              className="text-emerald-400 hover:text-emerald-300 self-start sm:self-auto"
            >
              View Rankings ({players.length} Players) →
            </Button>
          </div>
        </Card>
      </section>

      {/* 4. INSIGHTS SECTION */}
      {insights && (
        <section aria-label="Automated Dataset Insights" className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-100">
                Automated Performance Insights
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Key statistical leaders extracted directly from processed match and interaction records.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Highest-performing player */}
            <Card
              className="player-card-hover flex flex-col justify-between cursor-pointer"
              onClick={() => onSelectPlayer(insights.highestPerforming)}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <Badge variant="brand">Highest-Performing Player</Badge>
                  <Award className="w-4 h-4 text-emerald-400" />
                </div>
                <h3 className="player-name text-base font-bold text-slate-100 mt-2 transition-colors">
                  {insights.highestPerforming.name}
                </h3>
                <p className="player-meta text-xs text-slate-400">
                  {insights.highestPerforming.position} • {insights.highestPerforming.academyTeam}
                </p>
                <div className="player-metrics-box mt-3 pt-3 border-t border-slate-800/80 flex items-baseline justify-between rounded px-2 py-1">
                  <span className="player-metric-label text-xs text-slate-400">AI Score</span>
                  <span className="player-metric-score text-lg font-mono font-bold text-emerald-400 tabular-nums">
                    {insights.highestPerforming.performanceScore.toFixed(2)}
                  </span>
                </div>
              </div>
              <div className="mt-4">
                <Button
                  variant="secondary"
                  size="sm"
                  className="player-action-btn w-full transition-colors"
                  onClick={() => onSelectPlayer(insights.highestPerforming)}
                >
                  View Details
                </Button>
              </div>
            </Card>

            {/* Highest interaction volume */}
            <Card
              className="player-card-hover flex flex-col justify-between cursor-pointer"
              onClick={() => onSelectPlayer(insights.highestInteraction)}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <Badge variant="info">Highest Interaction Volume</Badge>
                  <Share2 className="w-4 h-4 text-blue-400" />
                </div>
                <h3 className="player-name text-base font-bold text-slate-100 mt-2 transition-colors">
                  {insights.highestInteraction.name}
                </h3>
                <p className="player-meta text-xs text-slate-400">
                  {insights.highestInteraction.position} • {insights.highestInteraction.academyTeam}
                </p>
                <div className="player-metrics-box mt-3 pt-3 border-t border-slate-800/80 flex items-baseline justify-between rounded px-2 py-1">
                  <span className="player-metric-label text-xs text-slate-400">Pass Interactions</span>
                  <span className="player-metric-score-blue text-lg font-mono font-bold text-blue-400 tabular-nums">
                    {insights.highestInteraction.totalInteractions.toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="mt-4">
                <Button
                  variant="secondary"
                  size="sm"
                  className="player-action-btn w-full transition-colors"
                  onClick={() => onSelectPlayer(insights.highestInteraction)}
                >
                  View Details
                </Button>
              </div>
            </Card>

            {/* Highest pass accuracy */}
            <Card
              className="player-card-hover flex flex-col justify-between cursor-pointer"
              onClick={() => onSelectPlayer(insights.highestPassAccuracy)}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <Badge variant="warning">Highest Pass Accuracy</Badge>
                  <Target className="w-4 h-4 text-amber-400" />
                </div>
                <h3 className="player-name text-base font-bold text-slate-100 mt-2 transition-colors">
                  {insights.highestPassAccuracy.name}
                </h3>
                <p className="player-meta text-xs text-slate-400">
                  {insights.highestPassAccuracy.position} • {insights.highestPassAccuracy.academyTeam}
                </p>
                <div className="player-metrics-box mt-3 pt-3 border-t border-slate-800/80 flex items-baseline justify-between rounded px-2 py-1">
                  <span className="player-metric-label text-xs text-slate-400">Completion Rate</span>
                  <span className="player-metric-score-amber text-lg font-mono font-bold text-amber-300 tabular-nums">
                    {insights.highestPassAccuracy.passAccuracy.toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="mt-4">
                <Button
                  variant="secondary"
                  size="sm"
                  className="player-action-btn w-full transition-colors"
                  onClick={() => onSelectPlayer(insights.highestPassAccuracy)}
                >
                  View Details
                </Button>
              </div>
            </Card>

            {/* Strong recent-form player */}
            <Card
              className="player-card-hover flex flex-col justify-between cursor-pointer"
              onClick={() => onSelectPlayer(insights.strongRecentForm)}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <Badge variant="success">Strong Recent-Form Player</Badge>
                  <Activity className="w-4 h-4 text-emerald-400" />
                </div>
                <h3 className="player-name text-base font-bold text-slate-100 mt-2 transition-colors">
                  {insights.strongRecentForm.name}
                </h3>
                <p className="player-meta text-xs text-slate-400">
                  {insights.strongRecentForm.position} • {insights.strongRecentForm.academyTeam}
                </p>
                <div className="player-metrics-box mt-3 pt-3 border-t border-slate-800/80 flex items-baseline justify-between rounded px-2 py-1">
                  <span className="player-metric-label text-xs text-slate-400">Recent Form Index</span>
                  <span className="player-metric-score text-lg font-mono font-bold text-emerald-400 tabular-nums">
                    {insights.strongRecentForm.recentForm.toFixed(1)}
                  </span>
                </div>
              </div>
              <div className="mt-4">
                <Button
                  variant="secondary"
                  size="sm"
                  className="player-action-btn w-full transition-colors"
                  onClick={() => onSelectPlayer(insights.strongRecentForm)}
                >
                  View Details
                </Button>
              </div>
            </Card>
          </div>
        </section>
      )}
    </div>
  );
};
