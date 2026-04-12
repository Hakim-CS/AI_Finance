import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import AddExpense from "./pages/AddExpense";
import Expenses from "./pages/Expenses";
import Groups from "./pages/Groups";
import Budget from "./pages/Budget";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import LoginPage from "./pages/Auth/Login"; // Import Login page
import SignupPage from "./pages/Auth/Signup"; // Import Signup page
import { AuthProvider } from "./context/AuthContext"; // Import AuthProvider
import AuthGuard from "./components/AuthGuard"; // Import AuthGuard
import UserProfilePage from "./pages/UserProfile"; // Import UserProfilePage

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppLayout>
            <Routes>
                          <Route path="/login" element={<LoginPage />} />
                          <Route path="/signup" element={<SignupPage />} />
                          <Route path="/" element={<AuthGuard><Dashboard /></AuthGuard>} />
                          <Route path="/add-expense" element={<AuthGuard><AddExpense /></AuthGuard>} />
                          <Route path="/expenses" element={<AuthGuard><Expenses /></AuthGuard>} />
                          <Route path="/groups" element={<AuthGuard><Groups /></AuthGuard>} />
                          <Route path="/budget" element={<AuthGuard><Budget /></AuthGuard>} />
                          <Route path="/settings" element={<AuthGuard><Settings /></AuthGuard>} />
                          <Route path="/settings/profile" element={<AuthGuard><UserProfilePage /></AuthGuard>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AppLayout>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
