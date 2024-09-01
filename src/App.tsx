import { MoonIcon, SunIcon } from "@heroicons/react/24/outline";
import { ArrowRightIcon } from "@heroicons/react/24/solid";
import classNames from "classnames";
import { DateTime } from "luxon";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import tzdata from "tzdata";

import Logo from "./Logo";
import GitHubMark from "./github-mark.svg?react";

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

function getTimezoneOffset(tz: string): number {
  return DateTime.local().setZone(tz).offset / 60;
}

function formatNumberWithSign(n: number): string {
  if (n > 0) {
    return `+${n}`;
  } else {
    return `${n}`;
  }
}

function parseTime(s: string | undefined | null): number | undefined {
  if (s != null && /^\d+$/.test(s)) {
    const n = parseInt(s);
    if (!isNaN(n) && n >= 0 && n < 2400) {
      return n;
    }
  }
  return undefined;
}

function parseDayIndex(s: string | undefined | null): number | undefined {
  if (s != null && /^\d+$/.test(s)) {
    const n = parseInt(s);
    if (!isNaN(n) && n >= 0 && n < days.length) {
      return n;
    }
  }
  return undefined;
}

function makeDayStr(dayIndex: number | undefined, localtime: number): string {
  if (localtime >= 2400) {
    if (dayIndex !== undefined) {
      return days[(dayIndex + 1) % days.length];
    } else {
      return "the day after";
    }
  } else if (localtime < 0) {
    if (dayIndex !== undefined) {
      return days[((dayIndex - 1) % days.length) + days.length];
    } else {
      return "the day before";
    }
  } else {
    if (dayIndex !== undefined) {
      return days[dayIndex];
    } else {
      return "";
    }
  }
}

function makeLocaltimeStr(localtime: number): string {
  let localtimeNormalized;
  if (localtime >= 2400) {
    localtimeNormalized = localtime % 2400;
  } else if (localtime < 0) {
    localtimeNormalized = (localtime % 2400) + 2400;
  } else {
    localtimeNormalized = localtime;
  }
  if (localtimeNormalized < 10) {
    return `000${localtimeNormalized}`;
  } else if (localtimeNormalized < 100) {
    return `00${localtimeNormalized}`;
  } else if (localtimeNormalized < 1000) {
    return `0${localtimeNormalized}`;
  } else {
    return `${localtimeNormalized}`;
  }
}

function isTimezoneValid(tz: string | undefined | null): boolean {
  if (tz == null || tz.length === 0) {
    return false;
  }
  return DateTime.local().setZone(tz).isValid;
}

