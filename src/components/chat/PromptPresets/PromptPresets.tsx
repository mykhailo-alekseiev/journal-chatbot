import { Button } from "~/components/ui/button";
import { JOURNAL_PRESETS } from "~/features/journal/presets";
import styles from "./PromptPresets.module.css";

interface PromptPresetsProps {
  onSelect: (message: string) => void;
}

export function PromptPresets({ onSelect }: PromptPresetsProps) {
  return (
    <div className={styles.grid}>
      {JOURNAL_PRESETS.map((preset) => (
        <Button
          key={preset.id}
          variant="outline"
          className={styles.presetButton}
          onClick={() => onSelect(preset.message)}
        >
          {preset.label}
        </Button>
      ))}
    </div>
  );
}
