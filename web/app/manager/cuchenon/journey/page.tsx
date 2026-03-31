'use client';

import React, { useState } from 'react';
import {
    UserCheck,
    LayoutDashboard,
    Settings2,
    PlayCircle,
    BellRing,
    ChevronRight,
    Smartphone,
    Wifi,
    Clock,
    CheckCircle2,
    Zap,
    Star,
    RefreshCw,
    AlertCircle,
    Power,
    MapPin,
    ArrowBigRightDash,
    Touchpad,
    Activity
} from 'lucide-react';

const StepCard = ({
    step,
    title,
    description,
    icon: Icon,
    color,
    isActive,
    onClick
}: {
    step: number;
    title: string;
    description: string;
    icon: any;
    color: string;
    isActive: boolean;
    onClick: () => void;
}) => (
    <div
        onClick={onClick}
        className={`group relative flex flex-col p-6 rounded-2xl border transition-all duration-300 cursor-pointer overflow-hidden ${isActive
            ? `bg-white dark:bg-gray-800 border-${color}-500 shadow-xl scale-[1.02] ring-1 ring-${color}-400/50`
            : 'bg-white/50 dark:bg-gray-900/50 border-gray-100 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 hover:bg-white dark:hover:bg-gray-800 shadow-sm'
            }`}
    >
        <div className={`absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 bg-${color}-500/5 rounded-full blur-3xl group-hover:bg-${color}-500/10 transition-colors`}></div>

        <div className="flex items-start gap-4 mb-4">
            <div className={`flex-shrink-0 w-12 h-12 rounded-xl bg-${color}-50 dark:bg-${color}-900/20 flex items-center justify-center text-${color}-600 dark:text-${color}-400 group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
                <Icon size={24} />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full bg-${color}-100 dark:bg-${color}-900/30 text-${color}-700 dark:text-${color}-300`}>
                        Step {step}
                    </span>
                    {isActive && <Zap size={14} className="text-yellow-500 animate-pulse" />}
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-1 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors truncate">
                    {title}
                </h3>
            </div>
            <ChevronRight className={`text-gray-300 transition-transform duration-300 ${isActive ? 'rotate-90 text-orange-500' : 'group-hover:translate-x-1'}`} />
        </div>

        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
            {description}
        </p>
    </div>
);

