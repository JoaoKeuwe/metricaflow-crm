import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Signup state
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupName, setSignupName] = useState("");
  const [signupCompanyName, setSignupCompanyName] = useState("");

  // Forgot password state
  const [forgotPasswordMode, setForgotPasswordMode] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  
  // Password reset state
  const [resetPasswordMode, setResetPasswordMode] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    console.debug('[Auth] Current URL:', window.location.href);
    
    // Check for password reset indicators in URL
    const urlParams = new URLSearchParams(window.location.search);
    const hash = window.location.hash;
    const isReset = urlParams.get('reset') === 'true';
    const hasCode = urlParams.has('code');
    const hasRecoveryInHash = hash.includes('type=recovery') || hash.includes('access_token');
    
    console.debug('[Auth] Detection:', { isReset, hasCode, hasRecoveryInHash, hash });
    
    // Detect if we're in any recovery flow
    const inRecoveryFlow = isReset || hasCode || hasRecoveryInHash;
    
    if (inRecoveryFlow) {
      console.debug('[Auth] Recovery flow detected, setting reset mode');
      setResetPasswordMode(true);
    }
    
    // If we have a code, exchange it for session
    if (hasCode) {
      console.debug('[Auth] Code detected, exchanging for session');
      supabase.auth.exchangeCodeForSession(window.location.href).then(({ error }) => {
        if (error) {
          console.debug('[Auth] Code exchange warning:', error.message);
        }
        // Ensure reset mode is set even if there's an error
        setResetPasswordMode(true);
        // Clean URL to avoid re-processing
        window.history.replaceState({}, document.title, '/auth?reset=true');
      });
    } else if (hasRecoveryInHash) {
      // Clean URL if we detected recovery from hash
      window.history.replaceState({}, document.title, '/auth?reset=true');
    }

    // Check if user is already logged in (only redirect if NOT in recovery flow)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session && !inRecoveryFlow) {
        navigate("/");
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.debug('[Auth] Auth state change:', event);
      // Only navigate on SIGNED_IN if not in recovery flow
      if (event === "SIGNED_IN" && session && !inRecoveryFlow) {
        navigate("/");
      }
      if (event === "PASSWORD_RECOVERY") {
        console.debug('[Auth] PASSWORD_RECOVERY event received');
        setResetPasswordMode(true);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });

      if (error) throw error;

      toast({
        title: "Login realizado com sucesso!",
        description: "Bem-vindo de volta.",
      });
    } catch (error: any) {
      toast({
        title: "Erro no login",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create user with metadata - company will be created by trigger
      const { error: signupError } = await supabase.auth.signUp({
        email: signupEmail,
        password: signupPassword,
        options: {
          data: {
            name: signupName,
            company_name: signupCompanyName,
          },
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (signupError) throw signupError;

      toast({
        title: "Conta criada com sucesso!",
        description: "Sua empresa foi criada e você é o proprietário.",
      });
    } catch (error: any) {
      toast({
        title: "Erro no cadastro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('send-password-reset', {
        body: {
          email: resetEmail,
          redirectUrl: `${window.location.origin}/auth`,
        },
      });

      if (error) throw error;

      toast({
        title: "Email enviado!",
        description: "Verifique sua caixa de entrada para redefinir sua senha.",
      });
      setForgotPasswordMode(false);
      setResetEmail("");
    } catch (error: any) {
      toast({
        title: "Erro ao enviar email",
        description: error.message || "Não foi possível enviar o email de recuperação",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 12) {
      toast({
        title: "Erro",
        description: "A senha deve ter pelo menos 12 caracteres",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast({
        title: "Senha atualizada!",
        description: "Sua senha foi redefinida com sucesso.",
      });
      
      setResetPasswordMode(false);
      setNewPassword("");
      setConfirmPassword("");
      navigate("/");
    } catch (error: any) {
      toast({
        title: "Erro ao redefinir senha",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Show password reset form if in reset mode
  if (resetPasswordMode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
        <Card className="w-full max-w-md shadow-2xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-3xl font-bold text-center bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              Redefinir Senha
            </CardTitle>
            <CardDescription className="text-center">
              Digite sua nova senha
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordReset} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">Nova Senha</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={12}
                  placeholder="Mín. 12 caracteres"
                />
                <p className="text-xs text-muted-foreground">
                  Deve conter: 12+ caracteres, maiúsculas, minúsculas, números e símbolos
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirmar Senha</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={12}
                  placeholder="Digite a senha novamente"
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Atualizando..." : "Atualizar Senha"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-3xl font-bold text-center bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            CRM Pro
          </CardTitle>
          <CardDescription className="text-center">
            Sistema de Gestão de Vendas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Cadastrar</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              {!forgotPasswordMode ? (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="seu@email.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Senha</Label>
                    <Input
                      id="login-password"
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Entrando..." : "Entrar"}
                  </Button>
                  <button
                    type="button"
                    onClick={() => setForgotPasswordMode(true)}
                    className="w-full text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    Esqueci minha senha
                  </button>
                </form>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reset-email">Email</Label>
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder="seu@email.com"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Enviaremos um link para redefinir sua senha.
                    </p>
                    <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                      ℹ️ Por segurança, sempre mostraremos sucesso mesmo se o email não existir. 
                      Caso não receba email, confirme se já possui cadastro.
                    </p>
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Enviando..." : "Enviar link de recuperação"}
                  </Button>
                  <button
                    type="button"
                    onClick={() => setForgotPasswordMode(false)}
                    className="w-full text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    Voltar para o login
                  </button>
                </form>
              )}
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Nome Completo</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="Seu nome"
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-company">Nome da Empresa</Label>
                  <Input
                    id="signup-company"
                    type="text"
                    placeholder="Sua empresa"
                    value={signupCompanyName}
                    onChange={(e) => setSignupCompanyName(e.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Primeiro cadastro cria automaticamente a empresa e você será o proprietário.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="seu@email.com"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Senha</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    required
                    minLength={12}
                    placeholder="Mín. 12 caracteres"
                  />
                  <p className="text-xs text-muted-foreground">
                    Deve conter: 12+ caracteres, maiúsculas, minúsculas, números e símbolos
                  </p>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Cadastrando..." : "Cadastrar"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
