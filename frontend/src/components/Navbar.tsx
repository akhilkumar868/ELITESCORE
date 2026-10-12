import React, { useState, useRef, useEffect } from 'react';
import {
  LayoutDashboard,
  Trophy,
  Users,
  Share2,
  BarChart3,
  Database,
  Menu,
  X,
  Search,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronRight,
  Activity
} from 'lucide-react';
import { PlayerProfile } from '../types/athletix';
import { PositionBadge, RankBadge } from './ui/DesignSystem';

export interface NavItemConfig {
  id: string;
  label: string;
  shortDesc: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const NAV_ITEMS: NavItemConfig[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    shortDesc: 'Player Performance Overview',
    icon: LayoutDashboard,
  },
  {
    id: 'rankings',
    label: 'Rankings',
    shortDesc: 'Java Top-K PriorityQueue Heap',
    icon: Trophy,
  },
  {
    id: 'players',
    label: 'Players',
    shortDesc: 'Academy Roster & Metrics',
    icon: Users,
  },
  {
    id: 'network',
    label: 'Interaction Network',
    shortDesc: 'Weighted Passing Graph',
    icon: Share2,
  },
  {
    id: 'analytics',
    label: 'Analytics',
    shortDesc: 'Trends & Score Distributions',
    icon: BarChart3,
  },
  {
    id: 'data-mgmt',
    label: 'Data Management',
    shortDesc: 'Dataset, Validation & Pipeline',
    icon: Database,
  },
];

import {
  Sidebar as WensitySidebar,
  SidebarFooter,
  SidebarHeader,
  SidebarItem,
  SidebarNav,
  SidebarSection,
  SidebarToggle,
  useSidebar,
} from '@/components/ui/sidebar';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  hasDataset: boolean;
  totalPlayers: number;
  matchesAnalyzed: number;
  onClearSelectedPlayer?: () => void;
}

function CountBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-md bg-[color-mix(in_srgb,var(--foreground)_7%,transparent)] px-1.5 py-0.5 text-[10.5px] font-medium leading-none text-[var(--muted-foreground)] tabular-nums">
      {children}
    </span>
  );
}

function AthletixWorkspaceMark() {
  const { collapsed } = useSidebar();
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <div className="flex size-7 shrink-0 items-center justify-center rounded-[7px] bg-[color:var(--color-brand,var(--primary))] text-[12px] font-bold text-[color:var(--color-brand-foreground,var(--primary-foreground))] shadow-saas-sm">
        <Activity className="size-4" />
      </div>
      {!collapsed && (
        <div className="min-w-0">
          <div className="truncate text-[14px] font-bold leading-none tracking-tight text-slate-50">
            Elitescore
          </div>
          <div className="truncate text-[10px] leading-tight text-[var(--muted-foreground)] mt-0.5">
            Performance Intelligence
          </div>
        </div>
      )}
    </div>
  );
}

