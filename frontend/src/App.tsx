import React, { useState, useEffect } from 'react';
import initialData from './data/athletix_master_data.json';
import { MasterData, PlayerProfile } from './types/athletix';
import { Sidebar, TopBar } from './components/Navbar';
import { DashboardTab } from './components/DashboardTab';
import { RankingsTab } from './components/RankingsTab';
import { PlayersTab } from './components/PlayersTab';
import { PlayerProfileModal } from './components/PlayerProfileModal';
import { InteractionNetworkTab } from './components/InteractionNetworkTab';
import { AnalyticsTab } from './components/AnalyticsTab';
import { DataManagementTab } from './components/DataManagementTab';
import { SilkShaderBackground } from './components/SilkShaderBackground';
import { ensureCompleteMasterData } from './utils/batchAnalysisEngine';

export function App() {
  const [data, setData] = useState<MasterData>(
    initialData as unknown as MasterData
  );
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerProfile | null>(
    null
  );
  const [networkFocusPlayerId, setNetworkFocusPlayerId] = useState<
    string | null
  >(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Dataset & Batch Processing States
  const [hasDataset, setHasDataset] = useState<boolean>(true);
  const [hasAnalysisResults, setHasAnalysisResults] = useState<boolean>(true);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisStage, setAnalysisStage] = useState<
    'idle' | 'java-prep' | 'python-reg' | 'java-rank' | 'complete'
  >('idle');

  // Attempt to load latest static data if available
  useEffect(() => {
    fetch('/data/athletix_master_data.json')
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error('Using bundled data fallback');
      })
      .then((fetched: MasterData) => {
        if (fetched && fetched.summary) {
          setData(fetched);
        }
      })
      .catch(() => {
        // Bundled import works seamlessly
      });
  }, []);

  // Trigger full 3-stage offline batch pipeline recalculation
  const handleRunAnalysis = () => {
    if (!hasDataset || isAnalyzing) return;
    setIsAnalyzing(true);
    setAnalysisStage('java-prep');

    setTimeout(() => {
      setAnalysisStage('python-reg');
    }, 350);

    setTimeout(() => {
      setAnalysisStage('java-rank');
    }, 700);

    setTimeout(() => {
      setData((prev) => {
        const recomputed = ensureCompleteMasterData(prev, {
          forceRecomputeScores: false,
        });
        setSelectedPlayer((curr) =>
          curr
            ? recomputed.players.find((p) => p.playerId === curr.playerId) ||
              null
            : null
        );
        return recomputed;
      });
      setHasAnalysisResults(true);
      setIsAnalyzing(false);
      setAnalysisStage('complete');
    }, 1050);
  };

  // Export rankings results as CSV
  const handleExportResults = () => {
    if (!hasDataset) return;
    const headers = [
      'Rank',
      'PlayerID',
      'Name',
      'Position',
      'Team',
      'SquadNumber',
      'AIScore',
      'RecentForm',
      'TotalInteractions',
      'TieBreakReason',
    ];
    const rows = data.allRankings.map((r) => [
      r.rank,
      r.playerId,
      `"${r.name}"`,
      r.position,
      `"${r.team}"`,
      r.squadNumber,
      r.performanceScore.toFixed(2),
      r.recentForm.toFixed(1),
      r.totalInteractions,
      `"${r.tieBreakReason}"`,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'athletix_rankings_results.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  // Deep-link from Player Profile to Interaction Network
  const handleViewPlayerInNetwork = (playerId: string) => {
    setSelectedPlayer(null);
    setNetworkFocusPlayerId(playerId);
    setActiveTab('network');
  };

  return (
    <div className="relative min-h-screen text-slate-100 flex selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Animated WebGL1 "Silk" Flow Shader Background */}
      <SilkShaderBackground />

      {/* Left Sidebar Navigation */}
      <div className="relative z-10 flex w-full min-h-screen">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setSelectedPlayer(null);
            setActiveTab(tab);
          }}
          mobileOpen={mobileMenuOpen}
          setMobileOpen={setMobileMenuOpen}
          hasDataset={hasDataset}
          totalPlayers={data.summary.totalPlayers}
          matchesAnalyzed={data.summary.matchesAnalyzed}
          onClearSelectedPlayer={() => setSelectedPlayer(null)}
        />

        {/* Right Main Column: TopBar + Workspace + Footer */}
        <div className="flex-1 flex flex-col min-w-0">
          <TopBar
            activeTab={activeTab}
            selectedPlayer={selectedPlayer}
            onClearSelectedPlayer={() => setSelectedPlayer(null)}
            onSelectPlayer={(p) => setSelectedPlayer(p)}
            onOpenMobileMenu={() => setMobileMenuOpen(true)}
            players={data.players}
            hasDataset={hasDataset}
            isAnalyzing={isAnalyzing}
            batchProcessedAt={data.meta.batchProcessedAt}
          />

          <main className="flex-1 w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {selectedPlayer ? (
              <PlayerProfileModal
                player={selectedPlayer}
                data={data}
                onClose={() => setSelectedPlayer(null)}
                onSelectPlayer={(p) => setSelectedPlayer(p)}
                onViewInNetwork={handleViewPlayerInNetwork}
              />
            ) : (
              <>
                {activeTab === 'dashboard' && (
                  <DashboardTab
                    data={data}
                    hasDataset={hasDataset}
                    hasAnalysisResults={hasAnalysisResults}
                    isAnalyzing={isAnalyzing}
                    onRunAnalysis={handleRunAnalysis}
                    onExportResults={handleExportResults}
                    onSelectPlayer={(p) => setSelectedPlayer(p)}
                    onNavigateToTab={(t) => setActiveTab(t)}
                  />
                )}

                {activeTab === 'rankings' && (
                  <RankingsTab
                    data={data}
                    hasDataset={hasDataset}
                    hasAnalysisResults={hasAnalysisResults}
                    isAnalyzing={isAnalyzing}
                    onRunAnalysis={handleRunAnalysis}
                    onExportResults={handleExportResults}
                    onSelectPlayer={(p) => setSelectedPlayer(p)}
                    onNavigateToTab={(t) => setActiveTab(t)}
                  />
                )}

                {activeTab === 'players' && (
                  <PlayersTab
                    data={data}
                    hasDataset={hasDataset}
                    isAnalyzing={isAnalyzing}
                    onSelectPlayer={(p) => setSelectedPlayer(p)}
                    onNavigateToTab={(t) => setActiveTab(t)}
                  />
                )}

                {activeTab === 'network' && (
                  <InteractionNetworkTab
                    data={data}
                    hasDataset={hasDataset}
                    initialSelectedPlayerId={networkFocusPlayerId}
                    onSelectPlayer={(p) => setSelectedPlayer(p)}
                    onNavigateToTab={(t) => setActiveTab(t)}
                  />
                )}

                {activeTab === 'analytics' && (
                  <AnalyticsTab
                    data={data}
                    hasDataset={hasDataset}
                    isAnalyzing={isAnalyzing}
                    onExportResults={handleExportResults}
                    onNavigateToTab={(t) => setActiveTab(t)}
                  />
                )}

                {activeTab === 'data-mgmt' && (
                  <DataManagementTab
                    data={data}
                    hasDataset={hasDataset}
                    isAnalyzing={isAnalyzing}
                    analysisStage={analysisStage}
                    onRunAnalysis={handleRunAnalysis}
                    onUpdateData={(newData) => {
                      setData(newData);
                      setHasDataset(true);
                      setHasAnalysisResults(true);
                    }}
                    onDeleteDataset={() => {
                      setHasDataset(false);
                      setHasAnalysisResults(false);
                    }}
                    onRestoreDefaultDataset={() => {
                      setData(initialData as unknown as MasterData);
                      setHasDataset(true);
                      setHasAnalysisResults(true);
                    }}
                    onExportResults={handleExportResults}
                    onNavigateToTab={(t) => setActiveTab(t)}
                  />
                )}
              </>
            )}
          </main>

          {/* Clean SaaS Footer */}
          <footer className="border-t border-slate-800/80 bg-[#060718]/75 backdrop-blur-md py-4 px-4 sm:px-6 lg:px-8 text-xs text-slate-400">
            <div className="max-w-[1400px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-200">Elitescore</span>
                <span className="text-slate-600">•</span>
                <span>Data-driven player performance intelligence</span>
                <span className="text-slate-600">•</span>
                <span>
                  Team <strong className="text-emerald-400 font-semibold">Vertex Eleven</strong>
                </span>
              </div>
              <div className="font-mono text-[11px] text-slate-500">
                Java OOP & Interaction Graph • Python Ridge Regression • PriorityQueue Top-K
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}

export default App;
