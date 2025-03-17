import { MatrixType } from "../types";

// Matrix type information for the UI
export const matrixTypes: { type: MatrixType; name: string; description: string }[] = [
  { 
    type: "scale", 
    name: "Scale", 
    description: "Scales the object along the X, Y, and Z axes" 
  },
  { 
    type: "rotate", 
    name: "Rotate", 
    description: "Rotates the object around the X, Y, and Z axes" 
  },
  { 
    type: "translate", 
    name: "Translate", 
    description: "Moves the object along the X, Y, and Z axes" 
  },
  { 
    type: "shear", 
    name: "Shear", 
    description: "Deforms the object by angling its faces" 
  },
  { 
    type: "custom", 
    name: "Custom Matrix", 
    description: "Define a custom 4x4 transformation matrix" 
  },
];

// Default values for different types of matrices
export const getDefaultValues = (type: MatrixType): number[] => {
  switch (type) {
    case "scale":
      return [1, 1, 1]; // x, y, z scale factors
    case "rotate":
      return [0, 0, 0]; // x, y, z rotation angles in degrees
    case "translate":
      return [0, 0, 0]; // x, y, z translation
    case "shear":
      return [0, 0, 0, 0, 0, 0]; // xy, xz, yx, yz, zx, zy
    case "custom":
      return [
        1, 0, 0, 0,  
        0, 1, 0, 0,  
        0, 0, 1, 0,  
        0, 0, 0, 1
      ]; // identity matrix (16 elements)
    default:
      return [];
  }
};

// Labels for matrix sliders
export const getValueLabels = (type: MatrixType): string[] => {
  switch (type) {
    case "scale":
      return ["Scale X", "Scale Y", "Scale Z"];
    case "rotate":
      return ["Rotate X", "Rotate Y", "Rotate Z"];
    case "translate":
      return ["X", "Y", "Z"];
    case "shear":
      return ["XY", "XZ", "YX", "YZ", "ZX", "ZY"];
    case "custom":
      return [
        "M11", "M12", "M13", "M14",
        "M21", "M22", "M23", "M24",
        "M31", "M32", "M33", "M34",
        "M41", "M42", "M43", "M44"
      ];
    default:
      return [];
  }
};

// Get slider range and step based on matrix type
export const getSliderProps = (type: MatrixType) => {
  switch (type) {
    case "scale":
      return { min: 0, max: 5, step: 0.1 };
    case "rotate":
      return { min: -180, max: 180, step: 1 };
    case "translate":
      return { min: -5, max: 5, step: 0.1 };
    case "shear":
      return { min: -5, max: 5, step: 0.1 };
    case "custom":
      // For custom matrix, we'll want a larger range
      return { min: -5, max: 5, step: 0.1 };
    default:
      return { min: -10, max: 10, step: 0.1 };
  }
};