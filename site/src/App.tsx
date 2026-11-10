import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/hooks/useLanguage";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Home from "@/pages/Home";
import LegalMentions from "@/pages/LegalMentions";

function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="text-6xl font-black text-primary-500 mb-4">404</div>
        <div className="text-xl font-bold text-gray-900 mb-2">Page introuvable</div>
        <a href="/" className="text-primary-500 hover:underline text-sm">
          ← Retour à l'accueil
        </a>
      </div>
    </div>
  );
}

function AppLayout() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/mentions-legales" element={<LegalMentions />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Footer />
    </>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <BrowserRouter>
        <AppLayout />
      </BrowserRouter>
    </LanguageProvider>
  );
}
