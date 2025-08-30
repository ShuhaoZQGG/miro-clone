import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

export async function GET() {
  // Only in development mode
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 404 })
  }

  try {
    const dashboardFile = path.join(process.cwd(), '.test-dashboard.json')
    const data = await fs.readFile(dashboardFile, 'utf-8')
    return NextResponse.json(JSON.parse(data))
  } catch (error) {
    // Return empty results if file doesn't exist
    return NextResponse.json({
      passed: 0,
      failed: 0,
      running: 0,
      failures: []
    })
  }
}