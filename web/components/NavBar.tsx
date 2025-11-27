'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function NavBar() {
  const pathname = usePathname();
  
  const getLinkClass = (path: string) => 
    `px-4 py-2 font-bold transition-colors rounded-t-lg ${
      pathname === path 
      ? 'text-blue-400 border-b-2 border-blue-500 bg-white/5' 
      : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
    }`;

  return (
    // [수정] sticky top-0 z-50 w-full 추가 (화면 상단 고정)
    <nav className="sticky top-0 z-50 w-full flex justify-center space-x-2 p-0 pt-4 bg-brand-primary border-b border-gray-800 shadow-md backdrop-blur-md bg-opacity-90">
      <Link href="/" className={getLinkClass('/')}>
        📝 맞춤 설문
      </Link>
      <Link href="/chat" className={getLinkClass('/chat')}>
        💬 AI 챗봇
      </Link>
    </nav>
  );
}