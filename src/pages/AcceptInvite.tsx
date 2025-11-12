import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle } from "lucide-react";
import { PasswordStrength } from "@/components/ui/password-strength";
import { usePasswordValidation } from "@/hooks/usePasswordValidation";

const AcceptInvite = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const token = searchParams.get("token");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [invite, setInvite] = useState<any>(null);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const passwordValidation = usePasswordValidation(password);

  useEffect(() => {
    if (!token) {
      navigate("/auth");
      return;
    }

    const checkInvite = async () => {
      try {
        const { data, error } = await supabase
          .from("invites")
          .select("*, companies(name)")
          .eq("id", token)
          .eq("status", "pending")
          .single();

        if (error || !data) {
          toast({
            title: "Convite inválido",
            description: "Este convite não existe ou já foi utilizado.",
            variant: "destructive",
          });
          navigate("/auth");
          return;
        }

        const expiresAt = new Date(data.expires_at);
        if (expiresAt < new Date()) {
          toast({
            title: "Convite expirado",
            description: "Este convite expirou.",
            variant: "destructive",
          });
          navigate("/auth");
          return;
        }

        setInvite(data);
      } catch (error) {
        console.error("Error checking invite:", error);
        toast({
          title: "Erro",
          description: "Erro ao verificar convite.",
          variant: "destructive",
        });
        navigate("/auth");
      } finally {
        setLoading(false);
      }
    };

    checkInvite();
  }, [token, navigate, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!passwordValidation.isValid) {
      toast({
        title: "Senha inválida",
        description: "A senha não atende aos requisitos de segurança",
        variant: "destructive",
      });
      return;
    }
    
    if (password !== confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke("accept-invite", {
        body: { token, name, password },
      });

      if (error) {
        console.error("Accept invite error:", error);
        throw error;
      }

      if (data.error) {
        console.error("Accept invite data error:", data);
        throw new Error(data.error);
      }

      toast({
        title: "✅ Conta criada!",
        description: "Fazendo login automático...",
      });

      // Login automático após criar conta
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: invite.email,
        password: password,
      });

      if (signInError) {
        console.error("Auto login error:", signInError);
        toast({
          title: "Conta criada com sucesso",
          description: "Por favor, faça login com suas credenciais.",
        });
        navigate("/auth");
        return;
      }

      toast({
        title: "✅ Bem-vindo!",
        description: "Login realizado com sucesso.",
      });

      navigate("/");
    } catch (error: any) {
      console.error("Error accepting invite:", error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao aceitar convite.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!invite) {
    return null;
  }

  const getRoleBadge = (role: string) => {
    const roleMap: Record<string, { label: string; variant: "default" | "secondary" }> = {
      gestor: { label: "Gestor", variant: "default" },
      vendedor: { label: "Vendedor", variant: "secondary" },
    };
    const config = roleMap[role] || { label: role, variant: "secondary" as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader>
          <div className="flex items-center justify-center mb-4">
            <CheckCircle className="h-12 w-12 text-success" />
          </div>
          <CardTitle className="text-2xl text-center">Você foi convidado!</CardTitle>
          <CardDescription className="text-center">
            <span className="font-semibold">{invite.companies?.name}</span> te convidou para fazer parte do time como {getRoleBadge(invite.role)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={invite.email}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Nome completo</Label>
              <Input
                id="name"
                type="text"
                placeholder="Seu nome completo"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              {password && (
                <PasswordStrength 
                  password={password}
                  requirements={passwordValidation.requirements}
                />
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmar Senha</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              {confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-destructive">As senhas não coincidem</p>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full"
              disabled={submitting || !passwordValidation.isValid || password !== confirmPassword}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando conta...
                </>
              ) : (
                "Criar Conta"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AcceptInvite;
