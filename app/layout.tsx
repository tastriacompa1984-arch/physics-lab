import React from 'react';
import type { Metadata } from 'next';
import './globals.css';
import 'katex/dist/katex.min.css'; // Import KaTeX CSS globally for equations

export const metadata: Metadata = {
  title: '智教智学——基于LLM自动生成深景互动教学系统',
  description: '智教智学是一个基于大语言模型（LLM）与 WebGL/Three.js 高精度物理化学仿真算子自动生成深景互动课件与数字化探究教学的智能教学系统。',
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
