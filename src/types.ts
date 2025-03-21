export type MatrixType = 
  | "scale" 
  | "rotate"
  | "translate" 
  | "shear"
  | "custom";

export interface MatrixTransform {
  id: string;
  name: string;
  type: MatrixType;
  values: number[];
  factor: number;
}

export interface Matrix3D {
  elements: number[];
}
