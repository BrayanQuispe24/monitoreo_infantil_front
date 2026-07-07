import { RouterProvider } from "react-router";
import { Router } from "./router/router";

export function MonitoreoApp() {
    return (
        <RouterProvider router={Router} />
    )
}