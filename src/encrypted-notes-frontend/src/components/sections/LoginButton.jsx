import { useInternetIdentity } from "ic-use-internet-identity";

export function LoginButton() {
  const { login, identity, isLoggingIn } = useInternetIdentity();

  const disabled = isLoggingIn || !!identity;
  const text = isLoggingIn
    ? "Initializing..."
    : identity
    ? "Logged in"
    : "Login";

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

