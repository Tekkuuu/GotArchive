import { useSchedule } from "./useSchedule";
import { useWatchingWeek } from "./useWatchingWeek";

export type Schedule = Awaited<ReturnType<typeof useSchedule>>;
export type WatchingWeek = Awaited<ReturnType<typeof useWatchingWeek>>;
