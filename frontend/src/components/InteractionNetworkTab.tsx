import React, { useState, useMemo, useEffect } from 'react';
import {
  Share2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Users,
  Database,
  Upload,
  Maximize2
} from 'lucide-react';
import { MasterData, NetworkNode, PlayerProfile } from '../types/athletix';
import {
  Button,
  Card,
  Badge,
  PositionBadge,
  RankBadge,
  SegmentedControl,
  SelectDropdown,
  EmptyState,
  PageHeader,
} from './ui/DesignSystem';

interface InteractionNetworkTabProps {
  data: MasterData;
  hasDataset: boolean;
  initialSelectedPlayerId?: string | null;
  onSelectPlayer: (player: PlayerProfile) => void;
  onNavigateToTab: (tab: string) => void;
}

export const InteractionNetworkTab: React.FC<InteractionNetworkTabProps> = ({
  data,
  hasDataset,
  initialSelectedPlayerId,
  onSelectPlayer,
  onNavigateToTab,
}) => {
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(
    initialSelectedPlayerId || null
  );
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [hoveredEdge, setHoveredEdge] = useState<{
    sourceName: string;
    targetName: string;
    weight: number;
    successful: number;
    x: number;
    y: number;
  } | null>(null);

  const [teamFilter, setTeamFilter] = useState<'All' | 'Vertex Alpha' | 'Vertex Beta'>('All');
  const [positionFilter, setPositionFilter] = useState<string>('All');
  const [minPassThreshold, setMinPassThreshold] = useState<number>(10);

  // Zoom & Pan state
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    if (initialSelectedPlayerId) {
      setSelectedPlayerId(initialSelectedPlayerId);
    }
  }, [initialSelectedPlayerId]);

  const { network, players } = data;

  const { filteredNodes, filteredLinks } = useMemo(() => {
    let nodes = [...network.nodes];
    if (teamFilter !== 'All') {
      nodes = nodes.filter((n) => n.team === teamFilter);
    }
    if (positionFilter !== 'All') {
      nodes = nodes.filter(
        (n) => n.position.toLowerCase() === positionFilter.toLowerCase()
      );
    }
    const nodeIds = new Set(nodes.map((n) => n.id));

    const links = network.links.filter(
      (l) =>
        nodeIds.has(l.source) &&
        nodeIds.has(l.target) &&
        l.weight >= minPassThreshold
    );

    return { filteredNodes: nodes, filteredLinks: links };
  }, [network, teamFilter, positionFilter, minPassThreshold]);

  // Compute deterministic tactical formation coordinates
  const layoutNodes = useMemo(() => {
    const width = 820;
    const height = 540;
    const centerX = width / 2;

    const posGroups: Record<string, NetworkNode[]> = {
      Forward: [],
      Midfielder: [],
      Defender: [],
      Goalkeeper: [],
    };

    filteredNodes.forEach((node) => {
      if (posGroups[node.position]) {
        posGroups[node.position].push(node);
      } else {
        posGroups.Midfielder.push(node);
      }
    });

    const yBands: Record<string, number> = {
      Forward: 95,
      Midfielder: 225,
      Defender: 365,
      Goalkeeper: 475,
    };

    const positioned: (NetworkNode & { x: number; y: number })[] = [];

    Object.entries(posGroups).forEach(([pos, group]) => {
      const count = group.length;
      if (count === 0) return;
      const baseY = yBands[pos] || 270;
      const spacing = Math.min(130, (width - 150) / Math.max(1, count));
      const startX = centerX - ((count - 1) * spacing) / 2;

      group.forEach((node, i) => {
        const offsetY = count > 2 ? (i % 2 === 0 ? -14 : 14) : 0;
        positioned.push({
          ...node,
          x: startX + i * spacing,
          y: baseY + offsetY,
        });
      });
    });

    return positioned;
  }, [filteredNodes]);

  const nodeMap = useMemo(() => {
    const map = new Map<string, NetworkNode & { x: number; y: number }>();
    layoutNodes.forEach((n) => map.set(n.id, n));
    return map;
  }, [layoutNodes]);

  const activeFocusId = selectedPlayerId || hoveredNodeId;

  const connectedLinks = useMemo(() => {
    if (!activeFocusId) return [];
    return filteredLinks.filter(
      (l) => l.source === activeFocusId || l.target === activeFocusId
    );
  }, [activeFocusId, filteredLinks]);

  const connectedPartnerIds = useMemo(() => {
    const set = new Set<string>();
    connectedLinks.forEach((l) => {
      set.add(l.source);
      set.add(l.target);
    });
    return set;
  }, [connectedLinks]);

  const getNodeColor = (position: string) => {
    switch (position) {
      case 'Forward':
        return '#f43f5e';
      case 'Midfielder':
        return '#f59e0b';
      case 'Defender':
        return '#38bdf8';
      case 'Goalkeeper':
        return '#10b981';
      default:
        return '#94a3b8';
    }
  };

  const inspectedPlayer = players.find(
    (p) => p.playerId === (selectedPlayerId || hoveredNodeId)
  );
  const hoveredNode = hoveredNodeId ? nodeMap.get(hoveredNodeId) : null;

  const handleZoomIn = () => setZoom((z) => Math.min(2.2, Number((z + 0.2).toFixed(2))));
  const handleZoomOut = () => setZoom((z) => Math.max(0.6, Number((z - 0.2).toFixed(2))));
  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setSelectedPlayerId(null);
  };

  const handleResetFilters = () => {
    setTeamFilter('All');
    setPositionFilter('All');
    setMinPassThreshold(10);
    setSelectedPlayerId(null);
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  if (!hasDataset) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Interaction Network"
          description="Weighted passing interaction graph constructed by the Java PlayerInteractionGraph engine."
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
        title="Interaction Network"
        description="Explore player-to-player pass synergy, weighted node degree, and squad connectivity derived from historical passing records."
        badge={
          <Badge variant="neutral" mono>
            {layoutNodes.length} Nodes • {filteredLinks.length} Edges
          </Badge>
        }
        actions={
          <>
            <Button
              variant="secondary"
              size="md"
              leftIcon={<RotateCcw className="w-4 h-4" />}
              onClick={handleResetView}
            >
              Reset View
            </Button>
            {inspectedPlayer && (
              <Button
                variant="primary"
                size="md"
                onClick={() => onSelectPlayer(inspectedPlayer)}
              >
                View Player
              </Button>
            )}
          </>
        }
      />

      {/* 2. CONTROLS BAR */}
      <Card className="p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <SegmentedControl
            label="Squad:"
            options={[
              { value: 'All', label: 'All Squads' },
              ...Array.from(
                new Set(network.nodes.map((n) => n.team).filter(Boolean))
              ).map((t) => ({ value: t, label: t })),
            ]}
            value={teamFilter}
            onChange={(val) => setTeamFilter(val as any)}
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
            className="w-44"
          />

          <SelectDropdown
            label="Focus Player:"
            value={selectedPlayerId || ''}
            onChange={(val) => setSelectedPlayerId(val || null)}
            options={[
              { value: '', label: 'None (Full Graph)' },
              ...players.map((p) => ({
                value: p.playerId,
                label: `#${p.squadNumber} ${p.name} (${p.position})`,
              })),
            ]}
            className="w-56"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Min Pass Weight Filter */}
          <div className="flex items-center gap-2.5 bg-[#0d1320] px-3 py-1.5 rounded-lg border border-slate-800 text-xs">
            <span className="text-slate-400 font-medium">Min Edge Weight:</span>
            <input
              type="range"
              min={1}
              max={60}
              value={minPassThreshold}
              onChange={(e) => setMinPassThreshold(Number(e.target.value))}
              className="w-24 accent-emerald-500 cursor-pointer"
              aria-label="Minimum interaction edge weight"
            />
            <span className="font-mono text-emerald-400 font-semibold tabular-nums w-8 text-right">
              {minPassThreshold}+
            </span>
          </div>

          {(teamFilter !== 'All' ||
            positionFilter !== 'All' ||
            minPassThreshold !== 10 ||
            selectedPlayerId !== null) && (
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
              onClick={handleResetFilters}
            >
              Reset Filters
            </Button>
          )}
        </div>
      </Card>

      {/* 3. MAIN CONTENT: GRAPH VIEWPORT + INFORMATION PANEL */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Graph Canvas Container */}
        <Card noPadding className="lg:col-span-3 flex flex-col justify-between overflow-hidden">
          {/* Canvas Top Toolbar */}
          <div className="px-4 py-3 border-b border-slate-800/90 bg-[#0d1320] flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span className="font-semibold text-slate-200">
                Player Interaction Graph
              </span>
              <span>•</span>
              <span className="font-mono text-[11px]">
                Zoom: {Math.round(zoom * 100)}%
              </span>
            </div>

            {/* Zoom & Reset Controls */}
            <div className="flex items-center gap-1.5">
              <Button
                variant="secondary"
                size="xs"
                onClick={handleZoomOut}
                aria-label="Zoom out"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="secondary"
                size="xs"
                onClick={handleZoomIn}
                aria-label="Zoom in"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="secondary"
                size="xs"
                leftIcon={<Maximize2 className="w-3 h-3" />}
                onClick={handleResetView}
              >
                Reset View
              </Button>
            </div>
          </div>

          {/* Interactive SVG Canvas */}
          <div
            className="w-full h-[520px] bg-[#090d16] relative overflow-hidden select-none cursor-grab active:cursor-grabbing"
            onMouseDown={(e) => {
              if ((e.target as HTMLElement).tagName === 'svg' || (e.target as HTMLElement).tagName === 'rect') {
                setIsDragging(true);
                setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
              }
            }}
            onMouseMove={(e) => {
              if (isDragging) {
                setPan({
                  x: e.clientX - dragStart.x,
                  y: e.clientY - dragStart.y,
                });
              }
            }}
            onMouseUp={() => setIsDragging(false)}
            onMouseLeave={() => {
              setIsDragging(false);
              setHoveredEdge(null);
            }}
          >
            {/* Hover Tooltip for Node */}
            {hoveredNode && (
              <div className="pointer-events-none absolute top-3 left-3 z-20 p-3 rounded-lg bg-[#111726]/95 border border-slate-700 shadow-saas-md text-xs space-y-1 min-w-[200px]">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-slate-100">
                    {hoveredNode.name}
                  </span>
                  <span className="font-mono text-emerald-400 font-semibold">
                    #{hoveredNode.squadNumber}
                  </span>
                </div>
                <div className="text-slate-400">
                  {hoveredNode.position} • {hoveredNode.team}
                </div>
                <div className="pt-1.5 border-t border-slate-800 grid grid-cols-3 gap-2 font-mono text-[11px]">
                  <div>
                    <span className="text-slate-500 block">Rank</span>
                    <span className="text-slate-200 font-semibold">#{hoveredNode.rank}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Score</span>
                    <span className="text-emerald-400 font-semibold">{hoveredNode.score.toFixed(1)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Passes</span>
                    <span className="text-slate-200 font-semibold">{hoveredNode.totalInteractions}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Hover Tooltip for Edge */}
            {hoveredEdge && !hoveredNode && (
              <div className="pointer-events-none absolute top-3 left-3 z-20 p-2.5 rounded-lg bg-[#111726]/95 border border-slate-700 shadow-saas-md text-xs">
                <div className="font-semibold text-slate-100">
                  {hoveredEdge.sourceName} ↔ {hoveredEdge.targetName}
                </div>
                <div className="text-slate-400 font-mono text-[11px] mt-0.5">
                  Weight: <span className="text-emerald-400 font-bold">{hoveredEdge.weight}</span> passes ({hoveredEdge.successful} completed)
                </div>
              </div>
            )}

            <svg viewBox="0 0 820 540" className="w-full h-full">
              <g
                transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}
                style={{ transformOrigin: '410px 270px', transition: isDragging ? 'none' : 'transform 120ms ease-out' }}
              >
                {/* Pitch Zone Guides */}
                <rect
                  x="36"
                  y="24"
                  width="748"
                  height="492"
                  rx="12"
                  fill="none"
                  stroke="#1e293b"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
                <line
                  x1="36"
                  y1="270"
                  x2="784"
                  y2="270"
                  stroke="#1e293b"
                  strokeWidth="1"
                />
                <circle
                  cx="410"
                  cy="270"
                  r="52"
                  fill="none"
                  stroke="#1e293b"
                  strokeWidth="1"
                />

                {/* Tactical Role Band Labels */}
                <text x="52" y="90" fill="#475569" fontSize="10" fontWeight="600" letterSpacing="0.06em">
                  FORWARDS
                </text>
                <text x="52" y="220" fill="#475569" fontSize="10" fontWeight="600" letterSpacing="0.06em">
                  MIDFIELDERS
                </text>
                <text x="52" y="360" fill="#475569" fontSize="10" fontWeight="600" letterSpacing="0.06em">
                  DEFENDERS
                </text>
                <text x="52" y="470" fill="#475569" fontSize="10" fontWeight="600" letterSpacing="0.06em">
                  GOALKEEPERS
                </text>

                {/* Weighted Edges */}
                <g>
                  {filteredLinks.map((link, idx) => {
                    const source = nodeMap.get(link.source);
                    const target = nodeMap.get(link.target);
                    if (!source || !target) return null;

                    const isConnected =
                      activeFocusId &&
                      (link.source === activeFocusId || link.target === activeFocusId);
                    const isDimmed = activeFocusId && !isConnected;

                    // Thicker edge = More interactions
                    const strokeWidth = Math.max(1.25, Math.min(7.5, link.weight / 14));

                    return (
                      <g key={`${link.source}-${link.target}-${idx}`}>
                        <line
                          x1={source.x}
                          y1={source.y}
                          x2={target.x}
                          y2={target.y}
                          stroke={isConnected ? '#10b981' : '#334155'}
                          strokeWidth={strokeWidth}
                          strokeOpacity={
                            isDimmed ? 0.08 : isConnected ? 0.92 : 0.42
                          }
                          strokeLinecap="round"
                          className="transition-opacity duration-150 cursor-pointer"
                          onMouseEnter={() =>
                            setHoveredEdge({
                              sourceName: source.name,
                              targetName: target.name,
                              weight: link.weight,
                              successful: link.successful,
                              x: (source.x + target.x) / 2,
                              y: (source.y + target.y) / 2,
                            })
                          }
                          onMouseLeave={() => setHoveredEdge(null)}
                        />
                        {isConnected && (
                          <g
                            transform={`translate(${(source.x + target.x) / 2}, ${
                              (source.y + target.y) / 2
                            })`}
                          >
                            <rect
                              x="-13"
                              y="-8"
                              width="26"
                              height="16"
                              rx="4"
                              fill="#0d1320"
                              stroke="#10b981"
                              strokeWidth="1"
                            />
                            <text
                              y="3.5"
                              fill="#34d399"
                              fontSize="9"
                              fontWeight="700"
                              textAnchor="middle"
                              fontFamily="JetBrains Mono, monospace"
                            >
                              {link.weight}
                            </text>
                          </g>
                        )}
                      </g>
                    );
                  })}
                </g>

                {/* Player Nodes */}
                <g>
                  {layoutNodes.map((node) => {
                    const isSelected = selectedPlayerId === node.id;
                    const isHovered = hoveredNodeId === node.id;
                    const isFocused = isSelected || isHovered;
                    const isPartner = activeFocusId
                      ? connectedPartnerIds.has(node.id)
                      : false;
                    const isDimmed = activeFocusId && !isFocused && !isPartner;

                    const radius = Math.max(
                      13,
                      Math.min(22, 10 + node.weightedInvolvement / 48)
                    );
                    const color = getNodeColor(node.position);

                    return (
                      <g
                        key={node.id}
                        transform={`translate(${node.x}, ${node.y})`}
                        onClick={() =>
                          setSelectedPlayerId(
                            node.id === selectedPlayerId ? null : node.id
                          )
                        }
                        onMouseEnter={() => setHoveredNodeId(node.id)}
                        onMouseLeave={() => setHoveredNodeId(null)}
                        className="cursor-pointer transition-opacity duration-150"
                        opacity={isDimmed ? 0.22 : 1}
                      >
                        {isFocused && (
                          <circle
                            r={radius + 6}
                            fill="none"
                            stroke={isSelected ? '#10b981' : '#f8fafc'}
                            strokeWidth="2"
                          />
                        )}

                        <circle
                          r={radius}
                          fill="#111726"
                          stroke={color}
                          strokeWidth={isFocused ? 3.5 : 2.5}
                        />

                        <text
                          textAnchor="middle"
                          dy="3.5"
                          fill="#f8fafc"
                          fontSize="10"
                          fontWeight="700"
                          fontFamily="JetBrains Mono, monospace"
                        >
                          #{node.squadNumber}
                        </text>

                        <text
                          textAnchor="middle"
                          y={radius + 13}
                          fill={isFocused ? '#f8fafc' : '#94a3b8'}
                          fontSize="10"
                          fontWeight={isFocused ? '700' : '500'}
                        >
                          {node.name.split(' ')[0]}
                        </text>
                      </g>
                    );
                  })}
                </g>
              </g>
            </svg>
          </div>

          {/* 4. LEGEND BAR (Required Legend Specification) */}
          <div className="px-5 py-3.5 bg-[#0d1320] border-t border-slate-800/90 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex flex-wrap items-center gap-4 text-slate-300 font-medium">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full border-2 border-emerald-400 bg-[#111726]" />
                <span>Node = Player</span>
              </span>
              <span className="text-slate-600">•</span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-4 h-0.5 bg-slate-400 inline-block" />
                <span>Edge = Interaction</span>
              </span>
              <span className="text-slate-600">•</span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-4 h-1.5 bg-emerald-400 rounded-xs inline-block" />
                <span>Thicker edge = More interactions</span>
              </span>
            </div>

            <div className="flex items-center gap-3 text-[11px] text-slate-400">
              <span className="inline-flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-500" /> FWD
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500" /> MID
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-sky-400" /> DEF
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> GK
              </span>
            </div>
          </div>
        </Card>

        {/* COMPACT INFORMATION PANEL */}
        <div className="space-y-4">
          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/90 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-100">
                  Selected Player Node
                </h3>
                <p className="text-[11px] text-slate-400">
                  Graph centrality & connections
                </p>
              </div>
              {selectedPlayerId && (
                <button
                  type="button"
                  onClick={() => setSelectedPlayerId(null)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Clear
                </button>
              )}
            </div>

            {inspectedPlayer ? (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-base font-bold text-slate-100 truncate">
                      {inspectedPlayer.name}
                    </h4>
                    <RankBadge rank={inspectedPlayer.rank} size="sm" />
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <PositionBadge position={inspectedPlayer.position} />
                    <span className="text-xs text-slate-400">
                      {inspectedPlayer.academyTeam} • #{inspectedPlayer.squadNumber}
                    </span>
                  </div>
                </div>

                {/* Required 3 Graph Metrics: Interaction count, Connected teammates, Weighted degree */}
                <div className="rounded-lg bg-[#0d1320] border border-slate-800/90 divide-y divide-slate-800/80 text-xs">
                  <div className="px-3.5 py-2.5 flex items-center justify-between">
                    <span className="text-slate-400">Interaction count</span>
                    <span className="font-mono font-bold text-slate-100 tabular-nums">
                      {inspectedPlayer.totalInteractions.toLocaleString()}
                    </span>
                  </div>
                  <div className="px-3.5 py-2.5 flex items-center justify-between">
                    <span className="text-slate-400">Connected teammates</span>
                    <span className="font-mono font-bold text-slate-100 tabular-nums">
                      {inspectedPlayer.connectedTeammates}
                    </span>
                  </div>
                  <div className="px-3.5 py-2.5 flex items-center justify-between">
                    <span className="text-slate-400">Weighted degree</span>
                    <span className="font-mono font-bold text-emerald-400 tabular-nums">
                      {inspectedPlayer.weightedInvolvement.toFixed(1)}
                    </span>
                  </div>
                </div>

                {/* Connected Teammates List */}
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Connected Teammates ({connectedLinks.length})
                  </div>
                  <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                    {connectedLinks
                      .sort((a, b) => b.weight - a.weight)
                      .map((link, i) => {
                        const partnerId =
                          link.source === inspectedPlayer.playerId
                            ? link.target
                            : link.source;
                        const partner = players.find(
                          (p) => p.playerId === partnerId
                        );
                        return (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setSelectedPlayerId(partnerId)}
                            className="w-full p-2 rounded-lg bg-[#0d1320] hover:bg-slate-800/70 border border-slate-800/80 flex items-center justify-between text-xs transition-colors text-left"
                          >
                            <div className="truncate pr-2">
                              <span className="font-medium text-slate-200">
                                {partner?.name || partnerId}
                              </span>
                              <span className="text-[10px] text-slate-500 block">
                                {partner?.position} #{partner?.squadNumber}
                              </span>
                            </div>
                            <span className="font-mono font-semibold text-emerald-400 shrink-0 tabular-nums">
                              {link.weight} passes
                            </span>
                          </button>
                        );
                      })}
                  </div>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  className="w-full"
                  onClick={() => onSelectPlayer(inspectedPlayer)}
                >
                  View Player
                </Button>
              </div>
            ) : (
              <div className="py-10 text-center space-y-2">
                <div className="w-10 h-10 rounded-lg bg-slate-800/80 border border-slate-700/80 flex items-center justify-center text-slate-400 mx-auto">
                  <Users className="w-5 h-5" />
                </div>
                <div className="text-xs font-semibold text-slate-200">
                  No player selected
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Click any player node in the network or use the Focus Player dropdown to inspect interaction count, connected teammates, and weighted degree.
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};
