import { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ShieldCheck, LogOut } from 'lucide-react';

const Navbar = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    const onLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="navbar">
            <div className="container flex justify-between items-center">
                <Link to="/" className="navbar-brand">
                    <ShieldCheck size={28} color="var(--primary)" />
                    SmartComplaints
                </Link>
                <div className="navbar-nav">
                    {user ? (
                        <>
                            <span className="nav-link">Welcome, {user.name}</span>
                            {user.role === 'admin' && <span className="badge badge-resolved">Admin</span>}
                            <Link to="/" className="nav-link">Dashboard</Link>
                            <Link to="/new" className="btn btn-secondary" style={{ padding: '0.4rem 1rem' }}>+ New Complaint</Link>
                            <button className="btn" onClick={onLogout} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 1rem' }}>
                                <LogOut size={16} /> Logout
                            </button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="nav-link">Login</Link>
                            <Link to="/register" className="btn">Register</Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
