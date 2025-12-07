import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Shield, Mail, KeyRound, Loader2 } from "lucide-react";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-otp", {
        body: { action: "request", email: email.trim().toLowerCase() },
      });

      if (error) throw error;

      if (data?.success) {
        setStep("code");
        toast({
          title: "Código enviado!",
          description: "Verifique seu email para obter o código de acesso.",
        });
      } else {
        toast({
          title: "Erro",
          description: data?.error || "Não foi possível enviar o código",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Request code error:", error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao solicitar código",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || code.length !== 6) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-otp", {
        body: { action: "verify", email: email.trim().toLowerCase(), code: code.trim() },
      });

      if (error) throw error;

      if (data?.success && data?.adminToken) {
        // Salvar token de sessão admin
        sessionStorage.setItem("adminToken", data.adminToken);
        sessionStorage.setItem("adminTokenExpiry", data.tokenExpiry);
        
        toast({
          title: "Acesso autorizado!",
          description: "Bem-vindo ao painel de administração.",
        });
        
        navigate("/admin");
      } else {
        toast({
          title: "Código inválido",
          description: data?.error || "O código está incorreto ou expirado",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Verify code error:", error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao verificar código",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
      </div>

      <Card className="w-full max-w-md premium-card relative z-10">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
            <Shield className="w-8 h-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold">Painel de Administração</CardTitle>
          <CardDescription>
            {step === "email" 
              ? "Digite seu email para receber o código de acesso" 
              : "Digite o código de 6 dígitos enviado para seu email"}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {step === "email" ? (
            <form onSubmit={handleRequestCode} className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12"
                  disabled={isLoading}
                  autoFocus
                />
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
                disabled={isLoading || !email.trim()}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Enviar Código
                  </>
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="000000"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="pl-10 h-12 text-center text-2xl tracking-widest font-mono"
                  disabled={isLoading}
                  autoFocus
                  maxLength={6}
                />
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
                disabled={isLoading || code.length !== 6}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4 mr-2" />
                    Acessar Painel
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setStep("email");
                  setCode("");
                }}
                disabled={isLoading}
              >
                Voltar
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Não recebeu o código?{" "}
                <button
                  type="button"
                  className="text-primary hover:underline"
                  onClick={handleRequestCode}
                  disabled={isLoading}
                >
                  Reenviar
                </button>
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogin;
