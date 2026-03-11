import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const SocketContext = createContext(null);

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:4000';

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated || !user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    // Create socket connection
    const newSocket = io(SOCKET_URL, {
      withCredentials: true,
    });

    newSocket.on('connect', () => {
      console.log('[Socket] Connected');
      setIsConnected(true);

      // Join user's personal room
      newSocket.emit('join', user._id);

      // If user is a guide, join guide room
      if (user.role === 'guide') {
        newSocket.emit('join-guide', user._id);
      }
    });

    newSocket.on('disconnect', () => {
      console.log('[Socket] Disconnected');
      setIsConnected(false);
    });

    // Listen for booking events
    newSocket.on('new-booking', (booking) => {
      toast.success('New booking request received!', {
        duration: 5000,
        icon: '📋',
      });
      // Dispatch custom event for components to listen to
      window.dispatchEvent(new CustomEvent('booking-update', { detail: { type: 'new', booking } }));
    });

    newSocket.on('booking-accepted', (booking) => {
      toast.success('Your booking has been accepted! Please complete payment.', {
        duration: 5000,
        icon: '✅',
      });
      window.dispatchEvent(new CustomEvent('booking-update', { detail: { type: 'accepted', booking } }));
    });

    newSocket.on('booking-rejected', (booking) => {
      toast('Your booking has been declined.', {
        duration: 5000,
        icon: '❌',
      });
      window.dispatchEvent(new CustomEvent('booking-update', { detail: { type: 'rejected', booking } }));
    });

    newSocket.on('booking-completed', (booking) => {
      toast.success('Tour completed! Please rate your guide.', {
        duration: 5000,
        icon: '🎉',
      });
      window.dispatchEvent(new CustomEvent('booking-update', { detail: { type: 'completed', booking } }));
    });

    newSocket.on('revision-requested', (booking) => {
      toast('Guide requested changes to your itinerary', {
        duration: 5000,
        icon: '📝',
      });
      window.dispatchEvent(new CustomEvent('booking-update', { detail: { type: 'revision', booking } }));
    });

    newSocket.on('booking-updated', (booking) => {
      toast.success('Tourist updated their booking!', {
        duration: 5000,
        icon: '📋',
      });
      window.dispatchEvent(new CustomEvent('booking-update', { detail: { type: 'updated', booking } }));
    });

    newSocket.on('revision-accepted', (booking) => {
      toast.success('Tourist accepted your revision!', {
        duration: 5000,
        icon: '✅',
      });
      window.dispatchEvent(new CustomEvent('booking-update', { detail: { type: 'revision-accepted', booking } }));
    });

    newSocket.on('payment-paid', (booking) => {
      toast.success('Payment confirmed! Tour is now scheduled.', {
        duration: 5000,
        icon: '💳',
      });
      window.dispatchEvent(new CustomEvent('booking-update', { detail: { type: 'payment-paid', booking } }));
    });

    newSocket.on('booking-started', (booking) => {
      toast.success('Your tour has started! Have a great trip.', {
        duration: 5000,
        icon: '🚀',
      });
      window.dispatchEvent(new CustomEvent('booking-update', { detail: { type: 'started', booking } }));
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [isAuthenticated, user?._id, user?.role]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
