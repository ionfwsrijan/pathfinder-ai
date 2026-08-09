import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import StatsCards from "@/app/(main)/interview/_components/stats-cards.jsx";

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

const makeAssessment = (quizScore, name = `quiz-${quizScore}`) => ({
  id: name,
  quizScore,
  questions: [{ id: name, question: name }],
});

const getStreakCard = () =>
  screen.getByText("Improvement Streak").closest("div").parentElement;

describe("StatsCards Improvement Streak (#2836 regression)", () => {
  it("counts consecutive improvements ending at the newest assessment", () => {
    const assessments = [
      makeAssessment(95),
      makeAssessment(90),
      makeAssessment(85),
    ];
    render(<StatsCards assessments={assessments} />);

    expect(getStreakCard().textContent).toContain("2");
  });

  it("returns 0 when the newest assessment declined", () => {
    const assessments = [
      makeAssessment(80),
      makeAssessment(85),
      makeAssessment(90),
    ];
    render(<StatsCards assessments={assessments} />);

    expect(getStreakCard().textContent).toContain("0");
  });

  it("breaks the streak at the first non-improvement", () => {
    const assessments = [
      makeAssessment(95),
      makeAssessment(90),
      makeAssessment(92),
      makeAssessment(85),
    ];
    render(<StatsCards assessments={assessments} />);

    expect(getStreakCard().textContent).toContain("1");
  });

  it("returns 0 with fewer than two assessments", () => {
    const { unmount } = render(<StatsCards assessments={[makeAssessment(90)]} />);
    expect(getStreakCard().textContent).toContain("0");
    unmount();

    render(<StatsCards assessments={[]} />);
    expect(getStreakCard().textContent).toContain("0");
  });
});
