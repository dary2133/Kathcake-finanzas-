'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import SessionTimeout from './SessionTimeout';

export default function Layout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    const navItems = [
        { name: 'Dashboard', href: '/' },
        { name: 'Ventas Kathcake', href: '/ingresos' },
        { name: 'Gastos Kathcake', href: '/gastos' },
        { name: 'Cuentas Kathcake', href: '/cuentas-kathcake' },
        { name: 'Cuentas Personales', href: '/cuentas' },
        { name: 'Reportes Kathcake', href: '/reportes' },
        { name: 'Configuración', href: '/configuracion' },
    ];

    return (
        <div className='min-h-screen bg-slate-50 flex font-sans text-slate-900'>
            <SessionTimeout />
            {/* Sidebar */}
            <aside className='w-64 bg-slate-900 text-white flex flex-col fixed h-full'>
                <div className='p-6 border-b border-slate-700 flex flex-col items-center text-center'>
                    <div className="mb-4 relative w-32 h-32">
                        <Image
                            src="/Kath Cake logo Vector33.png"
                            alt="Kathcake Logo"
                            fill
                            className="object-contain"
                            priority
                        />
                    </div>
                    <h1 className='text-2xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent'>
                        Kathcake
                    </h1>
                    <p className='text-xs text-slate-400 mt-1'>Control Financiero</p>
                </div>

                <nav className='flex-1 p-4 space-y-2 overflow-y-auto'>
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center px-4 py-3 rounded-xl transition-all duration-200 ${isActive
                                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/50'
                                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                    }`}
                            >
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                <div className='p-4 border-t border-slate-800 space-y-4'>
                    <button
                        onClick={() => signOut({ callbackUrl: '/login' })}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-rose-600/10 text-rose-400 hover:bg-rose-600 hover:text-white rounded-xl transition-all duration-200 font-bold border border-rose-600/20"
                    >
                        <span>🚪</span> Cerrar Sesión
                    </button>
                    <div className='text-[10px] text-center text-slate-500 uppercase tracking-widest font-bold'>
                        Kathcake Finance v1.2
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className='flex-1 ml-64 p-8'>
                <div className='max-w-7xl mx-auto'>
                    {children}
                </div>
            </main>
        </div>
    );
}
