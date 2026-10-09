/** Shape returned by DRF's PageNumberPagination. */
export class BasePaginatedResponse<T> {
  count!: number;
  next!: string | null;
  previous!: string | null;
  results!: T[];
}
