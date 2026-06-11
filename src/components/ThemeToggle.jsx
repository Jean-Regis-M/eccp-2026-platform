import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle({ className = '' }) {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
      className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all hover:scale-105 ${className}`}
    >
      <span className="text-lg">{theme === 'dark' ? '☀️' : '🌙'}</span>
      <span className="hidden sm:inline">{theme === 'dark' ? 'Light' : 'Dark'}</span>
    </button>
  );
}
