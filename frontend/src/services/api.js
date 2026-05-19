import axios from 'axios';

const API_URL = '/api';

// Set Auth Token in Headers
export const setAuthToken = (token) => {
    if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
        delete axios.defaults.headers.common['Authorization'];
    }
};

export const registerUser = async (userData) => {
    const response = await axios.post(`${API_URL}/auth/register`, userData);
    return response.data;
};

export const loginUser = async (userData) => {
    const response = await axios.post(`${API_URL}/auth/login`, userData);
    return response.data;
};

export const getComplaints = async (category = '') => {
    const url = category ? `${API_URL}/complaints?category=${category}` : `${API_URL}/complaints`;
    const response = await axios.get(url);
    return response.data;
};

export const addComplaint = async (complaintData) => {
    const response = await axios.post(`${API_URL}/complaints`, complaintData);
    return response.data;
};

export const updateComplaintStatus = async (id, status) => {
    const response = await axios.put(`${API_URL}/complaints/${id}`, { status });
    return response.data;
};

export const searchComplaints = async (location) => {
    const response = await axios.get(`${API_URL}/complaints/search?location=${location}`);
    return response.data;
};

export const analyzeComplaintText = async (description) => {
    const response = await axios.post(`${API_URL}/ai/analyze`, { description });
    return response.data;
};
