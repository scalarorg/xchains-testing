"use client";

import { useState } from "react";
import cronstrue from "cronstrue";
import CronStringBuilder from "./components/CronStringBuilder";

export default function Home() {
  const [schedule, setSchedule] = useState("* * * * *");
  const [currentSchedule, setCurrentSchedule] = useState("");
  const [message, setMessage] = useState("");
  const [unstakingSchedule, setUnstakingSchedule] = useState("* * * * *");
  const [currentUnstakingSchedule, setCurrentUnstakingSchedule] = useState("");
  const [fundingSchedule, setFundingSchedule] = useState("* * * * *");
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

      {/* Schedule forms and account generator in a grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Staking Schedule Form */}
        <div className="md:col-span-1 p-4 bg-blue-50 rounded-lg border border-blue-100">
          <h2 className="font-semibold mb-4 text-blue-800">Staking Schedule</h2>
          <p className="mb-4">
            Current schedule:{" "}
            {currentSchedule
              ? cronstrue.toString(currentSchedule)
              : "No schedule set"}
          </p>
          <form onSubmit={(e) => handleSubmit(e, "staking")}>
            <CronStringBuilder value={schedule} onChange={setSchedule} />
            <button
              type="submit"
              className="w-full bg-blue-500 text-white p-2 rounded mt-4 hover:bg-blue-600"
            >
              Update Staking
            </button>
          </form>
        </div>

        {/* Unstaking Schedule Form */}
        <div className="md:col-span-1 p-4 bg-green-50 rounded-lg border border-green-100">
          <h2 className="font-semibold mb-4 text-green-800">
            Unstaking Schedule
          </h2>
          <p className="mb-4">
            Current schedule:{" "}
            {currentUnstakingSchedule
              ? cronstrue.toString(currentUnstakingSchedule)
              : "No schedule set"}
          </p>
          <form onSubmit={(e) => handleSubmit(e, "unstaking")}>
            <CronStringBuilder
              value={unstakingSchedule}
              onChange={setUnstakingSchedule}
            />
            <button
              type="submit"
              className="w-full bg-green-500 text-white p-2 rounded mt-4 hover:bg-green-600"
            >
              Update Unstaking
            </button>
          </form>
        </div>

        {/* Funding Schedule Form */}
        <div className="md:col-span-1 p-4 bg-purple-50 rounded-lg border border-purple-100">
          <h2 className="font-semibold mb-4 text-purple-800">
            Funding Schedule
          </h2>
          <p className="mb-4">
            Current schedule:{" "}
            {currentFundingSchedule
              ? cronstrue.toString(currentFundingSchedule)
              : "No schedule set"}
          </p>
          <form onSubmit={(e) => handleSubmit(e, "funding")}>
            <CronStringBuilder
              value={fundingSchedule}
              onChange={setFundingSchedule}
            />
            <button
              type="submit"
              className="w-full bg-purple-500 text-white p-2 rounded mt-4 hover:bg-purple-600"
            >
              Update Funding
            </button>
          </form>
        </div>

        {/* Account Generator */}
        <div className="md:col-span-1 p-4 bg-yellow-50 rounded-lg border border-yellow-100">
          <h2 className="font-semibold mb-4 text-yellow-800">
            Generate and Import Accounts
          </h2>
          <div className="flex items-center">
            <input
              type="number"
              value={accountCount}
              onChange={(e) => setAccountCount(parseInt(e.target.value))}
              className="border p-2 mr-2 w-20 rounded"
              min="1"
            />
            <button
              onClick={handleGenerateAccounts}
              className="bg-yellow-500 text-white p-2 rounded hover:bg-yellow-600"
            >
              Generate Accounts
            </button>
          </div>
          {generationMessage && (
            <p className="text-green-500 mt-2">{generationMessage}</p>
          )}
        </div>
      </div>

      {/* Status message */}
      {message && <p className="text-green-500 mt-4">{message}</p>}
    </div>
  );
}
