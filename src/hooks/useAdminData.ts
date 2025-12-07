import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface CompanyData {
  id: string;
  name: string;
  created_at: string;
  owner_id: string | null;
  subscription?: {
    plan_type: string;
    status: string;
    user_limit: number;
    stripe_customer_id: string | null;
    stripe_subscription_id: string | null;
    current_period_end: string | null;
  } | null;
  activeUsers: number;
  totalUsers: number;
  totalLeads: number;
}

interface UserData {
  id: string;
  name: string;
  email: string;
  company_id: string;
  company_name: string;
  role: string;
  active: boolean;
  created_at: string;
  is_super_admin: boolean;
}

interface StripeMetrics {
  totalCustomers: number;
  activeSubscriptions: number;
  totalSubscriptions: number;
  mrr: number;
  totalRevenue: number;
  paidInvoices: number;
  totalInvoices: number;
}

interface StripeCustomer {
  id: string;
  email: string | null;
  name: string | null;
  created: number;
}

interface StripeSubscription {
  id: string;
  customer: string;
  status: string;
  current_period_start: number;
  current_period_end: number;
  cancel_at_period_end: boolean;
  items: Array<{
    price_id: string;
    product_id: string;
    amount: number;
    currency: string;
    interval: string;
  }>;
}

interface StripeInvoice {
  id: string;
  number: string | null;
  customer: string;
  customer_email: string | null;
  status: string;
  amount_due: number;
  amount_paid: number;
  currency: string;
  created: number;
  paid_at: number | null;
  hosted_invoice_url: string | null;
  invoice_pdf: string | null;
}

interface StripePayment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  created: number;
  customer: string | null;
  description: string | null;
}

interface StripeData {
  metrics: StripeMetrics;
  customers: StripeCustomer[];
  subscriptions: StripeSubscription[];
  invoices: StripeInvoice[];
  payments: StripePayment[];
  balance: {
    available: Array<{ amount: number; currency: string }>;
    pending: Array<{ amount: number; currency: string }>;
  };
}

// Helper to check OTP token validity
const isOTPTokenValid = (): boolean => {
  if (typeof window === "undefined") return false;
  
  const adminToken = sessionStorage.getItem("adminToken");
  const adminTokenExpiry = sessionStorage.getItem("adminTokenExpiry");
  
  if (!adminToken || !adminTokenExpiry) return false;
  
  const expiry = new Date(adminTokenExpiry);
  return expiry > new Date();
};

export const useIsSuperAdmin = () => {
  return useQuery({
    queryKey: ["is-super-admin"],
    queryFn: async () => {
      // FIRST: Check if OTP token is valid
      if (isOTPTokenValid()) {
        return true;
      }

      // SECOND: Check via Supabase Auth
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data: profile } = await supabase
        .from("profiles")
        .select("is_super_admin")
        .eq("id", user.id)
        .single();

      return (profile as { is_super_admin?: boolean })?.is_super_admin ?? false;
    },
    staleTime: 1000 * 60 * 5,
  });
};

export { isOTPTokenValid };

export const useAdminCompanies = () => {
  return useQuery<CompanyData[]>({
    queryKey: ["admin-companies"],
    queryFn: async () => {
      // Fetch all companies
      const { data: companies, error: companiesError } = await supabase
        .from("companies")
        .select("*")
        .order("created_at", { ascending: false });

      if (companiesError) throw companiesError;

      // Fetch subscriptions
      const { data: subscriptions } = await supabase
        .from("subscriptions")
        .select("*");

      // Fetch profiles with counts
      const { data: profiles } = await supabase
        .from("profiles")
        .select("company_id, active");

      // Fetch leads with counts
      const { data: leads } = await supabase
        .from("leads")
        .select("company_id");

      // Map data together
      const result: CompanyData[] = companies.map((company) => {
        const subscription = subscriptions?.find(s => s.company_id === company.id);
        const companyProfiles = profiles?.filter(p => p.company_id === company.id) || [];
        const companyLeads = leads?.filter(l => l.company_id === company.id) || [];

        return {
          id: company.id,
          name: company.name,
          created_at: company.created_at,
          owner_id: company.owner_id,
          subscription: subscription ? {
            plan_type: subscription.plan_type,
            status: subscription.status,
            user_limit: subscription.user_limit,
            stripe_customer_id: subscription.stripe_customer_id,
            stripe_subscription_id: subscription.stripe_subscription_id,
            current_period_end: subscription.current_period_end,
          } : null,
          activeUsers: companyProfiles.filter(p => p.active).length,
          totalUsers: companyProfiles.length,
          totalLeads: companyLeads.length,
        };
      });

      return result;
    },
    staleTime: 1000 * 60 * 2,
  });
};

export const useAdminUsers = () => {
  return useQuery<UserData[]>({
    queryKey: ["admin-users"],
    queryFn: async () => {
      // Fetch all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, name, company_id, active, created_at, is_super_admin, companies(name)")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch user roles
      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id, role");

      // Fetch emails via edge function
      const { data: emailsData } = await supabase.functions.invoke("get-user-emails");
      const emailsMap = new Map((emailsData?.emails || []).map((e: { id: string; email: string }) => [e.id, e.email]));

      // Map data together
      const result: UserData[] = profiles.map((profile) => {
        const userRole = roles?.find(r => r.user_id === profile.id);
        const companyData = profile.companies as { name: string } | null;

        return {
          id: profile.id,
          name: profile.name,
          email: (emailsMap.get(profile.id) as string) || "-",
          company_id: profile.company_id,
          company_name: companyData?.name || "-",
          role: userRole?.role || "vendedor",
          active: profile.active,
          created_at: profile.created_at,
          is_super_admin: profile.is_super_admin || false,
        };
      });

      return result;
    },
    staleTime: 1000 * 60 * 2,
  });
};

export const useAdminStripeData = () => {
  return useQuery<StripeData>({
    queryKey: ["admin-stripe-data"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("admin-stripe-data");
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 5,
  });
};

export const useAdminMetrics = () => {
  const { data: companies } = useAdminCompanies();
  const { data: users } = useAdminUsers();
  const { data: stripeData } = useAdminStripeData();

  return {
    totalCompanies: companies?.length || 0,
    activeSubscriptions: companies?.filter(c => c.subscription?.status === "active").length || 0,
    totalUsers: users?.length || 0,
    activeUsers: users?.filter(u => u.active).length || 0,
    totalLeads: companies?.reduce((sum, c) => sum + c.totalLeads, 0) || 0,
    mrr: stripeData?.metrics.mrr || 0,
    totalRevenue: stripeData?.metrics.totalRevenue || 0,
    stripeCustomers: stripeData?.metrics.totalCustomers || 0,
  };
};
