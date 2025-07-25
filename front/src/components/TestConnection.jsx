import { useState, useEffect } from 'react';
import api from '../services/api';

function TestConnection() {
    const [status, setStatus] = useState('Testing connection...');

    useEffect(() => {
        const testBackendConnection = async () => {
            try {
                const response = await api.get('/user/test-connection');
                if (response.data.success) {
                    setStatus('Successfully connected to backend! ✅');
                } else {
                    setStatus('Connected but received unexpected response ⚠️');
                }
            } catch (error) {
                setStatus(`Failed to connect to backend ❌ (${error.message})`);
                console.error('Connection error:', error);
            }
        };

        testBackendConnection();
    }, []);

    return (
        <div>
            <h2>Backend Connection Status</h2>
            <p>{status}</p>
        </div>
    );
}

export default TestConnection;
