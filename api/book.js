// api/book.js
import axios from "axios";

/**
 * Refresh the Zoho access token using the refresh token
 */
async function refreshAccessToken() {
  try {
    const response = await axios.post(
      "https://accounts.zoho.com/oauth/v2/token",
      null,
      {
        params: {
          grant_type: "refresh_token",
          client_id: process.env.ZOHO_CLIENT_ID,
          client_secret: process.env.ZOHO_CLIENT_SECRET,
          refresh_token: process.env.ZOHO_REFRESH_TOKEN
        }
      }
    );

    const newAccessToken = response.data.access_token;

    // NOTE: For production, store newAccessToken somewhere persistent
    console.log("Refreshed Zoho access token");

    return newAccessToken;

  } catch (err) {
    console.error("Failed to refresh Zoho token:", err.response?.data || err);
    throw new Error("Could not refresh Zoho access token");
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    let accessToken = process.env.ZOHO_ACCESS_TOKEN; // initial token
    const bookingData = req.body;

    // Try sending the booking request
    try {
      const response = await axios.post(
        `${process.env.ZOHO_API_DOMAIN}/bookings/v1/json/appointments`,
        bookingData,
        {
          headers: {
            Authorization: `Zoho-oauthtoken ${accessToken}`,
            "Content-Type": "application/json"
          }
        }
      );

      return res.status(200).json(response.data);

    } catch (err) {
      // If token expired, refresh and retry
      if (err.response?.status === 401) {
        console.log("Access token expired, refreshing...");

        accessToken = await refreshAccessToken();

        const retry = await axios.post(
          `${process.env.ZOHO_API_DOMAIN}/bookings/v1/json/appointments`,
          bookingData,
          {
            headers: {
              Authorization: `Zoho-oauthtoken ${accessToken}`,
              "Content-Type": "application/json"
            }
          }
        );

        return res.status(200).json(retry.data);
      }

      // Other errors
      throw err;
    }

  } catch (error) {
    console.error("Booking failed:", error.response?.data || error);

    res.status(500).json({
      error: "Booking failed"
    });
  }
}