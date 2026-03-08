export function openModal(modalId: string) {
	(document.getElementById(modalId) as HTMLDialogElement)?.showModal();
}

export function closeModal(modalId: string) {
	(document.getElementById(modalId) as HTMLDialogElement)?.close();
}
