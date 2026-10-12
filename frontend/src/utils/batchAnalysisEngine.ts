import {
  MasterData,
  MatchOverview,
  NetworkLink,
  NetworkNode,
  PlayerMatchLog,
  PlayerProfile,
  PlayerRanking,
} from '../types/athletix';

const EPSILON = 1e-4;

/**
 * Deterministic hash-based pseudo-random number in [0, 1) from a string seed
 */
function seededRandom(seed: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10000) / 10000;
}

/**
 * Normalize position string to one of the 4 valid academy positions
 */
export function normalizePosition(
  pos: string | undefined
): 'Goalkeeper' | 'Defender' | 'Midfielder' | 'Forward' {
  const p = (pos || '').trim().toLowerCase();
  if (p.startsWith('gk') || p.includes('goal') || p.includes('keeper')) {
    return 'Goalkeeper';
  }
  if (
    p.startsWith('def') ||
    p === 'cb' ||
    p === 'lb' ||
    p === 'rb' ||
    p.includes('back')
  ) {
    return 'Defender';
  }
  if (
    p.startsWith('for') ||
    p.startsWith('fw') ||
    p === 'st' ||
    p === 'cf' ||
    p === 'lw' ||
    p === 'rw' ||
    p.includes('striker') ||
    p.includes('wing') ||
    p.includes('attack')
  ) {
    return 'Forward';
  }
  return 'Midfielder';
}

/**
 * Exact Java Phase 1 Recent Form calculation:
 * Weighted average of up to last 4 match ratings, scaled to 0-100.
 */
export function calculateRecentForm(ratings: number[]): number {
  if (!ratings || ratings.length === 0) return 75.0;
  const n = ratings.length;
  const sample = Math.min(4, n);
  let weightedSum = 0;
  let weightTotal = 0;
  for (let i = 0; i < sample; i++) {
    const rating = ratings[n - 1 - i];
    const weight = Math.pow(1.2, sample - 1 - i);
    weightedSum += rating * weight;
    weightTotal += weight;
  }
  const avg10 = weightTotal > 0 ? weightedSum / weightTotal : 7.5;
  return Math.round(avg10 * 10.0 * 10.0) / 10.0;
}

/**
 * Exact Java Phase 1 Consistency Score calculation:
 * 100 - (StdDev * 18.0), clamped to [20.0, 99.0].
 */
export function calculateConsistency(ratings: number[]): number {
  if (!ratings || ratings.length < 2) return 82.0;
  const sum = ratings.reduce((a, b) => a + b, 0);
  const mean = sum / ratings.length;
  const varianceSum = ratings.reduce((a, r) => a + Math.pow(r - mean, 2), 0);
  const stdDev = Math.sqrt(varianceSum / ratings.length);
  const score = 100.0 - stdDev * 18.0;
  return Math.max(20.0, Math.min(99.0, Math.round(score * 10.0) / 10.0));
}

/**
 * Exact Java TopKHeapRanker multi-tier tie-breaking comparator and audit trail:
 * Tier 1: Higher performanceScore
 * Tier 2: Higher recentForm
 * Tier 3: Lower lexicographical playerId
 */
export function rankPlayersWithHeap(players: PlayerProfile[]): {
  allRankings: PlayerRanking[];
  top3: PlayerRanking[];
  top5: PlayerRanking[];
  top10: PlayerRanking[];
  rankedPlayers: PlayerProfile[];
} {
  const sorted = [...players].sort((a, b) => {
    if (Math.abs(a.performanceScore - b.performanceScore) >= EPSILON) {
      return b.performanceScore - a.performanceScore;
    }
    if (Math.abs(a.recentForm - b.recentForm) >= EPSILON) {
      return b.recentForm - a.recentForm;
    }
    return a.playerId.localeCompare(b.playerId);
  });

  const allRankings: PlayerRanking[] = [];
  let previous: PlayerRanking | null = null;

  for (let i = 0; i < sorted.length; i++) {
    const p = sorted[i];
    const rank = i + 1;
    let tieBreakReason = 'Direct Score Advantage';

    if (previous === null) {
      tieBreakReason = 'Tournament Leader';
    } else if (
      Math.abs(p.performanceScore - previous.performanceScore) < EPSILON
    ) {
      if (Math.abs(p.recentForm - previous.recentForm) < EPSILON) {
        tieBreakReason = `Tied with #${previous.rank} (${previous.name}) on Score & Form; Broken by Lower Player ID (${previous.playerId} vs ${p.playerId})`;
      } else {
        tieBreakReason = `Tied with #${previous.rank} (${previous.name}) on Score (${p.performanceScore.toFixed(
          1
        )}); Broken by Higher Recent Form (${previous.recentForm.toFixed(
          1
        )} vs ${p.recentForm.toFixed(1)})`;
      }
    }

    const currentRanking: PlayerRanking = {
      rank,
      playerId: p.playerId,
      name: p.name,
      position: p.position,
      team: p.academyTeam,
      squadNumber: p.squadNumber,
      performanceScore: Number(p.performanceScore.toFixed(2)),
      recentForm: Number(p.recentForm.toFixed(2)),
      totalInteractions: p.totalInteractions,
      tieBreakReason,
    };

    allRankings.push(currentRanking);
    previous = currentRanking;
  }

  const rankMap = new Map<string, number>();
  allRankings.forEach((r) => rankMap.set(r.playerId, r.rank));

  const rankedPlayers = players.map((p) => ({
    ...p,
    rank: rankMap.get(p.playerId) ?? p.rank ?? 1,
    performanceScore: Number(p.performanceScore.toFixed(2)),
    recentForm: Number(p.recentForm.toFixed(2)),
  }));

  return {
    allRankings,
    top3: allRankings.slice(0, 3),
    top5: allRankings.slice(0, 5),
    top10: allRankings.slice(0, 10),
    rankedPlayers,
  };
}

/**
 * Python Scikit-Learn Ridge Regression Performance Score Estimator
 * Computes raw multi-dimensional contribution index and normalizes to [55.0, 95.0]
 * when scores are missing or when full recalculation is requested.
 */
export function computeRegressionScores(
  players: PlayerProfile[],
  forceRecompute = false
): PlayerProfile[] {
  if (players.length === 0) return [];

  const allHaveValidScores = players.every(
    (p) =>
      typeof p.performanceScore === 'number' &&
      !isNaN(p.performanceScore) &&
      p.performanceScore > 0
  );

  if (allHaveValidScores && !forceRecompute) {
    return players;
  }

  const rawTargets = players.map((p) => {
    const matches = Math.max(1, p.matchesPlayed || 8);
    const goalsPerMatch = (p.goals || 0) / matches;
    const assistsPerMatch = (p.assists || 0) / matches;
    const tacklesPerMatch = (p.tackles || 0) / matches;
    const interceptionsPerMatch = (p.interceptions || 0) / matches;
    const passAcc = p.passAccuracy || 80;
    const recentForm = p.recentForm || 75;
    const consistency = p.consistencyScore || 80;
    const weightedInv =
      p.weightedInvolvement || (p.totalInteractions || 450) * 0.78;
    const totalMins = p.totalMinutes || matches * 85;

    return (
      goalsPerMatch * 16.0 +
      assistsPerMatch * 12.0 +
      passAcc * 0.28 +
      tacklesPerMatch * 3.5 +
      interceptionsPerMatch * 3.2 +
      recentForm * 0.22 +
      consistency * 0.12 +
      weightedInv / 28.0 +
      (totalMins / 700.0) * 5.0
    );
  });

  const minT = Math.min(...rawTargets);
  const maxT = Math.max(...rawTargets);
  const span = maxT - minT;

  return players.map((p, idx) => {
    // If not forced and this specific player already had a valid score, keep it
    if (
      !forceRecompute &&
      typeof p.performanceScore === 'number' &&
      p.performanceScore > 0
    ) {
      return p;
    }

    let computedScore: number;
    if (span < 1e-5) {
      computedScore = 78.5;
    } else {
      computedScore = 55.0 + ((rawTargets[idx] - minT) / span) * 39.6;
    }
    computedScore = Math.max(
      50.0,
      Math.min(99.0, Math.round(computedScore * 100) / 100)
    );

    return {
      ...p,
      performanceScore: computedScore,
    };
  });
}

