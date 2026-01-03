"use client";

export function FeedbackButton() {
  const handleClick = () => {
    window.location.href = "https://semperadmin.github.io/Sentinel/#detail/naval-letter-formatter/todo";
  };

  return (
    <button
      onClick={handleClick}
      title="Share Feedback"
      className="feedback-btn"
      style={{
        position: 'fixed',
        bottom: '2rem',
        right: '2rem',
        background: 'linear-gradient(45deg, #b8860b, #ffd700)',
        color: 'white',
        textShadow: '0 0 3px #0066cc, 0 0 6px #0066cc',
        border: 'none',
        padding: '0.75rem 1.25rem',
        borderRadius: '50px',
        fontSize: '1rem',
        fontWeight: 600,
        cursor: 'pointer',
        boxShadow: '0 4px 12px rgba(184, 134, 11, 0.3)',
        transition: 'all 0.3s ease',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        fontFamily: 'sans-serif',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'linear-gradient(45deg, #996c09, #e6c200)';
        e.currentTarget.style.boxShadow = '0 6px 16px rgba(184, 134, 11, 0.4)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'linear-gradient(45deg, #b8860b, #ffd700)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(184, 134, 11, 0.3)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
      onMouseDown={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
    >
      <span role="img" aria-label="feedback">💬</span> Feedback
    </button>
  );
}
