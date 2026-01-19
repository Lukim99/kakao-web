// app/dashboard/layout.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "관리자 대시보드 | 테탑하실분", // 여기에 원하는 타이틀 입력
  description: "실시간 카카오톡 로그 저장소입니다.",
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