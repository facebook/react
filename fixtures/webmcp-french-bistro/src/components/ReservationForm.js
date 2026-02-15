import {useState, useCallback} from 'react';
import {
  WebMCPForm,
  WebMCPInput,
  WebMCPSelect,
  WebMCPTextarea,
  useToolEvent,
} from 'react-webmcp';
import BookingModal from './BookingModal';

const today = new Date().toISOString().split('T')[0];

const guestOptions = [
  {value: '1', label: '1 Person'},
  {value: '2', label: '2 People'},
  {value: '3', label: '3 People'},
  {value: '4', label: '4 People'},
  {value: '5', label: '5 People'},
  {value: '6', label: '6 People or more'},
];

const seatingOptions = [
  {value: 'Main Dining', label: 'Main Dining Room'},
  {value: 'Terrace', label: 'Terrace (Outdoor)'},
  {value: 'Private Booth', label: 'Private Booth'},
  {value: 'Bar', label: 'Bar Counter'},
];

export default function ReservationForm() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    date: '',
    time: '',
    guests: '2',
    seating: 'Main Dining',
    requests: '',
  });
  const [errors, setErrors] = useState({});
  const [modalOpen, setModalOpen] = useState(false);
  const [modalDetails, setModalDetails] = useState('');

  const validate = useCallback(
    data => {
      const vals = data || formData;
      const errs = {};
      if (vals.name.trim().length < 2) {
        errs.name = 'Please enter a valid name (at least 2 characters).';
      }
      const digits = vals.phone.replace(/\D/g, '');
      if (digits.length < 10) {
        errs.phone = 'Please enter a valid phone number (minimum 10 digits).';
      }
      const inputDate = new Date(vals.date);
      const current = new Date();
      current.setHours(0, 0, 0, 0);
      if (!vals.date || inputDate < current) {
        errs.date = 'Please select a future date.';
      }
      if (!vals.time) {
        errs.time = 'Please select a valid time.';
      }
      return errs;
    },
    [formData]
  );

  const handleChange = e => {
    const {name, value} = e.target;
    setFormData(prev => ({...prev, [name]: value}));
    // Clear error on change
    setErrors(prev => {
      const next = {...prev};
      delete next[name];
      return next;
    });
  };

  const showModal = useCallback(
    data => {
      const vals = data || formData;
      const dateObj = new Date(vals.date);
      const dateStr = dateObj.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      });
      const guestLabel =
        guestOptions.find(o => o.value === vals.guests)?.label || vals.guests;
      const seatingLabel =
        seatingOptions.find(o => o.value === vals.seating)?.label ||
        vals.seating;

      setModalDetails(
        `Hello <strong>${vals.name}</strong>,<br> We look forward to welcoming you on:<br><br> <strong>${dateStr}</strong> at <strong>${vals.time}</strong><br> Party of <strong>${guestLabel}</strong> &bull; ${seatingLabel}`
      );
      setModalOpen(true);
    },
    [formData]
  );

  const handleSubmit = event => {
    event.preventDefault();

    // Read form data from the native form element for both user and agent submissions
    const form = event.target;
    const data = {
      name: form.elements.name.value,
      phone: form.elements.phone.value,
      date: form.elements.date.value,
      time: form.elements.time.value,
      guests: form.elements.guests.value,
      seating: form.elements.seating.value,
      requests: form.elements.requests.value,
    };

    // Sync state (for both user and agent invocations)
    setFormData(data);

    const validationErrors = validate(data);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      // Agent-invoked: respond with errors
      if (event.agentInvoked) {
        const errorList = Object.entries(validationErrors).map(
          ([field, message]) => ({
            field,
            value: data[field],
            message,
          })
        );
        event.respondWith(errorList);
      }
      return;
    }

    showModal(data);

    // Agent-invoked: respond with the confirmation text
    if (event.agentInvoked) {
      const dateObj = new Date(data.date);
      const dateStr = dateObj.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      });
      const guestLabel =
        guestOptions.find(o => o.value === data.guests)?.label || data.guests;
      const seatingLabel =
        seatingOptions.find(o => o.value === data.seating)?.label ||
        data.seating;

      event.respondWith(
        `Reservation confirmed for ${data.name} on ${dateStr} at ${data.time}, party of ${guestLabel}, ${seatingLabel}`
      );
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setFormData({
      name: '',
      phone: '',
      date: '',
      time: '',
      guests: '2',
      seating: 'Main Dining',
      requests: '',
    });
    setErrors({});
  };

  // Listen for toolactivated to trigger validation feedback
  useToolEvent(
    'toolactivated',
    () => {
      const validationErrors = validate();
      setErrors(validationErrors);
    },
    'book_table_le_petit_bistro'
  );

  return (
    <>
      <div className="booking-container">
        <h2>Le Petit Bistro</h2>
        <span className="subtitle">Table Reservations</span>

        <WebMCPForm
          toolName="book_table_le_petit_bistro"
          toolDescription="Creates a confirmed dining reservation at Le Petit Bistro. Accepts customer details, timing, and seating preferences."
          onSubmit={handleSubmit}
          noValidate>
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <WebMCPInput
              type="text"
              id="name"
              name="name"
              placeholder="e.g. Alexander Hamilton"
              required
              minLength="2"
              toolParamDescription="Customer's full name (min 2 chars)"
              value={formData.name}
              onChange={handleChange}
              className={errors.name ? 'invalid' : ''}
            />
            <span
              className="error-msg"
              style={{display: errors.name ? 'block' : 'none'}}>
              {errors.name}
            </span>
          </div>

          <div className="form-group">
            <label htmlFor="phone">Phone Number</label>
            <WebMCPInput
              type="tel"
              id="phone"
              name="phone"
              placeholder="(555) 000-0000"
              required
              toolParamDescription="Customer's phone number (min 10 digits)"
              value={formData.phone}
              onChange={handleChange}
              className={errors.phone ? 'invalid' : ''}
            />
            <span
              className="error-msg"
              style={{display: errors.phone ? 'block' : 'none'}}>
              {errors.phone}
            </span>
          </div>

          <div className="form-group row">
            <div className="col">
              <label htmlFor="date">Date</label>
              <WebMCPInput
                type="date"
                id="date"
                name="date"
                required
                min={today}
                toolParamDescription="Reservation date (YYYY-MM-DD). Must be today or future."
                value={formData.date}
                onChange={handleChange}
                className={errors.date ? 'invalid' : ''}
              />
              <span
                className="error-msg"
                style={{display: errors.date ? 'block' : 'none'}}>
                {errors.date}
              </span>
            </div>
            <div className="col">
              <label htmlFor="time">Time</label>
              <WebMCPInput
                type="time"
                id="time"
                name="time"
                required
                toolParamDescription="Reservation time (HH:MM)"
                value={formData.time}
                onChange={handleChange}
                className={errors.time ? 'invalid' : ''}
              />
              <span
                className="error-msg"
                style={{display: errors.time ? 'block' : 'none'}}>
                {errors.time}
              </span>
            </div>
          </div>

          <div className="form-group row">
            <div className="col">
              <label htmlFor="guests">Guests</label>
              <WebMCPSelect
                id="guests"
                name="guests"
                required
                toolParamDescription="Number of people dining. Must be a string value between '1' and '5', or '6' for parties of 6 or more."
                value={formData.guests}
                onChange={handleChange}>
                {guestOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </WebMCPSelect>
            </div>
            <div className="col">
              <label htmlFor="seating">Seating Preference</label>
              <WebMCPSelect
                id="seating"
                name="seating"
                toolParamDescription="Preferred seating area"
                value={formData.seating}
                onChange={handleChange}>
                {seatingOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </WebMCPSelect>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="requests">Special Requests</label>
            <WebMCPTextarea
              id="requests"
              name="requests"
              rows="2"
              placeholder="Allergies, anniversaries, high chair..."
              toolParamDescription="Special requests (allergies, occasions, etc.)"
              value={formData.requests}
              onChange={handleChange}
            />
          </div>

          <button type="submit" className="submit-btn">
            Request Reservation
          </button>
        </WebMCPForm>
      </div>

      <BookingModal
        open={modalOpen}
        details={modalDetails}
        onClose={handleCloseModal}
      />
    </>
  );
}
