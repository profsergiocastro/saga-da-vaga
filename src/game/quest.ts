// Pure quest logic for "A Inscrição" — no DOM, fully testable.

export type Progress = {
  step: number; // 0 Beto, 1 Célia (docs), 2 Lia (quiz), 3 Fiscal, 4 done
  items: string[];
  achievements: string[];
  solved: string[];
  quizWrong: number;
  docsWrong: number;
};

export type Action = "beto" | "docs" | "docsOk" | "docsFail" | "quiz" | "quizOk" | "quizFail" | "finish";

export const initialProgress = (): Progress => ({
  step: 0,
  items: [],
  achievements: [],
  solved: [],
  quizWrong: 0,
  docsWrong: 0,
});

export const OBJECTIVES: { title: string; hint: string }[] = [
  { title: "Descubra o que é necessário para se inscrever", hint: "Dizem que o Beto anda espalhando boatos na praça." },
  { title: "Pegue o formulário na Papelaria da Célia", hint: "A papelaria fica na rua principal, a leste. Organize os documentos!" },
  { title: "Resolva a questão do formulário com a Lia", hint: "A Lia estuda na praça, ao lado do banco." },
  { title: "Entregue tudo ao Fiscal do Edital", hint: "Siga a rua até o portão do campus." },
  { title: "Missão concluída! Explore o campus", hint: "O portão está aberto. Próximo episódio: A Preparação Lendária." },
];

export const DOCS: Record<string, { label: string; short: string; clue: string }> = {
  identidade: { label: "Carteira de Identidade", short: "RG", clue: "quem você é" },
  cpf: { label: "CPF", short: "CPF", clue: "seu número" },
  historico: { label: "Histórico Escolar", short: "HIST", clue: "o que estudou" },
  comprovante: { label: "Comprovante de Residência", short: "END", clue: "onde mora" },
};
export const DOC_ORDER = ["identidade", "cpf", "historico", "comprovante"];
export const DOC_SHUFFLED = ["historico", "comprovante", "identidade", "cpf"];
export const DOC_RULE =
  "Edital, item 4.2: primeiro QUEM VOCÊ É, depois SEU NÚMERO, depois O QUE ESTUDOU e, por fim, ONDE MORA.";

export function checkDocOrder(order: string[]): boolean {
  return order.length === DOC_ORDER.length && order.every((d, i) => d === DOC_ORDER[i]);
}

export const QUIZ = {
  question: "Uma apostila custa R$ 40 e tem desconto de 25%. Quanto será pago?",
  options: ["R$ 10", "R$ 30", "R$ 35", "R$ 45"],
  correct: 1,
  explanation: "25% de 40 é 40 × 0,25 = 10. Esse é o desconto. Então pagamos 40 − 10 = R$ 30.",
  wrongHints: [
    "R$ 10 é só o valor do desconto — falta tirar ele do preço!",
    "",
    "R$ 35 seria um desconto de R$ 5, ou seja, 12,5%. Confira a conta.",
    "R$ 45 é mais caro que o preço! Desconto diminui, não aumenta.",
  ],
};

export function checkQuiz(index: number): boolean {
  return index === QUIZ.correct;
}

export const ACHIEVEMENTS: Record<string, { name: string; desc: string }> = {
  boato: { name: "Ouvinte de Boatos", desc: "Conversou com o Beto e sobreviveu." },
  grampo: { name: "Grampeador Profissional", desc: "Organizou os documentos na ordem do edital." },
  porcento: { name: "Mestre dos 25%", desc: "Resolveu a questão de porcentagem." },
  persist: { name: "Errar Faz Parte", desc: "Errou, respirou e tentou de novo." },
  inscrito: { name: "Inscrito com Louvor Burocrático", desc: "Concluiu a missão A Inscrição." },
};

const add = (arr: string[], v: string) => (arr.includes(v) ? arr : [...arr, v]);

export function apply(p: Progress, action: Action): Progress {
  switch (action) {
    case "beto":
      return p.step === 0 ? { ...p, step: 1, achievements: add(p.achievements, "boato") } : p;
    case "docsFail":
      return { ...p, docsWrong: p.docsWrong + 1, achievements: add(p.achievements, "persist") };
    case "docsOk":
      return p.step === 1
        ? { ...p, step: 2, items: add(p.items, "Formulário de inscrição"), achievements: add(p.achievements, "grampo") }
        : p;
    case "quizFail":
      return { ...p, quizWrong: p.quizWrong + 1, achievements: add(p.achievements, "persist") };
    case "quizOk":
      return p.step === 2
        ? { ...p, step: 3, solved: add(p.solved, "Matemática: porcentagem e desconto"), achievements: add(p.achievements, "porcento") }
        : p;
    case "finish":
      return p.step === 3
        ? { ...p, step: 4, items: add(p.items, "Selo de Inscrição Carimbada"), achievements: add(p.achievements, "inscrito") }
        : p;
    default:
      return p;
  }
}

