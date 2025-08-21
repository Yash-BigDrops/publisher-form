import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { getFilePath } from '@/lib/fileStorage'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const fileId = searchParams.get('fileId')
    const fileUrl = searchParams.get('fileUrl')
    
    console.log('API: Received request for fileId:', fileId, 'fileUrl:', fileUrl)
    
    if (!fileId && !fileUrl) {
      return NextResponse.json(
        { error: 'File ID or File URL is required' },
        { status: 400 }
      )
    }

    // First, try to fetch from the provided file URL if available
    if (fileUrl) {
      try {
        console.log('API: Fetching content from URL:', fileUrl)
        
        // Decode the URL in case it's encoded
        const decodedUrl = decodeURIComponent(fileUrl)
        console.log('API: Decoded URL:', decodedUrl)
        
        const response = await fetch(decodedUrl)
        
        if (response.ok) {
          const content = await response.text()
          console.log('API: Successfully fetched content, length:', content.length)
          
          return new NextResponse(content, {
            status: 200,
            headers: {
              'Content-Type': 'text/html; charset=utf-8',
              'Cache-Control': 'no-cache',
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'GET',
              'Access-Control-Allow-Headers': 'Content-Type',
            },
          })
        } else {
          console.log('API: Failed to fetch from URL, status:', response.status)
        }
      } catch (error) {
        console.error('API: Error fetching from URL:', error)
      }
    }

    // Try to find the file using the file storage system
    if (fileId) {
      try {
        // Parse the fileUrl to get the filename if available
        let fileName = 'unknown.html'
        if (fileUrl) {
          const url = new URL(decodeURIComponent(fileUrl), 'http://localhost')
          const nameParam = url.searchParams.get('name')
          if (nameParam) {
            fileName = nameParam
          }
        }
        
        console.log('API: Using file storage system with fileId:', fileId, 'fileName:', fileName)
        
        // Use the file storage system to get the file path
        const filePath = await getFilePath(fileId, fileName)
        console.log('API: File path from storage system:', filePath)
        
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf-8')
          console.log('API: Successfully read file from storage, length:', content.length)
          
          return new NextResponse(content, {
            status: 200,
            headers: {
              'Content-Type': 'text/html; charset=utf-8',
              'Cache-Control': 'no-cache',
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'GET',
              'Access-Control-Allow-Headers': 'Content-Type',
            },
          })
        } else {
          console.log('API: File does not exist at path:', filePath)
        }
      } catch (error) {
        console.error('API: Error using file storage system:', error)
      }
    }

    // If no actual file found, return an error instead of sample content
    console.log('API: No HTML file found, returning error')
    return NextResponse.json(
      { error: 'HTML file not found. Please ensure the file was uploaded correctly.' },
      { status: 404 }
    )

  } catch (error) {
    console.error('API: Error serving file content:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
