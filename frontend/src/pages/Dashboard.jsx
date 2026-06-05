import { useState, useEffect, useContext } from 'react';
import { getComplaints, updateComplaintStatus, searchComplaints, deleteComplaint } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { MapPin, Clock, Tag, Building, Search, Filter, Briefcase, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';

const Dashboard = () => {
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const { user } = useContext(AuthContext);

    // Timeline and update form states
    const [expandedCardId, setExpandedCardId] = useState(null);
    const [statusForm, setStatusForm] = useState({});
    const [staffForm, setStaffForm] = useState({});
    const [messageForm, setMessageForm] = useState({});

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

    const submitAdminUpdate = async (id) => {
        try {
            const currentComplaint = complaints.find(c => c._id === id);
            const status = statusForm[id] || currentComplaint.status;
            const message = messageForm[id] || '';
            const assignedStaff = staffForm[id] !== undefined ? staffForm[id] : (currentComplaint.assignedStaff || '');
            
            await updateComplaintStatus(id, status, message, assignedStaff);
            
            // Reset message text input
            setMessageForm(prev => ({ ...prev, [id]: '' }));
            fetchComplaints();
        } catch (error) {
            console.error(error);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this complaint?")) {
            try {
                await deleteComplaint(id);
                fetchComplaints();
                if (expandedCardId === id) {
                    setExpandedCardId(null);
                }
            } catch (error) {
                console.error("Delete error:", error);
            }
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

            <div className="card mb-4" style={{ 
                padding: '1.5rem', 
                background: 'var(--glass-bg)', 
                backdropFilter: 'blur(12px)',
                border: '1px solid var(--glass-border)',
                borderRadius: '16px'
            }}>
                <div className="flex justify-between gap-4" style={{ flexWrap: 'wrap', alignItems: 'center' }}>
                    <form onSubmit={handleSearch} className="flex gap-2" style={{ flex: 1, minWidth: '300px' }}>
                        <div style={{ position: 'relative', width: '100%' }}>
                            <Search size={18} style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--text-muted)' }} />
                            <input 
                                type="text" 
                                placeholder="Search complaints by location..." 
                                className="form-control" 
                                style={{ 
                                    paddingLeft: '2.75rem', 
                                    borderRadius: '10px',
                                    border: '1px solid var(--border-color)',
                                    backgroundColor: 'rgba(15, 23, 42, 0.4)'
                                }}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button type="submit" className="btn btn-secondary" style={{ borderRadius: '10px', padding: '0.75rem 1.5rem' }}>Search</button>
                    </form>

                    <div className="flex items-center gap-2" style={{ minWidth: '220px' }}>
                        <Filter size={18} color="var(--text-muted)" />
                        <select 
                            className="form-control" 
                            style={{ 
                                borderRadius: '10px',
                                border: '1px solid var(--border-color)',
                                backgroundColor: 'rgba(15, 23, 42, 0.4)',
                                height: 'auto',
                                padding: '0.75rem 1rem'
                            }}
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
                    {complaints.map(complaint => {
                        const isExpanded = expandedCardId === complaint._id;
                        const timelineUpdates = (complaint.updates && complaint.updates.length > 0) 
                            ? complaint.updates 
                            : [{
                                status: 'Pending',
                                message: 'Complaint submitted successfully and is awaiting review.',
                                createdAt: complaint.createdAt,
                                updatedBy: 'System'
                              }];

                        return (
                            <div key={complaint._id} className="card glass-card hover-card-premium" style={{ 
                                padding: '1.75rem', 
                                display: 'flex', 
                                flexDirection: 'column', 
                                justifyContent: 'space-between',
                                border: '1px solid var(--border-color)'
                            }}>
                                <div>
                                    <div className="flex justify-between items-start mb-3">
                                        <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-main)' }}>{complaint.title}</h3>
                                        <div className="flex items-center gap-2">
                                            <span className={`badge ${getStatusBadge(complaint.status)}`}>{complaint.status}</span>
                                            {(user?.role === 'admin' || complaint.email === user?.email) && (
                                                <button 
                                                    className="icon-btn-minimal" 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDelete(complaint._id);
                                                    }}
                                                    title="Delete Complaint"
                                                    style={{ padding: '0.2rem', color: 'var(--danger)', display: 'flex', alignItems: 'center' }}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <p className="text-muted mb-4" style={{ fontSize: '0.92rem', lineHeight: '1.5' }}>{complaint.description}</p>
                                    
                                    {/* Badges container */}
                                    <div className="flex items-center gap-2 mb-4" style={{ flexWrap: 'wrap' }}>
                                        <span className="metadata-pill" style={{ 
                                            backgroundColor: 'rgba(79, 70, 229, 0.12)', 
                                            color: '#818cf8', 
                                            padding: '0.35rem 0.6rem', 
                                            borderRadius: '6px', 
                                            fontSize: '0.78rem', 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            gap: '0.3rem',
                                            border: '1px solid rgba(79, 70, 229, 0.2)'
                                        }}>
                                            <Tag size={12}/> {complaint.category}
                                        </span>
                                        <span className="metadata-pill" style={{ 
                                            backgroundColor: 'rgba(148, 163, 184, 0.12)', 
                                            color: 'var(--text-muted)', 
                                            padding: '0.35rem 0.6rem', 
                                            borderRadius: '6px', 
                                            fontSize: '0.78rem', 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            gap: '0.3rem',
                                            border: '1px solid rgba(255, 255, 255, 0.05)'
                                        }}>
                                            <MapPin size={12}/> {complaint.location}
                                        </span>
                                        {complaint.priority && (
                                            <span className="metadata-pill" style={{ 
                                                backgroundColor: complaint.priority === 'Critical' ? 'rgba(239, 68, 68, 0.12)' : (complaint.priority === 'High' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(79, 70, 229, 0.12)'), 
                                                color: complaint.priority === 'Critical' ? '#f87171' : (complaint.priority === 'High' ? '#fbbf24' : '#818cf8'), 
                                                padding: '0.35rem 0.6rem', 
                                                borderRadius: '6px', 
                                                fontSize: '0.78rem',
                                                fontWeight: 600,
                                                border: complaint.priority === 'Critical' ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid rgba(255, 255, 255, 0.05)'
                                            }}>
                                                Priority: {complaint.priority}
                                            </span>
                                        )}
                                        {complaint.department && (
                                            <span className="metadata-pill" style={{ 
                                                backgroundColor: 'rgba(16, 185, 129, 0.12)', 
                                                color: '#34d399', 
                                                padding: '0.35rem 0.6rem', 
                                                borderRadius: '6px', 
                                                fontSize: '0.78rem', 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                gap: '0.3rem',
                                                border: '1px solid rgba(16, 185, 129, 0.2)'
                                            }}>
                                                <Building size={12}/> {complaint.department}
                                            </span>
                                        )}
                                    </div>

                                    {/* Expandable History Timeline & Admin Panel */}
                                    {isExpanded && (
                                        <div className="expanded-content-panel mt-3 pt-3" style={{ borderTop: '1px dashed var(--border-color)' }}>
                                            <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--primary)' }}>Resolution Timeline</h4>
                                            
                                            <div className="timeline-container" style={{ 
                                                borderLeft: '2px solid rgba(255,255,255,0.06)', 
                                                paddingLeft: '1.5rem', 
                                                marginLeft: '0.75rem', 
                                                position: 'relative' 
                                            }}>
                                                {timelineUpdates.map((update, idx) => (
                                                    <div key={idx} className="timeline-item mb-4" style={{ position: 'relative' }}>
                                                        {/* Circular Icon/Dot on left connector line */}
                                                        <div style={{
                                                            position: 'absolute',
                                                            left: '-31px',
                                                            top: '4px',
                                                            width: '10px',
                                                            height: '10px',
                                                            borderRadius: '50%',
                                                            backgroundColor: update.status === 'Resolved' ? 'var(--secondary)' : (update.status === 'Rejected' ? 'var(--danger)' : 'var(--primary)'),
                                                            border: '3px solid var(--bg-color)',
                                                            boxShadow: update.status === 'Resolved' ? '0 0 8px rgba(16, 185, 129, 0.4)' : '0 0 8px rgba(79, 70, 229, 0.4)'
                                                        }}></div>
                                                        <div className="timeline-content-bubble" style={{
                                                            backgroundColor: 'rgba(255,255,255,0.02)',
                                                            border: '1px solid var(--border-color)',
                                                            borderRadius: '8px',
                                                            padding: '0.75rem 1rem',
                                                            position: 'relative'
                                                        }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                                                                <span className="badge" style={{ 
                                                                    fontSize: '0.7rem', 
                                                                    backgroundColor: update.status === 'Resolved' ? 'rgba(16, 185, 129, 0.15)' : (update.status === 'Rejected' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(79, 70, 229, 0.15)'), 
                                                                    color: update.status === 'Resolved' ? 'var(--secondary)' : (update.status === 'Rejected' ? 'var(--danger)' : 'var(--primary)')
                                                                }}>{update.status}</span>
                                                                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{new Date(update.createdAt).toLocaleString()}</span>
                                                            </div>
                                                            <p style={{ margin: '0.25rem 0', fontSize: '0.82rem', color: 'var(--text-main)', lineHeight: '1.4' }}>{update.message}</p>
                                                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
                                                                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Logged by: <strong>{update.updatedBy}</strong></span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            {user?.role === 'admin' && (
                                                <div className="admin-action-box mt-4 p-3 rounded" style={{ backgroundColor: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)' }}>
                                                    <h4 style={{ fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--secondary)' }}>Log Administrative Progress</h4>
                                                    
                                                    <div className="form-group mb-2">
                                                        <label style={{ fontSize: '0.75rem', marginBottom: '0.15rem', display: 'block', color: 'var(--text-muted)' }}>Update Status</label>
                                                        <select 
                                                            className="form-control" 
                                                            style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem', height: 'auto' }}
                                                            value={statusForm[complaint._id] || complaint.status}
                                                            onChange={(e) => setStatusForm({ ...statusForm, [complaint._id]: e.target.value })}
                                                        >
                                                            <option value="Pending">Pending</option>
                                                            <option value="In Progress">In Progress</option>
                                                            <option value="Resolved">Resolved</option>
                                                            <option value="Rejected">Rejected</option>
                                                        </select>
                                                    </div>

                                                    <div className="form-group mb-2">
                                                        <label style={{ fontSize: '0.75rem', marginBottom: '0.15rem', display: 'block', color: 'var(--text-muted)' }}>Assign Support Staff</label>
                                                        <input 
                                                            type="text" 
                                                            placeholder="e.g. John Doe, Line Inspector" 
                                                            className="form-control" 
                                                            style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem' }}
                                                            value={staffForm[complaint._id] !== undefined ? staffForm[complaint._id] : (complaint.assignedStaff || '')}
                                                            onChange={(e) => setStaffForm({ ...staffForm, [complaint._id]: e.target.value })}
                                                        />
                                                    </div>

                                                    <div className="form-group mb-3">
                                                        <label style={{ fontSize: '0.75rem', marginBottom: '0.15rem', display: 'block', color: 'var(--text-muted)' }}>Status Description / Progress Notes</label>
                                                        <textarea 
                                                            placeholder="Details of inspection, parts ordered, or resolution..." 
                                                            className="form-control" 
                                                            style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem', minHeight: '50px' }}
                                                            value={messageForm[complaint._id] || ''}
                                                            onChange={(e) => setMessageForm({ ...messageForm, [complaint._id]: e.target.value })}
                                                        />
                                                    </div>

                                                    <button 
                                                        className="btn btn-primary" 
                                                        style={{ width: '100%', padding: '0.4rem', fontSize: '0.8rem' }}
                                                        onClick={() => submitAdminUpdate(complaint._id)}
                                                    >
                                                        Post Timeline Update
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div>
                                    {/* Author Profile Footer */}
                                    <div className="card-author-footer flex items-center justify-between mt-3 pt-3" style={{ borderTop: '1px solid var(--border-color)' }}>
                                        <div className="flex items-center gap-2">
                                            <div className="avatar-circle" style={{
                                                width: '28px',
                                                height: '28px',
                                                borderRadius: '50%',
                                                background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                                                color: '#fff',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '0.85rem',
                                                fontWeight: 600
                                            }}>
                                                {complaint.name ? complaint.name[0].toUpperCase() : 'U'}
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)' }}>{complaint.name || 'Anonymous citizen'}</span>
                                                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{complaint.email}</span>
                                            </div>
                                        </div>
                                        {complaint.assignedStaff && (
                                            <div style={{ textAlign: 'right' }}>
                                                <span style={{ fontSize: '0.68rem', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block' }}>Assigned staff</span>
                                                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#34d399', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                                    <Briefcase size={12}/> {complaint.assignedStaff}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex justify-between items-center mt-3 pt-2">
                                        <div className="flex items-center gap-1 text-muted" style={{ fontSize: '0.8rem' }}>
                                            <Clock size={12}/> {new Date(complaint.createdAt).toLocaleDateString()}
                                        </div>
                                        
                                        <button 
                                            className="btn btn-secondary" 
                                            style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem', borderRadius: '6px' }}
                                            onClick={() => setExpandedCardId(isExpanded ? null : complaint._id)}
                                        >
                                            {isExpanded ? (
                                                <>Collapse Details <ChevronUp size={12}/></>
                                            ) : (
                                                <>View History & Timeline <ChevronDown size={12}/></>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default Dashboard;
