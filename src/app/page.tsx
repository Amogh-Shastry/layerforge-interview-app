import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6">
      {/* Atmospheric background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-[#adc6ff]/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-[#0267b8]/5 rounded-full blur-[100px]" />
      </div>

      <div className="glass-panel rounded-xl p-8 max-w-lg w-full text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#adc6ff]/10 border border-[#adc6ff]/20 rounded-full">
          <span className="w-2 h-2 bg-[#adc6ff] rounded-full active-pulse" />
          <span className="font-mono text-[11px] text-[#adc6ff] uppercase tracking-widest">Platform Online</span>
        </div>
        <h1 className="font-display text-4xl font-bold text-[#d4e4fa] tracking-tight">AIEval Pro</h1>
        <p className="text-[#c2c6d6]/80 text-base leading-relaxed">
          Enterprise AI Interview Automation Platform by DeepStation
        </p>
        <div className="flex flex-col gap-3">
          <Link
            href="/interview/start/pos-senior-python"
            className="w-full py-3 bg-[#adc6ff] text-[#002e6a] font-mono font-bold rounded-lg hover:brightness-110 transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">person_search</span>
            Candidate Interview Demo
          </Link>
          <Link
            href="/dashboard"
            className="w-full py-3 border border-white/10 hover:bg-white/5 text-[#d4e4fa] font-mono text-sm rounded-lg transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">dashboard</span>
            HR Dashboard
          </Link>
        </div>
        <div className="flex items-center justify-center gap-4 opacity-40">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">lock</span>
            <span className="font-mono text-[11px] uppercase tracking-widest">E2E Encrypted</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">auto_awesome</span>
            <span className="font-mono text-[11px] uppercase tracking-widest">AI Moderated</span>
          </div>
        </div>
      </div>
    </main>
  );
}
