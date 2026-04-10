import { GridPatternTailwind } from "@/components/GridPatternTailwind";

export default function AdminAssistantLayout({ children }) {
  return (
    <div className="relative flex h-[100dvh] min-h-0 flex-col overflow-hidden bg-gradient-to-r from-red-700 via-white to-[#0b2a5a]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-r from-red-700 via-white to-[#0b2a5a]" />
        <div className="absolute inset-0 opacity-70">
          <GridPatternTailwind
            yOffset={0}
            interactive
            className="h-full w-full"
            patternStroke="#ffffff"
            patternOpacity={0.8}
            blockFill="#ffffff"
            blockOpacity={0.12}
            hoveredBlockFill="#ffffff"
            hoveredBlockOpacity={0.28}
          />
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.22),transparent_54%),linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))]" />
      </div>

      <div className="relative z-10 mx-auto flex h-full min-h-0 w-full max-w-[1500px] flex-1 flex-col px-4 py-4 md:px-6 md:py-6">
        {children}
      </div>
    </div>
  );
}
