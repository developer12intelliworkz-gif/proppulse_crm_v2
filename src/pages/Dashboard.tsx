/**
 * Dashboard toggle — switch active layout by commenting/uncommenting one line below.
 */
import DashboardClassicView from "@/components/dashboard/DashboardClassicView";
import DashboardEnhancedView from "@/components/dashboard/DashboardEnhancedView";

const ActiveDashboard = DashboardClassicView;
// const ActiveDashboard = DashboardEnhancedView;

const Dashboard = () => <ActiveDashboard />;

export default Dashboard;
