// Replace with your deployed Vercel backend URL
const API_BASE = "https://booking-api.vercel.app";

const dateInput = document.getElementById("date");
const timeSlotsDiv = document.getElementById("timeSlots");
const selectedTimeInput = document.getElementById("selectedTime");
const bookingForm = document.getElementById("bookingForm");
const successMsg = document.getElementById("successMsg");

// Fetch available time slots when date changes
dateInput.addEventListener("change", async () => {
    const date = dateInput.value;
    if (!date) return;

    timeSlotsDiv.innerHTML = "Loading...";

    try {
        const res = await fetch(`${API_BASE}/api/availability?date=${date}`);
        const data = await res.json();

        timeSlotsDiv.innerHTML = "";

        if (data.available_slots && data.available_slots.length > 0) {
            data.available_slots.forEach(slot => {
                const btn = document.createElement("button");
                btn.type = "button";
                btn.textContent = slot;
                btn.onclick = () => {
                    selectedTimeInput.value = slot;
                    // Highlight selected
                    Array.from(timeSlotsDiv.children).forEach(b => b.classList.remove("selected"));
                    btn.classList.add("selected");
                };
                timeSlotsDiv.appendChild(btn);
            });
        } else {
            timeSlotsDiv.textContent = "No available times on this day.";
        }
    } catch (err) {
        console.error(err);
        timeSlotsDiv.textContent = "Error loading times.";
    }
});

// Submit booking form
bookingForm.addEventListener("submit", async function(e) {
    e.preventDefault();

    // Map service names to your Zoho service IDs
    const serviceMap = {
        "Cabinet Design Consultation": "SERVICE_ID_1",
        "Showroom Visit": "SERVICE_ID_2",
        "Custom Quote Review": "SERVICE_ID_3"
    };

    const bookingData = {
        customer_details: {
            name: document.getElementById("fullname").value,
            email: document.getElementById("email").value,
            phone: document.getElementById("phone").value
        },
        service_id: serviceMap[document.getElementById("service").value] || "",
        appointment_time: dateInput.value + "T" + selectedTimeInput.value,
        custom_fields: [
            { label: "Additional Notes", value: document.getElementById("notes").value },
            { label: "Budget Range", value: document.getElementById("budget").value }
        ]
    };

    try {
        const res = await fetch(`${API_BASE}/api/book`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(bookingData)
        });

        const result = await res.json();

        if (result && result.appointment_id) {
            successMsg.style.display = "block";
            bookingForm.reset();
            timeSlotsDiv.innerHTML = "";
        } else {
            alert("Booking failed, please try again.");
        }
    } catch (err) {
        console.error(err);
        alert("Error connecting to server.");
    }
});
