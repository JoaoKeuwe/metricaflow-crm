import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid,
  Cell
} from "recharts";

interface SourceData {
  name: string;
  leads: number;
  converted: number;
  conversionRate: number;
}

interface SourceConversionChartProps {
  data: SourceData[];
  title?: string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null;

  const leads = payload.find((p: any) => p.dataKey === 'leads')?.value || 0;
  const converted = payload.find((p: any) => p.dataKey === 'converted')?.value || 0;
  const rate = leads > 0 ? ((converted / leads) * 100).toFixed(1) : 0;

  return (
    <div className="bg-cockpit-card/95 backdrop-blur-sm border border-cockpit-border rounded-lg shadow-lg p-3 min-w-[160px]">
      <p className="text-xs font-medium text-cockpit-foreground mb-2">{label}</p>
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-4">
          <span className="text-xs text-cockpit-muted">Total leads:</span>
          <span className="text-sm font-semibold text-cockpit-accent">{leads}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-xs text-cockpit-muted">Convertidos:</span>
          <span className="text-sm font-semibold text-cockpit-success">{converted}</span>
        </div>
        <div className="flex items-center justify-between gap-4 pt-1 border-t border-cockpit-border">
          <span className="text-xs text-cockpit-muted">Taxa:</span>
          <span className="text-sm font-bold text-cockpit-foreground">{rate}%</span>
        </div>
      </div>
    </div>
  );
};

export const SourceConversionChart = ({ 
  data, 
  title = "Conversão por Fonte" 
}: SourceConversionChartProps) => {
  // Calculate color based on conversion rate
  const getBarColor = (rate: number) => {
    if (rate >= 20) return "hsl(142 70% 45%)"; // Success
    if (rate >= 10) return "hsl(215 70% 55%)"; // Primary
    return "hsl(38 90% 50%)"; // Warning
  };

  return (
    <div className="rounded-xl bg-cockpit-card border border-cockpit-border overflow-hidden h-full">
      {/* Header */}
      <div className="px-5 py-4 border-b border-cockpit-border">
        <h3 className="text-sm font-semibold text-cockpit-foreground tracking-wide">
          {title}
        </h3>
        <p className="text-xs text-cockpit-muted mt-0.5">
          Leads e conversões por origem
        </p>
      </div>

      {/* Chart */}
      <div className="p-4 h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={data} 
            margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
            barCategoryGap="20%"
          >
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="hsl(215 25% 60% / 0.1)" 
              vertical={false}
            />
            
            <XAxis 
              dataKey="name" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: 'hsl(215 25% 50%)' }}
              dy={10}
              angle={-15}
              textAnchor="end"
            />
            
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: 'hsl(215 25% 50%)' }}
              width={40}
            />
            
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(215 25% 60% / 0.05)' }} />
            
            <Bar 
              dataKey="leads" 
              name="Leads" 
              radius={[4, 4, 0, 0]}
              fill="hsl(215 70% 55% / 0.3)"
            />
            
            <Bar 
              dataKey="converted" 
              name="Convertidos" 
              radius={[4, 4, 0, 0]}
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={getBarColor(entry.conversionRate)}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="px-5 py-3 border-t border-cockpit-border flex items-center justify-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-cockpit-accent/30" />
          <span className="text-xs text-cockpit-muted">Total Leads</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-cockpit-success" />
          <span className="text-xs text-cockpit-muted">Convertidos</span>
        </div>
      </div>
    </div>
  );
};
