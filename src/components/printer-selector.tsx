import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getPrinterById, PRINTERS } from "@/lib/printers";
import type { PrinterId } from "@/lib/printers";

interface PrinterSelectorProps {
  value: PrinterId;
  onChange: (id: PrinterId) => void;
  className?: string;
}

export function PrinterSelector({ value, onChange, className }: PrinterSelectorProps) {
  const selected = getPrinterById(value);

  return (
    <Select value={value} onValueChange={(v) => onChange(v as PrinterId)}>
      <SelectTrigger className={className} aria-label="Select printer">
        <div className="flex items-center gap-2">
          <img
            src={selected.image}
            alt=""
            className="h-5 w-5 rounded object-cover"
            loading="lazy"
          />
          <span className="truncate">{selected.shortName}</span>
        </div>
      </SelectTrigger>
      <SelectContent>
        {PRINTERS.map((printer) => (
          <SelectItem key={printer.id} value={printer.id}>
            <div className="flex items-center gap-2">
              <img
                src={printer.image}
                alt=""
                className="h-5 w-5 rounded object-cover"
                loading="lazy"
              />
              <span>{printer.name}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
