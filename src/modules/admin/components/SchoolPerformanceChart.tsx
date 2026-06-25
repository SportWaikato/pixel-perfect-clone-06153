
import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/modules/application/components/DesignSystem/ui/chart';
import { SchoolInterface } from '@/models/schools/interfaces/SchoolInterface';

interface SchoolPerformanceChartProps {
  schools: SchoolInterface[];
}

const chartConfig = {
  proRataScore: {
    label: 'Pro-rata Score',
    color: 'hsl(var(--chart-1))',
  },
};

const SchoolPerformanceChart = ({ schools }: SchoolPerformanceChartProps) => {
  const chartData = useMemo(() => [...schools]
    .sort((a, b) => {
      const aProRata = a.total_students > 0 ? (a.total_points / a.total_students) * 100 : 0;
      const bProRata = b.total_students > 0 ? (b.total_points / b.total_students) * 100 : 0;
      return bProRata - aProRata;
    })
    .slice(0, 10)
    .map((school, index) => ({
      school: school.name.length > 15 ? `${school.name.substring(0, 15)}...` : school.name,
      fullName: school.name,
      proRataScore: school.total_students > 0 ? (school.total_points / school.total_students) * 100 : 0,
      totalPoints: school.total_points,
      students: school.total_students,
      rank: index + 1,
    })), [schools]);

  return (
    <ChartContainer config={chartConfig} className="w-full aspect-[3/1] min-h-[200px] max-h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 15, right: 15, left: 10, bottom: 50 }}>
          <XAxis
            dataKey="school"
            angle={-45}
            textAnchor="end"
            interval={0}
            tick={{ fontSize: 11 }}
          />
          <YAxis tick={{ fontSize: 11 }} />
          <ChartTooltip
            content={<ChartTooltipContent />}
            formatter={(value: number) => [`${value.toFixed(1)}`, 'Pro-rata Score']}
            labelFormatter={(label: string, props: any) => {
              const data = props?.[0]?.payload;
              if (data) {
                return (
                  <div>
                    <div className="font-medium">{data.fullName}</div>
                    <div className="text-sm text-muted-foreground">
                      {data.totalPoints} points total • {data.students} students
                    </div>
                  </div>
                );
              }
              return label;
            }}
          />
          <Bar dataKey="proRataScore" fill="var(--color-proRataScore)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};

export default SchoolPerformanceChart;
