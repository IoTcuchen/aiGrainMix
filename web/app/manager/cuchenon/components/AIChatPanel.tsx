"use client";

import { useState, useRef, useEffect } from 'react';
import { Bot, Send, X, MessageSquare, Loader2, Table as TableIcon, BarChart2, PieChart as PieChartIcon, LineChart as LineChartIcon } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    chartData?: {
        type: string;
        data: any[];
        query: string;
    };
    isAiLoading?: boolean;
}

const COLORS = ['#FF6B00', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#14B8A6', '#6366F1'];

export default function AIChatPanel() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([{
        id: 'initial',
        role: 'assistant',
        content: "안녕하세요! CuchenON AI 데이터 애널리스트입니다. 궁금하신 취사 통계를 자연어로 여쭤보시면, 제가 쿼리를 추출하여 실시간으로 그려드리겠습니다. (예: 지난주 인기 메뉴 탑5가 뭐야?)"
    }]);
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: input };
        const loadingMsg: ChatMessage = { id: (Date.now() + 1).toString(), role: 'assistant', content: "", isAiLoading: true };

        setMessages(prev => [...prev, userMsg, loadingMsg]);
        setInput('');

        try {
            // 파이썬 LangChain 서버 호출
            // /api/manager_chat 의 포트는 8000입니다 (agent 서버) 
            // web/ next.config.js 에 rewrites 혹은 절대경로 호출 필요. 로컬이므로 절대경로 임시 사용
            const NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

            const res = await fetch(`${NEXT_PUBLIC_API_URL}/manager_chat/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userMsg.content })
            });
            const data = await res.json();

            setMessages(prev => {
                const updated = [...prev];
                updated.pop(); // remove loading message
                if (data.status === 'error') {
                    updated.push({ id: Date.now().toString(), role: 'assistant', content: `[에러] ${data.message}` });
                } else {
                    updated.push({
                        id: Date.now().toString(),
                        role: 'assistant',
                        content: `데이터 분석이 완료되었습니다. (추천 타입: **${data.chart_type}**)\n사용한 쿼리: \`${data.query}\``,
                        chartData: {
                            type: data.chart_type,
                            data: data.data,
                            query: data.query
                        }
                    });
                }
                return updated;
            });
        } catch (e: any) {
            setMessages(prev => {
                const updated = [...prev];
                updated.pop();
                updated.push({ id: Date.now().toString(), role: 'assistant', content: `[서버 통신 오류] ${e.message}` });
                return updated;
            });
        }
    };

    const renderChart = (chartData: any) => {
        const { type, data } = chartData;
        if (!data || data.length === 0) return <div className="text-sm text-gray-500 p-4 border rounded bg-gray-50 dark:bg-gray-800">조건에 맞는 데이터가 없습니다.</div>;

        // 동적으로 X/Y축 키를 찾기 위함
        const keys = Object.keys(data[0]);
        // 숫자가 아닌 키를 name(X축)으로, 숫자인 키를 값(Y축)으로 취급하는 기초 로직
        const nameKey = keys.find(k => typeof data[0][k] === 'string' || Number.isNaN(Number(data[0][k]))) || keys[0];
        const valueKey = keys.find(k => k !== nameKey) || keys[1];

        if (type === 'bar') {
            return (
                <div className="h-64 w-full mt-4 bg-white dark:bg-gray-800 rounded-lg p-2 border border-blue-100 shadow-sm">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey={nameKey} tick={{ fontSize: 12 }} />
                            <YAxis tick={{ fontSize: 12 }} />
                            <Tooltip contentStyle={{ borderRadius: '8px' }} cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
                            <Bar dataKey={valueKey} fill="#FF6B00" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            );
        } else if (type === 'line') {
            return (
                <div className="h-64 w-full mt-4 bg-white dark:bg-gray-800 rounded-lg p-2 border border-blue-100 shadow-sm">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey={nameKey} tick={{ fontSize: 12 }} />
                            <YAxis tick={{ fontSize: 12 }} />
                            <Tooltip contentStyle={{ borderRadius: '8px' }} />
                            <Line type="monotone" dataKey={valueKey} stroke="#10B981" strokeWidth={3} dot={{ r: 4 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            );
        } else if (type === 'pie') {
            return (
                <div className="h-64 w-full mt-4 bg-white dark:bg-gray-800 rounded-lg p-2 border border-blue-100 shadow-sm">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={data} cx="50%" cy="50%" innerRadius={40} outerRadius={80} dataKey={valueKey} nameKey={nameKey} label>
                                {data.map((_: any, idx: number) => <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />)}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            );
        } else {
            // Default: table
            return (
                <div className="mt-4 overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                            <tr>
                                {keys.map(k => <th key={k} className="px-4 py-3">{k}</th>)}
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((row: any, idx: number) => (
                                <tr key={idx} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                                    {keys.map(k => <td key={`${idx}-${k}`} className="px-4 py-3 text-gray-900 dark:text-white">{row[k]}</td>)}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            );
        }
    };

    return (
        <>
            {/* 챗봇 열기 버튼 */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-6 right-6 w-14 h-14 bg-[#FF6B00] hover:bg-orange-600 text-white rounded-full shadow-2xl flex items-center justify-center transition-all animate-bounce hover:animate-none z-50 group"
                >
                    <MessageSquare size={24} />
                    <span className="absolute right-16 px-3 py-1.5 bg-black text-white text-xs font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap hidden md:block">
                        AI 데이터 애널리스트
                    </span>
                    {/* 알림 도트 */}
                    <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 border-2 border-white rounded-full"></span>
                </button>
            )}

            {/* 챗봇 패널 */}
            {isOpen && (
                <div className="fixed bottom-6 right-6 w-[90vw] md:w-[450px] lg:w-[500px] h-[80vh] max-h-[700px] bg-white dark:bg-[#111827] flex flex-col rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 z-50 animate-fade-in overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-[#FF6B00] to-orange-500 text-white">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-lg">
                                <Bot size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold">Text-to-SQL 애널리스트</h3>
                                <p className="text-xs opacity-80">AI 기반 실시간 통계 조수</p>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Messages Body */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-5 bg-gray-50/50 dark:bg-gray-900/50 relative">
                        {messages.map((msg) => (
                            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${msg.role === 'user'
                                    ? 'bg-[#FF6B00] text-white rounded-tr-sm'
                                    : 'bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-tl-sm text-gray-800 dark:text-gray-200'
                                    }`}>
                                    {msg.isAiLoading ? (
                                        <div className="flex items-center gap-2">
                                            <Loader2 size={16} className="animate-spin text-orange-500" />
                                            <span className="text-sm font-medium animate-pulse">DB 쿼리 분석 및 렌더링 중...</span>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</div>
                                            {msg.chartData && renderChart(msg.chartData)}
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Footer */}
                    <div className="p-4 bg-white dark:bg-[#111827] border-t border-gray-100 dark:border-gray-800">
                        <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900 rounded-xl p-1 shadow-inner border border-gray-200 dark:border-gray-700">
                            <input
                                type="text"
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSend()}
                                placeholder="예: 지난주 가장 많이 조리된 레시피 5개는?"
                                className="flex-1 bg-transparent px-4 py-2.5 outline-none text-sm text-gray-700 dark:text-gray-300 placeholder-gray-400"
                            />
                            <button
                                onClick={handleSend}
                                disabled={!input.trim()}
                                className="p-2.5 bg-[#FF6B00] text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <Send size={18} />
                            </button>
                        </div>
                        <div className="mt-2 text-[10px] text-center text-gray-400 flex items-center justify-center gap-3">
                            <span className="flex items-center gap-1"><LineChartIcon size={10} /> 차트 최적화</span>
                            <span className="flex items-center gap-1"><TableIcon size={10} /> 정형 데이터 구조화</span>
                            <span className="flex items-center gap-1 text-[#FF6B00]"><Bot size={10} /> OpenAI GPT-4o-mini</span>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
