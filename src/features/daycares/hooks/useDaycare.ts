import { useContext } from "react"
import { DaycareContext } from "../../../context/daycare/DaycareContext";


export const useDaycare = () => {
    const context = useContext(DaycareContext);

    if (!context) throw new Error("useDaycare debe ser usado dentro de un DaycareProvider");

    return context;
}