function VertexElevenFooter({
  hasDataset,
  totalPlayers,
  matchesAnalyzed,
}: {
  hasDataset: boolean;
  totalPlayers: number;
  matchesAnalyzed: number;
}) {
  const { collapsed } = useSidebar();
  return (
    <>
      <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-mono font-bold text-emerald-400">
        V11
      </div>
      {!collapsed && (
        <div className="min-w-0 flex-1">
          <div className="truncate text-[12.5px] font-semibold leading-tight text-slate-100">
            Vertex Eleven
          </div>
          <div className="truncate text-[11px] leading-tight text-[var(--muted-foreground)] font-mono">
            {hasDataset
              ? `Batch • ${totalPlayers}P / ${matchesAnalyzed}M`
              : 'No Dataset Loaded'}
          </div>
        </div>
      )}
    </>
  );
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  mobileOpen,
  setMobileOpen,
  hasDataset,
  totalPlayers,
  matchesAnalyzed,
  onClearSelectedPlayer,
}) => {
  const handleSelect = (id: string) => {
    onClearSelectedPlayer?.();
    setActiveTab(id);
    setMobileOpen(false);
  };

  const renderSidebarInstance = (isMobile = false) => (
    <WensitySidebar
      variant={isMobile ? 'default' : 'collapsible'}
      width={248}
      aria-label="Main navigation"
      className="backdrop-blur-xl bg-black/90 border-r border-slate-800/80 h-screen sticky top-0"
    >
      <SidebarHeader className="border-b border-slate-800/80">
        <AthletixWorkspaceMark />
        {isMobile ? (
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="ml-auto p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            aria-label="Close navigation menu"
          >
            <X className="w-4 h-4" />
          </button>
        ) : (
          <SidebarToggle className="ml-auto" />
        )}
      </SidebarHeader>

      <SidebarNav className="sidebar-nav">
        <SidebarSection label="Workspace">
          {NAV_ITEMS.slice(0, 4).map((item) => {
            const Icon = item.icon;
            const badgeCount =
              item.id === 'players' && hasDataset
                ? String(totalPlayers)
                : undefined;
            return (
              <SidebarItem
                key={item.id}
                icon={<Icon className="size-[18px]" />}
                active={activeTab === item.id}
                badge={
                  badgeCount ? <CountBadge>{badgeCount}</CountBadge> : undefined
                }
                onClick={() => handleSelect(item.id)}
              >
                {item.label}
              </SidebarItem>
            );
          })}
        </SidebarSection>

        <SidebarSection label="Intelligence & Data">
          {NAV_ITEMS.slice(4).map((item) => {
            const Icon = item.icon;
            const badgeCount =
              item.id === 'data-mgmt' && hasDataset
                ? `${matchesAnalyzed}M`
                : undefined;
            return (
              <SidebarItem
                key={item.id}
                icon={<Icon className="size-[18px]" />}
                active={activeTab === item.id}
                badge={
                  badgeCount ? <CountBadge>{badgeCount}</CountBadge> : undefined
                }
                onClick={() => handleSelect(item.id)}
              >
                {item.label}
              </SidebarItem>
            );
          })}
        </SidebarSection>
      </SidebarNav>

      <SidebarFooter>
        <VertexElevenFooter
          hasDataset={hasDataset}
          totalPlayers={totalPlayers}
          matchesAnalyzed={matchesAnalyzed}
        />
      </SidebarFooter>
    </WensitySidebar>
  );

  return (
    <>
      {/* Desktop Collapsible Sidebar */}
      <aside className="hidden lg:block shrink-0">
        {renderSidebarInstance(false)}
      </aside>

      {/* Mobile & Tablet Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xs"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative z-10 flex">{renderSidebarInstance(true)}</div>
        </div>
      )}
    </>
  );
};

interface TopBarProps {
  activeTab: string;
  selectedPlayer: PlayerProfile | null;
  onClearSelectedPlayer: () => void;
  onSelectPlayer: (player: PlayerProfile) => void;
  onOpenMobileMenu: () => void;
  players: PlayerProfile[];
  hasDataset: boolean;
  isAnalyzing: boolean;
  batchProcessedAt: string;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  selectedPlayer,
  onClearSelectedPlayer,
  onSelectPlayer,
  onOpenMobileMenu,
  players,
  hasDataset,
  isAnalyzing,
  batchProcessedAt,
}) => {
  const [quickSearch, setQuickSearch] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const currentNav = NAV_ITEMS.find((n) => n.id === activeTab) || NAV_ITEMS[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchResults = quickSearch.trim()
    ? players
        .filter(
          (p) =>
            p.name.toLowerCase().includes(quickSearch.toLowerCase()) ||
            p.playerId.toLowerCase().includes(quickSearch.toLowerCase()) ||
            p.position.toLowerCase().includes(quickSearch.toLowerCase()) ||
            p.academyTeam.toLowerCase().includes(quickSearch.toLowerCase())
        )
        .slice(0, 6)
    : [];

  return (
    <header className="sticky top-0 z-30 h-14 bg-black/90 backdrop-blur-xl border-b border-slate-800/80 px-4 lg:px-8 flex items-center justify-between gap-4">
      {/* Left: Hamburger + Page Title / Breadcrumb */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/70 border border-slate-800"
          aria-label="Open navigation menu"
        >
          <Menu className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 text-sm min-w-0">
          <button
            type="button"
            onClick={onClearSelectedPlayer}
            className={`font-semibold truncate ${
              selectedPlayer
                ? 'text-slate-400 hover:text-slate-200 transition-colors'
                : 'text-slate-100'
            }`}
          >
            {currentNav.label}
          </button>

          {selectedPlayer ? (
            <>
              <ChevronRight className="w-4 h-4 text-slate-600 shrink-0" />
              <span className="font-semibold text-emerald-400 truncate">
                {selectedPlayer.name}
              </span>
            </>
          ) : (
            <span className="hidden md:inline-block text-xs text-slate-500 border-l border-slate-800 pl-2.5 ml-0.5 truncate">
              {currentNav.shortDesc}
            </span>
          )}
        </div>
      </div>

      {/* Right: Quick Player Search + Pipeline Status + Team */}
      <div className="flex items-center gap-3">
        {/* Global Quick Player Search */}
        {hasDataset && (
          <div ref={searchRef} className="relative hidden sm:block w-56 md:w-64">
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
              <input
                type="text"
                value={quickSearch}
                onFocus={() => setDropdownOpen(true)}
                onChange={(e) => {
                  setQuickSearch(e.target.value);
                  setDropdownOpen(true);
                }}
                placeholder="Quick jump to player..."
                className="saas-input w-full pl-8 pr-7 py-1 h-8 text-xs placeholder-slate-500"
                aria-label="Quick search player"
              />
              {quickSearch && (
                <button
                  type="button"
                  onClick={() => setQuickSearch('')}
                  className="absolute right-2 text-slate-400 hover:text-slate-200"
                  aria-label="Clear quick search"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {dropdownOpen && quickSearch.trim() && (
              <div className="absolute right-0 mt-1.5 w-80 rounded-xl bg-[#111726] border border-slate-700/90 shadow-saas-lg py-1.5 z-50">
                <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                  Matching Players ({searchResults.length})
                </div>
                {searchResults.length === 0 ? (
                  <div className="px-3 py-4 text-xs text-slate-400 text-center">
                    No players match "{quickSearch}"
                  </div>
                ) : (
                  <div className="divide-y divide-slate-800/60 max-h-64 overflow-y-auto">
                    {searchResults.map((p) => (
                      <button
                        key={p.playerId}
                        type="button"
                        onClick={() => {
                          onSelectPlayer(p);
                          setDropdownOpen(false);
                          setQuickSearch('');
                        }}
                        className="w-full px-3 py-2 text-left hover:bg-slate-800/70 flex items-center justify-between gap-2 transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <RankBadge rank={p.rank} size="sm" />
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-slate-100 truncate">
                              {p.name}
                            </div>
                            <div className="text-[11px] text-slate-400 truncate">
                              {p.academyTeam} • #{p.squadNumber}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <PositionBadge position={p.position} />
                          <span className="font-mono text-xs font-semibold text-emerald-400 tabular-nums">
                            {p.performanceScore.toFixed(1)}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Status Indicator */}
        <div
          className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#111726] border border-slate-800 text-xs"
          title={`Last batch processed: ${batchProcessedAt}`}
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-3.5 h-3.5 text-amber-400 animate-spin" />
              <span className="text-amber-300 font-medium hidden md:inline">
                Running Batch...
              </span>
            </>
          ) : hasDataset ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-slate-300 font-medium hidden md:inline">
                Batch Ready
              </span>
            </>
          ) : (
            <>
              <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-amber-300 font-medium hidden md:inline">
                No Dataset
              </span>
            </>
          )}
        </div>

        {/* Team Badge */}
        <div className="hidden xl:flex items-center gap-2 pl-2 border-l border-slate-800 text-xs text-slate-400">
          <span className="font-medium text-slate-300">Vertex Eleven</span>
        </div>
      </div>
    </header>
  );
};
