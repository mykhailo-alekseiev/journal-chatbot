import { Button } from "~/components/ui/button";
import { JOURNAL_PRESETS } from "~/features/journal/presets";

interface PromptPresetsProps {
  onSelect: (message: string) => void;
}

export function PromptPresets({ onSelect }: PromptPresetsProps) {
  return (
    <div className="flex flex-col sm:grid sm:grid-cols-2 gap-2 pt-4">
      {JOURNAL_PRESETS.map((preset) => (
        <Button
          key={preset.id}
          variant="outline"
          className="justify-start h-auto py-3 px-4"
          onClick={() => onSelect(preset.message)}
        >
          {preset.label}
        </Button>
      ))}
    </div>
  );
}
