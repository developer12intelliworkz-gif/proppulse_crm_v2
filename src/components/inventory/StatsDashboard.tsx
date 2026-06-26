import { Card, CardContent } from "@/components/ui/card";
import { useAppSelector } from "@/store/hooks";
import { selectInventoryMetrics } from "./inventorySelectors";
import {
  isApartmentSubcategory,
} from "./inventoryConstants";
import {
  Package,
  CheckCircle2,
  IndianRupee,
  Building2,
  Layers,
} from "lucide-react";

const StatsDashboard = () => {
  const inventory = useAppSelector((s) => s.inventory);
  const metrics = useAppSelector(selectInventoryMetrics);
  const isApartment = isApartmentSubcategory(inventory.subcategory);

  if (!inventory.projectType) return null;

  const formatCurrency = (n: number) =>
    n > 0 ? `₹${n.toLocaleString("en-IN")}` : "—";

  const cards = [
    ...(isApartment
      ? [
          {
            key: "towers",
            label: "Towers",
            value: metrics.totalTowers,
            icon: Building2,
          },
          {
            key: "floors",
            label: "Floors",
            value: metrics.totalFloors,
            icon: Layers,
          },
        ]
      : []),
    { key: "total", label: "Total Units", value: metrics.totalUnits, icon: Package },
    { key: "avail", label: "Available", value: metrics.available, icon: CheckCircle2 },
    // TODO: re-enable when status metrics are in use — Reserved, Sold, Blocked, Booked
    {
      key: "totalValue",
      label: "Total Value",
      value: formatCurrency(metrics.totalValue),
      icon: IndianRupee,
    },
    // TODO: re-enable when sold value tracking is in use — Sold Value
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-3">
        {cards.map(({ key, label, value, icon: Icon }) => (
          <Card key={key}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-lg font-bold truncate">{value}</p>
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                  {label}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
    </div>
  );
};

export default StatsDashboard;
