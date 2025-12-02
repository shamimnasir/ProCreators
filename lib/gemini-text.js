import { LlmChat, UserMessage } from 'emergentintegrations/llm/chat'
import { v4 as uuidv4 } from 'uuid'

const apiKey = process.env.EMERGENT_LLM_KEY

export async function generateText(prompt, systemMessage = "You are a helpful AI assistant specialized in creating engaging content.", sessionId = null) {
  try {
    const chatSessionId = sessionId || uuidv4()
    
    const chat = new LlmChat({
      api_key: apiKey,
      session_id: chatSessionId,
      system_message: systemMessage
    }).with_model("gemini", "gemini-2.0-flash")
    
    const userMessage = new UserMessage({
      text: prompt
    })
    
    const response = await chat.send_message(userMessage)
    
    return {
      success: true,
      content: response,
      sessionId: chatSessionId,
      error: null
    }
  } catch (error) {
    console.error("Error generating text with Gemini:", error)
    return {
      success: false,
      content: null,
      error: error.message || "Failed to generate text"
    }
  }
}
