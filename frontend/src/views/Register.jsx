import React, { useState } from 'react';
import api from '../axiosConfig';
import '../styles/register.css'; // Make sure to create and import the CSS file
import { useNavigate } from 'react-router-dom';

function Register() {
  const [formData, setFormData] = useState({
    name: '',
    position: '',
    email: '',
    password: '',
    password_confirmation: '',
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);  // Loading state for the button
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);  // Set loading to true when starting registration

    try {
      const response = await api.post('register', formData, {
        withCredentials: true, // Ensures cookies are stored
      });

      setSuccess('Registration successful!');
      setTimeout(() => {
        navigate('/'); // Navigate to the homepage after a successful registration
      }, 1500);
      console.log('User registered:', response.data);
    } catch (error) {
      console.error('Registration error:', error.response);
      setError(error.response?.data?.error || 'Registration failed.');
    } finally {
      setLoading(false);  // Set loading to false after the process ends
    }
  };

  return (
    <div className="container-register">
      <div className="text">Register</div>
      
      {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
      {success && <p style={{ color: 'green', textAlign: 'center' }}>{success}</p>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="input-data">
            <input type="text" name="name" onChange={handleChange} required />
            <label>Name</label>
            <div className="underline"></div>
          </div>
          <div className="input-data">
          <select
            name="position"
            id="position"
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select Position</option>
            <option value="Med Secretary">Med Secretary</option>
            <option value="Accounting">Accounting</option>
            <option value="Admin">Admin</option>
            <option value="Doctor Pathologist">Doctor Pathologist</option>
          </select>
          
        </div>

        </div>
        <div className="form-row">
          <div className="input-data">
            <input type="email" name="email" onChange={handleChange} required />
            <label>Email</label>
            <div className="underline"></div>
          </div>
        </div>
        <div className="form-row">
          <div className="input-data">
            <input type="password" name="password" onChange={handleChange} required />
            <label>Password</label>
            <div className="underline"></div>
          </div>
          <div className="input-data">
            <input type="password" name="password_confirmation" onChange={handleChange} required />
            <label>Confirm Password</label>
            <div className="underline"></div>
          </div>
        </div>
        <div className="form-row submit-btn">
          <div className="input-data">
            <div className="inner"></div>
            <input 
              type="submit" 
              value={loading ? "Registering..." : "Register"}  // Show "Registering..." text while loading
              disabled={loading}  // Disable the button while loading
            />
            {loading && (
              <div className="loading-spinner">
                <div className="spinner"></div>  {/* Spinner element */}
              </div>
            )}
          </div>
        </div>
        <div className="signupContainer">
          <a href="/">Back to login</a>
        </div>
      </form>
    </div>
  );
}

export default Register;
