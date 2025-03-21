import { Canvas } from "@react-three/fiber";
import { useEffect, useState } from "react";
import Scene from "./components/Scene";
import Sidebar from "./components/Sidebar";
import { cn } from "./utils/cn";

// Breakpoint for switching between sidebar and bottombar
const MOBILE_BREAKPOINT = 768; // px

function App() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check initial screen size
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };

    checkScreenSize();

    // Add resize listener
    window.addEventListener("resize", checkScreenSize);

    // Cleanup
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  return (
    <div className='relative h-screen bg-bg-100'>
      {/* The viewport container takes full height */}
      <div className='w-full h-full' id='canvas-container'>
        <Canvas>
          <Scene isMobile={isMobile} />
        </Canvas>
      </div>

      {/* Responsive sidebar/bottombar */}
      <div className={cn("absolute left-0 bottom-0 overflow-y-auto", isMobile ? "w-full h-[50vh]" : "top-0 h-full")} id='sidebar-container'>
        <Sidebar isMobile={isMobile} />
      </div>
    </div>
  );
}

export default App;
