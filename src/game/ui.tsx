import { useEffect, useRef, useState, type ReactNode } from "react";
import { ACHIEVEMENTS, DOCS, DOC_RULE, DOC_SHUFFLED, OBJECTIVES, QUIZ, checkDocOrder, checkQuiz, type Progress } from "./quest";

export function useKeys(handler: (e: KeyboardEvent) => void, active = true) {
  const ref = useRef(handler);
  ref.current = handler;
  useEffect(() => {
    if (!active) return;
    const h = (e: KeyboardEvent) => ref.current(e);
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [active]);
}

export function Menu({ items, onSelect, onBack, active = true }: {
  items: { label: string; disabled?: boolean }[]; onSelect: (i: number) => void; onBack?: () => void; active?: boolean;
}) {
  const [sel, setSel] = useState(0);
  useKeys((e) => {
    const k = e.key;
    if (k === "ArrowUp" || k === "w" || k === "W") { e.preventDefault(); setSel((s) => (s - 1 + items.length) % items.length); }
    else if (k === "ArrowDown" || k === "s" || k === "S") { e.preventDefault(); setSel((s) => (s + 1) % items.length); }
    else if ((k === "Enter" || k === " ") && !e.repeat) { e.preventDefault(); if (!items[sel]?.disabled) onSelect(sel); }
    else if (k === "Escape" && onBack) { e.preventDefault(); onBack(); }
  }, active);
  return (
    <div className="flex flex-col gap-2">
      {items.map((it, i) => (
        <button key={it.label} type="button" className="pixel-btn text-left" data-active={i === sel}
          disabled={it.disabled} onMouseEnter={() => setSel(i)} onClick={() => onSelect(i)}>
          <span className="pixel-cursor">{i === sel ? "▶" : ""}</span>{it.label}
        </button>
      ))}
    </div>
  );
}

export function Overlay({ children, dim = true }: { children: ReactNode; dim?: boolean }) {
  return <div className={`absolute inset-0 z-30 flex items-center justify-center p-4 ${dim ? "bg-overlay" : ""}`}>{children}</div>;
}

export function Panel({ title, children, className = "" }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <div className={`pixel-panel max-h-full overflow-y-auto ${className}`}>
      {title && <h2 className="font-pixel mb-3 text-lg text-sun">{title}</h2>}
      {children}
    </div>
  );
}

export function Key({ k }: { k: string }) {
  return <kbd className="pixel-key">{k}</kbd>;
}

export function DialogBox({ speaker, lines, onDone, blip }: { speaker: string; lines: string[]; onDone: () => void; blip: () => void }) {
  const [idx, setIdx] = useState(0);
  const [shown, setShown] = useState(0);
  const text = lines[idx] ?? "";
  useEffect(() => {
    setShown(0);
    const id = window.setInterval(() => setShown((s) => (s >= text.length ? s : s + 1)), 22);
    return () => window.clearInterval(id);
  }, [idx, text]);
  const next = () => {
    if (shown < text.length) return setShown(text.length);
    blip();
    if (idx + 1 < lines.length) setIdx(idx + 1);
    else onDone();
  };
  useKeys((e) => {
    if ((e.key === "Enter" || e.key === " ") && !e.repeat) { e.preventDefault(); next(); }
    else if (e.key === "Escape") { e.preventDefault(); onDone(); }
  });
  return (
    <div className="absolute inset-x-3 bottom-3 z-30" onClick={next}>
      <div className="pixel-panel game-dialog relative cursor-pointer">
        <span className="pixel-nametag">{speaker}</span>
        <p data-testid="dialog-body" style={{ color: "var(--paper-ink)", fontSize: "clamp(1.15rem, 2vw, 1.8rem)" }} className="font-game min-h-[3.2em] leading-relaxed">{text.slice(0, shown)}</p>
        <div style={{ color: "var(--paper-ink)" }} className="mt-1 flex justify-between font-game text-sm">
          <span>{idx + 1}/{lines.length}</span>
          <span className="animate-pulse"><Key k="Enter" /> continuar · <Key k="Esc" /> fechar</span>
        </div>
      </div>
    </div>
  );
}