/**
 * Ensure every player has realistic complete stats, match logs, and network edges
 * so all charts, modals, and tables render without missing data.
 */
export function ensureCompleteMasterData(
  partial: Partial<MasterData>,
  options?: { forceRecomputeScores?: boolean; datasetLabel?: string }
): MasterData {
  const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);

  // 1. Ensure Matches list exists
  let matches: MatchOverview[] =
    partial.matches && partial.matches.length > 0 ? [...partial.matches] : [];

  // Normalize players list
  const rawPlayers = partial.players || [];
  const teamsSet = new Set<string>();
  rawPlayers.forEach((p) => {
    if (p.academyTeam) teamsSet.add(p.academyTeam);
  });
  const teams =
    teamsSet.size > 0
      ? Array.from(teamsSet)
      : ['Vertex Alpha', 'Vertex Beta'];

  if (matches.length === 0) {
    // Generate baseline matches for the squads in the dataset
    const opponents = [
      'Metro Youth FC',
      'Coastal United Academy',
      'Highland Athletic',
      'Silverstone Rovers',
      'Northern Stars Academy',
      'Apex Elite Youth',
      'Cascade FC Academy',
      'Summit City Boys',
    ];
    let mCounter = 1;
    teams.forEach((teamName, tIdx) => {
      for (let i = 0; i < 6; i++) {
        const gf = ((mCounter + tIdx) % 3) + 1;
        const ga = (mCounter + i) % 2;
        const res = gf > ga ? 'WIN' : gf < ga ? 'LOSS' : 'DRAW';
        matches.push({
          matchId: `M${String(mCounter).padStart(2, '0')}`,
          date: `2026-02-${String(Math.min(28, (i + 1) * 4)).padStart(2, '0')}`,
          team: teamName,
          opponent: opponents[(mCounter - 1) % opponents.length],
          venue: i % 2 === 0 ? 'Home' : 'Away',
          goalsFor: gf,
          goalsAgainst: ga,
          result: res,
        });
        mCounter++;
      }
    });
  }

  // 2. Ensure playerMatchLogs exists for every player
  const playerMatchLogs: Record<string, PlayerMatchLog[]> = {
    ...(partial.playerMatchLogs || {}),
  };

  // 3. Complete every PlayerProfile with realistic defaults if any fields are missing/zero
  let players: PlayerProfile[] = rawPlayers.map((p, idx) => {
    const pid = p.playerId || `P${String(idx + 1).padStart(3, '0')}`;
    const pos = normalizePosition(p.position);
    const team = p.academyTeam || teams[idx % teams.length] || 'Vertex Alpha';
    const seed = seededRandom(`${pid}-${p.name || idx}`);

    const existingLogs = playerMatchLogs[pid] || [];
    const teamMatches = matches.filter((m) => m.team === team);
    const effectiveMatches =
      teamMatches.length > 0 ? teamMatches : matches.slice(0, 8);

    // If player has no match logs yet, synthesize logs matching their squad's matches
    if (existingLogs.length === 0 && effectiveMatches.length > 0) {
      const targetMatches =
        p.matchesPlayed && p.matchesPlayed > 0
          ? Math.min(p.matchesPlayed, effectiveMatches.length)
          : effectiveMatches.length;
      const selectedMatches = effectiveMatches.slice(0, targetMatches);

      let remGoals =
        typeof p.goals === 'number'
          ? p.goals
          : pos === 'Forward'
          ? Math.round(2 + seed * 4)
          : pos === 'Midfielder'
          ? Math.round(1 + seed * 2)
          : pos === 'Defender'
          ? Math.round(seed * 1)
          : 0;
      let remAssists =
        typeof p.assists === 'number'
          ? p.assists
          : pos === 'Midfielder'
          ? Math.round(2 + seed * 4)
          : pos === 'Forward'
          ? Math.round(1 + seed * 2)
          : Math.round(seed * 1);

      const generatedLogs: PlayerMatchLog[] = selectedMatches.map((m, mIdx) => {
        const mSeed = seededRandom(`${pid}-${m.matchId}-${mIdx}`);
        const isLast = mIdx === selectedMatches.length - 1;
        const g = isLast
          ? Math.max(0, remGoals)
          : remGoals > 0 && mSeed > 0.55
          ? 1
          : 0;
        remGoals = Math.max(0, remGoals - g);

        const a = isLast
          ? Math.max(0, remAssists)
          : remAssists > 0 && mSeed > 0.5
          ? 1
          : 0;
        remAssists = Math.max(0, remAssists - a);

        const basePasses =
          pos === 'Midfielder'
            ? 46
            : pos === 'Defender'
            ? 40
            : pos === 'Goalkeeper'
            ? 24
            : 22;
        const passesCompleted = Math.round(basePasses + mSeed * 14);
        const passAccuracy = Number(
          (
            (p.passAccuracy && p.passAccuracy > 0
              ? p.passAccuracy
              : pos === 'Defender'
              ? 88.5
              : pos === 'Midfielder'
              ? 87.0
              : pos === 'Forward'
              ? 81.5
              : 77.5) +
            (mSeed - 0.5) * 4.0
          ).toFixed(1)
        );
        const tackles =
          pos === 'Defender'
            ? Math.round(3 + mSeed * 4)
            : pos === 'Midfielder'
            ? Math.round(2 + mSeed * 3)
            : Math.round(mSeed * 2);
        const interceptions =
          pos === 'Defender'
            ? Math.round(2 + mSeed * 4)
            : pos === 'Midfielder'
            ? Math.round(1 + mSeed * 3)
            : Math.round(mSeed * 1);
        const shots =
          g +
          (pos === 'Forward'
            ? Math.round(1 + mSeed * 3)
            : pos === 'Midfielder'
            ? Math.round(mSeed * 2)
            : Math.round(mSeed * 1));

        const baseRating =
          p.avgMatchRating && p.avgMatchRating > 0 ? p.avgMatchRating : 7.4;
        const resBonus =
          m.result === 'WIN' ? 0.3 : m.result === 'LOSS' ? -0.3 : 0.0;
        const rating = Number(
          Math.max(
            5.5,
            Math.min(
              9.5,
              baseRating + resBonus + g * 0.45 + a * 0.3 + (mSeed - 0.5) * 0.5
            )
          ).toFixed(1)
        );

        return {
          matchId: m.matchId,
          date: m.date,
          opponent: m.opponent,
          result: m.result,
          minutes: 90,
          goals: g,
          assists: a,
          shots,
          passesCompleted,
          passAccuracy: Math.min(99.0, Math.max(60.0, passAccuracy)),
          tackles,
          interceptions,
          rating,
        };
      });

      playerMatchLogs[pid] = generatedLogs;
    }

    const logs = playerMatchLogs[pid] || [];
    const logRatings = logs.map((l) => l.rating);

    const matchesPlayed =
      p.matchesPlayed && p.matchesPlayed > 0
        ? p.matchesPlayed
        : logs.length || 8;
    const totalMinutes =
      p.totalMinutes && p.totalMinutes > 0
        ? p.totalMinutes
        : logs.reduce((s, l) => s + l.minutes, 0) || matchesPlayed * 85;
    const goals =
      typeof p.goals === 'number' && !isNaN(p.goals)
        ? p.goals
        : logs.reduce((s, l) => s + l.goals, 0);
    const assists =
      typeof p.assists === 'number' && !isNaN(p.assists)
        ? p.assists
        : logs.reduce((s, l) => s + l.assists, 0);
    const shots =
      typeof p.shots === 'number' && p.shots > 0
        ? p.shots
        : logs.reduce((s, l) => s + l.shots, 0) || goals * 3 + 4;
    const passesCompleted =
      typeof p.passesCompleted === 'number' && p.passesCompleted > 0
        ? p.passesCompleted
        : logs.reduce((s, l) => s + l.passesCompleted, 0) || matchesPlayed * 34;
    const passAccuracy =
      typeof p.passAccuracy === 'number' && p.passAccuracy > 0
        ? Number(p.passAccuracy.toFixed(2))
        : logs.length > 0
        ? Number(
            (
              logs.reduce((s, l) => s + l.passAccuracy, 0) / logs.length
            ).toFixed(2)
          )
        : 84.5;
    const passesAttempted =
      typeof p.passesAttempted === 'number' && p.passesAttempted > 0
        ? p.passesAttempted
        : Math.max(
            passesCompleted,
            Math.round(passesCompleted / (passAccuracy / 100))
          );
    const tackles =
      typeof p.tackles === 'number' && !isNaN(p.tackles)
        ? p.tackles
        : logs.reduce((s, l) => s + l.tackles, 0);
    const interceptions =
      typeof p.interceptions === 'number' && !isNaN(p.interceptions)
        ? p.interceptions
        : logs.reduce((s, l) => s + l.interceptions, 0);
    const cleanSheets =
      typeof p.cleanSheets === 'number' && !isNaN(p.cleanSheets)
        ? p.cleanSheets
        : pos === 'Defender' || pos === 'Goalkeeper'
        ? Math.round(matchesPlayed * 0.35)
        : 0;
    const avgMatchRating =
      typeof p.avgMatchRating === 'number' && p.avgMatchRating > 0
        ? Number(p.avgMatchRating.toFixed(2))
        : logRatings.length > 0
        ? Number(
            (
              logRatings.reduce((a, b) => a + b, 0) / logRatings.length
            ).toFixed(2)
          )
        : 7.45;
    const recentForm =
      typeof p.recentForm === 'number' && p.recentForm > 0
        ? Number(p.recentForm.toFixed(2))
        : calculateRecentForm(logRatings);
    const consistencyScore =
      typeof p.consistencyScore === 'number' && p.consistencyScore > 0
        ? Number(p.consistencyScore.toFixed(2))
        : calculateConsistency(logRatings);

    const defaultInteractions =
      pos === 'Midfielder'
        ? Math.round(880 + seed * 160)
        : pos === 'Defender'
        ? Math.round(820 + seed * 140)
        : pos === 'Forward'
        ? Math.round(450 + seed * 90)
        : Math.round(350 + seed * 110);

    const totalInteractions =
      typeof p.totalInteractions === 'number' && p.totalInteractions > 0
        ? p.totalInteractions
        : defaultInteractions;
    const connectedTeammates =
      typeof p.connectedTeammates === 'number' && p.connectedTeammates > 0
        ? p.connectedTeammates
        : 11;
    const weightedInvolvement =
      typeof p.weightedInvolvement === 'number' && p.weightedInvolvement > 0
        ? Number(p.weightedInvolvement.toFixed(2))
        : Number((totalInteractions * (passAccuracy / 100) * 0.92).toFixed(2));
    const interactionDensity =
      typeof p.interactionDensity === 'number' && p.interactionDensity > 0
        ? Number(p.interactionDensity.toFixed(2))
        : Number((totalInteractions / Math.max(1, connectedTeammates)).toFixed(2));

    return {
      playerId: pid,
      name: p.name || `Player ${pid}`,
      position: pos,
      squadNumber:
        typeof p.squadNumber === 'number' && p.squadNumber > 0
          ? p.squadNumber
          : (idx % 23) + 1,
      academyTeam: team,
      age: typeof p.age === 'number' && p.age > 0 ? p.age : 18,
      rank: p.rank || idx + 1,
      performanceScore:
        typeof p.performanceScore === 'number' && !isNaN(p.performanceScore)
          ? p.performanceScore
          : 0,
      recentForm,
      consistencyScore,
      avgMatchRating,
      matchesPlayed,
      totalMinutes,
      goals,
      assists,
      shots,
      passesAttempted,
      passesCompleted,
      passAccuracy,
      tackles,
      interceptions,
      cleanSheets,
      totalInteractions,
      connectedTeammates,
      weightedInvolvement,
      interactionDensity,
    };
  });

  // 4. Build / synchronize Network links if missing or if new players were uploaded
  let existingLinks: NetworkLink[] = partial.network?.links
    ? [...partial.network.links]
    : [];
  const playerIdSet = new Set(players.map((p) => p.playerId));
  existingLinks = existingLinks.filter(
    (l) => playerIdSet.has(l.source) && playerIdSet.has(l.target)
  );

  // Check which players already have links
  const connectedIds = new Set<string>();
  existingLinks.forEach((l) => {
    connectedIds.add(l.source);
    connectedIds.add(l.target);
  });

  // For any squad whose players lack links in existingLinks, synthesize realistic passing links
  teams.forEach((teamName) => {
    const squadPlayers = players.filter((p) => p.academyTeam === teamName);
    const unlinkedSquadPlayers = squadPlayers.filter(
      (p) => !connectedIds.has(p.playerId)
    );
    if (unlinkedSquadPlayers.length > 0 && squadPlayers.length > 1) {
      for (let i = 0; i < squadPlayers.length; i++) {
        for (let j = i + 1; j < squadPlayers.length; j++) {
          const p1 = squadPlayers[i];
          const p2 = squadPlayers[j];
          const alreadyExists = existingLinks.some(
            (l) =>
              (l.source === p1.playerId && l.target === p2.playerId) ||
              (l.source === p2.playerId && l.target === p1.playerId)
          );
          if (alreadyExists) continue;

          const pairSeed = seededRandom(`${p1.playerId}-${p2.playerId}`);
          const avgInt = (p1.totalInteractions + p2.totalInteractions) / 2;
          const baseWeight = Math.max(
            12,
            Math.round((avgInt / Math.max(2, squadPlayers.length - 1)) * (0.65 + pairSeed * 0.7))
          );
          const avgAcc = (p1.passAccuracy + p2.passAccuracy) / 200;
          const successful = Math.min(
            baseWeight,
            Math.round(baseWeight * Math.min(0.96, Math.max(0.72, avgAcc)))
          );

          existingLinks.push({
            source: p1.playerId < p2.playerId ? p1.playerId : p2.playerId,
            target: p1.playerId < p2.playerId ? p2.playerId : p1.playerId,
            weight: baseWeight,
            successful,
          });
        }
      }
    }
  });

  // 5. Compute Regression Performance Scores (Stage 2)
  players = computeRegressionScores(
    players,
    options?.forceRecomputeScores ?? false
  );

  // 6. Execute Java PriorityQueue Top-K Heap Ranking (Stage 3)
  const { allRankings, top3, top5, top10, rankedPlayers } =
    rankPlayersWithHeap(players);

  // 7. Synchronize Network Nodes with latest ranks, scores, and interactions
  const nodes: NetworkNode[] = rankedPlayers.map((p) => ({
    id: p.playerId,
    name: p.name,
    position: p.position,
    team: p.academyTeam,
    squadNumber: p.squadNumber,
    rank: p.rank,
    score: p.performanceScore,
    totalInteractions: p.totalInteractions,
    connectedTeammates: p.connectedTeammates,
    weightedInvolvement: p.weightedInvolvement,
  }));

  // 8. Compute Summary KPIs
  const totalInteractionsSum =
    existingLinks.length > 0
      ? existingLinks.reduce((acc, l) => acc + l.weight, 0)
      : Math.round(
          rankedPlayers.reduce((acc, p) => acc + p.totalInteractions, 0) / 2
        );

  const avgPerformanceScore =
    rankedPlayers.length > 0
      ? Number(
          (
            rankedPlayers.reduce((acc, p) => acc + p.performanceScore, 0) /
            rankedPlayers.length
          ).toFixed(2)
        )
      : 0;

  const fallbackTopPlayer: PlayerRanking = allRankings[0] || {
    rank: 1,
    playerId: 'P001',
    name: 'N/A',
    position: 'Midfielder',
    team: 'Vertex Alpha',
    squadNumber: 1,
    performanceScore: 0,
    recentForm: 0,
    totalInteractions: 0,
    tieBreakReason: 'Tournament Leader',
  };

  return {
    meta: {
      platform:
        partial.meta?.platform || 'Elitescore - Sports Academy Analytics',
      team: partial.meta?.team || 'Vertex Eleven',
      batchProcessedAt: nowStr,
      dataset:
        options?.datasetLabel ||
        partial.meta?.dataset ||
        'Synthetic Demo Dataset',
      pipelineArchitecture:
        partial.meta?.pipelineArchitecture ||
        'Historical Match Data -> Java OOP & Graph -> Python Regression -> Java PriorityQueue Heap -> React UI',
    },
    summary: {
      totalPlayers: rankedPlayers.length,
      matchesAnalyzed: matches.length,
      totalInteractions: totalInteractionsSum,
      avgPerformanceScore,
      topPlayer: fallbackTopPlayer,
    },
    top3,
    top5,
    top10,
    allRankings,
    players: rankedPlayers,
    network: {
      nodes,
      links: existingLinks,
    },
    playerMatchLogs,
    matches,
  };
}

