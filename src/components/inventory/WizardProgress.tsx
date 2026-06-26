import { Layers } from "lucide-react";

const WizardProgress = () => (
  <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-primary text-primary-foreground shadow-sm">
    <Layers className="h-3.5 w-3.5" />
    <span>Layout Builder</span>
  </div>
);

export default WizardProgress;
