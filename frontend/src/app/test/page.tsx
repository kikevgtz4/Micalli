'use client';
import { useState, useEffect } from 'react';

export default function TestPage() {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8000/api/accounts/test/');
        const data = await response.json();
        setMessage(data.message);
        setLoading(false);
      } catch (err) {
        setError('Failed to connect to backend');
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4">Backend Connection Test</h1>
        <div className="p-4 bg-green-100 text-green-800 rounded-md">
          <p>Message from backend: {message}</p>
        </div>
      </div>
    </div>
  );
}