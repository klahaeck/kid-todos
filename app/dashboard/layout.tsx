export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-0 w-full flex-1 flex-col overflow-y-auto">
      <div className="m-auto box-border w-full max-w-5xl">{children}</div>
    </div>
  );
}
