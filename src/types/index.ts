export interface Material {
    id: string;
    name: string;
    current: number;
    target: number;
    startDate: string; // ISO string
    endDate: string;   // ISO string
}

export interface Goal {
    id: string;
    title: string;
    password: string;
    materials: Material[];
}

export interface Template {
    id: string;
    title: string;
    materials: { name: string; target: number }[];
}
