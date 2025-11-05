import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import Card from "../ui/Card";
import { CHART_COLORS } from "../../utils/constants";

const EmissionsBarChart = ({
  data,
  title,
  dataKey = "emissions",
  nameKey = "name",
}) => {
  return (
    <Card>
      {title && <h3 className="text-lg font-semibold mb-4">{title}</h3>}
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={nameKey} />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey={dataKey} fill={CHART_COLORS.primary} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
};

export default EmissionsBarChart;
