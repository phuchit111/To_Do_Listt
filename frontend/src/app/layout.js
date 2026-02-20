'use client';

import { AuthProvider } from '../context/AuthContext';
import '../styles/globals.css';

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <head>
                <title>TaskFlow — Smart To-Do List</title>
                <meta name="description" content="Premium task management application with dashboard analytics, categories, and team collaboration." />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>✅</text></svg>" />
            </head>
            <body>
                <AuthProvider>{children}</AuthProvider>
            </body>
        </html>
    );
}
