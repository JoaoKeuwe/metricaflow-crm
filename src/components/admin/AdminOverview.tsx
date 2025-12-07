import { AdminMetricsCards } from "./AdminMetricsCards";
import { AdminGrowthCharts } from "./AdminGrowthCharts";
import { AdminMRRChart } from "./AdminMRRChart";
import { AdminPlanDistribution } from "./AdminPlanDistribution";
import { useAdminCompanies, useAdminUsers, useAdminStripeData } from "@/hooks/useAdminData";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export const AdminOverview = () => {
  const { data: companies, isLoading: loadingCompanies } = useAdminCompanies();
  const { data: users, isLoading: loadingUsers } = useAdminUsers();
  const { data: stripeData, isLoading: loadingStripe } = useAdminStripeData();

  const isLoading = loadingCompanies || loadingUsers || loadingStripe;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Metrics Cards */}
      <AdminMetricsCards />

      {/* Growth Charts */}
      {companies && users && (
        <AdminGrowthCharts 
          companies={companies.map(c => ({ id: c.id, name: c.name, created_at: c.created_at }))}
          users={users.map(u => ({ id: u.id, created_at: u.created_at, active: u.active }))}
        />
      )}

      {/* MRR Chart */}
      {stripeData && (
        <AdminMRRChart 
          invoices={stripeData.invoices}
          currentMRR={stripeData.metrics.mrr}
        />
      )}

      {/* Plan Distribution */}
      {stripeData && (
        <AdminPlanDistribution 
          subscriptions={stripeData.subscriptions}
        />
      )}
    </div>
  );
};
