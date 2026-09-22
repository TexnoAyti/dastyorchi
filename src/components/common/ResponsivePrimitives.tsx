import React, { useEffect, ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { useViewport } from "../../contexts/ViewportContext";

/* -------------------------------------------------------------
 * 1. PageContainer
 * Responsive page padding:
 * mobile: 12–16px (p-3 sm:p-4)
 * tablet: 20–24px (md:p-5 md:p-6)
 * desktop: 24–32px (lg:p-8)
 * ----------------------------------------------------------- */
interface PageContainerProps {
  children: ReactNode;
  className?: string;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "4xl" | "5xl" | "7xl" | "full";
}

export function PageContainer({ children, className, maxWidth = "7xl" }: PageContainerProps) {
  const maxWidthClass = {
    sm: "max-w-screen-sm",
    md: "max-w-screen-md",
    lg: "max-w-screen-lg",
    xl: "max-w-screen-xl",
    "2xl": "max-w-screen-2xl",
    "4xl": "max-w-4xl",
    "5xl": "max-w-5xl",
    "7xl": "max-w-7xl",
    full: "max-w-full",
  }[maxWidth];

  return (
    <div
      className={cn(
        "w-full mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-3.5 sm:py-5 md:py-6 lg:py-8 min-w-0 font-sans",
        maxWidthClass,
        className
      )}
    >
      {children}
    </div>
  );
}

/* -------------------------------------------------------------
 * 2. PageHeader
 * Responsive header stack with title, subtitle, and action slots
 * ----------------------------------------------------------- */
interface PageHeaderProps {
  badge?: ReactNode;
  title: string | ReactNode;
  subtitle?: string | ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({ badge, title, subtitle, actions, className }: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col md:flex-row md:items-center justify-between gap-3.5 sm:gap-4 mb-5 sm:mb-6 lg:mb-8", className)}>
      <div className="min-w-0 flex-1">
        {badge && <div className="mb-2">{badge}</div>}
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-zinc-100 tracking-tight truncate">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-xs sm:text-sm text-gray-500 dark:text-zinc-400 font-normal leading-relaxed max-w-2xl">
            {subtitle}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 sm:gap-3 shrink-0 flex-wrap sm:flex-nowrap">
          {actions}
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------
 * 3. PageActions
 * Primary action bar wrapper with 44px touch targets
 * ----------------------------------------------------------- */
export function PageActions({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-center gap-2 sm:gap-3 flex-wrap", className)}>
      {children}
    </div>
  );
}

/* -------------------------------------------------------------
 * 4. CardGrid
 * Responsive 1-col on mobile, 2-col on tablet, 3/4-col on desktop
 * ----------------------------------------------------------- */
interface CardGridProps {
  children: ReactNode;
  cols?: 2 | 3 | 4;
  className?: string;
}

export function CardGrid({ children, cols = 3, className }: CardGridProps) {
  const colClass = {
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  }[cols];

  return (
    <div className={cn("grid gap-3 sm:gap-4 lg:gap-6", colClass, className)}>
      {children}
    </div>
  );
}

/* -------------------------------------------------------------
 * 5. EmptyState
 * Accessible empty placeholder
 * ----------------------------------------------------------- */
interface EmptyStateProps {
  icon: React.ElementType;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center p-6 sm:p-10 rounded-2xl bg-white/50 dark:bg-zinc-900/50 border border-gray-200/70 dark:border-zinc-800/80 my-4",
        className
      )}
    >
      <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-zinc-800 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3.5 shadow-xs">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-base font-bold text-gray-900 dark:text-zinc-100 mb-1">{title}</h3>
      <p className="text-xs sm:text-sm text-gray-500 dark:text-zinc-400 max-w-sm leading-relaxed mb-5">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
}

/* -------------------------------------------------------------
 * 6. ResponsiveModal & MobileSheet
 * On Desktop: Centered modal dialog, max-w-md/lg/2xl, rounded corners, backdrop
 * On Mobile: Bottom sheet (slides up, rounded top corners, swipe handle, sticky bottom bar, safe area padding)
 * Prevents body scrolling when open.
 * ----------------------------------------------------------- */
interface ResponsiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | string;
  fullScreenOnMobile?: boolean;
}

