import { Canvas } from "@react-three/fiber";
import Sidebar from "./components/Sidebar";
import Scene from "./components/Scene";

function App() {
  return (
    <div className="flex h-screen bg-bg-100">
      <Sidebar />
      <div className="flex-1 min-w-0">
        <Canvas camera={{ position: [3, 3, 3] }}>
          <Scene />
        </Canvas>
      </div>
    </div>
  );
}

export default App;
