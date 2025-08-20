import { Actor } from "@dfinity/agent";
import { useInternetIdentity } from "ic-use-internet-identity";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { encrypted_notes_backend } from "../../../declarations/encrypted-notes-backend";
import DashboardLayout from "../components/layouts/DashboardLayout/DashboardLayout";

const Profile = () => {
    const { identity } = useInternetIdentity();
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchProfile = async () => {
            if (!identity) return;
            const principal = identity.getPrincipal();
            const existing = await encrypted_notes_backend.get_profile(principal);
            if (existing) {
                setUsername(existing.username);
                setEmail(existing.email);
            }
        };
        fetchProfile();
    }, [identity]);

    const handleSave = async () => {
        Actor.agentOf(encrypted_notes_backend).replaceIdentity(identity);
        if (!identity) return;
        setLoading(true);

        try {
            await encrypted_notes_backend.register_user(username, email);

            alert("Profile saved!");
            navigate("/dashboard");
        } catch (error) {
            console.error("Failed to save profile:", error);
            alert("Failed to save profile. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (!identity) {
        return <p className="text-center mt-10">Please login first.</p>;
    }

    return (
        <DashboardLayout>
        <div className="max-w-md mx-auto mt-10 bg-white shadow-lg rounded-xl p-6 space-y-4">
            <h2 className="text-xl font-bold text-gray-700">Complete Your Profile</h2>

            <input
                type="text"
                placeholder="Username"
                className="w-full p-2 border rounded"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
            />

            <input
                type="email"
                placeholder="Email"
                className="w-full p-2 border rounded"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
            />

            <button
                onClick={handleSave}
                disabled={loading}
                className="w-full bg-gradient-to-r from-[#FB928E] to-[#6F41FF] text-white py-2 rounded-lg shadow-md hover:opacity-90 disabled:opacity-60"
            >
                {loading ? "Saving..." : "Save Profile"}
            </button>
            </div>
            </DashboardLayout>
    );
};

export default Profile;

