import DashboardLayout from '@/components/layout/DashboardLayout';

export default function SessionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
