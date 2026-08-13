import { useEffect, useState } from "react";
import API from "../../api/axios";

function AdminDashboard() {
  const [parking, setParking] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const [rejectingId, setRejectingId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");

  // ================= LOAD DATA =================

  const loadData = async () => {
    try {
      setLoading(true);

      const [parkingResponse, statsResponse] =
        await Promise.all([
          API.get("/admin/parking/pending"),
          API.get("/admin/verification-stats"),
        ]);

      setParking(parkingResponse.data);
      setStats(statsResponse.data);

    } catch (error) {
      console.error(
        "Failed to load admin dashboard:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // ================= APPROVE =================

  const approveParking = async (id) => {
    try {
      setActionLoading(id);

      await API.put(
        `/admin/parking/${id}/approve`
      );

      await loadData();

    } catch (error) {
      console.error(
        "Approve parking error:",
        error
      );

      alert(
        error?.response?.data?.detail ||
        "Failed to approve parking"
      );
    } finally {
      setActionLoading(null);
    }
  };

  // ================= REJECT =================

  const rejectParking = async (id) => {
    if (!rejectionReason.trim()) {
      alert("Please enter a rejection reason.");
      return;
    }

    try {
      setActionLoading(id);

      await API.put(
        `/admin/parking/${id}/reject`,
        {
          reason: rejectionReason.trim(),
        }
      );

      setRejectingId(null);
      setRejectionReason("");

      await loadData();

    } catch (error) {
      console.error(
        "Reject parking error:",
        error
      );

      alert(
        error?.response?.data?.detail ||
        "Failed to reject parking"
      );
    } finally {
      setActionLoading(null);
    }
  };

  // ================= LOGOUT =================

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    window.location.href = "/login";
  };

  // ================= LOADING =================

  if (loading) {
    return (
      <div style={{ padding: "30px" }}>
        Loading Admin Dashboard...
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "30px",
        maxWidth: "1400px",
        margin: "0 auto",
      }}
    >
      {/* ================= HEADER ================= */}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "30px",
        }}
      >
        <div>
          <h1>ParkEase Admin Dashboard</h1>
          <p>
            Parking Verification Management
          </p>
        </div>

        <button onClick={logout}>
          Logout
        </button>
      </div>

      {/* ================= STATISTICS ================= */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(4, 1fr)",
          gap: "20px",
          marginBottom: "30px",
        }}
      >
        <div>
          <h3>Total</h3>
          <h2>{stats.total}</h2>
        </div>

        <div>
          <h3>Pending</h3>
          <h2>{stats.pending}</h2>
        </div>

        <div>
          <h3>Approved</h3>
          <h2>{stats.approved}</h2>
        </div>

        <div>
          <h3>Rejected</h3>
          <h2>{stats.rejected}</h2>
        </div>
      </div>

      {/* ================= PENDING PARKING ================= */}

      <h2>
        Pending Parking Verification
      </h2>

      {parking.length === 0 ? (
        <p>
          No parking locations are currently
          pending verification.
        </p>
      ) : (
        <div
          style={{
            display: "grid",
            gap: "20px",
            marginTop: "20px",
          }}
        >
          {parking.map((item) => (
            <div
              key={item.id}
              style={{
                border: "1px solid #ddd",
                borderRadius: "10px",
                padding: "20px",
              }}
            >
              <h3>{item.name}</h3>

              <p>
                <strong>Owner:</strong>{" "}
                {item.owner_name}
              </p>

              <p>
                <strong>Email:</strong>{" "}
                {item.owner_email}
              </p>

              <p>
                <strong>Address:</strong>{" "}
                {item.address}
              </p>

              <p>
                <strong>Latitude:</strong>{" "}
                {item.latitude}
              </p>

              <p>
                <strong>Longitude:</strong>{" "}
                {item.longitude}
              </p>

              <p>
                <strong>Total Slots:</strong>{" "}
                {item.total_slots}
              </p>

              <p>
                <strong>Status:</strong>{" "}
                {item.verification_status}
              </p>

              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  marginTop: "15px",
                }}
              >
                <button
                  onClick={() =>
                    approveParking(item.id)
                  }
                  disabled={
                    actionLoading === item.id
                  }
                >
                  {actionLoading === item.id
                    ? "Processing..."
                    : "Approve"}
                </button>

                <button
                  onClick={() => {
                    setRejectingId(item.id);
                    setRejectionReason("");
                  }}
                  disabled={
                    actionLoading === item.id
                  }
                >
                  Reject
                </button>
              </div>

              {/* ================= REJECTION BOX ================= */}

              {rejectingId === item.id && (
                <div
                  style={{
                    marginTop: "20px",
                  }}
                >
                  <textarea
                    value={rejectionReason}
                    onChange={(e) =>
                      setRejectionReason(
                        e.target.value
                      )
                    }
                    placeholder="Enter rejection reason"
                    rows={4}
                    style={{
                      width: "100%",
                      padding: "10px",
                    }}
                  />

                  <div
                    style={{
                      display: "flex",
                      gap: "10px",
                      marginTop: "10px",
                    }}
                  >
                    <button
                      onClick={() =>
                        rejectParking(item.id)
                      }
                      disabled={
                        actionLoading === item.id
                      }
                    >
                      Confirm Rejection
                    </button>

                    <button
                      onClick={() => {
                        setRejectingId(null);
                        setRejectionReason("");
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;