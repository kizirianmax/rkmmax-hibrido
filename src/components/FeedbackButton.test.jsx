// src/components/FeedbackButton.test.jsx
// Setup global fetch mock BEFORE imports
global.fetch = jest.fn();

/* eslint-disable import/first */
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import FeedbackButton from "./FeedbackButton.jsx";
/* eslint-enable import/first */

// Mock Sentry and Analytics
jest.mock("../lib/sentry.js", () => ({
  captureMessage: jest.fn(),
}));

jest.mock("../lib/analytics.js", () => ({
  trackEvent: jest.fn(),
  Events: { FEEDBACK_SUBMITTED: "feedback_submitted" },
}));

describe("FeedbackButton Component", () => {
  beforeEach(() => {
    global.fetch.mockClear();
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
      text: async () => "success"
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("renders feedback button", () => {
    render(<FeedbackButton />);
    const button = screen.getByRole("button", { name: /feedback/i });
    expect(button).toBeInTheDocument();
  });

  test("opens feedback form when button is clicked", () => {
    render(<FeedbackButton />);
    const button = screen.getByRole("button", { name: /feedback/i });
    fireEvent.click(button);

    expect(screen.getByText(/enviar feedback/i)).toBeInTheDocument();
  });

  test("closes form when close button is clicked", () => {
    render(<FeedbackButton />);
    const openButton = screen.getByRole("button", { name: /feedback/i });
    fireEvent.click(openButton);

    const closeButton = screen.getByRole("button", { name: /fechar/i });
    fireEvent.click(closeButton);

    expect(screen.queryByText(/enviar feedback/i)).not.toBeInTheDocument();
  });

  test("submits feedback successfully", async () => {
    render(<FeedbackButton />);
    const openButton = screen.getByRole("button", { name: /feedback/i });
    fireEvent.click(openButton);

    const textarea = screen.getByPlaceholderText(/descreva o problema/i);
    fireEvent.change(textarea, { target: { value: "Test feedback" } });

    const submitButton = screen.getByRole("button", { name: /enviar feedback/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/feedback enviado/i)).toBeInTheDocument();
    });
  });
});
