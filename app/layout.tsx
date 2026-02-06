import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "EatGo",
  description: "不知道吃什麼？EatGo 幫你挑 5 間（免費版 OSM）。"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-Hant-TW">
      <body>
        <div className="min-h-screen">{children}</div>
      </body>
    </html>
  );
}
