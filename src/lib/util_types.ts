// Require some fields from type T, leave the rest as optional
export type RequireSome<T, K extends keyof T> = Partial<T> & Pick<T, K>;

// Expand all properties of T
export type Expand<T> = { [K in keyof T]: T[K] };
