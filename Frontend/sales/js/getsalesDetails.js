import config from "../../helper/config.js";

// this will get the sales person name and their id
export const getsalesDetails = async () => {
  try {
    const authToken = localStorage.getItem("authToken");
    const salesemail = localStorage.getItem("userEmail");
    if (!authToken) {
      console.error("No auth token found");
      return;
    }

    const response = await fetch(
      `${config.BASE_URL}/sales/sales-member?email=${encodeURIComponent(
        salesemail
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
