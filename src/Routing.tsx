import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ApplicationShell from "./AppShell";
import { Categories } from "./pages/Categories";
import { Brands } from "./pages/Brands";
import Dashboard from "./pages/Dashboard";
import { DashboardSettings } from "./pages/Dashboard_Settings";
import { Login } from "./pages/Login";
import { Orders } from "./pages/Order";
import { Packages } from "./pages/Packages";
import { Products } from "./pages/Products";
import { Users } from "./pages/Users";
import ProtectedRoute from "./PrivateRoute";
import { Subjects } from "./pages/Subjects";
import { SignupRef } from "./pages/SignupRef";
import { SignupVendor } from "./pages/SignupVendor";
import { Financials } from "./pages/Financials";
import { Accounts } from "./pages/Accounts";
import { Profile } from "./pages/Profile";
import Shipping from "./pages/Shipping";
import Wallet from "./pages/Wallet";
import { Success } from "./pages/Succes";
import { OrderList } from "./pages/OrderList";
import { MLM } from "./pages/Mlm";
import BankDetails from "./pages/Bankdetail";
import ChangePassword from "./pages/Chagepassword";
import AdminUpgradeRequests from "./pages/AdminUpgradeRequests";



export default function Routing() {
  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={<ProtectedRoute outlet={<ApplicationShell />} />}
        >
          <Route index element={<Dashboard />} />
          <Route path="/products" element={<Products />} />
          <Route path="/users" element={<Users />} />
          <Route path="/accounts" element={<Accounts />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/brands" element={<Brands />} />
          <Route path="/subjects" element={<Subjects />} />
          <Route path="/shipping" element={<Shipping />} />
          <Route path="/wallet" element={<Wallet />} />
          <Route path="/packages" element={<Packages />} />
          <Route path="/dashboard-settings" element={<DashboardSettings />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/order-list" element={<OrderList />} />
          <Route path="/financials" element={<Financials />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/mlm" element={<MLM /> } />
          <Route path="/Bank-detail" element={<BankDetails/>} />
          <Route path="/dashboard-password" element={<ChangePassword/>} />
          <Route path="/payment-processing" element={<AdminUpgradeRequests/>} />

        </Route>
        <Route path="/login" element={<Login />} />
        <Route path="/success" element={<Success />} />
        <Route path="/ref/signup" element={<SignupRef />} />
        <Route path="/vendor/signup" element={<SignupVendor />} />
      </Routes>
    </Router>
  );
}
