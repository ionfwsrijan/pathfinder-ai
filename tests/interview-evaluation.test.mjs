import { describe, expect, it, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  checkRateLimit: vi.fn(),
  decrementRateLimit: vi.fn(),
  generateGeminiContent: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: mocks.auth,
}));

vi.mock("@/lib/db/prisma", () => ({
  db: {
    user: { findUnique: vi.fn() },
    assessment: { create: vi.fn(), findMany: vi.fn(), findFirst: vi.fn() },
  },
}));

vi.mock("@/lib/security/rate-limit-actions", () => ({
  checkRateLimit: mocks.checkRateLimit,
  decrementRateLimit: mocks.decrementRateLimit,
  formatResetTime: vi.fn().mockReturnValue("10m"),
}));

vi.mock("@/lib/ai/gemini", () => ({
  generateGeminiContent: mocks.generateGeminiContent,
}));

vi.mock("@/lib/cache", () => ({
  cachedGenerateGeminiContent: vi.fn(),
  QUIZ_CACHE_TTL_MS: 24 * 60 * 60 * 1000,
  generateCacheKey: vi.fn(),
  getCacheStore: vi.fn(),
}));

import {
  evaluateVoiceAnswer,
  evaluateVideoAnswer,
} from "../actions/interview.js";

describe("evaluateVoiceAnswer / evaluateVideoAnswer (#2840 regression)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue({ userId: "user-1" });
    mocks.checkRateLimit.mockResolvedValue({ allowed: true });
  });

  it("exports both evaluation actions", () => {
    expect(typeof evaluateVoiceAnswer).toBe("function");
    expect(typeof evaluateVideoAnswer).toBe("function");
  });

  it("returns voice feedback when the AI response validates", async () => {
    mocks.generateGeminiContent.mockResolvedValue({
      response: {
        text: () =>
          JSON.stringify({
            score: 85,
            fillerWordsCount: 3,
            confidence: "High",
            feedback: "Your answer was very structured, but you used 'um' a few times.",
          }),
      },
    });

    const res = await evaluateVoiceAnswer("Tell me about yourself.", "I am a developer.");

    expect(res.success).toBe(true);
    expect(res.data).toEqual({
      score: 85,
      fillerWordsCount: 3,
      confidence: "High",
      feedback: "Your answer was very structured, but you used 'um' a few times.",
    });
  });

  it("returns video feedback including body language metrics", async () => {
    mocks.generateGeminiContent.mockResolvedValue({
      response: {
        text: () =>
          JSON.stringify({
            score: 80,
            fillerWordsCount: 1,
            confidence: "Medium",
            bodyLanguageFeedback: "You maintained good eye contact and presence.",
            verbalFeedback: "Your answer was structured, but slightly rushed.",
          }),
      },
    });

    const metrics = {
      faceDetectedPercentage: 95,
      smileFrequency: "High",
      eyeContactConsistency: "Good",
    };
    const res = await evaluateVideoAnswer("Tell me about yourself.", "I am a developer.", metrics);

    expect(res.success).toBe(true);
    expect(res.data).toMatchObject({
      score: 80,
      bodyLanguageFeedback: expect.any(String),
      verbalFeedback: expect.any(String),
    });
  });

  it("rejects AI output that does not match the strict schema", async () => {
    mocks.generateGeminiContent.mockResolvedValue({
      response: {
        text: () =>
          JSON.stringify({
            score: 85,
            fillerWordsCount: 3,
            confidence: "High",
            feedback: "Good answer.",
            unexpectedField: "extra",
          }),
      },
    });

    const res = await evaluateVoiceAnswer("Tell me about yourself.", "I am a developer.");

    expect(res.success).toBe(false);
    expect(res.error).toBe("AI returned an unexpected format.");
  });

  it("does not call the AI when the rate limit is denied", async () => {
    mocks.checkRateLimit.mockResolvedValue({ allowed: false, resetAt: new Date() });

    const res = await evaluateVoiceAnswer("Tell me about yourself.", "I am a developer.");

    expect(res.success).toBe(false);
    expect(res.error).toContain("limit reached");
    expect(mocks.generateGeminiContent).not.toHaveBeenCalled();
  });

  it("returns an error shape instead of throwing when unauthenticated", async () => {
    mocks.auth.mockResolvedValue({ userId: null });

    const res = await evaluateVideoAnswer("Tell me about yourself.", "I am a developer.", {});

    expect(res.success).toBe(false);
    expect(typeof res.error).toBe("string");
    expect(mocks.generateGeminiContent).not.toHaveBeenCalled();
  });
});
