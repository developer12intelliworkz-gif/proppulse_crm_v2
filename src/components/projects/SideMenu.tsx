import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { FormContext } from "../../contexts/FormContext";

const steps = [
  { id: 1, name: "Project Details", path: "/projects/create/step1" },
  { id: 2, name: "Address Information", path: "/projects/create/step2" },
  { id: 3, name: "Virtual Walkthrough", path: "/projects/create/step3" },
  { id: 4, name: "Amenities", path: "/projects/create/step4" },
  { id: 5, name: "Price Quote & Brochure", path: "/projects/create/step5" },
  { id: 6, name: "Portal Integration", path: "/projects/create/step6" },
];

const SideMenu = () => {
  const { lastSavedStep } = useContext(FormContext);
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Steps</h3>
      <ul className="space-y-2">
        {steps.map((step) => (
          <li
            key={step.id}
            className={cn(
              "p-3 rounded-md cursor-pointer transition-colors",
              step.id <= lastSavedStep + 1
                ? "bg-blue-100 text-blue-800 font-medium"
                : "text-gray-600 hover:bg-gray-100"
            )}
            onClick={() => navigate(step.path)}
          >
            <span className="mr-2">{step.id}.</span> {step.name}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SideMenu;
