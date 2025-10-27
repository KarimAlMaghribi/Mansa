import {Timestamp} from "firebase/firestore";

const toDate = (value?: string | Timestamp): Date | null => {
    if (!value) {
        return null;
    }

    if (typeof value === "string") {
        const parsed = new Date(value);
        return Number.isNaN(parsed.getTime()) ? null : parsed;
    }

    if (value instanceof Date) {
        return value;
    }

    try {
        return value.toDate();
    } catch (error) {
        return null;
    }
};

export function formatLastActivity(lastActivity?: string | Timestamp): string {
    const activityDate = toDate(lastActivity);

    if (!activityDate) {
        return "";
    }
    const now = new Date();
    const diffInSeconds = (now.getTime() - activityDate.getTime()) / 1000;

    if (diffInSeconds < 60) {
        return "vor kurzem"; // < 1 Minute
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
        return `${diffInMinutes} ${diffInMinutes === 1 ? "Minute" : "Minuten"}`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 12) {
        return `${diffInHours} ${diffInHours === 1 ? "Stunde" : "Stunden"}`;
    }

    if (diffInHours < 24) {
        return "halber Tag"; // 12 bis 24 Stunden
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays <= 30) {
        return `${diffInDays} ${diffInDays === 1 ? "Tag" : "Tage"}`;
    }

    const diffInMonths = Math.floor(diffInDays / 30);
    return `${diffInMonths} ${diffInMonths === 1 ? "Monat" : "Monate"}`;
}
