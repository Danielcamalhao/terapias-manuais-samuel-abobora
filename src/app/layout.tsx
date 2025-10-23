import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import { Inter, Outfit } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-inter",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata = {
  title: "Terapias Manuais Samuel Abóbora",
  description: "Clínica de Osteopatia e Massagem em Lisboa",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt" className={`${inter.variable} ${outfit.variable}`}>
      <body className="text-gray-900 bg-gray-50 pt-16">
        <Navbar />
        {children}
      </body>
    </html>
  );
}
