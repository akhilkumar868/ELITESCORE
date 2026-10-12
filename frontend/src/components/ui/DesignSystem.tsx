import React from 'react';
import {
  Search,
  X,
  ChevronDown,
  Loader2,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Info,
  Inbox
} from 'lucide-react';

// ============================================================================
// 1. BUTTON SYSTEM
// ============================================================================

export type ButtonVariant = 'primary' | 'secondary' | 'destructive' | 'outline' | 'ghost';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  loadingText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'secondary',
  size = 'md',
  isLoading = false,
  loadingText,
  leftIcon,
  rightIcon,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-[#090d16] disabled:opacity-50 disabled:pointer-events-none select-none whitespace-nowrap';

  const variantClasses: Record<ButtonVariant, string> = {
    primary:
      'bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white border border-emerald-500/80 shadow-saas-sm focus:ring-emerald-500/50',
    secondary:
      'bg-[#161f33] hover:bg-[#1e2942] active:bg-[#111726] text-slate-200 border border-slate-700/80 hover:border-slate-600 shadow-saas-sm focus:ring-slate-500/40',
    outline:
      'bg-transparent hover:bg-slate-800/60 text-slate-300 hover:text-white border border-slate-700/80 hover:border-slate-600 focus:ring-slate-500/40',
    destructive:
      'bg-rose-600/15 hover:bg-rose-600/25 active:bg-rose-600/30 text-rose-300 hover:text-rose-200 border border-rose-500/30 hover:border-rose-500/50 focus:ring-rose-500/40',
    ghost:
      'bg-transparent hover:bg-slate-800/60 text-slate-400 hover:text-slate-100 border border-transparent focus:ring-slate-500/30',
  };

  const sizeClasses: Record<ButtonSize, string> = {
    xs: 'text-xs px-2.5 py-1 gap-1.5 h-7',
    sm: 'text-xs px-3 py-1.5 gap-1.5 h-8',
    md: 'text-sm px-4 py-2 gap-2 h-9',
    lg: 'text-sm px-5 py-2.5 gap-2 h-10',
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
          <span>{loadingText || children}</span>
        </>
      ) : (
        <>
          {leftIcon && <span className="shrink-0 flex items-center">{leftIcon}</span>}
          <span>{children}</span>
          {rightIcon && <span className="shrink-0 flex items-center">{rightIcon}</span>}
        </>
      )}
    </button>
  );
};

// ============================================================================
// 2. CARDS & KPI STAT CARDS
// ============================================================================

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  noPadding?: boolean;
}

