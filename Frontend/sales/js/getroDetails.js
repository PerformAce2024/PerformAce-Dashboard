import config from "../../helper/config.js";

// this will receive the client id and get the ro Ids associated with that client and populate the ro dropdown
export const getroDetails = async (client_id) => {
  try {
    const authToken = localStorage.getItem("authToken");
    if (!authToken) {
      console.error("No auth token found");
      return;
    }

    const response = await fetch(
      `${config.BASE_URL}/sales/sales-ros?client_id=${encodeURIComponent(
        client_id
      )}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error fetching sales:", error.message);
  }
};
