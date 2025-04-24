'use client';

interface ProgressOverTimeChartProps {
  data: Array<{
    date: Date | null;
    count: number;
  }>;
}

export default function ProgressOverTimeChart({ data }: ProgressOverTimeChartProps) {
  // In a real application, you would use a charting library like Chart.js, Recharts, etc.
  // For this example, we'll group and format the data for display

  // Format the dates and aggregate by day
  const formattedData = data.reduce((acc: Record<string, number>, item) => {
    if (!item.date) return acc;

    const dateStr = new Date(item.date).toLocaleDateString();
    acc[dateStr] = (acc[dateStr] || 0) + item.count;
    return acc;
  }, {});

  // Convert to array for rendering
  const chartData = Object.entries(formattedData).map(([date, count]) => ({
    date,
    count,
  }));

  // Sort by date
  chartData.sort((a, b) => {
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });

  // Find maximum value for scaling
  const maxValue = Math.max(...chartData.map((item) => item.count), 1);

  return (
    <div>
      {chartData.length > 0 ? (
        <div className="relative h-60">
          <div className="absolute inset-0 flex items-end">
            {chartData.map((item, index) => (
              <div key={index} className="flex h-full flex-1 flex-col items-center justify-end">
                <div
                  className="bg-primary w-4/5 rounded-t-sm"
                  style={{ height: `${(item.count / maxValue) * 100}%` }}
                  title={`${item.count} completions on ${item.date}`}
                ></div>
                <div className="text-muted-foreground mt-1 w-full truncate text-center text-xs">
                  {new Date(item.date).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-muted-foreground py-8 text-center">
          No completion data available for the selected time period.
        </div>
      )}
    </div>
  );
}