export type NpcId = "beto" | "celia" | "lia" | "fiscal";
export type Talk = { lines: string[]; action?: Action };

const BETO_JOKES = [
  "Novo boato: quem tirar 10 ganha um jegue com wi-fi. Fonte: confia.",
  "Dizem que o edital tem 300 páginas... e 299 são anexos do anexo.",
  "Eu? Estudar? Tô fazendo pesquisa de campo. Aqui na praça. Na sombra.",
];

export function dialogFor(npc: NpcId, p: Progress, talkCount = 0): Talk {
  if (npc === "beto") {
    if (p.step === 0)
      return {
        action: "beto",
        lines: [
          "E aí! Tá com cara de quem vai se inscrever no Instituto, hein?",
          "Ouvi dizer que pra passar tem que decorar a lista telefônica de Teresina inteirinha.",
          "E que a prova é feita em cima de um bode, ao meio-dia, no sol de São Raimundo!",
          "...Tá, tá, é boato. Mas uma coisa é verdade: sem a papelada certa, ninguém entra.",
          "A Dona Célia da Papelaria entende mais de papel que cartório. Vai lá falar com ela!",
        ],
      };
    return { lines: [BETO_JOKES[talkCount % BETO_JOKES.length] ?? ""] };
  }
  if (npc === "celia") {
    if (p.step === 0)
      return {
        lines: [
          "Bom dia, freguês! Aqui tem caneta, grampo, xerox e opinião. De graça, só a opinião.",
          "O Beto tá lá na praça espalhando boato de novo. Pergunta pra ele o que anda ouvindo.",
        ],
      };
    if (p.step === 1)
      return {
        action: "docs",
        lines: [
          "Inscrição no Instituto? Ah, meu filho, meu coração de papelaria até acelerou!",
          "Formulário eu tenho. Mas daqui ninguém sai com papel bagunçado, não senhor.",
          "Organize seus documentos na ordem do edital, item 4.2. Anotei no seu caderno.",
          "Errou a ordem, eu carimbo INDEFERIDO na sua testa. Brincadeira. Quase.",
        ],
      };
    return {
      lines: [
        talkCount % 2 === 0
          ? "A primeira xerox é cara. A segunda é saudade. Boa sorte na inscrição!"
          : "Grampo torto é o começo do caos, viu? Mantenha tudo alinhado.",
      ],
    };
  }
  if (npc === "lia") {
    if (p.step < 2)
      return {
        lines: [
          "Oi! Tô revisando porcentagem debaixo dessa sombra abençoada.",
          "Quando você tiver o formulário em mãos, passa aqui que eu te ajudo com a parte de conta.",
        ],
      };
    if (p.step === 2)
      return {
        action: "quiz",
        lines: [
          "Deixa eu ver o formulário... 'Questão de aquecimento obrigatória'. Que edital criativo!",
          "Lembra: porcentagem é uma parte do todo dividido em cem pedacinhos.",
          "Lê com calma e responde. Se errar, tenta de novo. Errar faz parte do estudo.",
        ],
      };
    return { lines: ["Revisão é tipo protetor solar: todo dia, um pouquinho. Até a próxima!"] };
  }
  // fiscal
  if (p.step < 3)
    return {
      lines: [
        "ALTO LÁ! Fiscal do Edital, matrícula 0001-B, carimbo em punho.",
        "Para passar: formulário, documentos em ordem e a questão de aquecimento resolvida.",
        p.step < 2
          ? "Ainda falta o formulário. Dizem que a Papelaria da Célia é o lugar."
          : "Ainda falta resolver a questão do formulário. A Lia, na praça, manja de contas.",
        "Sem isso, nem a sombra do portão eu libero.",
      ],
    };
  if (p.step === 3)
    return {
      action: "finish",
      lines: [
        "Hmm... deixe-me conferir. Formulário: ok. Documentos: em ordem. Conta: R$ 30, correto!",
        "Carimbando... carimbando... CARIMBADO!",
        "Parabéns! Sua inscrição foi recebida. O portão está aberto pra você conhecer o campus.",
      ],
    };
  return { lines: ["Circulando, futuro estudante! E não pise na grama recém-carimbada."] };
}