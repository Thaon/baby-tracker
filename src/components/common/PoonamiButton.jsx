import { useState, useCallback } from "react";
import { useReward } from "react-rewards";
import { Biohazard } from "lucide-react";
import "./PoonamiButton.css";

const POONA_EMOJIS = [
  "💩",
  "💩",
  "💩",
  "💩",
  "💩",
  "💩",
  "💩",
  "💩",
  "💩",
  "💩",
];

export default function PoonamiButton({ createPoonami }) {
  const [triggered, setTriggered] = useState(false);
  const { reward: rewardPoonami, isAnimating: isPoonamiAnimating } = useReward(
    "poonamiReward",
    "emoji",
    {
      emoji: POONA_EMOJIS,
      elementCount: 90,
      spread: 80,
      startAngle: 60,
      decay: 0.97,
      drift: 0.02,
      tick: 30,
    },
  );

  const handleClick = useCallback(() => {
    if (triggered || isPoonamiAnimating) return;
    setTriggered(true);

    rewardPoonami();

    setTimeout(() => {
      createPoonami();
    }, 100);

    setTimeout(() => {
      setTriggered(false);
    }, 3000);
  }, [triggered, isPoonamiAnimating, rewardPoonami, createPoonami]);

  return (
    <>
      <span
        id="poonamiReward"
        style={{ position: "absolute", bottom: 0, right: "50%" }}
      />
      <div className="poonami-container">
        <button
          className={`poonami-btn ${triggered ? "triggered" : ""}`}
          onClick={handleClick}
          disabled={triggered || isPoonamiAnimating}
        >
          <Biohazard size={28} />
          <span>POONAMI</span>
        </button>
      </div>
    </>
  );
}
