import { NBackGame } from "@/components/NBackGame";

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white selection:bg-blue-500/30">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(17,24,39,1),rgba(0,0,0,1))] -z-10" />
      <NBackGame />
    </main>
  );
}
