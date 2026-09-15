"use client";

import { useEffect } from "react";

const SUFFIX = " · SafeTrust v2";

export function useDocumentTitle(title: string) {
  useEffect(() => {
    const previous = document.title;
    document.title = `${title}${SUFFIX}`;
    return () => {
      document.title = previous;
    };
  }, [title]);
}
