import { Button } from "@/components/ui/button";
import { Building2, Loader2, Lock } from "lucide-react";
import { motion } from "motion/react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export default function LoginPage() {
  const { login, isLoggingIn, loginStatus } = useInternetIdentity();

  const handleLogin = async () => {
    try {
      await login();
    } catch (error: any) {
      console.error("Login error:", error);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        {/* Logo & Brand */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary text-white mb-5 shadow-card">
            <Building2 size={32} />
          </div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">
            Office Portal
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Secure file sharing for your team
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-card rounded-lg card-shadow p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
              <Lock size={16} className="text-primary" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">
                Sign In to Continue
              </h2>
              <p className="text-xs text-muted-foreground">
                Use Internet Identity for secure access
              </p>
            </div>
          </div>

          <Button
            data-ocid="login.primary_button"
            onClick={handleLogin}
            disabled={isLoggingIn || loginStatus === "initializing"}
            className="w-full h-11 bg-primary hover:bg-primary/90 text-white font-semibold text-sm"
          >
            {isLoggingIn ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              "Login with Internet Identity"
            )}
          </Button>

          <p className="text-center text-xs text-muted-foreground mt-5">
            Your identity is secured via Internet Computer's cryptographic
            authentication.
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-8">
          © {new Date().getFullYear()}. Built with ❤️ using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            caffeine.ai
          </a>
        </p>
      </motion.div>
    </div>
  );
}
