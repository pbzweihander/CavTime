import { MoonIcon, SunIcon } from "@heroicons/react/24/outline";
import { ArrowRightIcon } from "@heroicons/react/24/solid";
import classNames from "classnames";
import { DateTime, WeekdayNumbers } from "luxon";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import tzdata from "tzdata";

import Logo from "./Logo";
import GitHubMark from "./github-mark.svg?react";

const tzNames = Object.keys(tzdata.zones)
  .filter((tz) => tz.includes("/") && DateTime.local().setZone(tz).isValid)
  .sort((a, b) => (a < b ? -1 : 1));
const weekdayStrs = [
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

function parseDayIndex(
  s: string | undefined | null,
): WeekdayNumbers | undefined {
  if (s === "1") {
    return 1;
  } else if (s === "2") {
    return 2;
  } else if (s === "3") {
    return 3;
  } else if (s === "4") {
    return 4;
  } else if (s === "5") {
    return 5;
  } else if (s === "6") {
    return 6;
  } else if (s === "7") {
    return 7;
  } else {
    return undefined;
  }
}

function makeDayStr(weekdayDiff: number): string {
  if (weekdayDiff > 0) {
    if (weekdayDiff === 1) {
      return "the day after";
    } else {
      return `${weekdayDiff} days after`;
    }
  } else if (weekdayDiff < 0) {
    if (weekdayDiff === -1) {
      return "the day before";
    } else {
      return `${-weekdayDiff} days before`;
    }
  } else {
    return "";
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

  const localNow = DateTime.local().setZone("UTC");

  const paramTime = parseTime(searchParams.get("zulu"));
  const [selectedTime, setSelectedTime] = useState(
    paramTime !== undefined
      ? localNow.set({
          hour: Math.floor(paramTime % 100),
          minute: paramTime % 100,
        })
      : localNow.set({ minute: 0 }),
  );
  const selectedTimeStr = selectedTime.toFormat("HHmm");
  useEffect(() => {
    setSearchParams((params) => {
      params.set("zulu", selectedTimeStr);
      return params;
    });
  }, [setSearchParams, selectedTimeStr]);

  const [selectedWeekday, setSelectedWeekday] = useState<
    WeekdayNumbers | undefined
  >(parseDayIndex(searchParams.get("day")));
  useEffect(() => {
    setSearchParams((params) => {
      if (selectedWeekday !== undefined) {
        params.set("day", `${selectedWeekday}`);
      } else {
        params.delete("day");
      }
      return params;
    });
  }, [setSearchParams, selectedWeekday]);
  const selectedWeekdayStr =
    selectedWeekday !== undefined ? weekdayStrs[selectedWeekday - 1] : "";

  const localtz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const paramTz = searchParams.get("tz") ?? "";
  const [selectedTz, setSelectedTz] = useState(
    isTimezoneValid(paramTz) ? paramTz : localtz,
  );
  useEffect(() => {
    setSearchParams((params) => {
      params.set("tz", selectedTz);
      return params;
    });
  }, [setSearchParams, selectedTz]);

  const convertedTime = selectedTime
    .set({ weekday: selectedWeekday })
    .setZone(selectedTz);
  const convertedWeekdayStr =
    selectedWeekday !== undefined
      ? weekdayStrs[convertedTime.weekday - 1]
      : makeDayStr(convertedTime.weekday - selectedTime.weekday);
  const convertedTimeStr = convertedTime.toFormat("HHmm");

  const [inputTimeStr, setInputTimeStr] = useState(selectedTimeStr);
  const [isInputTimeError, setIsInputTimeError] = useState(false);

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
                isInputTimeError && "input-error",
              )}
            >
              <input
                type="text"
                className="w-full"
                value={inputTimeStr}
                onChange={(e) => {
                  const value = e.target.value;
                  const valueInt = parseInt(value);
                  setInputTimeStr(value);
                  if (
                    /^\d+$/.test(value) &&
                    !isNaN(valueInt) &&
                    valueInt >= 0 &&
                    valueInt < 2400
                  ) {
                    setSelectedTime(
                      localNow.set({
                        hour: Math.floor(valueInt / 100),
                        minute: valueInt % 100,
                      }),
                    );
                    setIsInputTimeError(false);
                  } else {
                    setIsInputTimeError(true);
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
              value={selectedWeekday}
              onChange={(e) => {
                const value = e.target.value;
                setSelectedWeekday(parseDayIndex(value));
              }}
            >
              <option value=""></option>
              <option value="1">Monday</option>
              <option value="2">Tuesday</option>
              <option value="3">Wednesday</option>
              <option value="4">Thursday</option>
              <option value="5">Friday</option>
              <option value="6">Saturday</option>
              <option value="7">Sunday</option>
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
              <span>{selectedTz}</span>
              <span className="grow" />
              <span>{formatNumberWithSign(convertedTime.offset / 60)}</span>
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
                          setSelectedTz(tzName);
                          setTzSearch("");
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
              setSelectedTz(localtz);
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
            {selectedTimeStr}Z {selectedWeekdayStr}
          </div>
          <div className="divider divider-horizontal">
            <ArrowRightIcon className="w-16" />
          </div>
          <div className="text-lg font-bold">
            {convertedTimeStr} {convertedWeekdayStr} in {selectedTz}
          </div>
        </div>
      </div>
    </div>
  );
}
