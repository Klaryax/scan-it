import { useState } from "react";
import { computeG } from "./engine/engine";
import { useInputs } from "./state/inputs";
import { DF1Blob } from "./factors/DF1Blob";
import { DF2Stars } from "./factors/DF2Stars";
import { DF3RiskMatrix } from "./factors/DF3RiskMatrix";
import { DF4TrafficLights } from "./factors/DF4TrafficLights";
import { ResultList } from "./result/ResultList";

type Screen = 0 | 1 | 2 | 3 | 4; // 0–3 = DF1–DF4, 4 = resultado

function App() {
  const { inputs } = useInputs();
  const [screen, setScreen] = useState<Screen>(0);
  const [result, setResult] = useState<number[] | null>(null);

  const go = (s: Screen) => {
    setScreen(s);
    window.scrollTo({ top: 0 });
  };

  // G se calcula SOLO al pulsar "Ver resultado" (principio de UX no negociable §2).
  const showResult = () => {
    setResult(computeG(inputs));
    go(4);
  };

  switch (screen) {
    case 0:
      return <DF1Blob onNext={() => go(1)} />;
    case 1:
      return <DF2Stars onBack={() => go(0)} onNext={() => go(2)} />;
    case 2:
      return <DF3RiskMatrix onBack={() => go(1)} onNext={() => go(3)} />;
    case 3:
      return <DF4TrafficLights onBack={() => go(2)} onNext={showResult} />;
    case 4:
      return <ResultList G={result ?? computeG(inputs)} onEdit={() => go(0)} />;
  }
}

export default App;
