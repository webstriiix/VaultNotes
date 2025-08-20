import { Actor } from "@dfinity/agent";
import { Button, Card, CardBody, CardHeader, Input } from "@heroui/react";
import { useInternetIdentity } from "ic-use-internet-identity";
import { useEffect, useState } from "react";
import { IoPerson, IoSave } from "react-icons/io5";
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
    if (!identity) return;
    setLoading(true);

    try {
      Actor.agentOf(encrypted_notes_backend).replaceIdentity(identity);
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
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-1">
                  Complete Your Profile
                </h1>
                <p className="text-default-500 text-sm sm:text-base lg:text-lg">
                  Set your username and email
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
              {loading ? "Saving..." : "Save Profile"}
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
                    onChange={(e) => setEmail(e.target.value)}
                    size="lg"
                    variant="bordered"
                    classNames={{
                      input: "text-base sm:text-lg font-medium",
                      inputWrapper:
                        "border-[#3C444D] shadow-sm rounded-xl h-12 sm:h-14",
                    }}
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
