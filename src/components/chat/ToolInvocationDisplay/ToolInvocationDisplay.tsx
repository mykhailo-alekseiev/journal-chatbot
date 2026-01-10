import type { ToolUIPart } from "ai";
import {
  Loader2,
  Check,
  AlertCircle,
  Calendar,
  Search,
  BarChart3,
  Tag,
  TrendingUp,
} from "lucide-react";
import { cn } from "~/lib/utils";
import {
  getToolConfig,
  isSaveEntryResult,
  isRecentEntriesResult,
  isSearchResult,
  isStatsResult,
  isEntriesByTagResult,
  isMoodTrendsResult,
  MOOD_SCALE,
  type MoodLevel,
} from "~/features/journal";
import styles from "./ToolInvocationDisplay.module.css";

interface Props {
  part: ToolUIPart;
}

export function ToolInvocationDisplay({ part }: Props) {
  // toolName is encoded in type: "tool-{toolName}"
  const toolName = part.type.slice(5);
  const state = part.state;
  const isLoading = state === "input-streaming" || state === "input-available";
  const hasError = state === "output-error";
  const result = state === "output-available" ? part.output : null;

  const config = getToolConfig(toolName);
  const Icon = config.icon;

  // Loading state
  if (isLoading) {
    return (
      <div className={`${styles.statusRow} ${styles.loadingText}`}>
        <Loader2 className={styles.spinningIcon} />
        <span>{config.label}...</span>
      </div>
    );
  }

  // Error state
  if (hasError) {
    return (
      <div className={`${styles.statusRow} ${styles.errorText}`}>
        <AlertCircle className={styles.icon} />
        <span>
          {config.label} failed: {part.errorText || "Unknown error"}
        </span>
      </div>
    );
  }

  // Create entry result
  if (toolName === "create_journal_entry" && isSaveEntryResult(result)) {
    if (result.success) {
      return (
        <div className={`${styles.statusRow} ${styles.successText}`}>
          <Check className={styles.icon} />
          <span>Entry saved</span>
        </div>
      );
    }
    return (
      <div className={`${styles.statusRow} ${styles.errorText}`}>
        <AlertCircle className={styles.icon} />
        <span>Failed to save: {result.error}</span>
      </div>
    );
  }

  // Update entry result
  if (toolName === "update_journal_entry" && isSaveEntryResult(result)) {
    if (result.success) {
      return (
        <div className={`${styles.statusRow} ${styles.updateText}`}>
          <Check className={styles.icon} />
          <span>Entry updated</span>
        </div>
      );
    }
    return (
      <div className={`${styles.statusRow} ${styles.errorText}`}>
        <AlertCircle className={styles.icon} />
        <span>Failed to update: {result.error}</span>
      </div>
    );
  }

  // Recent entries result
  if (toolName === "get_recent_entries" && isRecentEntriesResult(result)) {
    if (result.success && result.entries?.length) {
      return (
        <div className={styles.resultContainer}>
          <div className={styles.resultHeader}>
            <Calendar className={styles.icon} />
            <span>Found {result.count} recent entries</span>
          </div>
        </div>
      );
    }
    return (
      <div className={`${styles.statusRow} ${styles.loadingText}`}>
        <Calendar className={styles.icon} />
        <span>No recent entries found</span>
      </div>
    );
  }

  // Search result
  if (toolName === "search_entries" && isSearchResult(result)) {
    if (result.success) {
      return (
        <div className={styles.resultContainer}>
          <div className={styles.resultHeader}>
            <Search className={styles.icon} />
            <span>Found {result.count} matching entries</span>
          </div>
        </div>
      );
    }
  }

  // Entries by tag result
  if (toolName === "get_entries_by_tag" && isEntriesByTagResult(result)) {
    if (result.success) {
      return (
        <div className={styles.resultContainer}>
          <div className={styles.resultHeader}>
            <Tag className={styles.icon} />
            <span>
              Found {result.count} entries tagged <strong>#{result.tag}</strong>
            </span>
          </div>
        </div>
      );
    }
  }

  // Mood trends result
  if (toolName === "get_mood_trends" && isMoodTrendsResult(result)) {
    if (result.success && result.mood_distribution) {
      const distribution = result.mood_distribution;
      const total = Object.values(distribution).reduce((a, b) => a + b, 0);

      return (
        <div className={styles.resultCard}>
          <div className={styles.resultHeaderWithMargin}>
            <TrendingUp className={styles.icon} />
            <span>Mood trends ({result.period_days} days)</span>
          </div>
          <div className={styles.moodDistribution}>
            {(Object.entries(distribution) as [MoodLevel, number][])
              .filter(([, count]) => count > 0)
              .map(([mood, count]) => (
                <div key={mood} className={styles.moodItem}>
                  <span>{MOOD_SCALE[mood].emoji}</span>
                  <span className={styles.moodPercent}>
                    {Math.round((count / total) * 100)}%
                  </span>
                </div>
              ))}
          </div>
          {total === 0 && <div className={styles.noDataText}>No mood data yet</div>}
        </div>
      );
    }
  }

  // Stats result
  if (toolName === "get_entry_stats" && isStatsResult(result)) {
    if (result.success) {
      return (
        <div className={styles.resultCard}>
          <div className={styles.resultHeaderWithMargin}>
            <BarChart3 className={styles.icon} />
            <span>Your journaling stats ({result.period})</span>
          </div>
          <div className={styles.statsGrid}>
            <div>
              <div className={styles.statValue}>{result.total_entries}</div>
              <div className={styles.statLabel}>entries</div>
            </div>
            <div>
              <div className={styles.statValue}>{result.streak_days}</div>
              <div className={styles.statLabel}>day streak</div>
            </div>
            <div>
              <div className={styles.statValue}>{result.avg_entry_length}</div>
              <div className={styles.statLabel}>avg chars</div>
            </div>
          </div>
        </div>
      );
    }
  }

  // Fallback
  return (
    <div className={`${styles.statusRow} ${styles.loadingText}`}>
      <Icon className={cn(styles.icon, config.color)} />
      <span>{config.label} complete</span>
    </div>
  );
}
