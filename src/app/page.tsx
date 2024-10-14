"use client";

import { useState, useEffect } from "react";

export default function Home() {
  const [schedule, setSchedule] = useState("");
  const [currentSchedule, setCurrentSchedule] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchCurrentSchedule();
  }, []);

  const fetchCurrentSchedule = async () => {
    try {
      const response = await fetch("/api/get-schedule");
      const data = await response.json();
      setCurrentSchedule(data.schedule);
    } catch (error) {
      console.error("Error fetching current schedule:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/update-schedule", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ schedule }),
      });
      const data = await response.json();
      if (response.ok) {
        setMessage(data.message);
        fetchCurrentSchedule();
      } else {
        setMessage(data.error);
      }
    } catch (error) {
      setMessage("An error occurred");
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Bitcoin Transaction Scheduler</h1>
      <p className="mb-4">Current schedule: {currentSchedule}</p>
      <form onSubmit={handleSubmit} className="mb-4">
        <input
          type="text"
          value={schedule}
          onChange={(e) => setSchedule(e.target.value)}
          placeholder="Enter cron schedule"
          className="border p-2 mr-2"
        />
        <button type="submit" className="bg-blue-500 text-white p-2 rounded">
          Update Schedule
        </button>
      </form>
      {message && <p className="text-green-500">{message}</p>}
    </div>
  );
}