const OPENING_CRAWL = [
  "HÁ MUITO TEMPO, NUM SERTÃO NÃO TÃO DISTANTE...",
  "Na pacata São Raimundo Nonato, uma força misteriosa ameaça a paz dos estudantes: a burocracia acadêmica.",
  "Um jovem aventureiro parte rumo ao IFPI com um sonho, uma caneta azul e a confiança de quem ainda não leu a lista de documentos.",
  "Sua missão parece simples: fazer uma inscrição. Mas entre ele e o destino estão formulários, cópias, prazos e um carimbo que só aparece quando ninguém está olhando.",
  "Pelo caminho, encontrará Dona Célia, guardiã dos grampos; Lia, mestra dos cálculos; e Beto, conselheiro cujos atalhos costumam aumentar o percurso.",
  "Terá de decifrar enigmas matemáticos, organizar documentos na ordem correta e sobreviver ao lendário \"volte amanhã\".",
  "Qualquer semelhança com a vida acadêmica é mera coincidência... devidamente protocolada em três vias.",
  "Prepare o teclado. Confira o CPF. Respire fundo.",
  "QUE O PROTOCOLO ESTEJA COM VOCÊ!"
];

export function OpeningCrawl({ onDone }: { onDone: () => void }) {
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    const timeout = window.setTimeout(() => doneRef.current(), 29_000);
    return () => window.clearTimeout(timeout);
  }, []);

  useKeys((e) => {
    if (["Enter", " ", "Escape"].includes(e.key) && !e.repeat) {
      e.preventDefault();
      doneRef.current();
    }
  });

  return (
    <div className="opening-crawl-overlay" onClick={() => doneRef.current()} data-testid="opening-crawl">
      <div className="crawl-stars" aria-hidden="true" />
      <div className="crawl-perspective" aria-hidden="true">
        <div className="crawl-track">
          <h2 className="crawl-heading">A SAGA DA VAGA</h2>
          {OPENING_CRAWL.map((line, i) => (
            <p key={line} className={i === 0 || i === OPENING_CRAWL.length - 1 ? "crawl-emphasis" : ""}>{line}</p>
          ))}
        </div>
      </div>
      <div className="crawl-footer">
        <span>EPISÓDIO I · A INSCRIÇÃO</span>
        <button type="button" className="crawl-skip" onClick={(e) => { e.stopPropagation(); doneRef.current(); }}>
          Pular introdução <span>ENTER</span>
        </button>
      </div>
    </div>
  );
}

export function QuizModal({ onSolved, onWrong, onClose }: { onSolved: () => void; onWrong: () => void; onClose: () => void }) {
  const [sel, setSel] = useState(0);
  const [result, setResult] = useState<null | { ok: boolean; picked: number }>(null);
  const answer = (i: number) => {
    const ok = checkQuiz(i);
    setResult({ ok, picked: i });
    if (!ok) onWrong();
  };
  useKeys((e) => {
    const k = e.key;
    if (k === "Escape") { e.preventDefault(); return onClose(); }
    if (result) {
      if ((k === "Enter" || k === " ") && !e.repeat) { e.preventDefault(); if (result.ok) onSolved(); else setResult(null); }
      return;
    }
    if (["1", "2", "3", "4"].includes(k)) { e.preventDefault(); setSel(+k - 1); answer(+k - 1); }
    else if (k === "ArrowUp" || k === "ArrowLeft" || k === "w" || k === "a") { e.preventDefault(); setSel((s) => (s + 3) % 4); }
    else if (k === "ArrowDown" || k === "ArrowRight" || k === "s" || k === "d") { e.preventDefault(); setSel((s) => (s + 1) % 4); }
    else if ((k === "Enter" || k === " ") && !e.repeat) { e.preventDefault(); answer(sel); }
  });
  return (
    <Overlay>
      <Panel title="QUESTÃO DE AQUECIMENTO" className="w-full max-w-xl">
        <p className="font-game mb-4 text-xl text-panel-foreground">{QUIZ.question}</p>
        <div className="grid grid-cols-2 gap-2">
          {QUIZ.options.map((o, i) => (
            <button key={o} type="button" className="pixel-btn" data-active={i === sel}
              data-state={result && result.picked === i ? (result.ok ? "right" : "wrong") : undefined}
              disabled={!!result} onMouseEnter={() => setSel(i)} onClick={() => answer(i)}>
              <span className="text-muted-foreground">{i + 1})</span> {o}
            </button>
          ))}
        </div>
        {result && (
          <div className={`mt-4 pixel-feedback ${result.ok ? "is-right" : "is-wrong"}`}>
            <p className="font-pixel text-sm">{result.ok ? "CORRETO!" : "QUASE..."}</p>
            <p className="font-game text-lg">{result.ok ? QUIZ.explanation : QUIZ.wrongHints[result.picked]}</p>
            <p className="font-game mt-2 text-sm opacity-80">
              <Key k="Enter" /> {result.ok ? "continuar" : "tentar de novo"}
            </p>
          </div>
        )}
        {!result && <p className="font-game mt-3 text-sm text-muted-foreground"><Key k="1-4" /> ou setas + <Key k="Enter" /> · <Key k="Esc" /> sair</p>}
      </Panel>
    </Overlay>
  );
}