export const Card: React.FC<CardProps> = ({
  interactive = false,
  noPadding = false,
  className = '',
  children,
  ...props
}) => {
  return (
    <div
      className={`${
        interactive ? 'saas-card-interactive cursor-pointer' : 'saas-card'
      } ${noPadding ? '' : 'p-5'} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export interface KpiCardProps {
  label: string;
  value: React.ReactNode;
  subValue?: string;
  contextText?: React.ReactNode;
  icon?: React.ReactNode;
  accentColor?: 'emerald' | 'blue' | 'amber' | 'slate';
  onClick?: () => void;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  label,
  value,
  subValue,
  contextText,
  icon,
  accentColor = 'slate',
  onClick,
}) => {
  const iconTone: Record<string, string> = {
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    slate: 'bg-slate-800/80 text-slate-300 border-slate-700/70',
  };

  return (
    <div
      onClick={onClick}
      className={`${
        onClick ? 'saas-card-interactive cursor-pointer' : 'saas-card'
      } p-5 flex flex-col justify-between`}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          {label}
        </span>
        {icon && (
          <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${iconTone[accentColor]}`}>
            {icon}
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <div className="text-2xl font-bold tracking-tight text-slate-50 tabular-nums">
          {value}
        </div>
        {subValue && (
          <span className="text-xs font-medium text-slate-400">{subValue}</span>
        )}
      </div>

      {contextText && (
        <div className="mt-2.5 pt-2.5 border-t border-slate-800/80 text-xs text-slate-400 flex items-center justify-between">
          {contextText}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 3. BADGES (SEMANTIC, POSITION, RANK)
// ============================================================================

export type BadgeVariant = 'neutral' | 'brand' | 'success' | 'warning' | 'error' | 'info';

export interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
  mono?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  children,
  className = '',
  mono = false,
}) => {
  const styles: Record<BadgeVariant, string> = {
    neutral: 'bg-slate-800/90 text-slate-300 border-slate-700/80',
    brand: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
    success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
    warning: 'bg-amber-500/10 text-amber-300 border-amber-500/25',
    error: 'bg-rose-500/10 text-rose-300 border-rose-500/25',
    info: 'bg-blue-500/10 text-blue-300 border-blue-500/25',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium border ${
        styles[variant]
      } ${mono ? 'font-mono tabular-nums' : ''} ${className}`}
    >
      {children}
    </span>
  );
};

export const PositionBadge: React.FC<{ position: string; className?: string }> = ({
  position,
  className = '',
}) => {
  const getStyles = (pos: string) => {
    switch (pos) {
      case 'Forward':
        return 'bg-rose-500/10 text-rose-300 border-rose-500/25';
      case 'Midfielder':
        return 'bg-amber-500/10 text-amber-300 border-amber-500/25';
      case 'Defender':
        return 'bg-sky-500/10 text-sky-300 border-sky-500/25';
      case 'Goalkeeper':
        return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border ${getStyles(
        position
      )} ${className}`}
    >
      {position}
    </span>
  );
};

export const RankBadge: React.FC<{ rank: number; size?: 'sm' | 'md' }> = ({
  rank,
  size = 'md',
}) => {
  const isFirst = rank === 1;
  const isTop3 = rank <= 3;

  const sizeClass = size === 'sm' ? 'w-6 h-6 text-[11px]' : 'w-7 h-7 text-xs';

  if (isFirst) {
    return (
      <span
        className={`inline-flex items-center justify-center ${sizeClass} rounded-md font-mono font-bold tabular-nums bg-amber-500/20 text-amber-300 border border-amber-400/40`}
        title="Rank #1 Leader"
      >
        #{rank}
      </span>
    );
  }

  if (isTop3) {
    return (
      <span
        className={`inline-flex items-center justify-center ${sizeClass} rounded-md font-mono font-semibold tabular-nums bg-emerald-500/15 text-emerald-300 border border-emerald-500/30`}
        title={`Top 3 — Rank #${rank}`}
      >
        #{rank}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center justify-center ${sizeClass} rounded-md font-mono font-medium tabular-nums bg-slate-800/90 text-slate-300 border border-slate-700/80`}
    >
      #{rank}
    </span>
  );
};

// ============================================================================
// 4. TABS & SEGMENTED CONTROLS
// ============================================================================

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  count?: number;
}

export interface SegmentedControlProps<T extends string = string> {
  options: SegmentedOption<string>[];
  value: T;
  onChange: (val: any) => void;
  label?: string;
  size?: 'sm' | 'md';
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  label,
  size = 'sm',
}: SegmentedControlProps<T>) {
  return (
    <div className="inline-flex items-center gap-1.5 bg-[#0d1320] p-1 rounded-lg border border-slate-800">
      {label && (
        <span className="text-xs font-medium text-slate-400 px-2 select-none">
          {label}
        </span>
      )}
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value as T)}
            className={`${
              size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3.5 py-1.5 text-xs'
            } rounded-md font-medium transition-all flex items-center gap-1.5 ${
              active
                ? 'bg-[#161f33] text-white border border-slate-700/90 shadow-saas-sm'
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            <span>{opt.label}</span>
            {opt.count !== undefined && (
              <span
                className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                  active ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {opt.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ============================================================================
// 5. SEARCH BAR, DROPDOWNS & FORM CONTROLS
// ============================================================================

export interface SearchInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  onClear,
  placeholder = 'Search...',
  className = '',
  ...props
}) => {
  return (
    <div className={`relative flex items-center ${className}`}>
      <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="saas-input w-full pl-9 pr-8 py-1.5 h-9 text-sm placeholder-slate-500"
        {...props}
      />
      {value && (
        <button
          type="button"
          onClick={() => {
            onChange('');
            onClear?.();
          }}
          className="absolute right-2.5 p-0.5 rounded text-slate-400 hover:text-slate-200 transition-colors"
          aria-label="Clear search"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  label?: string;
  icon?: React.ReactNode;
  className?: string;
  ariaLabel?: string;
}

export const SelectDropdown: React.FC<SelectDropdownProps> = ({
  value,
  onChange,
  options,
  label,
  icon,
  className = '',
  ariaLabel,
}) => {
  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      {label && (
        <span className="text-xs font-medium text-slate-400 whitespace-nowrap">
          {label}
        </span>
      )}
      <div className="relative flex items-center w-full">
        {icon && (
          <span className="absolute left-3 text-slate-400 pointer-events-none">
            {icon}
          </span>
        )}
        <select
          aria-label={ariaLabel || label || 'Select option'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`saas-input h-9 ${
            icon ? 'pl-8' : 'pl-3'
          } pr-8 py-1.5 text-sm appearance-none cursor-pointer w-full bg-[#0d1320]`}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-[#111726] text-slate-200">
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 pointer-events-none" />
      </div>
    </div>
  );
};

