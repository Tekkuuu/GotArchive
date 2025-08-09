export function outclick(node: HTMLElement) {

  const handleClick = (event: MouseEvent) => {
    const target = event.target as Node | null;

    if (node && !node.contains(target) && !event.defaultPrevented) {
      node.dispatchEvent(
        new CustomEvent('outclick')
      );
    }
  }

  document.addEventListener('click', handleClick, true);

  return {
    destroy() {
      document.removeEventListener('click', handleClick, true);
    }
  }
}
