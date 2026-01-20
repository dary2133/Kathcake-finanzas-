import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-center notranslate">
                    <div className="card-premium p-12 bg-white/5 border border-white/10 backdrop-blur-2xl max-w-md">
                        <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter mb-4"><span>Algo salió mal</span></h1>
                        <p className="text-slate-400 text-sm mb-8"><span>La interfaz tuvo un problema al cargar. Esto puede deberse a extensiones como Google Translate.</span></p>
                        <button
                            onClick={() => window.location.reload()}
                            className="btn-primary w-full h-14"
                        >
                            Recargar Aplicación
                        </button>
                        <pre className="mt-8 p-4 bg-black/30 rounded-xl text-left text-[10px] text-red-400 overflow-auto max-h-40">
                            {this.state.error?.toString()}
                        </pre>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
