export class BaseFilter {
  page = 1;
  limit = 20;
  /** drf-flex-fields: comma-separated field names to expand into nested objects. */
  expand?: string;
}
