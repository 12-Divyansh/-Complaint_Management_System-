import { useState, useEffect, useContext } from 'react';
import { getComplaints, updateComplaintStatus, searchComplaints } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { MapPin, Clock, Tag, Building, Search, Filter } from 'lucide-react';

const Dashboard = () => {
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const { user } = useContext(AuthContext);

    const fetchComplaints = async () => {
        try {
            setLoading(true);
            let data;
            if (searchTerm) {
                data = await searchComplaints(searchTerm);
            } else {
                data = await getComplaints(filterCategory);
            }
            setComplaints(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchComplaints();
    }, [filterCategory]);

    const handleSearch = (e) => {
        e.preventDefault();
        fetchComplaints();
    };

    const handleStatusChange = async (id, newStatus) => {
        try {
            await updateComplaintStatus(id, newStatus);
            fetchComplaints();
        } catch (error) {
            console.error(error);
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'Pending': return 'badge-pending';
            case 'In Progress': return 'badge-progress';
            case 'Resolved': return 'badge-resolved';
            case 'Rejected': return 'badge-rejected';
            default: return 'badge-pending';
        }
    };

    return (
        <div className="container">
            <div className="flex justify-between items-center mb-4 mt-4">
                <h2>Complaint Dashboard</h2>
            </div>

            <div className="card mb-4" style={{ padding: '1.5rem' }}>
                <div className="flex justify-between gap-4" style={{ flexWrap: 'wrap' }}>
                    <form onSubmit={handleSearch} className="flex gap-2" style={{ flex: 1, minWidth: '300px' }}>
                        <div style={{ position: 'relative', width: '100%' }}>
                            <Search size={18} style={{ position: 'absolute', left: '10px', top: '12px', color: 'var(--text-muted)' }} />
                            <input 
                                type="text" 
                                placeholder="Search by location..." 
                                className="form-control" 
                                style={{ paddingLeft: '2.5rem' }}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button type="submit" className="btn btn-secondary">Search</button>
                    </form>

                    <div className="flex items-center gap-2" style={{ minWidth: '200px' }}>
                        <Filter size={18} color="var(--text-muted)" />
                        <select 
                            className="form-control" 
                            value={filterCategory} 
                            onChange={(e) => setFilterCategory(e.target.value)}
                        >
                            <option value="">All Categories</option>
                            <option value="Water Supply">Water Supply</option>
                            <option value="Electricity">Electricity</option>
                            <option value="Sanitation">Sanitation</option>
                            <option value="Roads">Roads</option>
                            <option value="General">General</option>
                        </select>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-5">
                    <div className="spinner"></div>
                </div>
            ) : complaints.length === 0 ? (
                <div className="card text-center py-5">
                    <p className="text-muted">No complaints found.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2">
                    {complaints.map(complaint => (
                        <div key={complaint._id} className="card" style={{ padding: '1.5rem' }}>
                            <div className="flex justify-between items-start mb-2">
                                <h3 style={{ margin: 0 }}>{complaint.title}</h3>
                                <span className={`badge ${getStatusBadge(complaint.status)}`}>{complaint.status}</span>
                            </div>
                            <p className="text-muted mb-3" style={{ fontSize: '0.9rem' }}>{complaint.description}</p>
                            
                            <div className="flex items-center gap-4 mb-3" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                <div className="flex items-center gap-1"><Tag size={14}/> {complaint.category}</div>
                                <div className="flex items-center gap-1"><MapPin size={14}/> {complaint.location}</div>
                            </div>
                            
                            {(complaint.priority || complaint.department) && (
                                <div className="flex items-center gap-4 mb-4" style={{ fontSize: '0.85rem' }}>
                                    {complaint.priority && <div className="badge badge-rejected" style={{ backgroundColor: 'rgba(239,68,68,0.1)'}}>Priority: {complaint.priority}</div>}
                                    {complaint.department && <div className="flex items-center gap-1" style={{color: 'var(--secondary)'}}><Building size={14}/> {complaint.department}</div>}
                                </div>
                            )}

                            <div className="flex justify-between items-center mt-4" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                                <div className="flex items-center gap-1 text-muted" style={{ fontSize: '0.8rem' }}>
                                    <Clock size={12}/> {new Date(complaint.createdAt).toLocaleDateString()}
                                </div>
                                
                                {user?.role === 'admin' && (
                                    <select 
                                        className="form-control" 
                                        style={{ width: 'auto', padding: '0.2rem 0.5rem', fontSize: '0.85rem' }}
                                        value={complaint.status}
                                        onChange={(e) => handleStatusChange(complaint._id, e.target.value)}
                                    >
                                        <option value="Pending">Pending</option>
                                        <option value="In Progress">In Progress</option>
                                        <option value="Resolved">Resolved</option>
                                        <option value="Rejected">Rejected</option>
                                    </select>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Dashboard;
