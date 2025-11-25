import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { PasswordStrength } from "@/components/ui/password-strength";
import { usePasswordValidation } from "@/hooks/usePasswordValidation";
import { authSchema } from "@/lib/validation";

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Signup state
  const [signupData, setSignupData] = useState({
    name: "",
    company_name: "",
    email: "",
    password: "",
  });
  
  const signupPasswordValidation = usePasswordValidation(signupData.password);

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
        title: "✅ Login realizado com sucesso!",
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
    
    // Validação com Zod
    try {
      authSchema.parse(signupData);
    } catch (error: any) {
      toast({
        title: "Dados inválidos",
        description: error.errors?.[0]?.message || "Verifique os dados informados",
        variant: "destructive",
      });
      return;
    }
    
    if (!signupPasswordValidation.isValid) {
      toast({
        title: "Senha inválida",
        description: "A senha não atende aos requisitos de segurança",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);

    try {
      console.log("Starting signup process...");
      // Create user with metadata - company will be created by trigger
      const { error: signupError } = await supabase.auth.signUp({
        email: signupData.email,
        password: signupData.password,
        options: {
          data: {
            name: signupData.name,
            company_name: signupData.company_name,
          },
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (signupError) {
        console.error("Signup error:", signupError);
        throw signupError;
      }

      console.log("Signup successful!");

      toast({
        title: "✅ Conta criada com sucesso!",
        description: "Você já pode fazer login.",
      });

      navigate("/");
    } catch (error: any) {
      console.error("Signup error:", error);
      toast({
        title: "Erro no cadastro",
        description: error.message || "Ocorreu um erro ao criar sua conta. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    console.log("Forgot password requested for:", resetEmail);

    try {
      const { data, error } = await supabase.functions.invoke("send-password-reset", {
        body: { 
          email: resetEmail,
          redirectUrl: `${window.location.origin}/auth?mode=reset`
        },
      });

      if (error) {
        console.error("Password reset error:", error);
        throw error;
      }

      if (data?.error) {
        console.error("Password reset data error:", data);
        
        // Erro de configuração do Resend
        if (data.details) {
          toast({
            title: "❌ Erro de configuração",
            description: data.details,
            variant: "destructive",
          });
          return;
        }
        
        throw new Error(data.error);
      }

      console.log("Password reset email sent successfully");

      toast({
        title: "✅ Email enviado!",
        description: "Verifique sua caixa de entrada (e spam) para redefinir sua senha.",
      });

      setForgotPasswordMode(false);
      setResetEmail("");
    } catch (error: any) {
      console.error("Password reset error:", error);
      toast({
        title: "Erro ao enviar email",
        description: error.message || "Não foi possível enviar o email. Tente novamente mais tarde.",
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
        title: "✅ Senha atualizada!",
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
      <div className="min-h-screen bg-background flex">
        {/* Left Side - Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            {/* Header */}
            <div className="mb-8 space-y-2">
              <h1 className="text-4xl font-bold text-foreground tracking-tight" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                Redefinir Senha
              </h1>
              <p className="text-muted-foreground text-base" style={{ fontFamily: 'Inter, sans-serif' }}>
                Digite sua nova senha para acessar o sistema
              </p>
            </div>

            {/* Glass Card */}
            <div className="relative backdrop-blur-xl bg-card/40 border border-primary/20 rounded-2xl p-8 shadow-2xl shadow-primary/10">
              {/* Glow Effect */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
              
              <div className="relative z-10">
                <form onSubmit={handlePasswordReset} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="new-password" className="text-sm font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
                      Nova Senha
                    </Label>
                    <Input
                      id="new-password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={12}
                      placeholder="Mín. 12 caracteres"
                      className="h-12 bg-background/50 border-primary/30 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg"
                    />
                    <p className="text-xs text-muted-foreground">
                      Deve conter: 12+ caracteres, maiúsculas, minúsculas, números e símbolos
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password" className="text-sm font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
                      Confirmar Senha
                    </Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={12}
                      placeholder="Digite a senha novamente"
                      className="h-12 bg-background/50 border-primary/30 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full h-12 bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white font-semibold rounded-lg shadow-lg shadow-primary/30 transition-all duration-300" 
                    disabled={loading}
                    style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Atualizando...
                      </>
                    ) : (
                      "Atualizar Senha"
                    )}
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>

      {/* Right Side - Decorative Planet */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-end justify-center bg-gradient-to-br from-[#0F1624] via-[#0F1624] to-[#1a1f35]">
        {/* Grid Pattern - Futuristic */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `linear-gradient(to right, #5D7BFF 1px, transparent 1px), linear-gradient(to bottom, #5D7BFF 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }} />
        
        {/* Cyber Lines */}
        <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-primary/30 to-transparent" />
        <div className="absolute top-0 right-1/3 w-px h-full bg-gradient-to-b from-transparent via-accent/20 to-transparent" />
        
        {/* Planet Circle - Half visible with futuristic glow */}
        <div className="absolute -bottom-1/3 left-1/2 -translate-x-1/2 w-[650px] h-[650px]">
          {/* Outer Glow - Blue Electric */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/40 via-accent/30 to-transparent blur-[100px] animate-pulse" style={{ animationDuration: '4s' }} />
          
          {/* Main Planet - Electric Blue Core */}
          <div className="absolute inset-12 rounded-full bg-gradient-to-br from-primary/50 via-accent/40 to-primary/30 border-2 border-primary/40 shadow-2xl shadow-primary/20">
            {/* Inner Gradient Layers */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-accent/30 to-transparent" />
            <div className="absolute inset-0 rounded-full bg-gradient-to-bl from-primary/20 via-transparent to-accent/20" />
            
            {/* Neon Shine Effect */}
            <div className="absolute top-1/4 left-1/4 w-40 h-40 rounded-full bg-[#8FAEFF]/20 blur-3xl" />
            <div className="absolute top-1/3 right-1/3 w-32 h-32 rounded-full bg-primary/30 blur-2xl" />
          </div>
          
          {/* Animated Rings */}
          <div className="absolute inset-0 rounded-full border-2 border-primary/30 animate-pulse" style={{ animationDuration: '3s' }} />
          <div className="absolute inset-6 rounded-full border border-accent/20 animate-pulse" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }} />
          
          {/* Glow Ring */}
          <div className="absolute inset-0 rounded-full shadow-[0_0_100px_rgba(93,123,255,0.4)]" />
        </div>

        {/* Floating Particles - Futuristic Colors */}
        <div className="absolute top-1/4 left-1/4 w-2 h-2 rounded-full bg-accent shadow-[0_0_10px_rgba(143,174,255,0.8)] animate-pulse" />
        <div className="absolute top-1/3 right-1/4 w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(93,123,255,0.8)] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-1/3 left-1/3 w-2.5 h-2.5 rounded-full bg-accent/80 shadow-[0_0_12px_rgba(143,174,255,0.6)] animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 right-1/3 w-1 h-1 rounded-full bg-primary/60 shadow-[0_0_6px_rgba(93,123,255,0.6)] animate-pulse" style={{ animationDelay: '1.5s' }} />
      </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="mb-8 space-y-2">
            <h1 className="text-4xl font-bold text-foreground tracking-tight" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              Seja bem-vindo!
            </h1>
            <p className="text-muted-foreground text-base" style={{ fontFamily: 'Inter, sans-serif' }}>
              Digite seu email e senha para entrar no sistema
            </p>
          </div>

          {/* Glass Card */}
          <div className="relative backdrop-blur-xl bg-card/40 border border-primary/20 rounded-2xl p-8 shadow-2xl shadow-primary/10">
            {/* Glow Effect */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
            
            <div className="relative z-10">
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-8 bg-background/50 p-1">
                  <TabsTrigger 
                    value="login" 
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-accent data-[state=active]:text-white"
                  >
                    Entrar
                  </TabsTrigger>
                  <TabsTrigger 
                    value="signup"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-accent data-[state=active]:text-white"
                  >
                    Cadastrar
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="login">
                  {!forgotPasswordMode ? (
                    <form onSubmit={handleLogin} className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="login-email" className="text-sm font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
                          Email
                        </Label>
                        <Input
                          id="login-email"
                          type="email"
                          placeholder="seu@email.com"
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          required
                          className="h-12 bg-background/50 border-primary/30 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="login-password" className="text-sm font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
                          Senha
                        </Label>
                        <Input
                          id="login-password"
                          type="password"
                          placeholder="••••••••"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          required
                          className="h-12 bg-background/50 border-primary/30 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg"
                        />
                      </div>
                      <Button 
                        type="submit" 
                        className="w-full h-12 bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white font-semibold rounded-lg shadow-lg shadow-primary/30 transition-all duration-300" 
                        disabled={loading}
                        style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                      >
                        {loading ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Entrando...
                          </>
                        ) : (
                          "Acessar"
                        )}
                      </Button>
                      <div className="text-center">
                        <button
                          type="button"
                          onClick={() => setForgotPasswordMode(true)}
                          className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
                          style={{ fontFamily: 'Inter, sans-serif' }}
                        >
                          Esqueceu sua senha?
                          <span className="text-primary underline">Clique aqui</span>
                        </button>
                      </div>
                    </form>
                  ) : (
                    <form onSubmit={handleForgotPassword} className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="reset-email" className="text-sm font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
                          Email
                        </Label>
                        <Input
                          id="reset-email"
                          type="email"
                          placeholder="seu@email.com"
                          value={resetEmail}
                          onChange={(e) => setResetEmail(e.target.value)}
                          required
                          className="h-12 bg-background/50 border-primary/30 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg"
                        />
                        <p className="text-xs text-muted-foreground mt-2">
                          Enviaremos um link para redefinir sua senha.
                        </p>
                        <div className="flex items-start gap-2 bg-accent/10 border border-accent/20 p-3 rounded-lg mt-3">
                          <span className="text-accent text-sm">ℹ️</span>
                          <p className="text-xs text-muted-foreground">
                            Verifique também a pasta de SPAM
                          </p>
                        </div>
                      </div>
                      <Button 
                        type="submit" 
                        className="w-full h-12 bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white font-semibold rounded-lg shadow-lg shadow-primary/30" 
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Enviando...
                          </>
                        ) : (
                          "Enviar link de recuperação"
                        )}
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
                  <form onSubmit={handleSignup} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="signup-name" className="text-sm font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
                        Nome Completo
                      </Label>
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="Seu nome"
                        value={signupData.name}
                        onChange={(e) => setSignupData({ ...signupData, name: e.target.value })}
                        required
                        className="h-11 bg-background/50 border-primary/30 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-company" className="text-sm font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
                        Nome da Empresa
                      </Label>
                      <Input
                        id="signup-company"
                        type="text"
                        placeholder="Sua empresa"
                        value={signupData.company_name}
                        onChange={(e) => setSignupData({ ...signupData, company_name: e.target.value })}
                        required
                        className="h-11 bg-background/50 border-primary/30 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Primeiro cadastro cria automaticamente a empresa
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email" className="text-sm font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
                        Email
                      </Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="seu@email.com"
                        value={signupData.email}
                        onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                        required
                        className="h-11 bg-background/50 border-primary/30 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password" className="text-sm font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
                        Senha
                      </Label>
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="••••••••"
                        value={signupData.password}
                        onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                        required
                        className="h-11 bg-background/50 border-primary/30 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg"
                      />
                      {signupData.password && (
                        <PasswordStrength 
                          password={signupData.password}
                          requirements={signupPasswordValidation.requirements}
                        />
                      )}
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full h-12 bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white font-semibold rounded-lg shadow-lg shadow-primary/30 transition-all duration-300 mt-2"
                      disabled={loading || !signupPasswordValidation.isValid}
                      style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Criando conta...
                        </>
                      ) : (
                        "Criar Conta"
                      )}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Decorative Planet */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-end justify-center bg-gradient-to-br from-[#0F1624] via-[#0F1624] to-[#1a1f35]">
        {/* Grid Pattern - Futuristic */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `linear-gradient(to right, #5D7BFF 1px, transparent 1px), linear-gradient(to bottom, #5D7BFF 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }} />
        
        {/* Cyber Lines */}
        <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-primary/30 to-transparent" />
        <div className="absolute top-0 right-1/3 w-px h-full bg-gradient-to-b from-transparent via-accent/20 to-transparent" />
        
        {/* Planet Circle - Half visible with futuristic glow */}
        <div className="absolute -bottom-1/3 left-1/2 -translate-x-1/2 w-[650px] h-[650px]">
          {/* Outer Glow - Blue Electric */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/40 via-accent/30 to-transparent blur-[100px] animate-pulse" style={{ animationDuration: '4s' }} />
          
          {/* Main Planet - Electric Blue Core */}
          <div className="absolute inset-12 rounded-full bg-gradient-to-br from-primary/50 via-accent/40 to-primary/30 border-2 border-primary/40 shadow-2xl shadow-primary/20">
            {/* Inner Gradient Layers */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-accent/30 to-transparent" />
            <div className="absolute inset-0 rounded-full bg-gradient-to-bl from-primary/20 via-transparent to-accent/20" />
            
            {/* Neon Shine Effect */}
            <div className="absolute top-1/4 left-1/4 w-40 h-40 rounded-full bg-[#8FAEFF]/20 blur-3xl" />
            <div className="absolute top-1/3 right-1/3 w-32 h-32 rounded-full bg-primary/30 blur-2xl" />
          </div>
          
          {/* Animated Rings */}
          <div className="absolute inset-0 rounded-full border-2 border-primary/30 animate-pulse" style={{ animationDuration: '3s' }} />
          <div className="absolute inset-6 rounded-full border border-accent/20 animate-pulse" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }} />
          
          {/* Glow Ring */}
          <div className="absolute inset-0 rounded-full shadow-[0_0_100px_rgba(93,123,255,0.4)]" />
        </div>

        {/* Floating Particles - Futuristic Colors */}
        <div className="absolute top-1/4 left-1/4 w-2 h-2 rounded-full bg-accent shadow-[0_0_10px_rgba(143,174,255,0.8)] animate-pulse" />
        <div className="absolute top-1/3 right-1/4 w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(93,123,255,0.8)] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-1/3 left-1/3 w-2.5 h-2.5 rounded-full bg-accent/80 shadow-[0_0_12px_rgba(143,174,255,0.6)] animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 right-1/3 w-1 h-1 rounded-full bg-primary/60 shadow-[0_0_6px_rgba(93,123,255,0.6)] animate-pulse" style={{ animationDelay: '1.5s' }} />
      </div>
    </div>
  );
};

export default Auth;
