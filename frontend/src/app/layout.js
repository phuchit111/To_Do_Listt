'use client';

import { AuthProvider } from '../context/AuthContext';
import { ThemeProvider } from '../context/ThemeContext';
import '../styles/globals.css';

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <head>
                <title>TaskFlow — Smart To-Do List</title>
                <meta name="description" content="Premium task management application with dashboard analytics, categories, and team collaboration." />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect rx='20' width='100' height='100' fill='%236366f1'/><path d='M25 55 L42 72 L75 35' stroke='white' stroke-width='12' fill='none' stroke-linecap='round' stroke-linejoin='round'/></svg>" />
                <script dangerouslySetInnerHTML={{
                    __html: `
                        (function() {
                            const theme = localStorage.getItem('theme') || 'dark';
                            document.documentElement.setAttribute('data-theme', theme);
                        })()
                    `
                }} />
            </head>
            <body>
                <ThemeProvider>
                    <AuthProvider>{children}</AuthProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}
