import { useState, useEffect } from 'react';
import { Milk } from 'lucide-react';
import './MilkExpressedForm.css';

export default function MilkExpressedForm({ initialData, notes, onNotesChange, onSubmit }) {
  const [amount, setAmount] = useState(initialData?.amount || 0);

  useEffect(() => {
    if (initialData) {
      setAmount(initialData.amount || 0);
    }
  }, [initialData]);

  const handleSave = () => {
    if (amount < 10) return;
    onSubmit({ amount });
  };

  return (
    <div className="milk-expressed-form">
      <div className="milk-expressed-slider-card">
        <span className="milk-expressed-label"><Milk size={16} /> Amount Expressed</span>
        <div className="slider-container">
          <input
            type="range"
            min="10"
            max="300"
            step="10"
            value={amount}
            onChange={(e) => setAmount(parseInt(e.target.value))}
            className="slider expressed-slider"
          />
          <div className="slider-value expressed-value">{amount} ml</div>
        </div>
      </div>

      <div className="form-row" style={{ marginTop: 16 }}>
        <label className="input-label">Notes</label>
        <textarea
          className="notes-textarea"
          placeholder="Additional notes..."
          value={notes || ''}
          onChange={(e) => onNotesChange(e.target.value)}
          rows={2}
        />
      </div>

      <button className="save-btn expressed-save-btn" onClick={handleSave} disabled={amount < 10}>
        Save Expressed Milk
      </button>
    </div>
  );
}
