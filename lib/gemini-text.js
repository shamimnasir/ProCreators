import { spawn } from 'child_process'
import { v4 as uuidv4 } from 'uuid'
import path from 'path'

export async function generateText(prompt, systemMessage = "You are a helpful AI assistant specialized in creating engaging content.", sessionId = null) {
  return new Promise((resolve) => {
    try {
      const chatSessionId = sessionId || uuidv4()
      const scriptPath = path.join(process.cwd(), 'scripts', 'generate_text.py')
      
      const inputData = JSON.stringify({
        prompt,
        systemMessage,
        sessionId: chatSessionId
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
            content: null,
            error: stderr || 'Failed to generate text'
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
            content: null,
            error: 'Failed to parse response'
          })
        }
      })
      
      pythonProcess.on('error', (error) => {
        console.error('Error spawning Python process:', error)
        resolve({
          success: false,
          content: null,
          error: error.message || 'Failed to generate text'
        })
      })
    } catch (error) {
      console.error("Error generating text with Gemini:", error)
      resolve({
        success: false,
        content: null,
        error: error.message || "Failed to generate text"
      })
    }
  })
}
