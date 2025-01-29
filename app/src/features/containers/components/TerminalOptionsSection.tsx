import React from "react";
import FormSection from "../../../components/ui/FormSection";
import Checkbox from "../../../components/ui/Checkbox";

interface TerminalOptionsProps {
  tty: boolean;
  attachStdin: boolean;
  attachStdout: boolean;
  attachStderr: boolean;
  onChange: (
    key: keyof Pick<
      TerminalOptionsProps,
      "tty" | "attachStdin" | "attachStdout" | "attachStderr"
    >,
    value: boolean
  ) => void;
}

export const TerminalOptionsSection: React.FC<TerminalOptionsProps> = ({
  tty,
  attachStdin,
  attachStdout,
  attachStderr,
  onChange,
}) => {
  return (
    <FormSection title="Terminal Options">
      <div className="space-y-4">
        <Checkbox
          id="tty"
          checked={tty}
          onChange={(e) => onChange("tty", e.target.checked)}
          label="Allocate pseudo-TTY"
        />

        <Checkbox
          id="attachStdin"
          checked={attachStdin}
          onChange={(e) => onChange("attachStdin", e.target.checked)}
          label="Attach to STDIN"
        />

        <Checkbox
          id="attachStdout"
          checked={attachStdout}
          onChange={(e) => onChange("attachStdout", e.target.checked)}
          label="Attach to STDOUT"
        />

        <Checkbox
          id="attachStderr"
          checked={attachStderr}
          onChange={(e) => onChange("attachStderr", e.target.checked)}
          label="Attach to STDERR"
        />
      </div>
    </FormSection>
  );
};
