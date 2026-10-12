import React, { useState, useRef, useMemo } from 'react';
import {
  Database,
  Upload,
  CheckCircle2,
  Play,
  Download,
  Trash2,
  FileSpreadsheet,
  ArrowRight,
  Trophy,
  RotateCcw,
  Plus,
  Cpu,
  Layers,
  Terminal
} from 'lucide-react';
import { MasterData, MatchOverview } from '../types/athletix';
import {
  appendMatchRecordToMasterData,
  parseAndBuildUploadedDataset,
} from '../utils/batchAnalysisEngine';
import {
  Button,
  Card,
  KpiCard,
  Badge,
  FormField,
  Alert,
  EmptyState,
  PageHeader,
} from './ui/DesignSystem';

interface DataManagementTabProps {
  data: MasterData;
  hasDataset: boolean;
  isAnalyzing: boolean;
  analysisStage: 'idle' | 'java-prep' | 'python-reg' | 'java-rank' | 'complete';
  onRunAnalysis: () => void;
  onUpdateData: (newData: MasterData) => void;
  onDeleteDataset: () => void;
  onRestoreDefaultDataset: () => void;
  onExportResults: () => void;
  onNavigateToTab: (tab: string) => void;
}

export const DataManagementTab: React.FC<DataManagementTabProps> = ({
  data,
  hasDataset,
  isAnalyzing,
  analysisStage,
  onRunAnalysis,
  onUpdateData,
  onDeleteDataset,
  onRestoreDefaultDataset,
  onExportResults,
  onNavigateToTab,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  // Match Record Addition State
  const [matchId, setMatchId] = useState(
    `M${String(data.matches.length + 1).padStart(2, '0')}`
  );
  const [matchDate, setMatchDate] = useState('2026-03-07');
  const [team, setTeam] = useState('Vertex Alpha');
  const [opponent, setOpponent] = useState('');
  const [venue, setVenue] = useState('Home');
  const [goalsFor, setGoalsFor] = useState('2');
  const [goalsAgainst, setGoalsAgainst] = useState('1');
  const [result, setResult] = useState('WIN');

  // Validation Metrics State
  const [validationReport, setValidationReport] = useState<{
    validRecords: number;
    missingFields: number;
    invalidValues: number;
    duplicateRecords: number;
    messages: string[];
  } | null>(null);

  const [datasetError, setDatasetError] = useState<string | null>(null);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);

  const availableSquads = useMemo(() => {
    const set = new Set<string>(['Vertex Alpha', 'Vertex Beta']);
    data.players.forEach((p) => {
      if (p.academyTeam) set.add(p.academyTeam);
    });
    return Array.from(set);
  }, [data.players]);

  // Calculate total dataset records from actual loaded data
  const totalRecordsCount = useMemo(() => {
    if (!hasDataset) return 0;
    const matchPerfCount = Object.values(data.playerMatchLogs).reduce(
      (acc, logs) => acc + logs.length,
      0
    );
    return (
      data.players.length +
      data.matches.length +
      matchPerfCount +
      data.network.links.length
    );
  }, [data, hasDataset]);

  // Default validation counts derived from current dataset or last validation check
  const activeValidation = validationReport || {
    validRecords: hasDataset ? totalRecordsCount : 0,
    missingFields: 0,
    invalidValues: 0,
    duplicateRecords: 0,
    messages: [],
  };

  // Handle file upload (JSON or CSV)
  const processUploadedFile = (file: File) => {
    setDatasetError(null);
    setStatusBanner(null);

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'json' && ext !== 'csv') {
      setDatasetError(
        'Check the dataset format and required fields, then try again. Supported formats: .csv, .json'
      );
      setValidationReport({
        validRecords: 0,
        missingFields: 1,
        invalidValues: 1,
        duplicateRecords: 0,
        messages: [`Unsupported file format ".${ext}".`],
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = String(event.target?.result || '');
        if (!content.trim()) {
          throw new Error('Empty dataset file');
        }

        const parsedResult = parseAndBuildUploadedDataset(
          content,
          file.name,
          data
        );

        onUpdateData(parsedResult.updatedData);
        setUploadedFileName(file.name);
        setMatchId(
          `M${String(parsedResult.updatedData.matches.length + 1).padStart(
            2,
            '0'
          )}`
        );
        setValidationReport(parsedResult.validation);
        setStatusBanner(parsedResult.summaryMessage);
      } catch {
        setDatasetError(
          'Check the dataset format and required fields, then try again.'
        );
        setValidationReport({
          validRecords: 0,
          missingFields: 2,
          invalidValues: 1,
          duplicateRecords: 0,
          messages: ['Dataset structure or required fields could not be parsed.'],
        });
      }
    };
    reader.readAsText(file);
  };

  // Validate & Ingest Historical Match Form
  const handleValidateAndIngestMatch = (e: React.FormEvent) => {
    e.preventDefault();
    setDatasetError(null);
    setStatusBanner(null);

    let missing = 0;
    let invalid = 0;
    let duplicates = 0;
    const msgs: string[] = [];

    if (!matchId.trim()) {
      missing++;
      msgs.push('Missing Match ID.');
    }
    if (!opponent.trim()) {
      missing++;
      msgs.push('Missing Opponent squad name.');
    }
    if (
      data.matches.some(
        (m) => m.matchId.toLowerCase() === matchId.trim().toLowerCase()
      )
    ) {
      duplicates++;
      msgs.push(`Duplicate Match ID "${matchId}" already exists in dataset.`);
    }

    const gf = parseInt(goalsFor, 10);
    const ga = parseInt(goalsAgainst, 10);

    if (isNaN(gf) || gf < 0 || isNaN(ga) || ga < 0) {
      invalid++;
      msgs.push('Goals For and Goals Against must be non-negative integers.');
    } else {
      if (gf > ga && result !== 'WIN') {
        invalid++;
        msgs.push('Scoreline indicates a WIN, but Result is not set to WIN.');
      }
      if (gf < ga && result !== 'LOSS') {
        invalid++;
        msgs.push('Scoreline indicates a LOSS, but Result is not set to LOSS.');
      }
      if (gf === ga && result !== 'DRAW') {
        invalid++;
        msgs.push('Scoreline is level, but Result is not set to DRAW.');
      }
    }

    if (missing > 0 || invalid > 0 || duplicates > 0) {
      setValidationReport({
        validRecords: totalRecordsCount,
        missingFields: missing,
        invalidValues: invalid,
        duplicateRecords: duplicates,
        messages: msgs,
      });
      setDatasetError(
        'Check the dataset format and required fields, then try again.'
      );
      return;
    }

    const newMatch: MatchOverview = {
      matchId: matchId.trim(),
      date: matchDate,
      team,
      opponent: opponent.trim(),
      venue,
      goalsFor: gf,
      goalsAgainst: ga,
      result,
    };

    const updatedMasterData = appendMatchRecordToMasterData(data, newMatch);

    onUpdateData(updatedMasterData);
    setValidationReport({
      validRecords: totalRecordsCount + 1,
      missingFields: 0,
      invalidValues: 0,
      duplicateRecords: 0,
      messages: [],
    });
    setOpponent('');
    setMatchId(
      `M${String(updatedMasterData.matches.length + 1).padStart(2, '0')}`
    );
    setStatusBanner(
      `Fixture ${newMatch.matchId} vs ${newMatch.opponent} validated, appended, and ranked. Top #1: ${updatedMasterData.summary.topPlayer.name} (${updatedMasterData.summary.topPlayer.performanceScore.toFixed(
        2
      )}).`
    );
  };

  const workflowSteps = [
    { num: '01', name: 'Dataset', desc: 'Historical CSV / JSON records', done: hasDataset },
    {
      num: '02',
      name: 'Validation',
      desc: 'Schema & field integrity checks',
      done: hasDataset && !datasetError,
    },
    {
      num: '03',
      name: 'Processing',
      desc: 'Java OOP → Python ML → Heap',
      done: hasDataset && !isAnalyzing,
    },
    {
      num: '04',
      name: 'Results',
      desc: 'Deterministic Top-K rankings',
      done: hasDataset && !isAnalyzing,
    },
  ];

  return (
    <div className="space-y-6">
      {/* 1. PAGE HEADER */}
      <PageHeader
        title="Data Management & Batch Pipeline"
        description="Manage historical match datasets, verify record integrity, and execute the offline Java and Python batch analysis pipeline."
        badge={
          <Badge variant="brand" mono>
            Batch Processing Only
          </Badge>
        }
        actions={
          hasDataset ? (
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
                loadingText="Running Batch..."
                leftIcon={<Play className="w-4 h-4" />}
                onClick={onRunAnalysis}
              >
                Run Analysis
              </Button>
            </>
          ) : (
            <Button
              variant="primary"
              size="md"
              leftIcon={<Upload className="w-4 h-4" />}
              onClick={onRestoreDefaultDataset}
            >
              Upload Dataset
            </Button>
          )
        }
      />

      {/* WORKFLOW STEPPER: Dataset → Validation → Processing → Results */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {workflowSteps.map((step, index) => (
            <div
              key={step.name}
              className="flex items-center justify-between p-3 rounded-lg bg-[#0d1320] border border-slate-800/90"
            >
              <div className="flex items-center gap-3">
                <span
                  className={`w-7 h-7 rounded-md font-mono text-xs font-bold flex items-center justify-center border ${
                    step.done
                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {step.num}
                </span>
                <div>
                  <div className="text-xs font-bold text-slate-100">
                    {step.name}
                  </div>
                  <div className="text-[11px] text-slate-400">{step.desc}</div>
                </div>
              </div>
              {index < workflowSteps.length - 1 && (
                <ArrowRight className="w-4 h-4 text-slate-600 hidden lg:block" />
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* ERROR / STATUS ALERTS */}
      {datasetError && (
        <Alert
          variant="error"
          title="Unable to process dataset"
          description={datasetError}
          action={
            <Button
              variant="secondary"
              size="xs"
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
              onClick={() => {
                setDatasetError(null);
                setValidationReport(null);
              }}
            >
              Try Again
            </Button>
          }
        />
      )}

      {statusBanner && !datasetError && (
        <Alert
          variant="success"
          title="Dataset & Pipeline Updated"
          description={statusBanner}
          onDismiss={() => setStatusBanner(null)}
        />
      )}

      {/* SECTION 1: DATASET SECTION */}
      <section aria-label="Dataset Overview" className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-100">
              1. Dataset Overview
            </h2>
            <p className="text-xs text-slate-400">
              Summary of the currently loaded historical match and player dataset.
            </p>
          </div>
        </div>

        {hasDataset ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              label="Current Dataset"
              value={uploadedFileName || data.meta.dataset}
              accentColor="emerald"
              icon={<Database className="w-4 h-4" />}
              contextText={
                <>
                  <span>Last processed</span>
                  <span className="font-mono text-[11px] text-slate-300">
                    {data.meta.batchProcessedAt.split(' ')[0]}
                  </span>
                </>
              }
            />
            <KpiCard
              label="Number of Records"
              value={totalRecordsCount.toLocaleString()}
              subValue="Rows"
              accentColor="blue"
              icon={<FileSpreadsheet className="w-4 h-4" />}
              contextText={
                <>
                  <span>Players, fixtures & edges</span>
                  <span className="font-mono text-emerald-400">Verified</span>
                </>
              }
            />
            <KpiCard
              label="Number of Players"
              value={data.players.length}
              subValue="Athletes"
              accentColor="slate"
              contextText={
                <>
                  <span>Vertex Alpha & Vertex Beta</span>
                  <span className="font-mono text-slate-300">2 Squads</span>
                </>
              }
            />
            <KpiCard
              label="Number of Matches"
              value={data.matches.length}
              subValue="Fixtures"
              accentColor="amber"
              contextText={
                <>
                  <span>Historical match logs</span>
                  <span className="font-mono text-slate-300">Complete</span>
                </>
              }
            />
          </div>
        ) : (
          <EmptyState
            icon={<Database className="w-5 h-5" />}
            title="No dataset available"
            description="Upload a historical match dataset to begin analysis."
            action={
              <Button
                variant="primary"
                leftIcon={<Upload className="w-4 h-4" />}
                onClick={onRestoreDefaultDataset}
              >
                Upload Dataset
              </Button>
            }
          />
        )}
      </section>

      {/* SECTION 2: UPLOAD & INGESTION SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* File Upload Dropzone */}
        <Card className="p-5 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-100">
                2. Upload Dataset
              </h3>
              <Badge variant="neutral" mono>
                .CSV / .JSON
              </Badge>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Select or drag and drop a historical match dataset file to validate and stage for batch processing.
            </p>
          </div>

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDraggingOver(true);
            }}
            onDragLeave={() => setIsDraggingOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDraggingOver(false);
              const file = e.dataTransfer.files?.[0];
              if (file) processUploadedFile(file);
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer flex flex-col items-center justify-center ${
              isDraggingOver
                ? 'border-emerald-500 bg-emerald-500/5'
                : 'border-slate-800 hover:border-slate-700 bg-[#0d1320]/60'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) processUploadedFile(file);
              }}
            />
            <div className="w-11 h-11 rounded-xl bg-slate-800/90 border border-slate-700 flex items-center justify-center text-emerald-400 mb-3">
              <Upload className="w-5 h-5" />
            </div>
            <p className="text-sm font-semibold text-slate-200">
              Drag and drop dataset file here, or click to browse
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Supports <code className="font-mono text-slate-300">matches.csv</code>,{' '}
              <code className="font-mono text-slate-300">players.csv</code>, or{' '}
              <code className="font-mono text-slate-300">athletix_master_data.json</code>
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <Button
              variant="primary"
              size="md"
              leftIcon={<Upload className="w-4 h-4" />}
              onClick={() => fileInputRef.current?.click()}
            >
              Upload Dataset
            </Button>

            {!hasDataset && (
              <Button
                variant="secondary"
                size="md"
                onClick={onRestoreDefaultDataset}
              >
                Load Default Academy Dataset
              </Button>
            )}
          </div>
        </Card>

        {/* Append Historical Fixture Form */}
        <Card className="p-5 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-100">
                Append Historical Match Record
              </h3>
              <Badge variant="neutral">Batch Staging</Badge>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Add a completed match record to the dataset and validate field constraints before running analysis.
            </p>
          </div>

          <form onSubmit={handleValidateAndIngestMatch} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <FormField label="Match ID">
                <input
                  type="text"
                  value={matchId}
                  onChange={(e) => setMatchId(e.target.value)}
                  className="saas-input w-full px-3 py-1.5 h-9 text-sm font-mono"
                  placeholder="M16"
                />
              </FormField>

              <FormField label="Match Date">
                <input
                  type="date"
                  value={matchDate}
                  onChange={(e) => setMatchDate(e.target.value)}
                  className="saas-input w-full px-3 py-1.5 h-9 text-sm font-mono"
                />
              </FormField>

              <FormField label="Squad">
                <select
                  value={team}
                  onChange={(e) => setTeam(e.target.value)}
                  className="saas-input w-full px-3 py-1.5 h-9 text-sm bg-[#0d1320]"
                >
                  {availableSquads.map((sq) => (
                    <option key={sq} value={sq}>
                      {sq}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField label="Opponent Team">
                <input
                  type="text"
                  value={opponent}
                  onChange={(e) => setOpponent(e.target.value)}
                  className="saas-input w-full px-3 py-1.5 h-9 text-sm"
                  placeholder="e.g. Northstar Academy"
                />
              </FormField>

              <FormField label="Venue">
                <select
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  className="saas-input w-full px-3 py-1.5 h-9 text-sm bg-[#0d1320]"
                >
                  <option value="Home">Home</option>
                  <option value="Away">Away</option>
                  <option value="Neutral">Neutral</option>
                </select>
              </FormField>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <FormField label="Goals For">
                <input
                  type="number"
                  min={0}
                  max={20}
                  value={goalsFor}
                  onChange={(e) => setGoalsFor(e.target.value)}
                  className="saas-input w-full px-3 py-1.5 h-9 text-sm font-mono"
                />
              </FormField>

              <FormField label="Goals Against">
                <input
                  type="number"
                  min={0}
                  max={20}
                  value={goalsAgainst}
                  onChange={(e) => setGoalsAgainst(e.target.value)}
                  className="saas-input w-full px-3 py-1.5 h-9 text-sm font-mono"
                />
              </FormField>

              <FormField label="Result">
                <select
                  value={result}
                  onChange={(e) => setResult(e.target.value)}
                  className="saas-input w-full px-3 py-1.5 h-9 text-sm font-semibold bg-[#0d1320]"
                >
                  <option value="WIN">WIN</option>
                  <option value="DRAW">DRAW</option>
                  <option value="LOSS">LOSS</option>
                </select>
              </FormField>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={!hasDataset || isAnalyzing}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Validate & Add Record
              </Button>
            </div>
          </form>
        </Card>
      </div>

      {/* SECTION 3: VALIDATION SECTION */}
      <Card className="p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/90 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-100">
              3. Data Validation Summary
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Automated schema verification checking for missing fields, invalid values, and duplicate primary keys.
            </p>
          </div>
          <Badge
            variant={
              activeValidation.missingFields === 0 &&
              activeValidation.invalidValues === 0 &&
              activeValidation.duplicateRecords === 0
                ? 'success'
                : 'warning'
            }
          >
            {activeValidation.missingFields === 0 &&
            activeValidation.invalidValues === 0 &&
            activeValidation.duplicateRecords === 0
              ? 'All Checks Passed'
              : 'Validation Attention Required'}
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg bg-[#0d1320] border border-slate-800/90 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 block">Valid records</span>
              <span className="text-xl font-mono font-bold text-slate-100 tabular-nums mt-1 block">
                {activeValidation.validRecords.toLocaleString()}
              </span>
            </div>
            <Badge variant="success">Valid</Badge>
          </div>

          <div className="p-4 rounded-lg bg-[#0d1320] border border-slate-800/90 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 block">Missing fields</span>
              <span className="text-xl font-mono font-bold text-slate-100 tabular-nums mt-1 block">
                {activeValidation.missingFields}
              </span>
            </div>
            <Badge
              variant={activeValidation.missingFields === 0 ? 'success' : 'warning'}
            >
              {activeValidation.missingFields === 0 ? 'None' : 'Warning'}
            </Badge>
          </div>

          <div className="p-4 rounded-lg bg-[#0d1320] border border-slate-800/90 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 block">Invalid values</span>
              <span className="text-xl font-mono font-bold text-slate-100 tabular-nums mt-1 block">
                {activeValidation.invalidValues}
              </span>
            </div>
            <Badge
              variant={activeValidation.invalidValues === 0 ? 'success' : 'error'}
            >
              {activeValidation.invalidValues === 0 ? 'Clean' : 'Error'}
            </Badge>
          </div>

          <div className="p-4 rounded-lg bg-[#0d1320] border border-slate-800/90 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 block">Duplicate records</span>
              <span className="text-xl font-mono font-bold text-slate-100 tabular-nums mt-1 block">
                {activeValidation.duplicateRecords}
              </span>
            </div>
            <Badge
              variant={
                activeValidation.duplicateRecords === 0 ? 'success' : 'warning'
              }
            >
              {activeValidation.duplicateRecords === 0 ? 'Unique' : 'Duplicate'}
            </Badge>
          </div>
        </div>
      </Card>

      {/* SECTION 4: PROCESSING SECTION (Java Processing → Python Regression → Java Ranking) */}
      <Card className="p-5 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800/90 pb-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="text-base font-bold text-slate-100">
                4. Batch Processing Pipeline
              </h3>
              <Badge variant="brand" mono>
                Offline Batch Execution
              </Badge>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              This is a <strong>batch processing system, not real-time processing</strong>. Executing the analysis runs the three-stage pipeline across the full historical dataset.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Button
              variant="secondary"
              size="md"
              leftIcon={<Trophy className="w-4 h-4" />}
              onClick={() => onNavigateToTab('rankings')}
              disabled={!hasDataset || isAnalyzing}
            >
              View Rankings
            </Button>
            <Button
              variant="primary"
              size="md"
              isLoading={isAnalyzing}
              loadingText="Running Pipeline..."
              leftIcon={<Play className="w-4 h-4" />}
              onClick={onRunAnalysis}
              disabled={!hasDataset}
            >
              Run Analysis
            </Button>
          </div>
        </div>

        {/* Visual 3-Stage Pipeline Architecture */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Stage 1: Java Processing */}
          <div
            className={`p-4 rounded-xl border transition-all ${
              analysisStage === 'java-prep'
                ? 'bg-emerald-950/25 border-emerald-500/60'
                : 'bg-[#0d1320] border-slate-800/90'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono font-semibold text-emerald-400">
                STAGE 1
              </span>
              <Cpu className="w-4 h-4 text-slate-400" />
            </div>
            <h4 className="text-sm font-bold text-slate-100">Java Processing</h4>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Parses raw match CSVs, aggregates player statistics, and builds the weighted{' '}
              <code className="font-mono text-slate-300">PlayerInteractionGraph</code>.
            </p>
          </div>

          {/* Stage 2: Python Regression */}
          <div
            className={`p-4 rounded-xl border transition-all ${
              analysisStage === 'python-reg'
                ? 'bg-emerald-950/25 border-emerald-500/60'
                : 'bg-[#0d1320] border-slate-800/90'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono font-semibold text-blue-400">
                STAGE 2
              </span>
              <Layers className="w-4 h-4 text-slate-400" />
            </div>
            <h4 className="text-sm font-bold text-slate-100">
              Python Regression
            </h4>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Trains the Scikit-Learn Ridge Regression model on aggregated features to compute normalized AI Performance Scores.
            </p>
          </div>

          {/* Stage 3: Java Ranking */}
          <div
            className={`p-4 rounded-xl border transition-all ${
              analysisStage === 'java-rank'
                ? 'bg-emerald-950/25 border-emerald-500/60'
                : 'bg-[#0d1320] border-slate-800/90'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono font-semibold text-amber-400">
                STAGE 3
              </span>
              <Trophy className="w-4 h-4 text-slate-400" />
            </div>
            <h4 className="text-sm font-bold text-slate-100">Java Ranking</h4>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Inserts scored players into the Java <code className="font-mono text-slate-300">TopKHeapRanker</code> PriorityQueue to extract Top-3, Top-5, and Top-10 leaders.
            </p>
          </div>
        </div>

        {/* Progress Bar when Running */}
        {isAnalyzing && (
          <div className="p-4 rounded-lg bg-[#0d1320] border border-emerald-500/30 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-emerald-400">
                {analysisStage === 'java-prep' &&
                  'Executing Stage 1: Java CSV Ingestion & Graph Construction...'}
                {analysisStage === 'python-reg' &&
                  'Executing Stage 2: Python Scikit-Learn Ridge Regression Scoring...'}
                {analysisStage === 'java-rank' &&
                  'Executing Stage 3: Java PriorityQueue Top-K Heap Extraction...'}
              </span>
              <span className="font-mono text-slate-300">
                {analysisStage === 'java-prep'
                  ? '33%'
                  : analysisStage === 'python-reg'
                  ? '68%'
                  : '95%'}
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all duration-300"
                style={{
                  width:
                    analysisStage === 'java-prep'
                      ? '33%'
                      : analysisStage === 'python-reg'
                      ? '68%'
                      : '95%',
                }}
              />
            </div>
          </div>
        )}

        {/* CLI Reference Footer */}
        <div className="p-3.5 rounded-lg bg-[#090d16] border border-slate-800/90 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono text-slate-400">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>CLI Batch Script: .\pipeline\run_pipeline.bat</span>
          </div>
          <span className="text-[11px] text-slate-500">
            Last Batch Run: {data.meta.batchProcessedAt}
          </span>
        </div>
      </Card>

      {/* HISTORICAL FIXTURES TABLE */}
      {hasDataset && (
        <Card noPadding className="overflow-hidden">
          <div className="p-5 border-b border-slate-800/90 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-100">
                Historical Fixture Records ({data.matches.length})
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Complete list of matches included in the current batch evaluation.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800/90 bg-[#0d1320] text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-5">Match ID</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Squad</th>
                  <th className="py-3 px-4">Opponent</th>
                  <th className="py-3 px-4">Venue</th>
                  <th className="py-3 px-4 text-center">Score</th>
                  <th className="py-3 px-5 text-right">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 text-sm">
                {data.matches.map((m) => (
                  <tr
                    key={m.matchId}
                    className="hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="py-3 px-5 font-mono font-semibold text-emerald-400">
                      {m.matchId}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-slate-300">
                      {m.date}
                    </td>
                    <td className="py-3 px-4 text-slate-200 font-medium">
                      {m.team}
                    </td>
                    <td className="py-3 px-4 text-slate-100 font-medium">
                      {m.opponent}
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-xs">
                      {m.venue}
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-slate-100 tabular-nums">
                      {m.goalsFor} – {m.goalsAgainst}
                    </td>
                    <td className="py-3 px-5 text-right">
                      <Badge
                        variant={
                          m.result === 'WIN'
                            ? 'success'
                            : m.result === 'DRAW'
                            ? 'warning'
                            : 'error'
                        }
                      >
                        {m.result}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};
