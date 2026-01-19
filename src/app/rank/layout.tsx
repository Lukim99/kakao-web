// app/dashboard/layout.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "테탑하실분 채팅 순위",
  description: "테탑하실분 채팅 순위표를 보여주는 사이트",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
    </>
  );
}