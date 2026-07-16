import { useState } from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';

export default function MessageFeedback({ messageId }) {
  const [feedback, setFeedback] = useState(null);

  function handleFeedback(type) {
    setFeedback((prev) => (prev === type ? null : type));
  }

  return (
    <div className="flex items-center gap-1.5 mt-3">
      <button
        onClick={() => handleFeedback('like')}
        className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200 ${
          feedback === 'like'
            ? 'text-primary bg-primary-light'
            : 'text-muted-dark hover:text-primary hover:bg-primary-light'
        }`}
        aria-label="Like"
      >
        <ThumbsUp className={`w-4 h-4 ${feedback === 'like' ? 'fill-current' : ''}`} />
      </button>
      <button
        onClick={() => handleFeedback('dislike')}
        className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200 ${
          feedback === 'dislike'
            ? 'text-error bg-error/5'
            : 'text-muted-dark hover:text-error hover:bg-error/5'
        }`}
        aria-label="Dislike"
      >
        <ThumbsDown className={`w-4 h-4 ${feedback === 'dislike' ? 'fill-current' : ''}`} />
      </button>
    </div>
  );
}
