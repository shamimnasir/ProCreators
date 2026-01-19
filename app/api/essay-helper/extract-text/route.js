import { NextResponse } from 'next/server'
import { writeFile, unlink, mkdir } from 'fs/promises'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

// Extract text from PDF using pdftotext (poppler-utils)
async function extractFromPDF(filePath) {
  try {
    const { stdout } = await execAsync(`pdftotext -layout "${filePath}" -`)
    return stdout.trim()
  } catch (error) {
    console.error('PDF extraction error:', error)
    throw new Error('Failed to extract text from PDF')
  }
}

// Extract text from DOCX using a simple approach
async function extractFromDOCX(filePath) {
  try {
    // DOCX is a ZIP file containing XML
    const { stdout } = await execAsync(`unzip -p "${filePath}" word/document.xml 2>/dev/null | sed -e 's/<[^>]*>//g' | tr -s '[:space:]'`)
    return stdout.trim()
  } catch (error) {
    console.error('DOCX extraction error:', error)
    throw new Error('Failed to extract text from DOCX')
  }
}

// Extract text from DOC using antiword or catdoc
async function extractFromDOC(filePath) {
  try {
    // Try antiword first, then catdoc
    try {
      const { stdout } = await execAsync(`antiword "${filePath}" 2>/dev/null`)
      return stdout.trim()
    } catch {
      const { stdout } = await execAsync(`catdoc "${filePath}" 2>/dev/null`)
      return stdout.trim()
    }
  } catch (error) {
    console.error('DOC extraction error:', error)
    throw new Error('Failed to extract text from DOC. Please convert to DOCX or PDF.')
  }
}

// Extract text from TXT
async function extractFromTXT(filePath) {
  const { readFile } = await import('fs/promises')
  const content = await readFile(filePath, 'utf-8')
  return content.trim()
}

export async function POST(request) {
  let tempFilePath = null
  
  try {
    const formData = await request.formData()
    const file = formData.get('file')
    
    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 })
    }

    // Get file details
    const filename = file.name
    const fileType = file.type
    const extension = filename.split('.').pop()?.toLowerCase()

    // Validate file type
    const allowedExtensions = ['pdf', 'doc', 'docx', 'txt']
    if (!allowedExtensions.includes(extension)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid file type. Please upload PDF, DOC, DOCX, or TXT' 
      }, { status: 400 })
    }

    // Create temp directory
    const tempDir = path.join(process.cwd(), 'tmp', 'uploads')
    await mkdir(tempDir, { recursive: true })

    // Save file temporarily
    const tempFilename = `${uuidv4()}.${extension}`
    tempFilePath = path.join(tempDir, tempFilename)
    
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(tempFilePath, buffer)

    // Extract text based on file type
    let extractedText = ''
    
    switch (extension) {
      case 'pdf':
        extractedText = await extractFromPDF(tempFilePath)
        break
      case 'docx':
        extractedText = await extractFromDOCX(tempFilePath)
        break
      case 'doc':
        extractedText = await extractFromDOC(tempFilePath)
        break
      case 'txt':
        extractedText = await extractFromTXT(tempFilePath)
        break
      default:
        throw new Error('Unsupported file type')
    }

    // Clean up temp file
    try {
      await unlink(tempFilePath)
    } catch (e) {}

    // Clean up the extracted text
    extractedText = extractedText
      .replace(/\r\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim()

    if (!extractedText) {
      return NextResponse.json({ 
        success: false, 
        error: 'Could not extract text from file. The file may be empty or corrupted.' 
      }, { status: 400 })
    }

    // Count words
    const wordCount = extractedText.split(/\s+/).filter(w => w).length

    return NextResponse.json({
      success: true,
      text: extractedText,
      wordCount: `${wordCount} words`,
      filename
    })

  } catch (error) {
    console.error('Text extraction error:', error)
    
    // Clean up temp file on error
    if (tempFilePath) {
      try {
        await unlink(tempFilePath)
      } catch (e) {}
    }

    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Failed to extract text from file' 
    }, { status: 500 })
  }
}
