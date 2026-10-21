import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DialogBox, OpeningCrawl } from "@/game/ui";

afterEach(() => {
  vi.useRealTimers();
});

describe("dialogue and opening crawl", () => {
  it("shows dialogue text in a readable dark ink and advances through lines", () => {
    vi.useFakeTimers();
    const onDone = vi.fn();
    const blip = vi.fn();
    render(<DialogBox speaker="Beto" lines={["Primeira linha visível.", "Segunda linha visível."]} onDone={onDone} blip={blip} />);

    const body = screen.getByTestId("dialog-body");
    expect(body).toHaveStyle({ color: "var(--paper-ink)" });
    expect(screen.getByText("Beto")).toBeVisible();

    act(() => { vi.advanceTimersByTime(1200); });
    expect(body).toHaveTextContent("Primeira linha visível.");

    fireEvent.keyDown(window, { key: "Enter" });
    act(() => { vi.advanceTimersByTime(1200); });
    expect(body).toHaveTextContent("Segunda linha visível.");

    fireEvent.keyDown(window, { key: "Enter" });
    expect(onDone).toHaveBeenCalledTimes(1);
    expect(blip).toHaveBeenCalledTimes(2);
  });

  it("shows the comic intro and lets the player skip to the menu", () => {
    const onDone = vi.fn();
    render(<OpeningCrawl onDone={onDone} />);
    expect(screen.getByTestId("opening-crawl")).toBeVisible();
    expect(screen.getByText(/A SAGA DA VAGA/)).toBeVisible();
    expect(screen.getByText(/carimbo que só aparece/)).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: /Pular introdução/i }));
    expect(onDone).toHaveBeenCalledTimes(1);
  });
});
