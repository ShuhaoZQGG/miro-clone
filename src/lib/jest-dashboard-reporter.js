// Jest reporter that sends test results to TestDashboard component
class DashboardReporter {
  constructor(globalConfig, options) {
    this._globalConfig = globalConfig
    this._options = options
    this.testResults = {
      passed: 0,
      failed: 0,
      running: 0,
      failures: []
    }
  }

  onRunStart() {
    this.testResults = {
      passed: 0,
      failed: 0,
      running: 0,
      failures: []
    }
    this.sendUpdate()
  }

  onTestStart() {
    this.testResults.running++
    this.sendUpdate()
  }

  onTestResult(test, testResult) {
    this.testResults.running--
    
    testResult.testResults.forEach((result) => {
      if (result.status === 'passed') {
        this.testResults.passed++
      } else if (result.status === 'failed') {
        this.testResults.failed++
        
        // Add failure details
        const failure = {
          file: testResult.testFilePath.replace(process.cwd(), ''),
          title: result.title,
          message: result.failureMessages ? result.failureMessages[0] : 'Test failed'
        }
        
        // Limit to first 10 failures for dashboard
        if (this.testResults.failures.length < 10) {
          this.testResults.failures.push(failure)
        }
      }
    })
    
    this.sendUpdate()
  }

  onRunComplete() {
    this.testResults.running = 0
    this.sendUpdate()
    
    // Output summary for dashboard
    if (process.env.JEST_DASHBOARD) {
      console.log('\n=== Test Dashboard Summary ===')
      console.log(`Passed: ${this.testResults.passed}`)
      console.log(`Failed: ${this.testResults.failed}`)
      
      if (this.testResults.failures.length > 0) {
        console.log('\nFirst failures:')
        this.testResults.failures.slice(0, 5).forEach(failure => {
          console.log(`  ✗ ${failure.file}: ${failure.title}`)
        })
      }
    }
  }

  sendUpdate() {
    // Send update to dashboard via IPC or file
    if (process.env.JEST_DASHBOARD) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const fs = require('fs')
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const path = require('path')
      const dashboardFile = path.join(process.cwd(), '.test-dashboard.json')
      
      try {
        fs.writeFileSync(dashboardFile, JSON.stringify(this.testResults, null, 2))
      } catch {
        // Silently fail if can't write dashboard file
      }
    }
  }
}

module.exports = DashboardReporter