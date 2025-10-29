import "./globals.css";

export const metadata = {
  title: "Terapias Manuais Samuel Abóbora",
  description: "Promoção de bem-estar físico e mental através de terapias manuais.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt">
      <body>{children}</body>
    </html>
  );
}
