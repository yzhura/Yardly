export type AttributeScope = "MATERIAL" | "PRODUCT" | "BOTH";

export type AttributeValue = {
  id: string;
  name: string;
  slug: string;
  sortIndex: number;
  createdAt: string;
  updatedAt: string;
};

export type AttributeDefinition = {
  id: string;
  name: string;
  slug: string;
  scope: AttributeScope;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
  values: AttributeValue[];
};

export type AttributeDefinitionsResponse = {
  definitions: AttributeDefinition[];
};

