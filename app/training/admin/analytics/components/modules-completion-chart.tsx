"use client";

interface ModulesCompletionChartProps {
  data: Array<{
    id: string;
    title: string;
    category: string;
    completed: number;
    inProgress: number;
  }>;
}

export default function ModulesCompletionChart({ data }: ModulesCompletionChartProps) {
  // In a real application, you would use a charting library like Chart.js, Recharts, etc.
  // For this example, we'll create a simple bar chart with CSS
  
  // Sort data by completion count
  const sortedData = [...data].sort((a, b) => b.completed - a.completed).slice(0, 8);
  
  // Find maximum value for scaling
  const maxValue = Math.max(...sortedData.map(item => item.completed + item.inProgress));
  
  return (
    <div>
      <div className="space-y-4">
        {sortedData.map((item) => (
          <div key={item.id} className="space-y-1">
            <div className="flex justify-between text-sm mb-1">
              <span className="font-medium truncate" title={item.title}>
                {item.title.length > 20 ? `${item.title.substring(0, 20)}...` : item.title}
              </span>
              <span>{item.completed + item.inProgress}</span>
            </div>
            
            <div className="h-6 w-full bg-secondary rounded-md overflow-hidden flex">
              <div 
                className="bg-green-500 h-full"
                style={{ width: `${(item.completed / maxValue) * 100}%` }}
                title={`${item.completed} Completed`}
              ></div>
              <div 
                className="bg-amber-500 h-full"
                style={{ width: `${(item.inProgress / maxValue) * 100}%` }}
                title={`${item.inProgress} In Progress`}
              ></div>
            </div>
            
            <div className="flex text-xs text-muted-foreground">
              <div className="flex items-center mr-4">
                <div className="h-2 w-2 bg-green-500 rounded-full mr-1"></div>
                <span>Completed ({item.completed})</span>
              </div>
              <div className="flex items-center">
                <div className="h-2 w-2 bg-amber-500 rounded-full mr-1"></div>
                <span>In Progress ({item.inProgress})</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {data.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No module completion data available.
        </div>
      )}
    </div>
  );
}