import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowUpRight, CheckCircle2 } from "lucide-react";
import logo from "@/components/layout/logo.png";
import axiosInstance from "@/api/axiosInstance";
import { useToast } from "@/components/ui/use-toast";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [step, setStep] = useState<"request" | "verify" | "reset" | "done">(
    "request"
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  // Request OTP
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      await axiosInstance.post("/auth/request-otp", { email });
      toast({
        title: "OTP Sent",
        description: "A 4-digit verification code has been sent to your email.",
      });
      setStep("verify");
    } catch (err: any) {
      setError(
        err.response?.data?.error || "Failed to send OTP to your email."
      );
    }
    setIsLoading(false);
  };

  // Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      await axiosInstance.post("/auth/verify-otp", { email, otp });
      toast({
        title: "OTP Verified",
        description: "Your verification code was successfully verified.",
      });
      setStep("reset");
    } catch (err: any) {
      setError(
        err.response?.data?.error || "Invalid OTP or verification failed."
      );
    }
    setIsLoading(false);
  };

  // Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }
    try {
      await axiosInstance.post("/auth/reset-password", {
        email,
        otp,
        newPassword,
      });
      toast({
        title: "Password Updated",
        description: "Your password has been successfully reset.",
      });
      setStep("done");
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to reset password.");
    }
    setIsLoading(false);
  };

  return (
    <div 
      className="min-h-screen w-full flex flex-col justify-between bg-cover bg-center bg-no-repeat relative overflow-hidden p-6 lg:p-8"
      style={{ backgroundImage: "linear-gradient(135deg, rgba(15, 17, 23, 0.88), rgba(18, 20, 28, 0.94)), url(/login_bg.png)" }}
    >
      {/* Glow Effects */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-[var(--theme-color)]/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-[#ec4899]/5 blur-[120px] pointer-events-none" />

      {/* Top branding */}
      <div className="flex justify-between items-center z-10 w-full">
        <div className="text-white/45 text-[10px] font-bold tracking-[0.2em] uppercase">
          Prop<span className="text-[var(--theme-color)]">Pulse</span>
        </div>
        <a
          href="https://intelliworkz.tech"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs text-white/55 hover:text-[var(--theme-color)] transition-colors font-medium group"
        >
          Intelliworkz Solutions <ArrowUpRight className="h-3.5 w-3.5 text-white/30 group-hover:text-[var(--theme-color)] transition-colors" />
        </a>
      </div>

      {/* Center Card */}
      <div className="my-auto mx-auto w-full max-w-[440px] bg-card/95 backdrop-blur-md text-card-foreground border border-border rounded-2xl shadow-2xl p-8 lg:p-10 z-10 opacity-0 animate-fade-in-up">
        {/* Logo / Brand */}
        <div className="flex justify-center mb-8">
          <img src={logo} alt="PropPulse Logo" className="h-12 w-auto object-contain" />
        </div>

        <div className="text-center space-y-2 mb-8">
          <h1 className="text-3xl font-black text-foreground tracking-tight leading-none">
            Reset Password
          </h1>
          <p className="text-sm text-muted-foreground">
            {step === "request" && "Enter your email address to recover your password"}
            {step === "verify" && "Enter verification code sent to your device"}
            {step === "reset" && "Create a new strong password for your account"}
            {step === "done" && "Password reset successful"}
          </p>
        </div>

        {step === "request" && (
          <form onSubmit={handleRequestOtp} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground/80 font-semibold text-xs uppercase tracking-wider block">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="h-11 w-full border-input text-foreground text-sm focus-visible:ring-2 focus-visible:ring-[var(--theme-color)]/20 focus-visible:border-[var(--theme-color)] bg-background transition-all placeholder:text-muted-foreground/60"
              />
            </div>

            {error && (
              <div className="rounded-lg border border-destructive/25 bg-destructive/10 p-3 text-sm text-destructive font-medium">
                <div className="flex gap-2 items-center">
                  <span className="h-1.5 w-1.5 rounded-full bg-destructive shrink-0"></span>
                  {error}
                </div>
              </div>
            )}

            <Button
              type="submit"
              className="h-11 w-full bg-gradient-to-r from-[var(--theme-color)] to-[#ec4899] hover:from-[#ec4899] hover:to-[var(--theme-color)] text-white shadow-md shadow-[var(--theme-color)]/15 hover:shadow-lg hover:shadow-[var(--theme-color)]/25 active:scale-[0.98] transition-all duration-200 font-semibold text-sm rounded-xl border-none"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Sending OTP...</span>
                </div>
              ) : (
                "Send OTP"
              )}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="text-xs font-semibold text-[var(--theme-color)] hover:text-[var(--theme-color-hover)] hover:underline transition-colors"
              >
                Back to Sign In
              </button>
            </div>
          </form>
        )}

        {step === "verify" && (
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="otp" className="text-foreground/80 font-semibold text-xs uppercase tracking-wider block">
                Verification Code
              </Label>
              <Input
                id="otp"
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter 4-digit OTP"
                required
                className="h-11 w-full border-input text-foreground text-center tracking-[0.25em] text-lg font-bold focus-visible:ring-2 focus-visible:ring-[var(--theme-color)]/20 focus-visible:border-[var(--theme-color)] bg-background transition-all placeholder:text-muted-foreground/60 placeholder:tracking-normal placeholder:text-sm placeholder:font-normal"
              />
            </div>

            {error && (
              <div className="rounded-lg border border-destructive/25 bg-destructive/10 p-3 text-sm text-destructive font-medium">
                <div className="flex gap-2 items-center">
                  <span className="h-1.5 w-1.5 rounded-full bg-destructive shrink-0"></span>
                  {error}
                </div>
              </div>
            )}

            <Button
              type="submit"
              className="h-11 w-full bg-gradient-to-r from-[var(--theme-color)] to-[#ec4899] hover:from-[#ec4899] hover:to-[var(--theme-color)] text-white shadow-md shadow-[var(--theme-color)]/15 hover:shadow-lg hover:shadow-[var(--theme-color)]/25 active:scale-[0.98] transition-all duration-200 font-semibold text-sm rounded-xl border-none"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Verifying OTP...</span>
                </div>
              ) : (
                "Verify OTP"
              )}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setStep("request")}
                className="text-xs font-semibold text-[var(--theme-color)] hover:text-[var(--theme-color-hover)] hover:underline transition-colors"
              >
                Request another code
              </button>
            </div>
          </form>
        )}

        {step === "reset" && (
          <form onSubmit={handleResetPassword} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-foreground/80 font-semibold text-xs uppercase tracking-wider block">
                New Password
              </Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="h-11 w-full border-input text-foreground text-sm focus-visible:ring-2 focus-visible:ring-[var(--theme-color)]/20 focus-visible:border-[var(--theme-color)] bg-background transition-all placeholder:text-muted-foreground/60"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-foreground/80 font-semibold text-xs uppercase tracking-wider block">
                Confirm Password
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="h-11 w-full border-input text-foreground text-sm focus-visible:ring-2 focus-visible:ring-[var(--theme-color)]/20 focus-visible:border-[var(--theme-color)] bg-background transition-all placeholder:text-muted-foreground/60"
              />
            </div>

            {error && (
              <div className="rounded-lg border border-destructive/25 bg-destructive/10 p-3 text-sm text-destructive font-medium">
                <div className="flex gap-2 items-center">
                  <span className="h-1.5 w-1.5 rounded-full bg-destructive shrink-0"></span>
                  {error}
                </div>
              </div>
            )}

            <Button
              type="submit"
              className="h-11 w-full bg-gradient-to-r from-[var(--theme-color)] to-[#ec4899] hover:from-[#ec4899] hover:to-[var(--theme-color)] text-white shadow-md shadow-[var(--theme-color)]/15 hover:shadow-lg hover:shadow-[var(--theme-color)]/25 active:scale-[0.98] transition-all duration-200 font-semibold text-sm rounded-xl border-none"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Resetting...</span>
                </div>
              ) : (
                "Reset Password"
              )}
            </Button>
          </form>
        )}

        {step === "done" && (
          <div className="text-center space-y-6">
            <div className="flex flex-col items-center justify-center space-y-3">
              <CheckCircle2 className="h-16 w-16 text-emerald-500 animate-bounce" />
              <h3 className="text-xl font-bold text-foreground">All Set!</h3>
              <p className="text-sm text-muted-foreground">
                Your password has been successfully reset.
              </p>
            </div>

            <Button
              className="h-11 w-full bg-gradient-to-r from-[var(--theme-color)] to-[#ec4899] hover:from-[#ec4899] hover:to-[var(--theme-color)] text-white shadow-md shadow-[var(--theme-color)]/15 hover:shadow-lg hover:shadow-[var(--theme-color)]/25 active:scale-[0.98] transition-all duration-200 font-semibold text-sm rounded-xl border-none"
              onClick={() => navigate("/login")}
            >
              Back to Sign In
            </Button>
          </div>
        )}
      </div>

      {/* Footer Branding Info */}
      <div className="flex justify-between items-center text-[11px] text-white/40 z-10 w-full">
        <span>&copy; {new Date().getFullYear()} PropPulse Inc. All rights reserved.</span>
        <span>SaaS CRM v2.0.0</span>
      </div>
    </div>
  );
};

export default ForgotPassword;
