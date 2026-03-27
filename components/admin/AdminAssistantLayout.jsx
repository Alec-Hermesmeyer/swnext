export default function AdminAssistantLayout({ children }) {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#eef3f9_0%,#f7f9fc_32%,#ffffff_100%)]">
      <div className="mx-auto w-full max-w-[1500px] px-4 py-4 md:px-6 md:py-6">
        {children}
      </div>
    </div>
  );
}
