export type Color = {
  id: string;
  name: string;
  slug: string;
  hex: string;
  createdAt: string;
  updatedAt: string;
};

export type ColorsResponse = {
  colors: Color[];
};

