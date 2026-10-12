import React, { useState, useMemo } from 'react';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Download,
  Database,
  Upload,
  Play,
  Info
} from 'lucide-react';
import { MasterData, PlayerProfile } from '../types/athletix';
import {
  Button,
  Card,
  Badge,
  PositionBadge,
  RankBadge,
  SegmentedControl,
  SearchInput,
  SelectDropdown,
  EmptyState,
  SkeletonTable,
  PageHeader,
} from './ui/DesignSystem';

interface RankingsTabProps {
  data: MasterData;
  hasDataset: boolean;
  hasAnalysisResults: boolean;
  isAnalyzing: boolean;
  onRunAnalysis: () => void;
  onExportResults: () => void;
  onSelectPlayer: (player: PlayerProfile) => void;
  onNavigateToTab: (tab: string) => void;
}

type SortField = 'rank' | 'performanceScore' | 'recentForm' | 'totalInteractions';

export const RankingsTab: React.FC<RankingsTabProps> = ({
  data,
  hasDataset,
  hasAnalysisResults,
  isAnalyzing,
  onRunAnalysis,
  onExportResults,
  onSelectPlayer,
  onNavigateToTab,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [positionFilter, setPositionFilter] = useState('All');
  const [teamFilter, setTeamFilter] = useState('All');
  const [displayCount, setDisplayCount] = useState<'3' | '5' | '10' | 'all'>('all');
  const [sortField, setSortField] = useState<SortField>('rank');
  const [sortAsc, setSortAsc] = useState(true);

  const { allRankings, players } = data;

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    positionFilter !== 'All' ||
    teamFilter !== 'All' ||
    displayCount !== 'all' ||
    sortField !== 'rank' ||
    !sortAsc;

  const resetFilters = () => {
    setSearchQuery('');
    setPositionFilter('All');
    setTeamFilter('All');
    setDisplayCount('all');
    setSortField('rank');
    setSortAsc(true);
  };

  const filteredRankings = useMemo(() => {
    let list = [...allRankings];

    if (displayCount === '3') list = list.slice(0, 3);
    else if (displayCount === '5') list = list.slice(0, 5);
    else if (displayCount === '10') list = list.slice(0, 10);

    if (positionFilter !== 'All') {
      list = list.filter(
        (r) => r.position.toLowerCase() === positionFilter.toLowerCase()
      );
    }

    if (teamFilter !== 'All') {
      list = list.filter(
        (r) => r.team.toLowerCase() === teamFilter.toLowerCase()
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.playerId.toLowerCase().includes(q) ||
          r.position.toLowerCase().includes(q) ||
          r.team.toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];
      return sortAsc ? valA - valB : valB - valA;
    });

    return list;
  }, [allRankings, displayCount, positionFilter, teamFilter, searchQuery, sortField, sortAsc]);

  const handleHeaderSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(field === 'rank');
    }
  };

  const handleSortDropdownChange = (val: string) => {
    const [field, dir] = val.split(':') as [SortField, 'asc' | 'desc'];
    setSortField(field);
    setSortAsc(dir === 'asc');
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />;
    }
    return sortAsc ? (
      <ArrowUp className="w-3.5 h-3.5 text-emerald-400" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-emerald-400" />
    );
  };

  const squadOptions = useMemo(() => {
    const teams = Array.from(
      new Set(allRankings.map((r) => r.team).filter(Boolean))
    );
    return [
      { value: 'All', label: 'All Squads' },
      ...teams.map((t) => ({ value: t, label: t })),
    ];
  }, [allRankings]);

  if (!hasDataset) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Player Rankings"
          description="Official player rankings computed by the Java PriorityQueue Top-K heap engine using regression performance scores."
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
        title="Player Rankings"
        description="Deterministic leaderboard extracted via the Java PriorityQueue heap engine with three-tier tie-breaking."
        badge={
          <Badge variant="neutral" mono>
            O(K log N) Heap Extraction
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

      {/* 2. CONTROLS BAR */}
      <Card className="p-4 space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Input */}
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search by player name, ID (e.g. P005), position, or squad..."
            className="flex-1"
          />

          {/* Top-K Segmented Control */}
          <SegmentedControl
            label="Top-K:"
            options={[
              { value: '3', label: 'Top 3' },
              { value: '5', label: 'Top 5' },
              { value: '10', label: 'Top 10' },
              { value: 'all', label: `All (${allRankings.length})` },
            ]}
            value={displayCount}
            onChange={setDisplayCount}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
          <div className="flex flex-wrap items-center gap-2.5">
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

            <SelectDropdown
              label="Squad:"
              value={teamFilter}
              onChange={setTeamFilter}
              options={squadOptions}
              className="w-44"
            />

            <SelectDropdown
              label="Sort by:"
              value={`${sortField}:${sortAsc ? 'asc' : 'desc'}`}
              onChange={handleSortDropdownChange}
              options={[
                { value: 'rank:asc', label: 'Rank (Low → High)' },
                { value: 'rank:desc', label: 'Rank (High → Low)' },
                { value: 'performanceScore:desc', label: 'AI Score (High → Low)' },
                { value: 'performanceScore:asc', label: 'AI Score (Low → High)' },
                { value: 'recentForm:desc', label: 'Recent Form (High → Low)' },
                { value: 'totalInteractions:desc', label: 'Interactions (High → Low)' },
              ]}
              className="w-56"
            />
          </div>

          {hasActiveFilters && (
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
              onClick={resetFilters}
            >
              Reset Filters
            </Button>
          )}
        </div>
      </Card>

      {/* 3. MAIN CONTENT: RANKING TABLE */}
      <Card noPadding className="overflow-hidden">
        {isAnalyzing ? (
          <div className="p-5">
            <SkeletonTable rows={8} />
          </div>
        ) : !hasAnalysisResults ? (
          <div className="p-6">
            <EmptyState
              title="No analysis results"
              description="Run the Java and Python analysis pipeline to generate rankings."
            />
          </div>
        ) : filteredRankings.length === 0 ? (
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
                <tr className="border-b border-slate-800/90 bg-[#0d1320] text-[11px] font-semibold uppercase tracking-wider text-slate-400 select-none">
                  <th
                    onClick={() => handleHeaderSort('rank')}
                    className="py-3.5 px-5 cursor-pointer hover:text-slate-200 transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Rank</span>
                      {renderSortIcon('rank')}
                    </div>
                  </th>
                  <th className="py-3.5 px-4">Player</th>
                  <th className="py-3.5 px-4">Position</th>
                  <th className="py-3.5 px-4">Squad</th>
                  <th
                    onClick={() => handleHeaderSort('performanceScore')}
                    className="py-3.5 px-4 text-right cursor-pointer hover:text-slate-200 transition-colors"
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>AI Score</span>
                      {renderSortIcon('performanceScore')}
                    </div>
                  </th>
                  <th
                    onClick={() => handleHeaderSort('recentForm')}
                    className="py-3.5 px-4 text-right cursor-pointer hover:text-slate-200 transition-colors"
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>Recent Form</span>
                      {renderSortIcon('recentForm')}
                    </div>
                  </th>
                  <th
                    onClick={() => handleHeaderSort('totalInteractions')}
                    className="py-3.5 px-4 text-right cursor-pointer hover:text-slate-200 transition-colors"
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>Interactions</span>
                      {renderSortIcon('totalInteractions')}
                    </div>
                  </th>
                  <th className="py-3.5 px-4">Tie-Break Criteria</th>
                  <th className="py-3.5 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 text-sm">
                {filteredRankings.map((r) => {
                  const profile = players.find((p) => p.playerId === r.playerId);
                  const isTop3 = r.rank <= 3;

                  return (
                    <tr
                      key={r.playerId}
                      onClick={() => profile && onSelectPlayer(profile)}
                      className={`player-row-hover transition-colors cursor-pointer group ${
                        isTop3 ? 'bg-emerald-950/10' : ''
                      }`}
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
                        <div className="player-meta text-[11px] font-mono text-slate-500 mt-0.5">
                          {r.playerId}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <PositionBadge position={r.position} />
                      </td>
                      <td className="player-meta py-3.5 px-4 text-xs font-medium text-slate-300">
                        {r.team}
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
                      <td className="py-3.5 px-4">
                        <Badge
                          variant={r.rank === 1 ? 'warning' : 'neutral'}
                        >
                          {r.tieBreakReason}
                        </Badge>
                      </td>
                      <td
                        className="py-3.5 px-5 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button
                          variant="secondary"
                          size="xs"
                          className="player-action-btn transition-colors"
                          onClick={() => profile && onSelectPlayer(profile)}
                        >
                          View Details
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* 4. SUPPORTING INFORMATION FOOTER */}
        <div className="px-5 py-3.5 bg-[#0d1320] border-t border-slate-800/90 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Info className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>
              Deterministic comparator: 1. AI Performance Score → 2. Recent Form → 3. Alphanumeric Player ID
            </span>
          </div>
          <span className="font-mono text-[11px] text-slate-400 tabular-nums">
            Showing {filteredRankings.length} of {allRankings.length} players
          </span>
        </div>
      </Card>
    </div>
  );
};
