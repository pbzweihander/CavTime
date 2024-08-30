import { ArrowDownIcon } from "@heroicons/react/24/solid";
import { DateTime } from "luxon";
import { useState } from "react";
import tzdata from "tzdata";

const tzNames = Object.keys(tzdata.zones)
  .filter((tz) => tz.includes("/") && DateTime.local().setZone(tz).isValid)
  .sort((a, b) => (a < b ? -1 : 1));
const days = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export default function App() {
  const [time, setTime] = useState(1700);
  const [timeStr, setTimeStr] = useState(time.toString());
  const [day, setDay] = useState<number | undefined>(undefined);

  const [tz, setTz] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone,
  );
  const tzoffset = DateTime.local().setZone(tz).offset;
  const localtime = time + (tzoffset / 60) * 100;
  let dayStr;
  let localtimeNormalized;
  if (localtime > 2400) {
    if (day !== undefined) {
      dayStr = days[(day + 1) % days.length];
    } else {
      dayStr = "the day after";
    }
    localtimeNormalized = localtime % 2400;
  } else if (localtime < 0) {
    if (day !== undefined) {
      dayStr = days[((day - 1) % days.length) + days.length];
    } else {
      dayStr = "the day before";
    }
    localtimeNormalized = (localtime % 2400) + 2400;
  } else {
    if (day !== undefined) {
      dayStr = days[day];
    } else {
      dayStr = "";
    }
    localtimeNormalized = localtime;
  }
  const localtimeStr =
    localtimeNormalized < 10
      ? `000${localtimeNormalized}`
      : localtimeNormalized < 100
        ? `00${localtimeNormalized}`
        : localtimeNormalized < 1000
          ? `0${localtimeNormalized}`
          : `${localtimeNormalized}`;

  const [tzStr, setTzStr] = useState(tz);

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-slate-200 lg:py-10">
      <div className="h-full w-full rounded bg-slate-100 p-4 md:h-[300px] md:w-2/3 lg:w-1/3">
        <div className="flex gap-2">
          <div className="w-[100px]">
            <label className="label label-text">Time</label>
            <label className="input input-bordered flex items-center gap-2">
              <input
                type="text"
                className="w-full"
                value={timeStr}
                onChange={(e) => {
                  const value = e.target.value;
                  const valueInt = parseInt(e.target.value);
                  setTimeStr(value);
                  if (!isNaN(valueInt)) {
                    setTime(valueInt);
                  }
                }}
              />
              <span className="text-xl">Z</span>
            </label>
          </div>
          <div className="w-[150px]">
            <label className="label label-text">Day</label>
            <select
              className="select select-bordered w-full"
              value={day === undefined ? "None" : days[day]}
              onChange={(e) => {
                const value = e.target.value;
                if (value === "None") {
                  setDay(undefined);
                } else {
                  setDay(days.indexOf(e.target.value));
                }
              }}
            >
              <option>None</option>
              <option>Monday</option>
              <option>Tuesday</option>
              <option>Wednesday</option>
              <option>Thursday</option>
              <option>Friday</option>
              <option>Saturday</option>
              <option>Sunday</option>
            </select>
          </div>
        </div>
        <div className="divider">
          <ArrowDownIcon className="w-10" />
        </div>
        <div className="mb-1 px-2 text-lg font-bold">
          {localtimeStr} {dayStr}
        </div>
        <div className="input input-bordered flex w-full items-center">
          <label className="mr-2">in</label>
          <input
            type="text"
            className="grow"
            list="tz-names"
            value={tzStr}
            onChange={(e) => {
              const newTzName = e.target.value;
              setTzStr(newTzName);
              if (DateTime.local().setZone(newTzName).isValid) {
                setTz(newTzName);
              }
            }}
          />
          <datalist id="tz-names">
            {tzNames.map((tzName) => (
              <option key={tzName} value={tzName} />
            ))}
          </datalist>
        </div>
      </div>
    </div>
  );
}
