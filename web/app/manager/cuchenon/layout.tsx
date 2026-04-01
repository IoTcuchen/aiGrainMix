import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: '쿠첸 관리자',
};

export default function CuchenonLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
