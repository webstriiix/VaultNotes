export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0D1117] text-white">
      <div className="text-center">
        <h1 className="text-6xl font-bold mb-4">404</h1>
        <p className="text-2xl mb-4">Page Not Found</p>
        <a
          href="/dashboard"
          className="text-blue-400 hover:underline text-lg"
        >
          Back to Home
        </a>
      </div>
    </div>
  );
}
