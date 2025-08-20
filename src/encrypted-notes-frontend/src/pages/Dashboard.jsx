import { useInternetIdentity } from "ic-use-internet-identity";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { encrypted_notes_backend } from "../../../declarations/encrypted-notes-backend";
import DashboardLayout from "../components/layouts/DashboardLayout/DashboardLayout";

const Dashboard = () => {
    const { identity } = useInternetIdentity();
    const [profile, setProfile] = useState(null);
    const router = useNavigate();

    useEffect(() => {
  const fetchProfile = async () => {
    if (!identity) {
      console.warn("User is not logged in.");
      return;
    }

    try {
      const principal = identity.getPrincipal();
      const userProfile = await encrypted_notes_backend.get_profile(principal);

      if (userProfile.length === 0) {
        // Belum ada profile -> redirect ke /profile
        router("/profile", { replace: true });
      } else {
        setProfile(userProfile[0]);
      }
    } catch (err) {
      console.error("Failed to fetch profile:", err);
    }
  };

  fetchProfile(); // ini dipanggil di luar function, tapi masih dalam useEffect
}, [identity, router]);


    if (!identity) {
        return <p className="text-center mt-10">Please login first.</p>;
    }

    return (
        <DashboardLayout>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            {!profile ? (
                <p className="mt-4">Loading your profile...</p>
            ) : (
                <div className="mt-4 space-y-2">
                    <p>
                        <span className="font-semibold">Principal ID:</span>{" "}
                        {profile.id.toText()}
                    </p>
                    <p>
                        <span className="font-semibold">Username:</span> {profile.username}
                    </p>
                    <p>
                        <span className="font-semibold">Email:</span> {profile.email}
                    </p>
                </div>
            )}
        </DashboardLayout>
    );
};

export default Dashboard;

