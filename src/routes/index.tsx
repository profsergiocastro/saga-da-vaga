import { ClientOnly, createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
const Game = lazy(() => import("@/game/Game"));
export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "A Saga da Vaga — Protótipo 01: A Inscrição" },
    { name: "description", content: "RPG 2D satírico e educativo no sertão do Piauí. Jogue direto no navegador." },
  ] }),
  component: Index,
});
function Index() { return <ClientOnly fallback={<div className="game-stage font-pixel text-sun">CARREGANDO...</div>}><Suspense fallback={<div className="game-stage font-pixel text-sun">CARREGANDO...</div>}><Game /></Suspense></ClientOnly>; }
