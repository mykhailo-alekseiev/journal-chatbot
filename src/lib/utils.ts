import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Strip markdown formatting for plain text preview
 */
export function stripMarkdown(text: string): string {
  return (
    text
      // Remove bold/italic
      .replace(/\*\*(.+?)\*\*/g, "$1")
      .replace(/\*(.+?)\*/g, "$1")
      .replace(/__(.+?)__/g, "$1")
      .replace(/_(.+?)_/g, "$1")
      // Remove headers
      .replace(/^#{1,6}\s+/gm, "")
      // Remove bullet points
      .replace(/^[-*+]\s+/gm, "• ")
      // Remove numbered lists
      .replace(/^\d+\.\s+/gm, "")
      // Collapse multiple newlines
      .replace(/\n{2,}/g, " ")
      // Replace single newlines with space
      .replace(/\n/g, " ")
      // Collapse multiple spaces
      .replace(/\s{2,}/g, " ")
      .trim()
  );
}
