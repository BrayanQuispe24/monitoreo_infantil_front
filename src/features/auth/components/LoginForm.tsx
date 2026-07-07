import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Eye, EyeOff, Lock, Mail, ShieldCheck } from "lucide-react";
import { AuthService } from "../services/authService";
import { useAuth } from "../hooks/useAuth";

type LoginFormData = {
    username_or_email: string;
    password: string;
};
type LoginErrors = Partial<Record<"username_or_email" | "password" | "general", string>>;


export const LoginForm = () => {
    const [formData, setFormData] = useState<LoginFormData>({
        username_or_email: "",
        password: ""
    });

    const [errors, setErrors] = useState<LoginErrors>({});
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const isFormDisabled = useMemo(() => isLoading, [isLoading]);

    const validateForm = () => {
        const nextErrors: LoginErrors = {};

        if (!formData.username_or_email.trim()) {
            nextErrors.username_or_email = "El correo electrónico es obligatorio.";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.username_or_email)) {
            nextErrors.username_or_email = "Ingresa un correo electrónico válido.";
        }

        if (!formData.password.trim()) {
            nextErrors.password = "La contraseña es obligatoria.";
        }

        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const handleSubmit = async (event: React.SubmitEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!validateForm()) return;

        setIsLoading(true);
        setErrors({});

        try {
            const payload: LoginFormData = {
                username_or_email: formData.username_or_email.trim(),
                password: formData.password
            };

            const data = await AuthService.login(payload);
            login(data.user, data.access_token);
            navigate("/admin/dashboard");
        } catch {
            setErrors({
                general: "Credenciales incorrectas. Verifica tu correo y contraseña.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md rounded-[2rem] border border-white/80 bg-white/90 p-6 shadow-2xl shadow-cyan-950/25 backdrop-blur-2xl sm:p-8">
            <div className="mb-7 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-emerald-500 text-white shadow-lg shadow-cyan-500/25">
                    <ShieldCheck size={34} />
                </div>

                <h2 className="mt-5 text-3xl font-black tracking-tight text-slate-900">
                    Iniciar sesión
                </h2>

                <p className="mt-2 text-sm font-medium text-slate-500">
                    Accede al panel administrativo del sistema
                </p>
            </div>

            {errors.general && (
                <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                    {errors.general}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                <div>
                    <label
                        htmlFor="email"
                        className="mb-2 block text-sm font-bold text-slate-700"
                    >
                        Correo electrónico
                    </label>

                    <div
                        className={`flex items-center gap-3 rounded-2xl border bg-white px-4 py-3 shadow-sm transition focus-within:border-cyan-500 focus-within:ring-4 focus-within:ring-cyan-500/10 ${errors.username_or_email ? "border-rose-300" : "border-slate-200"
                            }`}
                    >
                        <Mail size={19} className="text-slate-400" />

                        <input
                            id="username_or_email"
                            type="text"
                            value={formData.username_or_email}
                            disabled={isFormDisabled}
                            onChange={(event) =>
                                setFormData((current) => ({
                                    ...current,
                                    username_or_email: event.target.value,
                                }))
                            }
                            placeholder="admin@guarderia.com"
                            className="w-full bg-transparent text-sm font-medium text-slate-800 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed"
                            autoComplete="email"
                            aria-invalid={Boolean(errors.username_or_email)}
                        />
                    </div>

                    {errors.username_or_email && (
                        <p className="mt-2 text-sm font-medium text-rose-600">
                            {errors.username_or_email}
                        </p>
                    )}
                </div>

                <div>
                    <label
                        htmlFor="password"
                        className="mb-2 block text-sm font-bold text-slate-700"
                    >
                        Contraseña
                    </label>

                    <div
                        className={`flex items-center gap-3 rounded-2xl border bg-white px-4 py-3 shadow-sm transition focus-within:border-cyan-500 focus-within:ring-4 focus-within:ring-cyan-500/10 ${errors.password ? "border-rose-300" : "border-slate-200"
                            }`}
                    >
                        <Lock size={19} className="text-slate-400" />

                        <input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            value={formData.password}
                            disabled={isFormDisabled}
                            onChange={(event) =>
                                setFormData((current) => ({
                                    ...current,
                                    password: event.target.value,
                                }))
                            }
                            placeholder="Ingresa tu contraseña"
                            className="w-full bg-transparent text-sm font-medium text-slate-800 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed"
                            autoComplete="current-password"
                            aria-invalid={Boolean(errors.password)}
                        />

                        <button
                            type="button"
                            disabled={isFormDisabled}
                            onClick={() => setShowPassword((current) => !current)}
                            className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed"
                            aria-label={
                                showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                            }
                        >
                            {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                        </button>
                    </div>

                    {errors.password && (
                        <p className="mt-2 text-sm font-medium text-rose-600">
                            {errors.password}
                        </p>
                    )}
                </div>

                <div className="flex items-center justify-between gap-4 text-sm">
                    <label className="flex cursor-pointer items-center gap-2 font-semibold text-slate-600">
                        <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                        />
                        Recordarme
                    </label>

                    <button
                        type="button"
                        className="font-bold text-cyan-700 transition hover:text-cyan-900"
                    >
                        ¿Olvidaste tu contraseña?
                    </button>
                </div>

                <button
                    type="submit"
                    disabled={isFormDisabled}
                    className="flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-cyan-600 to-emerald-600 px-5 py-3.5 text-sm font-black text-white shadow-lg shadow-cyan-600/25 transition hover:from-cyan-700 hover:to-emerald-700 focus:outline-none focus:ring-4 focus:ring-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-75"
                >
                    {isLoading ? "Validando acceso..." : "Ingresar al sistema"}
                </button>
            </form>

            <p className="mt-6 text-center text-xs font-medium leading-relaxed text-slate-400">
                Acceso exclusivo para personal autorizado del sistema administrativo.
            </p>
        </div>
    );
}