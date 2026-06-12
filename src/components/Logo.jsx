export default function Logo({ className = 'w-10 h-10', alt = 'ECCP', layout, iconHeight }) {
  // Calculate size based on iconHeight if provided
  let sizeClass = className;
  if (iconHeight) {
    const size = `${iconHeight}px`;
    sizeClass = `w-${iconHeight / 4} h-${iconHeight / 4} ${className}`.trim();
  }

  // Handle layout if needed (for now, we'll just ignore it as the basic logo works for both layouts)
  // In the future, we could return different logo variants based on layout

  return (
    <img
      src="/logo.png"
      alt={alt}
      className={`${sizeClass} rounded-lg object-contain`}
      onError={(e) => { e.target.onerror = null; e.target.src = '/logo.svg'; }}
    />
  );
}