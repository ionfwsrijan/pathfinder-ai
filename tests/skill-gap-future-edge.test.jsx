import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { SkillGap } from "@/app/(main)/dashboard/_components/skill-gap.jsx";

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children }) => <div>{children}</div>,
    span: ({ children }) => <span>{children}</span>,
  },
}));

vi.mock("@/components/ui/badge", () => ({
  Badge: ({ children }) => <span>{children}</span>,
}));

vi.mock("lucide-react", () => ({
  CheckCircle2: () => null,
  Target: () => null,
  TrendingUp: () => null,
  GraduationCap: () => null,
  AlertCircle: () => null,
  Zap: () => null,
  Sparkles: () => null,
}));

describe("SkillGap Future Edge (#2839 regression)", () => {
  it("excludes an owned skill from Future Edge when only its casing differs", () => {
    render(
      <SkillGap
        insight={{ recommendedSkills: ["GraphQL"], topSkills: ["python"] }}
        userSkills={["Python"]}
      />
    );

    expect(screen.getByText("Python")).toBeTruthy();
    expect(screen.queryByText("python")).toBeNull();
    expect(screen.getByText("GraphQL")).toBeTruthy();
  });

  it("still lists a genuinely new skill in Future Edge", () => {
    render(
      <SkillGap
        insight={{ recommendedSkills: [], topSkills: ["Rust"] }}
        userSkills={["Python"]}
      />
    );

    expect(screen.getByText("Rust")).toBeTruthy();
  });

  it("filters an owned recommended skill out of Future Edge", () => {
    render(
      <SkillGap
        insight={{ recommendedSkills: ["GraphQL"], topSkills: ["graphql", "Rust"] }}
        userSkills={["GraphQL"]}
      />
    );

    expect(screen.queryByText("graphql")).toBeNull();
    expect(screen.getByText("Rust")).toBeTruthy();
  });
});
