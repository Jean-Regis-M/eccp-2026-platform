export default function Logo({ className = 'w-10 h-10', alt = 'ECCP' }) {
  return (
    <img
      src="/logo.png"
      alt={alt}
      className={`${className} rounded-lg object-contain`}
      onError={(e) => { e.target.onerror = null; e.target.src = '/logo.svg'; }}
    />
  );
}
