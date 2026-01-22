'use client';

interface ReturnModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

export default function ReturnModal({ isOpen, onClose, onConfirm }: ReturnModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-xl animate-in fade-in zoom-in duration-200">
                <div className="p-6 text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                        <svg
                            className="h-6 w-6 text-green-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M5 13l4 4L19 7"
                            />
                        </svg>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">추천 전송 완료!</h3>
                    <p className="mt-2 text-sm text-gray-500">
                        잡곡 추천 결과가 쿠첸ON으로 전송되었습니다.<br />
                        쿠첸ON 앱으로 돌아가시겠습니까?
                    </p>
                </div>
                <div className="flex border-t border-gray-100 bg-gray-50">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100 focus:outline-none"
                    >
                        아니오 (계속 대화)
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 border-l border-gray-100 px-4 py-3 text-sm font-bold text-blue-600 hover:bg-blue-50 focus:outline-none"
                    >
                        예 (이동하기)
                    </button>
                </div>
            </div>
        </div>
    );
}