export interface FormFieldProps {
  label: string;
  htmlFor?: string;
  helperText?: string;
  error?: string;
  children: React.ReactNode;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  htmlFor,
  helperText,
  error,
  children,
}) => {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={htmlFor}
        className="block text-xs font-semibold text-slate-300 tracking-wide"
      >
        {label}
      </label>
      {children}
      {error ? (
        <p className="text-xs text-rose-400">{error}</p>
      ) : helperText ? (
        <p className="text-[11px] text-slate-500">{helperText}</p>
      ) : null}
    </div>
  );
};

// ============================================================================
// 6. ALERTS & ERROR STATES
// ============================================================================

export interface AlertProps {
  variant?: 'info' | 'success' | 'warning' | 'error';
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  onDismiss?: () => void;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  title,
  description,
  action,
  onDismiss,
  className = '',
}) => {
  const styles = {
    info: {
      container: 'bg-blue-950/30 border-blue-500/30 text-blue-200',
      icon: <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />,
      title: 'text-blue-200',
      desc: 'text-slate-300',
    },
    success: {
      container: 'bg-emerald-950/30 border-emerald-500/30 text-emerald-200',
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />,
      title: 'text-emerald-200',
      desc: 'text-slate-300',
    },
    warning: {
      container: 'bg-amber-950/30 border-amber-500/30 text-amber-200',
      icon: <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />,
      title: 'text-amber-200',
      desc: 'text-slate-300',
    },
    error: {
      container: 'bg-rose-950/30 border-rose-500/30 text-rose-200',
      icon: <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />,
      title: 'text-rose-200',
      desc: 'text-slate-300',
    },
  }[variant];

  return (
    <div
      role="alert"
      className={`rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${styles.container} ${className}`}
    >
      <div className="flex items-start gap-3">
        {styles.icon}
        <div>
          <h4 className={`text-sm font-semibold ${styles.title}`}>{title}</h4>
          {description && (
            <div className={`text-xs mt-1 leading-relaxed ${styles.desc}`}>
              {description}
            </div>
          )}
        </div>
      </div>
      {(action || onDismiss) && (
        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
          {action}
          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              className="p-1 rounded-md text-slate-400 hover:text-white transition-colors"
              aria-label="Dismiss alert"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 7. CHART CONTAINER
// ============================================================================

export interface ChartContainerProps {
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  controls?: React.ReactNode;
  isLoading?: boolean;
  heightClass?: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

export const ChartContainer: React.FC<ChartContainerProps> = ({
  title,
  subtitle,
  badge,
  controls,
  isLoading = false,
  heightClass = 'h-72',
  footer,
  children,
}) => {
  return (
    <div className="saas-card p-5 flex flex-col justify-between">
      <div>
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 pb-4 border-b border-slate-800/80">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-slate-100">{title}</h3>
              {badge}
            </div>
            {subtitle && (
              <p className="text-xs text-slate-400 mt-1">{subtitle}</p>
            )}
          </div>
          {controls && <div className="shrink-0">{controls}</div>}
        </div>

        <div className={`w-full ${heightClass} mt-4 relative`}>
          {isLoading ? <SkeletonChart /> : children}
        </div>
      </div>

      {footer && (
        <div className="mt-4 pt-3 border-t border-slate-800/80 text-xs text-slate-400 flex items-center justify-between">
          {footer}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 8. EMPTY STATES
// ============================================================================

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = '',
}) => {
  return (
    <div
      className={`py-12 px-6 text-center flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-800 bg-[#0d1320]/60 ${className}`}
    >
      <div className="w-11 h-11 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center text-slate-400 mb-3">
        {icon || <Inbox className="w-5 h-5" />}
      </div>
      <h4 className="text-sm font-semibold text-slate-200">{title}</h4>
      <p className="text-xs text-slate-400 max-w-md mt-1 leading-relaxed">
        {description}
      </p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
};

// ============================================================================
// 9. LOADING SKELETONS
// ============================================================================

export const SkeletonCard: React.FC = () => (
  <div className="saas-card p-5 animate-pulse space-y-3">
    <div className="flex items-center justify-between">
      <div className="h-3 w-24 bg-slate-800 rounded" />
      <div className="h-8 w-8 bg-slate-800 rounded-lg" />
    </div>
    <div className="h-7 w-20 bg-slate-800 rounded" />
    <div className="h-3 w-32 bg-slate-800/70 rounded" />
  </div>
);

export const SkeletonTable: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <div className="w-full animate-pulse space-y-2 py-2">
    <div className="h-9 bg-slate-800/70 rounded-lg w-full" />
    {Array.from({ length: rows }).map((_, idx) => (
      <div
        key={idx}
        className="h-12 bg-slate-800/40 rounded-lg w-full flex items-center px-4 justify-between"
      >
        <div className="flex items-center gap-4">
          <div className="h-6 w-6 bg-slate-800 rounded" />
          <div className="h-4 w-32 bg-slate-800 rounded" />
        </div>
        <div className="flex items-center gap-6">
          <div className="h-4 w-16 bg-slate-800 rounded" />
          <div className="h-5 w-14 bg-slate-800 rounded" />
          <div className="h-4 w-12 bg-slate-800 rounded" />
        </div>
      </div>
    ))}
  </div>
);

export const SkeletonChart: React.FC = () => (
  <div className="w-full h-full animate-pulse flex flex-col justify-end gap-3 p-4 bg-[#0d1320]/50 rounded-lg border border-slate-800/60">
    <div className="flex items-end justify-between gap-3 h-4/5 pt-4">
      {[45, 70, 55, 85, 65, 90, 60, 75].map((h, i) => (
        <div
          key={i}
          style={{ height: `${h}%` }}
          className="flex-1 bg-slate-800/70 rounded-t-md"
        />
      ))}
    </div>
    <div className="h-2.5 w-full bg-slate-800/60 rounded" />
  </div>
);

// ============================================================================
// 10. STITCH-STYLE PAGE HEADER
// ============================================================================

export interface PageHeaderProps {
  title: string;
  description: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  badge,
  actions,
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-5 border-b border-slate-800/90">
      <div className="space-y-1.5 max-w-2xl">
        <div className="flex items-center gap-2.5 flex-wrap">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-50">
            {title}
          </h1>
          {badge}
        </div>
        <p className="text-sm text-slate-400 leading-relaxed">{description}</p>
      </div>
      {actions && (
        <div className="flex items-center flex-wrap gap-2.5 shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 11. TOOLTIP
// ============================================================================

export const Tooltip: React.FC<{
  content: string;
  children: React.ReactNode;
}> = ({ content, children }) => {
  return (
    <div className="relative group inline-flex items-center">
      {children}
      <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50 px-2.5 py-1.5 rounded-md bg-slate-900 border border-slate-700 text-[11px] font-medium text-slate-200 whitespace-nowrap shadow-saas-md">
        {content}
      </div>
    </div>
  );
};

// ============================================================================
// 12. MODAL
// ============================================================================

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidthClass?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidthClass = 'max-w-3xl',
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs overflow-y-auto">
      <div
        className={`relative w-full ${maxWidthClass} saas-card bg-[#111726] border border-slate-800 rounded-xl shadow-saas-lg overflow-hidden my-8`}
      >
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between gap-4 bg-[#0d1320]">
          <div>
            <h3 className="text-base font-bold text-slate-100">{title}</h3>
            {subtitle && (
              <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 max-h-[78vh] overflow-y-auto">{children}</div>

        {footer && (
          <div className="px-6 py-3.5 bg-[#0d1320] border-t border-slate-800 flex items-center justify-end gap-2.5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
