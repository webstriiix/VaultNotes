import { Actor } from "@dfinity/agent";
import { Button, Card, CardBody, CardHeader, Input } from "@heroui/react";
import { useInternetIdentity } from "ic-use-internet-identity";
import { useEffect, useState } from "react";
import { IoPerson, IoSave } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import ClipLoader from "react-spinners/ClipLoader";
import { toast } from "react-toastify";
import { encrypted_notes_backend } from "../../../declarations/encrypted-notes-backend";
import DashboardLayout from "../components/layouts/DashboardLayout/DashboardLayout";

const Profile = () => {
  const { identity } = useInternetIdentity();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [isExistingProfile, setIsExistingProfile] = useState(false); // ✅ cek profile sudah ada atau belum
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      if (!identity) return;
      try {
        setLoading(true);
        const principal = identity.getPrincipal();
        const userProfile = await encrypted_notes_backend.get_profile(
          principal
        );

        if (userProfile.length > 0) {
          const existing = userProfile[0];
          setUsername(existing.username || "");
          setEmail(existing.email || "");
          setIsExistingProfile(true);
        }
      } catch (err) {
        console.error("Failed to fetch profile:", err);
        toast.error("Failed to load profile data.");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [identity]);

  const validateEmail = (value) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!value) {
      setEmailError("Email is required");
      return false;
    } else if (!regex.test(value)) {
      setEmailError("Invalid email format");
      return false;
    } else {
      setEmailError("");
      return true;
    }
  };

  const handleSave = async () => {
    if (!identity) return;

    if (!username?.trim()) {
      toast.error("Username is required");
      return;
    }
    if (!email?.trim()) {
      setEmailError("Email is required");
      toast.error("Email is required");
      return;
    }
    const isValid = validateEmail(email);
    if (!isValid) {
      toast.error("Invalid email format");
      return;
    }

    setLoading(true);
    try {
      Actor.agentOf(encrypted_notes_backend).replaceIdentity(identity);

      await encrypted_notes_backend.register_user(username, email);

      toast.success(isExistingProfile ? "Profile updated!" : "Profile saved!");
      navigate("/dashboard");
    } catch (error) {
      console.error("Failed to save profile:", error);
      toast.error("Failed to save profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!identity) {
    return <p className="text-center mt-10">Please login first.</p>;
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-background relative">
        {loading && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="flex flex-col items-center gap-3">
              <ClipLoader color="#FFFFFF" size={50} />
              <p className="text-white font-medium text-lg">
                Saving profile...
              </p>
            </div>
          </div>
        )}

        <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-1">
                  {isExistingProfile
                    ? "Update Your Profile"
                    : "Complete Your Profile"}
                </h1>
                <p className="text-default-500 text-sm sm:text-base lg:text-lg">
                  {isExistingProfile
                    ? "Modify your username and email"
                    : "Set your username and email"}
                </p>
              </div>
            </div>

            <Button
              color="primary"
              size="lg"
              startContent={<IoSave className="h-5 w-5" />}
              onPress={handleSave}
              disabled={loading}
              className="font-semibold shadow-lg rounded-xl border border-[#3C444D] px-6 sm:px-8"
              variant="solid"
            >
              {loading
                ? "Saving..."
                : isExistingProfile
                ? "Update Profile"
                : "Save Profile"}
            </Button>
          </div>

          {/* Profile Form */}
          <Card className="border border-[#3C444D] rounded-2xl shadow-sm">
            <CardHeader className="pb-4 pt-6 px-6">
              <div className="flex items-center gap-3">
                <IoPerson className="h-6 w-6 text-primary" />
                <h3 className="text-lg sm:text-xl font-semibold text-foreground">
                  Profile Details
                </h3>
              </div>
            </CardHeader>
            <CardBody className="pt-0 px-6 pb-6">
              <div className="space-y-6">
                {/* Username */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground block">
                    Username *
                  </label>
                  <Input
                    placeholder="Enter your username..."
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    size="lg"
                    variant="bordered"
                    classNames={{
                      input: "text-base sm:text-lg font-medium",
                      inputWrapper:
                        "border-[#3C444D] shadow-sm rounded-xl h-12 sm:h-14",
                    }}
                  />
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground block">
                    Email *
                  </label>
                  <Input
                    placeholder="Enter your email..."
                    value={email}
                    type="email"
                    onChange={(e) => {
                      const val = e.target.value;
                      setEmail(val);
                      if (val.trim()) {
                        validateEmail(val);
                      } else {
                        setEmailError("");
                      }
                    }}
                    size="lg"
                    variant="bordered"
                    classNames={{
                      input: "text-base sm:text-lg font-medium",
                      inputWrapper:
                        "border-[#3C444D] shadow-sm rounded-xl h-12 sm:h-14",
                    }}
                    isInvalid={!!emailError}
                    errorMessage={emailError}
                  />
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Profile;
