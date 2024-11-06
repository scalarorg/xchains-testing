import { useState, useEffect } from "react";

interface CronStringBuilderProps {
  value: string;
  onChange: (value: string) => void;
  onValid?: (isValid: boolean) => void;
}

export default function CronStringBuilder({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  value,
  onChange,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onValid,
}: CronStringBuilderProps) {
  const [minute, setMinute] = useState("*");
  const [hour, setHour] = useState("*");
  const [dayOfMonth, setDayOfMonth] = useState("*");
  const [month, setMonth] = useState("*");
  const [dayOfWeek, setDayOfWeek] = useState("*");

  // Set initial cron string on mount
  useEffect(() => {
    updateCronString(minute, hour, dayOfMonth, month, dayOfWeek);
  }, []); // Empty dependency array means this runs once on mount

  const updateCronString = (
    min: string,
    hr: string,
    dom: string,
    mon: string,
    dow: string
  ) => {
    const cronString = `${min} ${hr} ${dom} ${mon} ${dow}`;
    onChange(cronString);
  };

  const generateOptions = (start: number, end: number) => {
    return Array.from({ length: end - start + 1 }, (_, i) => i + start);
  };

  return (
    <div className="h-full space-y-2 p-4 rounded-lg bg-gray-50">
      <div className="flex flex-row gap-2 flex-wrap">
        <div className="flex-1 min-w-[120px]">
          <label className="block text-xs font-medium text-gray-700">
            Minute
          </label>
          <select
            className="mt-1 block w-full text-sm rounded-md border-gray-300 shadow-sm"
            value={minute}
            onChange={(e) => {
              setMinute(e.target.value);
              updateCronString(
                e.target.value,
                hour,
                dayOfMonth,
                month,
                dayOfWeek
              );
            }}
          >
            <option value="*">Every minute (*)</option>
            <option value="*/5">Every 5 minutes</option>
            <option value="*/15">Every 15 minutes</option>
            <option value="*/30">Every 30 minutes</option>
            {generateOptions(0, 59).map((num) => (
              <option key={num} value={num}>
                At minute {num}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1 min-w-[120px]">
          <label className="block text-xs font-medium text-gray-700">
            Hour
          </label>
          <select
            className="mt-1 block w-full text-sm rounded-md border-gray-300 shadow-sm"
            value={hour}
            onChange={(e) => {
              setHour(e.target.value);
              updateCronString(
                minute,
                e.target.value,
                dayOfMonth,
                month,
                dayOfWeek
              );
            }}
          >
            <option value="*">Every hour (*)</option>
            {generateOptions(0, 23).map((num) => (
              <option key={num} value={num}>
                At {num}:00
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1 min-w-[120px]">
          <label className="block text-xs font-medium text-gray-700">
            Day of Month
          </label>
          <select
            className="mt-1 block w-full text-sm rounded-md border-gray-300 shadow-sm"
            value={dayOfMonth}
            onChange={(e) => {
              setDayOfMonth(e.target.value);
              updateCronString(minute, hour, e.target.value, month, dayOfWeek);
            }}
          >
            <option value="*">Every day (*)</option>
            {generateOptions(1, 31).map((num) => (
              <option key={num} value={num}>
                On day {num}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1 min-w-[120px]">
          <label className="block text-xs font-medium text-gray-700">
            Month
          </label>
          <select
            className="mt-1 block w-full text-sm rounded-md border-gray-300 shadow-sm"
            value={month}
            onChange={(e) => {
              setMonth(e.target.value);
              updateCronString(
                minute,
                hour,
                dayOfMonth,
                e.target.value,
                dayOfWeek
              );
            }}
          >
            <option value="*">Every month (*)</option>
            {[
              "Jan",
              "Feb",
              "Mar",
              "Apr",
              "May",
              "Jun",
              "Jul",
              "Aug",
              "Sep",
              "Oct",
              "Nov",
              "Dec",
            ].map((month, index) => (
              <option key={month} value={index + 1}>
                {month}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1 min-w-[120px]">
          <label className="block text-xs font-medium text-gray-700">
            Day of Week
          </label>
          <select
            className="mt-1 block w-full text-sm rounded-md border-gray-300 shadow-sm"
            value={dayOfWeek}
            onChange={(e) => {
              setDayOfWeek(e.target.value);
              updateCronString(minute, hour, dayOfMonth, month, e.target.value);
            }}
          >
            <option value="*">Every day (*)</option>
            {[
              "Sunday",
              "Monday",
              "Tuesday",
              "Wednesday",
              "Thursday",
              "Friday",
              "Saturday",
            ].map((day, index) => (
              <option key={day} value={index}>
                {day}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
