"use client";

import { useState } from "react";

export default function Home() {
  const [schedule, setSchedule] = useState("");
  const [currentSchedule, setCurrentSchedule] = useState("");
  const [message, setMessage] = useState("");
  const [unstakingSchedule, setUnstakingSchedule] = useState("");
  const [currentUnstakingSchedule, setCurrentUnstakingSchedule] = useState("");
  const [fundingSchedule, setFundingSchedule] = useState("");
  const [currentFundingSchedule, setCurrentFundingSchedule] = useState("");
  const [accountCount, setAccountCount] = useState(5); // Default to 5 accounts
  const [generationMessage, setGenerationMessage] = useState("");

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
        // Update the corresponding schedule state
        if (type === "staking") {
          setCurrentSchedule(scheduleToUpdate);
        } else if (type === "unstaking") {
          setCurrentUnstakingSchedule(scheduleToUpdate);
        } else {
          setCurrentFundingSchedule(scheduleToUpdate);
        }
      } else {
        setMessage(data.error);
      }
    } catch (error) {
      setMessage(`An error occurred: ${error}`);
    }
  };

  const handleGenerateAccounts = async () => {
    try {
      const response = await fetch("/api/gen-generator-accounts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ count: accountCount }),
      });
      const data = await response.json();
      if (response.ok) {
        setGenerationMessage(
          `Successfully generated ${accountCount} accounts.`
        );
      } else {
        setGenerationMessage(`Error: ${data.error}`);
      }
    } catch (error) {
      setGenerationMessage(`An error occurred: ${error}`);
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

      <div className="mt-8">
        <h2 className="text-xl font-bold mb-2">Generate and Import Accounts</h2>
        <div className="flex items-center mb-4">
          <input
            type="number"
            value={accountCount}
            onChange={(e) => setAccountCount(parseInt(e.target.value))}
            className="border p-2 mr-2 w-20"
            min="1"
          />
          <button
            onClick={handleGenerateAccounts}
            className="bg-yellow-500 text-white p-2 rounded"
          >
            Generate Accounts
          </button>
        </div>
        {generationMessage && (
          <p className="text-green-500">{generationMessage}</p>
        )}
      </div>
    </div>
  );
}
