"use client";

import dynamic from 'next/dynamic';

const AssistantChat = dynamic(() => import('./AssistantChat'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-[#030303] text-neutral-100 flex items-center justify-center font-sans">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-neutral-400">正在加载 AI 助手界面...</span>
      </div>
    </div>
  )
});

export default function Page() {
  return <AssistantChat />;
}
