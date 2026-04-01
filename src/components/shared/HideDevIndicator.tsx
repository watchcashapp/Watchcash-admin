"use client";
import { useEffect } from "react";

export default function HideDevIndicator() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;

    const hideIndicator = () => {
      // Find all possible Next.js dev indicator portal elements
      const elements = document.querySelectorAll('nextjs-portal, [data-nextjs-toast], next-dev-indicator');
      elements.forEach(el => {
        // Option 1: Delete it (safest way to remove it entirely from DOM)
        // Ensure we don't crash Next.js by catching errors if it gets mad
        try {
          el.remove();
        } catch (e) {}
      });
    };

    // Run initially
    hideIndicator();

    // Set up an observer since Next.js often re-adds it dynamically or after hydration
    const observer = new MutationObserver(() => {
      hideIndicator();
    });

    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  return null;
}
