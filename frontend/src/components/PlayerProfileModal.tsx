import React from 'react';
import {
  ArrowLeft,
  Share2,
  TrendingUp,
  Target,
  Activity,
  CheckCircle2,
  Users,
  Calendar
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { PlayerProfile, PlayerMatchLog, MasterData } from '../types/athletix';
import {
  Button,
  Card,
  Badge,
  PositionBadge,
  RankBadge,
  ChartContainer,
  EmptyState
} from './ui/DesignSystem';

interface PlayerProfileModalProps {
  player: PlayerProfile | null;
  data: MasterData;
  onClose: () => void;
  onSelectPlayer?: (player: PlayerProfile) => void;
  onViewInNetwork?: (playerId: string) => void;
}

export const PlayerProfileModal: React.FC<PlayerProfileModalProps> = ({
  player,
  data,
  onClose,
  onSelectPlayer,
  onViewInNetwork,
}) => {
  if (!player) return null;

  const matchLogs: PlayerMatchLog[] = data.playerMatchLogs[player.playerId] || [];

  const playerConnections = data.network.links
    .filter((link) => link.source === player.playerId || link.target === player.playerId)
    .map((link) => {
      const partnerId = link.source === player.playerId ? link.target : link.source;
      const partner = data.players.find((p) => p.playerId === partnerId);
      return {
        partnerId,
        partnerProfile: partner || null,
        name: partner ? partner.name : partnerId,
        position: partner ? partner.position : 'Midfielder',
        squadNumber: partner ? partner.squadNumber : 0,
        rank: partner ? partner.rank : 0,
        passes: link.weight,
        successful: link.successful,
        accuracy: link.weight > 0 ? ((link.successful / link.weight) * 100).toFixed(0) : '0',
      };
    })
    .sort((a, b) => b.passes - a.passes);

  const keyStats = [
    {
      label: 'Goals',
      value: player.goals,
      sub: `${player.shots} shots`,
    },
    {
      label: 'Assists',
      value: player.assists,
      sub: `${player.goals + player.assists} G+A`,
    },
    {
      label: 'Pass Accuracy',
      value: `${player.passAccuracy.toFixed(1)}%`,
      sub: `${player.passesAttempted} attempted`,
    },
    {
      label: 'Successful Passes',
      value: player.passesCompleted.toLocaleString(),
      sub: `${player.matchesPlayed} matches`,
    },
    {
      label: 'Recent Form',
      value: player.recentForm.toFixed(1),
      sub: 'Weighted last 4',
    },
    {
      label: 'Consistency',
      value: `${player.consistencyScore.toFixed(1)}`,
      sub: 'Stability index',
    },
    {
      label: 'Interactions',
      value: player.totalInteractions.toLocaleString(),
      sub: `${player.connectedTeammates} teammates`,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Navigation & Context Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<ArrowLeft className="w-4 h-4" />}
          onClick={onClose}
        >
          Back
        </Button>

        <div className="flex items-center gap-2.5">
          {onViewInNetwork && (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Share2 className="w-4 h-4" />}
              onClick={() => onViewInNetwork(player.playerId)}
            >
              View in Interaction Network
            </Button>
          )}
        </div>
      </div>

      {/* 1. PROFILE HEADER */}
      <Card className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-[#161f33] border border-slate-700/90 flex items-center justify-center text-lg font-mono font-bold text-emerald-400 shrink-0 shadow-saas-sm">
              #{player.squadNumber}
            </div>
            <div>
              <div className="flex items-center flex-wrap gap-2.5">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-50 tracking-tight">
                  {player.name}
                </h1>
                <PositionBadge position={player.position} />
                <Badge variant="neutral" mono>
                  {player.playerId}
                </Badge>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                {player.academyTeam} • Age {player.age} • {player.matchesPlayed} Matches ({player.totalMinutes} mins)
              </p>
            </div>
          </div>

          {/* Rank & AI Performance Score */}
          <div className="flex items-center gap-3 self-start lg:self-center">
            <div className="px-4 py-2.5 rounded-lg bg-[#0d1320] border border-slate-800 text-center min-w-[96px]">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
                Rank
              </span>
              <div className="mt-1 flex items-center justify-center">
                <RankBadge rank={player.rank} />
              </div>
            </div>

            <div className="px-5 py-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-center min-w-[140px]">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400 block">
                AI Performance Score
              </span>
              <span className="text-2xl font-mono font-bold text-emerald-400 tabular-nums block mt-0.5">
                {player.performanceScore.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* 2. KEY STATISTICS (7 Compact Cards) */}
      <section aria-label="Key Statistics" className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
            Key Statistics
          </h2>
          <span className="text-xs text-slate-500">
            Aggregated across {player.matchesPlayed} historical fixtures
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {keyStats.map((stat) => (
            <Card key={stat.label} className="p-3.5 flex flex-col justify-between">
              <span className="text-[11px] font-medium text-slate-400">
                {stat.label}
              </span>
              <div className="text-xl font-bold font-mono text-slate-100 tabular-nums mt-2">
                {stat.value}
              </div>
              <span className="text-[11px] text-slate-500 mt-1 truncate">
                {stat.sub}
              </span>
            </Card>
          ))}
        </div>
      </section>

      {/* 3. PERFORMANCE TREND & MATCH LOGS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ChartContainer
            title="Performance Trend"
            subtitle="Historical match-by-match rating progression across analyzed fixtures."
            badge={
              <Badge variant="brand" mono>
                Avg {player.avgMatchRating.toFixed(2)} / 10
              </Badge>
            }
            heightClass="h-72"
          >
            {matchLogs.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={matchLogs} margin={{ top: 10, right: 16, left: -12, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis
                    dataKey="matchId"
                    stroke="#64748b"
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                  />
                  <YAxis
                    domain={[4.5, 10]}
                    ticks={[5, 6, 7, 8, 9, 10]}
                    stroke="#64748b"
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0d1320',
                      borderColor: '#334155',
                      borderRadius: '8px',
                      fontSize: '12px',
                      color: '#f8fafc',
                    }}
                    formatter={(value: any) => [`${Number(value).toFixed(2)} / 10.0`, 'Match Rating']}
                    labelFormatter={(label) => {
                      const m = matchLogs.find((x) => x.matchId === label);
                      return m
                        ? `${label} • ${m.date} vs ${m.opponent} (${m.result})`
                        : label;
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="rating"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#10b981', stroke: '#0d1320', strokeWidth: 1.5 }}
                    activeDot={{ r: 6, fill: '#34d399' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState
                title="No match logs recorded"
                description="Historical match logs are not available for this player."
              />
            )}
          </ChartContainer>
        </div>

        {/* Fixture Breakdown Card */}
        <Card noPadding className="flex flex-col justify-between overflow-hidden">
          <div className="p-4 border-b border-slate-800/90">
            <h3 className="text-sm font-semibold text-slate-100">
              Match Appearances ({matchLogs.length})
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Individual fixture performance breakdown
            </p>
          </div>
          <div className="divide-y divide-slate-800/70 max-h-72 overflow-y-auto text-xs">
            {matchLogs.map((log) => (
              <div
                key={log.matchId}
                className="px-4 py-2.5 flex items-center justify-between hover:bg-slate-800/30"
              >
                <div>
                  <div className="font-medium text-slate-200 flex items-center gap-2">
                    <span className="font-mono text-emerald-400">{log.matchId}</span>
                    <span>vs {log.opponent}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {log.date} • {log.minutes} mins • {log.passesCompleted} passes ({log.passAccuracy.toFixed(0)}%)
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-mono font-bold text-slate-100 bg-slate-800 px-2 py-0.5 rounded border border-slate-700 tabular-nums">
                    {log.rating.toFixed(1)}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="px-4 py-3 bg-[#0d1320] border-t border-slate-800/90 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Defensive Actions: {player.tackles} Tkl / {player.interceptions} Int</span>
            <span>Clean Sheets: {player.cleanSheets}</span>
          </div>
        </Card>
      </div>

      {/* 4. PLAYER INTERACTIONS */}
      <Card noPadding className="overflow-hidden">
        <div className="p-5 border-b border-slate-800/90 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-100">
                Player Interactions
              </h3>
              <Badge variant="info" mono>
                {player.connectedTeammates} Connected Teammates
              </Badge>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Weighted passing edges recorded in the Java PlayerInteractionGraph (Weighted Degree: {player.weightedInvolvement.toFixed(1)}, Density: {player.interactionDensity.toFixed(1)}).
            </p>
          </div>

          {onViewInNetwork && (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Share2 className="w-4 h-4" />}
              onClick={() => onViewInNetwork(player.playerId)}
            >
              View Connections in Network
            </Button>
          )}
        </div>

        <div className="p-5">
          {playerConnections.length === 0 ? (
            <EmptyState
              title="No interaction links found"
              description="This player has no recorded passing links in the current graph."
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {playerConnections.map((conn) => (
                <div
                  key={conn.partnerId}
                  onClick={() => conn.partnerProfile && onSelectPlayer?.(conn.partnerProfile)}
                  className={`p-3.5 rounded-lg bg-[#0d1320] border border-slate-800/90 flex items-center justify-between gap-3 ${
                    conn.partnerProfile
                      ? 'hover:border-slate-700 cursor-pointer transition-colors'
                      : ''
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-100 truncate">
                        {conn.name}
                      </span>
                      <span className="text-xs font-mono text-slate-500">
                        #{conn.squadNumber}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <PositionBadge position={conn.position} />
                      <span className="text-[11px] font-mono text-slate-500">
                        Rank #{conn.rank}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-base font-mono font-bold text-emerald-400 tabular-nums">
                      {conn.passes}
                    </div>
                    <div className="text-[11px] text-slate-400 tabular-nums">
                      {conn.successful} completed ({conn.accuracy}%)
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
