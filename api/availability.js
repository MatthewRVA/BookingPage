// api/availability.js
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

    console.log("Refreshed Zoho access token for availability");

    return newAccessToken;

  } catch (err) {
    console.error("Failed to refresh Zoho token:", err.response?.data || err);
    throw new Error("Could not refresh Zoho access token");
  }
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { date } = req.query;

  if (!date) {
    return res.status(400).json({ error: "Date parameter is required" });
  }

  try {
    let accessToken = process.env.ZOHO_ACCESS_TOKEN;

    // Try fetching availability
    try {
      const response = await axios.get(
        `${process.env.ZOHO_API_DOMAIN}/bookings/v1/json/availability`,
        {
          params: {
            service_id: process.env.SERVICE_ID,
            date: date
          },
          headers: {
            Authorization: `Zoho-oauthtoken ${accessToken}`,
            "Content-Type": "application/json"
          }
        }
      );

      const slots = response.data.available_slots || [];

      return res.status(200).json({ available_slots: slots });

    } catch (err) {
      // If token expired, refresh and retry
      if (err.response?.status === 401) {
        console.log("Access token expired, refreshing for availability...");

        accessToken = await refreshAccessToken();

        const retry = await axios.get(
          `${process.env.ZOHO_API_DOMAIN}/bookings/v1/json/availability`,
          {
            params: {
              service_id: process.env.SERVICE_ID,
              date: date
            },
            headers: {
              Authorization: `Zoho-oauthtoken ${accessToken}`,
              "Content-Type": "application/json"
            }
          }
        );

        const slots = retry.data.available_slots || [];
        return res.status(200).json({ available_slots: slots });
      }

      // Other errors
      throw err;
    }

  } catch (error) {
    console.error("Failed to fetch availability:", error.response?.data || error);
    return res.status(500).json({ error: "Failed to fetch availability" });
  }
}