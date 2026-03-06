import React from 'react';

interface QuickReplyButtonsProps {
  options: string[];
  onSelect: (option: string) => void;
  isLoading: boolean;
}

const QuickReplyButtons: React.FC<QuickReplyButtonsProps> = ({ options, onSelect, isLoading }) => {
  if (!options || options.length === 0) {
    return null;
  }

  return (
    <div className="px-4 md:px-6 pb-3 pt-1">
      <div className="max-w-4xl mx-auto flex flex-wrap justify-start gap-2">
        {options.map((option) => (
          <button
            key={option}
            onClick={() => onSelect(option)}
            disabled={isLoading}
            className="px-4 py-2.5 bg-white dark:bg-[#1F2937] border border-[#E5E8EB] dark:border-[#3F3F3F] text-[#191F28] dark:text-white text-sm font-semibold rounded-xl shadow-sm hover:border-[#FF6B00] hover:text-[#FF6B00] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuickReplyButtons;
