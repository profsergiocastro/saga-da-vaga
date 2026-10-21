import { describe, expect, it } from "vitest";
import { apply, checkDocOrder, checkQuiz, dialogFor, initialProgress, QUIZ } from "@/game/quest";

describe("A Inscrição quest", () => {
  it("quiz: only R$ 30 is correct", () => {
    expect(QUIZ.options[QUIZ.correct]).toBe("R$ 30");
    expect(checkQuiz(1)).toBe(true);
    expect([0, 2, 3].some(checkQuiz)).toBe(false);
  });

  it("docs must follow RG, CPF, histórico, comprovante", () => {
    expect(checkDocOrder(["identidade", "cpf", "historico", "comprovante"])).toBe(true);
    expect(checkDocOrder(["cpf", "identidade", "historico", "comprovante"])).toBe(false);
    expect(checkDocOrder(["identidade", "cpf", "historico"])).toBe(false);
  });

  it("steps advance only in order and wrong answers never block", () => {
    let p = initialProgress();
    p = apply(p, "quizOk");
    expect(p.step).toBe(0);
    p = apply(p, "beto");
    expect(p.step).toBe(1);
    p = apply(p, "docsFail");
    expect(p.step).toBe(1);
    p = apply(p, "docsOk");
    expect(p.step).toBe(2);
    expect(p.items).toContain("Formulário de inscrição");
    p = apply(apply(p, "quizFail"), "quizOk");
    expect(p.step).toBe(3);
    p = apply(p, "finish");
    expect(p.step).toBe(4);
    expect(p.achievements).toContain("inscrito");
  });

  it("fiscal refuses before step 3", () => {
    expect(dialogFor("fiscal", { ...initialProgress(), step: 2 }).action).toBeUndefined();
    expect(dialogFor("fiscal", { ...initialProgress(), step: 3 }).action).toBe("finish");
  });
});