/** Safe message extraction for `catch (err: unknown)`. Returns '' when there is no usable message. */
export function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  return '';
}
