"use client";

import { useState, useEffect } from "react";

export default function Home() {
  const [schedule, setSchedule] = useState("");
  const [currentSchedule, setCurrentSchedule] = useState("");
  const [message, setMessage] = useState("");
  const [unstakingSchedule, setUnstakingSchedule] = useState("");
  const [currentUnstakingSchedule, setCurrentUnstakingSchedule] = useState("");
  const [fundingSchedule, setFundingSchedule] = useState("");
  const [currentFundingSchedule, setCurrentFundingSchedule] = useState("");

  useEffect(() => {
    fetchCurrentSchedules();
  }, []);

  const fetchCurrentSchedules = async () => {
    try {
      const stakingResponse = await fetch("/api/get-staking-schedule");
      const unstakingResponse = await fetch("/api/get-unstaking-schedule");
      const fundingResponse = await fetch("/api/get-funding-schedule");
      const stakingData = await stakingResponse.json();
      const unstakingData = await unstakingResponse.json();
      const fundingData = await fundingResponse.json();
      setCurrentSchedule(stakingData.schedule);
      setCurrentUnstakingSchedule(unstakingData.schedule);
      setCurrentFundingSchedule(fundingData.schedule);
    } catch (error) {
      console.error("Error fetching current schedules:", error);
    }
  };

  const handleSubmit = async (
    e: React.FormEvent,
    type: "staking" | "unstaking" | "funding"
  ) => {
    e.preventDefault();
    try {
      const scheduleToUpdate =
        type === "staking"
          ? schedule
          : type === "unstaking"
          ? unstakingSchedule
          : fundingSchedule;
      const response = await fetch(`/api/update-${type}-schedule`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ schedule: scheduleToUpdate }),
      });
      const data = await response.json();
      if (response.ok) {
        setMessage(data.message);
        fetchCurrentSchedules();
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
      <p className="mb-4">Current staking schedule: {currentSchedule}</p>
      <p className="mb-4">
        Current unstaking schedule: {currentUnstakingSchedule}
      </p>
      <p className="mb-4">Current funding schedule: {currentFundingSchedule}</p>
      <form onSubmit={(e) => handleSubmit(e, "staking")} className="mb-4">
        <input
          type="text"
          value={schedule}
          onChange={(e) => setSchedule(e.target.value)}
          placeholder="Enter staking cron schedule"
          className="border p-2 mr-2"
        />
        <button type="submit" className="bg-blue-500 text-white p-2 rounded">
          Update Staking Schedule
        </button>
      </form>
      <form onSubmit={(e) => handleSubmit(e, "unstaking")} className="mb-4">
        <input
          type="text"
          value={unstakingSchedule}
          onChange={(e) => setUnstakingSchedule(e.target.value)}
          placeholder="Enter unstaking cron schedule"
          className="border p-2 mr-2"
        />
        <button type="submit" className="bg-green-500 text-white p-2 rounded">
          Update Unstaking Schedule
        </button>
      </form>
      <form onSubmit={(e) => handleSubmit(e, "funding")} className="mb-4">
        <input
          type="text"
          value={fundingSchedule}
          onChange={(e) => setFundingSchedule(e.target.value)}
          placeholder="Enter funding cron schedule"
          className="border p-2 mr-2"
        />
        <button type="submit" className="bg-purple-500 text-white p-2 rounded">
          Update Funding Schedule
        </button>
      </form>
      {message && <p className="text-green-500">{message}</p>}
    </div>
  );
}
