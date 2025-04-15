import React, { useEffect, useState } from "react";
import api from "../axiosConfig";
import "../styles/userList.css";
import { Edit, Trash2 } from 'lucide-react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [editUser, setEditUser] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    email: "",
    position: "",
    password: ""
  });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get("users-list");
      setUsers(response.data);
      setError(null);
    } catch (error) {
      console.error("Error fetching users:", error);
      setError("Failed to load users. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user) => {
    setEditUser(user);
    setEditFormData({
      name: user.name,
      email: user.email,
      position: user.position,
      password: ""
    });
    setIsEditing(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdate = async () => {
    if (!editUser) return;

    const updatedFields = {};
    
    // Include all fields that are in the form (whether changed or not)
    // except password which should only be included if provided
    updatedFields.name = editFormData.name;
    updatedFields.email = editFormData.email;
    updatedFields.position = editFormData.position;
    
    if (editFormData.password) {
      updatedFields.password = editFormData.password;
    }

    try {
      // Make sure the API endpoint matches your Laravel route
      await api.put(`/users/${editUser.id}`, updatedFields, {
        headers: { 
          "Content-Type": "application/json",
          // Include any CSRF token if needed
          "X-CSRF-TOKEN": document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
        }
      });

      setIsEditing(false);
      fetchUsers(); // Refresh the user list
    } catch (error) {
      console.error("Error updating user:", error.response?.data || error.message);
      setError(`Failed to update user: ${error.response?.data?.message || "Please try again."}`);
    }
  };

  const handleDelete = async (userId) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        // Make sure the API endpoint matches your Laravel route
        await api.delete(`/users/${userId}`, {
          headers: {
            // Include any CSRF token if needed
            "X-CSRF-TOKEN": document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
          }
        });
        
        // Update the local state only after successful API call
        setUsers(users.filter((user) => user.id !== userId));
      } catch (error) {
        console.error("Error deleting user:", error.response?.data || error.message);
        setError(`Failed to delete user: ${error.response?.data?.message || "Please try again."}`);
      }
    }
  };

  // Table skeleton loader component
  const TableSkeleton = ({ rows = 5 }) => {
    return Array(rows)
      .fill(0)
      .map((_, index) => (
        <tr key={index}>
          <td><Skeleton width="80%" height={20} /></td>
          <td><Skeleton width="90%" height={20} /></td>
          <td><Skeleton width="80%" height={20} /></td>
          <td>
            <div className="action-buttons">
              <Skeleton width={50} height={20} />
            </div>
          </td>
        </tr>
      ));
  };

  return (
    <div className="user-list-wrapper">
      <div className="user-list-container w-[80%]">
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <div className="user-table-container">
          <table className="user-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Position</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeleton rows={5} />
              ) : (
                users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>{user.position}</td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="p-1 text-blue-600 hover:text-blue-800 cursor-pointer"
                          onClick={() => handleEdit(user)}
                        >
                          <Edit size={20} />
                        </button>
                        <button
                          className="p-1 text-red-600 hover:text-red-800 cursor-pointer"
                          onClick={() => handleDelete(user.id)}
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {isEditing && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3 className="modal-header">Edit User</h3>
              
              <div className="form-group">
                <label className="form-label">Name:</label>
                <input
                  type="text"
                  name="name"
                  value={editFormData.name}
                  onChange={handleInputChange}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email:</label>
                <input
                  type="email"
                  name="email"
                  value={editFormData.email}
                  onChange={handleInputChange}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <select
                  name="position"
                  value={editFormData.position}
                  onChange={handleInputChange}
                  className="form-input"
                >
                  {/* Avoid displaying the selected value as an option */}
                  {["Med Secretary", "Accounting", "Doctor Pathologist"].map((position) => (
                    <option key={position} value={position} disabled={position === editFormData.position}>
                      {position}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Password:</label>
                <input
                  type="password"
                  name="password"
                  value={editFormData.password}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Leave blank to keep current password"
                />
              </div>

              <div className="modal-footer">
                <button
                  className="btn btn-update"
                  onClick={handleUpdate}
                >
                  Update
                </button>
                <button
                  className="btn btn-cancel"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserList;