import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { Eye, EyeOff, ArrowUpRight } from "lucide-react";
import { validateEmail } from "@/utils/inputSanitization";
import logo from "@/components/layout/logo.png";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  if (isAuthenticated) {
    navigate("/dashboard", { replace: true });
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (!validateEmail(email)) {
      setError("Please enter a valid email address");
      setIsLoading(false);
      return;
    }

    if (password.length < 3) {
      setError("Password is too short");
      setIsLoading(false);
      return;
    }

    const result = await login(email, password);

    if (result.success) {
      navigate("/dashboard", { replace: true });
    } else {
      setError(result.error || "Login failed");
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

      {/* Center login box */}
      <div className="my-auto mx-auto w-full max-w-[440px] bg-card/95 backdrop-blur-md text-card-foreground border border-border rounded-2xl shadow-2xl p-8 lg:p-10 z-10 opacity-0 animate-fade-in-up">
        {/* Logo / Brand */}
        <div className="flex justify-center mb-8">
          <img src={logo} alt="PropPulse Logo" className="h-12 w-auto object-contain" />
        </div>

        <div className="text-center space-y-2 mb-8">
          <h1 className="text-3xl font-black text-foreground tracking-tight leading-none">
            Welcome back
          </h1>
          <p className="text-sm text-muted-foreground">
            Sign in to manage your real estate flow
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
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

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-foreground/80 font-semibold text-xs uppercase tracking-wider block">
                Password
              </Label>
              <button
                type="button"
                onClick={() => navigate("/forgot-password")}
                className="text-xs font-semibold text-[var(--theme-color)] hover:text-[var(--theme-color-hover)] hover:underline transition-colors"
                tabIndex={-1}
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="h-11 w-full pr-12 border-input text-foreground text-sm focus-visible:ring-2 focus-visible:ring-[var(--theme-color)]/20 focus-visible:border-[var(--theme-color)] bg-background transition-all placeholder:text-muted-foreground/60"
              />
              <button
                type="button"
                className="absolute right-0 top-0 h-full px-4 text-muted-foreground/70 hover:text-muted-foreground flex items-center transition-colors"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
              </button>
            </div>
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
                <span>Signing in...</span>
              </div>
            ) : (
              "Sign In"
            )}
          </Button>
        </form>
      </div>

      {/* Footer Branding Info */}
      <div className="flex justify-between items-center text-[11px] text-white/40 z-10 w-full">
        <span>&copy; {new Date().getFullYear()} PropPulse Inc. All rights reserved.</span>
        <span>SaaS CRM v2.0.0</span>
      </div>
    </div>
  );
};

export default Login;

