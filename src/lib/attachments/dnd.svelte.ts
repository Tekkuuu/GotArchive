import type { Attachment } from 'svelte/attachments';

// --- Singleton drag state ---
let dragging: number | null = null;
let ghost: HTMLElement | null = null;
let currentGroup: string | null = null;
let currentOnSort: ((from: number, to: number) => void) | null = null;

function onPointerMove(event: PointerEvent) {
  if (ghost) {
    ghost.style.top = `${event.clientY}px`;
    ghost.style.left = `${event.clientX}px`;
  }
}

function onPointerUpGhost(event: PointerEvent) {
  ghost?.remove();
  ghost = null;

  const target = document.elementFromPoint(event.clientX, event.clientY);
  const sortable = target?.closest(`.${currentGroup}-sortable`) as HTMLElement | null;
  if (sortable) {
    const dropIndex = Number(sortable.dataset.index);
    if (dragging !== null && dropIndex !== dragging && currentOnSort) {
      currentOnSort(dragging, dropIndex);
    }
  }
  dragging = null;
  currentGroup = null;
  currentOnSort = null;
  window.removeEventListener('pointermove', onPointerMove);
}

// --- The reusable attachment ---
export function dnd(
  index: number,
  group: string,
  onSort: (from: number, to: number) => void
): Attachment<HTMLElement> {
  return (element) => {
    element.setAttribute('data-index', index.toString());
    element.classList.add(`${group}-sortable`);

    function onPointerDown(event: PointerEvent) {
      if (event.button !== 0) return; // Only left click
      const pressed = document.elementFromPoint(event.clientX, event.clientY);
      if (pressed?.closest('.no-drag')) return;
      if (ghost) return; // Only one drag at a time

      // Set singleton drag state
      dragging = index;
      currentGroup = group;
      currentOnSort = onSort;

      ghost = element.cloneNode(true) as HTMLElement;
      ghost.style.position = 'fixed';
      ghost.style.top = `${event.clientY}px`;
      ghost.style.left = `${event.clientX}px`;
      ghost.style.transform = 'translate(-50%, -50%)';
      ghost.style.pointerEvents = 'none';
      ghost.style.zIndex = '9999';
      ghost.style.opacity = '0.8';
      ghost.style.width = `${element.offsetWidth}px`;
      ghost.style.height = `${element.offsetHeight}px`;
      document.body.appendChild(ghost);

      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUpGhost, { once: true });

      event.preventDefault();
    }

    element.addEventListener('pointerdown', onPointerDown);

    return () => {
      element.removeEventListener('pointerdown', onPointerDown);
      // Defensive: if destroyed during drag, clean up
      if (ghost && dragging === index) {
        ghost.remove();
        ghost = null;
        dragging = null;
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUpGhost);
      }
    };
  };
}
