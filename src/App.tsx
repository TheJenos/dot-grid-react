import "./App.css";

import Dropper, { DropElement, onMoved } from "./components/DotDnd/Dropper";
import { useState, useCallback } from "react";

function App() {
  const [elements, setElements] = useState<DropElement[]>([
    {
      element: <h1>asdsa</h1>,
      topDot: 5,
      leftDot: 5,
      heightDot: 1,
      widthDot: 5,
    },
  ]);

  const onMoved = useCallback<onMoved>((element:DropElement,newX:number,newY:number) => {
    setElements(e => {
      const movedElementIndex = e.findIndex(x => x.element === element.element)
      if (movedElementIndex > -1) {
        e[movedElementIndex].leftDot=newX
        e[movedElementIndex].topDot=newY
        return [
          ...e
        ]
      }
      return e
    })
  }, []);

  return (
    <>
      <Dropper
        data={elements}
        editable
        gridSpace={20}
        style={{ width: "100%", height: "100%" }}
        onMoved={onMoved}
      />
    </>
  );
}

export default App;
