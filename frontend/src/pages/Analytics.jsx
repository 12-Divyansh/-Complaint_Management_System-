import { useState, useEffect, useContext } from 'react';
import { getComplaintStats } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { 
    BarChart2, 
    AlertCircle, 
    CheckCircle2, 
    Clock, 
    TrendingUp, 
    Folder, 
    ShieldCheck, 
    AlertTriangle,
    Inbox
} from 'lucide-react';

const Analytics = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [hoveredSlice, setHoveredSlice] = useState(null);
    const { user } = useContext(AuthContext);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoading(true);
                const data = await getComplaintStats();
                setStats(data);
            } catch (err) {
                console.error(err);
                setError('Failed to load analytics statistics');
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="container flex justify-center items-center py-5" style={{ minHeight: '60vh' }}>
                <div className="spinner" style={{ width: '48px', height: '48px', borderWidth: '4px' }}></div>
            </div>
        );
    }

    if (error || !stats) {
        return (
            <div className="container mt-4" style={{ maxWidth: '800px' }}>
                <div className="card text-center py-5">
                    <AlertTriangle size={48} color="var(--danger)" className="mb-2" />
                    <h3>Error Loading Analytics</h3>
                    <p className="text-muted">{error || 'Something went wrong'}</p>
                </div>
            </div>
        );
    }

    const { totalCount, statusCounts, categoryCounts, priorityCounts } = stats;

    // Donut Chart Math
    const totalStatus = Object.values(statusCounts).reduce((a, b) => a + b, 0);
    const radius = 50;
    const circ = 2 * Math.PI * radius; // ~314.16
    let cumulativeOffset = 0;

    const colors = {
        'Pending': '#F59E0B',      // var(--warning)
        'In Progress': '#4F46E5',  // var(--primary)
        'Resolved': '#10B981',     // var(--secondary)
        'Rejected': '#EF4444'      // var(--danger)
    };

    const statusSegments = Object.entries(statusCounts).map(([status, count]) => {
        const pct = totalStatus > 0 ? count / totalStatus : 0;
        const strokeDash = pct * circ;
        const strokeOffset = cumulativeOffset;
        cumulativeOffset -= strokeDash;
        return {
            status,
            count,
            pct: Math.round(pct * 100),
            dashArray: `${strokeDash} ${circ - strokeDash}`,
            dashOffset: strokeOffset,
            color: colors[status] || 'var(--text-muted)'
        };
    });

    // Category Bar Chart Calculations
    const maxCategory = Math.max(...Object.values(categoryCounts), 1);

    // Priority Calculations
    const priorityColors = {
        'Critical': 'rgba(239, 68, 68, 0.9)',
        'High': 'rgba(245, 158, 11, 0.9)',
        'Medium': 'rgba(79, 70, 229, 0.9)',
        'Low': 'rgba(16, 185, 129, 0.9)'
    };

    return (
        <div className="container mt-4 mb-5">
            {/* Header */}
            <div className="flex justify-between items-center mb-4" style={{ flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <BarChart2 size={28} color="var(--primary)" />
                        Analytics Overview
                    </h2>
                    <p className="text-muted" style={{ fontSize: '0.9rem', marginTop: '0.25rem' }}>
                        {user?.role === 'admin' 
                            ? 'System-wide statistics and complaint performance monitoring' 
                            : 'Personalized tracking and status diagnostics for your complaints'}
                    </p>
                </div>
                {user?.role === 'admin' && (
                    <div className="badge badge-resolved" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.5rem 1rem' }}>
                        <ShieldCheck size={14} /> System Administrator Mode
                    </div>
                )}
            </div>

            {/* Metric KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 mb-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
                <div className="card glass-card card-kpi" style={{ borderLeft: '4px solid var(--primary)' }}>
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-muted" style={{ fontWeight: 500 }}>Total Complaints</span>
                        <Inbox size={20} color="var(--primary)" />
                    </div>
                    <h2>{totalCount}</h2>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Registered complaints</span>
                </div>

                <div className="card glass-card card-kpi" style={{ borderLeft: '4px solid var(--warning)' }}>
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-muted" style={{ fontWeight: 500 }}>Pending</span>
                        <Clock size={20} color="var(--warning)" />
                    </div>
                    <h2>{statusCounts.Pending || 0}</h2>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Awaiting review</span>
                </div>

                <div className="card glass-card card-kpi" style={{ borderLeft: '4px solid var(--secondary)' }}>
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-muted" style={{ fontWeight: 500 }}>Resolved</span>
                        <CheckCircle2 size={20} color="var(--secondary)" />
                    </div>
                    <h2>{statusCounts.Resolved || 0}</h2>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Successfully resolved</span>
                </div>

                <div className="card glass-card card-kpi" style={{ borderLeft: '4px solid var(--danger)' }}>
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-muted" style={{ fontWeight: 500 }}>In Progress / Rejected</span>
                        <AlertCircle size={20} color="var(--danger)" />
                    </div>
                    <h2>{(statusCounts['In Progress'] || 0) + (statusCounts.Rejected || 0)}</h2>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Active action required</span>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 md:grid-cols-2">
                {/* Donut Status Chart */}
                <div className="card glass-card flex flex-col items-center justify-between" style={{ padding: '2rem' }}>
                    <h3 style={{ alignSelf: 'flex-start', margin: '0 0 1.5rem 0' }}>Complaint Status Breakdown</h3>
                    
                    {totalStatus === 0 ? (
                        <div className="text-center py-5 text-muted">No data available</div>
                    ) : (
                        <div className="flex items-center justify-center gap-4" style={{ flexWrap: 'wrap', width: '100%' }}>
                            {/* SVG Donut */}
                            <div style={{ position: 'relative', width: '180px', height: '180px' }}>
                                <svg width="100%" height="100%" viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)' }}>
                                    <circle cx="60" cy="60" r={radius} fill="transparent" stroke="var(--border-color)" strokeWidth="10" />
                                    {statusSegments.map((seg, idx) => (
                                        <circle 
                                            key={idx}
                                            cx="60" 
                                            cy="60" 
                                            r={radius} 
                                            fill="transparent" 
                                            stroke={seg.color} 
                                            strokeWidth={hoveredSlice === seg.status ? "14" : "10"}
                                            strokeDasharray={seg.dashArray}
                                            strokeDashoffset={seg.dashOffset}
                                            strokeLinecap="round"
                                            style={{ 
                                                transition: 'stroke-width 0.3s ease, stroke 0.3s ease',
                                                cursor: 'pointer' 
                                            }}
                                            onMouseEnter={() => setHoveredSlice(seg.status)}
                                            onMouseLeave={() => setHoveredSlice(null)}
                                        />
                                    ))}
                                </svg>
                                <div style={{
                                    position: 'absolute',
                                    top: '50%',
                                    left: '50%',
                                    transform: 'translate(-50%, -50%)',
                                    textAlign: 'center',
                                    pointerEvents: 'none'
                                }}>
                                    {hoveredSlice ? (
                                        <>
                                            <h2 style={{ margin: 0, color: colors[hoveredSlice] }}>
                                                {statusCounts[hoveredSlice]}
                                            </h2>
                                            <p style={{ margin: 0, fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                                                {hoveredSlice}
                                            </p>
                                        </>
                                    ) : (
                                        <>
                                            <h2 style={{ margin: 0 }}>{totalStatus}</h2>
                                            <p style={{ margin: 0, fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Total</p>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Legend */}
                            <div className="flex flex-col gap-2" style={{ flex: 1, minWidth: '150px' }}>
                                {statusSegments.map((seg, idx) => (
                                    <div 
                                        key={idx} 
                                        className="flex items-center justify-between p-2 rounded" 
                                        style={{ 
                                            cursor: 'pointer',
                                            backgroundColor: hoveredSlice === seg.status ? 'rgba(255,255,255,0.05)' : 'transparent',
                                            transition: 'background-color 0.2s ease',
                                            borderLeft: `3px solid ${seg.color}`
                                        }}
                                        onMouseEnter={() => setHoveredSlice(seg.status)}
                                        onMouseLeave={() => setHoveredSlice(null)}
                                    >
                                        <span style={{ fontSize: '0.85rem', fontWeight: 500, paddingLeft: '0.5rem' }}>{seg.status}</span>
                                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                            <strong>{seg.count}</strong> ({seg.pct}%)
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Categories Bar Chart */}
                <div className="card glass-card" style={{ padding: '2rem' }}>
                    <h3 style={{ margin: '0 0 1.5rem 0' }}>Complaints by Category</h3>
                    <div className="flex flex-col gap-4">
                        {Object.entries(categoryCounts).map(([cat, count], idx) => {
                            const percent = Math.round((count / maxCategory) * 100);
                            return (
                                <div key={idx} className="flex flex-col gap-1">
                                    <div className="flex justify-between items-center" style={{ fontSize: '0.85rem' }}>
                                        <span style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                            <Folder size={14} color="var(--primary)" />
                                            {cat}
                                        </span>
                                        <span style={{ color: 'var(--text-muted)' }}>
                                            <strong>{count}</strong> complaint{count !== 1 ? 's' : ''}
                                        </span>
                                    </div>
                                    <div style={{
                                        width: '100%',
                                        height: '10px',
                                        backgroundColor: 'var(--border-color)',
                                        borderRadius: '9999px',
                                        overflow: 'hidden'
                                    }}>
                                        <div style={{
                                            width: `${percent}%`,
                                            height: '100%',
                                            background: 'linear-gradient(90deg, var(--primary), var(--secondary))',
                                            borderRadius: '9999px',
                                            transition: 'width 0.8s cubic-bezier(0.1, 1, 0.1, 1)'
                                        }}></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Priorities Section */}
            <div className="card glass-card mt-4" style={{ padding: '2rem' }}>
                <h3 style={{ margin: '0 0 1.5rem 0' }}>Urgency & Priority Distribution</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {Object.entries(priorityCounts).map(([priority, count]) => {
                        const pctOfTotal = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;
                        const badgeColor = priorityColors[priority] || 'var(--text-muted)';
                        return (
                            <div key={priority} className="p-3 rounded-lg" style={{ 
                                backgroundColor: 'rgba(255,255,255,0.02)', 
                                border: '1px solid var(--border-color)',
                                borderRadius: '8px'
                            }}>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="badge" style={{ backgroundColor: badgeColor, color: '#0F172A', fontWeight: 700 }}>
                                        {priority}
                                    </span>
                                    <TrendingUp size={16} color="var(--text-muted)" />
                                </div>
                                <h2 style={{ margin: 0 }}>{count}</h2>
                                <div className="flex items-center justify-between mt-2" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                    <span>Frequency</span>
                                    <strong>{pctOfTotal}% of total</strong>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default Analytics;
