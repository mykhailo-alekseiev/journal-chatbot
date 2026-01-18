import { memo } from "react";
import type { DynamicToolUIPart, ToolUIPart } from "ai";
import { Loader2, Check, AlertCircle, Search, BarChart3, TrendingUp } from "lucide-react";
import { cn } from "~/lib/utils";
import { getToolConfig, isJournalTool, MOOD_SCALE, type MoodLevel } from "~/features/journal";
import styles from "./ToolInvocationDisplay.module.css";

interface Props {
  part: ToolUIPart | DynamicToolUIPart;
}

export const ToolInvocationDisplay = memo(({ part }: Props) => {
  const toolName = part.type.slice(5);
  const state = part.state;
  const isLoading = state === "input-streaming" || state === "input-available";
  const hasError = state === "output-error";

  const config = getToolConfig(toolName);
  const Icon = config.icon;

  // Loading state
  if (isLoading) {
    return (
      <div className={cn(styles.statusRow, styles.loadingText)}>
        <Loader2 className={styles.spinningIcon} />
        <span>{config.label}...</span>
      </div>
    );
  }

  // Error state
  if (hasError) {
    return (
      <div className={cn(styles.statusRow, styles.errorText)}>
        <AlertCircle className={styles.icon} />
        <span>
          {config.label} failed: {part.errorText || "Unknown error"}
        </span>
      </div>
    );
  }

  // save_entry result
  if (isJournalTool(part, "save_entry")) {
    if (part.output.success) {
      const action = part.output.updated ? "updated" : "saved";
      return (
        <div className={cn(styles.statusRow, styles.successText)}>
          <Check className={styles.icon} />
          <span>Entry {action}</span>
        </div>
      );
    }
    return (
      <div className={cn(styles.statusRow, styles.errorText)}>
        <AlertCircle className={styles.icon} />
        <span>Failed to save: {part.output.error}</span>
      </div>
    );
  }

  // query_entries result
  if (isJournalTool(part, "query_entries")) {
    if (part.output.success) {
      const count = part.output.count || 0;
      return (
        <div className={styles.resultContainer}>
          <div className={styles.resultHeader}>
            <Search className={styles.icon} />
            <span>
              Found {count} {count === 1 ? "entry" : "entries"}
            </span>
          </div>
        </div>
      );
    }
    return (
      <div className={cn(styles.statusRow, styles.loadingText)}>
        <Search className={styles.icon} />
        <span>No entries found</span>
      </div>
    );
  }

  // analyze_journal result
  if (isJournalTool(part, "analyze_journal")) {
    const distribution = part.output.mood_distribution || {};
    const total = Object.values(distribution).reduce((a, b) => a + b, 0);

    return (
      <div className={styles.resultCard}>
        <div className={styles.resultHeaderWithMargin}>
          <BarChart3 className={styles.icon} />
          <span>Journal insights ({part.output.period})</span>
        </div>

        {/* Stats row */}
        <div className={styles.statsGrid}>
          <div>
            <div className={styles.statValue}>{part.output.total_entries}</div>
            <div className={styles.statLabel}>entries</div>
          </div>
          <div>
            <div className={styles.statValue}>{part.output.streak_days}</div>
            <div className={styles.statLabel}>day streak</div>
          </div>
          <div>
            <div className={styles.statValue}>{part.output.avg_entry_length}</div>
            <div className={styles.statLabel}>avg chars</div>
          </div>
        </div>

        {/* Mood distribution */}
        {total > 0 && (
          <>
            <div className={styles.moodDivider}>
              <TrendingUp className={styles.smallIcon} />
              <span className={styles.moodLabel}>Mood distribution</span>
            </div>
            <div className={styles.moodDistribution}>
              {(Object.entries(distribution) as [MoodLevel, number][])
                .filter(([, count]) => count > 0)
                .map(([mood, count]) => (
                  <div key={mood} className={styles.moodItem}>
                    <span>{MOOD_SCALE[mood].emoji}</span>
                    <span className={styles.moodPercent}>{Math.round((count / total) * 100)}%</span>
                  </div>
                ))}
            </div>
          </>
        )}

        {total === 0 && <div className={styles.noDataText}>No mood data yet</div>}
      </div>
    );
  }

  // Fallback
  return (
    <div className={cn(styles.statusRow, styles.loadingText)}>
      <Icon className={cn(styles.icon, config.color)} />
      <span>{config.label} complete</span>
    </div>
  );
});
