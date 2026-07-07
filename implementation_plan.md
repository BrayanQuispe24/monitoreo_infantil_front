# Plan de Ejecución: Control de Acceso por Roles (RBAC en Frontend)

Este plan describe la estrategia para implementar y validar la matriz de roles y permisos del sistema (`ADMIN`, `DAYCARE_MANAGER`, `OPERATOR`, `MONITOR`) de forma exclusiva en el frontend, consumiendo el rol real del usuario desde el contexto de autenticación (`useAuth`).

---

## Análisis y Comparación de Roles

A continuación se detalla cómo se restringirá la interfaz y la visualización de datos de acuerdo a los requerimientos:

| Función / Pantalla | ADMIN | DAYCARE_MANAGER | OPERATOR | MONITOR |
| :--- | :---: | :---: | :---: | :---: |
| **Menú Usuarios / Configuración** | Acceso Completo | Oculto | Oculto | Oculto |
| **Ver Guarderías** | Todas | Solo la suya | Oculto | Oculto |
| **Crear/Editar Guarderías** | Sí | Editar solo la suya | No | No |
| **Dibujar Geocerca SIG** | Sí | Sí (solo su guardería) | Oculto | Oculto |
| **Ver Niños / Tutores** | Todos | Solo su guardería | Solo su guardería | Oculto |
| **Registrar Niños / Tutores** | Sí | Sí | Sí | No |
| **Vincular Tutor-Niño** | Sí | Sí | Sí | No |
| **Resetear PIN de Tutor** | Sí | Sí | Opcional (Sí) | No |
| **Generar QR Rastreador** | Sí | Sí | Sí | No |
| **Desvincular Rastreador** | Sí | Sí | No (Oculto) | No |
| **Ver Monitoreo / Alertas** | Sí | Sí | Sí | Sí |
| **Resolver Alertas** | Sí | Sí | No (Oculto) | No (Oculto) |
| **Ver Reportes** | Todos | Sí (su guardería) | Opcional (Oculto) | No (Oculto) |

---

## Cambios Propuestos

### 1. Layout Principal y Rutas

#### [MODIFY] [AdminLayout.tsx](file:///c:/Users/brayan/Documents/SIG/Proyecto/monitoreo_infantil_front/src/layouts/AdminLayout.tsx)
* Reemplazar el objeto simulado `currentUser` por el usuario logueado dinámicamente usando `useAuth()`.
* Vincular la función `logout` del contexto al botón de "Cerrar sesión" en el menú.
* Filtrar dinámicamente los items del sidebar en base al rol real del usuario (`user.role`).
* **Guardia de Ruta del Cliente**: Validar que la ruta actual (`location.pathname`) esté permitida para el rol del usuario. Si no está permitida, mostrar una pantalla amigable de "Acceso Denegado" o redirigir al Dashboard en lugar de renderizar el `<Outlet />`.

---

### 2. Módulos y Formularios Específicos

#### [MODIFY] [DaycaresPage.tsx](file:///c:/Users/brayan/Documents/SIG/Proyecto/monitoreo_infantil_front/src/features/daycares/pages/DaycaresPage.tsx)
* Filtrar la lista de guarderías en pantalla:
  * Si es `DAYCARE_MANAGER`: Mostrar únicamente la guardería correspondiente a `user.daycare_id`.
  * Si es `ADMIN`: Mostrar todas.
* Ocultar el botón "Nueva guardería" si no es `ADMIN`.
* Mostrar el botón "Editar" en la fila únicamente para `ADMIN`, o para `DAYCARE_MANAGER` si es su propia guardería.

#### [MODIFY] [SigAreaPage.tsx](file:///c:/Users/brayan/Documents/SIG/Proyecto/monitoreo_infantil_front/src/features/sig-area/pages/SigAreaPage.tsx)
* Importar `useAuth`.
* Si es `DAYCARE_MANAGER`: Pre-seleccionar automáticamente su propia guardería en el selector y deshabilitar el dropdown para que no pueda seleccionar otras guarderías del sistema.

#### [MODIFY] [ChildrenPage.tsx](file:///c:/Users/brayan/Documents/SIG/Proyecto/monitoreo_infantil_front/src/features/children/pages/ChildrenPage.tsx)
* Importar `useAuth`.
* Filtrar la lista de niños cargada en pantalla:
  * Si es `DAYCARE_MANAGER` o `OPERATOR`: Mostrar únicamente los niños que pertenezcan a `user.daycare_id`.
  * Si es `ADMIN`: Mostrar todos.
* Ocultar el selector / filtro de guarderías de la cabecera si no es `ADMIN`.
* **Formulario**: Modificar la creación de niños para que, si el usuario no es `ADMIN`, el valor de `daycare_id` se asigne automáticamente al de su sesión y se oculte/deshabilite ese campo en el modal.

#### [MODIFY] [GuardiansPage.tsx](file:///c:/Users/brayan/Documents/SIG/Proyecto/monitoreo_infantil_front/src/features/guardians/pages/GuardiansPage.tsx)
* Importar `useAuth`.
* Filtrar el listado de tutores:
  * Si es `DAYCARE_MANAGER` o `OPERATOR`: Mostrar únicamente tutores vinculados a la guardería del usuario (`user.daycare_id`).
* Ocultar el botón "Resetear PIN" y los botones de vinculación si el rol del usuario no tiene permisos (`MONITOR`).

#### [MODIFY] [TrackersPage.tsx](file:///c:/Users/brayan/Documents/SIG/Proyecto/monitoreo_infantil_front/src/features/trackers/pages/TrackersPage.tsx)
* Importar `useAuth`.
* Filtrar el listado de niños con rastreadores:
  * Si es `DAYCARE_MANAGER` o `OPERATOR`: Mostrar solo niños de `user.daycare_id`.
* Ocultar el botón rojo de desvinculación (basurero) si el usuario es `OPERATOR` o `MONITOR`.

#### [MODIFY] [MonitoringPage.tsx](file:///c:/Users/brayan/Documents/SIG/Proyecto/monitoreo_infantil_front/src/features/monitoring/pages/MonitoringPage.tsx)
* Si el usuario es `DAYCARE_MANAGER`, `OPERATOR` o `MONITOR`:
  * Pre-seleccionar su `daycare_id` en el selector de guarderías superior y deshabilitar/ocultar el dropdown para impedir ver los perímetros y niños de otras sucursales.

#### [MODIFY] [ReportsPage.tsx](file:///c:/Users/brayan/Documents/SIG/Proyecto/monitoreo_infantil_front/src/features/reports/pages/ReportsPage.tsx)
* Si el usuario es `DAYCARE_MANAGER`:
  * Ocultar el selector de guarderías generales y forzar que los reportes de alertas, niños, rastreadores y tutores se realicen exclusivamente sobre su `daycare_id`.

---

## Plan de Verificación

### Verificación Estática
* Correr `npx tsc --noEmit` en el frontend para asegurar que las importaciones y la inyección del contexto de autenticación no generen errores de tipado.
