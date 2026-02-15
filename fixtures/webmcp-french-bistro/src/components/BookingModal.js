import {useEffect, useRef} from 'react';

export default function BookingModal({open, details, onClose}) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [open]);

  // Close on clicking outside the dialog
  const handleBackdropClick = e => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (
      e.clientY < rect.top ||
      e.clientY > rect.bottom ||
      e.clientX < rect.left ||
      e.clientX > rect.right
    ) {
      onClose();
    }
  };

  return (
    <dialog ref={dialogRef} id="bookingDialog" onClick={handleBackdropClick}>
      <h3 className="modal-title">Reservation Received</h3>
      <p style={{fontStyle: 'italic', color: '#666', marginTop: 0}}>
        Bon App&eacute;tit!
      </p>
      <div
        className="modal-details"
        dangerouslySetInnerHTML={{__html: details}}
      />
      <button className="close-modal-btn" onClick={onClose}>
        Close Window
      </button>
    </dialog>
  );
}
