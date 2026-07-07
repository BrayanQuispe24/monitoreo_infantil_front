import { createContext, useEffect, useState } from "react";
import type { DaycareRegisterResponse } from "../../features/daycares/interfaces/Daycare.interface";

type DaycareContextType = {
    daycares: DaycareRegisterResponse[];
    changeDaycares: (data: DaycareRegisterResponse[]) => void;
    currentDaycare: DaycareRegisterResponse | null;
    changeCurrentDaycare: (data: DaycareRegisterResponse | null) => void;
}

const getInitialDaycares = (): { daycares: DaycareRegisterResponse[], currentDaycare: DaycareRegisterResponse } => {
    const storedDaycares = localStorage.getItem('daycares') || '[]';
    const storedCurrentDaycare = localStorage.getItem('currentDaycare') || null;
    return {
        daycares: JSON.parse(storedDaycares),
        currentDaycare: storedCurrentDaycare ? JSON.parse(storedCurrentDaycare) : null
    }
}
export const DaycareContext = createContext<DaycareContextType | undefined>(undefined);

export const DaycareProvider = ({ children }: { children: React.ReactNode }) => {
    const [daycares, setDaycares] = useState<DaycareRegisterResponse[]>(getInitialDaycares().daycares);
    const [currentDaycare, setCurrentDaycare] = useState<DaycareRegisterResponse | null>(getInitialDaycares().currentDaycare);
    const changeDaycares = (data: DaycareRegisterResponse[]) => {
        setDaycares(data);
    }
    const changeCurrentDaycare = (data: DaycareRegisterResponse | null) => {
        setCurrentDaycare(data);
    }

    useEffect(() => {
        if (daycares && currentDaycare) {
            localStorage.setItem("daycaresData", JSON.stringify({ daycares, currentDaycare }));
        } else {
            localStorage.removeItem("daycaresData");
        }
    }, [daycares, currentDaycare]);

    return (
        <DaycareContext.Provider value={{ daycares, changeDaycares, currentDaycare, changeCurrentDaycare }}>
            {children}
        </DaycareContext.Provider>
    );
};
