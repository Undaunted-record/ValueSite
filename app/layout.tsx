import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ValueSite | Interactive IB Valuation Dashboard",
  description: "Build the valuation. Defend the assumptions.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
