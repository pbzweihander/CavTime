import { ArrowDownIcon } from "@heroicons/react/24/solid";
import classNames from "classnames";
import { DateTime } from "luxon";
import { useCallback, useState } from "react";
import { useSearchParams } from "react-router-dom";
import tzdata from "tzdata";

import Logo from "./Logo";

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
  const [searchParams, setSearchParams] = useSearchParams();

  const localnow = DateTime.local().setZone("UTC");
  const defaultTime = localnow.hour * 100;
  const paramTimeMaybe = searchParams.get("zulu");
  let paramTime = undefined;
  if (paramTimeMaybe !== null && /^\d+$/.test(paramTimeMaybe)) {
    paramTime = parseInt(paramTimeMaybe);
    if (isNaN(paramTime) || paramTime < 0 || paramTime >= 2400) {
      paramTime = undefined;
    }
  }
  const [time, setTimeOrig] = useState(paramTime ?? defaultTime);
  const setTime = useCallback(
    (newTime: number) => {
      setTimeOrig(newTime);
      setSearchParams((params) => {
        params.set("zulu", `${newTime}`);
        return params;
      });
    },
    [setSearchParams, setTimeOrig],
  );

  const [timeStr, setTimeStr] = useState(time.toString());

  const paramDayMaybe = searchParams.get("day");
  let paramDay = undefined;
  if (paramDayMaybe !== null) {
    paramDay = parseInt(paramDayMaybe);
    if (paramDay < 0 || paramDay >= days.length) {
      paramDay = undefined;
    }
  }
  const [day, setDayOrig] = useState<number | undefined>(paramDay);
  const setDay = useCallback(
    (newDay: number | undefined) => {
      setDayOrig(newDay);
      setSearchParams((params) => {
        if (newDay !== undefined) {
          params.set("day", `${newDay}`);
        } else {
          params.delete("day");
        }
        return params;
      });
    },
    [setSearchParams, setDayOrig],
  );

  const [isTimeError, setIsTimeError] = useState(false);

  const [tz, setTz] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone,
  );
  const tzoffset = DateTime.local().setZone(tz).offset;
  const localtime = time + (tzoffset / 60) * 100;
  let dayStr;
  let localtimeNormalized;
  if (localtime >= 2400) {
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
    <div className="flex h-screen w-screen items-center justify-center bg-base-200 lg:py-10">
      <Logo className="absolute left-8 top-0 hidden md:block md:w-[100px] lg:left-12 lg:top-4 lg:w-[200px]" />
      <div className="h-full w-full rounded bg-base-100 p-4 md:h-[300px] md:w-2/3 lg:w-1/3">
        <div className="flex gap-2">
          <div className="w-[100px]">
            <label className="label label-text">Time</label>
            <label
              className={classNames(
                "input input-bordered flex items-center gap-2",
                isTimeError && "input-error",
              )}
            >
              <input
                type="text"
                className="w-full"
                value={timeStr}
                onChange={(e) => {
                  const value = e.target.value;
                  const valueInt = parseInt(value);
                  setTimeStr(value);
                  if (
                    /^\d+$/.test(value) &&
                    !isNaN(valueInt) &&
                    valueInt >= 0 &&
                    valueInt < 2400
                  ) {
                    setTime(valueInt);
                    setIsTimeError(false);
                  } else {
                    setIsTimeError(true);
                  }
                }}
              />
              <span className="text-xl">Z</span>
            </label>
          </div>
          <div className="w-[150px]">
            <div className="label">
              <span className="label-text">Day</span>
              <span className="label-text-alt text-xs">(Optional)</span>
            </div>
            <select
              className="select select-bordered w-full"
              value={day === undefined ? "None" : days[day]}
              onChange={(e) => {
                const value = e.target.value;
                if (value === "") {
                  setDay(undefined);
                } else {
                  setDay(days.indexOf(e.target.value));
                }
              }}
            >
              <option></option>
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
        <div className="mb-2 px-3 text-lg font-bold">
          {localtimeStr} {dayStr} in {tzStr}
        </div>
        <label className="label label-text">Change timezone</label>
        <input
          type="text"
          className="input input-bordered w-full"
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
  );
}
