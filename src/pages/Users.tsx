import React, { useEffect, useState } from 'react';
import { supabase } from '../config/supabase';
import { User } from '../types';
import { useAuthStore } from '../store/authStore';

export const Users: React.FC = () => {
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [newUserEmail, setNewUserEmail] = useState('');

  useEffect(() => {
    if (currentUser?.role !== 'admin') return;

    const fetchUsers = async () => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('parent_id', currentUser.id);

      if (error) {
        console.error('Error fetching users:', error);
        return;
      }

      // Transform snake_case to camelCase
      const transformedData = (data || []).map(user => ({
        id: user.id,
        email: user.email,
        role: user.role,
        parentId: user.parent_id,
        pixelCode: user.pixel_code
      }));

      setUsers(transformedData);
    };

    fetchUsers();
  }, [currentUser]);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newUserEmail || !currentUser) return;

    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          email: newUserEmail,
          role: 'user',
          parent_id: currentUser.id,
          pixel_code: crypto.randomUUID()
        }
      ])
      .select();

    if (error) {
      console.error('Error adding user:', error);
      return;
    }

    // Transform the new user data
    const newUser = {
      id: data[0].id,
      email: data[0].email,
      role: data[0].role,
      parentId: data[0].parent_id,
      pixelCode: data[0].pixel_code
    };

    setUsers([...users, newUser]);
    setNewUserEmail('');
  };

  const handleDeleteUser = async (userId: string) => {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (error) {
      console.error('Error deleting user:', error);
      return;
    }

    setUsers(users.filter(user => user.id !== userId));
  };

  if (currentUser?.role !== 'admin') {
    return <div>Access denied. Admin privileges required.</div>;
  }

  return (
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-4">Add New User</h2>
        <form onSubmit={handleAddUser} className="flex gap-4">
          <input
            type="email"
            value={newUserEmail}
            onChange={(e) => setNewUserEmail(e.target.value)}
            placeholder="Enter email address"
            className="flex-1 px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Add User
          </button>
        </form>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-4">Manage Users</h2>
        <div className="space-y-4">
          {users.map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between p-4 border rounded"
            >
              <div>
                <p className="font-medium">{user.email}</p>
                <p className="text-sm text-gray-500">Pixel Code: {user.pixelCode}</p>
              </div>
              <button
                onClick={() => handleDeleteUser(user.id)}
                className="px-3 py-1 text-red-600 hover:bg-red-50 rounded"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};