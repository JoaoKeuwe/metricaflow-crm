import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { themes } from '@/lib/themes';
import { Palette } from 'lucide-react';

const ThemeSelector = () => {
  const theme = themes.futurista;
  const colors = theme.colors.light;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Tema do Sistema
        </CardTitle>
        <CardDescription>
          Design futurista premium otimizado para alta performance
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Card className="relative">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="text-3xl mb-2">{theme.emoji}</div>
                <h3 className="text-xl font-semibold">{theme.displayName}</h3>
                <Badge className="mt-2">Tema Ativo</Badge>
              </div>
            </div>
            
            <p className="text-sm text-muted-foreground mb-4">
              {theme.description}
            </p>

            <div className="space-y-3">
              <p className="text-sm font-medium">Paleta de Cores:</p>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <div
                    className="h-16 rounded-lg border shadow-sm"
                    style={{ backgroundColor: `hsl(${colors.primary})` }}
                  />
                  <p className="text-xs text-center text-muted-foreground">Primary</p>
                </div>
                <div className="space-y-2">
                  <div
                    className="h-16 rounded-lg border shadow-sm"
                    style={{ backgroundColor: `hsl(${colors.secondary})` }}
                  />
                  <p className="text-xs text-center text-muted-foreground">Secondary</p>
                </div>
                <div className="space-y-2">
                  <div
                    className="h-16 rounded-lg border shadow-sm"
                    style={{ backgroundColor: `hsl(${colors.accent})` }}
                  />
                  <p className="text-xs text-center text-muted-foreground">Accent</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
};

export default ThemeSelector;
