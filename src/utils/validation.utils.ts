import { ScrapedEvent, EventFilters } from "../utils/types/event.types.js";

export class EventValidator {
  static validateEvent(event: Partial<ScrapedEvent>): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!event.title || event.title.trim().length === 0) {
      errors.push("Title is required");
    }

    if (!event.description || event.description.trim().length === 0) {
      errors.push("Description is required");
    }

    if (
      event.isFree === false &&
      (!event.participationCost || event.participationCost <= 0)
    ) {
      errors.push("Paid events must have a valid participation cost");
    }

    if (event.locations && event.locations.length === 0) {
      errors.push("At least one location is required");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  static sanitizeFilters(filters: Partial<EventFilters>): EventFilters {
    const sanitized: EventFilters = {};

    if (filters.status && Array.isArray(filters.status)) {
      sanitized.status = filters.status;
    }

    if (filters.city && typeof filters.city === "string") {
      sanitized.city = filters.city.trim();
    }

    if (filters.minScore !== undefined && !isNaN(filters.minScore)) {
      sanitized.minScore = Math.max(0, Math.min(1, filters.minScore));
    }

    return sanitized;
  }
}
