import { useState } from "react";
import { Canvas } from "@react-three/fiber";
import Sidebar from "./components/Sidebar";
import Scene from "./components/Scene";
import { MatrixTransform } from "./types";

function App() {
  const [matrices, setMatrices] = useState<MatrixTransform[]>([]);
  const [globalScale, setGlobalScale] = useState<number>(1);

  const addMatrix = (matrix: MatrixTransform) => {
    setMatrices([...matrices, matrix]);
  };

  const removeMatrix = (id: string) => {
    setMatrices(matrices.filter((m) => m.id !== id));
  };

  const updateMatrix = (id: string, values: number[], scalar?: number) => {
    setMatrices(
      matrices.map((m) => {
        if (m.id === id) {
          return { 
            ...m, 
            values,
            // Only update scalar if provided
            ...(scalar !== undefined ? { factor: scalar } : {})
          };
        }
        return m;
      })
    );
  };

  return (
    <div className="flex h-screen bg-bg-100">
      <Sidebar 
        matrices={matrices} 
        addMatrix={addMatrix} 
        removeMatrix={removeMatrix} 
        updateMatrix={updateMatrix}
        globalScale={globalScale}
        setGlobalScale={setGlobalScale}
      />
      <div className="flex-1 p-4">
        <Canvas camera={{ position: [3, 3, 3] }}>
          <Scene matrices={matrices} globalScale={globalScale} />
        </Canvas>
      </div>
    </div>
  );
}

export default App;
