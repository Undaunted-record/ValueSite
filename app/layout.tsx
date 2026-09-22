import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ValueSite | 인터랙티브 IB 밸류에이션 대시보드",
  description: "기업가치를 계산하고, 가정을 검증하세요.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
