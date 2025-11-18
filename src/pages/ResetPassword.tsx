import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { usePasswordValidation } from "@/hooks/usePasswordValidation";
import { PasswordStrength } from "@/components/ui/password-strength";
import { Loader2, Lock, CheckCircle2 } from "lucide-react";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [tokenValid, setTokenValid] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const { isValid: isPasswordValid, requirements } = usePasswordValidation(password);
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        toast.error("Token de recuperação não fornecido");
        navigate("/auth");
        return;
      }

      try {
        const { data, error } = await supabase
          .from("password_reset_tokens")
          .select("*")
          .eq("token", token)
          .eq("used", false)
          .gt("expires_at", new Date().toISOString())
          .single();

        if (error || !data) {
          toast.error("Link de recuperação inválido ou expirado");
          navigate("/auth");
          return;
        }

        setTokenValid(true);
        setUserId(data.user_id);
      } catch (error) {
        console.error("Error validating token:", error);
        toast.error("Erro ao validar token");
        navigate("/auth");
      } finally {
        setLoading(false);
      }
    };

    validateToken();
  }, [token, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isPasswordValid) {
      toast.error("Por favor, atenda a todos os requisitos de senha");
      return;
    }

    if (!passwordsMatch) {
      toast.error("As senhas não coincidem");
      return;
    }

    setSubmitting(true);

    try {
      // Update password using edge function
      const { data, error } = await supabase.functions.invoke("reset-user-password", {
        body: {
          token,
          password,
        },
      });

      // Handle unexpected errors (network, etc.)
      if (error) {
        throw new Error(error.message || "Erro de conexão. Por favor, tente novamente.");
      }

      // Handle structured error responses from the function
      if (!data?.success) {
        toast.error(data?.message || "Erro ao redefinir senha. Por favor, tente novamente.");
        return;
      }

      // Success case
      toast.success(data.message || "Senha redefinida com sucesso!");

      // Get user email from the response to auto-login
      if (data?.user?.email) {
        // Sign in with new password
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: data.user.email,
          password: password,
        });

        if (signInError) {
          console.error("Auto-login error:", signInError);
          toast.info("Faça login com sua nova senha");
          navigate("/auth");
        } else {
          toast.success("Login realizado com sucesso!");
          navigate("/");
        }
      } else {
        navigate("/auth");
      }
    } catch (error: any) {
      console.error("Error resetting password:", error);
      toast.error(error.message || "Erro ao redefinir senha. Por favor, tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!tokenValid) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <Lock className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl text-center">Redefinir Senha</CardTitle>
          <CardDescription className="text-center">
            Digite sua nova senha abaixo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Nova Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="Digite sua nova senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={submitting}
              />
              {password && (
                <>
                  <PasswordStrength password={password} />
                  <p className="text-xs text-muted-foreground mt-2">
                    💡 Dica: Evite senhas que você já usou em outros sites ou que sejam muito comuns.
                  </p>
                </>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Senha</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirme sua nova senha"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={submitting}
              />
              {confirmPassword && (
                <div className="flex items-center gap-2 text-sm">
                  {passwordsMatch ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span className="text-green-500">As senhas coincidem</span>
                    </>
                  ) : (
                    <span className="text-destructive">As senhas não coincidem</span>
                  )}
                </div>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={submitting || !isPasswordValid || !passwordsMatch}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Redefinindo...
                </>
              ) : (
                "Redefinir Senha"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;
