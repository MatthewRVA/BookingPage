// Replace with your deployed Vercel backend URL (include protocol)
const API_BASE = "https://booking-page-teal.vercel.app"; // <-- put your actual Vercel URL here

const dateInput = document.getElementById("date");
const timeSlotsDiv = document.getElementById("timeSlots");
const selectedTimeInput = document.getElementById("selectedTime");
const bookingForm = document.getElementById("bookingForm");
const successMsg = document.getElementById("successMsg");
const serviceSelect = document.getElementById("service");

// Map service names to your Zoho service IDs
const serviceMap = {
    "Cabinet Design Consultation": "4746908000000317054",
    "Showroom Visit": "SERVICE_ID_2",
    "Custom Quote Review": "SERVICE_ID_3"
};

// Clear time slots when service changes
serviceSelect.addEventListener("change", () => {
    timeSlotsDiv.innerHTML = "";
    selectedTimeInput.value = "";
});

function formatSlotToIso(dateStr, slotStr) {
    if (!dateStr || !slotStr) return null;

    const match = slotStr.trim().match(/^(\d{1,2}):(\d{2})(?:\s*([AaPp][Mm]))?$/);
    if (!match) return null;

    let [, hour, minute, ampm] = match;
    hour = parseInt(hour, 10);
    const mins = parseInt(minute, 10);

    if (ampm) {
        ampm = ampm.toUpperCase();
        if (ampm === "PM" && hour < 12) hour += 12;
        if (ampm === "AM" && hour === 12) hour = 0;
    }

    const date = new Date(`${dateStr}T${String(hour).padStart(2, "0")}:${String(mins).padStart(2, "0")}:00`);

    const offsetMinutes = -date.getTimezoneOffset();
    const sign = offsetMinutes >= 0 ? "+" : "-";
    const absOffset = Math.abs(offsetMinutes);
    const offsetHours = String(Math.floor(absOffset / 60)).padStart(2, "0");
    const offsetMins = String(absOffset % 60).padStart(2, "0");
    const offset = `${sign}${offsetHours}:${offsetMins}`;

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");

    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${offset}`;
}

// Fetch available time slots when date changes
dateInput.addEventListener("change", async () => {
    const date = dateInput.value;
    const serviceValue = serviceSelect.value;
    const service_id = serviceMap[serviceValue] || "";

    if (!date) return;

    if (!service_id) {
        timeSlotsDiv.textContent = "Please select a service first.";
        return;
    }

    timeSlotsDiv.innerHTML = "Loading...";

    try {
        const res = await fetch(`${API_BASE}/api/availability?date=${encodeURIComponent(date)}&service_id=${encodeURIComponent(service_id)}`);
        const data = await res.json();

        timeSlotsDiv.innerHTML = "";

        if (data.available_slots && data.available_slots.length > 0) {
            data.available_slots.forEach(slot => {
                const btn = document.createElement("button");
                btn.type = "button";
                btn.textContent = slot;
                btn.className = "time-btn";
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

    const serviceValue = document.getElementById("service").value;
    const service_id = serviceMap[serviceValue] || "";

    if (!service_id) {
        alert("Please select a valid service.");
        return;
    }

    const isoTime = formatSlotToIso(dateInput.value, selectedTimeInput.value);
    if (!isoTime) {
        alert("Please select a valid time slot.");
        return;
    }

    const bookingData = {
        customer_details: {
            name: document.getElementById("fullname").value,
            email: document.getElementById("email").value,
            phone: document.getElementById("phone").value
        },
        service_id: service_id,
        appointment_time: isoTime,
        start_time: isoTime,
        custom_fields: [
            { label: "Additional Notes", value: document.getElementById("notes").value }
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