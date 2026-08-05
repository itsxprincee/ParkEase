import { useEffect, useState } from "react";
import API from "../api/axios";
import Sidebar from "../components/Sidebar";
import Card from "../components/Card";
import AnalyticsChart from "../components/AnalyticsChart";

function OwnerDashboard() {

  const [parking, setParking] = useState([]);

  useEffect(() => {
    loadParking();
  }, []);

  const loadParking = async () => {
    try {
      const response = await API.get("/owner/my-parking");
      setParking(response.data);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="flex">

      <Sidebar />

      <div className="ml-64 w-full bg-gray-100 min-h-screen p-8">

        <h1 className="text-4xl font-bold mb-8">
          Owner Dashboard
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          <Card>
            <h2 className="text-xl font-bold">Parking Locations</h2>
            <p className="text-4xl mt-4">
              {parking.length}
            </p>
          </Card>

          <Card>
            <h2 className="text-xl font-bold">Total Slots</h2>
            <p className="text-4xl mt-4">
              {parking.reduce((sum, p) => sum + p.total_slots, 0)}
            </p>
          </Card>

          <Card>
            <h2 className="text-xl font-bold">Status</h2>
            <p className="text-2xl mt-4 text-green-600">
              Active
            </p>
          </Card>

        </div>
        <AnalyticsChart parking={parking} />
        <h2 className="text-3xl font-bold mt-10 mb-6">
          My Parking Locations
        </h2>

        <div className="grid md:grid-cols-2 gap-6">

          {parking.map((item) => (

            <Card key={item.id}>

              <h3 className="text-2xl font-bold">
                {item.name}
              </h3>

              <p className="text-gray-600 mt-2">
                📍 {item.address}
              </p>

              <p className="mt-3">
                Total Slots: {item.total_slots}
              </p>

            </Card>

          ))}

        </div>

      </div>

    </div>
  );
}

export default OwnerDashboard;