export function DocsModal({ onSolved, onWrong, onClose }: { onSolved: () => void; onWrong: () => void; onClose: () => void }) {
  const [order, setOrder] = useState<string[]>([]);
  const [result, setResult] = useState<null | boolean>(null);
  const pick = (id: string) => { if (result === null && !order.includes(id) && order.length < 4) setOrder([...order, id]); };
  const confirm = () => {
    if (order.length < 4) return;
    const ok = checkDocOrder(order);
    setResult(ok);
    if (!ok) onWrong();
  };
  const retry = () => { setOrder([]); setResult(null); };
  useKeys((e) => {
    const k = e.key;
    if (k === "Escape") { e.preventDefault(); return onClose(); }
    if (result !== null) {
      if ((k === "Enter" || k === " ") && !e.repeat) { e.preventDefault(); if (result) onSolved(); else retry(); }
      return;
    }
    if (["1", "2", "3", "4"].includes(k)) { e.preventDefault(); pick(DOC_SHUFFLED[+k - 1] ?? ""); }
    else if (k === "Backspace") { e.preventDefault(); setOrder(order.slice(0, -1)); }
    else if (k === "Enter" && !e.repeat) { e.preventDefault(); confirm(); }
  });
  return (
    <Overlay>
      <Panel title="ORGANIZE OS DOCUMENTOS" className="w-full max-w-2xl">
        <p className="font-game mb-3 text-lg text-sun">{DOC_RULE}</p>
        <div className="grid grid-cols-4 gap-2">
          {DOC_SHUFFLED.map((id, i) => (
            <button key={id} type="button" className="pixel-doc" data-used={order.includes(id)} onClick={() => pick(id)}>
              <span className="font-pixel text-xs">[{i + 1}]</span>
              <span className="font-pixel text-base">{DOCS[id]?.short}</span>
              <span className="font-game text-sm leading-tight">{DOCS[id]?.label}</span>
            </button>
          ))}
        </div>
        <p className="font-pixel mt-4 mb-2 text-xs text-muted-foreground">PILHA PARA GRAMPEAR</p>
        <div className="grid grid-cols-4 gap-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="pixel-slot font-game text-base">{order[i] ? `${i + 1}. ${DOCS[order[i] ?? ""]?.label}` : `${i + 1}. —`}</div>
          ))}
        </div>
        {result !== null ? (
          <div className={`mt-4 pixel-feedback ${result ? "is-right" : "is-wrong"}`}>
            <p className="font-pixel text-sm">{result ? "GRAMPEADO!" : "INDEFERIDO!"}</p>
            <p className="font-game text-lg">
              {result ? "Ordem perfeita! Dona Célia está emocionada." : "Dona Célia ergueu o carimbo, ameaçadora. Releia a regra do edital e tente de novo."}
            </p>
            <p className="font-game mt-1 text-sm opacity-80"><Key k="Enter" /> {result ? "receber formulário" : "tentar de novo"}</p>
          </div>
        ) : (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
            <p className="font-game text-sm text-muted-foreground"><Key k="1-4" /> escolher · <Key k="⌫" /> desfazer · <Key k="Esc" /> sair</p>
            <div className="flex gap-2">
              <button type="button" className="pixel-btn" onClick={() => setOrder(order.slice(0, -1))}>Desfazer</button>
              <button type="button" className="pixel-btn" data-active disabled={order.length < 4} onClick={confirm}>Grampear [Enter]</button>
            </div>
          </div>
        )}
      </Panel>
    </Overlay>
  );
}

