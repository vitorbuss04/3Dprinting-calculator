import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { StorageService } from '../services/storage';
import { Material } from '../types';

export interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'warning' | 'info' | 'success' | 'error';
    read: boolean;
    date: Date;
    link?: string; // Route to navigate to (e.g., 'assets')
}

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
    refreshNotifications: () => Promise<void>;
    loading: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(false);

    // Helper to generate unique ID for stock alerts to avoid duplicates if not needed
    // or we can just regenerate them every time.
    // Strategy: Clear all "system" notifications and regenerate them based on current state.
    // User "read" status for system notifications:
    // If user marks "Low Stock PLA" as read, we shouldn't show it as new again unless the condition persists?
    // Actually, if we regenerate, we lose the "read" state unless we persist it.
    // Simple approach for V1:
    // 1. Fetch materials.
    // 2. Generate notifications for low stock.
    // 3. Compare with existing notifications to keep "read" status if the alert is for the same item.

    const refreshNotifications = useCallback(async () => {
        setLoading(true);
        try {
            const materials = await StorageService.getMaterials();

            const newNotifications: Notification[] = [];
            const now = new Date();

            materials.forEach(material => {
                const stock = Number(material.currentStock);
                const weight = Number(material.spoolWeight);

                // Logic: Less than 10% or less than 100g
                const isLowStock = (weight > 0 && stock / weight < 0.1) || stock < 100;

                if (isLowStock) {
                    newNotifications.push({
                        id: `low-stock-${material.id}`,
                        title: 'Estoque Baixo',
                        message: `O filamento ${material.name} (${material.type}) está acabando (${stock}g restantes).`,
                        type: 'warning',
                        read: false, // Default to false, check below
                        date: now,
                        link: 'assets' // We can use this to redirect
                    });
                }
            });

            setNotifications(prev => {
                // Merge new with old to preserve "read" status
                const merged = newNotifications.map(newNotif => {
                    const existing = prev.find(p => p.id === newNotif.id);
                    if (existing) {
                        return {
                            ...newNotif,
                            read: existing.read, // Keep read status
                            date: existing.date // Keep original date or update? Let's keep original date of detection
                        };
                    }
                    return newNotif;
                });

                // Also keep non-system notifications if we add any later? 
                // For now, we only have these system notifications. 
                // If we had manual notifications we'd filter them in.
                return merged;
            });

        } catch (error) {
            console.error('Failed to fetch notifications', error);
        } finally {
            setLoading(false);
        }
    }, []);

    // Initial load
    useEffect(() => {
        refreshNotifications();

        // Optional: Poll every 5 minutes
        const interval = setInterval(refreshNotifications, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [refreshNotifications]);

    const markAsRead = (id: string) => {
        setNotifications(prev =>
            prev.map(n => n.id === id ? { ...n, read: true } : n)
        );
    };

    const markAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <NotificationContext.Provider value={{
            notifications,
            unreadCount,
            markAsRead,
            markAllAsRead,
            refreshNotifications,
            loading
        }}>
            {children}
        </NotificationContext.Provider>
    );
};
