export default function AdminAssistantLayout({ children }) {
  return (
    <div className="flex h-[100dvh] min-h-0 flex-col overflow-hidden bg-[linear-gradient(180deg,#eef3f9_0%,#f7f9fc_32%,#ffffff_100%)]">
      <div className="mx-auto flex h-full min-h-0 w-full max-w-[1500px] flex-1 flex-col px-4 py-4 md:px-6 md:py-6">
        {children}
      </div>
    </div>
  );
}
