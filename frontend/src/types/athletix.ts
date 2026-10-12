export interface MetaInfo {
  platform: string;
  team: string;
  batchProcessedAt: string;
  dataset: string;
  pipelineArchitecture: string;
}

export interface PlayerRanking {
  rank: number;
  playerId: string;
  name: string;
  position: 'Goalkeeper' | 'Defender' | 'Midfielder' | 'Forward';
  team: string;
  squadNumber: number;
  performanceScore: number;
  recentForm: number;
  totalInteractions: number;
  tieBreakReason: string;
}

export interface PlayerProfile {
  playerId: string;
  name: string;
  position: 'Goalkeeper' | 'Defender' | 'Midfielder' | 'Forward';
  squadNumber: number;
  academyTeam: string;
  age: number;
  rank: number;
  performanceScore: number;
  recentForm: number;
  consistencyScore: number;
  avgMatchRating: number;
  matchesPlayed: number;
  totalMinutes: number;
  goals: number;
  assists: number;
  shots: number;
  passesAttempted: number;
  passesCompleted: number;
  passAccuracy: number;
  tackles: number;
  interceptions: number;
  cleanSheets: number;
  totalInteractions: number;
  connectedTeammates: number;
  weightedInvolvement: number;
  interactionDensity: number;
}

export interface NetworkNode {
  id: string;
  name: string;
  position: string;
  team: string;
  squadNumber: number;
  rank: number;
  score: number;
  totalInteractions: number;
  connectedTeammates: number;
  weightedInvolvement: number;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

export interface NetworkLink {
  source: string;
  target: string;
  weight: number;
  successful: number;
}

export interface PlayerMatchLog {
  matchId: string;
  date: string;
  opponent: string;
  result: string;
  minutes: number;
  goals: number;
  assists: number;
  shots: number;
  passesCompleted: number;
  passAccuracy: number;
  tackles: number;
  interceptions: number;
  rating: number;
}

export interface MatchOverview {
  matchId: string;
  date: string;
  team: string;
  opponent: string;
  venue: string;
  goalsFor: number;
  goalsAgainst: number;
  result: string;
}

export interface SummaryKPIs {
  totalPlayers: number;
  matchesAnalyzed: number;
  totalInteractions: number;
  avgPerformanceScore: number;
  topPlayer: PlayerRanking;
}

export interface MasterData {
  meta: MetaInfo;
  summary: SummaryKPIs;
  top3: PlayerRanking[];
  top5: PlayerRanking[];
  top10: PlayerRanking[];
  allRankings: PlayerRanking[];
  players: PlayerProfile[];
  network: {
    nodes: NetworkNode[];
    links: NetworkLink[];
  };
  playerMatchLogs: Record<string, PlayerMatchLog[]>;
  matches: MatchOverview[];
}
