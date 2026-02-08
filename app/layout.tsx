import "@/styles/globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "AWB Data Management System",
  description: "Manage AWB shipments and timelines"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        {children}
      </body>
    </html>
  );
}
