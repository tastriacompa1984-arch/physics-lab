import React from 'react';
import type { Metadata } from 'next';
import './globals.css';
import 'katex/dist/katex.min.css'; // Import KaTeX CSS globally for equations

export const metadata: Metadata = {
  title: '智教智学 | 智能理化交互式探索实验室',
  description: '智教智学 是一个基于 WebGL/Three.js 高精度物理算子与 AI 自然语言控制的智能交互式物理与化学实验室。',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>
        <div id="root">{children}</div>
      </body>
    </html>
  );
}
