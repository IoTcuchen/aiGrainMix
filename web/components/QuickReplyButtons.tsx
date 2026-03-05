import React from 'react';

interface QuickReplyButtonsProps {
  options: string[];
  onSelect: (option: string) => void;
  isLoading: boolean;
}

function QuickReplyButtonsComponent({ options, onSelect, isLoading }: QuickReplyButtonsProps) {
  if (!options || options.length === 0) {
    return null;
  }

  return (
    <div className="bg-brand-primary px-4 md:px-6 pb-3 pt-1">
      <div className="max-w-4xl mx-auto flex flex-wrap justify-start gap-2">
        {options.map((option) => (
          <button
            key={option}
            onClick={() => onSelect(option)}
            disabled={isLoading}
            className="px-4 py-2 bg-brand-secondary border border-gray-300 text-brand-text text-sm font-semibold rounded-full hover:bg-user-bubble hover:text-white hover:border-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

const QuickReplyButtons = React.memo(QuickReplyButtonsComponent);

export default QuickReplyButtons;
