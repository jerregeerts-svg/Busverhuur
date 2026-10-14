import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "@/lib/auth";
import { ToastProvider } from "@/components/ui";
import { Layout } from "@/components/Layout";
import { Home } from "@/pages/Home";
import { Vehicles } from "@/pages/Vehicles";
import { Pricing } from "@/pages/Pricing";
import { Book } from "@/pages/Book";
import { Contact } from "@/pages/Contact";
import { Account } from "@/pages/Account";
import { Admin } from "@/pages/Admin";

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Home />} />
              <Route path="/voertuigen" element={<Vehicles />} />
              <Route path="/tarieven" element={<Pricing />} />
              <Route path="/boeken" element={<Book />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/account" element={<Account />} />
              <Route path="/beheer" element={<Admin />} />
              <Route path="*" element={<Home />} />
            </Route>
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
