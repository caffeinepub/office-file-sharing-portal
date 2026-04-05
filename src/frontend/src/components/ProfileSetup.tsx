import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, Loader2, User } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { UserRole } from "../backend";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useAssignCallerUserRole,
  useSaveCallerUserProfile,
} from "../hooks/useQueries";

interface ProfileSetupProps {
  onComplete: () => void;
}

export default function ProfileSetup({ onComplete }: ProfileSetupProps) {
  const [username, setUsername] = useState("");
  const { identity } = useInternetIdentity();
  const saveProfile = useSaveCallerUserProfile();
  const assignRole = useAssignCallerUserRole();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      toast.error("Please enter a username");
      return;
    }
    try {
      await saveProfile.mutateAsync({ username: username.trim() });

      if (username.trim() === "Brahma CSC" && identity) {
        try {
          await assignRole.mutateAsync({
            user: identity.getPrincipal(),
            role: UserRole.admin,
          });
        } catch (_err) {
          console.error("Failed to assign admin role:", _err);
        }
      }

      toast.success("Profile created successfully!");
      onComplete();
    } catch (_error) {
      toast.error("Failed to save profile. Please try again.");
    }
  };

  const isPending = saveProfile.isPending || assignRole.isPending;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary text-white mb-5 shadow-card">
            <Building2 size={32} />
          </div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">
            Office Portal
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Let's set up your profile
          </p>
        </div>

        <div className="bg-card rounded-lg card-shadow p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
              <User size={16} className="text-primary" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">
                Create Your Profile
              </h2>
              <p className="text-xs text-muted-foreground">
                Choose a display name for the portal
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label
                htmlFor="username"
                className="text-sm font-medium text-foreground"
              >
                Username
              </Label>
              <Input
                id="username"
                data-ocid="profile.input"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your name"
                className="mt-1.5 h-10"
                autoFocus
                disabled={isPending}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Tip: Use "Brahma CSC" to get admin access.
              </p>
            </div>

            <Button
              type="submit"
              data-ocid="profile.submit_button"
              disabled={isPending || !username.trim()}
              className="w-full h-11 bg-primary hover:bg-primary/90 text-white font-semibold"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Setting up...
                </>
              ) : (
                "Continue to Portal"
              )}
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
