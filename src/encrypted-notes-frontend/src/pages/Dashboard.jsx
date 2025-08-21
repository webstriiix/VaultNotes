import { Card, CardBody, CardHeader, Chip } from "@heroui/react";
import { useInternetIdentity } from "ic-use-internet-identity";
import { useEffect, useState } from "react";
import { IoAt, IoKey, IoMail, IoPerson } from "react-icons/io5";
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
        const userProfile = await encrypted_notes_backend.get_profile(
          principal
        );

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

    fetchProfile();
  }, [identity, router]);

  if (!identity) {
    return <p className="text-center mt-10">Please login first.</p>;
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-background">
        <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-1">
                Welcome, {profile ? profile.username : "User"} 👋
              </h1>
              <p className="text-default-500 text-sm sm:text-base mt-3">
                Here’s your account overview
              </p>
            </div>
          </div>

          {/* Profile Overview */}
          {!profile ? (
            <Card className="border border-[#3C444D] rounded-2xl shadow-sm">
              <CardBody className="p-6">
                <p className="text-default-500">You don't have a profile yet.</p>
              </CardBody>
            </Card>
          ) : (
            <Card className="border border-[#3C444D] rounded-2xl shadow-sm">
              <CardHeader className="pb-4 pt-6 px-6">
                <div className="flex items-center gap-3">
                  <IoPerson className="h-6 w-6 text-primary" />
                  <h3 className="text-lg sm:text-xl font-semibold text-foreground">
                    Profile Information
                  </h3>
                </div>
              </CardHeader>
              <CardBody className="pt-0 px-6 pb-6 space-y-6">
                {/* Principal ID */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                  <div className="flex items-center gap-2">
                    <IoKey className="text-default-500 shrink-0" />
                    <span className="font-semibold">Principal ID:</span>
                  </div>
                  {profile.id ? (
                    <Chip
                      variant="bordered"
                      size="sm"
                      className="border border-[#3C444D] px-2 py-0.5 rounded-lg text-xs sm:text-sm cursor-pointer hover:bg-default-100 transition max-w-full truncate"
                      onClick={() =>
                        navigator.clipboard.writeText(profile.id.toText())
                      }
                    >
                      {profile.id.toText()}
                    </Chip>
                  ) : (
                    <span className="text-default-500">Not available</span>
                  )}
                </div>

                {/* Username */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                  <div className="flex items-center gap-2">
                    <IoAt className="text-default-500 shrink-0" />
                    <span className="font-semibold">Username:</span>
                  </div>
                  <span>
                    {profile.username && profile.username.trim() !== ""
                      ? profile.username
                      : "Not set yet"}
                  </span>
                </div>

                {/* Email */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                  <div className="flex items-center gap-2">
                    <IoMail className="text-default-500 shrink-0" />
                    <span className="font-semibold">Email:</span>
                  </div>
                  <span>
                    {profile.email && profile.email.trim() !== ""
                      ? profile.email
                      : "Not set yet"}
                  </span>
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
