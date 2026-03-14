// api/availability.js
export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const { date } = req.query;
  if (!date) return res.status(400).json({ error: "Date parameter required" });

  try {
    const response = await fetch(
      `https://www.zohoapis.com/bookings/v1/json/availability?service_id=${process.env.SERVICE_ID}&date=${date}`,
      {
        method: "GET",
        headers: {
          Authorization: `Zoho-oauthtoken ${process.env.ZOHO_ACCESS_TOKEN}`,
          orgId: process.env.ZOHO_ORG_ID,
          "Content-Type": "application/json"
        }
      }
    );

    const data = await response.json();
    res.status(200).json({ available_slots: data.available_slots || [] });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch availability" });
  }
}