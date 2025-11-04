import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";
import Leads from "./pages/Leads";
import LeadDetail from "./pages/LeadDetail";
import Kanban from "./pages/Kanban";
import Users from "./pages/Users";
import AcceptInvite from "./pages/AcceptInvite";
import Integrations from "./pages/Integrations";
import Agenda from "./pages/Agenda";
import Tasks from "./pages/Tasks";
import Reminders from "./pages/Reminders";
import LocalProspector from "./pages/LocalProspector";
import BulkImport from "./pages/BulkImport";
import WhatsApp from "./pages/WhatsApp";
import GamificationLive from "./pages/GamificationLive";
import Help from "./pages/Help";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import Sidebar from "./components/layout/Sidebar";
import Header from "./components/layout/Header";
import ProtectedRoute from "./pages/ProtectedRoute";
import OnboardingTour from "./components/onboarding/OnboardingTour";
import WhatsAppButton from "./components/support/WhatsAppButton";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos
      gcTime: 10 * 60 * 1000, // 10 minutos  
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const DemoLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="flex h-screen bg-background">
    <Sidebar />
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header />
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
    <OnboardingTour />
    <WhatsAppButton />
  </div>
);

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/accept-invite" element={<AcceptInvite />} />
            <Route
              path="/"
              element={
                <DemoLayout>
                  <Dashboard />
                </DemoLayout>
              }
            />
            <Route
              path="/leads"
              element={
                <DemoLayout>
                  <Leads />
                </DemoLayout>
              }
            />
            <Route
              path="/lead/:id"
              element={
                <DemoLayout>
                  <LeadDetail />
                </DemoLayout>
              }
            />
            <Route
              path="/kanban"
              element={
                <DemoLayout>
                  <Kanban />
                </DemoLayout>
              }
            />
            <Route
              path="/users"
              element={
                <DemoLayout>
                  <Users />
                </DemoLayout>
              }
            />
            <Route
              path="/integrations"
              element={
                <DemoLayout>
                  <Integrations />
                </DemoLayout>
              }
            />
            <Route
              path="/agenda"
              element={
                <ProtectedRoute>
                  <Agenda />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tasks"
              element={
                <ProtectedRoute>
                  <Tasks />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reminders"
              element={
                <ProtectedRoute>
                  <Reminders />
                </ProtectedRoute>
              }
            />
            <Route
              path="/local-prospector"
              element={
                <DemoLayout>
                  <LocalProspector />
                </DemoLayout>
              }
            />
            <Route
              path="/bulk-import"
              element={
                <DemoLayout>
                  <BulkImport />
                </DemoLayout>
              }
            />
            <Route
              path="/whatsapp"
              element={
                <ProtectedRoute>
                  <WhatsApp />
                </ProtectedRoute>
              }
            />
            <Route
              path="/gamification"
              element={
                <ProtectedRoute>
                  <GamificationLive />
                </ProtectedRoute>
              }
            />
            <Route
              path="/help"
              element={
                <DemoLayout>
                  <Help />
                </DemoLayout>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
