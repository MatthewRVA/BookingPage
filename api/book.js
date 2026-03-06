// api/book.js
import axios from "axios";

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        const bookingData = req.body;

        // Send booking request to Zoho Bookings API
        const response = await axios.post(
            "https://www.zohoapis.com/bookings/v1/json/appointments",
            bookingData,
            {
                headers: {
                    Authorization: `Zoho-oauthtoken ${process.env.ZOHO_TOKEN}`,
                    orgId: process.env.ZOHO_ORG_ID,
                    "Content-Type": "application/json"
                }
            }
        );

        // Return Zoho's response back to frontend
        res.status(200).json(response.data);

    } catch (error) {
        console.error(error.response?.data || error);

        res.status(500).json({
            error: "Booking failed"
        });
    }
}