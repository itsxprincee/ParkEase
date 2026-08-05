import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

import { Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

function AnalyticsChart({ parking }) {

  const totalLocations = parking.length;

  const totalSlots = parking.reduce(
    (sum, p) => sum + p.total_slots,
    0
  );

  const data = {
    labels: [
      "Locations",
      "Slots"
    ],
    datasets: [
      {
        label: "ParkEase Analytics",
        data: [
          totalLocations,
          totalSlots
        ],
      },
    ],
  };

  return (
    <div className="bg-white rounded-2xl shadow-md p-6 mt-8">
      <Bar data={data} />
    </div>
  );
}

export default AnalyticsChart;