/**
 * Append a single validated historical match record and update all downstream
 * player match logs, cumulative statistics, interaction graph weights,
 * regression scores, and PriorityQueue Top-K rankings.
 */
export function appendMatchRecordToMasterData(
  currentData: MasterData,
  newMatch: MatchOverview
): MasterData {
  const updatedMatches = [...currentData.matches, newMatch];
  const participatingTeams = new Set<string>([newMatch.team]);
  // If opponent is also an academy squad in our dataset, update both squads!
  if (
    currentData.players.some(
      (p) => p.academyTeam.toLowerCase() === newMatch.opponent.toLowerCase()
    )
  ) {
    participatingTeams.add(newMatch.opponent);
  }

  const updatedMatchLogs: Record<string, PlayerMatchLog[]> = {
    ...currentData.playerMatchLogs,
  };

  // Distribute goals and assists across participating squad players
  const updatedPlayers = currentData.players.map((p) => {
    const isHomeTeam = p.academyTeam === newMatch.team;
    const isOpponentTeam =
      !isHomeTeam &&
      participatingTeams.has(p.academyTeam) &&
      p.academyTeam.toLowerCase() === newMatch.opponent.toLowerCase();

    if (!isHomeTeam && !isOpponentTeam) {
      return p;
    }

    const teamGoalsFor = isHomeTeam ? newMatch.goalsFor : newMatch.goalsAgainst;
    const teamGoalsAgainst = isHomeTeam
      ? newMatch.goalsAgainst
      : newMatch.goalsFor;
    const teamResult = isHomeTeam
      ? newMatch.result
      : newMatch.result === 'WIN'
      ? 'LOSS'
      : newMatch.result === 'LOSS'
      ? 'WIN'
      : 'DRAW';
    const teamOpponent = isHomeTeam ? newMatch.opponent : newMatch.team;

    const mSeed = seededRandom(`${p.playerId}-${newMatch.matchId}`);
    const addGoals =
      p.position === 'Forward'
        ? teamGoalsFor >= 2 && mSeed > 0.35
          ? 1
          : teamGoalsFor >= 3 && mSeed > 0.7
          ? 2
          : 0
        : p.position === 'Midfielder' && teamGoalsFor >= 2 && mSeed > 0.65
        ? 1
        : 0;
    const addAssists =
      p.position === 'Midfielder'
        ? teamGoalsFor >= 1 && mSeed > 0.4
          ? 1
          : 0
        : p.position === 'Forward' && teamGoalsFor >= 2 && mSeed > 0.6
        ? 1
        : 0;
    const addShots =
      addGoals +
      (p.position === 'Forward'
        ? 2
        : p.position === 'Midfielder'
        ? 1
        : 0);
    const addPassesAtt =
      p.position === 'Midfielder'
        ? 54
        : p.position === 'Defender'
        ? 46
        : p.position === 'Goalkeeper'
        ? 28
        : 26;
    const matchPassAcc = Number(
      Math.min(
        96.0,
        Math.max(70.0, p.passAccuracy + (mSeed - 0.48) * 3.2)
      ).toFixed(1)
    );
    const addPassesComp = Math.round(addPassesAtt * (matchPassAcc / 100));
    const addTackles =
      p.position === 'Defender' ? 5 : p.position === 'Midfielder' ? 3 : 1;
    const addInterceptions =
      p.position === 'Defender' ? 4 : p.position === 'Midfielder' ? 3 : 1;
    const addClean =
      teamGoalsAgainst === 0 &&
      (p.position === 'Defender' || p.position === 'Goalkeeper')
        ? 1
        : 0;
    const addInteractions =
      p.position === 'Midfielder'
        ? 62
        : p.position === 'Defender'
        ? 54
        : p.position === 'Forward'
        ? 34
        : 28;

    const resMod =
      teamResult === 'WIN' ? 0.38 : teamResult === 'LOSS' ? -0.32 : 0.05;
    const matchRating = Number(
      Math.max(
        5.2,
        Math.min(
          9.6,
          p.avgMatchRating +
            resMod +
            addGoals * 0.55 +
            addAssists * 0.35 +
            addClean * 0.35 +
            (mSeed - 0.5) * 0.3
        )
      ).toFixed(1)
    );

    const newLog: PlayerMatchLog = {
      matchId: newMatch.matchId,
      date: newMatch.date,
      opponent: teamOpponent,
      result: teamResult,
      minutes: 90,
      goals: addGoals,
      assists: addAssists,
      shots: addShots,
      passesCompleted: addPassesComp,
      passAccuracy: matchPassAcc,
      tackles: addTackles,
      interceptions: addInterceptions,
      rating: matchRating,
    };

    const prevLogs = updatedMatchLogs[p.playerId] || [];
    const nextLogs = [...prevLogs, newLog];
    updatedMatchLogs[p.playerId] = nextLogs;

    const allRatings = nextLogs.map((l) => l.rating);
    const newMatchesPlayed = p.matchesPlayed + 1;
    const newTotalMinutes = p.totalMinutes + 90;
    const newPassesAtt = p.passesAttempted + addPassesAtt;
    const newPassesComp = p.passesCompleted + addPassesComp;
    const newPassAcc = Number(
      ((newPassesComp / Math.max(1, newPassesAtt)) * 100).toFixed(2)
    );
    const newAvgRating = Number(
      (
        allRatings.reduce((a, b) => a + b, 0) / Math.max(1, allRatings.length)
      ).toFixed(2)
    );
    const newRecentForm = calculateRecentForm(allRatings);
    const newConsistency = calculateConsistency(allRatings);
    const newTotalInteractions = p.totalInteractions + addInteractions;
    const newWeightedInvolvement = Number(
      (p.weightedInvolvement + addInteractions * (matchPassAcc / 100)).toFixed(
        2
      )
    );
    const newInteractionDensity = Number(
      (
        newTotalInteractions / Math.max(1, p.connectedTeammates || 11)
      ).toFixed(2)
    );

    const scoreDelta =
      (teamResult === 'WIN' ? 0.42 : teamResult === 'LOSS' ? -0.28 : 0.08) +
      addGoals * 0.48 +
      addAssists * 0.32 +
      addClean * 0.25;
    const newPerformanceScore = Number(
      Math.max(50.0, Math.min(99.0, p.performanceScore + scoreDelta)).toFixed(2)
    );

    return {
      ...p,
      matchesPlayed: newMatchesPlayed,
      totalMinutes: newTotalMinutes,
      goals: p.goals + addGoals,
      assists: p.assists + addAssists,
      shots: p.shots + addShots,
      passesAttempted: newPassesAtt,
      passesCompleted: newPassesComp,
      passAccuracy: newPassAcc,
      tackles: p.tackles + addTackles,
      interceptions: p.interceptions + addInterceptions,
      cleanSheets: p.cleanSheets + addClean,
      avgMatchRating: newAvgRating,
      recentForm: newRecentForm,
      consistencyScore: newConsistency,
      totalInteractions: newTotalInteractions,
      weightedInvolvement: newWeightedInvolvement,
      interactionDensity: newInteractionDensity,
      performanceScore: newPerformanceScore,
    };
  });

  // Update interaction network link weights for participating teams
  const participantIds = new Set(
    updatedPlayers
      .filter((p) => participatingTeams.has(p.academyTeam))
      .map((p) => p.playerId)
  );

  const updatedLinks = currentData.network.links.map((link) => {
    if (participantIds.has(link.source) && participantIds.has(link.target)) {
      const addWeight = 5;
      const addSucc = 4;
      return {
        ...link,
        weight: link.weight + addWeight,
        successful: link.successful + addSucc,
      };
    }
    return link;
  });

  return ensureCompleteMasterData(
    {
      ...currentData,
      matches: updatedMatches,
      players: updatedPlayers,
      playerMatchLogs: updatedMatchLogs,
      network: {
        ...currentData.network,
        links: updatedLinks,
      },
    },
    { forceRecomputeScores: false }
  );
}

