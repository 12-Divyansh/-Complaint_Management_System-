import { useState, useEffect, useRef, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { chatWithAICopilot } from '../services/api';
import { 
    MessageSquare, 
    X, 
    Send, 
    Sparkles, 
    Trash2, 
    ChevronDown, 
    Bot,
    User
} from 'lucide-react';

const AICopilot = () => {
    const { user } = useContext(AuthContext);
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [loading, setLoading] = useState(false);
    const [hasNewMessage, setHasNewMessage] = useState(false);

    const messagesEndRef = useRef(null);

    // Initialize with welcome message when user logs in
    useEffect(() => {
        if (user) {
            setMessages([
                {
                    role: 'model',
                    content: `Hello ${user.name}! I am SmartCopilot, your context-aware AI assistant. I have scanned the complaints database. How can I help you today?`,
                    timestamp: new Date()
                }
            ]);
            // Show a brief pulse of the notification badge to grab attention
            setHasNewMessage(true);
        } else {
            setMessages([]);
            setIsOpen(false);
        }
    }, [user]);

    // Scroll to bottom whenever messages list changes
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isOpen]);

    if (!user) return null; // Only show for logged in users

    const handleSendMessage = async (textToSend) => {
        const text = textToSend || inputValue;
        if (!text.trim() || loading) return;

        // Add user message to state
        const userMsg = { role: 'user', content: text, timestamp: new Date() };
        const updatedMessages = [...messages, userMsg];
        setMessages(updatedMessages);
        setInputValue('');
        setLoading(true);

        try {
            // We pass the history to the backend API, mapping the objects to the simplified backend expected format (role, content)
            const apiPayload = updatedMessages.map(msg => ({
                role: msg.role,
                content: msg.content
            }));

            const response = await chatWithAICopilot(apiPayload);
            
            setMessages(prev => [
                ...prev,
                { role: 'model', content: response.reply, timestamp: new Date() }
            ]);
        } catch (error) {
            console.error('Copilot Chat Error:', error);
            setMessages(prev => [
                ...prev,
                { 
                    role: 'model', 
                    content: 'Sorry, I encountered an error retrieving that information. Please check your network or try again.', 
                    timestamp: new Date(),
                    isError: true 
                }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleSuggestionClick = (suggestion) => {
        handleSendMessage(suggestion);
    };

    const handleClearChat = () => {
        if (window.confirm('Clear your chat history?')) {
            setMessages([
                {
                    role: 'model',
                    content: `Chat history cleared. I'm ready for new questions, ${user.name}!`,
                    timestamp: new Date()
                }
            ]);
        }
    };

    const toggleChat = () => {
        setIsOpen(!isOpen);
        setHasNewMessage(false);
    };

    const suggestions = user.role === 'admin' 
        ? [
            "Summarize all complaints",
            "What locations have complaints?",
            "Show critical complaints",
            "Draft a response to the latest pending complaint"
          ]
        : [
            "What is the status of my complaints?",
            "List my high priority issues",
            "Show my latest submitted complaint",
            "Who do I contact about a water supply issue?"
          ];

    return (
        <div className="copilot-widget-container" style={{ zIndex: 1000 }}>
            {/* Floating Action Button */}
            {!isOpen && (
                <button 
                    className={`copilot-floating-btn ${hasNewMessage ? 'pulse-badge' : ''}`}
                    onClick={toggleChat}
                    title="Ask AI Copilot"
                >
                    <Bot size={28} className="copilot-icon" />
                    <Sparkles size={14} className="copilot-sparkle-icon" />
                    {hasNewMessage && <span className="notification-dot"></span>}
                </button>
            )}

            {/* Chat Panel */}
            {isOpen && (
                <div className="copilot-chat-panel glass-card">
                    {/* Header */}
                    <div className="copilot-header flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <div className="copilot-avatar">
                                <Bot size={20} color="var(--primary)" />
                            </div>
                            <div>
                                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600 }}>SmartCopilot</h4>
                                <span style={{ fontSize: '0.7rem', color: 'var(--secondary)', display: 'flex', itemsCenter: 'center', gap: '0.2rem' }}>
                                    <span className="online-indicator"></span> Context Aware AI Active
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button className="icon-btn-minimal" onClick={handleClearChat} title="Reset Chat">
                                <Trash2 size={16} />
                            </button>
                            <button className="icon-btn-minimal" onClick={toggleChat} title="Collapse">
                                <X size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Chat Body Messages */}
                    <div className="copilot-body">
                        <div className="copilot-messages-list">
                            {messages.map((msg, index) => (
                                <div key={index} className={`message-bubble-wrapper ${msg.role === 'user' ? 'user-aligned' : 'assistant-aligned'}`}>
                                    <div className="avatar-mini">
                                        {msg.role === 'user' ? <User size={12} /> : <Bot size={12} />}
                                    </div>
                                    <div className={`message-bubble ${msg.role === 'user' ? 'bubble-user' : 'bubble-assistant'} ${msg.isError ? 'bubble-error' : ''}`}>
                                        <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{msg.content}</p>
                                    </div>
                                </div>
                            ))}
                            {loading && (
                                <div className="message-bubble-wrapper assistant-aligned">
                                    <div className="avatar-mini">
                                        <Bot size={12} />
                                    </div>
                                    <div className="message-bubble bubble-assistant loading-bubble">
                                        <div className="typing-indicator">
                                            <span></span>
                                            <span></span>
                                            <span></span>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                    </div>

                    {/* Suggestion Chips */}
                    {messages.length === 1 && !loading && (
                        <div className="copilot-suggestions-wrapper">
                            <p style={{ margin: '0 0 0.5rem 0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Quick Questions:</p>
                            <div className="copilot-suggestions">
                                {suggestions.map((s, idx) => (
                                    <button 
                                        key={idx} 
                                        className="suggestion-chip"
                                        onClick={() => handleSuggestionClick(s)}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Input Footer */}
                    <form 
                        onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
                        className="copilot-footer flex gap-2"
                    >
                        <input 
                            type="text" 
                            placeholder="Ask me about complaints..." 
                            className="form-control"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            disabled={loading}
                            style={{ fontSize: '0.85rem', padding: '0.5rem 0.75rem' }}
                        />
                        <button type="submit" className="btn" disabled={!inputValue.trim() || loading} style={{ padding: '0.5rem' }}>
                            <Send size={16} />
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
};

export default AICopilot;
