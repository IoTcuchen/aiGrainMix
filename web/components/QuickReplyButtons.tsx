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
    // FIX: Updated styles for dark mode consistency
    <div className="bg-brand-primary px-4 md:px-6 pb-3 pt-1">
      <div className="max-w-4xl mx-auto flex flex-wrap justify-start gap-2">
        {options.map((option) => (
          <button
            key={option}
            onClick={() => onSelect(option)}
            disabled={isLoading}
            // FIX: Updated styles for dark mode consistency
            className="px-4 py-2 bg-brand-secondary border border-gray-600 text-brand-text text-sm font-semibold rounded-full hover:bg-user-bubble hover:text-white hover:border-transparent focus:outline-none focus:ring-2 focus:ring-user-bubble/50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuickReplyButtons;
