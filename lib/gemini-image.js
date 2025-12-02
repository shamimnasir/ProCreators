import { LlmImagePrompting } from 'emergentintegrations/llm/image'

const apiKey = process.env.EMERGENT_LLM_KEY

export async function generateImage(prompt) {
  try {
    const imageGen = new LlmImagePrompting({
      api_key: apiKey
    }).with_model("gemini", "imagen-3.0-generate-002")
    
    const result = await imageGen.generate_image(prompt)
    
    return {
      success: true,
      imageUrl: result,
      error: null
    }
  } catch (error) {
    console.error("Error generating image with Gemini:", error)
    return {
      success: false,
      imageUrl: null,
      error: error.message || "Failed to generate image"
    }
  }
}
