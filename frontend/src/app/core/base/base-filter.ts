export class BaseFilter {
  page = 1;
  /** Sent as `page_size` — honored by the backend (REST_FRAMEWORK pagination class). */
  page_size = 20;
  /** drf-flex-fields: comma-separated field names to expand into nested objects. */
  expand?: string;
}
