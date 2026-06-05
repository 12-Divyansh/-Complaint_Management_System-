const { GoogleGenerativeAI } = require('@google/generative-ai');
const Complaint = require('../models/Complaint');

// @desc    Analyze complaint using AI
// @route   POST /api/ai/analyze
// @access  Private
const analyzeComplaint = async (req, res, next) => {
    try {
        const { title, description, category, location } = req.body;

        if (!description) {
            res.status(400);
            throw new Error('Please provide a complaint description');
        }

        // Fetch recent active complaints in the same category to check for duplicates
        let query = { status: { $in: ['Pending', 'In Progress'] } };
        if (category) {
            query.category = category;
        }
        const existingComplaints = await Complaint.find(query).limit(10);

        let duplicatesContext = '';
        if (existingComplaints.length > 0) {
            duplicatesContext = existingComplaints.map(c => 
                `ID: ${c._id}\nTitle: ${c.title}\nDescription: ${c.description}\nLocation: ${c.location}\n`
            ).join('\n---\n');
        }

        const apiKey = process.env.GEMINI_API_KEY; // Reusing this env var name although it's OpenRouter now
        if (!apiKey || apiKey === 'your_gemini_api_key_here') {
            // Mock response if no API key is provided, so the app still works for evaluation
            const isMockDuplicate = description.toLowerCase().includes('duplicate') || description.toLowerCase().includes('leak');
            return res.status(200).json({
                priority: "High",
                department: "General Services",
                summary: "User reported an issue: " + description.substring(0, 50) + "...",
                auto_response: "Thank you for reaching out. We have registered your complaint and the concerned department will look into it.",
                is_duplicate: isMockDuplicate,
                duplicate_complaint_id: isMockDuplicate && existingComplaints.length > 0 ? existingComplaints[0]._id : (isMockDuplicate ? "mock_id_123" : null),
                duplicate_reason: isMockDuplicate ? "A similar water leak in Sector 18 was reported earlier today." : null
            });
        }

        const prompt = `
            Analyze the following complaint from a user:
            Title: "${title || ''}"
            Description: "${description}"
            Location: "${location || ''}"
            Category: "${category || ''}"

            Below are existing open complaints in our database for this category:
            ${duplicatesContext || 'None'}

            Based on this information, please provide a JSON response with the following exact keys:
            - "priority": Detect the urgency (Low, Medium, High, Critical).
            - "department": Suggest the responsible department (e.g., Water Supply, Sanitation, Electricity, General).
            - "summary": A very brief 1-sentence summary of the complaint.
            - "auto_response": A polite automatic response message for the user acknowledging the issue.
            - "is_duplicate": Boolean indicating if this complaint is a duplicate or highly similar to any of the existing open complaints listed above (same issue, same general location/address).
            - "duplicate_complaint_id": The ID of the duplicate complaint, or null if not a duplicate.
            - "duplicate_reason": A short 1-sentence explanation of why it is a duplicate (e.g., "A water leak at the same location was reported 2 hours ago"), or null if not a duplicate.

            Return ONLY valid JSON. Do not include markdown code blocks.
        `;

        let resultText = '';
        
        // Check if it's an OpenRouter key or Gemini key
        if (apiKey.startsWith('sk-or-')) {
            const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    "model": "google/gemini-2.5-flash",
                    "messages": [
                        {"role": "user", "content": prompt}
                    ]
                })
            });
            const data = await response.json();
            if (data.error) {
                throw new Error("OpenRouter Error: " + data.error.message);
            }
            resultText = data.choices[0].message.content;
        } else {
            // Assume it's a Gemini Key
            const { GoogleGenerativeAI } = require('@google/generative-ai');
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const result = await model.generateContent(prompt);
            resultText = result.response.text();
        }
        
        // Clean up markdown formatting if any
        let cleanJson = resultText.replace(/```json/gi, '').replace(/```/g, '').trim();
        
        try {
            const parsedData = JSON.parse(cleanJson);
            res.status(200).json(parsedData);
        } catch (e) {
            console.error("Failed to parse AI response", cleanJson);
            res.status(500);
            throw new Error('Failed to parse AI response');
        }
        
    } catch (error) {
        next(error);
    }
};

