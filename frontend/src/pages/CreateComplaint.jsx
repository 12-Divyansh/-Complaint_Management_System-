import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addComplaint, analyzeComplaintText } from '../services/api';
import { Sparkles } from 'lucide-react';

const CreateComplaint = () => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: '',
        location: ''
    });
    const [aiData, setAiData] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const navigate = useNavigate();

    const { title, description, category, location } = formData;

    const onChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleAnalyze = async () => {
        if (!description) {
            setError('Please enter a description to analyze');
            return;
        }
        setError('');
        setIsAnalyzing(true);
        try {
            const result = await analyzeComplaintText(description);
            setAiData(result);
        } catch (err) {
            setError('AI Analysis failed. You can still submit manually.');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const submissionData = { ...formData };
            if (aiData) {
                submissionData.priority = aiData.priority;
                submissionData.department = aiData.department;
                submissionData.summary = aiData.summary;
            }
            await addComplaint(submissionData);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to submit complaint');
            setIsSubmitting(false);
        }
    };

    return (
        <div className="container mt-4 mb-4" style={{ maxWidth: '800px' }}>
            <h2 className="mb-4">Register New Complaint</h2>
            
            <div className="card">
                {error && <div className="badge badge-rejected mb-3" style={{ display: 'block', textAlign: 'center' }}>{error}</div>}
                
                <form onSubmit={onSubmit}>
                    <div className="form-group">
                        <label>Complaint Title</label>
                        <input type="text" name="title" value={title} onChange={onChange} className="form-control" required placeholder="e.g. Broken pipe in main street" />
                    </div>

                    <div className="form-group">
                        <label>Location</label>
                        <input type="text" name="location" value={location} onChange={onChange} className="form-control" required placeholder="e.g. Sector 18, Ghaziabad" />
                    </div>

                    <div className="form-group">
                        <label>Category</label>
                        <select name="category" value={category} onChange={onChange} className="form-control" required>
                            <option value="">Select Category</option>
                            <option value="Water Supply">Water Supply</option>
                            <option value="Electricity">Electricity</option>
                            <option value="Sanitation">Sanitation</option>
                            <option value="Roads">Roads</option>
                            <option value="General">General</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Detailed Description</label>
                        <textarea name="description" value={description} onChange={onChange} className="form-control" required placeholder="Describe the issue in detail..."></textarea>
                    </div>

                    <div className="flex gap-4 mb-4">
                        <button type="button" className="btn btn-secondary flex items-center gap-2" onClick={handleAnalyze} disabled={isAnalyzing}>
                            {isAnalyzing ? <div className="spinner" style={{width: '16px', height: '16px', borderWidth: '2px'}}></div> : <Sparkles size={18} color="var(--primary)" />}
                            Analyze with AI
                        </button>
                    </div>

                    {aiData && (
                        <div className="ai-suggestion-box mb-4">
                            <h4 className="flex items-center gap-2 mb-2" style={{ color: 'var(--primary)', margin: 0 }}><Sparkles size={16}/> AI Insights</h4>
                            <p style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}><strong>Suggested Priority:</strong> <span className="badge badge-pending">{aiData.priority}</span></p>
                            <p style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}><strong>Department:</strong> {aiData.department}</p>
                            <p style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}><strong>Summary:</strong> <span className="text-muted">{aiData.summary}</span></p>
                            <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '6px', fontSize: '0.85rem', fontStyle: 'italic' }}>
                                <strong>Auto-Response Draft:</strong> "{aiData.auto_response}"
                            </div>
                        </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button type="submit" className="btn" disabled={isSubmitting}>
                            {isSubmitting ? 'Submitting...' : 'Submit Complaint'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateComplaint;
