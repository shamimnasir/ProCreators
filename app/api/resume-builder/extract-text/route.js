import { NextResponse } from 'next/server'
import { writeFile, unlink, mkdir, readFile } from 'fs/promises'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

// Extract text from PDF using pdftotext (poppler-utils) with fallback to pdf-parse
async function extractFromPDF(filePath) {
  // First try pdftotext (system tool)
  try {
    const { stdout } = await execAsync(`pdftotext -layout "${filePath}" -`)
    if (stdout && stdout.trim().length > 10) {
      return stdout.trim()
    }
  } catch (error) {
    console.log('pdftotext failed, trying pdf-parse fallback:', error.message)
  }
  
  // Fallback to pdf-parse (JavaScript library)
  try {
    const pdfParseModule = await import('pdf-parse/lib/pdf-parse.js')
    const pdfParse = pdfParseModule.default || pdfParseModule
    const dataBuffer = await readFile(filePath)
    const data = await pdfParse(dataBuffer)
    if (data.text && data.text.trim().length > 0) {
      return data.text.trim()
    }
  } catch (error) {
    console.error('pdf-parse fallback also failed:', error.message)
  }
  
  throw new Error('Failed to extract text from PDF. Please try a different PDF or copy-paste the content.')
}

// Extract text from DOCX using a simple approach
async function extractFromDOCX(filePath) {
  try {
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

    const filename = file.name
    const extension = filename.split('.').pop()?.toLowerCase()

    const allowedExtensions = ['pdf', 'doc', 'docx', 'txt']
    if (!allowedExtensions.includes(extension)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid file type. Please upload PDF, DOC, DOCX, or TXT' 
      }, { status: 400 })
    }

    const tempDir = path.join(process.cwd(), 'tmp', 'uploads')
    await mkdir(tempDir, { recursive: true })

    const tempFilename = `${uuidv4()}.${extension}`
    tempFilePath = path.join(tempDir, tempFilename)
    
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(tempFilePath, buffer)

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

    try {
      await unlink(tempFilePath)
    } catch (e) {}

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

    return NextResponse.json({
      success: true,
      text: extractedText,
      filename
    })

  } catch (error) {
    console.error('Text extraction error:', error)
    
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
