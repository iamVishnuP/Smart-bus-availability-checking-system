import Groq from 'groq-sdk';
import Bus from '../models/Bus.js';
import dotenv from 'dotenv';
import { isFuzzyMatch } from '../utils/fuzzyMatch.js';
import { getBusesBetweenStops } from '../utils/busSearch.js';

dotenv.config();

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

export const handleChat = async (req, res) => {
    try {
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({ message: 'Message is required' });
        }

        // Fetch all buses to provide context to the AI
        const buses = await Bus.find().lean();

        // 1. Extract potential source and destination stops from user query
        let querySource = '';
        let queryDest = '';

        const patterns = [
            /from\s+([a-zA-Z\s]+)\s+to\s+([a-zA-Z\s]+)/i,
            /([a-zA-Z\s]+)\s+to\s+([a-zA-Z\s]+)/i,
            /([a-zA-Z\s]+)\s*(?:->|=>|-)\s*([a-zA-Z\s]+)/i
        ];

        for (const pattern of patterns) {
            const match = message.match(pattern);
            if (match && match[1] && match[2]) {
                querySource = match[1].trim();
                queryDest = match[2].trim();
                break;
            }
        }

        // If the user clearly entered both a source and destination, pre-verify they exist in MongoDB
        if (querySource && queryDest) {
            const routeExists = buses.some(bus => {
                const route = [
                    bus.source,
                    ...bus.stops.map(stop => stop.name),
                    bus.destination
                ];

                const sourceIndex = route.findIndex(stop => isFuzzyMatch(stop, querySource));
                const destIndex = route.findIndex(stop => isFuzzyMatch(stop, queryDest));

                return sourceIndex !== -1 && destIndex !== -1 && sourceIndex < destIndex;
            });

            if (!routeExists) {
                return res.json({ response: "Sorry, we are currently in the developing stage. No buses available." });
            }
        }

        // Prepare a concise version of bus data for the prompt
        const busContext = buses.map(bus => ({
            name: bus.busName,
            type: bus.busType,
            source: bus.source,
            destination: bus.destination,
            sourceTime: bus.sourceTime,
            destinationTime: bus.destinationTime,
            basePrice: bus.price,
            stops: bus.stops.map(s => ({ name: s.name, time: s.time, price: s.ticketPrice }))
        }));

        const systemPrompt = `
You are a Smart Bus Travel Assistant for a bus availability system in Kerala. 
Your goal is to help users find buses, understand routes, and get travel information using natural language.

PERSONALITY:
- Friendly, clear, helpful, conversational, and concise.
- Responses should be short, structured, and easy to read.

CORE CAPABILITIES:
1. Bus Search: Detect source and destination from user query and find matching buses.
2. Bus Details: Show Bus name, type, route, timing, and price.
3. Price Estimation: Calculate price based on the stops.
4. Route Info: List intermediate stops if asked.
5. Suggestions: Recommend the best option.

CONTEXT DATA (Current Buses in Database):
${JSON.stringify(busContext, null, 2)}

GUIDELINES:
- If you can't find a bus, respond politely.
- If the user is vague, ask for clarification.
- Current Time: ${new Date().toLocaleTimeString()}

STRUCTURED SEARCH DATA:
If the user's intent is to find buses between two locations (e.g. "buses from Thrissur to Thriprayar", "next bus to guruvayur", "bus cherpu to thrissur after 5 pm"):
1. Identify the source and destination. Use fuzzy matching to align misspelled locations to context data.
2. Check if a route actually exists in the CONTEXT DATA where BOTH source and destination are on its route, and source occurs before destination.
3. IF NO MATCHING BUSES exist:
   - Your response text MUST be EXACTLY: "Sorry, we are currently in the developing stage. No buses available."
   - You MUST NOT append any JSON block.
4. IF MATCHING BUSES exist:
   - Your response text MUST be EXACTLY: "Here is your response"
   - You MUST append the following JSON block at the very end of your response. Replace placeholders. If they specified a time context (e.g., "after 5pm"), specify "requestedTime" as "17:00" in 24h format, otherwise set it to null.

@@JSON-START@@
{
  "action": "search",
  "source": "detected_source_stop",
  "destination": "detected_destination_stop",
  "requestedTime": "HH:MM or null"
}
@@JSON-END@@
`;

        const chatCompletion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: message }
            ],
            model: 'llama-3.1-8b-instant',
            temperature: 0.2, // Lower temperature to ensure extremely consistent JSON outputs
            max_tokens: 1024,
        });

        let botResponse = chatCompletion.choices[0]?.message?.content || "I'm sorry, I'm having trouble understanding that right now.";

        const jsonStartTag = "@@JSON-START@@";
        const jsonEndTag = "@@JSON-END@@";

        // Intercept search intent and inject verified DB data
        if (botResponse.includes(jsonStartTag) && botResponse.includes(jsonEndTag)) {
            const startIndex = botResponse.indexOf(jsonStartTag);
            const endIndex = botResponse.indexOf(jsonEndTag) + jsonEndTag.length;
            const jsonString = botResponse.slice(startIndex + jsonStartTag.length, botResponse.indexOf(jsonEndTag)).trim();

            try {
                const parsedJSON = JSON.parse(jsonString);
                if (parsedJSON.action === 'search' && parsedJSON.source && parsedJSON.destination) {
                    // Call the robust unified search utility
                    const matchingBuses = await getBusesBetweenStops(parsedJSON.source, parsedJSON.destination, parsedJSON.requestedTime || null);

                    if (matchingBuses.length === 0) {
                        botResponse = "Sorry, we are currently in the developing stage. No buses available.";
                    } else {
                        // Reconstruct JSON with exact database records to eliminate all hallucinations
                        const verifiedJSON = {
                            action: "search",
                            source: parsedJSON.source,
                            destination: parsedJSON.destination,
                            buses: matchingBuses
                        };
                        botResponse = "Here is your response\n\n" + jsonStartTag + "\n" + JSON.stringify(verifiedJSON, null, 2) + "\n" + jsonEndTag;
                    }
                }
            } catch (err) {
                console.error("Post-verification JSON parsing error:", err);
            }
        } else {
            // Check if the AI responded with a developing message because no buses were found
            const normResp = botResponse.trim().toLowerCase();
            if (normResp.includes("no buses") || normResp.includes("developing stage") || normResp.includes("sorry")) {
                botResponse = "Sorry, we are currently in the developing stage. No buses available.";
            }
        }

        res.json({ response: botResponse });
    } catch (error) {
        console.error('Chat Error:', error);
        res.status(500).json({ message: 'AI Assistant is currently unavailable', error: error.message });
    }
};
