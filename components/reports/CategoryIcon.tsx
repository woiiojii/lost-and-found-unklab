/**
 * components/reports/CategoryIcon.tsx
 * Renders clean Lucide icons for categories instead of emojis.
 */
import {
  Laptop,
  FileText,
  Watch,
  Shirt,
  Key,
  BookOpen,
  Briefcase,
  Package,
} from "lucide-react";

export function CategoryIcon({
  name,
  className = "w-4 h-4",
}: {
  name: string;
  className?: string;
}) {
  switch (name?.toLowerCase()) {
    case "elektronik":
      return <Laptop className={className} />;
    case "dokumen":
    case "dokumen & kartu":
      return <FileText className={className} />;
    case "aksesori":
    case "aksesori & perhiasan":
      return <Watch className={className} />;
    case "pakaian":
    case "pakaian & sepatu":
      return <Shirt className={className} />;
    case "kunci":
    case "kunci & gantungan":
      return <Key className={className} />;
    case "buku":
    case "buku & alat tulis":
      return <BookOpen className={className} />;
    case "tas":
    case "tas & dompet":
      return <Briefcase className={className} />;
    default:
      return <Package className={className} />;
  }
}