// @desc    Chat with AI Copilot using active complaint context
// @route   POST /api/ai/chat
// @access  Private
const chatWithAI = async (req, res, next) => {
    try {
        const { messages } = req.body;

        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            res.status(400);
            throw new Error('Please provide chat history/messages');
        }

        // Get user context
        const user = req.user;
        let query = {};

        // Fetch complaints to build context
        const complaints = await Complaint.find(query).sort({ createdAt: -1 }).limit(50);

        // Format complaints for context
        let complaintsContext = '';
        if (complaints.length === 0) {
            complaintsContext = 'No complaints are currently registered in the system under this user scope.';
        } else {
            complaintsContext = complaints.map((c, i) => 
                `Complaint #${i + 1}:\n` +
                `- Title: ${c.title}\n` +
                `- Description: ${c.description}\n` +
                `- Category: ${c.category}\n` +
                `- Location: ${c.location}\n` +
                `- Status: ${c.status}\n` +
                `- Priority: ${c.priority || 'Medium'}\n` +
                `- Department: ${c.department || 'General'}\n` +
                `- Date Submitted: ${new Date(c.createdAt).toLocaleDateString()}\n`
            ).join('\n');
        }

        const systemPrompt = `You are "SmartCopilot", an intelligent assistant for the AI-Based Smart Complaint Management System.
You are chatting with a user. Here is their profile:
- Name: ${user.name}
- Email: ${user.email}
- Role: ${user.role}

Below is the real-time context of active complaints in the system that this user has permission to see:
==================================================
${complaintsContext}
==================================================

Guidelines:
1. Provide highly direct, concise, and helpful answers. Keep responses under 3-4 sentences when possible.
2. If the user asks about the status of a specific complaint, search the list above and tell them (e.g. "Your complaint about 'Broken pipe' is currently In Progress").
3. If an admin asks for suggestions to resolve a complaint, give them 2-3 quick action items.
4. Always remain polite, professional, and empathetic to the citizen's complaints.
`;

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey || apiKey === 'your_gemini_api_key_here' || apiKey === 'your_gemini_api_key') {
            // Mock Response for chat
            const lastUserMessage = messages[messages.length - 1].content;
            let mockResponse = `Hello ${user.name}! I am your SmartCopilot (Mock Mode). `;
            
            if (lastUserMessage.toLowerCase().includes('status') || lastUserMessage.toLowerCase().includes('latest') || lastUserMessage.toLowerCase().includes('complaint')) {
                if (complaints.length > 0) {
                    mockResponse += `You have ${complaints.length} complaint(s) in the system. The latest one is "${complaints[0].title}" which is currently "${complaints[0].status}".`;
                } else {
                    mockResponse += `You do not have any complaints registered in the system yet. You can submit one by clicking '+ New Complaint'.`;
                }
            } else if (lastUserMessage.toLowerCase().includes('admin') || user.role === 'admin') {
                mockResponse += `As an administrator, you have access to view and manage all ${complaints.length} complaints. Let me know if you want me to search by location or category.`;
            } else {
                mockResponse += `I am active and ready. Let me know if you have questions about your registered complaints, their priority, or their assigned departments.`;
            }

            return res.status(200).json({ reply: mockResponse });
        }

        let resultText = '';

        if (apiKey.startsWith('sk-or-')) {
            // OpenRouter API
            const apiMessages = [
                { role: 'system', content: systemPrompt },
                ...messages.map(msg => ({
                    role: msg.role === 'model' || msg.role === 'assistant' ? 'assistant' : 'user',
                    content: msg.content
                }))
            ];

            const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    "model": "google/gemini-2.5-flash",
                    "messages": apiMessages
                })
            });
            const data = await response.json();
            if (data.error) {
                throw new Error("OpenRouter Error: " + data.error.message);
            }
            resultText = data.choices[0].message.content;
        } else {
            // Gemini direct SDK
            const { GoogleGenerativeAI } = require('@google/generative-ai');
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ 
                model: "gemini-1.5-flash",
                systemInstruction: systemPrompt
            });

            const contents = messages.map(msg => ({
                role: msg.role === 'model' || msg.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: msg.content }]
            }));

            const result = await model.generateContent({ contents });
            resultText = result.response.text();
        }

        res.status(200).json({ reply: resultText });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    analyzeComplaint,
    chatWithAI
};
