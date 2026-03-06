// api/availability.js
import axios from "axios";

export default async function handler(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const { date } = req.query;

    if (!date) {
        return res.status(400).json({ error: "Date parameter is required" });
    }

    try {
        // Fetch availability from Zoho Bookings API
        const response = await axios.get(
            "https://www.zohoapis.com/bookings/v1/json/availability",
            {
                params: {
                    service_id: process.env.SERVICE_ID,
                    date: date
                },
                headers: {
                    Authorization: `Zoho-oauthtoken ${process.env.ZOHO_TOKEN}`,
                    orgId: process.env.ZOHO_ORG_ID
                }
            }
        );

        const slots = response.data.available_slots || [];

        res.status(200).json({
            available_slots: slots
        });

    } catch (error) {
        console.error(error.response?.data || error);
        res.status(500).json({ error: "Failed to fetch availability" });
    }
}