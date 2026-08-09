import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import StatsCards from "../app/(main)/interview/_components/stats-cards.jsx";

vi.mock("@/components/ui/card", () => ({
  Card: ({ children }) => <div>{children}</div>,
  CardHeader: ({ children }) => <div>{children}</div>,
  CardTitle: ({ children }) => <h3>{children}</h3>,
  CardContent: ({ children }) => <div>{children}</div>,
}));

vi.mock("lucide-react", () => ({
  Brain: () => null,
  Target: () => null,
  Trophy: () => null,
  Crown: () => null,
  Zap: () => null,
}));

describe("StatsCards Latest Score (#2835 regression)", () => {
  it("shows the most recent assessment score, not the oldest", () => {
    const assessments = [
      { quizScore: 92, questions: [1, 2, 3] },
      { quizScore: 70, questions: [1, 2] },
      { quizScore: 55, questions: [1] },
    ];

    render(<StatsCards assessments={assessments} />);

    const latestCard = screen.getByText("Latest Score").closest("div").parentElement;
    expect(latestCard.textContent).toContain("92.0%");
    expect(latestCard.textContent).not.toContain("55.0%");
  });

  it("renders 0% when there are no assessments", () => {
    render(<StatsCards assessments={[]} />);

    const latestCard = screen.getByText("Latest Score").closest("div").parentElement;
    expect(latestCard.textContent).toContain("0%");
  });
});
