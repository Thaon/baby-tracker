import { useState, useEffect } from 'react';
import { Plus, Minus, Milk, Apple } from 'lucide-react';
import './FeedForm.css';

export default function FeedForm({ initialData, notes, onNotesChange, onSubmit }) {
  const [foodItems, setFoodItems] = useState(initialData || []);

  useEffect(() => {
    if (initialData) {
      setFoodItems(initialData);
    }
  }, [initialData]);

  const addMilk = () => {
    setFoodItems([...foodItems, { type: 'milk', amount: 0 }]);
  };

  const addSolids = () => {
    setFoodItems([...foodItems, { type: 'solids', name: '', amount: 10 }]);
  };

  const updateMilkAmount = (index, amount) => {
    const newItems = [...foodItems];
    newItems[index].amount = amount;
    setFoodItems(newItems);
  };

  const updateSolidsData = (index, field, value) => {
    const newItems = [...foodItems];
    newItems[index][field] = value;
    setFoodItems(newItems);
  };

  const removeFoodItem = (index) => {
    setFoodItems(foodItems.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    const validItems = foodItems.filter(item => {
      if (item.type === 'milk') return item.amount > 0;
      if (item.type === 'solids') return item.amount > 0 && item.name.trim() !== '';
      return false;
    });
    if (validItems.length === 0) return;
    onSubmit({ foodItems: validItems });
  };

  const hasValidItems = foodItems.some(item => {
    if (item.type === 'milk') return item.amount > 0;
    if (item.type === 'solids') return item.amount > 0 && item.name?.trim() !== '';
    return false;
  });

  return (
    <div className="feed-form">
      {foodItems.length === 0 && (
        <p className="feed-empty-hint">Add milk or solid food items below.</p>
      )}

      <div className="food-items">
        {foodItems.map((item, index) => (
          <div key={index} className="food-item">
            {item.type === 'milk' ? (
              <div className="milk-item">
                <div className="milk-header">
                  <span className="item-label"><Milk size={16} /> Milk</span>
                  <button className="remove-btn" onClick={() => removeFoodItem(index)}>
                    <Minus size={16} />
                  </button>
                </div>
                <div className="slider-container">
                  <input
                    type="range"
                    min="0"
                    max="300"
                    step="10"
                    value={item.amount}
                    onChange={(e) => updateMilkAmount(index, parseInt(e.target.value))}
                    className="slider"
                  />
                  <div className="slider-value">{item.amount} ml</div>
                </div>
              </div>
            ) : (
              <div className="solids-item">
                <div className="solids-header">
                  <span className="item-label"><Apple size={16} /> Solids</span>
                  <button className="remove-btn" onClick={() => removeFoodItem(index)}>
                    <Minus size={16} />
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Food name (e.g., Baby cereal)"
                  value={item.name}
                  onChange={(e) => updateSolidsData(index, 'name', e.target.value)}
                  className="solids-name-input"
                />
                <div className="slider-container">
                  <input
                    type="range"
                    min="10"
                    max="300"
                    step="10"
                    value={item.amount}
                    onChange={(e) => updateSolidsData(index, 'amount', parseInt(e.target.value))}
                    className="slider"
                  />
                  <div className="slider-value">{item.amount} mg</div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="add-buttons">
        <button className="add-btn add-milk-btn" onClick={addMilk}>
          <Plus size={16} /> Add Milk
        </button>
        <button className="add-btn add-solids-btn" onClick={addSolids}>
          <Plus size={16} /> Add Solids
        </button>
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

      <button className="save-btn" onClick={handleSave} disabled={!hasValidItems}>
        Save Feed Event
      </button>
    </div>
  );
}
