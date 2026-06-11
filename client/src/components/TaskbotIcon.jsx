// Taskbot AI icon — 4-point starburst, Claude/Anthropic-inspired
export default function TaskbotIcon({ size = 16, color = 'currentColor', style = {} }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={style}>
      {/* Vertical ray */}
      <path d="M8 1L8.9 6.5 8 7.8 7.1 6.5Z" fill={color} />
      <path d="M8 15L8.9 9.5 8 8.2 7.1 9.5Z" fill={color} />
      {/* Horizontal ray */}
      <path d="M1 8L6.5 7.1 7.8 8 6.5 8.9Z" fill={color} />
      <path d="M15 8L9.5 7.1 8.2 8 9.5 8.9Z" fill={color} />
    </svg>
  );
}
