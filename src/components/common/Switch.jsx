export default function Switch({ checked, onChange, label }) {
  return (
    <div className="switch-container" onClick={() => onChange(!checked)}>
      <span className="switch-label">{label}</span>
      <div className={`switch ${checked ? 'checked' : ''}`}>
        <div className={`switch-slider ${checked ? 'checked' : ''}`} />
      </div>
    </div>
  );
}
