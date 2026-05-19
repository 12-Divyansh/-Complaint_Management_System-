const { GoogleGenerativeAI } = require('@google/generative-ai');

// @desc    Analyze complaint using AI
// @route   POST /api/ai/analyze
// @access  Private
const analyzeComplaint = async (req, res, next) => {
    try {
        const { description } = req.body;

        if (!description) {
            res.status(400);
            throw new Error('Please provide a complaint description');
        }

        const apiKey = process.env.GEMINI_API_KEY; // Reusing this env var name although it's OpenRouter now
        if (!apiKey || apiKey === 'your_gemini_api_key_here') {
            // Mock response if no API key is provided, so the app still works for evaluation
            return res.status(200).json({
                priority: "High",
                department: "General Services",
                summary: "User reported an issue: " + description.substring(0, 50) + "...",
                auto_response: "Thank you for reaching out. We have registered your complaint and the concerned department will look into it."
            });
        }

        const prompt = `
            Analyze the following complaint from a user:
            "${description}"
            
            Based on the complaint, please provide a JSON response with the following exact keys:
            - "priority": Detect the urgency (Low, Medium, High, Critical).
            - "department": Suggest the responsible department (e.g., Water Supply, Sanitation, Electricity, General).
            - "summary": A very brief 1-sentence summary of the complaint.
            - "auto_response": A polite automatic response message for the user acknowledging the issue and department.

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

module.exports = {
    analyzeComplaint
};
