declare namespace svelteHTML {
  interface HTMLAttributes<T> {
    // Add support for outclick event
    'onoutclick'?: (event: CustomEvent<void>) => void;
  }
}