export function Notebook({ p, onClose, onEnding }: { p: Progress; onClose: () => void; onEnding: () => void }) {
  useKeys((e) => { if (e.key === "Escape" || e.key === "j" || e.key === "J") { e.preventDefault(); onClose(); } });
  const steps = ["Ouvir o boato do Beto", "Organizar documentos e pegar o formulário", "Resolver a questão com a Lia", "Entregar tudo ao Fiscal do Edital"];
  return (
    <Overlay>
      <Panel title="CADERNO" className="pixel-notebook w-full max-w-2xl">
        <div className="grid gap-4 md:grid-cols-2">
          <section>
            <h3 className="font-pixel mb-1 text-sm">MISSÃO: A INSCRIÇÃO</h3>
            <p className="font-game mb-2 text-lg">▶ {OBJECTIVES[p.step]?.title}</p>
            <ul className="font-game space-y-0.5 text-base">
              {steps.map((s, i) => <li key={s} className={i < p.step ? "line-through opacity-60" : ""}>{i < p.step ? "☑" : "☐"} {s}</li>)}
            </ul>
            {p.step >= 1 && (
              <div className="mt-3">
                <h3 className="font-pixel mb-1 text-sm">ANOTAÇÃO</h3>
                <p className="font-game text-base">{DOC_RULE}</p>
                <p className="font-game text-sm opacity-70">RG = quem você é · CPF = seu número · Histórico = o que estudou · Comprovante = onde mora</p>
              </div>
            )}
          </section>
          <section>
            <h3 className="font-pixel mb-1 text-sm">ITENS</h3>
            <p className="font-game mb-2 text-base">{p.items.length ? p.items.join(" · ") : "Uma caneta azul e muita esperança."}</p>
            <h3 className="font-pixel mb-1 text-sm">MATÉRIAS RESOLVIDAS</h3>
            <p className="font-game mb-2 text-base">{p.solved.length ? p.solved.join(" · ") : "Nenhuma ainda."}</p>
            <h3 className="font-pixel mb-1 text-sm">CONQUISTAS</h3>
            <ul className="font-game space-y-0.5 text-base">
              {Object.entries(ACHIEVEMENTS).map(([id, a]) => (
                <li key={id} className={p.achievements.includes(id) ? "" : "opacity-40"}>
                  {p.achievements.includes(id) ? "★" : "☆"} <b>{a.name}</b> — {p.achievements.includes(id) ? a.desc : "???"}
                </li>
              ))}
            </ul>
          </section>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          {p.step >= 4 && <button type="button" className="pixel-btn" onClick={onEnding}>Ver cena final</button>}
          <button type="button" className="pixel-btn" data-active onClick={onClose}>Fechar [J]</button>
        </div>
      </Panel>
    </Overlay>
  );
}

export function HelpModal({ onClose }: { onClose: () => void }) {
  useKeys((e) => { if (e.key === "Escape" || e.key === "h" || e.key === "H") { e.preventDefault(); onClose(); } });
  return (
    <Overlay>
      <Panel title="COMO JOGAR" className="w-full max-w-xl">
        <ul className="font-game space-y-1 text-lg text-panel-foreground">
          <li><Key k="WASD" /> ou <Key k="Setas" /> andar</li>
          <li><Key k="Enter" /> / <Key k="Espaço" /> falar, interagir, avançar diálogo</li>
          <li><Key k="J" /> caderno de missão · <Key k="H" /> esta ajuda</li>
          <li><Key k="Esc" /> pausa (salvar, som, reiniciar)</li>
        </ul>
        <p className="font-game mt-3 text-lg">Siga o objetivo no topo da tela. O <span className="text-sun">!</span> amarelo mostra quem você deve procurar. Errou um desafio? Sem problema: é só tentar de novo.</p>
        <p className="font-game mt-3 text-sm text-muted-foreground">Protótipo independente, inspirado por fãs. Não é um produto oficial do IFPI. Locais e personagens são fictícios.</p>
        <div className="mt-4 flex justify-end"><button type="button" className="pixel-btn" data-active onClick={onClose}>Entendi [H]</button></div>
      </Panel>
    </Overlay>
  );
}

export function Confirm({ text, onYes, onNo }: { text: string; onYes: () => void; onNo: () => void }) {
  return (
    <Overlay>
      <Panel title="TEM CERTEZA?" className="w-full max-w-sm">
        <p className="font-game mb-3 text-lg">{text}</p>
        <Menu items={[{ label: "Sim" }, { label: "Não" }]} onSelect={(i) => (i === 0 ? onYes() : onNo())} onBack={onNo} />
      </Panel>
    </Overlay>
  );
}