export default function UserJourneyDashboard() {
    const [activeStep, setActiveStep] = useState<number>(1);

    const steps = [
        {
            step: 1,
            title: "앱 진입 및 로그인",
            description: "사용자가 스마트폰에서 쿠첸 앱을 실행하고 기기를 연결하는 과정입니다.",
            icon: UserCheck,
            color: "blue",
            longDescription: [
                "사용자가 스마트폰에서 쿠첸 앱을 실행합니다.",
                "계정(ID/PW)을 통해 로그인합니다.",
                "내 계정에 등록된 스마트 밥솥 목록이 화면에 나타납니다. (아직 밥솥이 없다면 '기기 등록' 과정을 거쳐 Wi-Fi(2.4G) 통해 밥솥을 추가합니다.)"
            ],
            badge: "Access & Connect",
            points: ["ID/PW 로그인", "목록 기반 기기 관리", "Wi-Fi(2.4G) 가이드"]
        },
        {
            step: 2,
            title: "밥솥 상태 확인",
            description: "등록된 밥솥의 현재 작동 모드와 라이브 상태를 한눈에 파악합니다.",
            icon: LayoutDashboard,
            color: "emerald",
            longDescription: [
                "밥솥 목록 중 하나를 선택해 들어가면 내 밥솥의 현재 상태를 한눈에 볼 수 있습니다.",
                "대기중: 밥솥이 켜져있고 취사 준비가 된 상태",
                "취사중: 현재 밥을 짓고 있는 상태 (가운데 원형 차트로 남은 시간 표시, 예: 남은 시간 약 15:00)",
                "보온중 / 예약중: 보온 경과 시간 표시 또는 예약취사 완료 예상 시간 표시",
                "오프라인: 밥솥 전원이 꺼져 있거나 Wi-Fi 연결이 끊어진 상태"
            ],
            badge: "Live Status Monitoring",
            points: ["대기/취사/보온/예약/오프라인", "원형 차트 남은 시간 표시", "실시간 연동 체크"]
        },
        {
            step: 3,
            title: "요리/취사 메뉴 선택 및 커스텀",
            description: "입맛에 맞는 정밀한 취사 옵션을 설정하고 나만의 레시피를 구성합니다.",
            icon: Settings2,
            color: "orange",
            longDescription: [
                "대기중인 밥솥에서 밥을 하기 위해 요리 메뉴를 탐색합니다.",
                "기본 메뉴 (예: 찰진/고슬백미, 현미100, 잡곡 등) 혹은 요리 메뉴 (예: 만능찜, 수비드 등)를 선택합니다.",
                "상세 조절 (커스텀): 사용자 취향에 맞게 불림 단계 / 뜸 단계를 세밀하게 추가합니다 (불림 1단계, 뜸 2단계 등).",
                "수비드나 만능찜 같은 메뉴일 경우 원하는 온도와 시간을 직접 설정합니다.",
                "자주 먹는 밥맛 조합이 있다면 '마이레시피(즐겨찾기)'에 등록해 두고 버튼 하나로 불러올 수 있습니다."
            ],
            badge: "Personalized Settings",
            points: ["메뉴 탐색 (기본/요리)", "불림/뜸 단계 조절", "마이레시피 즐겨찾기", "온도/시간 설정 (특수메뉴)"]
        },
        {
            step: 4,
            title: "취사 명령 하달 및 실시간 확인",
            description: "물리적 거리에 상관없이 앱을 통해 원격으로 취사를 시작하고 진행률을 확인합니다.",
            icon: PlayCircle,
            color: "indigo",
            longDescription: [
                "앱에서 '취사 시작' (또는 '예약 취사') 버튼을 누릅니다.",
                "버튼 클릭 즉시 주방에 있는 실제 밥솥에 명령이 전달되어 알림음과 함께 취사가 시작됩니다.",
                "거실이나 밖에서도 앱 화면을 열면 실시간으로 밥솥이 어떤 단계를 거치고 있는지, 예상 남은 시간이 얼마나 되는지 (예: 14분, 13분...) 동그란 애니메이션 타임라인을 통해 확인 가능합니다."
            ],
            badge: "Remote Command & Tracking",
            points: ["원격 취사 시작/예약", "명령 즉시 동기화", "타임라인 애니메이션 추적"]
        },
        {
            step: 5,
            title: "완료 알림 및 사후 관리",
            description: "완료 푸시 알림을 받고 기기의 상태를 확인합니다.",
            icon: BellRing,
            color: "rose",
            longDescription: [
                "취사가 모두 끝나 밥이 완성되면 스마트폰으로 '취사가 완료되었습니다'라는 푸시 알림(팝업 메세지)이 옵니다.",
                "밥솥은 자동으로 보온 상태로 넘어가며 (앱 설정에 따라 취사 후 보온 안 함 처리도 가능), 앱에서 보온이 몇 시간째 유지되고 있는지 확인 가능합니다."
            ],
            badge: "Completion & Auto-care",
            points: ["취사 완료 푸시 팝업", "자동 보온 전환", "보온 경과 시간 기록"]
        }
    ];

    const activeData = steps[activeStep - 1];

    return (
        <div className="space-y-8 pb-10 animate-fade-in overflow-visible h-full">
            {/* Header section in White Square */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#1F2937] p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 dark:border-gray-800">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Activity className="text-orange-600" /> 사용자 관점 쿠첸 IoT 앱 동작 Flow
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        실제 사용자가 쿠첸 스마트 밥솥 앱을 활용해 밥을 지어먹고 알림을 받기까지의 단계별 흐름입니다.
                    </p>
                </div>
                <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 p-2 px-4 rounded-xl border border-gray-100 dark:border-gray-700">
                    <Smartphone size={16} className="text-[#FF6B00]" />
                    <span className="text-sm font-semibold">User Centric Lifecycle</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Left: Step Selection (Vertical Timeline) */}
                <div className="lg:col-span-12 xl:col-span-5 space-y-4">
                    {steps.map((s) => (
                        <StepCard
                            key={s.step}
                            {...s}
                            isActive={activeStep === s.step}
                            onClick={() => setActiveStep(s.step)}
                        />
                    ))}
                </div>

                {/* Right: Detailed Content (Text Focused) */}
                <div className="lg:col-span-12 xl:col-span-7 xl:sticky xl:top-8">
                    <div className="bg-white dark:bg-[#1F2937] p-8 lg:p-12 rounded-3xl shadow-[0_20px_50px_-20px_rgba(0,0,0,0.1)] border border-gray-100 dark:border-gray-800 min-h-[600px] flex flex-col items-start relative overflow-hidden">
                        {/* Background Decoration */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/5 rounded-full -ml-32 -mb-32 blur-3xl"></div>

                        <div className="relative z-10 w-full">
                            <div className="flex items-center gap-3 mb-6">
                                <div className={`w-14 h-14 rounded-2xl bg-${activeData.color}-50 dark:bg-${activeData.color}-900/20 flex items-center justify-center text-${activeData.color}-600 dark:text-${activeData.color}-400 shadow-sm border border-${activeData.color}-100/50 dark:border-${activeData.color}-800/50`}>
                                    <activeData.icon size={32} />
                                </div>
                                <div>
                                    <span className={`text-xs font-bold uppercase tracking-wider text-${activeData.color}-600 dark:text-${activeData.color}-400 mb-1 block`}>
                                        {activeData.badge}
                                    </span>
                                    <h1 className="text-3xl font-black text-gray-900 dark:text-white leading-tight">
                                        Step {activeData.step}. {activeData.title}
                                    </h1>
                                </div>
                            </div>

                            <div className="h-px bg-gray-100 dark:bg-gray-800 w-full mb-8"></div>

                            <div className="space-y-8">
                                <div className="space-y-4">
                                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                        <ArrowBigRightDash size={16} /> Detailed Process
                                    </h4>
                                    <div className="space-y-4">
                                        {activeData.longDescription.map((desc, idx) => (
                                            <p key={idx} className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed font-medium">
                                                {desc}
                                            </p>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                                    <div className="bg-gray-50/50 dark:bg-gray-800/50 p-6 rounded-2xl border border-gray-100 dark:border-gray-800">
                                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <Star size={14} className="text-orange-500" /> Key Elements
                                        </h4>
                                        <ul className="space-y-3">
                                            {activeData.points.map((p, idx) => (
                                                <li key={idx} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                                    <div className={`w-1.5 h-1.5 rounded-full bg-${activeData.color}-500 flex-shrink-0`}></div>
                                                    {p}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div className={`bg-${activeData.color}-50/30 dark:bg-${activeData.color}-900/10 p-6 rounded-2xl border border-${activeData.color}-100/50 dark:border-${activeData.color}-800/50 flex flex-col justify-between`}>
                                        <div>
                                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                <Smartphone size={14} /> UI Logic
                                            </h4>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                                                {activeStep === 1 ? "Wi-Fi 페어링 가이드와 기기 동기화 로직이 앱에서 활성화됩니다." :
                                                    activeStep === 2 ? "기기 상태값(Ready/Cooking/Warm)에 따른 동적 UI 렌더링이 수행됩니다." :
                                                        activeStep === 3 ? "불림/뜸 단계별 파라미터 값 설정 및 마이레시피 데이터 저장이 가능합니다." :
                                                            activeStep === 4 ? "앱 -> 서버 -> 기기로 이어지는 실시간 원격 명령 프로토콜이 동작합니다." :
                                                                "푸시 서버(GCM/APNs)를 통한 실시간 알림 전송 및 로그 확인이 완료됩니다."}
                                            </p>
                                        </div>
                                        <div className="mt-4 flex justify-end">
                                            <div className={`p-2 rounded-lg bg-${activeData.color}-500/10 text-${activeData.color}-600`}>
                                                {activeStep === 2 ? <Power size={20} /> :
                                                    activeStep === 1 ? <Wifi size={20} /> :
                                                        activeStep === 3 ? <Touchpad size={20} /> :
                                                            activeStep === 4 ? <Zap size={20} /> :
                                                                <CheckCircle2 size={20} />}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Pagination indicator */}
                        <div className="absolute bottom-6 left-12 flex gap-1 items-center">
                            {steps.map(s => (
                                <div
                                    key={s.step}
                                    className={`h-1.5 rounded-full transition-all duration-300 ${activeStep === s.step ? 'w-8 bg-orange-600' : 'w-2 bg-gray-200 dark:bg-gray-700'}`}
                                ></div>
                            ))}
                            <span className="ml-4 text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Step {activeStep}/5</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