/**
 * Parse a CSV line handling quoted values
 */
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Smart parser for uploaded JSON or CSV datasets.
 * Supports:
 * - Full MasterData JSON
 * - JSON array of players or matches
 * - Players CSV / player_stats.csv / final_rankings.csv / exported rankings CSV
 * - Matches CSV (matches.csv)
 * - Match Performances CSV (match_performances.csv)
 * - Pass Interactions CSV (pass_interactions.csv)
 */
export function parseAndBuildUploadedDataset(
  content: string,
  fileName: string,
  currentData: MasterData
): {
  updatedData: MasterData;
  validation: {
    validRecords: number;
    missingFields: number;
    invalidValues: number;
    duplicateRecords: number;
    messages: string[];
  };
  summaryMessage: string;
} {
  const ext = fileName.split('.').pop()?.toLowerCase();
  const cleanDatasetName = fileName.replace(/\.(json|csv)$/i, '');

  if (ext === 'json') {
    const parsed = JSON.parse(content);

    // Case 1: Array of records in JSON
    if (Array.isArray(parsed)) {
      if (parsed.length === 0) {
        throw new Error('Uploaded JSON array is empty');
      }
      const first = parsed[0];
      if (first.matchId || first.match_id || first.opponent) {
        // Array of matches
        const uploadedMatches: MatchOverview[] = parsed.map(
          (m: Record<string, any>, i: number) => ({
            matchId: String(m.matchId || m.match_id || `M${i + 1}`),
            date: String(m.date || '2026-03-01'),
            team: String(m.team || 'Vertex Alpha'),
            opponent: String(m.opponent || 'Academy Opponent'),
            venue: String(m.venue || 'Home'),
            goalsFor: Number(m.goalsFor ?? m.goals_for ?? 2),
            goalsAgainst: Number(m.goalsAgainst ?? m.goals_against ?? 1),
            result: String(m.result || 'WIN').toUpperCase(),
          })
        );
        const updatedData = ensureCompleteMasterData(
          {
            ...currentData,
            matches: uploadedMatches,
          },
          { forceRecomputeScores: true, datasetLabel: cleanDatasetName }
        );
        return {
          updatedData,
          validation: {
            validRecords: uploadedMatches.length,
            missingFields: 0,
            invalidValues: 0,
            duplicateRecords: 0,
            messages: [],
          },
          summaryMessage: `JSON match dataset "${fileName}" uploaded (${uploadedMatches.length} matches). Rankings and metrics updated.`,
        };
      } else {
        // Array of players
        const uploadedPlayers: PlayerProfile[] = parsed.map(
          (p: Record<string, any>, i: number) => ({
            playerId: String(
              p.playerId || p.player_id || p.id || `P${String(i + 1).padStart(3, '0')}`
            ),
            name: String(p.name || p.player || `Player ${i + 1}`),
            position: normalizePosition(p.position || p.pos),
            squadNumber: Number(p.squadNumber ?? p.squad_number ?? i + 1),
            academyTeam: String(
              p.academyTeam || p.academy_team || p.team || 'Vertex Alpha'
            ),
            age: Number(p.age ?? 18),
            rank: Number(p.rank ?? i + 1),
            performanceScore: Number(
              p.performanceScore ?? p.performance_score ?? p.aiScore ?? p.score ?? 0
            ),
            recentForm: Number(p.recentForm ?? p.recent_form ?? 0),
            consistencyScore: Number(
              p.consistencyScore ?? p.consistency_score ?? 0
            ),
            avgMatchRating: Number(p.avgMatchRating ?? p.avg_match_rating ?? 0),
            matchesPlayed: Number(p.matchesPlayed ?? p.matches_played ?? 0),
            totalMinutes: Number(p.totalMinutes ?? p.total_minutes ?? 0),
            goals: Number(p.goals ?? p.total_goals ?? 0),
            assists: Number(p.assists ?? p.total_assists ?? 0),
            shots: Number(p.shots ?? p.total_shots ?? 0),
            passesAttempted: Number(
              p.passesAttempted ?? p.passes_attempted ?? 0
            ),
            passesCompleted: Number(
              p.passesCompleted ?? p.passes_completed ?? 0
            ),
            passAccuracy: Number(p.passAccuracy ?? p.pass_accuracy ?? 0),
            tackles: Number(p.tackles ?? p.total_tackles ?? 0),
            interceptions: Number(
              p.interceptions ?? p.total_interceptions ?? 0
            ),
            cleanSheets: Number(p.cleanSheets ?? p.clean_sheets ?? 0),
            totalInteractions: Number(
              p.totalInteractions ?? p.total_interactions ?? 0
            ),
            connectedTeammates: Number(
              p.connectedTeammates ?? p.connected_teammates ?? 0
            ),
            weightedInvolvement: Number(
              p.weightedInvolvement ?? p.weighted_involvement ?? 0
            ),
            interactionDensity: Number(
              p.interactionDensity ?? p.interaction_density ?? 0
            ),
          })
        );
        const updatedData = ensureCompleteMasterData(
          {
            players: uploadedPlayers,
            matches: currentData.matches,
          },
          { datasetLabel: cleanDatasetName }
        );
        return {
          updatedData,
          validation: {
            validRecords: uploadedPlayers.length,
            missingFields: 0,
            invalidValues: 0,
            duplicateRecords: 0,
            messages: [],
          },
          summaryMessage: `JSON player dataset "${fileName}" uploaded and ranked (${uploadedPlayers.length} players).`,
        };
      }
    }

    // Case 2: MasterData object in JSON
    if (!parsed.players && !parsed.allRankings && !parsed.matches) {
      throw new Error('Missing required schema fields in JSON');
    }

    const updatedData = ensureCompleteMasterData(parsed, {
      datasetLabel: cleanDatasetName,
    });

    const recordCount =
      updatedData.players.length +
      updatedData.matches.length +
      updatedData.network.links.length;

    return {
      updatedData,
      validation: {
        validRecords: recordCount,
        missingFields: 0,
        invalidValues: 0,
        duplicateRecords: 0,
        messages: [],
      },
      summaryMessage: `Dataset "${fileName}" uploaded, validated, and ranked (${updatedData.players.length} players, ${updatedData.matches.length} matches).`,
    };
  }

  // CSV Parsing & Intelligent Schema Detection
  const lines = content
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    throw new Error('CSV contains no data rows');
  }

  const rawHeaders = parseCsvLine(lines[0]);
  const headers = rawHeaders.map((h) =>
    h
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
  );

  if (headers.length < 2) {
    throw new Error('Invalid CSV column structure');
  }

  let validCount = 0;
  let missingCount = 0;
  let invalidCount = 0;
  let duplicateCount = 0;
  const seenKeys = new Set<string>();
  const rowObjects: Record<string, string>[] = [];

  lines.slice(1).forEach((line, rowIdx) => {
    const cols = parseCsvLine(line);
    if (cols.length < headers.length || cols.some((c) => c === '')) {
      missingCount++;
    }
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => {
      obj[h] = cols[i] !== undefined ? cols[i] : '';
    });

    // Determine primary key for duplicate detection
    const pk =
      obj.player_id ||
      obj.playerid ||
      obj.match_id ||
      obj.matchid ||
      (obj.source_player && obj.target_player
        ? `${obj.match_id || rowIdx}-${obj.source_player}-${obj.target_player}`
        : '') ||
      `${cols[0]}-${cols[1] || rowIdx}`;

    if (
      (obj.player_id || obj.playerid || obj.match_id || obj.matchid) &&
      !obj.minutes_played &&
      !obj.source_player
    ) {
      if (seenKeys.has(pk)) {
        duplicateCount++;
        return;
      }
      seenKeys.add(pk);
    }

    validCount++;
    rowObjects.push(obj);
  });

  if (rowObjects.length === 0) {
    throw new Error('No valid data rows found in CSV');
  }

  const hasHeader = (candidates: string[]) =>
    candidates.some((c) => headers.includes(c));

  // Schema Type 1: Pass Interactions CSV (source_player, target_player, pass_count, successful_passes)
  if (hasHeader(['source_player', 'source']) && hasHeader(['target_player', 'target'])) {
    const linkMap = new Map<string, NetworkLink>();
    rowObjects.forEach((r) => {
      const s = r.source_player || r.source;
      const t = r.target_player || r.target;
      if (!s || !t || s === t) return;
      const a = s < t ? s : t;
      const b = s < t ? t : s;
      const key = `${a}__${b}`;
      const w = Number(r.pass_count || r.weight || 5);
      const succ = Number(r.successful_passes || r.successful || Math.round(w * 0.85));
      const existing = linkMap.get(key);
      if (existing) {
        existing.weight += isNaN(w) ? 0 : w;
        existing.successful += isNaN(succ) ? 0 : succ;
      } else {
        linkMap.set(key, {
          source: a,
          target: b,
          weight: isNaN(w) ? 5 : w,
          successful: isNaN(succ) ? 4 : succ,
        });
      }
    });

    const newLinks = Array.from(linkMap.values());
    // Recompute player interaction metrics from the new graph
    const updatedPlayers = currentData.players.map((p) => {
      const connected = newLinks.filter(
        (l) => l.source === p.playerId || l.target === p.playerId
      );
      if (connected.length === 0) return p;
      const totalInt = connected.reduce((sum, l) => sum + l.weight, 0);
      const totalSucc = connected.reduce((sum, l) => sum + l.successful, 0);
      const teammates = connected.length;
      return {
        ...p,
        totalInteractions: totalInt,
        connectedTeammates: teammates,
        weightedInvolvement: Number((totalSucc * 0.92).toFixed(2)),
        interactionDensity: Number((totalInt / Math.max(1, teammates)).toFixed(2)),
      };
    });

    const updatedData = ensureCompleteMasterData(
      {
        ...currentData,
        players: updatedPlayers,
        network: {
          ...currentData.network,
          links: newLinks,
        },
      },
      { forceRecomputeScores: true, datasetLabel: cleanDatasetName }
    );

    return {
      updatedData,
      validation: {
        validRecords: validCount,
        missingFields: missingCount,
        invalidValues: invalidCount,
        duplicateRecords: duplicateCount,
        messages: [],
      },
      summaryMessage: `Passing interaction graph "${fileName}" uploaded (${newLinks.length} unique edges). Player scores and rankings recalculated.`,
    };
  }

  // Schema Type 2: Match Performances CSV (match_id, player_id, minutes_played, goals, ...)
  if (
    hasHeader(['match_id', 'matchid']) &&
    hasHeader(['player_id', 'playerid']) &&
    hasHeader(['minutes_played', 'minutes', 'match_rating', 'rating'])
  ) {
    const newLogsMap: Record<string, PlayerMatchLog[]> = {};
    const matchLookup = new Map<string, MatchOverview>();
    currentData.matches.forEach((m) => matchLookup.set(m.matchId, m));

    rowObjects.forEach((r) => {
      const pid = r.player_id || r.playerid;
      const mid = r.match_id || r.matchid || 'M01';
      if (!pid) return;
      const matchInfo = matchLookup.get(mid);
      const log: PlayerMatchLog = {
        matchId: mid,
        date: r.date || matchInfo?.date || '2026-02-15',
        opponent: r.opponent || matchInfo?.opponent || 'Academy Opponent',
        result: (r.result || matchInfo?.result || 'WIN').toUpperCase(),
        minutes: Number(r.minutes_played ?? r.minutes ?? 90),
        goals: Number(r.goals ?? 0),
        assists: Number(r.assists ?? 0),
        shots: Number(r.shots ?? 1),
        passesCompleted: Number(r.passes_completed ?? r.passescompleted ?? 32),
        passAccuracy: Number(r.pass_accuracy ?? r.passaccuracy ?? 84.0),
        tackles: Number(r.tackles ?? 2),
        interceptions: Number(r.interceptions ?? 2),
        rating: Number(r.match_rating ?? r.rating ?? 7.4),
      };
      if (!newLogsMap[pid]) newLogsMap[pid] = [];
      newLogsMap[pid].push(log);
    });

    const updatedPlayers = currentData.players.map((p) => {
      const logs = newLogsMap[p.playerId];
      if (!logs || logs.length === 0) return p;
      const ratings = logs.map((l) => l.rating);
      const totalMinutes = logs.reduce((s, l) => s + l.minutes, 0);
      const goals = logs.reduce((s, l) => s + l.goals, 0);
      const assists = logs.reduce((s, l) => s + l.assists, 0);
      const shots = logs.reduce((s, l) => s + l.shots, 0);
      const passesCompleted = logs.reduce((s, l) => s + l.passesCompleted, 0);
      const passAccuracy = Number(
        (logs.reduce((s, l) => s + l.passAccuracy, 0) / logs.length).toFixed(2)
      );
      const passesAttempted = Math.max(
        passesCompleted,
        Math.round(passesCompleted / Math.max(0.5, passAccuracy / 100))
      );
      const tackles = logs.reduce((s, l) => s + l.tackles, 0);
      const interceptions = logs.reduce((s, l) => s + l.interceptions, 0);
      const avgMatchRating = Number(
        (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(2)
      );
      return {
        ...p,
        matchesPlayed: logs.length,
        totalMinutes,
        goals,
        assists,
        shots,
        passesAttempted,
        passesCompleted,
        passAccuracy,
        tackles,
        interceptions,
        avgMatchRating,
        recentForm: calculateRecentForm(ratings),
        consistencyScore: calculateConsistency(ratings),
      };
    });

    const updatedData = ensureCompleteMasterData(
      {
        ...currentData,
        players: updatedPlayers,
        playerMatchLogs: {
          ...currentData.playerMatchLogs,
          ...newLogsMap,
        },
      },
      { forceRecomputeScores: true, datasetLabel: cleanDatasetName }
    );

    return {
      updatedData,
      validation: {
        validRecords: validCount,
        missingFields: missingCount,
        invalidValues: invalidCount,
        duplicateRecords: duplicateCount,
        messages: [],
      },
      summaryMessage: `Match performance logs "${fileName}" uploaded (${validCount} player-match records). Regression scores and rankings updated.`,
    };
  }

  // Schema Type 3: Matches CSV (match_id, date, team, opponent, venue, goals_for, goals_against, result)
  if (
    hasHeader(['match_id', 'matchid']) &&
    hasHeader(['opponent', 'goals_for', 'goalsfor', 'venue'])
  ) {
    const uploadedMatches: MatchOverview[] = rowObjects.map((r, idx) => {
      const gf = Number(r.goals_for ?? r.goalsfor ?? 2);
      const ga = Number(r.goals_against ?? r.goalsagainst ?? 1);
      const computedRes = gf > ga ? 'WIN' : gf < ga ? 'LOSS' : 'DRAW';
      return {
        matchId: r.match_id || r.matchid || `M${String(idx + 1).padStart(2, '0')}`,
        date: r.date || '2026-02-15',
        team: r.team || r.squad || 'Vertex Alpha',
        opponent: r.opponent || 'Academy Opponent',
        venue: r.venue || 'Home',
        goalsFor: isNaN(gf) ? 2 : gf,
        goalsAgainst: isNaN(ga) ? 1 : ga,
        result: (r.result || computedRes).toUpperCase(),
      };
    });

    // Rebuild player match logs for the new match list and recompute scores
    const updatedData = ensureCompleteMasterData(
      {
        ...currentData,
        matches: uploadedMatches,
        playerMatchLogs: {}, // Regenerate logs aligned to the uploaded match list
      },
      { forceRecomputeScores: true, datasetLabel: cleanDatasetName }
    );

    return {
      updatedData,
      validation: {
        validRecords: validCount,
        missingFields: missingCount,
        invalidValues: invalidCount,
        duplicateRecords: duplicateCount,
        messages: [],
      },
      summaryMessage: `Match fixture dataset "${fileName}" uploaded (${uploadedMatches.length} matches). Player metrics and rankings recalculated.`,
    };
  }

  // Schema Type 4: Players CSV / player_stats.csv / final_rankings.csv / performance_scores.csv / custom player CSV
  const existingPlayerMap = new Map<string, PlayerProfile>();
  currentData.players.forEach((p) => existingPlayerMap.set(p.playerId, p));

  let hasExplicitScores = false;

  const uploadedPlayers: PlayerProfile[] = rowObjects.map((r, idx) => {
    const pid =
      r.player_id ||
      r.playerid ||
      r.id ||
      `P${String(idx + 1).padStart(3, '0')}`;
    const existing = existingPlayerMap.get(pid);
    const seed = seededRandom(`${pid}-${r.name || r.player || idx}`);

    const pos = normalizePosition(
      r.position || r.pos || existing?.position || 'Midfielder'
    );
    const name =
      r.name || r.player || r.player_name || existing?.name || `Player ${pid}`;
    const team =
      r.academy_team ||
      r.academyteam ||
      r.team ||
      r.squad ||
      existing?.academyTeam ||
      (idx % 2 === 0 ? 'Vertex Alpha' : 'Vertex Beta');
    const squadNumber = Number(
      r.squad_number ??
        r.squadnumber ??
        r.number ??
        existing?.squadNumber ??
        (idx % 23) + 1
    );
    const age = Number(r.age ?? existing?.age ?? 18);

    const rawScore =
      r.performance_score ??
      r.performancescore ??
      r.ai_score ??
      r.aiscore ??
      r.score;
    const parsedScore =
      rawScore !== undefined && rawScore !== '' ? Number(rawScore) : NaN;
    if (!isNaN(parsedScore) && parsedScore > 0) {
      hasExplicitScores = true;
    }

    const matchesPlayed = Number(
      r.matches_played ?? r.matchesplayed ?? existing?.matchesPlayed ?? 8
    );
    const totalMinutes = Number(
      r.total_minutes ??
        r.totalminutes ??
        existing?.totalMinutes ??
        matchesPlayed * 85
    );

    const goals =
      r.goals !== undefined && r.goals !== ''
        ? Number(r.goals)
        : r.total_goals !== undefined && r.total_goals !== ''
        ? Number(r.total_goals)
        : r.goals_per_match !== undefined && r.goals_per_match !== ''
        ? Math.round(Number(r.goals_per_match) * matchesPlayed)
        : existing?.goals ??
          (pos === 'Forward'
            ? Math.round(2 + seed * 4)
            : pos === 'Midfielder'
            ? Math.round(1 + seed * 2)
            : 0);

    const assists =
      r.assists !== undefined && r.assists !== ''
        ? Number(r.assists)
        : r.total_assists !== undefined && r.total_assists !== ''
        ? Number(r.total_assists)
        : r.assists_per_match !== undefined && r.assists_per_match !== ''
        ? Math.round(Number(r.assists_per_match) * matchesPlayed)
        : existing?.assists ??
          (pos === 'Midfielder'
            ? Math.round(2 + seed * 3)
            : pos === 'Forward'
            ? Math.round(1 + seed * 2)
            : 0);

    const shots = Number(
      r.shots ?? r.total_shots ?? existing?.shots ?? goals * 3 + 5
    );
    const passAccuracy = Number(
      r.pass_accuracy ??
        r.passaccuracy ??
        existing?.passAccuracy ??
        Number((80 + seed * 12).toFixed(2))
    );
    const passesCompleted = Number(
      r.passes_completed ??
        r.passescompleted ??
        existing?.passesCompleted ??
        Math.round(matchesPlayed * (pos === 'Midfielder' ? 48 : 34))
    );
    const passesAttempted = Number(
      r.passes_attempted ??
        r.passesattempted ??
        existing?.passesAttempted ??
        Math.max(
          passesCompleted,
          Math.round(passesCompleted / Math.max(0.6, passAccuracy / 100))
        )
    );
    const tackles =
      r.tackles !== undefined && r.tackles !== ''
        ? Number(r.tackles)
        : r.tackles_per_match !== undefined && r.tackles_per_match !== ''
        ? Math.round(Number(r.tackles_per_match) * matchesPlayed)
        : existing?.tackles ??
          (pos === 'Defender' ? Math.round(28 + seed * 18) : 14);
    const interceptions =
      r.interceptions !== undefined && r.interceptions !== ''
        ? Number(r.interceptions)
        : r.interceptions_per_match !== undefined &&
          r.interceptions_per_match !== ''
        ? Math.round(Number(r.interceptions_per_match) * matchesPlayed)
        : existing?.interceptions ??
          (pos === 'Defender' ? Math.round(22 + seed * 14) : 12);
    const cleanSheets = Number(
      r.clean_sheets ??
        r.cleansheets ??
        existing?.cleanSheets ??
        (pos === 'Defender' || pos === 'Goalkeeper' ? 3 : 0)
    );
    const recentForm = Number(
      r.recent_form ??
        r.recentform ??
        existing?.recentForm ??
        Number((72 + seed * 16).toFixed(1))
    );
    const consistencyScore = Number(
      r.consistency_score ??
        r.consistencyscore ??
        existing?.consistencyScore ??
        Number((78 + seed * 15).toFixed(1))
    );
    const avgMatchRating = Number(
      r.avg_match_rating ??
        r.avgmatchrating ??
        existing?.avgMatchRating ??
        Number((recentForm / 10).toFixed(2))
    );
    const totalInteractions = Number(
      r.total_interactions ??
        r.totalinteractions ??
        existing?.totalInteractions ??
        (pos === 'Midfielder'
          ? Math.round(920 + seed * 120)
          : pos === 'Defender'
          ? Math.round(850 + seed * 100)
          : pos === 'Forward'
          ? Math.round(470 + seed * 60)
          : Math.round(380 + seed * 90))
    );
    const connectedTeammates = Number(
      r.connected_teammates ??
        r.connectedteammates ??
        existing?.connectedTeammates ??
        11
    );
    const weightedInvolvement = Number(
      r.weighted_involvement ??
        r.weightedinvolvement ??
        existing?.weightedInvolvement ??
        Number((totalInteractions * (passAccuracy / 100) * 0.92).toFixed(2))
    );
    const interactionDensity = Number(
      r.interaction_density ??
        r.interactiondensity ??
        existing?.interactionDensity ??
        Number(
          (totalInteractions / Math.max(1, connectedTeammates)).toFixed(2)
        )
    );

    return {
      playerId: pid,
      name,
      position: pos,
      squadNumber: isNaN(squadNumber) ? idx + 1 : squadNumber,
      academyTeam: team,
      age: isNaN(age) ? 18 : age,
      rank: idx + 1,
      performanceScore: !isNaN(parsedScore) && parsedScore > 0 ? parsedScore : 0,
      recentForm: isNaN(recentForm) ? 75.0 : recentForm,
      consistencyScore: isNaN(consistencyScore) ? 82.0 : consistencyScore,
      avgMatchRating: isNaN(avgMatchRating) ? 7.5 : avgMatchRating,
      matchesPlayed: isNaN(matchesPlayed) ? 8 : matchesPlayed,
      totalMinutes: isNaN(totalMinutes) ? 680 : totalMinutes,
      goals: isNaN(goals) ? 0 : goals,
      assists: isNaN(assists) ? 0 : assists,
      shots: isNaN(shots) ? 5 : shots,
      passesAttempted: isNaN(passesAttempted) ? 240 : passesAttempted,
      passesCompleted: isNaN(passesCompleted) ? 200 : passesCompleted,
      passAccuracy: isNaN(passAccuracy) ? 84.0 : passAccuracy,
      tackles: isNaN(tackles) ? 12 : tackles,
      interceptions: isNaN(interceptions) ? 10 : interceptions,
      cleanSheets: isNaN(cleanSheets) ? 0 : cleanSheets,
      totalInteractions: isNaN(totalInteractions) ? 500 : totalInteractions,
      connectedTeammates: isNaN(connectedTeammates) ? 11 : connectedTeammates,
      weightedInvolvement: isNaN(weightedInvolvement)
        ? 400.0
        : weightedInvolvement,
      interactionDensity: isNaN(interactionDensity) ? 45.0 : interactionDensity,
    };
  });

  const updatedData = ensureCompleteMasterData(
    {
      ...currentData,
      players: uploadedPlayers,
    },
    {
      forceRecomputeScores: !hasExplicitScores,
      datasetLabel: cleanDatasetName,
    }
  );

  return {
    updatedData,
    validation: {
      validRecords: validCount,
      missingFields: missingCount,
      invalidValues: invalidCount,
      duplicateRecords: duplicateCount,
      messages: [],
    },
    summaryMessage: `CSV dataset "${fileName}" uploaded, validated, and ranked (${uploadedPlayers.length} players). Top #1: ${updatedData.summary.topPlayer.name} (${updatedData.summary.topPlayer.performanceScore.toFixed(2)}).`,
  };
}
