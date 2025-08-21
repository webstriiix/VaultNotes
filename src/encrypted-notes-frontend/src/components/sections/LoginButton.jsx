import { useInternetIdentity } from "ic-use-internet-identity";

export function LoginButton({ loginText = "Login" }) {
  const { login, identity, isLoggingIn } = useInternetIdentity();

  const getButtonText = () => {
    if (isLoggingIn) return "Initializing...";
    if (identity) return "Logged in";
    return loginText; // pakai teks dari props
  };

  const disabled = isLoggingIn || !!identity;

  return (
    <button
      onClick={login}
      disabled={disabled}
      className="bg-gradient-to-r from-[#FB928E] to-[#6F41FF] text-white px-6 py-3 rounded-full shadow-md hover:opacity-90 disabled:opacity-60"
    >
      {getButtonText()}
    </button>
  );
}
