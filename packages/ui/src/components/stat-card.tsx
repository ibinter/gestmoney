import * as React from 'react';
import { cn } from '../utils/cn';
import { Card, CardContent } from './card';

interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
    label?: string;
  };
}

const StatCard = React.forwardRef<HTMLDivElement, StatCardProps>(
  ({ className, title, value, subtitle, icon, trend, ...props }, ref) => {
    return (
      <Card ref={ref} className={cn('', className)} {...props}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between space-x-4">
            <div className="flex-1 space-y-1">
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              <p className="text-2xl font-bold">{value}</p>
              {subtitle && (
                <p className="text-xs text-muted-foreground">{subtitle}</p>
              )}
              {trend && (
                <div className="flex items-center space-x-1">
                  <span
                    className={cn(
                      'text-xs font-medium',
                      trend.isPositive ? 'text-green-600' : 'text-red-600'
                    )}
                  >
                    {trend.isPositive ? '+' : ''}{trend.value}%
                  </span>
                  {trend.label && (
                    <span className="text-xs text-muted-foreground">{trend.label}</span>
                  )}
                </div>
              )}
            </div>
            {icon && (
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                {icon}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }
);
StatCard.displayName = 'StatCard';

export { StatCard };
