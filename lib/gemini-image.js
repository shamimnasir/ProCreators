import { spawn } from 'child_process'
import path from 'path'

export async function generateImage(prompt, model = "gemini-3-pro-image-preview", quality = "standard", size = "1024x1024") {
  return new Promise((resolve) => {
    try {
      // Use Gemini 3 Pro Image Preview if Google API key is available, otherwise use DALL-E 3
      const useGemini = process.env.GOOGLE_API_KEY && process.env.GOOGLE_API_KEY.length > 0
      const scriptPath = path.join(process.cwd(), 'scripts', useGemini ? 'generate_image_nano_banana.py' : 'generate_image.py')
      
      const inputData = JSON.stringify({
        prompt,
        model: useGemini ? 'gemini-3-pro-image-preview' : model,
        quality,
        size
      })
      
      const pythonProcess = spawn('/root/.venv/bin/python3', [scriptPath, inputData], {
        env: { ...process.env }
      })
      
      let stdout = ''
      let stderr = ''
      
      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString()
      })
      
      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString()
      })
      
      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          console.error('Python script error:', stderr)
          resolve({
            success: false,
            imageUrl: null,
            error: stderr || 'Failed to generate image'
          })
          return
        }
        
        try {
          const result = JSON.parse(stdout)
          resolve(result)
        } catch (error) {
          console.error('Error parsing Python response:', error)
          resolve({
            success: false,
            imageUrl: null,
            error: 'Failed to parse response'
          })
        }
      })
      
      pythonProcess.on('error', (error) => {
        console.error('Error spawning Python process:', error)
        resolve({
          success: false,
          imageUrl: null,
          error: error.message || 'Failed to generate image'
        })
      })
    } catch (error) {
      console.error("Error generating image with Gemini:", error)
      resolve({
        success: false,
        imageUrl: null,
        error: error.message || "Failed to generate image"
      })
    }
  })
}
