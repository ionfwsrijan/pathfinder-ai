import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ResumeBuilder from "../app/(main)/resume/_components/resume-builder.jsx";

const mocks = vi.hoisted(() => ({
  toast: { error: vi.fn(), success: vi.fn() },
  saveResumeFn: vi.fn(),
  handleSubmitSpy: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: mocks.toast,
}));

vi.mock("@/actions/resume", () => ({
  saveResume: vi.fn(),
}));

vi.mock("@/hooks/use-fetch", () => ({
  default: () => ({
    loading: false,
    data: null,
    error: null,
    fn: mocks.saveResumeFn,
  }),
}));

vi.mock("@clerk/nextjs", () => ({
  useUser: () => ({ user: { fullName: "Test User" } }),
}));

vi.mock("react-hook-form", () => ({
  useForm: () => ({
    control: {},
    register: vi.fn(),
    handleSubmit: (cb) => () => {
      mocks.handleSubmitSpy(cb);
      cb({});
    },
    watch: vi.fn(() => ({
      contactInfo: {},
      summary: "",
      skills: "",
      experience: [],
      education: [],
      projects: [],
    })),
    formState: { errors: {} },
  }),
  Controller: ({ render }) => render({ field: { value: "", onChange: vi.fn() } }),
}));

vi.mock("lucide-react", () => {
  const icons = {};
  for (const name of ["AlertTriangle", "Download", "Edit", "Loader2", "Monitor", "Save"]) {
    icons[name] = () => null;
  }
  return icons;
});

vi.mock("react-markdown", () => ({
  default: ({ children }) => <div>{children}</div>,
}));

vi.mock("remark-gfm", () => ({ default: vi.fn() }));
vi.mock("rehype-sanitize", () => ({ default: vi.fn() }));

vi.mock("@/components/ui/button", () => ({
  Button: ({ children, ...props }) => <button {...props}>{children}</button>,
}));

vi.mock("@/components/ui/tabs", () => ({
  Tabs: ({ children }) => <div>{children}</div>,
  TabsList: ({ children }) => <div>{children}</div>,
  TabsTrigger: ({ value, children }) => <button data-tab={value}>{children}</button>,
  TabsContent: ({ value, children }) => <div data-content={value}>{children}</div>,
}));

vi.mock("@/components/ui/textarea", () => ({
  Textarea: (props) => <textarea {...props} />,
}));

vi.mock("@/components/ui/input", () => ({
  Input: (props) => <input {...props} />,
}));

vi.mock("../app/(main)/resume/_components/entry-form.jsx", () => ({
  EntryForm: () => null,
}));

const RESUME_CONTENT = "## Professional Summary\n\nBuilding products for the web.\n\n## Skills\n\nJavaScript, React";

function getSaveButton() {
  return screen.getByRole("button", { name: /save/i });
}

describe("ResumeBuilder Save behavior", () => {
  it("saves markdown directly from the Markdown tab without form validation", () => {
    render(<ResumeBuilder initialContent={RESUME_CONTENT} />);

    fireEvent.click(getSaveButton());

    expect(mocks.handleSubmitSpy).not.toHaveBeenCalled();
    expect(mocks.saveResumeFn).toHaveBeenCalledWith(RESUME_CONTENT);
  });

  it("shows an error toast and skips the save when the markdown is empty", () => {
    render(<ResumeBuilder initialContent={"   \n\n   "} />);

    fireEvent.click(getSaveButton());

    expect(mocks.toast.error).toHaveBeenCalledWith("Nothing to save. Add resume content first.");
    expect(mocks.saveResumeFn).not.toHaveBeenCalled();
    expect(mocks.handleSubmitSpy).not.toHaveBeenCalled();
  });

  it("routes the save through the form when the Form tab is active", () => {
    render(<ResumeBuilder initialContent={undefined} />);

    fireEvent.click(getSaveButton());

    expect(mocks.handleSubmitSpy).toHaveBeenCalled();
    expect(mocks.saveResumeFn).toHaveBeenCalled();
  });
});
