// api/book.js
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const bookingData = req.body;

    const response = await fetch(
      "https://www.zohoapis.com/bookings/v1/json/appointments",
      {
        method: "POST",
        headers: {
          Authorization: `Zoho-oauthtoken ${process.env.ZOHO_ACCESS_TOKEN}`,
          orgId: process.env.ZOHO_ORG_ID,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(bookingData)
      }
    );

    const data = await response.json();
    res.status(200).json(data);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Booking failed" });
  }
}