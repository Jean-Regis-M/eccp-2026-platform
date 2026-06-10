export default function PageLoader() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="animate-spin w-10 h-10 border-4 border-equity-red border-t-transparent rounded-full mx-auto" />
        <p className="text-sm text-gray-400">Loading...</p>
      </div>
    </div>
  );
}
