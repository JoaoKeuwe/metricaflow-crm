import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { themes, type ThemeName } from '@/lib/themes';
import { applyTheme } from '@/hooks/useTheme';
import { Palette } from 'lucide-react';

const ThemeSelector = () => {
  const [selectedTheme, setSelectedTheme] = useState<ThemeName | null>(null);
  const [previewTheme, setPreviewTheme] = useState<ThemeName | null>(null);
  const queryClient = useQueryClient();

  // Fetch current theme and user role
  const { data: currentTheme } = useQuery({
    queryKey: ['company-theme'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (!profile?.company_id) return null;

      const { data: company } = await supabase
        .from('companies')
        .select('theme')
        .eq('id', profile.company_id)
        .single();

      return company?.theme as ThemeName || 'moderno';
    },
  });

  // Check if user is owner or gestor
  const { data: userRole } = useQuery({
    queryKey: ['user-role'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Check if owner
      const { data: company } = await supabase
        .from('companies')
        .select('owner_id')
        .eq('owner_id', user.id)
        .maybeSingle();

      if (company) return 'owner';

      // Check if gestor
      const { data: role } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();

      return role?.role || null;
    },
  });

  const canEditTheme = userRole === 'owner' || userRole === 'gestor' || userRole === 'gestor_owner';

  // Update theme mutation
  const updateThemeMutation = useMutation({
    mutationFn: async (theme: ThemeName) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (!profile?.company_id) throw new Error('Empresa não encontrada');

      const { error } = await supabase
        .from('companies')
        .update({ theme })
        .eq('id', profile.company_id);

      if (error) throw error;

      return theme;
    },
    onSuccess: (theme) => {
      toast.success('Tema atualizado com sucesso!');
      applyTheme(theme);
      queryClient.invalidateQueries({ queryKey: ['company-theme'] });
      setSelectedTheme(null);
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar tema: ${error.message}`);
    },
  });

  const handleThemeSelect = (themeName: ThemeName) => {
    setSelectedTheme(themeName);
  };

  const handleThemePreview = (themeName: ThemeName | null) => {
    setPreviewTheme(themeName);
    if (themeName) {
      applyTheme(themeName);
    } else if (currentTheme) {
      // Restore current theme when mouse leaves
      applyTheme(currentTheme);
    }
  };

  const handleConfirm = () => {
    if (selectedTheme) {
      updateThemeMutation.mutate(selectedTheme);
    }
  };

  const themePreview = selectedTheme ? themes[selectedTheme] : null;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Tema do Sistema
          </CardTitle>
          <CardDescription>
            {canEditTheme 
              ? 'Escolha a paleta de cores que representa sua empresa'
              : 'Apenas owners e gestores podem alterar o tema do sistema'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.values(themes).map((theme) => {
              const isActive = currentTheme === theme.name;
              const colors = theme.colors.light;

              return (
                <Card
                  key={theme.name}
                  className={`transition-all relative ${
                    isActive ? 'ring-2 ring-primary' : ''
                  } ${previewTheme === theme.name ? 'ring-2 ring-accent' : ''} ${
                    canEditTheme ? 'cursor-pointer hover:scale-105' : 'opacity-60 cursor-not-allowed'
                  }`}
                  onClick={() => canEditTheme && handleThemeSelect(theme.name)}
                  onMouseEnter={() => canEditTheme && handleThemePreview(theme.name)}
                  onMouseLeave={() => canEditTheme && handleThemePreview(null)}
                >
                  {previewTheme === theme.name && (
                    <div className="absolute -top-2 -right-2 z-10">
                      <Badge variant="secondary" className="text-xs">
                        Preview
                      </Badge>
                    </div>
                  )}
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="text-2xl mb-1">{theme.emoji}</div>
                        <h3 className="font-semibold">{theme.displayName}</h3>
                      </div>
                      {isActive && <Badge>Atual</Badge>}
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-3">
                      {theme.description}
                    </p>

                    <div className="flex gap-2">
                      <div
                        className="h-8 flex-1 rounded-md border"
                        style={{ backgroundColor: `hsl(${colors.primary})` }}
                      />
                      <div
                        className="h-8 flex-1 rounded-md border"
                        style={{ backgroundColor: `hsl(${colors.secondary})` }}
                      />
                      <div
                        className="h-8 flex-1 rounded-md border"
                        style={{ backgroundColor: `hsl(${colors.accent})` }}
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={selectedTheme !== null} onOpenChange={() => setSelectedTheme(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Alterar Tema do Sistema?</AlertDialogTitle>
            <AlertDialogDescription>
              {themePreview && (
                <div className="mt-4">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-4xl">{themePreview.emoji}</span>
                    <div>
                      <h4 className="font-semibold text-lg text-foreground">
                        {themePreview.displayName}
                      </h4>
                      <p className="text-sm">{themePreview.description}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium text-foreground">Preview das cores:</p>
                    <div className="grid grid-cols-3 gap-2">
                      <div
                        className="h-16 rounded-lg border shadow-sm"
                        style={{ backgroundColor: `hsl(${themePreview.colors.light.primary})` }}
                      />
                      <div
                        className="h-16 rounded-lg border shadow-sm"
                        style={{ backgroundColor: `hsl(${themePreview.colors.light.secondary})` }}
                      />
                      <div
                        className="h-16 rounded-lg border shadow-sm"
                        style={{ backgroundColor: `hsl(${themePreview.colors.light.accent})` }}
                      />
                    </div>
                  </div>

                  <p className="text-sm mt-4">
                    Esta alteração será aplicada imediatamente para todos os usuários da empresa.
                  </p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm}>
              Aplicar Tema
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ThemeSelector;
