import { useNavigate } from "react-router-dom";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-6xl font-extrabold mb-4 bg-gradient-to-r from-[#FB928E] to-[#6F41FF] bg-clip-text text-transparent">
          404
        </h1>
        <p className="text-2xl font-semibold mb-6 bg-white bg-clip-text text-transparent">
          Page Not Found
        </p>
        <button
          onClick={() => navigate("/notes")}
          className="bg-gradient-to-r from-[#FB928E] to-[#6F41FF] text-white px-6 py-3 rounded-full shadow-md hover:opacity-90 text-base"
        >
          Back to Home
        </button>
      </div>
    </div>
  );
}
