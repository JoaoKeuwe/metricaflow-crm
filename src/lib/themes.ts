export type ThemeName = 'futurista';

export interface ThemeColors {
  primary: string;
  'primary-foreground': string;
  secondary: string;
  'secondary-foreground': string;
  accent: string;
  'accent-foreground': string;
  background: string;
  foreground: string;
  muted: string;
  'muted-foreground': string;
  card: string;
  'card-foreground': string;
  border: string;
  input: string;
  ring: string;
  'gradient-start': string;
  'gradient-end': string;
  'neon-primary': string;
  'neon-secondary': string;
}

export interface Theme {
  name: ThemeName;
  displayName: string;
  description: string;
  emoji: string;
  colors: {
    light: ThemeColors;
    dark: ThemeColors;
  };
}

// Tema Futurista Premium como padrão único
export const themes: Record<ThemeName, Theme> = {
  futurista: {
    name: 'futurista',
    displayName: 'Futurista Premium',
    description: 'SaaS de alta performance com estética cyber premium',
    emoji: '🚀',
    colors: {
      light: {
        primary: '229 95% 58%',
        'primary-foreground': '0 0% 100%',
        secondary: '217 85% 68%',
        'secondary-foreground': '0 0% 100%',
        accent: '270 65% 65%',
        'accent-foreground': '0 0% 100%',
        background: '220 40% 98%',
        foreground: '221 50% 12%',
        muted: '220 30% 94%',
        'muted-foreground': '221 20% 40%',
        card: '0 0% 100%',
        'card-foreground': '221 50% 12%',
        border: '220 30% 90%',
        input: '220 30% 92%',
        ring: '229 95% 58%',
        'gradient-start': '229 95% 58%',
        'gradient-end': '270 65% 65%',
        'neon-primary': '229 95% 58%',
        'neon-secondary': '270 65% 65%',
      },
      dark: {
        primary: '229 92% 62%',
        'primary-foreground': '220 50% 10%',
        secondary: '217 80% 72%',
        'secondary-foreground': '220 50% 10%',
        accent: '270 70% 68%',
        'accent-foreground': '220 50% 10%',
        background: '221 44% 9%',
        foreground: '220 30% 96%',
        muted: '221 35% 16%',
        'muted-foreground': '220 20% 65%',
        card: '221 42% 12%',
        'card-foreground': '220 30% 96%',
        border: '221 35% 22%',
        input: '221 35% 20%',
        ring: '229 92% 62%',
        'gradient-start': '229 92% 62%',
        'gradient-end': '270 70% 68%',
        'neon-primary': '229 92% 62%',
        'neon-secondary': '270 70% 68%',
      },
    },
  },
};

export const getTheme = (themeName?: ThemeName): Theme => {
  return themes.futurista;
};