export default function App() {
  const [theme, setTheme] = useState(localStorage.getItem("theme") ?? "light");
  useEffect(() => {
    localStorage.setItem("theme", theme);
  }, [theme]);

  const [searchParams, setSearchParams] = useSearchParams();

  const localnow = DateTime.local().setZone("UTC");
  const defaultTime = localnow.hour * 100;
  const [time, setTime] = useState(
    parseTime(searchParams.get("zulu")) ?? defaultTime,
  );
  useEffect(() => {
    setSearchParams((params) => {
      params.set("zulu", `${time}`);
      return params;
    });
  }, [setSearchParams, time]);

  const [timeStr, setTimeStr] = useState(time.toString());

  const [dayIndex, setDayIndex] = useState<number | undefined>(
    parseDayIndex(searchParams.get("day")),
  );
  useEffect(() => {
    setSearchParams((params) => {
      if (dayIndex !== undefined) {
        params.set("day", `${dayIndex}`);
      } else {
        params.delete("day");
      }
      return params;
    });
  }, [setSearchParams, dayIndex]);
  const day = dayIndex !== undefined ? days[dayIndex] : "";

  const [isTimeError, setIsTimeError] = useState(false);

  const localtz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const paramTz = searchParams.get("tz") ?? "";
  const [tz, setTz] = useState(isTimezoneValid(paramTz) ? paramTz : localtz);
  useEffect(() => {
    setSearchParams((params) => {
      params.set("tz", tz);
      return params;
    });
  }, [setSearchParams, tz]);
  const tzoffset = getTimezoneOffset(tz);
  const localtime = time + tzoffset * 100;
  const dayStr = makeDayStr(dayIndex, localtime);
  const localtimeStr = makeLocaltimeStr(localtime);

  const tzSearchRef = useRef<HTMLDetailsElement>(null);
  const [tzSearch, setTzSearch] = useState("");

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-base-200 lg:py-10">
      <Logo className="absolute left-8 top-0 hidden md:block md:w-[100px] lg:left-12 lg:top-4 lg:w-[200px]" />
      <a
        className="absolute right-2 top-2 hidden h-fit md:block"
        href="https://github.com/pbzweihander/CavTime"
      >
        <GitHubMark
          className={classNames(
            "m-2 h-10 w-10",
            theme === "dark" ? "fill-[#fff]" : "fill-[#24292f]",
          )}
        />
      </a>
      <div className="h-full w-full rounded bg-base-100 p-4 md:h-fit md:w-2/3 lg:w-1/3">
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
              value={day}
              onChange={(e) => {
                const value = e.target.value;
                if (value === "") {
                  setDayIndex(undefined);
                } else {
                  setDayIndex(days.indexOf(e.target.value));
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
          <span className="grow" />
          <label className="swap swap-rotate h-fit">
            <input
              type="checkbox"
              className="theme-controller"
              value="dark"
              checked={theme === "dark"}
              onChange={(e) => {
                if (e.target.checked) {
                  setTheme("dark");
                } else {
                  setTheme("light");
                }
              }}
            />
            <MoonIcon className="swap-on w-10" />
            <SunIcon className="swap-off w-10" />
          </label>
        </div>
        <label className="label label-text">In Timezone</label>
        <div className="flex">
          <details ref={tzSearchRef} className="dropdown mb-1 mr-1 flex-1">
            <summary className="btn btn-ghost w-full justify-start rounded-md border border-base-content/20 text-base font-normal">
              <span>{tz}</span>
              <span className="grow" />
              <span>{formatNumberWithSign(tzoffset)}</span>
            </summary>
            <div className="dropdown-content w-full rounded-md border border-base-content/20 bg-base-100 px-2 pb-1 pt-2">
              <input
                type="text"
                className="input input-sm input-bordered mb-1 w-full"
                value={tzSearch}
                onChange={(e) => {
                  setTzSearch(e.target.value);
                }}
              />
              <ul className="menu max-h-[30vh] flex-row overflow-y-scroll">
                {tzNames
                  .filter(
                    (tzName) => tzName.toLowerCase().indexOf(tzSearch) > -1,
                  )
                  .map((tzName) => (
                    <li key={tzName} className="w-full">
                      <button
                        onClick={() => {
                          setTz(tzName);
                          tzSearchRef.current?.removeAttribute("open");
                        }}
                      >
                        <span>{tzName}</span>
                        <span className="grow" />
                        <span>
                          {formatNumberWithSign(getTimezoneOffset(tzName))}
                        </span>
                      </button>
                    </li>
                  ))}
              </ul>
            </div>
          </details>
          <button
            className="btn"
            onClick={() => {
              setTz(localtz);
            }}
          >
            Local
          </button>
        </div>
        <datalist id="tz-names">
          {tzNames.map((tzName) => (
            <option key={tzName} value={tzName} />
          ))}
        </datalist>
        <div className="divider" />
        <div className="flex items-center">
          <div>
            {time}Z {day}
          </div>
          <div className="divider divider-horizontal">
            <ArrowRightIcon className="w-16" />
          </div>
          <div className="text-lg font-bold">
            {localtimeStr} {dayStr} in {tz}
          </div>
        </div>
      </div>
    </div>
  );
}
