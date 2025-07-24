// ...existing code...
// Fix: Import useInternetIdentity with correct path or fallback
import { useInternetIdentity } from "ic-use-internet-identity";

export function LoginButton() {
  const { login, loginStatus } = useInternetIdentity();


  // Fix: Handle undefined loginStatus and improve button text
  const disabled = loginStatus === "logging-in" || loginStatus === "success";
  let text = "Login";
  if (loginStatus === "logging-in") text = "Logging in...";
  else if (loginStatus === "success") text = "Logged in";

  return (
    <button
      onClick={login}
      disabled={disabled}
      className="bg-gradient-to-r from-[#FB928E] to-[#6F41FF] text-white px-6 py-3 rounded-full shadow-md hover:opacity-90 disabled:opacity-60"
    >
      {text}
    </button>
  );
}