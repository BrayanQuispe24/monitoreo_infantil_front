export interface DaycareRegister {
    name: string;
    address: string;
}

export interface DaycareUpdate {
    name?: string;
    address?: string;
    status?: string;
}

export interface DaycareRegisterResponse {
    id: string;
    name: string;
    address: string;
    code: string;
    status: string;
    has_area: boolean;
    area: Area;
}

export interface Area {
    type: string;
    coordinates: number[][][];
}
