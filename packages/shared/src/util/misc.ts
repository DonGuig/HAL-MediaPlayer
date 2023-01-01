import {
  ILightDailyHours,
  ILightYearlySchedule,
  MonthsArray,
  TMonths,
} from "../index";
import { DateTime } from "luxon";
import { isNaN } from "lodash";

function ratioCalc(
  nextTime: string | undefined,
  beforeTime: string | undefined,
  ratio: number
): string {
  if (nextTime === undefined || beforeTime === undefined) {
    return DateTime.local(1970, 1, 1, 0, 0).toFormat("HH:mm");
  }
  const nextDateTime = DateTime.fromFormat(nextTime, "HH:mm");
  const beforeDateTime = DateTime.fromFormat(beforeTime, "HH:mm");

  const nextMin = nextDateTime.hour * 60 + nextDateTime.minute;
  const beforeMin = beforeDateTime.hour * 60 + beforeDateTime.minute;
  const ratioMinutes = beforeMin + (nextMin - beforeMin) * ratio;
  const ratioDateTime = DateTime.local().set({
    hour: Math.floor(ratioMinutes / 60),
    minute: Math.floor(ratioMinutes % 60),
  });
  return ratioDateTime.toFormat("HH:mm");
}

export function calculateIntermediaryDailyHours(
  schedule: ILightYearlySchedule,
  month: TMonths,
  day: number
): ILightDailyHours | null {
  if (schedule) {
    const definedMonths: Array<TMonths> = MonthsArray.reduce<Array<TMonths>>(
      (prev: TMonths[], curr: TMonths) => {
        if (schedule[curr]) {
          return [...prev, curr];
        } else {
          return prev;
        }
      },
      []
    );
    if (definedMonths.length === 0) return null;
    if (definedMonths.length === 1) {
      return schedule[definedMonths[0]] ?? null;
    }
    const currentYear = DateTime.now().year;
    const consideredDateTime = DateTime.local(currentYear, month, day);
    const definedDates = definedMonths.map<DateTime>((m) =>
      DateTime.local(currentYear, m, 1)
    );
    const match: DateTime | undefined = definedDates.find((date) =>
      date.equals(consideredDateTime)
    );
    if (match) {
      return schedule[match.month as TMonths] ?? null;
    }
    definedDates.sort((a, b) => a.diff(b).toMillis());
    let nextDate = definedDates.find(
      (date) => consideredDateTime.diff(date).toMillis() < 0
    );
    const reversedDefinedDates = [...definedDates].reverse();
    let prevDate = reversedDefinedDates.find(
      (date) => consideredDateTime.diff(date).toMillis() > 0
    );
    if (nextDate && prevDate === undefined) {
      prevDate = definedDates.at(-1)?.minus({ years: 1 });
    } else if (nextDate === undefined && prevDate) {
      nextDate = definedDates[0].plus({ years: 1 });
    }
    if (nextDate && prevDate) {
      const timeSpan = nextDate.diff(prevDate).toMillis();
      const distanceToPrev = consideredDateTime.diff(prevDate).toMillis();
      const ratio = distanceToPrev / timeSpan;
      if (schedule) {
        // note : the schedules are expected to always contain
        // four  elements :
        // - night state at 00:00
        // - day state
        // - moon state
        // - night state
        try {
          return [
            {
              lightEvent: "night",
              start: "00:00",
              transitionEnd: "00:01",
              fadeCurve:
                schedule[prevDate.month as TMonths]?.[0].fadeCurve ?? "linear",
            },
            {
              lightEvent: "day",
              start: ratioCalc(
                schedule[nextDate.month as TMonths]?.[1].start,
                schedule[prevDate.month as TMonths]?.[1].start,
                ratio
              ),
              transitionEnd: ratioCalc(
                schedule[nextDate.month as TMonths]?.[1].transitionEnd,
                schedule[prevDate.month as TMonths]?.[1].transitionEnd,
                ratio
              ),
              fadeCurve:
                schedule[prevDate.month as TMonths]?.[1].fadeCurve ?? "linear",
            },
            {
              lightEvent: "moon",
              start: ratioCalc(
                schedule[nextDate.month as TMonths]?.[2].start,
                schedule[prevDate.month as TMonths]?.[2].start,
                ratio
              ),
              transitionEnd: ratioCalc(
                schedule[nextDate.month as TMonths]?.[2].transitionEnd,
                schedule[prevDate.month as TMonths]?.[2].transitionEnd,
                ratio
              ),
              fadeCurve:
                schedule[prevDate.month as TMonths]?.[2].fadeCurve ?? "linear",
            },
            {
              lightEvent: "night",
              start: ratioCalc(
                schedule[nextDate.month as TMonths]?.[3].start,
                schedule[prevDate.month as TMonths]?.[3].start,
                ratio
              ),
              transitionEnd: ratioCalc(
                schedule[nextDate.month as TMonths]?.[3].transitionEnd,
                schedule[prevDate.month as TMonths]?.[3].transitionEnd,
                ratio
              ),
              fadeCurve:
                schedule[prevDate.month as TMonths]?.[3].fadeCurve ?? "linear",
            },
          ];
        } catch (e) {
          return null;
        }
      }
    }
  }
  return null;
}

export function sortLightDailyHours(input: ILightDailyHours): ILightDailyHours {
  input.sort((a, b) => {
    const Astart = DateTime.fromFormat(a.start, "HH:mm");
    const Bstart = DateTime.fromFormat(b.start, "HH:mm");
    return Astart.diff(Bstart).toMillis();
  });
  return input;
}

export function numberArrayToCommaString(arr: Array<number>): string {
  const res: string = arr.reduce<string>((prev, curr, idx) => {
    if (idx === 0) {
      return prev.concat(String(curr));
    } else {
      return prev.concat(`,${String(curr)}`);
    }
  }, "");
  return res;
}

export function commaStringToNumArray(input: string): number[] {
  const arr = input.split(",");
  const numArr: number[] = arr.map((val) => {
    return Number(val);
  });
  let isError: boolean = false;
  numArr.forEach((num) => {
    if (isNaN(num)) {
      isError = true;
    }
  });
  if (numArr.length === 0) {
    isError = true;
  }
  if (isError) {
    return [];
  } else {
    return numArr;
  }
}