export function ResponsiveModal({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = "md",
  fullScreenOnMobile = false,
}: ResponsiveModalProps) {
  const { isMobile } = useViewport();

  // Prevent background scroll when open
  useEffect(() => {
    if (!isOpen) return;
    const originalStyle = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const maxWidthClass = ({
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    "3xl": "max-w-3xl",
    "4xl": "max-w-4xl",
  } as Record<string, string>)[maxWidth] || maxWidth;

  // Mobile full screen or bottom sheet
  if (isMobile) {
    if (fullScreenOnMobile) {
      return (
        <div className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-100 animate-in fade-in duration-200">
          {/* Top bar with safe area */}
          <div
            style={{ paddingTop: "max(12px, env(safe-area-inset-top, 12px))" }}
            className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-zinc-800 shrink-0 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md"
          >
            <div className="min-w-0 pr-2">
              {title && <h3 className="text-base font-bold text-gray-900 dark:text-zinc-50 truncate">{title}</h3>}
              {description && <p className="text-[11px] text-gray-500 dark:text-zinc-400 truncate">{description}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 min-h-[44px] min-w-[44px] rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-all flex items-center justify-center cursor-pointer shrink-0"
              aria-label="Yopish"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          {/* Content area */}
          <div
            style={{ paddingBottom: "max(16px, env(safe-area-inset-bottom, 16px))" }}
            className="flex-1 overflow-y-auto p-4 min-h-0 overscroll-contain"
          >
            {children}
          </div>
        </div>
      );
    }

    // Default Mobile Bottom Sheet
    return (
      <div className="fixed inset-0 z-50 flex flex-col justify-end">
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in"
          onClick={onClose}
        />
        <div
          style={{ paddingBottom: "max(20px, env(safe-area-inset-bottom, 20px))" }}
          className="relative z-10 w-full bg-white dark:bg-zinc-900 rounded-t-[28px] border-t border-gray-200 dark:border-zinc-800 shadow-2xl p-4 sm:p-5 max-h-[90vh] flex flex-col animate-in slide-in-from-bottom duration-300 min-h-0"
        >
          {/* Swipe indicator handle */}
          <div className="w-10 h-1.5 bg-gray-300 dark:bg-zinc-700 rounded-full mx-auto mb-3 shrink-0" />

          {/* Header */}
          {(title || description) && (
            <div className="flex items-start justify-between pb-3 mb-3 border-b border-gray-100 dark:border-zinc-800 shrink-0">
              <div className="min-w-0 pr-2">
                {title && <h3 className="text-base font-bold text-gray-900 dark:text-zinc-50">{title}</h3>}
                {description && <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">{description}</p>}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 min-h-[44px] min-w-[44px] rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200 flex items-center justify-center cursor-pointer shrink-0"
                aria-label="Yopish"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Body */}
          <div className="flex-1 overflow-y-auto min-h-0 overscroll-contain">
            {children}
          </div>
        </div>
      </div>
    );
  }

  // Desktop Centered Dialog
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
      />
      <div
        className={cn(
          "relative z-10 w-full bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-2xl p-6 overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col",
          maxWidthClass
        )}
      >
        {(title || description) && (
          <div className="flex items-start justify-between pb-3 mb-4 border-b border-gray-100 dark:border-zinc-800 shrink-0">
            <div className="min-w-0 pr-2">
              {title && <h3 className="text-lg font-bold text-gray-900 dark:text-zinc-50">{title}</h3>}
              {description && <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">{description}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 min-h-[36px] min-w-[36px] rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200 flex items-center justify-center cursor-pointer shrink-0 transition-colors"
              aria-label="Yopish"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto min-h-0">
          {children}
        </div>
      </div>
    </div>
  );
}

export const MobileSheet = ResponsiveModal;
