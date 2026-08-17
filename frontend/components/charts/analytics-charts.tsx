"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";
import type { AnalyticsData } from "@/lib/types";
import { DAMAGE_TYPE_LABELS, SEVERITY_LABELS } from "@/lib/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const COLORS = ["#1e3a5f", "#b87333", "#2f5d47", "#7c4b1f", "#2c5282"];

function getSeverityColor(severity: string): string {
  const colorMap: Record<string, string> = {
    low: "#7a7268",
    medium: "#b87333", 
    high: "#c17f3a",
    critical: "#9b2c2c"
  };
  return colorMap[severity] || "#7a7268";
}

interface AnalyticsChartsProps {
  data: AnalyticsData;
}

const tooltipStyle = {
  borderRadius: "12px",
  border: "1px solid #ddd4c6",
  background: "#fffcf7",
  boxShadow: "0 4px 16px rgba(28,24,20,0.08)",
};

export function AnalyticsCharts({ data }: AnalyticsChartsProps) {
  const damageData = data.damageByType.map((d) => ({
    name: DAMAGE_TYPE_LABELS[d.type],
    count: d.count,
  }));

  const severityData = data.severityDistribution.map((d) => ({
    name: SEVERITY_LABELS[d.severity as keyof typeof SEVERITY_LABELS] || d.severity,
    value: d.count,
    color: getSeverityColor(d.severity),
  }));

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Damage Types</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={damageData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5ddd0" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#7a7268" }} angle={-20} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 12, fill: "#7a7268" }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="count" fill="#1e3a5f" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Severity Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={severityData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={3}
                dataKey="value"
                label={({ name, percent }) =>
                  `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                }
              >
                {severityData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Monthly Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={data.monthlyReports}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5ddd0" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#7a7268" }} />
              <YAxis tick={{ fontSize: 12, fill: "#7a7268" }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#b87333"
                strokeWidth={2.5}
                dot={{ fill: "#b87333", strokeWidth: 0, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Repair Completion</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.repairCompletion}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5ddd0" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#7a7268" }} />
              <YAxis tick={{ fontSize: 12, fill: "#7a7268" }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend />
              <Bar dataKey="assigned" fill="#c9bba8" name="Assigned" radius={[6, 6, 0, 0]} />
              <Bar dataKey="completed" fill="#2f5d47" name="Completed" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>City-wise Damage</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.cityWiseDamage} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e5ddd0" />
              <XAxis type="number" tick={{ fontSize: 12, fill: "#7a7268" }} />
              <YAxis dataKey="city" type="category" tick={{ fontSize: 12, fill: "#7a7268" }} width={100} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="count" fill="#1e3a5f" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
