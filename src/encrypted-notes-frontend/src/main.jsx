import { InternetIdentityProvider } from "ic-use-internet-identity";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import './index.css';

const rootElement = document.getElementById("root");
if (!rootElement) {
    throw new Error(
        "Root element not found. Ensure the element with id 'root' exists in your HTML."
    );
}

ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
        <InternetIdentityProvider
            loginOptions={{
                identityProvider: process.env.DFX_NETWORK === "local"
                    ? `http://${process.env.CANISTER_ID_INTERNET_IDENTITY}.localhost:4943`
                    : "https://identity.ic0.app"
            }}
        >
            <App />
        </InternetIdentityProvider>
    </React.StrictMode>
);
