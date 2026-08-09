import React from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import PortfolioContentEditor from "../app/(main)/portfolio-builder/_components/portfolio-content-editor.jsx";

const mocks = vi.hoisted(() => ({
  updatePortfolio: vi.fn(),
  toast: {
    loading: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/actions/portfolio-builder", () => ({
  updatePortfolio: mocks.updatePortfolio,
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({ children, ...props }) => <button {...props}>{children}</button>,
}));

vi.mock("@/components/ui/input", () => ({
  Input: (props) => <input {...props} />,
}));

vi.mock("@/components/ui/textarea", () => ({
  Textarea: (props) => <textarea {...props} />,
}));

vi.mock("sonner", () => ({
  toast: mocks.toast,
}));

vi.mock("lucide-react", () => ({
  Trash2: () => null,
  Plus: () => null,
  Save: () => null,
}));

const basePortfolio = (content) => ({ content });

describe("PortfolioContentEditor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("initializes fields from the portfolio content on mount", () => {
    render(
      <PortfolioContentEditor
        portfolio={basePortfolio({ hero: { headline: "Initial Headline" }, skills: ["React", "Node"] })}
        onUpdate={vi.fn()}
      />
    );

    expect(screen.getByLabelText("Headline").value).toBe("Initial Headline");
    expect(screen.getByLabelText("Comma Separated Skills").value).toBe("React, Node");
  });

  it("re-syncs with the portfolio when content changes (e.g. after regeneration)", () => {
    const { rerender } = render(
      <PortfolioContentEditor
        portfolio={basePortfolio({ hero: { headline: "Stale Headline" } })}
        onUpdate={vi.fn()}
      />
    );

    expect(screen.getByLabelText("Headline").value).toBe("Stale Headline");

    rerender(
      <PortfolioContentEditor
        portfolio={basePortfolio({ hero: { headline: "AI Generated Headline" } })}
        onUpdate={vi.fn()}
      />
    );

    expect(screen.getByLabelText("Headline").value).toBe("AI Generated Headline");
  });

  it("does not clobber in-progress edits when the portfolio prop is unchanged", () => {
    const portfolio = basePortfolio({ hero: { headline: "Original" } });
    const { rerender } = render(<PortfolioContentEditor portfolio={portfolio} onUpdate={vi.fn()} />);

    const headline = screen.getByLabelText("Headline");
    fireEvent.change(headline, { target: { value: "In-progress edit" } });
    expect(headline.value).toBe("In-progress edit");

    rerender(<PortfolioContentEditor portfolio={portfolio} onUpdate={vi.fn()} />);

    expect(screen.getByLabelText("Headline").value).toBe("In-progress edit");
  });

  it("saves the current content and notifies the parent with the result", async () => {
    const onUpdate = vi.fn();
    const savedData = { content: { hero: { headline: "Edited Headline" } } };
    mocks.updatePortfolio.mockResolvedValue({ success: true, data: savedData });

    render(
      <PortfolioContentEditor
        portfolio={basePortfolio({ hero: { headline: "Original" } })}
        onUpdate={onUpdate}
      />
    );

    fireEvent.change(screen.getByLabelText("Headline"), { target: { value: "Edited Headline" } });
    fireEvent.click(screen.getByRole("button", { name: /save content/i }));

    await waitFor(() =>
      expect(mocks.updatePortfolio).toHaveBeenCalledWith({
        content: expect.objectContaining({ hero: { headline: "Edited Headline" } }),
      })
    );
    expect(onUpdate).toHaveBeenCalledWith(savedData);
    expect(mocks.toast.success).toHaveBeenCalled();
  });
});
