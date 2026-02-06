"use client";

import React from "react";

export class ErrorBoundary extends React.Component<
  { fallback?: React.ReactNode; children: React.ReactNode },
  { hasError: boolean; message?: string }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, message: undefined };
  }

  static getDerivedStateFromError(err: any) {
    return { hasError: true, message: String(err?.message ?? err) };
  }

  componentDidCatch(err: any) {
    // 讓你在 Vercel / 瀏覽器 console 看得到
    console.error("ErrorBoundary caught:", err);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="rounded-3xl bg-rose-500/10 p-6 text-rose-200 ring-1 ring-rose-400/20">
            <div className="text-lg font-semibold">前端渲染失敗</div>
            <div className="mt-2 text-sm opacity-90">{this.state.message}</div>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
