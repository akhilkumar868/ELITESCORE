import React, { useState, useMemo } from 'react';
import {
  RotateCcw,
  LayoutGrid,
  List,
  Database,
  Upload
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
  SkeletonCard,
  SkeletonTable,
  PageHeader,
} from './ui/DesignSystem';

interface PlayersTabProps {
  data: MasterData;
  hasDataset: boolean;
  isAnalyzing: boolean;
  onSelectPlayer: (player: PlayerProfile) => void;
  onNavigateToTab: (tab: string) => void;
}

export const PlayersTab: React.FC<PlayersTabProps> = ({
  data,
  hasDataset,
  isAnalyzing,
  onSelectPlayer,
  onNavigateToTab,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [positionFilter, setPositionFilter] = useState('All');
  const [teamFilter, setTeamFilter] = useState('All');
  const [minScore, setMinScore] = useState<number>(0);
  const [sortBy, setSortBy] = useState<'rank' | 'score' | 'form' | 'interactions' | 'name'>('rank');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const { players } = data;

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    positionFilter !== 'All' ||
    teamFilter !== 'All' ||
    minScore > 0 ||
    sortBy !== 'rank';

  const resetFilters = () => {
    setSearchQuery('');
    setPositionFilter('All');
    setTeamFilter('All');
    setMinScore(0);
    setSortBy('rank');
  };

  const filteredPlayers = useMemo(() => {
    const list = players.filter((p) => {
      const matchesPosition =
        positionFilter === 'All' ||
        p.position.toLowerCase() === positionFilter.toLowerCase();
      const matchesTeam =
        teamFilter === 'All' ||
        p.academyTeam.toLowerCase() === teamFilter.toLowerCase();
      const matchesScore = p.performanceScore >= minScore;
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.playerId.toLowerCase().includes(q) ||
        p.squadNumber.toString() === q ||
        p.position.toLowerCase().includes(q);

      return matchesPosition && matchesTeam && matchesScore && matchesSearch;
    });

    list.sort((a, b) => {
      switch (sortBy) {
        case 'rank':
          return a.rank - b.rank;
        case 'score':
          return b.performanceScore - a.performanceScore;
        case 'form':
          return b.recentForm - a.recentForm;
        case 'interactions':
          return b.totalInteractions - a.totalInteractions;
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return a.rank - b.rank;
      }
    });

    return list;
  }, [players, positionFilter, teamFilter, minScore, searchQuery, sortBy]);

  if (!hasDataset) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Players Directory"
          description="Browse evaluated players, compare core performance indicators, and inspect individual profiles."
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
        title="Players Directory"
        description="Explore all evaluated athletes across squads with standardized AI scores, recent form, and interaction counts."
        badge={
          <Badge variant="neutral" mono>
            {players.length} Evaluated Athletes
          </Badge>
        }
        actions={
          <SegmentedControl
            options={[
              { value: 'grid', label: 'Cards' },
              { value: 'table', label: 'Table' },
            ]}
            value={viewMode}
            onChange={setViewMode}
          />
        }
      />

      {/* 2. CONTROLS BAR */}
      <Card className="p-4 space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search by player name, ID, position, or squad number..."
            className="flex-1"
          />

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
              className="w-44"
            />

            <SelectDropdown
              label="Squad:"
              value={teamFilter}
              onChange={setTeamFilter}
              options={[
                { value: 'All', label: 'All Squads' },
                ...Array.from(
                  new Set(players.map((p) => p.academyTeam).filter(Boolean))
                ).map((t) => ({ value: t, label: t })),
              ]}
              className="w-44"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
          <div className="flex flex-wrap items-center gap-3">
            <SelectDropdown
              label="Sort:"
              value={sortBy}
              onChange={(val) => setSortBy(val as any)}
              options={[
                { value: 'rank', label: `Rank (#1 → #${players.length})` },
                { value: 'score', label: 'AI Score (High → Low)' },
                { value: 'form', label: 'Recent Form (High → Low)' },
                { value: 'interactions', label: 'Interactions (High → Low)' },
                { value: 'name', label: 'Name (A → Z)' },
              ]}
              className="w-52"
            />

            <div className="flex items-center gap-2.5 bg-[#0d1320] px-3 py-1.5 rounded-lg border border-slate-800 text-xs">
              <span className="text-slate-400 font-medium">Min AI Score:</span>
              <input
                type="range"
                min={0}
                max={90}
                step={5}
                value={minScore}
                onChange={(e) => setMinScore(Number(e.target.value))}
                className="w-24 accent-emerald-500 cursor-pointer"
                aria-label="Minimum AI score filter"
              />
              <span className="font-mono text-emerald-400 font-semibold tabular-nums w-8 text-right">
                {minScore > 0 ? `${minScore}+` : 'Any'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
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
        </div>
      </Card>

      {/* 3. MAIN CONTENT */}
      {isAnalyzing ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : (
          <Card>
            <SkeletonTable rows={8} />
          </Card>
        )
      ) : filteredPlayers.length === 0 ? (
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
      ) : viewMode === 'grid' ? (
        /* Player Card / Table Hybrid Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredPlayers.map((player) => (
            <Card
              key={player.playerId}
              interactive
              onClick={() => onSelectPlayer(player)}
              className="player-card-hover flex flex-col justify-between p-5 group"
            >
              {/* Card Header: Rank & Position */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <RankBadge rank={player.rank} />
                  <PositionBadge position={player.position} />
                </div>

                {/* Player Name & Squad Context */}
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="player-name text-base font-bold text-slate-100 transition-colors truncate">
                    {player.name}
                  </h3>
                  <span className="player-meta text-xs font-mono text-slate-500 shrink-0">
                    #{player.squadNumber}
                  </span>
                </div>
                <p className="player-meta text-xs text-slate-400 mt-0.5">
                  {player.academyTeam} • <span className="font-mono text-[11px]">{player.playerId}</span>
                </p>
              </div>

              {/* Clean Tabular Metrics Block (AI Score, Recent Form, Interaction Count) */}
              <div className="player-metrics-box my-4 rounded-lg bg-[#0d1320] border border-slate-800/90 divide-y divide-slate-800/80 text-xs transition-colors">
                <div className="px-3 py-2 flex items-center justify-between">
                  <span className="player-metric-label text-slate-400 font-medium">AI Score</span>
                  <span className="player-metric-score font-mono font-bold text-sm text-emerald-400 tabular-nums">
                    {player.performanceScore.toFixed(2)}
                  </span>
                </div>
                <div className="px-3 py-2 flex items-center justify-between">
                  <span className="player-metric-label text-slate-400 font-medium">Recent Form</span>
                  <span className="player-metric-value font-mono font-semibold text-slate-200 tabular-nums">
                    {player.recentForm.toFixed(1)}
                  </span>
                </div>
                <div className="px-3 py-2 flex items-center justify-between">
                  <span className="player-metric-label text-slate-400 font-medium">Interactions</span>
                  <span className="player-metric-value font-mono font-semibold text-slate-200 tabular-nums">
                    {player.totalInteractions.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <Button
                variant="secondary"
                size="sm"
                className="player-action-btn w-full transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectPlayer(player);
                }}
              >
                View Profile
              </Button>
            </Card>
          ))}
        </div>
      ) : (
        /* Hybrid Table View */
        <Card noPadding className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800/90 bg-[#0d1320] text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  <th className="py-3.5 px-5">Rank</th>
                  <th className="py-3.5 px-4">Name</th>
                  <th className="py-3.5 px-4">Position</th>
                  <th className="py-3.5 px-4 text-right">AI Score</th>
                  <th className="py-3.5 px-4 text-right">Recent Form</th>
                  <th className="py-3.5 px-4 text-right">Interactions</th>
                  <th className="py-3.5 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 text-sm">
                {filteredPlayers.map((player) => (
                  <tr
                    key={player.playerId}
                    onClick={() => onSelectPlayer(player)}
                    className="player-row-hover transition-colors cursor-pointer group"
                  >
                    <td className="py-3.5 px-5">
                      <RankBadge rank={player.rank} />
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="player-name font-semibold text-slate-100 transition-colors">
                        {player.name}
                      </div>
                      <div className="player-meta text-xs text-slate-400">
                        {player.academyTeam} • #{player.squadNumber}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <PositionBadge position={player.position} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="player-score-badge inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-mono font-semibold tabular-nums bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                        {player.performanceScore.toFixed(2)}
                      </span>
                    </td>
                    <td className="player-stat-value py-3.5 px-4 text-right font-mono text-slate-200 tabular-nums">
                      {player.recentForm.toFixed(1)}
                    </td>
                    <td className="player-stat-value py-3.5 px-4 text-right font-mono text-slate-300 tabular-nums">
                      {player.totalInteractions.toLocaleString()}
                    </td>
                    <td
                      className="py-3.5 px-5 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        variant="secondary"
                        size="xs"
                        className="player-action-btn transition-colors"
                        onClick={() => onSelectPlayer(player)}
                      >
                        View Profile
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* 4. SUPPORTING INFORMATION */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <span>
          Showing {filteredPlayers.length} of {players.length} athletes
        </span>
        <span>Click any player card or row to open their full Player Profile</span>
      </div>
    </div>
  );
};
