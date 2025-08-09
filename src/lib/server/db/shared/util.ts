import { handleError } from './errorHandler';

/**
 * Wraps all methods of a service object to add error handling with origin context.
 *
 * Each method is wrapped in a try-catch block. If an error occurs, it is passed to `handleError`
 * along with a string indicating the origin and method name.
 *
 * @template T - The type of the service object, with methods to wrap.
 * @param service - The service object whose methods will be wrapped.
 * @param origin - A string representing the origin context for error reporting.
 * @returns A new service object with all methods wrapped for error handling.
 */
export function withErrorOrigin<T extends Record<string, (...args: any[]) => any>>(
  service: T,
  origin: string
): T {
  const boundService = Object.fromEntries(
    Object.keys(service).map((key) => {
      const originalMethod = service[key];

      const wrappedMethod = async (...args: Parameters<typeof originalMethod>) => {
        try {
          return await originalMethod(...args);
        } catch (error) {
          handleError(error, `${origin}.${key}`);
        }
      };

      return [key, wrappedMethod];
    })
  );

  return boundService as T;
}
