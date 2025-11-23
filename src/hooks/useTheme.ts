import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getTheme, type ThemeName } from '@/lib/themes';

const THEME_CACHE_KEY = 'app-theme';

export const useTheme = () => {
  // Fetch user's company theme
  const { data: themeData, isLoading } = useQuery({
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

      return company?.theme as ThemeName || 'futurista';
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Apply theme
  useEffect(() => {
    if (!themeData) {
      // Apply default futurista theme while loading
      applyTheme('futurista');
      return;
    }

    applyTheme('futurista');
    localStorage.setItem(THEME_CACHE_KEY, 'futurista');
  }, [themeData]);

  return { theme: themeData, isLoading };
};

export const applyTheme = (themeName: ThemeName) => {
  const theme = getTheme(themeName);
  const isDark = document.documentElement.classList.contains('dark');
  const colors = isDark ? theme.colors.dark : theme.colors.light;

  // Apply CSS variables with smooth transition
  const root = document.documentElement;
  const body = document.body;
  root.style.transition = 'all 300ms ease-in-out';

  Object.entries(colors).forEach(([key, value]) => {
    root.style.setProperty(`--${key}`, value);
  });

  // Remove all theme classes first
  body.classList.remove('theme-futurista');
  
  // Add specific theme class
  body.classList.add('theme-futurista');

  // Apply theme-specific font family (futurista)
  root.style.setProperty('--font-sans', 'Plus Jakarta Sans, Inter, sans-serif');

  // Remove transition after applying
  setTimeout(() => {
    root.style.transition = '';
  }, 300);
};

// Listen for theme changes from other tabs/windows
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === THEME_CACHE_KEY && e.newValue) {
      applyTheme(e.newValue as ThemeName);
    }
  });
}
