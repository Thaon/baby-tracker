import { useEffect, useState } from 'react';
import { Droplets, CircleDot } from 'lucide-react';
import Switch from '../common/Switch';
import './PottyForm.css';

export default function PottyForm({ initialData, notes, onNotesChange, onSubmit }) {
  const [isPee, setIsPee] = useState(initialData?.isPee ?? false);
  const [isPoop, setIsPoop] = useState(initialData?.isPoop ?? false);

  useEffect(() => {
    if (initialData) {
      setIsPee(initialData.isPee ?? false);
      setIsPoop(initialData.isPoop ?? false);
    }
  }, [initialData]);

  const canSubmit = isPee || isPoop;

  const handleSave = () => {
    if (!canSubmit) return;
    onSubmit({ isPee, isPoop });
  };

  return (
    <div className="potty-form">
      <div className="potty-switch-row">
        <Switch
          checked={isPee}
          onChange={setIsPee}
          label={<><Droplets size={16} /> Pee</>}
        />
      </div>
      <div className="potty-switch-row">
        <Switch
          checked={isPoop}
          onChange={setIsPoop}
          label={<><CircleDot size={16} /> Poop</>}
        />
      </div>
      {!canSubmit && (
        <p className="potty-warning">At least one option must be selected.</p>
      )}

      <div className="form-row" style={{ marginTop: 12 }}>
        <label className="input-label">Notes</label>
        <textarea
          className="notes-textarea"
          placeholder="Additional notes..."
          value={notes || ''}
          onChange={(e) => onNotesChange(e.target.value)}
          rows={2}
        />
      </div>

      <button className="save-btn" onClick={handleSave} disabled={!canSubmit}>
        Save Potty Event
      </button>
    </div>
  );
}
