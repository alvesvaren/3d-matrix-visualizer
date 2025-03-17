import { Canvas } from "@react-three/fiber";
import Sidebar from "./components/Sidebar";
import Scene from "./components/Scene";

function App() {
  return (
    <div className="relative h-screen bg-bg-100">
      {/* The viewport container takes full width and height */}
      <div className="h-full w-full flex items-center justify-center">
        <Canvas camera={{ position: [3, 3, 3] }}>
          <Scene />
        </Canvas>
      </div>
      
      {/* Sidebar positioned absolutely on top of the viewport */}
      <div className="absolute top-0 left-0 h-full">
        <Sidebar />
      </div>
    </div>
  );
}

export default App;
