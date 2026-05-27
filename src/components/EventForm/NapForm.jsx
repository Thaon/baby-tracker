import './NapForm.css';

export default function NapForm({ initialData, onSubmit }) {
  const handleSave = () => {
    onSubmit({});
  };

  return (
    <div className="nap-form">
      <p className="nap-hint">Set the start and end times in the When section above.</p>
      <button className="save-btn" onClick={handleSave}>
        Save Nap Event
      </button>
    </div>
  );
}
