import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from "recharts";
import { cn } from "@/lib/utils";
import { TrendingUp } from "lucide-react";

interface DataPoint {
  name: string;
  value: number;
  previousValue?: number;
}

interface TrendChartProps {
  data: DataPoint[];
  title: string;
  subtitle?: string;
  valuePrefix?: string;
  valueSuffix?: string;
  color?: "primary" | "success" | "warning";
  showComparison?: boolean;
}

const colorMap = {
  primary: {
    stroke: "hsl(229 92% 62%)",
    fill: "url(#primaryGradient)",
    strokeSecondary: "hsl(229 92% 62% / 0.3)"
  },
  success: {
    stroke: "hsl(142 70% 45%)",
    fill: "url(#successGradient)",
    strokeSecondary: "hsl(142 70% 45% / 0.3)"
  },
  warning: {
    stroke: "hsl(38 90% 50%)",
    fill: "url(#warningGradient)",
    strokeSecondary: "hsl(38 90% 50% / 0.3)"
  }
};

const CustomTooltip = ({ active, payload, label, valuePrefix, valueSuffix }: any) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-card border border-border rounded-lg shadow-lg p-3 min-w-[140px]">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      {payload.map((entry: any, index: number) => (
        <p key={index} className="text-sm font-semibold text-foreground">
          {valuePrefix}{entry.value.toLocaleString('pt-BR')}{valueSuffix}
        </p>
      ))}
    </div>
  );
};

export const TrendChart = ({
  data,
  title,
  subtitle,
  valuePrefix = "",
  valueSuffix = "",
  color = "primary",
  showComparison = false
}: TrendChartProps) => {
  const colors = colorMap[color];
  const latestValue = data.length > 0 ? data[data.length - 1].value : 0;
  const previousValue = data.length > 1 ? data[data.length - 2].value : latestValue;
  const trend = previousValue > 0 ? ((latestValue - previousValue) / previousValue) * 100 : 0;

  return (
    <div className="rounded-xl bg-card border border-border overflow-hidden h-full shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-primary/10">
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground tracking-wide">
                {title}
              </h3>
              {subtitle && (
                <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-foreground">
              {valuePrefix}{latestValue.toLocaleString('pt-BR')}{valueSuffix}
            </p>
            <p className={cn(
              "text-xs font-medium",
              trend >= 0 ? "text-success" : "text-destructive"
            )}>
              {trend >= 0 ? "↑" : "↓"} {Math.abs(trend).toFixed(1)}%
            </p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="p-4 h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            <defs>
              <linearGradient id="primaryGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(229 92% 62%)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="hsl(229 92% 62%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="successGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(142 70% 45%)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="hsl(142 70% 45%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="warningGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(38 90% 50%)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="hsl(38 90% 50%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="hsl(var(--border))" 
              vertical={false}
            />
            
            <XAxis 
              dataKey="name" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              dy={10}
            />
            
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              tickFormatter={(value) => `${valuePrefix}${value.toLocaleString('pt-BR')}`}
              width={60}
            />
            
            <Tooltip 
              content={<CustomTooltip valuePrefix={valuePrefix} valueSuffix={valueSuffix} />}
              cursor={{ stroke: 'hsl(229 92% 62% / 0.2)' }}
            />
            
            <Area
              type="monotone"
              dataKey="value"
              stroke={colors.stroke}
              strokeWidth={2}
              fill={colors.fill}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};